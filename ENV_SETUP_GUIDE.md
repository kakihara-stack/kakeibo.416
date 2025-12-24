# Supabase環境変数ガイド

## 必要な環境変数

### フロントエンド用（公開可能）
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### バックエンド用（シークレット）
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 環境変数の詳細

| キー | 用途 | 公開 | 説明 |
|-----|------|------|------|
| **SUPABASE_URL** | APIエンドポイント | ✅ 可 | Supabaseプロジェクトの基本URL |
| **SUPABASE_ANON_KEY** | クライアント認証 | ✅ 可 | クライアント側での認証・RLS制御 |
| **SUPABASE_SERVICE_ROLE_KEY** | サーバー認証 | ❌ 秘密 | サーバー側での管理者権限操作 |

## キーの取得方法

### 1. Supabaseダッシュボードにログイン
https://app.supabase.com

### 2. プロジェクト選択
左サイドバーからプロジェクトを選択

### 3. Project Settings へアクセス
- 左下の **Settings** アイコンをクリック
- または URL: `https://app.supabase.com/project/[project-id]/settings/api`

### 4. API Keys セクション
**Project URL** と **API keys** が表示されています

```
Project URL:
  https://your-project.supabase.co

API keys:
  anon public key:          your-anon-key-here
  service_role key (secret): your-service-role-key-here
```

### 5. 値をコピー
各キーの右側の **Copy** ボタンをクリック

## .envファイルテンプレート

プロジェクトのルートに `.env` ファイルを作成：

```bash
# Supabase設定
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# オプション：その他の設定
SUPABASE_STORAGE_BUCKET=receipts
NODE_ENV=development
```

## フロントエンド（Vite/React/Vue）での使用

### 環境変数命名規則
Vite を使用する場合、`VITE_` プレフィックスが必要：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### アクセス方法
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## Node.js での使用

### インストール
```bash
npm install @supabase/supabase-js
```

### コード例
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// またはサービスロールキーを使用する場合
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
```

## セキュリティのベストプラクティス

### ✅ 推奨事項
- `.env` ファイルを `.gitignore` に追加
- `SUPABASE_ANON_KEY` はクライアントで使用（公開可能）
- `SUPABASE_SERVICE_ROLE_KEY` はサーバー側のみで使用
- 定期的にキーをローテーション

### ❌ しないこと
- `.env` ファイルをGitCommitしない
- キーをソースコードにハードコーディングしない
- `SERVICE_ROLE_KEY` をクライアント側に公開しない
- キーをログに出力しない

## .gitignore設定

プロジェクトのルートの `.gitignore` に以下を追加：

```
# 環境変数ファイル
.env
.env.local
.env.*.local

# キャッシュ
node_modules/
.DS_Store

# ビルド出力
dist/
build/
```

## キーのローテーション（セキュリティ更新）

### 新しいキーの生成
1. Supabase ダッシュボード → Settings → API Keys
2. **Regenerate** ボタンをクリック
3. 古いキーを使用しているすべての場所を更新
4. 古いキーを無効化

※ キー再生成直後、古いキーは数分間は有効なため、アプリ更新時間に注意

## トラブルシューティング

### Q: "Invalid API key" エラーが出る
A: 以下を確認してください：
- URL と キー が正しくコピーされているか
- 環境変数の名前が正しいか
- `.env` ファイルが実装で正しく読み込まれているか

### Q: CORS エラーが発生する
A: Supabase ダッシュボードで以下を確認：
- Settings → API → CORS settings
- 使用しているドメインを許可リストに追加

### Q: ローカル開発でサーバーエラーが出る
A: 開発サーバーを再起動してください：
```bash
npm run dev
```

## 環境別設定例

### 開発環境（.env.development）
```env
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-anon-key
```

### 本番環境（.env.production）
```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key
```

## 関連リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase JavaScript クライアント](https://supabase.com/docs/reference/javascript/introduction)
- [環境変数の管理](https://supabase.com/docs/guides/api/rest-api#environment-variables)
