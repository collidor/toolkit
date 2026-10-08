/// <reference types="vite/client" />

declare const __TOOLKIT_VERSION__: string;

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "*.svelte" {
  const component: any;
  export default component;
}
