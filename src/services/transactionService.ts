import { api } from "@/lib/api";
import type {
  FilterType,
  SummaryParams,
  TransactionPage,
  TransactionRequest,
  TransactionResponse,
  TransactionSummary,
} from "@/types/transaction";

export type {
  TransactionType,
  FilterType,
  TransactionRequest,
  TransactionResponse,
  TransactionPage,
  TransactionSummary,
  SummaryParams,
} from "@/types/transaction";

export const transactionService = {
  create: async (data: TransactionRequest): Promise<TransactionResponse> => {
    const response = await api.post<TransactionResponse>(
      "/api/transactions",
      data,
    );
    return response.data;
  },

  /**
   * Lấy danh sách giao dịch.
   *
   * @param search  text tìm kiếm (optional) — backend tìm trong note + tên ví
   *                Truyền undefined hoặc "" → không search, lấy theo filter bình thường
   */
  getAll: async (
    page = 0,
    size = 20,
    filter: FilterType = "ALL",
    categoryId?: string,
    search?: string, // 👈 THÊM
  ): Promise<TransactionPage> => {
    const params: Record<string, unknown> = { page, size };

    if (filter !== "ALL") params.type = filter;
    if (categoryId) params.categoryId = categoryId;
    // Chỉ gửi search nếu có nội dung (tránh gửi param rỗng lên server)
    if (search?.trim()) params.search = search.trim();

    const response = await api.get<TransactionPage>("/api/transactions", {
      params,
    });
    return response.data;
  },

  getAllByWallet: async (
    walletId: string,
    page = 0,
    size = 20,
  ): Promise<TransactionPage> => {
    const response = await api.get<TransactionPage>("/api/transactions", {
      params: { page, size, walletId },
    });
    return response.data;
  },

  getSummary: async (
    params: SummaryParams = {},
  ): Promise<TransactionSummary> => {
    const response = await api.get<TransactionSummary>(
      "/api/transactions/summary",
      { params },
    );
    return response.data;
  },

  update: async (
    id: string,
    data: TransactionRequest,
  ): Promise<TransactionResponse> => {
    const response = await api.put<TransactionResponse>(
      `/api/transactions/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/transactions/${id}`);
  },
};
