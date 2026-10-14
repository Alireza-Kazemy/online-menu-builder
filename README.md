# سامانه منوی دیجیتال هوشمند و چندزبانه | Smart Multilingual Digital Menu System
> یک پلتفرم وب‌اپلیکیشن فوق‌سریع، ماژولار و بسیار منعطف با معماری بدون دیتابیس (Flat-file JSON)، طراحی لوکس و قابلیت شخصی‌سازی کامل
> *A High-Performance, Modular & Fully Customizable Digital Menu Web Platform with Flat-file JSON Architecture & Luxury Visual Design*

---

## 🇮🇷 فارسی

### معرفی پروژه
این پروژه یک سامانه وب‌اپلیکیشن منوی دیجیتال مدرن، بهینه‌سازی‌شده برای تلفن همراه (Mobile-First) و با تمرکز بر تعاملی سریع و روان برای مشتریان و مدیران مجموعه‌های غذایی (کافه، رستوران، فودکورت و بیسترو) است. 

معماری سامانه به گونه‌ای پیاده‌سازی شده که بدون وابستگی به فریم‌ورک‌های سنگین یا دیتابیس‌های پیچیده رابطه مانند MySQL/PostgreSQL کار می‌کند و با حداقل مصرف منابع روی هر نوع هاست اشتراکی یا سرور اختصاصی اجرا می‌شود.

---

### 🛠 مشخصات فنی و معماری نرم‌افزار

#### ۱. معماری فرانت‌اند (Client-Side Architecture)
- **Vanilla JavaScript (ES6+):** پیاده‌سازی بر پایه معماری State-Driven بدون هیچ فریم‌ورک اضافه؛ تضمین‌کننده زمان بارگذاری صفر و حذف Overhead کتابخانه‌ها.
- **موتور رندرینگ پویا:** پردازش و رندرینگ Real-time داده‌های منو، مدیریت داینامیک لیست‌ها، سیستم Cache-Busting با پارامتر Timestamp برای جلوگیری از کش شدن داده‌های تغییر یافته منو.
- **سیستم چندزبانه اختصاصی (i18n):** سوئیچ آنی بین زبان‌ها (فارسی RTL و انگلیسی LTR) در کلاینت بدون نیاز به ریلود شدن مرورگر، همراه با هماهنگ‌سازی فونت، ترازبندی و جهت متون.
- **فیلترینگ و سرچ لحظه‌ای:** موتور جستجوی کلاینت با فیلتر بلادرنگ براساس عنوان، توضیحات و دسته‌بندی با نرخ پاسخگویی کمتر از ۱۰ میلی‌ثانیه.
- **سیستم کش مرورگر (Local Storage Fallback):** ذخیره آخرین وضعیت دریافت شده برای قابلیت نمایش سریع حتی در صورت اختلال موقت اینترنت.

#### ۲. رابط کاربری و سیستم طراحی (Design System & CSS3)
- **طراحی شیشه‌ای پیشرفته (Glassmorphism):** تلفیق `backdrop-filter: blur()`، حاشیه‌های نیمه‌شفاف و سایه‌های عمق‌دار نورانی.
- **سیستم Design Tokens در CSS Custom Properties:** تمامی رنگ‌ها، فواصل، پدینگ‌ها، شعاع گردی لبه‌ها (`--radius-*`) و گرادیان‌ها به صورت متغیرهای مرکزی تعریف شده‌اند.
- **پترن‌های وکتور مقیاس‌پذیر (SVG Inlined):** استفاده از نقوش اصیل وکتوری با بهینه‌ترین سایز بدون افت کیفیت در صفحه‌نمایش‌های رتینا و 4K.
- **تایپوگرافی اختصاصی و فونت‌های وب WOFF2:** ادغام فایل‌های WOFF2 در ۴ وزن مجزا (Regular, Bold, ExtraBold, Black) با تنظیم بهینه `font-display: swap`.
- **ریسپانسیو و لمسی (Touch-Optimized):** مجهز به اسکرول‌بار افقی دسته‌ها با شتاب لمسی طبیعی (Momentum Scrolling) و چیدمان متناسب با نسبت‌های مختلف صفحه نمایش.

