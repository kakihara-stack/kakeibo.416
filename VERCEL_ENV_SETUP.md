# Vercel環境変数設定確認ガイド

## ✅ 確認チェックリスト

### 1. Vercelダッシュボード での確認

以下の手順でVercelで設定を確認してください：

1. **Vercelプロジェクトページへアクセス**
   - https://vercel.com/dashboard/projects

2. **家計簿アプリプロジェクトをクリック**

3. **Settings タブ をクリック**
   - 左サイドバーから **Settings**

4. **Environment Variables を選択**
   - Settings 内の **Environment Variables**

5. **設定確認**
   以下の環境変数が表示されているか確認：
   ```
   ✅ SUPABASE_URL
   ✅ SUPABASE_ANON_KEY
   ✅ SUPABASE_SERVICE_ROLE_KEY
   ✅ SUPABASE_STORAGE_BUCKET
   ✅ NODE_ENV
   ```

### 2. デプロイメント確認

1. **Deployments タブ をクリック**
2. **最新のデプロイをクリック**
3. **Logs を確認**
   - ビルド時にエラーがないか確認
   - 特に `SUPABASE_URL` に関するエラー

### 3. ライブサイトで確認

デプロイ後、以下のURLにアクセスしてテスト：
```
https://your-vercel-domain.com/api/test-env
```

レスポンス例（成功時）：
```json
{
  "status": "ok",
  "environment": {
    "supabaseUrl": "✅ 設定済み",
    "supabaseAnonKey": "✅ 設定済み",
    "supabaseServiceRoleKey": "✅ 設定済み",
    "supabaseStorageBucket": "✅ 設定済み",
    "nodeEnv": "production",
    "allSet": true
  }
}
```

## 🔧 環境別設定

### Production（本番環境）
```
Environment: Production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
SUPABASE_STORAGE_BUCKET=receipts
NODE_ENV=production
```

### Preview（プレビュー環境）
```
Environment: Preview
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key
SUPABASE_STORAGE_BUCKET=receipts-staging
NODE_ENV=staging
```

### Development（開発環境）
```
Environment: Development
SUPABASE_URL=https://your-dev-project.supabase.co
SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key
SUPABASE_STORAGE_BUCKET=receipts-dev
NODE_ENV=development
```

## 🐛 トラブルシューティング

### よくある問題と解決方法

| 問題 | 原因 | 解決方法 |
|------|------|---------|
| **環境変数が見つからない** | 環境変数が設定されていない | Vercel Settings で環境変数を追加 |
| **エラー: Invalid API key** | キーの値が違う | Supabase Settings で正しいキーをコピー |
| **Supabaseに接続できない** | URLが違う | `https://` で始まるURL全体をコピー |
| **500エラーが出る** | SERVICE_ROLE_KEY がない | Vercel Settings に SERVICE_ROLE_KEY を追加 |

### Q: 環境変数が反映されない
**A:** 以下の手順を実行してください：

1. Vercel ダッシュボードで環境変数を追加
2. **新しいデプロイをトリガー**
   ```bash
   git push origin main
   ```
   または Vercel UI から Redeploy ボタンをクリック
3. デプロイ完了後（5-10分）、ライブサイトで確認

### Q: 古い値がキャッシュされている
**A:** ブラウザキャッシュをクリアしてください：

```bash
# または Hard Reload
Ctrl + Shift + R（Windows）
Cmd + Shift + R（Mac）
```

## 📝 vercel.json設定例

プロジェクトルートに `vercel.json` を作成：

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": null,
  "env": [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_STORAGE_BUCKET",
    "NODE_ENV"
  ],
  "regions": ["icn1", "sfo1"]
}
```

## 🔒 セキュリティチェック

### ✅ 実装済みか確認：

- [ ] `SUPABASE_ANON_KEY` はフロントエンドで使用可（公開キー）
- [ ] `SUPABASE_SERVICE_ROLE_KEY` はバックエンド API のみで使用
- [ ] `.env` ファイルは `.gitignore` に含まれている
- [ ] Vercel Preview デプロイもプレビュー環境キーで設定されている
- [ ] 本番キーは別の Supabase プロジェクトを使用している

## 🚀 デプロイメントフロー

```
Git Push → Vercel Deployment → Environment Variables Auto-Inject
                                   ↓
                        api/test-env で確認
                                   ↓
                             デプロイ成功
```

## 環境変数の確認コマンド

### 1. ローカルで環境変数をテスト
```bash
# .env ファイルを確認
cat .env

# Node.js で環境変数をテスト
node -e "console.log(process.env.SUPABASE_URL)"
```

### 2. ビルド時のログを確認
Vercel ダッシュボード → Deployments → 最新デプロイ → Logs

以下が表示されていれば成功：
```
> Environment variables are set ✓
> Loading environment variables...
```

## 参考リンク

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel API 設定](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Supabase での環境変数設定](https://supabase.com/docs/guides/api/rest-api#environment-variables)
