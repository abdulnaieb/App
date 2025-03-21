import { createClient } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"

const supabaseUrl = "https://dqvjhszggrsvzclvktqj.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdmpoc3pnZ3JzdnpjbHZrdHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyMDMyMTksImV4cCI6MjA1NTc3OTIxOX0.etLYa58X12cLMTwchpGIpnT-mv-MWHWGqUM15_T0TiE"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

