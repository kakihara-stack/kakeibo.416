// Vercel環境変数テスト用API
// api/env-check.js

export default function handler(req, res) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 環境変数の確認
  const envVars = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      supabaseUrl: process.env.SUPABASE_URL ? '✅ 設定済み' : '❌ 未設定',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? '✅ 設定済み' : '❌ 未設定',
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 設定済み' : '❌ 未設定',
      supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ? '✅ 設定済み' : '❌ 未設定',
      nodeEnv: process.env.NODE_ENV || 'production',
    },
    allSet: !!(
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_STORAGE_BUCKET
    ),
    // 本番環境では実際の値を表示しない
    debug: process.env.NODE_ENV === 'development' ? {
      supabaseUrl: process.env.SUPABASE_URL?.substring(0, 40) + '...',
      anonKeyLength: process.env.SUPABASE_ANON_KEY?.length || 0,
    } : null
  };

  res.status(200).json(envVars);
}
