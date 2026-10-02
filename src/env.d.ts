// Server-only secrets (no PUBLIC_ prefix, so they are never shipped to the browser).
interface ImportMetaEnv {
  readonly ADZUNA_APP_ID?: string;
  readonly ADZUNA_APP_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
