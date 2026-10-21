@echo off
chcp 65001 > nul
title Mở Dashboard Quản Lý Dữ Liệu SupportHR

cd /d "%~dp0"

echo [*] Đang kiểm tra Local Server tại http://localhost:8088/health...
curl.exe -s --connect-timeout 2 http://localhost:8088/health > nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo [✓] Server đang chạy! Đang mở trình duyệt vào Dashboard...
    start http://localhost:8088/dashboard
) else (
    echo [!] Server chưa chạy! Đang tự động khởi động server và mở Dashboard...
    call start_server.bat
)
