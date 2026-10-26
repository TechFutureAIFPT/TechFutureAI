"""Record the real AI Match web UI with a dedicated Firebase QA account.

Dependencies: playwright, Pillow, reportlab. Credentials must stay outside Git.
No successful API responses are mocked. Fault injection only simulates errors.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import time
from pathlib import Path
from urllib.parse import urlsplit

from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import TimeoutError, sync_playwright
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


class Partial(Exception):
    pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:3000")
    parser.add_argument("--credentials", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--only", help="Comma-separated case numbers for a recorded follow-up; login is included.")
    args = parser.parse_args()
    out = args.output.resolve()
    for name in ("screenshots", "downloads", "samples", "raw"):
        (out / name).mkdir(parents=True, exist_ok=True)
    creds = json.loads(args.credentials.read_text(encoding="utf-8"))
    samples = out / "samples"
    jd = """QA TEST - Backend Python Developer
Responsibilities:
- Build REST APIs using Python 3, FastAPI and Pydantic.
- Design PostgreSQL schemas and optimize SQL queries.
- Implement authentication, Redis caching and background jobs.
- Write pytest tests, Docker deployment and CI/CD pipelines.
Requirements:
- At least 3 years of backend software development experience.
- Python, FastAPI, PostgreSQL, Redis, Docker and automated testing.
- Bachelor's degree in Computer Science or equivalent practical experience.
- Work location: Ho Chi Minh City, hybrid. English B2 for technical communication.
This job description is synthetic data for software quality assurance.
"""
    cv = """QA ALEX NGUYEN - SYNTHETIC TEST PROFILE
Email: qa.alex@example.test
Location: Ho Chi Minh City, Vietnam
Target role: Backend Python Developer
Professional experience:
Backend Engineer, QA Example Software, Jan 2022 - Sep 2026 (4 years 9 months).
Designed 15 REST APIs using Python, FastAPI and Pydantic for a recruitment demo.
Optimized PostgreSQL queries, reducing p95 API latency from 650ms to 210ms.
Implemented Redis caching and background jobs processing 10,000 sample documents daily.
Wrote 180 pytest unit and integration tests; achieved 86 percent test coverage.
Containerized services with Docker and configured GitHub Actions CI/CD.
Implemented OAuth2, JWT validation, input validation and role based permissions.
Collaborated with 5 engineers using code reviews, technical documentation and Scrum.
Education: Bachelor of Computer Science, QA Example University, 2018-2022.
Languages: English B2, Vietnamese native.
Skills: Python, FastAPI, Pydantic, SQL, PostgreSQL, Redis, Docker, pytest, Git.
All names, employers, metrics and contact details are fictional QA data.
"""
    junior = """QA MINH TRAN - SYNTHETIC TEST PROFILE
