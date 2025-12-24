-- Supabaseで実行するSQLスキーマ
-- 家計簿アプリ用のテーブル構成

-- ===================================
-- 1. ユーザーテーブル
-- ===================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  avatar_url TEXT,
  currency VARCHAR(3) DEFAULT 'JPY',
  timezone VARCHAR(50) DEFAULT 'Asia/Tokyo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);

-- ===================================
-- 2. カテゴリマスタテーブル
-- ===================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(7) DEFAULT '#667eea',
  is_default BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- インデックス
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- デフォルトカテゴリを挿入するトリガー用の関数
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categories (user_id, name, icon, is_default) VALUES
    (NEW.id, '食費', '🍽️', TRUE),
    (NEW.id, '交通費', '🚗', TRUE),
    (NEW.id, '娯楽', '🎬', TRUE),
    (NEW.id, '光熱費', '💡', TRUE),
    (NEW.id, '通信費', '📱', TRUE),
    (NEW.id, '日用品', '🛒', TRUE),
    (NEW.id, '医療費', '🏥', TRUE),
    (NEW.id, '衣類', '👔', TRUE),
    (NEW.id, '教育', '📚', TRUE),
    (NEW.id, 'その他', '📌', TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー：ユーザー作成時にデフォルトカテゴリを自動作成
CREATE TRIGGER trigger_create_default_categories
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_categories();

-- ===================================
-- 3. 支出テーブル（メインテーブル）
-- ===================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cash',
  tags TEXT[],
  notes TEXT,
  receipt_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);

-- パーティショニング用（月ごとのパーティション）
-- ALTER TABLE expenses PARTITION BY RANGE (YEAR(date), MONTH(date));

-- ===================================
-- 4. レシート画像テーブル
-- ===================================
CREATE TABLE IF NOT EXISTS receipt_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_file_path TEXT,
  recognized_text TEXT,
  recognized_items JSONB,
  total_amount DECIMAL(12, 2),
  store_name VARCHAR(255),
  receipt_date DATE,
  ocr_confidence DECIMAL(3, 2),
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_receipt_images_user_id ON receipt_images(user_id);
CREATE INDEX idx_receipt_images_expense_id ON receipt_images(expense_id);
CREATE INDEX idx_receipt_images_created_at ON receipt_images(created_at DESC);

-- ===================================
-- 5. 予算テーブル
-- ===================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  alert_threshold DECIMAL(3, 0) DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id, year, month)
);

-- インデックス
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_year_month ON budgets(year, month);

-- ===================================
-- 6. 月別集計テーブル（キャッシュ用）
-- ===================================
CREATE TABLE IF NOT EXISTS monthly_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  total_amount DECIMAL(12, 2) DEFAULT 0,
  count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year, month, category_id)
);

-- インデックス
CREATE INDEX idx_monthly_summary_user_id ON monthly_summary(user_id);
CREATE INDEX idx_monthly_summary_year_month ON monthly_summary(year, month);

-- ===================================
-- 7. 週別集計テーブル（キャッシュ用）
-- ===================================
CREATE TABLE IF NOT EXISTS weekly_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  week INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount DECIMAL(12, 2) DEFAULT 0,
  count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year, week)
);

-- インデックス
CREATE INDEX idx_weekly_summary_user_id ON weekly_summary(user_id);
CREATE INDEX idx_weekly_summary_year_week ON weekly_summary(year, week);

-- ===================================
-- 8. 年別集計テーブル（キャッシュ用）
-- ===================================
CREATE TABLE IF NOT EXISTS yearly_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_amount DECIMAL(12, 2) DEFAULT 0,
  count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year)
);

-- インデックス
CREATE INDEX idx_yearly_summary_user_id ON yearly_summary(user_id);

-- ===================================
-- 9. 支払い方法マスタテーブル
-- ===================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- デフォルト支払い方法
CREATE OR REPLACE FUNCTION create_default_payment_methods()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO payment_methods (user_id, name, type) VALUES
    (NEW.id, '現金', 'cash'),
    (NEW.id, 'クレジットカード', 'credit_card'),
    (NEW.id, 'デビットカード', 'debit_card'),
    (NEW.id, '電子マネー', 'e_money'),
    (NEW.id, 'QRコード決済', 'qr_payment');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_payment_methods
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_payment_methods();

-- ===================================
-- 10. 監査ログテーブル
-- ===================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ===================================
-- 11. 更新トリガー：updated_atを自動更新
-- ===================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを各テーブルに適用
CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_expenses_updated_at
BEFORE UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_receipt_images_updated_at
BEFORE UPDATE ON receipt_images
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_budgets_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ===================================
-- 12. RLS（行レベルセキュリティ）ポリシー
-- ===================================

-- users テーブルのRLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
ON users FOR SELECT
USING (auth.uid() = auth_id);

CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
USING (auth.uid() = auth_id);

-- categories テーブルのRLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories"
ON categories FOR SELECT
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own categories"
ON categories FOR INSERT
WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own categories"
ON categories FOR UPDATE
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete their own categories"
ON categories FOR DELETE
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- expenses テーブルのRLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses"
ON expenses FOR SELECT
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own expenses"
ON expenses FOR INSERT
WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own expenses"
ON expenses FOR UPDATE
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete their own expenses"
ON expenses FOR DELETE
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- receipt_images テーブルのRLS
ALTER TABLE receipt_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own receipts"
ON receipt_images FOR SELECT
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own receipts"
ON receipt_images FOR INSERT
WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own receipts"
ON receipt_images FOR UPDATE
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete their own receipts"
ON receipt_images FOR DELETE
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- budgets テーブルのRLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budgets"
ON budgets FOR SELECT
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage their own budgets"
ON budgets FOR INSERT
WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own budgets"
ON budgets FOR UPDATE
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- payment_methods テーブルのRLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment methods"
ON payment_methods FOR SELECT
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ===================================
-- 13. ストレージバケット（レシート画像）
-- ===================================
-- Supabase Storageで以下のバケットを作成してください：
-- バケット名: receipts
-- アクセス権: Private（RLSで制御）
-- CORS設定: 許可

-- ストレージのRLSポリシーは別途Supabaseダッシュボードで設定してください

-- ===================================
-- サンプルデータ（テスト用）
-- ===================================

-- ※ 実際に使用する場合は、以下のコメントを外して実行してください
-- 注：user_idはSupabase Auth作成後の実際のIDに置き換えてください

-- INSERT INTO users (auth_id, email, name) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'テストユーザー');

-- INSERT INTO expenses (user_id, category_id, amount, description, date) 
-- SELECT id, (SELECT id FROM categories WHERE user_id = users.id AND name = '食費' LIMIT 1), 
--        1500, '夕食', CURRENT_DATE
-- FROM users WHERE email = 'test@example.com';
