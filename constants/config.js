import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

export const SUPABASE_URL = extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
export const EXTRACTION_API_URL = 'https://price-tracker-backend-production-ea26.up.railway.app';
export const EXTRACTION_API_KEY = 'pricetrack-dev-key';
