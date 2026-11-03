// Vite resolves these providers from Studio's own @sanity/ui installation.
declare module "test-studio-ui" {
  import type { ComponentType, PropsWithChildren } from "react";
  export const LayerProvider: ComponentType<PropsWithChildren>;
  export const ThemeProvider: ComponentType<PropsWithChildren>;
}
declare module "test-studio-toast" {
  import type { ComponentType, PropsWithChildren } from "react";
  export const ToastProvider: ComponentType<PropsWithChildren>;
}
declare module "test-studio-style";
