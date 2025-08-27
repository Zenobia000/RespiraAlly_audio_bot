import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath, URL } from "node:url";
import eslint from "vite-plugin-eslint";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const __dirname = fileURLToPath(new URL(".", import.meta.url));

  // 載入環境變數：從專案根目錄載入（../../../）
  const rootDir = resolve(__dirname, "../../../");
  const env = loadEnv(mode, rootDir, "");

  console.log("🔧 Vite Config:", {
    mode,
    rootDir,
    envKeys: Object.keys(env).filter((key) => key.startsWith("VITE_")),
    __dirname,
  });

  return {
    // 設定基礎路徑為根路徑，標準 SPA 部署模式
    base: "/",

    plugins: [
      react({
        babel: {
          plugins: [["styled-jsx/babel", { optimizeForSpeed: true }]],
        },
      }),
      // 開發模式下啟用 ESLint (寬鬆模式)
      ...(command === "serve"
        ? [
            eslint({
              failOnWarning: false,
              failOnError: false,
            }),
          ]
        : []),
    ],

    resolve: {
      // 🔥 修復反模式：防止 React 多版本衝突，確保 chunk 邊界穩定
      dedupe: ["react", "react-dom"],

      alias: {
        // 根目錄
        "@": resolve(__dirname, "./src"),

        // 共享資源 (優先級最高)
        "@shared": resolve(__dirname, "./src/shared"),
        "@shared/api": resolve(__dirname, "./src/shared/api"),
        "@shared/components": resolve(__dirname, "./src/shared/components"),
        "@shared/contexts": resolve(__dirname, "./src/shared/contexts"),
        "@shared/hooks": resolve(__dirname, "./src/shared/hooks"),
        "@shared/utils": resolve(__dirname, "./src/shared/utils"),
        "@shared/config": resolve(__dirname, "./src/shared/config.js"),

        // 多應用架構
        "@apps": resolve(__dirname, "./src/apps"),
        "@dashboard": resolve(__dirname, "./src/apps/dashboard"),
        "@liff": resolve(__dirname, "./src/apps/liff"),

        // 通用資源
        "@components": resolve(__dirname, "./src/components"),
        "@pages": resolve(__dirname, "./src/pages"),
        "@api": resolve(__dirname, "./src/api"),
        "@utils": resolve(__dirname, "./src/utils"),
        "@hooks": resolve(__dirname, "./src/hooks"),
        "@contexts": resolve(__dirname, "./src/contexts"),
        "@assets": resolve(__dirname, "./src/assets"),
        "@styles": resolve(__dirname, "./src/styles"),
        "@services": resolve(__dirname, "./src/services"),

        // 🔥 修復反模式：強制使用專案根的 React 版本，避免路徑混亂
        react: resolve(__dirname, "node_modules/react"),
        "react-dom": resolve(__dirname, "node_modules/react-dom"),
      },
    },

    // 定義全域常數
    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version || "1.0.0"),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    server: {
      port: parseInt(env.VITE_PORT) || 3000,
      host: "0.0.0.0",
      open: true,
      cors: true,
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:5000",
          changeOrigin: true,
          // 🔧 修正：對於 ngrok HTTPS，設定 secure: true 並正確處理證書
          secure: env.VITE_API_BASE_URL?.startsWith("https://") ? true : false,
          rewrite: (path) => path.replace(/^\/api/, "/api/v1"),
          configure: (proxy, _options) => {
            proxy.on("error", (err, req, res) => {
              console.error("🚨 Proxy error:", err.message);
              console.error("Request URL:", req.url);
              // 返回更友好的錯誤訊息
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: false,
                  error: {
                    code: "PROXY_ERROR",
                    message: "API 代理錯誤，請檢查後端服務狀態"
                  }
                }));
              }
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log(
                "🔄 Proxy Request:",
                req.method,
                req.url,
                "→",
                proxyReq.path
              );
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              const status = proxyRes.statusCode;
              const statusIcon = status >= 400 ? "❌" : status >= 300 ? "⚠️" : "✅";
              console.log(
                `${statusIcon} Proxy Response:`,
                status,
                req.url
              );
            });
          },
        },
      },
      // HMR 配置
      hmr: {
        overlay: true,
      },
    },

    build: {
      outDir: "dist",
      sourcemap: command === "build" && mode !== "production",
      minify: "esbuild",
      target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],

      // 優化 CSS
      cssCodeSplit: true,
      cssMinify: true,

      rollupOptions: {
        output: {
          // 智慧程式碼分割
          manualChunks: (id) => {
            // Vendor 分割 - 修復 React 依賴問題
            if (id.includes("node_modules")) {
              // 🔥 修復：將 React 和核心 React 庫合併到 vendor
              if (
                id.includes("react") ||
                id.includes("react-dom") ||
                id.includes("react-router") ||
                id.includes("@tanstack/react-query") ||
                id.includes("react-hook-form")
              ) {
                return "vendor"; // 統一放在 vendor 中
              }
              // 圖表庫（獨立，但大）
              if (id.includes("recharts") || id.includes("d3")) {
                return "charts-vendor";
              }
              // 日曆庫（獨立，但大）
              if (id.includes("@fullcalendar")) {
                return "calendar-vendor";
              }
              // 其他第三方庫
              return "vendor";
            }

            // 應用分割
            if (id.includes("/src/apps/dashboard/")) {
              return "dashboard-app";
            }
            if (id.includes("/src/apps/liff/")) {
              return "liff-app";
            }

            // 共享模組
            if (id.includes("/src/shared/")) {
              return "shared";
            }
          },

          // 檔案命名
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId;
            if (facadeModuleId) {
              const fileName = facadeModuleId
                .split("/")
                .pop()
                .replace(/\.[^.]*$/, "");
              return `js/[name]-${fileName}-[hash].js`;
            }
            return "js/[name]-[hash].js";
          },
          entryFileNames: "js/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split(".");
            const ext = info[info.length - 1];
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
              return `images/[name]-[hash].${ext}`;
            }
            if (/\.(woff2?|ttf|eot)$/.test(assetInfo.name)) {
              return `fonts/[name]-[hash].${ext}`;
            }
            if (/\.(css)$/.test(assetInfo.name)) {
              return `css/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          },
        },

        // 🔥 修復反模式：永遠不外部化 React，保持 chunk 穩定性
        // 靜態 CDN 只負責檔案分發，不涉及程式碼切分
        external: [],
      },

      // 警告配置
      chunkSizeWarningLimit: 1000,

      // 預載入配置
      modulePreload: {
        polyfill: true,
      },
    },

    // 優化依賴預構建
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@tanstack/react-query",
        "recharts",
        "dayjs",
        "clsx",
      ],
      exclude: [
        // 排除較大的可選依賴
      ],
    },

    // CSS 配置
    css: {
      devSourcemap: true,
      modules: {
        localsConvention: "camelCase",
      },
    },

    // 測試配置
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/setupTests.js"],
    },
  };
});
