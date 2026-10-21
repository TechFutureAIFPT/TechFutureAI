@echo off
chcp 65001 > nul
title SupportHR Local AI & Database Server (Port 8088)

echo =====================================================================
echo    🚀 KHỞI ĐỘNG SUPPORTHR LOCAL AI & DATABASE STUDIO (1-CLICK)
echo =====================================================================
echo.

cd /d "%~dp0"

:: 1. Kiểm tra tiến trình Ollama
echo [*] [1/3] Kiểm tra tiến trình Ollama Daemon...
curl.exe -s --connect-timeout 2 http://127.0.0.1:11434/api/tags > nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo [✓] Ollama đang chạy sẵn sàng tại http://127.0.0.1:11434
) else (
    echo [!] Ollama chưa chạy. Đang tự động khởi động 'ollama serve' trong nền...
    start "Ollama Service" /B ollama serve
    timeout /t 3 /nobreak > nul
    curl.exe -s --connect-timeout 3 http://127.0.0.1:11434/api/tags > nul 2>&1
    if "%ERRORLEVEL%"=="0" (
        echo [✓] Ollama đã khởi động thành công!
    ) else (
        echo [!] Đang chờ Ollama tải mô hình...
    )
)

:: 2. Tự động mở trình duyệt sau 2 giây
echo [*] [2/3] Đặt lệnh tự động mở Giao diện Quản trị Cơ sở Dữ liệu...
start "" cmd /c "timeout /t 2 /nobreak > nul & start http://localhost:8088/dashboard"

:: 3. Chạy Server FastAPI với Python ảo .venv
echo [*] [3/3] Khởi chạy Local AI FastAPI Server trên cổng 8088...
echo.
echo =====================================================================
echo   🌐 Giao diện Dashboard: http://localhost:8088/dashboard
echo   📖 Tài liệu Swagger API: http://localhost:8088/docs
echo   🤖 Model Qwen:            qwen2.5-coder:7b
echo   🎯 Model CV Match:       cv-match:7b
echo   📐 Model Embedding:      nomic-embed-text:latest (768-D)
echo   🗄️ CSDL SQLite local:     data/supporthr_local.db
echo =====================================================================
echo   (Nhấn Ctrl + C để dừng máy chủ khi cần)
echo.

if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe run_server.py
) else (
    python run_server.py
)

pause
