/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHEM_AI_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