Email: qa.minh@example.test
Location: Hanoi, Vietnam
Target role: Junior software developer
Experience: Software Intern at QA Example Lab, Jun 2026 - Sep 2026 (4 months).
Built a small HTML/CSS/JavaScript website and a Python command line utility.
Wrote basic SQLite queries and 8 simple unit tests for a school project.
No professional FastAPI, PostgreSQL, Redis or Docker deployment experience.
Education: Computer Science student, expected graduation 2027.
English: B1. Interested in learning backend development.
All information is fictional test data.
"""
    (samples / "JD-QA-Backend.txt").write_text(jd, encoding="utf-8")
    (samples / "CV-QA-Junior.txt").write_text(junior, encoding="utf-8")
    pdfmetrics.registerFont(TTFont("QAArial", "C:/Windows/Fonts/arial.ttf"))
    document = canvas.Canvas(str(samples / "CV-QA-Backend.pdf"))
    document.setFont("QAArial", 11)
    text = document.beginText(42, 795)
    for line in cv.splitlines():
        for start in range(0, max(1, len(line)), 96):
            text.textLine(line[start:start + 96])
    document.drawText(text)
    document.save()
    image = Image.new("RGB", (1240, 1754), "white")
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 23)
    y = 65
    for line in cv.splitlines():
        for start in range(0, max(1, len(line)), 88):
            draw.text((55, y), line[start:start + 88], font=font, fill="#172b46")
            y += 33
    image.save(samples / "CV-QA-Scanned.png")
    (samples / "CV-QA-Invalid.pdf").write_text("This is not a valid PDF.", encoding="utf-8")
    results = []
    network = []
    errors = []
    started = time.monotonic()
    active_title = "AI Match · Kiểm thử phần mềm · Dữ liệu mẫu"

    with sync_playwright() as p:
        chrome = Path(os.environ["LOCALAPPDATA"]) / "ms-playwright/chromium-1243/chrome-win64/chrome.exe"
        browser = p.chromium.launch(headless=True, executable_path=str(chrome), slow_mo=150)
        context = browser.new_context(viewport={"width": 1440, "height": 900}, record_video_dir=str(out / "raw"), record_video_size={"width": 1440, "height": 900}, accept_downloads=True, permissions=["clipboard-read", "clipboard-write"])
        page = context.new_page()
        page.set_default_timeout(15000)
        page.on("pageerror", lambda error: errors.append(str(error)[:400]))
        page.on("response", lambda response: network.append({"time": round(time.monotonic() - started, 2), "method": response.request.method, "host": urlsplit(response.url).netloc, "path": urlsplit(response.url).path, "status": response.status}) if "/api/" in response.url or "identitytoolkit" in response.url else None)
        page.on("download", lambda download: download.save_as(str(out / "downloads" / download.suggested_filename)))

        def caption(text):
            nonlocal active_title
            active_title = text
            page.evaluate("""text => {let el=document.getElementById('qa-caption');if(!el){el=document.createElement('div');el.id='qa-caption';el.style='position:fixed;bottom:12px;left:12px;right:12px;z-index:2147483647;background:#10273fee;color:white;border:1px solid #779bb8;border-radius:10px;padding:12px 18px;font:600 15px Arial;pointer-events:none;box-shadow:0 4px 20px #0003';document.body.appendChild(el)}el.textContent=text;}""", text)

        def navigate(route):
            response = page.goto(args.base_url + route, wait_until="domcontentloaded", timeout=90000)
            try:
                page.wait_for_load_state("networkidle", timeout=6000)
            except TimeoutError:
                pass
            page.wait_for_timeout(600)
            assert response is not None and response.status == 200, f"HTTP page status: {response.status if response else None}"
            caption(active_title)

        def click(name, exact=True):
            locator = page.get_by_role("button", name=name, exact=exact).first
            locator.scroll_into_view_if_needed()
            locator.click()
            page.wait_for_timeout(600)

        def select_option(index, option_index=0):
            page.get_by_role("combobox").nth(index).click()
            page.get_by_role("option").nth(option_index).click()
            page.wait_for_timeout(500)

        def close_dialog():
            page.keyboard.press("Escape")
            page.wait_for_timeout(400)

        def download(name):
            with page.expect_download(timeout=20000):
                click(name)

        def run(title, action):
            index = len(results) + 1
            entry = {"id": index, "title": title, "startSeconds": round(time.monotonic() - started, 2)}
            print(json.dumps({"started": index, "title": title}, ensure_ascii=False), flush=True)
            try:
                if page.url != "about:blank": caption(f"{index:02} · {title} · ĐANG KIỂM TRA")
                detail = action() or "Thao tác và điều kiện kiểm tra đạt."
                entry.update(status="PASS", detail=detail)
            except Partial as error:
                entry.update(status="PARTIAL", detail=str(error))
            except Exception as error:
                entry.update(status="FAIL", detail=str(error)[:800])
            caption(f"{index:02} · {title} · {entry['status']} — {entry['detail'][:170]}")
            page.wait_for_timeout(1800)
            page.screenshot(path=str(out / "screenshots" / f"{index:02}.png"))
            entry["endSeconds"] = round(time.monotonic() - started, 2)
            results.append(entry)
            (out / "results.json").write_text(json.dumps({"cases": results, "network": network, "browserErrors": errors}, ensure_ascii=False, indent=2), encoding="utf-8")
            print(json.dumps(entry, ensure_ascii=False), flush=True)
            if page.get_by_role("dialog").count(): close_dialog()

        def landing():
            navigate("/")
            assert page.get_by_role("heading", name=re.compile("Một nền tảng\. Hai lối đi\.")).is_visible()
            for position in (650, 700, 1100, 1500):
                page.mouse.wheel(0, position)
                page.wait_for_timeout(1000)
            page.keyboard.press("Home")
            return "Landing SaaS và nội dung giới thiệu theo thiết kế cũ hiển thị."

        def login():
            navigate("/dashboard")
            page.get_by_text("Chế độ xem trước.", exact=False).wait_for(timeout=45000)
            click("Đăng nhập")
            dialog = page.get_by_role("dialog")
            if not dialog.is_visible():
                click("Đăng nhập")
            dialog.wait_for(state="visible", timeout=30000)
            dialog.locator("input[type=email]").fill(creds["email"])
            dialog.locator("input[type=password]").fill(creds["password"])
            dialog.get_by_role("button", name="Đăng Nhập Hệ Thống").click()
            dialog.wait_for(state="hidden", timeout=60000)
            page.wait_for_timeout(2500)
            assert page.get_by_text("Chế độ xem trước.", exact=False).count() == 0
            return "Đăng nhập thật bằng tài khoản Firebase QA riêng."

        def overview():
            assert page.get_by_role("heading", name="Tổng quan tuyển dụng").is_visible()
            page.keyboard.press("Control+k")
            page.wait_for_timeout(600)
            assert page.get_by_role("dialog").count() > 0
            close_dialog()
            page.mouse.wheel(0, 600)
            return "Tổng quan và tìm kiếm nhanh Ctrl+K hoạt động; có dữ liệu mẫu tích hợp."

        def workspace():
            navigate("/")
            page.get_by_role("link", name="Vào workspace", exact=True).first.click()
            page.locator('[data-workspace-section="overview"]').wait_for(state="visible", timeout=30000)

        def jobs():
            navigate("/dashboard?section=jobs")
            click("Thêm vị trí")
            page.locator("#job-title").fill("QA Backend Developer")
            page.locator("#job-reqs").fill(jd)
            page.get_by_role("dialog").get_by_role("button", name="Tạo Chiến Dịch JD").click()
            page.get_by_placeholder("Tìm kiếm vị trí JD, kỹ năng yêu cầu...").fill("QA Backend")
            assert page.get_by_role("heading", name="QA Backend Developer").is_visible()
            download("Xuất CSV")
            page.reload(wait_until="domcontentloaded")
            page.wait_for_timeout(1800)
            if not page.get_by_role("heading", name="QA Backend Developer").count():
                raise Partial("Thêm/lọc/xuất CSV đạt; vị trí tự tạo chưa được lưu bền vững sau tải lại.")

        def candidates():
            navigate("/dashboard?section=candidates")
            click("Thêm hồ sơ")
            page.locator("#cand-name").fill("QA Candidate Manual")
            page.locator("#cand-email").fill("qa.manual@example.test")
            page.locator("#cand-skills").fill("Python, FastAPI, PostgreSQL")
            page.get_by_role("dialog").get_by_role("button", name="Tiếp Nhận CV").click()
            page.get_by_placeholder("Tìm kiếm ứng viên, kỹ năng, email...").fill("QA Candidate Manual")
            assert page.get_by_text("QA Candidate Manual", exact=True).is_visible()
            download("Xuất CSV")
            return "Thêm thủ công, tìm kiếm và xuất CSV; kiểm tra ở trạng thái giao diện."

        def pipeline():
            navigate("/dashboard?section=pipeline")
            assert page.get_by_role("button", name="Tiến bước", exact=True).count() > 0
            click("Tiến bước")
            click("Lùi bước")
            page.get_by_placeholder("Tìm theo tên ứng viên, kỹ năng...").fill("React")
            page.wait_for_timeout(1000)
            return "Chuyển tiến/lùi giai đoạn và lọc ứng viên mẫu."

        def scheduling():
            navigate("/dashboard?section=interview-hub")
            click("Tạo lịch phỏng vấn")
            dialog = page.get_by_role("dialog")
            assert dialog.is_visible()
            page.screenshot(path=str(out / "screenshots" / "interview-form.png"))
            dialog.locator('input[type=date]').fill("2026-10-22")
            dialog.get_by_placeholder("https://meet.google.com/...").fill("https://example.test/qa-meeting")
            dialog.get_by_placeholder("Tech Lead, HR Specialist...").fill("QA Panel")
            dialog.get_by_role("button", name="Tạo lịch phỏng vấn", exact=True).click()
            page.wait_for_timeout(1000)
            assert page.get_by_text("QA Panel", exact=False).count() > 0
            page.screenshot(path=str(out / "screenshots" / "interview-created.png"))
            click("Email tuyển dụng (4)")
            click("Mẫu Thư Chuẩn (3)")
            raise Partial("Tạo lịch mẫu và xem mẫu thư đạt ở giao diện. Chưa có tích hợp lịch ngoài hoặc xác nhận lưu bền vững.")

        def contact():
            navigate("/dashboard?section=contact-candidates")
            assert page.get_by_role("button", name="Gửi Email Tức Thì").is_visible()
            page.locator("main").get_by_role("textbox").first.fill("[QA] Thư mời phỏng vấn mẫu")
            page.locator("main textarea").fill("Đây là bản nháp kiểm thử. Không gửi thư tới ứng viên thật.")
            raise Partial("Soạn thư và chọn mẫu đạt; không thực hiện gửi thư thật.")

        def cv_setup():
            navigate("/dashboard/match-workflow")
            page.locator("#wf-jd-title").fill("QA Backend Python Developer")
            page.locator("#wf-jd-content").fill(jd)
            click("Tiếp tục: Tiêu chí đánh giá")
            assert page.get_by_role("slider").count() > 0
            page.get_by_role("slider").first.focus()
            page.keyboard.press("ArrowRight")
            page.keyboard.press("ArrowLeft")
            click("Tiếp tục: tải lên hồ sơ (CV)")
            for _ in range(20):
                buttons = page.get_by_role("button", name=re.compile("^Xóa tệp "))
                if not buttons.count(): break
                buttons.first.click()
            assert page.get_by_role("button", name="Bắt đầu phân tích & chấm điểm AI").is_disabled()
            return "Nhập JD, điều chỉnh trọng số, bỏ hồ sơ mẫu; chặn phân tích khi chưa có CV."

        def extraction():
            switch = page.get_by_role("switch").first
            if switch.get_attribute("aria-checked") == "true": switch.click()
            page.locator("input[type=file]").set_input_files([str(samples / "CV-QA-Backend.pdf"), str(samples / "CV-QA-Junior.txt")])
            page.get_by_role("button", name="Xóa tệp CV-QA-Junior.txt").wait_for(timeout=90000)
            assert page.get_by_role("button", name="Xóa tệp CV-QA-Backend.pdf").count() == 1
            return "Trích xuất thật 1 PDF và 1 TXT qua Core API; chỉ thêm CV khi có văn bản."

        def extraction_error():
            page.route("**/api/files/extract-text", lambda route: route.abort())
            try:
                page.locator("input[type=file]").set_input_files(str(samples / "CV-QA-Invalid.pdf"))
                page.wait_for_timeout(3500)
                assert page.get_by_role("button", name="Xóa tệp CV-QA-Invalid.pdf").count() == 0
                assert page.get_by_text("Không thể đọc:", exact=False).count() > 0
            finally:
                page.unroute("**/api/files/extract-text")
            return "Giả lập lỗi kết nối có chủ đích: hiển thị lỗi, không tạo nội dung CV giả."

        def analysis():
            click("Bắt đầu phân tích & chấm điểm AI")
            deadline = time.monotonic() + 720
            last_log = 0
            while time.monotonic() < deadline:
                body = page.locator("main").inner_text()
                if "Chưa thể hoàn tất phân tích" in body:
                    raise AssertionError(body[-2000:])
                if page.get_by_role("button", name="Xuất báo cáo excel", exact=True).count():
                    assert "QA" in body
                    download("Xuất báo cáo excel")
                    return "Hoàn tất job thật qua model CV Match local, hiển thị kết quả và xuất CSV."
                if time.monotonic() - last_log > 25:
                    print(json.dumps({"waiting":"local-model", "seconds":round(time.monotonic()-started)},ensure_ascii=False), flush=True)
                    last_log = time.monotonic()
                page.wait_for_timeout(2000)
            raise AssertionError("Chưa nhận kết quả sau 12 phút; không xác nhận thành công.")

        def assistant():
            navigate("/ai-assistant")
            field = page.get_by_label("Câu hỏi cho trợ lý AI")
            begin = len(network)
            field.fill("Đây là kiểm thử QA. Hãy nêu ngắn gọn 3 tiêu chí đánh giá kỹ năng Python trong CV, không dùng dữ liệu cá nhân.")
            field.press("Enter")
            page.wait_for_timeout(2000)
            deadline = time.monotonic() + 75
            while time.monotonic() < deadline:
                body = page.locator("main").inner_text()
                if "Chưa thể kết nối với trợ lý AI" in body: raise Partial("Trò chuyện thật đã gửi; dịch vụ AI trả lỗi kết nối/API.")
                if any("/reply" in item["path"] for item in network[begin:]):
                    page.wait_for_timeout(1500)
                    break
                page.wait_for_timeout(2000)
            recent = [item for item in network[begin:] if "/reply" in item["path"]]
            if not recent or recent[-1]["status"] != 200: raise Partial("Chưa có phản hồi AI thành công từ endpoint trò chuyện.")
            return "Tạo phiên, gửi câu hỏi và nhận trả lời thật từ dịch vụ Insight Match."

        def research():
            click("Nghiên cứu chuyên sâu")
            page.get_by_placeholder(re.compile("Nhập chủ đề cần nghiên cứu")).fill("Các kỹ năng cốt lõi của Backend Python Developer")
            button = page.get_by_role("button", name=re.compile("Bắt đầu|Nghiên cứu|Phân tích"))
            visible = [item for item in button.all() if item.is_visible() and item.inner_text().strip() != "Nghiên cứu chuyên sâu"]
            if visible: visible[0].click()
            page.wait_for_timeout(3500)
            raise Partial("Đã thử yêu cầu nghiên cứu; môi trường local thiếu TAVILY_API_KEY.")

        def career():
            navigate("/career-compass")
            field = page.get_by_placeholder("Chia sẻ mục tiêu hoặc câu hỏi về nghề nghiệp…")
            field.fill("Tôi thích lập trình Python và phân tích dữ liệu. Hãy gợi ý ngắn gọn 2 hướng nghề nghiệp để tham khảo.")
            field.press("Enter")
            page.wait_for_timeout(3500)
            deadline = time.monotonic() + 75
            while time.monotonic() < deadline and "Đang tổng hợp thông tin" in page.locator("main").inner_text(): page.wait_for_timeout(2000)
            recent = [item for item in network if "careercompass" in item["host"] and item["method"] == "POST"]
            if not recent or recent[-1]["status"] != 200: raise Partial("Giao diện cố vấn hoạt động; chưa nhận phản hồi thành công từ dịch vụ nghề nghiệp.")
            return "Gửi câu hỏi và nhận phản hồi từ API cố vấn; chưa đánh giá chất lượng tư vấn."

        def survey():
            click("Khảo sát RIASEC")
            ones = page.get_by_role("button", name=re.compile(r"^Câu \d+: mức 1 trên 5$"))
            assert ones.count() >= 12, "Chưa hiển thị đủ câu hỏi khảo sát."
            for index in range(ones.count()):
                page.get_by_role("button", name=f"Câu {index + 1}: mức {1 + index % 5} trên 5", exact=True).click()
            click("Xem kết quả khảo sát")
            page.get_by_text("Mã sở thích Holland:", exact=False).wait_for(timeout=90000)
            if page.get_by_text("Kết quả tổng hợp trên thiết bị", exact=True).count(): raise Partial("Khảo sát RIASEC tính điểm local thành công; API tư vấn chưa khả dụng.")
            return "Trả lời khảo sát và hiển thị mã Holland cùng phân bố điểm."

        def roadmap():
            click("Lộ trình tham khảo")
            page.mouse.wheel(0, 650)
            assert page.get_by_text("Tháng 1 - 3", exact=False).count() > 0
            return "Hiển thị lộ trình tham khảo; nội dung tham khảo được ghi rõ."

        def interview_questions():
            navigate("/interview-questions")
            select_option(0)
            select_option(1)
            click("Tạo bộ câu hỏi")
            page.get_by_role("button", name="Tạo bộ câu hỏi").wait_for(state="visible", timeout=90000)
            deadline = time.monotonic() + 75
            while time.monotonic() < deadline and page.get_by_role("button", name="Đang sinh câu hỏi…").count(): page.wait_for_timeout(1500)
            if "mẫu tham khảo" in page.locator("main").inner_text(): raise Partial("Tạo được bộ câu hỏi mẫu; API AI chưa khả dụng và giao diện có thông báo nguồn mẫu.")
            assert page.get_by_text("Chưa có bộ câu hỏi nào", exact=True).count() == 0
            return "Chọn vị trí, ứng viên, tạo bộ câu hỏi phỏng vấn."

        def ocr():
            page.get_by_role("button", name=re.compile("Tải hồ sơ")).first.click()
            switch = page.get_by_role("switch").first
            if switch.get_attribute("aria-checked") != "true": switch.click()
            with page.expect_response(lambda response: "/api/files/extract-text" in response.url and response.request.method == "POST", timeout=120000) as pending:
                page.locator("input[type=file]").set_input_files(str(samples / "CV-QA-Scanned.png"))
            response = pending.value
            page.wait_for_timeout(1500)
            if response.status != 200: raise Partial(f"Đã gửi ảnh quét thật; OCR trả HTTP {response.status}.")
            text = response.json().get("text", "")
            assert "FastAPI" in text or "FASTAPI" in text.upper()
            assert page.get_by_role("button", name="Xóa tệp CV-QA-Scanned.png").count() == 1
            return "OCR ảnh CV thật; kiểm tra văn bản nhận dạng có kỹ năng từ ảnh mẫu."

        def salary():
            navigate("/salary-benchmark")
            click("Tra cứu lương")
            page.wait_for_timeout(1000)
            selects = page.locator("main select")
            assert selects.count() >= 4
            print('SALARY_OPTIONS', selects.evaluate_all("els=>els.map(e=>[...e.options].slice(0,5).map(o=>({value:o.value,text:o.text})))"), flush=True)
            selects.nth(1).select_option(index=1)
            selects.nth(0).select_option(index=1)
            selects.nth(2).select_option(index=1)
            selects.nth(3).select_option("mid")
            click("Tra cứu lương")
            page.wait_for_timeout(6000)
            body = page.locator("main").inner_text()
            if "Chưa" in body or "lỗi" in body.lower(): raise Partial("Form kiểm tra dữ liệu bắt buộc và gửi tra cứu; kết quả còn phụ thuộc dịch vụ dữ liệu lương.")
            recent = [item for item in network if "/salary/" in item["path"] and item["method"] == "POST"]
            if not recent or recent[-1]["status"] != 200: raise Partial("Form hoạt động; chưa có phản hồi API lương thành công.")
            return "Kiểm tra dữ liệu bắt buộc và tra cứu mức lương."

        def history():
            navigate("/dashboard?section=history")
            assert page.get_by_role("heading", name="Lịch sử đánh giá").count() > 0
            page.get_by_placeholder("Tìm kiếm đợt tuyển, vị trí...").fill("QA")
            page.wait_for_timeout(1000)
            page.get_by_placeholder("Tìm kiếm đợt tuyển, vị trí...").fill("")
            if page.get_by_role("button", name="Xuất toàn bộ bảng điểm CSV").count(): download("Xuất toàn bộ bảng điểm CSV")
            return "Đọc lịch sử theo tài khoản, lọc và xuất dữ liệu."

        def reports():
            navigate("/dashboard?section=reports")
            click("Tùy chỉnh cột")
            page.wait_for_timeout(700)
            page.keyboard.press("Escape")
            download("Xuất tất cả CSV")
            return "Mở bộ chọn cột và xuất báo cáo CSV."

        def criteria():
            navigate("/dashboard?section=criteria-settings")
            click("Chuyên Sâu Kỹ năng (15-45-15-10-5-10)")
            click("Lưu cấu hình tiêu chí JD mặc định")
            page.wait_for_timeout(2500)
            recent = [item for item in network if "settings" in item["path"] and item["method"] in {"PATCH", "POST", "PUT"}]
            if not recent or recent[-1]["status"] != 200: raise Partial("Điều chỉnh trọng số đạt; chưa xác nhận lưu thiết lập phía server.")
            return "Lưu trọng số và điều kiện mặc định cho riêng tài khoản QA."

        def settings():
            navigate("/dashboard?section=settings")
            page.get_by_placeholder("VD: Nguyễn Văn").fill("AI Match")
            page.get_by_placeholder("VD: Phong").fill("QA")
            click("Lưu thay đổi")
            page.wait_for_timeout(2500)
            click("Làm Mới & Đồng Bộ Dữ Liệu")
            page.wait_for_timeout(1800)
            return "Chỉnh hồ sơ và yêu cầu đồng bộ lại tài khoản kiểm thử."

        def brand():
            navigate("/brand-kit")
            assert page.get_by_role("heading", name="AI Match & các dịch vụ").is_visible()
            page.mouse.wheel(0, 650)
            return "Logo nền tảng và bộ nhận diện các dịch vụ hiển thị."

        def responsive():
            page.set_viewport_size({"width":390,"height":844})
            navigate("/")
            page.mouse.wheel(0,650)
            page.wait_for_timeout(1200)
            width = page.evaluate("({viewport:innerWidth,document:document.documentElement.scrollWidth})")
            page.screenshot(path=str(out / "screenshots" / "mobile-home.png"))
            navigate("/dashboard")
            page.screenshot(path=str(out / "screenshots" / "mobile-dashboard.png"))
            page.set_viewport_size({"width":1440,"height":900})
            if width["document"] > width["viewport"] + 2: raise Partial("Trang chủ có tràn ngang ở kích thước 390px.")
            return "Kiểm tra trang chủ và dashboard ở viewport điện thoại 390px."

        cases = [
            ("Trang chủ & giới thiệu dịch vụ",landing), ("Đăng nhập Firebase",login),
            ("Tổng quan & tìm kiếm nhanh",overview), ("Landing → workspace",workspace),
            ("Vị trí tuyển dụng",jobs), ("Hồ sơ ứng viên",candidates),
            ("Tiến trình tuyển dụng",pipeline), ("Lịch phỏng vấn & mẫu thư",scheduling),
            ("Soạn thư ứng viên",contact), ("CV Match · JD & tiêu chí",cv_setup),
            ("CV Match · PDF/TXT",extraction), ("CV Match · xử lý lỗi trích xuất",extraction_error),
            ("CV Match · chấm điểm model local",analysis), ("CV Match · OCR ảnh quét",ocr), ("Insight Match · trò chuyện",assistant),
            ("Insight Match · nghiên cứu",research), ("Career Match · cố vấn",career),
            ("Career Match · Holland RIASEC",survey), ("Career Match · lộ trình",roadmap),
            ("Interview Match",interview_questions), ("Salary Match",salary),
            ("Lịch sử đánh giá",history), ("Báo cáo CSV",reports),
            ("Lưu tiêu chí mặc định",criteria), ("Hồ sơ & đồng bộ",settings),
            ("Bộ nhận diện thương hiệu",brand), ("Giao diện điện thoại",responsive),
        ]
        try:
            selected = {int(value) for value in args.only.split(",")} | {2} if args.only else set(range(1, len(cases) + 1))
            for case_number, (title, action) in enumerate(cases, 1):
                if case_number in selected: run(title, action)
            caption("AI Match · Hoàn tất lượt kiểm thử · Xem báo cáo để biết các luồng đạt, lỗi và giới hạn")
            page.wait_for_timeout(3000)
        finally:
            video = page.video
            context.close()
            if video: video.save_as(str(out / "AI-Match-kiem-thu.webm"))
            browser.close()
            (out / "results.json").write_text(json.dumps({"cases":results,"network":network,"browserErrors":errors},ensure_ascii=False,indent=2),encoding="utf-8")
        print(json.dumps({"video":str(out / "AI-Match-kiem-thu.webm"),"cases":len(results)},ensure_ascii=False),flush=True)


if __name__ == "__main__":
    main()
