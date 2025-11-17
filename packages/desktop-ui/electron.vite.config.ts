import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ["@json-schema-generator-monorepo/core"]
      }),
      tsconfigPaths()
    ]
  },
  preload: {
    plugins: [
      externalizeDepsPlugin(),
      tsconfigPaths()
    ]
  },
  renderer: {
    plugins: [
      react(),
      tsconfigPaths()
    ],
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src")
      }
    }
  }
});