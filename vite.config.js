import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  // Builds are served from https://tommyknocker81.github.io/vitaly-encounters-prototype/
  base: command === "build" ? "/vitaly-encounters-prototype/" : "/",
  plugins: [react()],
  server: { port: 5178, strictPort: true },
}));
