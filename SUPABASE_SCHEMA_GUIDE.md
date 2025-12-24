# Supabaseデータベーススキーマ説明書

## 概要
家計簿アプリのためのSupabaseデータベーススキーマです。以下の機能をサポートしています：
- ユーザー認証・管理
- 支出の記録・管理
- カテゴリ管理
- レシート画像の保存・認識
- 予算管理
- 集計データのキャッシング
- 監査ログ

## テーブル一覧

### 1. users（ユーザー）
ユーザー情報を管理するテーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| auth_id | UUID | Supabase Auth ID（外部キー） |
| email | VARCHAR(255) | メールアドレス（ユニーク） |
| name | VARCHAR(255) | ユーザー名 |
| avatar_url | TEXT | プロフィール画像URL |
| currency | VARCHAR(3) | 通貨（デフォルト: JPY） |
| timezone | VARCHAR(50) | タイムゾーン |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

### 2. categories（カテゴリ）
支出カテゴリを管理するテーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| user_id | UUID | ユーザーID（外部キー） |
| name | VARCHAR(100) | カテゴリ名 |
| icon | VARCHAR(50) | アイコン絵文字 |
| color | VARCHAR(7) | カラーコード |
| is_default | BOOLEAN | デフォルトカテゴリフラグ |
| display_order | INTEGER | 表示順序 |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

**デフォルトカテゴリ：**
- 🍽️ 食費
- 🚗 交通費
- 🎬 娯楽
- 💡 光熱費
- 📱 通信費
- 🛒 日用品
- 🏥 医療費
- 👔 衣類
- 📚 教育
- 📌 その他

### 3. expenses（支出）
支出記録のメインテーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| user_id | UUID | ユーザーID（外部キー） |
| category_id | UUID | カテゴリID（外部キー） |
| amount | DECIMAL(12, 2) | 金額 |
| description | TEXT | 説明 |
| date | DATE | 支出日 |
| payment_method | VARCHAR(50) | 支払い方法 |
| tags | TEXT[] | タグ配列 |
| notes | TEXT | メモ |
| receipt_id | UUID | レシートID |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

**インデックス：**
- user_id, date（よく使用される検索条件） 
- category_id, date（集計用）
- created_at（最近順）

### 4. receipt_images（レシート画像）
レシート画像とOCR結果を管理
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| user_id | UUID | ユーザーID（外部キー） |
| expense_id | UUID | 支出ID（外部キー） |
| image_url | TEXT | 画像URL（Storage） |
| image_file_path | TEXT | ファイルパス |
| recognized_text | TEXT | OCR認識テキスト |
| recognized_items | JSONB | 認識された品物リスト |
| total_amount | DECIMAL(12, 2) | レシート合計額 |
| store_name | VARCHAR(255) | 店舗名 |
| receipt_date | DATE | レシート日付 |
| ocr_confidence | DECIMAL(3, 2) | OCR信頼度 |
| is_processed | BOOLEAN | 処理済みフラグ |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

### 5. budgets（予算）
月別の予算管理テーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| user_id | UUID | ユーザーID（外部キー） |
| category_id | UUID | カテゴリID（外部キー） |
| amount | DECIMAL(12, 2) | 予算額 |
| year | INTEGER | 年 |
| month | INTEGER | 月 |
| alert_threshold | DECIMAL(3, 0) | アラート閾値（%） |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

### 6. monthly_summary（月別集計）
パフォーマンス向上用のキャッシュテーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| user_id | UUID | ユーザーID |
| year | INTEGER | 年 |
| month | INTEGER | 月 |
| category_id | UUID | カテゴリID |
| total_amount | DECIMAL(12, 2) | 合計額 |
| count | INTEGER | 件数 |
| last_updated | TIMESTAMP | 最終更新日時 |

### 7. weekly_summary（週別集計）
週単位の集計キャッシュ
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| user_id | UUID | ユーザーID |
| year | INTEGER | 年 |
| week | INTEGER | 週 |
| start_date | DATE | 開始日 |
| end_date | DATE | 終了日 |
| total_amount | DECIMAL(12, 2) | 合計額 |
| count | INTEGER | 件数 |
| last_updated | TIMESTAMP | 最終更新日時 |

### 8. yearly_summary（年別集計）
年単位の集計キャッシュ
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| user_id | UUID | ユーザーID |
| year | INTEGER | 年 |
| total_amount | DECIMAL(12, 2) | 合計額 |
| count | INTEGER | 件数 |
| last_updated | TIMESTAMP | 最終更新日時 |

