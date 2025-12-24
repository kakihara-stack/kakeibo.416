// Vercel環境変数テスト用スクリプト
// api/test-env.js（Node.jsランタイム用）

export default function handler(request, response) {
  // 環境変数の確認
  const envVars = {
    // Supabase設定
    supabaseUrl: process.env.SUPABASE_URL ? '✅ 設定済み' : '❌ 未設定',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? '✅ 設定済み' : '❌ 未設定',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 設定済み' : '❌ 未設定',
    supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ? '✅ 設定済み' : '❌ 未設定',
    nodeEnv: process.env.NODE_ENV || 'production',
    
    // 詳細情報（本番では非表示）
    ...(process.env.NODE_ENV === 'development' && {
      supabaseUrlValue: process.env.SUPABASE_URL?.substring(0, 30) + '...',
      anonKeyLength: process.env.SUPABASE_ANON_KEY?.length || 0,
    })
  };

  response.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: envVars,
    allSet: Object.values(envVars).filter(v => typeof v === 'string' && v.includes('✅')).length === 4
  });
}
