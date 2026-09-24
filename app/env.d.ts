/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAPERTRAIL_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