#### ۳. بک‌اند و ذخیره‌سازی داده (Backend & Database Layer)
- **موتور قدرتمند و پاک پایگاه‌داده رابطه ای (`db.php` & SQLite PDO):** استفاده از SQLite با حالت فوق‌سریع WAL (Write-Ahead Logging)، تراکنش‌های امن (Transactions) و ایندکس‌گذاری بهینه برای اقلام و دسته‌بندی‌ها.
- **لودینگ خالص و بدون دیتای ساختگی (Pure Database Loading):** حذف کامل دیتای پیش‌نمایش قدیمی (`data.js`). در لود اولیه تنها اسکلتون لودر لوکس شیشه‌ای نمایش داده شده و دیتا مستقیماً از پایگاه‌داده بارگذاری می‌گردد.
- **موتور امن آپلود و بهینه‌سازی تصاویر (`uploads/`):** پذیرش تصاویر تا ۵ مگابایت با پشتیبانی از فرمت‌های JPG, PNG, WEBP, AVIF, GIF و SVG. تبدیل هوشمند تصاویر حجیم دوربین موبایل به ابعاد بهینه وب با کیفیت عالی.
- **پشتیبان‌گیری همزمان خودکار:** علاوه بر پایگاه‌داده رابطه‌ای SQLite، بک‌آپ JSON نیز به شکل اتمیک همگام‌سازی می‌شود.
- **امنیت فایل‌ها:** پوشه `data/` و فایل‌های دیتابیس و کانفیگ از طریق `.htaccess` به صورت کامل در برابر دسترسی مستقیم مرورگر مسدود شده‌اند.

---

### 🎨 انعطاف‌پذیری و قابلیت شخصی‌سازی بی‌نهایت (Customization)

یکی از مهم‌ترین ویژگی‌های این سیستم، **معماری ماژولار و امکان سفارشی‌سازی کامل** آن برای هر برند، هویت بصری و نیازمندی تجاری است:

1. **شخصی‌سازی کامل هویت و اطلاعات مجموعه:**
   - نام برند، شعار تبلیغاتی، ارز رایج (تومان، ریال، دلار و...)
   - آیدی شبکه‌های اجتماعی (اینستاگرام، تلگرام و...)
   - اطلاعات تماس، تلفن رزرو و رمز وای‌فای
   - لوکیشن و لینک مسیریابی گوگل مپ یا ویز

2. **شخصی‌سازی پالت رنگی و استایل بصری:**
   - قابلیت تغییر تم رنگی در فایل `style.css` با تنظیم متغیرهای `:root`:
     - رنگ‌های پس‌زمینه (`--dark-bg`, `--dark-surface`)
     - رنگ‌های اصلی تم و گرادیان‌ها (`--lacquer-primary`, `--lacquer-crimson`)
     - رنگ المان‌های شاخص و خطوط حاشیه (`--gold-antique`, `--gold-border`)
   - قابلیت جایگزینی پترن‌های وکتور پس‌زمینه با طرح‌های گرافیکی یا برندبوک دلخواه

3. **شخصی‌سازی تایپوگرافی و فونت‌ها:**
   - فایل‌های WOFF2 در پوشه `font/` به سادگی قابل تعویض با هر فونت سازمانی یا اختصاصی دیگر هستند و وزن‌های مختلف از طریق دستور `@font-face` نگاشت می‌شوند.

4. **مدیریت داینامیک منو از طریق پنل مدیریت (`admin.html`):**
   - تعریف دسته‌بندی‌های نامحدود به همراه آیکون اموجی و نام دوزبانه
   - افزودن، ویرایش، مخفی‌سازی و حذف اقلام منو
   - درج قیمت، توضیحات اختصاصی، برچسب‌های ویژه (جدید، پیشنهاد سرآشپز، محبوب و...)
   - آپلود مستقیم تصاویر تا ۵ مگابایت با درگ و دراپ، پیش‌نمایش زنده و ذخیره در سرور

