import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// A custom storage implementation that uses sessionStorage and is server-side safe.
// This ensures the user is logged out when the browser tab is closed.
const safeSessionStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(key);
    }
  },
};

const options: SupabaseClientOptions<"public"> = {
    auth: {
        storage: safeSessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
};


// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, options);