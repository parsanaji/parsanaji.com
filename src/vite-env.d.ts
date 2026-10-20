/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** '1' on preview builds (CI on every branch except main, spec 7.3.2): debug hooks and the ?debug panel */
  readonly VITE_PN_DEBUG?: string;
}
