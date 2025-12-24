// Supabase クライアント初期化ヘルパー
// supabaseClient.js

import { createClient } from '@supabase/supabase-js'

// 環境変数から取得
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

// バリデーション
if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable')
}
if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable')
}

// Supabase クライアント初期化
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// クライアントの確認
export function checkSupabaseConnection() {
  if (supabase) {
    console.log('✅ Supabase クライアントが正常に初期化されました')
    return true
  }
  console.error('❌ Supabase クライアントの初期化に失敗しました')
  return false
}

// 使用例：
// import { supabase } from './supabaseClient.js'
//
// // ユーザー認証
// const { data, error } = await supabase.auth.signUp({
//   email: 'user@example.com',
//   password: 'password'
// })
//
// // データベースクエリ
// const { data: expenses, error } = await supabase
//   .from('expenses')
//   .select('*')
//   .eq('user_id', userId)
//
// // ストレージアップロード
// const { data, error } = await supabase.storage
//   .from('receipts')
//   .upload(`${userId}/receipt-${Date.now()}.jpg`, file)
