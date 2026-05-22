import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionService } from "@/services/transactionService";
import type {
  FilterType,
  SummaryParams,
  TransactionRequest,
} from "@/types/transaction";
import { notify, TOAST_MESSAGES } from "@/lib/toast";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const TRANSACTION_KEYS = {
  all: ["transactions"] as const,
  // 👇 THÊM: search vào cache key để query cache riêng khi search
  list: (
    page: number,
    filter: FilterType,
    categoryId?: string,
    search?: string,
  ) => ["transactions", "list", page, filter, categoryId, search] as const,
  summary: (params: SummaryParams) =>
    ["transactions", "summary", params] as const,
};

const invalidateAll = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ["transactions"] });
  queryClient.invalidateQueries({ queryKey: ["chart"] });
  queryClient.invalidateQueries({ queryKey: ["categories"] });
  queryClient.invalidateQueries({ queryKey: ["wallets"] });
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Hook lấy danh sách transactions.
 *
 * @param search  text tìm kiếm (trong note + tên ví) — debounced ở component
 */
export const useTransactions = (
  page = 0,
  filter: FilterType = "ALL",
  categoryId?: string,
  search?: string, // 👈 THÊM
) => {
  return useQuery({
    queryKey: TRANSACTION_KEYS.list(page, filter, categoryId, search),
    queryFn: () =>
      transactionService.getAll(page, 20, filter, categoryId, search),
  });
};

export const useTransactionSummary = (params: SummaryParams = {}) => {
  return useQuery({
    queryKey: ["transactions", "summary", params],
    queryFn: () => transactionService.getSummary(params),
  });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransactionRequest) =>
      transactionService.create(payload),
    onSuccess: () => {
      invalidateAll(queryClient);
      notify.success(TOAST_MESSAGES.transaction.created);
    },
    onError: () => {
      notify.error(TOAST_MESSAGES.transaction.error);
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: TransactionRequest;
    }) => transactionService.update(id, payload),
    onSuccess: () => {
      invalidateAll(queryClient);
      notify.success(TOAST_MESSAGES.transaction.updated);
    },
    onError: () => {
      notify.error(TOAST_MESSAGES.transaction.error);
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionService.delete(id),
    onSuccess: () => {
      invalidateAll(queryClient);
      notify.success(TOAST_MESSAGES.transaction.deleted);
    },
  });
};
