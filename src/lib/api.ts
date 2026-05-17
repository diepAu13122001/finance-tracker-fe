import axios from "axios";
import { notify } from "@/lib/toast";
import { useAuthStore } from "@/stores/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorCode = error.response?.data?.error;

    // 401 — hết hạn
    if (status === 401) {
      useAuthStore.getState().logout();
      notify.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // 403 PLAN_UPGRADE_REQUIRED:
    // Trước đây dùng window.location.href → xóa history → không quay lại được.
    // Fix: KHÔNG redirect ở đây. Mỗi component tự xử lý qua getErrorCode(err).
    // WalletController.getAll/getActive đã bỏ @RequiresPlan → Free user không còn
    // nhận 403 khi vào trang Wallets.
    if (status === 403 && errorCode === "PLAN_UPGRADE_REQUIRED") {
      console.debug("[API] 403 PLAN_UPGRADE_REQUIRED — component will handle");
      return Promise.reject(error);
    }

    if (!error.response) {
      console.warn("[API] Network error", error.message);
    }

    return Promise.reject(error);
  },
);
