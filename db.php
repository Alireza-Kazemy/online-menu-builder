<?php
/**
 * Café Arghavan - High Performance Relational Database Engine
 * Powered by SQLite (PDO) with automatic migration, transactions & WAL mode.
 */

class MenuDatabase {
    private static ?MenuDatabase $instance = null;
    private PDO $pdo;
    private string $dbPath;
    private string $jsonBackupPath;

    public function __construct(?string $dbPath = null) {
        $dataDir = __DIR__ . '/data';
        if (!is_dir($dataDir)) {
            mkdir($dataDir, 0755, true);
        }

        $this->dbPath = $dbPath ?? ($dataDir . '/menu.sqlite');
        $this->jsonBackupPath = __DIR__ . '/menu_data.json';

        $dsn = 'sqlite:' . $this->dbPath;
        $this->pdo = new PDO($dsn, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 5
        ]);

        // High performance SQLite PRAGMAs
        $this->pdo->exec('PRAGMA journal_mode = WAL;');
        $this->pdo->exec('PRAGMA synchronous = NORMAL;');
        $this->pdo->exec('PRAGMA foreign_keys = ON;');

        $this->initSchema();
    }

    public static function getInstance(): MenuDatabase {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getPdo(): PDO {
        return $this->pdo;
    }

    /**
     * Initialize clean relational schema
     */
    private function initSchema(): void {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name_fa TEXT NOT NULL,
                name_en TEXT DEFAULT '',
                icon TEXT DEFAULT '☕',
                sort_order INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                category_id TEXT NOT NULL,
                name_fa TEXT NOT NULL,
                name_en TEXT DEFAULT '',
                price REAL NOT NULL DEFAULT 0,
                ingredients_fa TEXT DEFAULT '',
                ingredients_en TEXT DEFAULT '',
                badge_fa TEXT DEFAULT '',
                badge_en TEXT DEFAULT '',
                image TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                is_available INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
            CREATE INDEX IF NOT EXISTS idx_items_sort ON items(sort_order);
            CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);
        ");

        // Check if database needs initial seeding from existing menu_data.json
        $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM categories");
        $rowCount = (int) $stmt->fetchColumn();

        if ($rowCount === 0 && file_exists($this->jsonBackupPath)) {
            $this->seedFromJson();
        }
    }

    /**
     * Seed database from existing menu_data.json so no café products are lost
     */
    private function seedFromJson(): void {
        $jsonRaw = file_get_contents($this->jsonBackupPath);
        if (empty($jsonRaw)) return;

        $data = json_decode($jsonRaw, true);
        if (!$data || !isset($data['categories']) || !isset($data['items'])) return;

        $this->saveMenuData($data, false);
    }

    /**
     * Get complete menu data directly from database
     */
    public function getMenuData(): array {
        // 1. Fetch settings (cafeInfo)
        $settingsStmt = $this->pdo->query("SELECT key, value FROM settings");
        $settingsRows = $settingsStmt->fetchAll();
        $cafeInfo = [
            'nameFa' => "کافه ارغوان",
            'nameEn' => "Café Arghavan",
            'taglineFa' => "لذت طعم اصیل ایرانی در کنار حال خوب",
            'taglineEn' => "Authentic Persian Taste & Joyful Moments",
            'instagram' => "@arghavansaray",
            'currencyFa' => "تومان",
            'currencyEn' => "Tomans"
        ];
        foreach ($settingsRows as $row) {
            $cafeInfo[$row['key']] = $row['value'];
        }

        // 2. Fetch categories ordered by sort_order
        $catStmt = $this->pdo->query("
            SELECT id, name_fa AS nameFa, name_en AS nameEn, icon, sort_order
            FROM categories
            ORDER BY sort_order ASC, rowid ASC
        ");
        $categories = $catStmt->fetchAll();

        // 3. Fetch items ordered by sort_order
        $itemStmt = $this->pdo->query("
            SELECT 
                id, 
                category_id AS categoryId, 
                name_fa AS nameFa, 
                name_en AS nameEn, 
                price, 
                ingredients_fa AS ingredientsFa, 
                ingredients_en AS ingredientsEn, 
                badge_fa AS badgeFa, 
                badge_en AS badgeEn, 
                image, 
                sort_order,
                is_available AS isAvailable
            FROM items
            ORDER BY sort_order ASC, rowid ASC
        ");
        $items = $itemStmt->fetchAll();

        // Cast numeric price
        foreach ($items as &$item) {
            $item['price'] = (float)$item['price'];
            $item['isAvailable'] = (int)($item['isAvailable'] ?? 1);
        }
        unset($item);

        return [
            'cafeInfo' => $cafeInfo,
            'categories' => $categories,
            'items' => $items
        ];
    }

    /**
     * Atomically save entire menu (Settings, Categories, Items) to SQLite database
     */
    public function saveMenuData(array $menuData, bool $syncJson = true): bool {
        $this->pdo->beginTransaction();

        try {
            // 1. Save cafeInfo / settings
            if (isset($menuData['cafeInfo']) && is_array($menuData['cafeInfo'])) {
                $settingStmt = $this->pdo->prepare("
                    INSERT INTO settings (key, value) 
                    VALUES (:key, :value)
                    ON CONFLICT(key) DO UPDATE SET value = excluded.value
                ");
                foreach ($menuData['cafeInfo'] as $k => $v) {
                    $settingStmt->execute([
                        ':key' => $k,
                        ':value' => (string)$v
                    ]);
                }
            }

            // 2. Sync categories
            if (isset($menuData['categories']) && is_array($menuData['categories'])) {
                // Delete removed categories
                $catIds = array_column($menuData['categories'], 'id');
                if (!empty($catIds)) {
                    $placeholders = implode(',', array_fill(0, count($catIds), '?'));
                    $delStmt = $this->pdo->prepare("DELETE FROM categories WHERE id NOT IN ($placeholders)");
                    $delStmt->execute($catIds);
                } else {
                    $this->pdo->exec("DELETE FROM categories");
                }

                $catUpsert = $this->pdo->prepare("
                    INSERT INTO categories (id, name_fa, name_en, icon, sort_order, updated_at)
                    VALUES (:id, :name_fa, :name_en, :icon, :sort_order, CURRENT_TIMESTAMP)
                    ON CONFLICT(id) DO UPDATE SET
                        name_fa = excluded.name_fa,
                        name_en = excluded.name_en,
                        icon = excluded.icon,
                        sort_order = excluded.sort_order,
                        updated_at = CURRENT_TIMESTAMP
                ");

                foreach ($menuData['categories'] as $index => $cat) {
                    $catUpsert->execute([
                        ':id' => $cat['id'],
                        ':name_fa' => $cat['nameFa'] ?? $cat['name_fa'] ?? '',
                        ':name_en' => $cat['nameEn'] ?? $cat['name_en'] ?? '',
                        ':icon' => $cat['icon'] ?? '☕',
                        ':sort_order' => isset($cat['sort_order']) ? (int)$cat['sort_order'] : $index
                    ]);
                }
            }

            // 3. Sync items
            if (isset($menuData['items']) && is_array($menuData['items'])) {
                // Delete removed items
                $itemIds = array_column($menuData['items'], 'id');
                if (!empty($itemIds)) {
                    $placeholders = implode(',', array_fill(0, count($itemIds), '?'));
                    $delStmt = $this->pdo->prepare("DELETE FROM items WHERE id NOT IN ($placeholders)");
                    $delStmt->execute($itemIds);
                } else {
                    $this->pdo->exec("DELETE FROM items");
                }

                $itemUpsert = $this->pdo->prepare("
                    INSERT INTO items (
                        id, category_id, name_fa, name_en, price, 
                        ingredients_fa, ingredients_en, badge_fa, badge_en, 
                        image, sort_order, is_available, updated_at
                    ) VALUES (
                        :id, :category_id, :name_fa, :name_en, :price, 
                        :ingredients_fa, :ingredients_en, :badge_fa, :badge_en, 
                        :image, :sort_order, :is_available, CURRENT_TIMESTAMP
                    )
                    ON CONFLICT(id) DO UPDATE SET
                        category_id = excluded.category_id,
                        name_fa = excluded.name_fa,
                        name_en = excluded.name_en,
                        price = excluded.price,
                        ingredients_fa = excluded.ingredients_fa,
                        ingredients_en = excluded.ingredients_en,
                        badge_fa = excluded.badge_fa,
                        badge_en = excluded.badge_en,
                        image = excluded.image,
                        sort_order = excluded.sort_order,
                        is_available = excluded.is_available,
                        updated_at = CURRENT_TIMESTAMP
                ");

                foreach ($menuData['items'] as $index => $item) {
                    $itemUpsert->execute([
                        ':id' => $item['id'],
                        ':category_id' => $item['categoryId'] ?? $item['category_id'] ?? '',
                        ':name_fa' => $item['nameFa'] ?? $item['name_fa'] ?? '',
                        ':name_en' => $item['nameEn'] ?? $item['name_en'] ?? '',
                        ':price' => (float)($item['price'] ?? 0),
                        ':ingredients_fa' => $item['ingredientsFa'] ?? $item['ingredients_fa'] ?? '',
                        ':ingredients_en' => $item['ingredientsEn'] ?? $item['ingredients_en'] ?? '',
                        ':badge_fa' => $item['badgeFa'] ?? $item['badge_fa'] ?? '',
                        ':badge_en' => $item['badgeEn'] ?? $item['badge_en'] ?? '',
                        ':image' => $item['image'] ?? '',
                        ':sort_order' => isset($item['sort_order']) ? (int)$item['sort_order'] : $index,
                        ':is_available' => isset($item['isAvailable']) ? (int)$item['isAvailable'] : 1
                    ]);
                }
            }

            $this->pdo->commit();

            // Synchronize JSON backup for file-based safety
            if ($syncJson) {
                $fullMenu = $this->getMenuData();
                @file_put_contents(
                    $this->jsonBackupPath,
                    json_encode($fullMenu, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    LOCK_EX
                );
            }

            return true;
        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log('Database Save Error: ' . $e->getMessage());
            throw $e;
        }
    }
}
