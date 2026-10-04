import { execSync } from "node:child_process";
import { defineConfig, type Plugin } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

// Identifies this build so an installed PWA can tell whether a newer deploy exists.
// Vercel provides the commit; locally fall back to git, then to the build time.
function resolveBuildId() {
  const vercel = process.env["VERCEL_GIT_COMMIT_SHA"];
  if (vercel) return vercel.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return String(Date.now());
  }
}

const buildId = resolveBuildId();

/** Publishes the build id as /version.json next to the client assets. */
function versionFile(): Plugin {
  return {
    name: "autovault-version-file",
    generateBundle() {
      if (this.environment.name !== "client") return;
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({ id: buildId }),
      });
    },
  };
}

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    nitro(),
    viteReact(),
    versionFile(),
  ],
});
