import { api } from "@/lib/api";
import type { CategoryRequest, CategoryResponse, TopSpendingItem } from "@/types/category";
import type { TransactionType } from "./transactionService";

export interface TopSpendingParams {
  year?: number;
  month?: number;
  quarter?: number;
  limit?: number;
}

export const categoryService = {
  /**
   * Lấy danh sách categories.
   * Optional: filter theo type INCOME hoặc EXPENSE.
   */
  getAll: async (type?: TransactionType): Promise<CategoryResponse[]> => {
    const params = type ? { type } : undefined;
    const { data } = await api.get<CategoryResponse[]>("/api/categories", {
      params,
    });
    return data;
  },

  /**
   * Tạo category mới.
   */
  create: async (request: CategoryRequest): Promise<CategoryResponse> => {
    const { data } = await api.post<CategoryResponse>(
      "/api/categories",
      request,
    );
    return data;
  },

  /**
   * Update category.
   */
  update: async (
    id: string,
    request: CategoryRequest,
  ): Promise<CategoryResponse> => {
    const { data } = await api.put<CategoryResponse>(
      `/api/categories/${id}`,
      request,
    );
    return data;
  },

  /**
   * Xóa category. Transactions liên quan sẽ có category_id = NULL.
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/categories/${id}`);
  },

  getTopSpending: async (
    params: TopSpendingParams = {},
  ): Promise<TopSpendingItem[]> => {
    const { data } = await api.get<TopSpendingItem[]>(
      "/api/categories/top-spending",
      { params },
    );
    return data;
  },
};
