# Vercel 404エラー解決ガイド

## エラーの原因

404 NOT_FOUND エラーが発生した場合、以下のいずれかの原因が考えられます：

1. **APIエンドポイントが見つからない** - `/api/test-env` が存在しない
2. **ビルド設定が不足している** - `vercel.json` が未設定
3. **デプロイが完了していない** - Vercelがまだファイルを処理中
4. **Node.jsランタイムが設定されていない** - package.json に問題

## ✅ 解決手順

### 1. Vercelダッシュボードでデプロイを確認

```
Vercel Dashboard → Projects → 家計簿アプリ → Deployments
```

最新のデプロイが **Ready** 状態になっているか確認してください。

### 2. ビルドログを確認

1. 最新のデプロイをクリック
2. **Logs** タブをクリック
3. エラーメッセージがないか確認

```
✓ Build successful
✓ Functions ready
✓ Assets deployed
```

が表示されていれば成功です。

### 3. 環境変数が正しく設定されているか確認

Settings → Environment Variables で確認：
```
✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ SUPABASE_STORAGE_BUCKET
✅ NODE_ENV
```

### 4. 新しいデプロイをトリガー

以下のいずれかで新しいデプロイを開始：

**方法A: Git Push**
```bash
cd c:\Users\kakih\Downloads\kakeibo.416
git add .
git commit -m "fix: vercel.json と api/env-check.js を追加"
git push origin main
```

**方法B: Vercel UI から Redeploy**
- Vercel Dashboard → Deployments → 最新デプロイ → 右上の三点メニュー → Redeploy

### 5. テストページにアクセス

デプロイ完了後（3-5分後）、以下にアクセス：

```
https://your-vercel-domain.com/public/vercel-test.html
```

または

```
https://your-vercel-domain.com/api/env-check
```

## 📝 ファイル構成の確認

プロジェクトに以下のファイルが存在するか確認：

```
kakeibo.416/
├── api/
│   ├── env-check.js          ✅ 新規作成済み
│   └── test-env.js
├── public/
│   ├── vercel-test.html      ✅ 新規作成済み
│   └── env-test.html
├── package.json              ✅ 更新済み
├── vercel.json               ✅ 新規作成済み
├── index.html
├── app.js
└── ... その他ファイル
```

## 🔧 vercel.json 設定の確認

ファイルが以下の内容になっているか確認：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [...],
  "env": [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_STORAGE_BUCKET",
    "NODE_ENV"
  ]
}
```

## 🚀 デプロイ完了の確認

Vercelダッシュボードで以下が表示されたら成功：

```
✅ Build: 1.23s
✅ Functions: 2
✅ Ready
✅ 1 successful deployment in the last hour
```

## よくある404エラーと対処法

| エラーメッセージ | 原因 | 対処法 |
|---------------|------|-------|
| `NOT_FOUND` | APIが見つからない | `api/env-check.js` が存在するか確認 |
| `Cannot find module` | 依存関係がない | `npm install` を実行 |
| `No build output` | ビルド設定エラー | `vercel.json` を確認 |
| `Function suspended` | リソース不足 | Vercel設定を確認 |

## ⏱️ トラブルシューティング

### Q: デプロイ後も404が表示される
**A:** ブラウザキャッシュをクリアしてください：
```
Ctrl+Shift+R（Windows）
Cmd+Shift+R（Mac）
```

### Q: API は見つかるが HTML ページが見つからない
**A:** テストページの URL を確認：
```
正しい: https://domain.com/public/vercel-test.html
間違い: https://domain.com/vercel-test.html
```

### Q: デプロイに失敗している
**A:** Vercel ダッシュボードのログを確認：
1. Deployments → 失敗したデプロイ
2. Logs タブで詳細エラーを確認
3. エラーメッセージをコピーして Google 検索

## 次のステップ

デプロイが成功したら：

1. ✅ テストページで環境変数が ✅ で表示されるか確認
2. ✅ Supabase との接続をテスト
3. ✅ レシート認識機能が動作するか確認

## サポートリンク

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel API Reference](https://vercel.com/docs/api-reference)
- [Supabase Connection](https://supabase.com/docs/guides/api/rest-api)
