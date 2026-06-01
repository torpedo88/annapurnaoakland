import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // `server-only` is a build-time marker with no runtime install; map it to a
      // no-op so modules guarded by it (e.g. @/lib/env) can be unit-tested.
      "server-only": "next/dist/compiled/server-only/empty.js",
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
