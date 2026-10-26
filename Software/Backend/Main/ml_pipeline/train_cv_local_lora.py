"""Actual local QLoRA weight training. Never calls an AI API or publishes a model."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import random
import time
from pathlib import Path

os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
os.environ["WANDB_DISABLED"] = "true"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-model", type=Path, required=True)
    parser.add_argument("--dataset", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--max-steps", type=int, default=32)
    parser.add_argument("--gradient-accumulation", type=int, default=4)
    parser.add_argument("--max-length", type=int, default=1024)
    parser.add_argument("--eval-samples", type=int, default=12)
    parser.add_argument("--eval-every", type=int, default=8)
    parser.add_argument("--learning-rate", type=float, default=5e-5)
    parser.add_argument("--patience", type=int, default=2)
    parser.add_argument("--selection-task", help="Select checkpoints using only this task's validation NLL")
    parser.add_argument("--quantize-output-head", action="store_true", help="Fit the frozen large vocabulary projection in NF4 on a 6 GB GPU")
    parser.add_argument("--warm-start-adapter", type=Path, help="Continue an adapter experiment; optimizer and learning-rate schedule restart")
    parser.add_argument("--offload-frozen-embeddings", action="store_true", help="Keep frozen input embeddings in CPU RAM to avoid Windows shared GPU memory spill")
    args = parser.parse_args()
    if args.max_steps < 1 or args.gradient_accumulation < 1 or args.eval_every < 1 or args.patience < 1 or not 0 < args.learning_rate <= 1e-3 or args.eval_samples < 0:
        raise ValueError("Invalid training configuration")
    import torch
    import transformers
    import peft
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

    if not torch.cuda.is_available():
        raise RuntimeError("QLoRA requires an available local CUDA GPU; no cloud fallback is allowed")
    random.seed(42)
    torch.manual_seed(42)
    torch.cuda.manual_seed_all(42)
    args.output.mkdir(parents=True, exist_ok=False)
    manifest = json.loads((args.dataset / "manifest.json").read_text(encoding="utf-8"))
    tokenizer = AutoTokenizer.from_pretrained(args.base_model, local_files_only=True, trust_remote_code=False)
    dataset, disposition = {}, {}
    for split in ("train", "validation", "test"):
        path = args.dataset / f"{split}.jsonl"
        if hashlib.sha256(path.read_bytes()).hexdigest() != manifest["files"][split]["sha256"]:
            raise ValueError("Training split checksum mismatch")
        examples, too_long = [], 0
        for line in path.read_text(encoding="utf-8").splitlines():
            record = json.loads(line)
            prefix = tokenizer.apply_chat_template(record["messages"][:-1], tokenize=True, add_generation_prompt=True)
            completion = tokenizer.encode(record["messages"][-1]["content"] + tokenizer.eos_token, add_special_tokens=False)
            if len(prefix) + len(completion) <= args.max_length:
                examples.append({"prefix": prefix, "completion": completion, "group": record["entityGroupId"], "task": record.get("task", "cv_evidence"), "sampleId": record.get("sampleId", "")})
            else:
                too_long += 1
        if not examples: raise ValueError(f"No usable examples in {split}")
        disposition[split] = {"accepted": len(examples), "overLength": too_long, "truncated": 0}
        dataset[split] = examples
    if any(item["overLength"] for item in disposition.values()):
        raise ValueError(f"Examples exceed max-length; adjust preparation/context explicitly: {disposition}")
    groups = {name: {row["group"] for row in rows} for name, rows in dataset.items()}
    if any(groups[a] & groups[b] for a, b in (("train", "validation"), ("train", "test"), ("validation", "test"))):
        raise ValueError("CV group leakage")
    print(json.dumps({"stage": "loading-local-model", "examples": {k: len(v) for k, v in dataset.items()}, "gpu": torch.cuda.get_device_name(0)}), flush=True)
    model = AutoModelForCausalLM.from_pretrained(
        args.base_model, local_files_only=True, trust_remote_code=False,
        quantization_config=BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_use_double_quant=True, bnb_4bit_compute_dtype=torch.bfloat16),
        device_map={"": 0}, torch_dtype=torch.bfloat16, attn_implementation="sdpa",
    )
    model = prepare_model_for_kbit_training(model, use_gradient_checkpointing=True, gradient_checkpointing_kwargs={"use_reentrant": False})
    # k-bit preparation upcasts frozen embeddings/head to fp32. Keep these large
    # frozen matrices in bf16 on the 6 GB GPU; norms stay fp32 for stability.
    for name, parameter in model.named_parameters():
        if not isinstance(parameter, __import__("bitsandbytes").nn.Params4bit) and ("embed_tokens" in name or "lm_head" in name):
            parameter.data = parameter.data.to(torch.bfloat16)
    del parameter
    if args.quantize_output_head:
        from bitsandbytes.nn import Linear4bit
        head = model.get_output_embeddings()
        input_size, output_size = head.in_features, head.out_features
        weights = head.weight.detach().to(device="cpu", dtype=torch.bfloat16)
        model.set_output_embeddings(torch.nn.Identity())
        del head
        torch.cuda.empty_cache()
        quantized_head = Linear4bit(input_size, output_size, bias=False, compute_dtype=torch.bfloat16, compress_statistics=True, quant_type="nf4")
        quantized_head.load_state_dict({"weight": weights})
        quantized_head.requires_grad_(False)
        del weights
        model.set_output_embeddings(quantized_head.to("cuda"))
    if args.offload_frozen_embeddings:
        embeddings = model.get_input_embeddings()
        embeddings.to("cpu")
        embeddings.register_forward_pre_hook(lambda module, args: (args[0].to("cpu"), *args[1:]))
        embeddings.register_forward_hook(lambda module, args, output: output.to("cuda"))
        torch.cuda.empty_cache()
    model = get_peft_model(model, LoraConfig(r=4, lora_alpha=8, lora_dropout=0.05, target_modules=["q_proj", "v_proj"], bias="none", task_type="CAUSAL_LM"))
    if args.warm_start_adapter:
        from peft import set_peft_model_state_dict
        from safetensors.torch import load_file
        set_peft_model_state_dict(model, load_file(args.warm_start_adapter / "adapter_model.safetensors"))
    model.config.use_cache = False
    print(json.dumps({"stage": "model-ready", "allocatedVRAM": torch.cuda.memory_allocated(), "reservedVRAM": torch.cuda.memory_reserved(), "offloadedFrozenEmbeddings": args.offload_frozen_embeddings}), flush=True)
    parameters = [value for value in model.parameters() if value.requires_grad]
    optimizer = torch.optim.AdamW(parameters, lr=args.learning_rate, weight_decay=0.01)
    trainable_count = sum(value.numel() for value in parameters)
    history = []

    def loss(example):
        ids = example["prefix"] + example["completion"]
        inputs = torch.tensor([ids[:-1]], device="cuda")
        labels = torch.tensor(example["completion"], device="cuda")
        # Only completion logits are materialized: avoid the huge 152k-vocabulary
        # prompt logits tensor on a 6 GB GPU. Input documents are never truncated.
        with torch.autocast("cuda", dtype=torch.bfloat16):
            logits = model(input_ids=inputs, logits_to_keep=len(example["completion"]), use_cache=False).logits[0]
            return torch.nn.functional.cross_entropy(logits.float(), labels)

    def evaluate(split):
        model.eval()
        rows = dataset[split] if args.eval_samples == 0 else dataset[split][:args.eval_samples]
        values = []
        task_values = {}
        with torch.no_grad():
            for example in rows:
                value = float(loss(example).item())
                values.append(value)
                task_values.setdefault(example["task"], []).append(value)
        model.train()
        metrics = {task: sum(items) / len(items) for task, items in task_values.items()}
        if args.selection_task and args.selection_task not in metrics:
            raise ValueError("Selection task has no evaluation examples")
        return (metrics[args.selection_task] if args.selection_task else sum(values) / len(values)), metrics

    with model.disable_adapter():
        baseline_validation, baseline_validation_tasks = evaluate("validation")
    starting_validation, starting_validation_tasks = evaluate("validation")
    best, patience = float("inf"), 0
    (args.output / "run-config.json").write_text(json.dumps({**{key: str(value) if isinstance(value, Path) else value for key, value in vars(args).items()}, "baselineValidationNLL": baseline_validation, "baselineValidationTasks": baseline_validation_tasks, "startingValidationNLL": starting_validation, "startingValidationTasks": starting_validation_tasks, "dataDisposition": disposition, "optimizerRestartsOnWarmStart": True}, indent=2), encoding="utf-8")
    print(json.dumps({"stage": "baseline-evaluated", "baseValidation": baseline_validation, "startingAdapterValidation": starting_validation, "dataDisposition": disposition}), flush=True)
    data = list(dataset["train"])
    random.shuffle(data)
    started = time.time()
    optimizer.zero_grad(set_to_none=True)
    losses = []
    gradient_seen = False
    sample_ids_seen = set()
    for step in range(1, args.max_steps + 1):
        for micro in range(args.gradient_accumulation):
            index = ((step - 1) * args.gradient_accumulation + micro) % len(data)
            if index == 0 and (step > 1 or micro > 0):
                random.shuffle(data)
            sample_ids_seen.add(data[index]["sampleId"])
            value = loss(data[index])
            if not torch.isfinite(value): raise RuntimeError("Non-finite loss; candidate was not promoted")
            losses.append(value.item())
            (value / args.gradient_accumulation).backward()
        norm = float(torch.nn.utils.clip_grad_norm_(parameters, 1.0))
        gradient_seen = gradient_seen or norm > 0
        optimizer.step()
        optimizer.zero_grad(set_to_none=True)
        for group in optimizer.param_groups:
            group["lr"] = args.learning_rate * min(1, step / 3) * max(0.1, 1 - step / args.max_steps)
        record = {"step": step, "trainLoss": sum(losses) / len(losses), "gradientNorm": norm, "seconds": round(time.time() - started, 1)}
        losses.clear()
        if step % args.eval_every == 0 or step == args.max_steps:
            record["validationLoss"], record["validationTasks"] = evaluate("validation")
            if record["validationLoss"] < best - 0.001:
                best, patience = record["validationLoss"], 0
                model.save_pretrained(args.output / "best-adapter", safe_serialization=True)
                tokenizer.save_pretrained(args.output / "best-adapter")
                (args.output / "checkpoint.json").write_text(json.dumps({"step": step, "validationNLL": best, "testOpened": False, "automaticPromotionAllowed": False}, indent=2), encoding="utf-8")
            else:
                patience += 1
        history.append(record)
        (args.output / "learning-curve.json").write_text(json.dumps(history, indent=2), encoding="utf-8")
        print(json.dumps(record), flush=True)
        if patience >= args.patience:
            break
    if not gradient_seen: raise RuntimeError("No nonzero adapter gradient was observed")
    # Reload the checkpoint chosen using validation only, before opening the test.
    from peft import set_peft_model_state_dict
    from safetensors.torch import load_file
    set_peft_model_state_dict(model, load_file(args.output / "best-adapter/adapter_model.safetensors"))
    with model.disable_adapter():
        baseline_test, baseline_test_tasks = evaluate("test")
    candidate_test, candidate_test_tasks = evaluate("test")
    starting_test, starting_test_tasks = None, None
    if args.warm_start_adapter:
        set_peft_model_state_dict(model, load_file(args.warm_start_adapter / "adapter_model.safetensors"))
        starting_test, starting_test_tasks = evaluate("test")
    artifact = args.output / "best-adapter/adapter_model.safetensors"
    report = {
        "kind": "actual-local-QLoRA-weight-training", "baseRevision": "c03e6d358207e414f1eca0bb1891e29f1db0e242",
        "trainableParameters": trainable_count, "steps": history[-1]["step"], "gradientObserved": gradient_seen,
        "baselineValidationNLL": baseline_validation, "bestValidationNLL": best,
        "baselineTestNLL": baseline_test, "candidateTestNLL": candidate_test,
        "startingAdapterValidationNLL": starting_validation,
        "startingAdapterTestNLL": starting_test,
        "baselineTestTasks": baseline_test_tasks, "candidateTestTasks": candidate_test_tasks,
        "startingAdapterTestTasks": starting_test_tasks,
        "selectionTask": args.selection_task, "dataDisposition": disposition,
        "testUsedForCheckpointSelection": False, "groupLeakageCount": 0,
        "adapterSha256": hashlib.sha256(artifact.read_bytes()).hexdigest(),
        "trainingDevice": torch.cuda.get_device_name(0), "maxAllocatedVRAM": torch.cuda.max_memory_allocated(),
        "versions": {"torch": torch.__version__, "transformers": transformers.__version__, "peft": peft.__version__},
        "datasetManifest": manifest, "humanReviewedScoringAccuracyEstablished": False,
        "automaticPromotionAllowed": False, "seconds": time.time() - started,
        "frozenOutputProjectionQuantized": args.quantize_output_head,
        "warmStartAdapter": str(args.warm_start_adapter) if args.warm_start_adapter else None,
        "evaluationExampleCounts": {split: len(dataset[split]) if args.eval_samples == 0 else min(args.eval_samples, len(dataset[split])) for split in ("validation", "test")},
        "trainingExamplesPresented": history[-1]["step"] * args.gradient_accumulation,
        "uniqueTrainingExamplesPresented": len(sample_ids_seen),
        "effectiveEpochs": history[-1]["step"] * args.gradient_accumulation / len(data),
    }
    (args.output / "training-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report), flush=True)


if __name__ == "__main__":
    main()
