/// <reference types="vite/client" />
/// <reference types="vitest" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEV_REMOTE_API?: string;
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string;
  readonly VITE_PROXY_API_TARGET?: string;
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
