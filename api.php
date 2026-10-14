<?php
/**
 * Café Arghavan - High-Performance DirectAdmin & Local Server API
 * Backed by Relational SQLite Database & Secure Image Upload Processing.
 */

// Disable error display in output to avoid breaking JSON response
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Security Headers & CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Password');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Config
define('ADMIN_PASSWORD', 'mohamadcr72026');
define('DATA_FILE', __DIR__ . '/menu_data.json');
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('MAX_IMAGE_SIZE', 5 * 1024 * 1024); // 5 MB

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Helper to authenticate requests
function checkAdminAuth(): bool {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authPassword = '';

    if (isset($headers['X-Admin-Password'])) {
        $authPassword = $headers['X-Admin-Password'];
    } elseif (isset($headers['x-admin-password'])) {
        $authPassword = $headers['x-admin-password'];
    } elseif (isset($_SERVER['HTTP_X_ADMIN_PASSWORD'])) {
        $authPassword = $_SERVER['HTTP_X_ADMIN_PASSWORD'];
    }

    if (empty($authPassword) && isset($_POST['adminPassword'])) {
        $authPassword = $_POST['adminPassword'];
    }

    return $authPassword === ADMIN_PASSWORD;
}

// ==========================================
// 1. GET REQUEST: Serve latest menu data directly from Database
// ==========================================
if ($method === 'GET') {
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');

    if (extension_loaded('pdo_sqlite')) {
        try {
            $db = MenuDatabase::getInstance();
            $menuData = $db->getMenuData();

            echo json_encode($menuData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        } catch (Throwable $e) {
            error_log("SQLite GET error: " . $e->getMessage());
        }
    }

    // Fallback to JSON file if SQLite has any transient issue or extension is not loaded
    if (file_exists(DATA_FILE)) {
        $content = file_get_contents(DATA_FILE);
        if (!empty($content)) {
            echo $content;
            exit;
        }
    }

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'خطا در بارگذاری اطلاعات: پایگاه داده یا فایل داده در دسترس نیست.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ==========================================
// 2. POST REQUEST: Image Uploads or Menu Updates
// ==========================================
if ($method === 'POST') {
    $action = $_GET['action'] ?? $_POST['action'] ?? '';

    // ======================================
    // A. Image Upload Endpoint (Up to 5MB, JPG/PNG/WEBP/AVIF/GIF/SVG)
    // ======================================
    if ($action === 'upload' || isset($_FILES['image'])) {
        if (!checkAdminAuth()) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'رمز عبور مدیریت نادرست یا نامعتبر است.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            $errorCode = $_FILES['image']['error'] ?? 'missing';
            $msg = 'فایل تصویری دریافت نشد یا در ارسال خطا رخ داده است.';
            if ($errorCode === UPLOAD_ERR_INI_SIZE || $errorCode === UPLOAD_ERR_FORM_SIZE) {
                $msg = 'حجم فایل انتخاب شده بیشتر از سقف مجاز سرور است.';
            }
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $msg], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $file = $_FILES['image'];

        // Size check (Max 5MB)
        if ($file['size'] > MAX_IMAGE_SIZE) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'حجم تصویر نباید بیشتر از ۵ مگابایت باشد. حجم فایل ارسالی: ' . round($file['size'] / (1024 * 1024), 2) . ' مگابایت'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Allowed extensions and MIME types
        $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'];
        $allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/avif',
            'image/svg+xml'
        ];

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedExts)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'فرمت فایل معتبر نیست. لطفاً یکی از فرمت‌های JPG, PNG, WEBP, AVIF, GIF یا SVG را انتخاب کنید.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Check real mime type
        $mime = '';
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);
        } elseif (function_exists('mime_content_type')) {
            $mime = mime_content_type($file['tmp_name']);
        }

        if (!empty($mime) && !in_array($mime, $allowedMimes) && $ext !== 'svg') {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'محتوای فایل ارسالی یک تصویر معتبر نیست (' . htmlspecialchars($mime) . ').'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (!is_dir(UPLOAD_DIR)) {
            mkdir(UPLOAD_DIR, 0755, true);
        }

        // Generate safe unique filename
        $safeExt = ($ext === 'jpeg') ? 'jpg' : $ext;
        $uniqueFilename = 'item_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $safeExt;
        $targetPath = UPLOAD_DIR . $uniqueFilename;

        // Optimize image if GD is available and it is a raster image (JPG/PNG/WEBP)
        $optimized = false;
        if (in_array($safeExt, ['jpg', 'png', 'webp']) && extension_loaded('gd') && function_exists('getimagesize')) {
            $imgInfo = @getimagesize($file['tmp_name']);
            if ($imgInfo) {
                $origWidth = $imgInfo[0];
                $origHeight = $imgInfo[1];
                $maxDim = 1600; // Optimal resolution for mobile & desktop displays

                if ($origWidth > $maxDim || $origHeight > $maxDim) {
                    $ratio = min($maxDim / $origWidth, $maxDim / $origHeight);
                    $newWidth = (int)round($origWidth * $ratio);
                    $newHeight = (int)round($origHeight * $ratio);

                    $srcImg = null;
                    if ($imgInfo[2] === IMAGETYPE_JPEG) {
                        $srcImg = @imagecreatefromjpeg($file['tmp_name']);
                    } elseif ($imgInfo[2] === IMAGETYPE_PNG) {
                        $srcImg = @imagecreatefrompng($file['tmp_name']);
                    } elseif ($imgInfo[2] === IMAGETYPE_WEBP && function_exists('imagecreatefromwebp')) {
                        $srcImg = @imagecreatefromwebp($file['tmp_name']);
                    }

                    if ($srcImg) {
                        $dstImg = imagecreatetruecolor($newWidth, $newHeight);
                        // Preserve transparency for PNG and WebP
                        if ($imgInfo[2] === IMAGETYPE_PNG || $imgInfo[2] === IMAGETYPE_WEBP) {
                            imagealphablending($dstImg, false);
                            imagesavealpha($dstImg, true);
                            $transparent = imagecolorallocatealpha($dstImg, 255, 255, 255, 127);
                            imagefilledrectangle($dstImg, 0, 0, $newWidth, $newHeight, $transparent);
                        }

                        imagecopyresampled($dstImg, $srcImg, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);

                        if ($safeExt === 'jpg') {
                            imagejpeg($dstImg, $targetPath, 88);
                        } elseif ($safeExt === 'png') {
                            imagepng($dstImg, $targetPath, 8);
                        } elseif ($safeExt === 'webp' && function_exists('imagewebp')) {
                            imagewebp($dstImg, $targetPath, 88);
                        }

                        if (PHP_VERSION_ID < 80000) {
                            @imagedestroy($srcImg);
                            @imagedestroy($dstImg);
                        }
                        $optimized = true;
                    }
                }
            }
        }

        if (!$optimized) {
            if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'خطا در ذخیره‌سازی فایل در سرور. دسترسی پوشه uploads را بررسی نمایید.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        @chmod($targetPath, 0644);
        $publicUrl = 'uploads/' . $uniqueFilename;

        echo json_encode([
            'success' => true,
            'url' => $publicUrl,
            'message' => 'تصویر با موفقیت در سرور آپلود و پردازش شد.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ======================================
    // B. Full Menu Save (Directly to SQLite Database)
    // ======================================
    $rawInput = file_get_contents('php://input');
    $postData = json_decode($rawInput, true);

    // Verify Password
    $authPassword = '';
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (isset($headers['X-Admin-Password'])) {
        $authPassword = $headers['X-Admin-Password'];
    } elseif (isset($headers['x-admin-password'])) {
        $authPassword = $headers['x-admin-password'];
    } elseif (isset($_SERVER['HTTP_X_ADMIN_PASSWORD'])) {
        $authPassword = $_SERVER['HTTP_X_ADMIN_PASSWORD'];
    }

    if (empty($authPassword) && isset($postData['adminPassword'])) {
        $authPassword = $postData['adminPassword'];
    }

    if ($authPassword !== ADMIN_PASSWORD) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'رمز عبور مدیریت نادرست است.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $menuDataToSave = isset($postData['menuData']) ? $postData['menuData'] : $postData;

    if (empty($menuDataToSave) || !isset($menuDataToSave['categories']) || !isset($menuDataToSave['items'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'فرمت داده‌های ارسالی نامعتبر است.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    unset($menuDataToSave['adminPassword']);

    $savedToDb = false;
    $dbError = null;

    if (extension_loaded('pdo_sqlite')) {
        try {
            $db = MenuDatabase::getInstance();
            $db->saveMenuData($menuDataToSave, true);
            $savedToDb = true;
        } catch (Throwable $e) {
            $dbError = $e->getMessage();
            error_log("SQLite Save Error: " . $dbError);
        }
    }

    if ($savedToDb) {
        echo json_encode([
            'success' => true,
            'message' => 'تغییرات با موفقیت در پایگاه داده (SQLite) و فایل پشتیبان ثبت شد.',
            'timestamp' => time()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Fallback: Save directly to JSON file if SQLite extension is not loaded or encountered an error
    $jsonEncoded = json_encode($menuDataToSave, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($jsonEncoded !== false && @file_put_contents(DATA_FILE, $jsonEncoded, LOCK_EX) !== false) {
        echo json_encode([
            'success' => true,
            'message' => 'تغییرات با موفقیت در فایل داده منو ثبت گردید.' . ($dbError ? ' (هشدار درایور دیتابیس: ' . $dbError . ')' : ''),
            'timestamp' => time(),
            'fallback' => true
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'خطا در ثبت اطلاعات در دیتابیس و فایل: ' . ($dbError ?? 'امکان ذخیره‌سازی داده وجود ندارد.')
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Any other method
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
