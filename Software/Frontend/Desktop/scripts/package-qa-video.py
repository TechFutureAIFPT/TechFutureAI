"""Package recorded QA cases into an MP4 with visible results and chapters."""
from __future__ import annotations

import argparse
import json
import subprocess
import textwrap
from collections import Counter
from pathlib import Path

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", type=Path)
    parser.add_argument("--reuse-clips", action="store_true", help="Reuse clips only when their source recordings are unchanged.")
    args = parser.parse_args()
    root = args.folder.resolve()
    work = root / "packaging"
    work.mkdir(exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    latest = {}
    original = json.loads((root / "results.json").read_text(encoding="utf-8"))["cases"]
    folders = [root, root / "retest", root / "career-retest", root / "career-final", root / "history-final", root / "cv-final"]
    for folder in folders:
        path = folder / "results.json"
        if not path.exists(): continue
        report = json.loads(path.read_text(encoding="utf-8"))
        offset = report["cases"][0]["startSeconds"]
        for case in report["cases"]:
            if case["status"] == "FAIL" and case["title"] in latest: continue
            latest[case["title"]] = {**case, "source": str(folder / "AI-Match-kiem-thu.webm"), "recordOffset": offset}
    selected = [latest[case["title"]] for case in original]
    counts = Counter(case["status"] for case in selected)
    font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 17)
    bold = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 19)
    labels = {"PASS": "ĐẠT", "PARTIAL": "MỘT PHẦN", "FAIL": "LỖI"}

    def execute(arguments, reuse=False):
        if reuse and args.reuse_clips and Path(arguments[-1]).is_file(): return
        result = subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", *arguments], capture_output=True, text=True, encoding="utf-8")
        if result.returncode: raise RuntimeError(result.stderr[-1800:])

    def caption(path, title, detail, status="PASS"):
        image = Image.new("RGB", (1440, 76), "#10273f")
        draw = ImageDraw.Draw(image)
        draw.rectangle((0,0,8,76), fill={"PASS":"#24c79d","PARTIAL":"#ffc86b","FAIL":"#ff8888"}[status])
        draw.text((22,8), title, font=bold, fill="white")
        draw.text((22,39), textwrap.shorten(detail, width=164, placeholder="…"), font=font, fill="#dfebf6")
        image.save(path)

    def card(path, heading, lines):
        image = Image.new("RGB", (1440,900), "#10273f")
        draw = ImageDraw.Draw(image)
        draw.rectangle((76,105,148,112),fill="#23c39b")
        draw.text((76,155), "AI Match",font=ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf",66),fill="white")
        draw.text((76,270),heading,font=ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf",38),fill="#9ed9ff")
        y=365
        for line in lines:
            draw.text((76,y),line,font=ImageFont.truetype("C:/Windows/Fonts/arial.ttf",25),fill="#dfebf6")
            y+=57
        image.save(path)

    clips = []
    intro = work / "intro.png"
    card(intro,"Kiểm thử chức năng · 21/10/2026",[
        "27 kịch bản trên web · Tài khoản Firebase QA riêng · Hồ sơ tổng hợp",
        "Thao tác thật, API thật. Chỉ giả lập lỗi mạng ở ca kiểm thử lỗi.",
        "Kết quả từng ca được ghi trực tiếp trong video và báo cáo.",
        "Các đoạn dài được tăng tốc 4×, có nhãn và lưu thời gian thực.",
        "Video không có thuyết minh âm thanh."])
    root.joinpath("poster.png").write_bytes(intro.read_bytes())
    intro_clip = work / "000.mp4"
    execute(["-loop","1","-i",str(intro),"-t","6","-vf","fps=15,format=yuv420p","-c:v","libx264","-preset","ultrafast","-crf","24","-threads","2",str(intro_clip)])
    clips.append(intro_clip)
    chapters = [{"title":"Giới thiệu & phạm vi", "start":0, "end":6}]
    timeline = 6.0
    for index, case in enumerate(selected,1):
        start = max(0, case["startSeconds"] - case["recordOffset"])
        duration = case["endSeconds"] - case["startSeconds"]
        case["realDurationSeconds"] = round(duration,2)
        parts = [(start,duration,1)] if duration <= 45 else [(start,10,1),(start+10,duration-22,4),(start+duration-12,12,1)]
        begin=timeline
        for part_index,(position,length,speed) in enumerate(parts):
            overlay=work/f"caption-{index:02}-{part_index}.png"
            detail = case["detail"] if speed==1 else f"Đoạn dài tăng tốc 4×. Thời gian thực toàn ca: {duration:.1f} giây."
            caption(overlay,f"{index:02}/27 · {case['title']} · {labels[case['status']]}",detail,case["status"])
            output=work/f"{index:03}-{part_index}.mp4"
            execute(["-ss",str(round(position,3)),"-t",str(round(length,3)),"-i",case["source"],"-i",str(overlay),"-filter_complex",f"[0:v]setpts=(PTS-STARTPTS)/{speed},fps=15[v];[v][1:v]overlay=0:H-h,format=yuv420p[out]","-map","[out]","-an","-c:v","libx264","-preset","ultrafast","-crf","24","-threads","2",str(output)],reuse=True)
            clips.append(output)
            timeline+=length/speed
        case["videoStartSeconds"]=round(begin,2)
        case["videoEndSeconds"]=round(timeline,2)
        chapters.append({"title":case["title"],"start":begin,"end":timeline})
        print(json.dumps({"packaged":index,"title":case["title"]},ensure_ascii=False),flush=True)
    outro=work/"outro.png"
    card(outro,"Kết quả theo phạm vi từng kịch bản",[
        f"{counts['PASS']} ca đạt điều kiện kiểm tra · {counts['PARTIAL']} ca chưa kiểm thử trọn vẹn",
        "CV Match local, OCR, đăng nhập và xuất dữ liệu đã được kiểm tra.",
        "Các tích hợp chưa đầy đủ và hạn chế lưu dữ liệu được nêu trong báo cáo.",
        "Giao diện điện thoại trong video là web responsive; chưa kiểm thử app Expo.",
        "Xem BAO-CAO-KIEM-THU.md để biết kết quả, bằng chứng và mốc thời gian."])
    outro_clip=work/"999.mp4"
    execute(["-loop","1","-i",str(outro),"-t","6","-vf","fps=15,format=yuv420p","-c:v","libx264","-preset","ultrafast","-crf","24","-threads","2",str(outro_clip)])
    clips.append(outro_clip)
    chapters.append({"title":"Kết quả & giới hạn", "start":timeline, "end":timeline+6})
    concat=work/"concat.txt"
    concat.write_text("\n".join("file '"+str(path).replace("\\","/")+"'" for path in clips),encoding="utf-8")
    execute(["-f","concat","-safe","0","-i",str(concat),"-c","copy",str(work/"combined.mp4")])
    metadata=work/"chapters.txt"
    metadata.write_text(";FFMETADATA1\ntitle=AI Match - Kiem thu chuc nang 21-10-2026\n"+"".join(f"[CHAPTER]\nTIMEBASE=1/1000\nSTART={round(c['start']*1000)}\nEND={round(c['end']*1000)}\ntitle={c['title']}\n" for c in chapters),encoding="utf-8")
    target=root/"AI-Match-kiem-thu-chuc-nang.mp4"
    execute(["-i",str(work/"combined.mp4"),"-i",str(metadata),"-map_metadata","1","-c","copy","-movflags","+faststart",str(target)])
    summary={"selectedCases":selected,"counts":dict(counts),"chapters":chapters,"video":str(target)}
    (root/"final-results.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({"video":str(target),"counts":dict(counts),"estimatedDurationSeconds":round(timeline+6,2)},ensure_ascii=False),flush=True)


if __name__=="__main__":main()
