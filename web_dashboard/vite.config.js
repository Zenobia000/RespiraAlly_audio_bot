import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: /\.(jsx|js|ts|tsx)$/,
    }),
  ],

  // 開發伺服器設定
  server: {
    allowedHosts: ["1d14b316b735.ngrok-free.app"], // 允許所有
    port: 3000,
    // host: true,
    open: true,
  },

  // 構建設定
  build: {
    outDir: "build",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          query: ["@tanstack/react-query"],
          charts: ["recharts"],
          calendar: [
            "@fullcalendar/core",
            "@fullcalendar/react",
            "@fullcalendar/daygrid",
            "@fullcalendar/interaction",
          ],
          utils: ["dayjs"],
        },
      },
    },
  },

  // 路徑別名
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@api": path.resolve(__dirname, "./src/api"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@assets": path.resolve(__dirname, "./src/asset"),
    },
  },

  // 靜態資源處理
  assetsInclude: [
    "**/*.png",
    "**/*.jpg",
    "**/*.jpeg",
    "**/*.gif",
    "**/*.svg",
    "**/*.m4a",
  ],

  // CSS 設定
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },

  // 測試環境變數
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
});
