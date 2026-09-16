<?php
/**
 * Café Arghavan - High-Performance DirectAdmin Server API
 * Handles persistent menu data loading and secure updates.
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
define('DATA_FILE', __DIR__ . '/menu_data.json');
define('ADMIN_PASSWORD', 'mohamadcr72026');

$method = $_SERVER['REQUEST_METHOD'];

// ==========================================
// 1. GET REQUEST: Serve latest menu data
// ==========================================
if ($method === 'GET') {
    // Prevent browser caching for fresh menu display across all users
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');

    if (file_exists(DATA_FILE)) {
        $content = file_get_contents(DATA_FILE);
        if (!empty($content)) {
            echo $content;
            exit;
        }
    }

    // Fallback if file doesn't exist yet
    http_response_code(404);
    echo json_encode(['error' => 'Data file not found on server']);
    exit;
}

// ==========================================
// 2. POST REQUEST: Save updated menu data
// ==========================================
if ($method === 'POST') {
    // Check Admin Password from custom header or JSON payload
    $headers = getallheaders();
    $authPassword = '';

    if (isset($headers['X-Admin-Password'])) {
        $authPassword = $headers['X-Admin-Password'];
    } elseif (isset($headers['x-admin-password'])) {
        $authPassword = $headers['x-admin-password'];
    }

    $rawInput = file_get_contents('php://input');
    $postData = json_decode($rawInput, true);

    if (empty($authPassword) && isset($postData['adminPassword'])) {
        $authPassword = $postData['adminPassword'];
    }

    // Authentication verification
    if ($authPassword !== ADMIN_PASSWORD) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'رمز عبور مدیریت نادرست است.'
        ]);
        exit;
    }

    // Data payload verification
    $menuDataToSave = isset($postData['menuData']) ? $postData['menuData'] : $postData;

    if (empty($menuDataToSave) || !isset($menuDataToSave['categories']) || !isset($menuDataToSave['items'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'فرمت داده‌های ارسالی نامعتبر است.'
        ]);
        exit;
    }

    // Clean payload before saving (don't save the password into json)
    unset($menuDataToSave['adminPassword']);

    $jsonOutput = json_encode($menuDataToSave, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($jsonOutput === false) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'خطا در تبدیل داده‌ها به فرمت JSON'
        ]);
        exit;
    }

    // Atomic write with lock to ensure file safety under concurrent writes
    $writeSuccess = file_put_contents(DATA_FILE, $jsonOutput, LOCK_EX);

    if ($writeSuccess !== false) {
        echo json_encode([
            'success' => true,
            'message' => 'تغییرات با موفقیت روی سرور ثبت شد و برای تمامی کاربران اعمال گردید.',
            'timestamp' => time()
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'خطا در نوشتن روی سرور. لطفاً سطح دسترسی فایل (Permission) را بررسی نمایید.'
        ]);
    }
    exit;
}

// Any other method
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
