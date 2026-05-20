import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoryService } from "@/services/categoryService";
import type { CategoryRequest, CategoryResponse } from "@/types/category";
import { notify } from "@/lib/toast";
import { getApiErrorMessage } from "@/utils/errorUtils";
import type { TopSpendingParams } from "@/services/categoryService";
import type { TransactionType } from "@/types/transaction";

// ── Cache keys ─────────────────────────────────────────────
// Pattern hierarchy: invalidate ['categories'] sẽ clear cả ['categories', 'EXPENSE']
export const CATEGORY_KEYS = {
  all: ["categories"] as const,
  byType: (type: TransactionType) => ["categories", type] as const,
};

// ════════════════════════════════════════════════════════════
// QUERIES
// ════════════════════════════════════════════════════════════

/**
 * Lấy tất cả categories của user.
 * Optional: filter theo type.
 */
export const useCategories = (type?: TransactionType) => {
  return useQuery({
    queryKey: type ? CATEGORY_KEYS.byType(type) : CATEGORY_KEYS.all,
    queryFn: () => categoryService.getAll(type),
    staleTime: 5 * 60 * 1000, // 5 phút — categories ít thay đổi
  });
};

// ════════════════════════════════════════════════════════════
// MUTATIONS
// ════════════════════════════════════════════════════════════

/**
 * Tạo category mới.
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CategoryRequest) => categoryService.create(request),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["chart"] });
      notify.success(`Đã tạo danh mục "${data.name}"`);
    },

    onError: (err: unknown) => {
      notify.error(getApiErrorMessage(err));
    },
  });
};

/**
 * Update category.
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: CategoryRequest }) =>
      categoryService.update(id, request),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["chart"] });
      notify.success(`Đã cập nhật "${data.name}"`);
    },

    onError: (err: unknown) => {
      notify.error(getApiErrorMessage(err));
    },
  });
};

/**
 * Xóa category. Transactions liên quan vẫn còn nhưng category_id = NULL.
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoryService.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["chart"] });
      notify.success("Đã xóa danh mục");
    },

    onError: (err: unknown) => {
      notify.error(getApiErrorMessage(err));
    },
  });
};

export const useTopSpending = (params: TopSpendingParams = {}) => {
  return useQuery({
    queryKey: ["categories", "top-spending", params],
    queryFn: () => categoryService.getTopSpending(params),
    staleTime: 2 * 60 * 1000,
  });
};
