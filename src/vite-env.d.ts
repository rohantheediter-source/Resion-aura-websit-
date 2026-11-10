/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_STORE_NAME?: string;
  readonly VITE_CURRENCY_SYMBOL?: string;
  readonly VITE_FREE_SHIPPING_THRESHOLD?: string;
  readonly VITE_STANDARD_SHIPPING_FEE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

