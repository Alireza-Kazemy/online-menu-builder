@echo off
chcp 65001 >nul
title Cafe Arghavan - PHP Development Server
cd /d "%~dp0"

echo ================================================================
echo   Café Arghavan - وب‌سرور داخلی PHP با پشتیبانی از SQLite و تصاویر
echo ================================================================
echo.
echo در حال اجرای سرور روی http://localhost:8000 ...
echo برای باز کردن پنل مدیریت: http://localhost:8000/admin.html
echo برای خروج و بستن سرور، دکمه‌های Ctrl + C را فشار دهید.
echo.

php -S localhost:8000 -c php.ini

pause
