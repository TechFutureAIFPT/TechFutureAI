"""Create grounded weak-supervision examples from a pinned CC0 resume snapshot.

These labels teach evidence extraction/JSON, not validated hiring suitability.
Every derivative of one source CV stays in one split. No cloud inference is used.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
import re
from pathlib import Path

import pandas as pd

from supporthr_ml.contracts import sha256_file
from supporthr_ml.dedupe import assign_near_duplicate_groups, content_hash
from supporthr_ml.privacy import redact_pii

SOURCE_SHA = "816a7cd985a9a41e3ce8d1e83cb7e1beb1e854a89c1cf1fd0d75494faaa0559d"
SOURCE_REVISION = "ed4cb5f3fd1ce7e0a0e74e1a09c1a3b702c2c2eb"
SKILLS = ["Python", "Java", "JavaScript", "SQL", "Excel", "Salesforce", "accounting", "recruitment", "payroll", "customer service", "project management", "AutoCAD", "marketing", "budgeting", "financial analysis", "patient care", "teaching", "inventory", "quality assurance", "leadership"]
ACTION = re.compile(r"\b(?:developed|implemented|managed|built|created|designed|prepared|delivered|led|analyzed|trained|maintained|coordinated|performed)\b", re.I)


def system_prompt() -> str:
    import ast
    source = Path(__file__).parent.parent / "api_server/app/services/cv_specialist_service.py"
    for node in ast.parse(source.read_text(encoding="utf-8")).body:
        if isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id == "SYSTEM_PROMPT" for target in node.targets):
            return ast.literal_eval(node.value)
    raise ValueError("CV specialist system prompt not found")


def prepare(csv_path: Path, output: Path, max_groups: int = 512) -> dict:
    if sha256_file(csv_path) != SOURCE_SHA:
        raise ValueError("SFT source does not match the pinned public snapshot")
    frame = pd.read_csv(csv_path, usecols=["Resume_str", "Category"], encoding="utf-8")
    records = []
    seen = set()
    for row in frame.itertuples():
        clean = redact_pii(str(row.Resume_str)).text
        key = content_hash(clean)
        if key in seen: continue
        seen.add(key)
        records.append({"documentId": key, "cleanText": clean, "label": str(row.Category)})
    groups, near_pairs = assign_near_duplicate_groups(records)
    random.Random(42).shuffle(records)
    chosen = []
    used_groups = set()
    for record in records:
        group = groups[record["documentId"]]
        if group in used_groups: continue
        fragments = re.split(r"(?<=[.;!?])\s+|\n+", record["cleanText"])
        matches = [(skill, fragment.strip()) for fragment in fragments if 20 <= len(fragment.strip()) <= 340 for skill in SKILLS if re.search(r"(?<!\w)" + re.escape(skill) + r"(?!\w)", fragment, re.I)]
        if not matches: continue
        skill, quote = matches[int(record["documentId"][:8], 16) % len(matches)]
        if re.search(r"\b(?:no|not|never|without)\b", quote, re.I): continue
        if redact_pii(quote).remaining_types: continue
        used_groups.add(group)
        chosen.append((record, group, skill, quote))
        if len(chosen) >= max_groups: break
    if len(chosen) < 100:
        raise ValueError("Too few independent grounded examples")
    # Split groups before constructing instruction variants, then never move them.
    chosen.sort(key=lambda item: hashlib.sha256(("locked-sft-v1:" + item[1]).encode()).hexdigest())
    counts = {"train": 0, "validation": 0, "test": 0}
    split_groups = {name: set() for name in counts}
    output.mkdir(parents=True, exist_ok=True)
    handles = {name: (output / f"{name}.jsonl").open("w", encoding="utf-8") for name in counts}
    try:
        for index, (record, group, skill, quote) in enumerate(chosen):
            split = "train" if index < len(chosen) * 0.8 else "validation" if index < len(chosen) * 0.9 else "test"
            split_groups[split].add(group)
            missing_skill = next(value for value in SKILLS if not re.search(re.escape(value), quote, re.I))
            for negative in (False, True):
                required = missing_skill if negative else skill
                applied = bool(ACTION.search(quote))
                level = 0 if negative else 4 if applied else 1
                criteria = [{"id": "c0", "key": "evidence", "name": f"Bằng chứng về {required}", "weight": 100.0, "description": f"Chỉ đối chiếu kỹ năng {required} trong phần CV được cung cấp; không suy diễn từ chức danh.", "children": []}]
                request = {"jd": f"Yêu cầu bằng chứng kỹ năng {required}. Nếu có hoạt động thực tế dùng kỹ năng này thì ghi nhận; chỉ liệt kê tên kỹ năng là bằng chứng yếu.", "rubric": criteria, "hard_filters": {}, "cv": quote}
                response = {"candidate_name": "", "criteria": [{"id": "c0", "level": level, "evidence": [] if negative else [quote], "missing": [f"Chưa có bằng chứng về {required}."] if negative else [], "reason": "Không có dẫn chứng trực tiếp cho yêu cầu." if negative else "Có mô tả hoạt động sử dụng kỹ năng trong phần CV." if applied else "Kỹ năng được nhắc đến; chưa đủ bằng chứng ứng dụng."}], "filters": []}
                example = {
                    "sampleId": f"{record['documentId']}:{required}:{int(negative)}",
                    "entityGroupId": group, "industry": record["label"],
                    "annotationMethod": "rule-grounded-weak-supervision-v1", "humanReviewed": False,
                    "messages": [
                        {"role": "system", "content": system_prompt()},
                        {"role": "user", "content": json.dumps(request, ensure_ascii=False).replace("<|", "\\u003c|")},
                        {"role": "assistant", "content": json.dumps(response, ensure_ascii=False, separators=(",", ":"))},
                    ],
                }
                handles[split].write(json.dumps(example, ensure_ascii=False) + "\n")
                counts[split] += 1
    finally:
        for handle in handles.values(): handle.close()
    if any(split_groups[a] & split_groups[b] for a, b in (("train", "validation"), ("train", "test"), ("validation", "test"))):
        raise RuntimeError("Source CV groups leaked across splits")
    manifest = {
        "source": "opensporks/resumes", "revision": SOURCE_REVISION, "sourceSha256": SOURCE_SHA,
        "license": "CC0-1.0", "intendedUse": "local-cv-evidence-format-SFT-experiment",
        "annotationMethod": "rule-grounded-weak-supervision-v1", "humanReviewed": False,
        "scoringGroundTruth": False, "automaticPromotionAllowed": False,
        "counts": counts, "independentGroups": {name: len(value) for name, value in split_groups.items()},
        "nearDuplicatePairs": near_pairs, "groupLeakageCount": 0,
        "files": {name: {"sha256": sha256_file(output / f"{name}.jsonl")} for name in counts},
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset-csv", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--max-groups", type=int, default=512)
    args = parser.parse_args()
    print(json.dumps(prepare(args.dataset_csv, args.output, args.max_groups), ensure_ascii=False), flush=True)
