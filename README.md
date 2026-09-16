# کافه ارغوان | Café Arghavan
> منوی دیجیتال مدرن و لوکس با الهام از اصالت فرش و ترمه سنتی ایرانی  
> *A Luxurious Digital Menu & Admin Panel inspired by Traditional Persian Rugs & Termeh Artistry*

---

## 🇮🇷 فارسی

### درباره پروژه
کافه ارغوان یک وب‌اپلیکیشن منوی دیجیتال سبک، سریع و ریسپانسیو (Mobile-First) است که برای ارائه تجربه‌ای مدرن و در عین حال اصیل به مشتریان کافه طراحی شده است. طراحی بصری این پروژه بر پایه تم قرمز لاکی مخملی، خطوط طلایی و پترن وکتور ظریف **بته‌جقه و ترمه ایرانی** استوار شده است.

### ویژگی‌های کلیدی
- **طراحی منحصربه‌فرد و چشم‌نواز:** بهره‌گیری از تکنیک‌های مدرن شیشه‌ای (Glassmorphism)، گرادیان‌های لاکی و پترن‌های وکتور سنتی ترمه یزد بدون افت کیفیت در انواع نمایشگرها.
- **تایپوگرافی کامل با فونت «ابر» (Abar High):** پشتیبانی از چهار وزن فونت (Regular, Bold, ExtraBold, Black) برای خوانایی بهینه و جلوه بصری عالی.
- **دوزبانه (فارسی و انگلیسی):** سوئیچ آنی زبان بدون نیاز به بارگذاری مجدد صفحه، با جهت‌بندی متناسب (RTL و LTR).
- **دسته‌بندی هوشمند و اسکرول سریع:** دسترسی فوری به بخش‌های منو با نوار دسته‌بندی شناور و جستجوی لحظه‌ای اقلام.
- **دسترسی سریع به شبکه‌های اجتماعی و لوکیشن:** دکمه شیک اختصاصی مسیریابی و باز کردن مستقیم نقشه گوگل، در کنار لینک اینستاگرام.
- **پنل مدیریت اختصاصی (`admin.html`):** گیت امنیتی رمز عبور، امکان افزودن، ویرایش، حذف و تغییر تصاویر آیتم‌ها با پیش‌نمایش آنی.
- **بک‌اند سبک و مستقل (PHP + JSON):** مدیریت خودکار داده‌ها در `menu_data.json` از طریق `api.php` بدون نیاز به نصب پایگاه‌داده‌های سنگین مانند MySQL.

### ساختار فایل‌ها
- `index.html`: صفحه اصلی و منوی دیجیتال مشتریان
- `admin.html`: پنل مدیریت و داشبورد ویرایش منو
- `style.css`: فایل استایل یکپارچه، توکن‌های رنگی و پترن‌ها
- `app.js`: موتور کلاینت منو (جستجو، چندزبانه، رندرینگ)
- `admin.js`: منطق پنل مدیریت (احراز هویت، اعتبارسنجی فرم‌ها و فراخوانی API)
- `api.php`: رابط ذخیره و دریافت داده‌ها از فایل JSON
- `menu_data.json`: مخزن داده‌های منو و اطلاعات کافه
- `font/`: پوشه فونت‌های بهینه‌سازی شده WOFF2 (خانواده فونت ابر)

### راهنمای اجرا
برای اجرای پروژه با استفاده از وب‌سرور داخلی PHP، دستور زیر را در ترمینال پوشه پروژه اجرا کنید:
```bash
php -S localhost:8000
```
سپس آدرس‌های زیر در دسترس خواهند بود:
- **منوی کافه:** `http://localhost:8000/index.html`
- **پنل ادمین:** `http://localhost:8000/admin.html`

---

## 🇬🇧 English

### About The Project
**Café Arghavan** is a fast, lightweight, and responsive (mobile-first) digital menu web application designed to offer patrons a luxurious and authentic Persian cultural experience. The design aesthetic is deeply rooted in crimson lacquer carpet tones, antique gold highlights, and detailed vector **Termeh & Boteh-Jegheh (Paisley)** patterns.

### Key Features
- **Exquisite Visual Identity:** Advanced glassmorphic panels, deep crimson gradients, and scalable Persian Termeh motifs for high visual impact.
- **Custom Typography:** Integrated **Abar High** font family with complete font weights (Regular, Bold, ExtraBold, and Black) for optimal readability.
- **Full Bilingual Support (FA/EN):** Instant one-click language toggle between Persian (RTL) and English (LTR) without page reloads.
- **Live Search & Category Navigation:** Instant real-time search filtering alongside a smooth horizontal category slider.
- **Direct Navigation & Social Links:** Custom interactive Location button that opens Google Maps directly, accompanied by an Instagram shortcut.
- **Dedicated Admin Panel (`admin.html`):** Password-protected administrative gate allowing café owners to add, update, or remove menu items and upload images with live preview.
- **Self-Contained Backend (PHP + JSON):** Efficient data persistence using `menu_data.json` via `api.php`, requiring no complex database setups.

### File Structure
- `index.html`: Client-facing responsive digital menu
- `admin.html`: Secured administrative dashboard
- `style.css`: Comprehensive styles, color system, and Termeh SVG patterns
- `app.js`: Client-side logic (dynamic rendering, search, i18n)
- `admin.js`: Administrative panel actions and API calls
- `api.php`: Lightweight REST-like endpoints for JSON data persistence
- `menu_data.json`: Café metadata and categorized menu items
- `font/`: Local optimized WOFF2 font files (Abar High)

### Quick Start
You can run the application immediately using the built-in PHP development server:
```bash
php -S localhost:8000
```
Then visit:
- **Menu:** `http://localhost:8000/index.html`
- **Admin Panel:** `http://localhost:8000/admin.html`

---
*Created with care for Café Arghavan.*
