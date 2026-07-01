CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_no TEXT NOT NULL UNIQUE,
    nickname TEXT NOT NULL,
    birth_month INTEGER NOT NULL,
    birth_day INTEGER NOT NULL,
    birthday_pin TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    visit_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_visit_at TEXT,
    deleted_at TEXT,
    admin_memo TEXT
);

CREATE INDEX IF NOT EXISTS idx_members_member_no ON members(member_no);
CREATE INDEX IF NOT EXISTS idx_members_nickname ON members(nickname);

CREATE TABLE IF NOT EXISTS point_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    point_delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    operation_type TEXT NOT NULL DEFAULT 'manual',
    memo TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE INDEX IF NOT EXISTS idx_point_logs_member_id ON point_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_point_logs_created_at ON point_logs(created_at);

CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'all',
    target_member_id INTEGER,
    target_birth_month INTEGER,
    start_at TEXT,
    end_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY (target_member_id) REFERENCES members(id)
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_announcements_target ON announcements(target_type, target_member_id, target_birth_month);

CREATE TABLE IF NOT EXISTS point_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_code TEXT NOT NULL,
    points INTEGER NOT NULL,
    title TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_point_catalog_shop ON point_catalog(shop_code, is_active, display_order);
