import { api } from "@/lib/api";
import type { WalletRequest, WalletResponse } from "@/types/wallet";

export const walletService = {
  /** Lấy TẤT CẢ ví (bao gồm CANCELLED) */
  getAll: async (): Promise<WalletResponse[]> => {
    const { data } = await api.get<WalletResponse[]>("/api/wallets");
    return data;
  },

  /** Chỉ lấy ví ACTIVE — dùng cho WalletSelector, WalletSummaryWidget */
  getActive: async (): Promise<WalletResponse[]> => {
    const { data } = await api.get<WalletResponse[]>("/api/wallets/active");
    return data;
  },

  /**
   * Số ví ACTIVE hiện tại.
   * Free user giới hạn 5 ví ACTIVE — ví đã đóng (CANCELLED) không tính.
   * Đóng ví → giải phóng slot → có thể tạo ví mới hoặc reopen ví cũ.
   */
  getCount: async (): Promise<{ total: number; limit: number }> => {
    const { data } = await api.get<{ total: number; limit: number }>(
      "/api/wallets/count",
    );
    return data;
  },

  create: async (request: WalletRequest): Promise<WalletResponse> => {
    const { data } = await api.post<WalletResponse>("/api/wallets", request);
    return data;
  },

  update: async (
    id: string,
    request: WalletRequest,
  ): Promise<WalletResponse> => {
    const { data } = await api.put<WalletResponse>(
      `/api/wallets/${id}`,
      request,
    );
    return data;
  },

  /** Đóng ví — giải phóng 1 slot ACTIVE cho Free user */
  cancel: async (id: string): Promise<WalletResponse> => {
    const { data } = await api.patch<WalletResponse>(
      `/api/wallets/${id}/cancel`,
    );
    return data;
  },

  /**
   * Mở lại ví đã đóng.
   * Backend kiểm tra: Free user phải có slot trống (< 5 ví ACTIVE).
   */
  reopen: async (id: string): Promise<WalletResponse> => {
    const { data } = await api.patch<WalletResponse>(
      `/api/wallets/${id}/reopen`,
    );
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/wallets/${id}`);
  },
};