---

### 📁 ساختار فایل‌های پروژه
```text
├── index.html        # رابط کاربری منوی دیجیتال مشتریان (ریسپانسیو، بدون دیتای ماک، همراه اسکلتون)
├── admin.html        # داشبورد امن مدیریت، ویرایش اقلام و تنظیم دسته‌ها و آپلود عکس
├── style.css         # سیستم طراحی، پالت رنگ، انیمیشن‌ها، اسکلتون لودینگ و استایل‌های مشترک
├── app.js            # منطق کلاینت منو (دریافت مستقیم از پایگاه داده، جستجو، سوییچ زبان)
├── admin.js          # منطق پنل مدیریت (احراز هویت، آپلود مستقیم عکس تا ۵MB، ارتباط با API)
├── api.php           # اندپوینت‌های RESTful جهت دریافت دیتا و هندل آپلود مستقیم عکس
├── db.php            # لایه مدیریت پایگاه داده رابطه‌ای SQLite (PDO، مایگریشن خودکار، ایندکس‌ها)
├── data/             # دایرکتوری محافظت‌شده پایگاه‌داده (حاوی menu.sqlite)
├── uploads/          # دایرکتوری ذخیره امن تصاویر محصولات
├── menu_data.json    # پشتیبان ساختاریافته منو
└── font/             # فونت‌های بهینه‌سازی‌شده وب با فرمت مدرن WOFF2
```

---

### 🚀 راهنمای نصب و راه‌اندازی

#### روش اول: وب‌سرور داخلی PHP (توسعه محلی)
می‌توانید به سادگی فایل `start-server.bat` را اجرا کنید یا در خط فرمان (Terminal / Command Prompt) وارد پوشه پروژه شده و دستور زیر را اجرا نمایید (سوئیچ `-c php.ini` برای فعال‌سازی درایور دیتابیس SQLite الزامی است):
```bash
php -S localhost:8000 -c php.ini
```
سپس در مرورگر باز کنید:
- **منوی عمومی:** `http://localhost:8000/index.html`
- **پنل مدیریت:** `http://localhost:8000/admin.html`

#### روش دوم: استقرار روی هاست اشتراکی (cPanel / DirectAdmin) یا VPS
1. فایل‌های پروژه را مستقیماً درون پوشه `public_html` هاست آپلود کنید.
2. اطمینان حاصل کنید که فایل `menu_data.json` دسترسی نوشتن (Permission `644` یا `666`) دارد تا API بتواند تغییرات را ذخیره کند.
3. در صورت تمایل، رمز پنل ادمین را در فایل `api.php` و `admin.js` تغییر دهید.

---

## 🇬🇧 English

### Project Overview
A lightweight, modern, mobile-first digital menu web platform engineered for extreme performance, rich visual aesthetics, and effortless administration for culinary establishments (cafes, restaurants, food courts, and bistros).

The system features a database-free flat-file JSON architecture, allowing zero-dependency deployments on any standard hosting environment with ultra-low resource consumption.

---

### 🛠 Technical Specifications & Architecture

#### 1. Client-Side Architecture
- **Vanilla JavaScript (ES6+):** Pure state-driven architecture with zero framework overhead, ensuring instantaneous initial loads and ultra-high frame rates.
- **Dynamic DOM Rendering Engine:** Real-time data transformation and rendering pipeline, incorporating timestamp-based cache busting for live updates.
- **Bilingual Core (i18n):** Client-side language switching between Persian (RTL) and English (LTR) without page refreshes, adjusting typography, layout direction, and element alignments automatically.
- **Real-Time Client Search & Filtering:** Sub-10ms query engine filtering items across names, descriptions, and category tags.
- **Offline Resilience:** LocalStorage caching strategy providing graceful fallback when internet connectivity fluctuates.

