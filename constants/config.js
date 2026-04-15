import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

export const SUPABASE_URL = extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const EXTRACTION_API_URL = extra.extractionApiUrl || process.env.EXPO_PUBLIC_EXTRACTION_API_URL;
export const EXTRACTION_API_KEY = extra.extractionApiKey || process.env.EXPO_PUBLIC_EXTRACTION_API_KEY;
