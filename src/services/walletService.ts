import { api } from "@/lib/api";
import type { WalletRequest, WalletResponse } from "@/types/wallet";
import type { TransactionPage } from "@/types/transaction";

export const walletService = {
  getAll: async (): Promise<WalletResponse[]> => {
    const { data } = await api.get<WalletResponse[]>("/api/wallets");
    return data;
  },

  getActive: async (): Promise<WalletResponse[]> => {
    const { data } = await api.get<WalletResponse[]>("/api/wallets/active");
    return data;
  },

  /** Tổng số ví của user (bao gồm đã đóng) — dùng để hiển thị giới hạn Free user */
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

  cancel: async (id: string): Promise<WalletResponse> => {
    const { data } = await api.patch<WalletResponse>(
      `/api/wallets/${id}/cancel`,
    );
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/wallets/${id}`);
  },
};
