"""Build the five service identities from editable vector geometry.

Requires fonttools and Playwright. AI Match and CV Match stay unchanged.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import zipfile
from dataclasses import dataclass
from html import escape
from pathlib import Path
from xml.etree import ElementTree

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from playwright.sync_api import sync_playwright


@dataclass(frozen=True)
class Identity:
    slug: str
    name: str
    purpose: str
    motif: str
    description: str
    accent: str
    bright: str
    dark_accent: str
    shapes: tuple[tuple[str, str], ...]


IDENTITIES = (
    Identity("career-match", "Career Match", "Định hướng nghề nghiệp", "La bàn gấp nếp", "Bốn hướng mở, một tâm điểm lựa chọn.", "#087f73", "#1aab99", "#55d5bd", (
        ("M100 16 100 82 74 68Z", "blue"),
        ("M100 16 126 68 100 82Z", "accent"),
        ("M184 100 118 100 132 74Z", "bright"),
        ("M184 100 132 126 118 100Z", "ink"),
        ("M100 184 100 118 126 132Z", "fold"),
        ("M100 184 74 132 100 118Z", "blue"),
        ("M16 100 82 100 68 126Z", "ink"),
        ("M16 100 68 74 82 100Z", "accent"),
    )),
    Identity("insight-match", "Insight Match", "Trợ lý AI & nghiên cứu", "Lăng kính thấu hiểu", "Các mặt gấp hội tụ quanh một góc nhìn rõ ràng.", "#7251b5", "#9b79d6", "#c2a6ff", (
        ("M18 100 60 42H100L78 68 52 100Z", "blue"),
        ("M100 42H140L182 100H148L122 68H78Z", "accent"),
        ("M18 100H52L78 132H122L148 100H182L140 158H60Z", "ink"),
        ("M122 132 148 100H182L140 158H100Z", "fold"),
        ("M100 78 122 100 100 122 78 100Z", "accent"),
        ("M100 78 122 100H100Z", "bright"),
    )),
    Identity("interview-match", "Interview Match", "Câu hỏi & lịch phỏng vấn", "Đối thoại hai chiều", "Hai dải hội thoại đan nhau, mở ra trao đổi và phản hồi.", "#af6710", "#d89738", "#ffd08d", (
        ("M20 28H118L142 52V106H78L44 140V106H20Z M48 56V78H114V56Z", "blue"),
        ("M118 28 142 52H118Z", "fold"),
        ("M86 84H162L180 102V156H154V182L126 156H86Z M114 112V128H152V112Z", "accent"),
        ("M162 84 180 102H162Z", "bright"),
        ("M126 156H154V182Z", "ink"),
    )),
    Identity("salary-match", "Salary Match", "Tham khảo & so sánh mức lương", "Dải tăng trưởng", "Nhịp bậc thang và dải gấp đi lên biểu đạt các mức giá trị.", "#087e9c", "#17a8c5", "#62d8ef", (
        ("M20 132 48 116V180H20Z", "blue"),
        ("M76 104 104 88V180H76Z", "accent"),
        ("M132 76 160 60V180H132Z", "ink"),
        ("M20 92 130 28V16H180V66H154V52L36 120Z", "accent"),
        ("M130 16H180L154 42H130Z", "blue"),
        ("M154 42 180 16V66H154Z", "bright"),
    )),
    Identity("talent-match", "Talent Match", "Quản lý tuyển dụng", "Kết nối đội ngũ", "Ba điểm đại diện con người được nối bằng dải gấp hình M.", "#3f5eab", "#6d89cf", "#a9c0ff", (
        ("M100 16 122 38 100 60 78 38Z", "blue"),
        ("M100 16 122 38 100 60Z", "fold"),
        ("M52 38 70 56 52 74 34 56Z", "accent"),
        ("M148 38 166 56 148 74 130 56Z", "ink"),
        ("M20 122 42 84H66L100 134 84 170 54 122 42 142Z", "blue"),
        ("M180 122 158 84H134L100 134 84 170H116L146 122 158 142Z", "accent"),
        ("M100 134 116 170H84Z", "ink"),
        ("M84 78H116L100 108Z", "fold"),
    )),
)


def mark_content(identity: Identity, mode: str = "light") -> str:
    palette = {"blue": "#085dc5", "fold": "#353389", "ink": "#211e55", "accent": identity.accent, "bright": identity.bright}
    if mode == "dark":
        palette.update(blue="#6ba7ff", fold="#8a94eb", ink="#c4ccff", accent=identity.dark_accent, bright="#e2e9ff")
    if mode == "mono":
        palette = dict.fromkeys(palette, "#211e55")
    return "".join(f'<path d="{path}" fill="{palette[color]}" fill-rule="evenodd"/>' for path, color in identity.shapes)


def svg(content: str, width: int, height: int, title: str) -> str:
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{escape(title, quote=True)}"><title>{escape(title)}</title>{content}</svg>\n'


def outlined_text(text: str, font: TTFont, x: float, baseline: float, size: float, color: str) -> str:
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    units = font["head"].unitsPerEm
    factor = size / units
    result = []
    previous = None
    kerning = font["kern"].kernTables[0].kernTable if "kern" in font else {}
    for letter in text:
        name = cmap[ord(letter)]
        if previous is not None:
            x += kerning.get((previous, name), 0) * factor
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        if pen.getCommands():
            result.append(f'<path d="{pen.getCommands()}" fill="{color}" transform="translate({x:.4f} {baseline}) scale({factor:.7f} {-factor:.7f})"/>')
        x += font["hmtx"].metrics[name][0] * factor
        previous = name
    return "".join(result)


def original_content(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    return text[text.index("<g "):text.rindex("</svg>")]


def build_board(base: Path, font: TTFont) -> str:
    content = ['<rect width="1600" height="1240" fill="#f3f5fa"/>', '<rect x="36" y="36" width="1528" height="1168" rx="28" fill="white"/>']
    content.append(outlined_text("AI Match", font, 82, 119, 45, "#211e55"))
    content.append('<text x="82" y="160" font-family="Arial,sans-serif" font-size="19" fill="#617087">Năm dịch vụ. Năm dấu ấn. Cùng ngôn ngữ hình học CV Match.</text><path d="M82 194H1518" stroke="#e3e8f0"/>')
    cards = [("CV Match", "Logo gốc · giữ nguyên", "Dải gấp là nguồn cảm hứng chung.", original_content(base / "cv-match-mark.svg")), *[(item.name, item.motif, item.description, mark_content(item)) for item in IDENTITIES]]
    for index, (name, motif, description, mark) in enumerate(cards):
        x = 70 + (index % 3) * 490
        y = 226 + (index // 3) * 452
        fill = "#f5f7fb" if index == 0 else "#ffffff"
        content.append(f'<rect x="{x}" y="{y}" width="470" height="424" rx="16" fill="{fill}" stroke="#e0e6ee"/>')
        content.append(f'<g transform="translate({x + 139} {y + 26}) scale(.96)">{mark}</g>')
        content.append(outlined_text(name, font, x + 30, y + 269, 30, "#211e55"))
        content.append(f'<text x="{x + 30}" y="{y + 305}" font-family="Arial,sans-serif" font-size="16" fill="#42516a">{escape(motif)}</text>')
        words = description.split()
        lines: list[str] = []
        line = ""
        for word in words:
            if len(line + " " + word) > 47:
                lines.append(line)
                line = word
            else:
                line = (line + " " + word).strip()
        lines.append(line)
        for row, phrase in enumerate(lines):
            content.append(f'<text x="{x + 30}" y="{y + 341 + row * 23}" font-family="Arial,sans-serif" font-size="15" fill="#66768b">{escape(phrase)}</text>')
        if index:
            identity = IDENTITIES[index - 1]
            for swatch, color in enumerate(("#085dc5", "#211e55", identity.accent)):
                content.append(f'<rect x="{x + 30 + swatch * 35}" y="{y + 391}" width="27" height="4" rx="2" fill="{color}"/>')
    content.append('<text x="82" y="1170" font-family="Arial,sans-serif" font-size="14" fill="#66768b">SVG vector · PNG trong suốt · Bản nền sáng / nền tối · Tên thương hiệu chuyển thành đường vector</text>')
    return svg("".join(content), 1600, 1240, "Bộ logo dịch vụ AI Match lấy cảm hứng từ CV Match")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browser", type=Path, default=Path(os.environ["LOCALAPPDATA"]) / "ms-playwright/chromium-1243/chrome-win64/chrome.exe")
    parser.add_argument("--font", type=Path, default=Path("C:/Windows/Fonts/arialbd.ttf"))
    args = parser.parse_args()
    desktop = Path(__file__).resolve().parents[1]
    base = desktop / "public/brand/ai-match-suite"
    target = base / "services-v2"
    target.mkdir(exist_ok=True)
    protected = [path for path in base.iterdir() if path.suffix in {".svg", ".png"} and path.name.startswith(("cv-match-", "ai-match-"))]
    before = {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in protected}
    font = TTFont(args.font)
    for identity in IDENTITIES:
        for suffix, mode in (("mark", "light"), ("mark-dark", "dark"), ("mark-mono", "mono")):
            (target / f"{identity.slug}-{suffix}.svg").write_text(svg(mark_content(identity, mode), 200, 200, identity.name), encoding="utf-8")
        for suffix, mode, text_color in (("logo", "light", "#211e55"), ("logo-dark", "dark", "#ffffff")):
            content = f'<g transform="scale(.56)">{mark_content(identity, mode)}</g>' + outlined_text(identity.name, font, 126, 65, 35, text_color)
            (target / f"{identity.slug}-{suffix}.svg").write_text(svg(content, 440, 112, identity.name), encoding="utf-8")
    (target / "service-brand-board.svg").write_text(build_board(base, font), encoding="utf-8")
    palette = [{"name":item.name,"slug":item.slug,"motif":item.motif,"accent":item.accent,"darkAccent":item.dark_accent,"core":{"cobalt":"#085dc5","fold":"#353389","indigo":"#211e55"}} for item in IDENTITIES]
    (target / "palette.json").write_text(json.dumps(palette,ensure_ascii=False,indent=2), encoding="utf-8")
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=str(args.browser))
        page = browser.new_page(viewport={"width": 1700, "height": 1300}, device_scale_factor=1)
        for path in sorted(target.glob("*.svg")):
            root = ElementTree.fromstring(path.read_text(encoding="utf-8"))
            width, height = int(root.attrib["width"]), int(root.attrib["height"])
            factor = 1 if path.stem == "service-brand-board" else (5.12 if width == 200 else 3)
            content = path.read_text(encoding="utf-8")
            page.set_viewport_size({"width":round(width * factor),"height":round(height * factor)})
            page.set_content(f'<html><body style="margin:0;background:transparent">{content}<style>body>svg{{display:block;width:100vw;height:100vh}}</style></body></html>')
            page.screenshot(path=str(path.with_suffix(".png")), omit_background=True)
        browser.close()
    for name, expected in before.items():
        if hashlib.sha256((base / name).read_bytes()).hexdigest() != expected:
            raise RuntimeError("A protected AI Match/CV Match asset changed.")
    (target / "preserved-originals.sha256.json").write_text(json.dumps(before,indent=2),encoding="utf-8")
    archive = target / "ai-match-services-v2.zip"
    with zipfile.ZipFile(archive,"w",zipfile.ZIP_DEFLATED) as bundle:
        for path in sorted(target.iterdir()):
            if path.suffix in {".svg", ".png", ".md", ".json"}:
                bundle.write(path,path.name)
        for path in protected:
            bundle.write(path,"unchanged-originals/" + path.name)
    print(json.dumps({"output":str(target),"services":len(IDENTITIES),"originalAssetsPreserved":len(before),"archive":str(archive)},ensure_ascii=False))


if __name__ == "__main__":
    main()