#### 2. Design System & CSS Architecture
- **Advanced Glassmorphism:** Layered `backdrop-filter: blur()` effects, semi-transparent borders, and radiant depth lighting.
- **CSS Custom Properties (Design Tokens):** Centralized theme management controlling colors, spacings, borders (`--radius-*`), and gradients.
- **Resolution-Independent Inlined SVGs:** High-fidelity scalable vector background motifs with zero quality loss on high-density displays.
- **Web-Optimized Typography:** Native WOFF2 font suite integrated across 4 distinct weights (Regular, Bold, ExtraBold, Black) utilizing `font-display: swap`.
- **Mobile-First & Touch-Centric UX:** Smooth momentum scrolling categories bar and touch-friendly interactive targets.

#### 3. Backend & Data Layer
- **Micro PHP Service (`api.php`):** RESTful endpoints handling `GET` and `POST` actions with standardized JSON responses.
- **Flat-File JSON Storage Engine:** All categories, products, prices, and branding metadata are persisted inside `menu_data.json`—no database servers (MySQL/PostgreSQL) required.
- **Concurrency & Atomic Writes:** Safe data writes via `file_put_contents` with exclusive file locking (`LOCK_EX`) to prevent data corruption during simultaneous updates.
- **Security & Access Control:** Custom header (`X-Admin-Password`) validation and payload sanitation protecting administrative endpoints.
- **Universal Compatibility:** Operates out-of-the-box on PHP 7.4 through PHP 8.x+.

---

### 🎨 Deep Customization & Flexibility

The platform is designed with adaptability at its core, enabling rapid rebranding and functional tailoring:

1. **Brand & Contact Customization:**
   - Establishment name and multilingual promotional taglines.
   - Currency display adaptation (Tomans, USD, EUR, etc.).
   - Wi-Fi credentials, reservation hotlines, and social media handles.
   - Interactive navigation integrations (Google Maps / Waze).

2. **Visual Theme & Palette Tailoring:**
   - Instant re-theming by simply modifying `:root` tokens in `style.css`:
     - Surface & Background (`--dark-bg`, `--dark-surface`)
     - Brand Colors & Accents (`--lacquer-primary`, `--gold-antique`)
   - Replaceable SVG motifs for custom brand identity.

3. **Typography Customization:**
   - Replace WOFF2 files in the `font/` directory and bind any corporate font family within `style.css`.

4. **Dynamic Menu Administration (`admin.html`):**
   - Unlimited categorization with custom emojis and bilingual titles.
   - Complete item lifecycle: create, update, reorder, price, and delete.
   - Product imagery management with live previews and promotional badges.

---

### 📁 File Structure
```text
├── index.html        # Client-facing digital menu (mobile-first, bilingual)
├── admin.html        # Administrative dashboard for item and category management
├── style.css         # Design system tokens, glassmorphism styles, and animations
├── app.js            # Client-side state manager, search engine, and renderer
├── admin.js          # Admin dashboard controller, authentication, and form handling
├── api.php           # RESTful PHP backend for atomic JSON persistence
├── menu_data.json    # Centralized JSON database for menu items and configuration
└── font/             # Optimized local WOFF2 font assets
```

---

### 🚀 Getting Started

#### Option 1: Built-in PHP Development Server
Navigate to the project root directory and run:
```bash
php -S localhost:8000
```
Then access:
- **Public Menu:** `http://localhost:8000/index.html`
- **Admin Panel:** `http://localhost:8000/admin.html`

#### Option 2: Production Hosting Deployment (cPanel / DirectAdmin / VPS)
1. Upload the files directly to your web server root (`public_html`).
2. Ensure `menu_data.json` has read/write permissions (`644` or `666`).
3. Update the admin password in `api.php` and `admin.js` as desired.