### 9. payment_methods（支払い方法）
支払い方法マスタテーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| user_id | UUID | ユーザーID（外部キー） |
| name | VARCHAR(100) | 方法名 |
| type | VARCHAR(50) | タイプ |
| is_active | BOOLEAN | 有効フラグ |
| created_at | TIMESTAMP | 作成日時 |

**デフォルト支払い方法：**
- 現金（cash）
- クレジットカード（credit_card）
- デビットカード（debit_card）
- 電子マネー（e_money）
- QRコード決済（qr_payment）

### 10. audit_logs（監査ログ）
すべての変更を記録するテーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| user_id | UUID | ユーザーID |
| action | VARCHAR(50) | アクション |
| entity_type | VARCHAR(50) | エンティティ型 |
| entity_id | UUID | エンティティID |
| old_values | JSONB | 変更前の値 |
| new_values | JSONB | 変更後の値 |
| ip_address | INET | IPアドレス |
| user_agent | TEXT | ユーザーエージェント |
| created_at | TIMESTAMP | 作成日時 |

## セキュリティ

### RLS（行レベルセキュリティ）
すべてのテーブルにRLSポリシーが設定されており、ユーザーは自分のデータのみアクセス可能です。

### ストレージセキュリティ
レシート画像はSupabase Storageの`receipts`バケットに保存されます（プライベート）。

## 使用方法

### 1. Supabaseプロジェクト作成
https://supabase.com でプロジェクトを作成してください。

### 2. SQLを実行
Supabase ダッシュボード → SQL Editor で `supabase_schema.sql` の内容をコピー＆ペーストして実行します。

### 3. 認証設定
Supabase ダッシュボード → Authentication で認証方法を設定します。

### 4. ストレージ設定
Supabase ダッシュボード → Storage で以下を作成：
- バケット名: `receipts`
- アクセス権: Private
- CORS: 許可

### 5. APIキー取得
Supabase ダッシュボード → Project Settings から API キーを取得します。

## クエリ例

### 今月の支出を取得
```sql
SELECT 
  c.name as category,
  SUM(e.amount) as total,
  COUNT(*) as count
FROM expenses e
JOIN categories c ON e.category_id = c.id
WHERE e.user_id = 'ユーザーID'
  AND EXTRACT(YEAR FROM e.date) = 2025
  AND EXTRACT(MONTH FROM e.date) = 12
GROUP BY c.name
ORDER BY total DESC;
```

### 週別支出を取得
```sql
SELECT 
  DATE_TRUNC('week', e.date) as week_start,
  SUM(e.amount) as total
FROM expenses e
WHERE e.user_id = 'ユーザーID'
  AND e.date >= CURRENT_DATE - INTERVAL '8 weeks'
GROUP BY DATE_TRUNC('week', e.date)
ORDER BY week_start DESC;
```

### 予算残高を確認
```sql
SELECT 
  c.name as category,
  b.amount as budget,
  COALESCE(SUM(e.amount), 0) as spent,
  b.amount - COALESCE(SUM(e.amount), 0) as remaining,
  ROUND(COALESCE(SUM(e.amount), 0) / b.amount * 100, 1) as usage_percent
FROM budgets b
LEFT JOIN expenses e ON b.category_id = e.category_id 
  AND EXTRACT(YEAR FROM e.date) = b.year
  AND EXTRACT(MONTH FROM e.date) = b.month
  AND e.user_id = b.user_id
JOIN categories c ON b.category_id = c.id
WHERE b.user_id = 'ユーザーID'
  AND b.year = 2025
  AND b.month = 12
GROUP BY c.name, b.amount;
```

## トラブルシューティング

**Q: RLS エラーが発生する**
A: Supabase ダッシュボードで、実行中のユーザーが正しく認証されているか確認してください。

**Q: ストレージへのアップロードができない**
A: ストレージバケットのRLSポリシーが正しく設定されているか確認してください。

**Q: パフォーマンスが遅い**
A: インデックスが正しく作成されているか確認し、複雑なクエリは`monthly_summary`などのキャッシュテーブルを活用してください。

## 今後の拡張

- 定期支出（サブスクリプション）管理
- 目標管理機能
- データ分析・レポート機能
- 複数アカウント対応
- 家計簿共有機能
