import { defineConfig } from "vite";

export default defineConfig({
  base: "/livias-kalas/",
  build: {
    assetsInlineLimit: 0,
  },
  publicDir: "public",
});
