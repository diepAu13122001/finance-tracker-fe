import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { walletService } from "@/services/walletService";
import { transactionService } from "@/services/transactionService";
import type { WalletRequest } from "@/types/wallet";
import { notify } from "@/lib/toast";
import { getApiErrorMessage } from "@/utils/errorUtils";

export const WALLET_KEYS = {
  all: ["wallets"] as const,
  active: ["wallets", "active"] as const,
  count: ["wallets", "count"] as const,
  transactions: (walletId: string, page: number) =>
    ["wallets", "transactions", walletId, page] as const,
};

const invalidateWallets = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: WALLET_KEYS.all });
  qc.invalidateQueries({ queryKey: WALLET_KEYS.active });
  qc.invalidateQueries({ queryKey: WALLET_KEYS.count });
};

export const useWallets = (enabled = true) =>
  useQuery({
    queryKey: WALLET_KEYS.all,
    queryFn: walletService.getAll,
    staleTime: 2 * 60 * 1000,
    enabled,
  });

export const useActiveWallets = (enabled = true) =>
  useQuery({
    queryKey: WALLET_KEYS.active,
    queryFn: walletService.getActive,
    staleTime: 2 * 60 * 1000,
    enabled,
  });

/**
 * Số ví ACTIVE — dùng để hiển thị "X/5 ví" cho Free user.
 * Không bao gồm ví đã đóng (CANCELLED) vì đóng ví giải phóng slot.
 */
export const useWalletCount = () =>
  useQuery({
    queryKey: WALLET_KEYS.count,
    queryFn: walletService.getCount,
    staleTime: 2 * 60 * 1000,
  });

/**
 * Lấy tất cả transactions của 1 wallet cụ thể.
 * Bao gồm cả transfer_in/out — dùng trong WalletTransactionsDrawer.
 */
export const useTransactionsByWallet = (
  walletId: string,
  page = 0,
  enabled = true,
) =>
  useQuery({
    queryKey: WALLET_KEYS.transactions(walletId, page),
    queryFn: () => transactionService.getAllByWallet(walletId, page, 20),
    enabled: enabled && !!walletId,
    staleTime: 1 * 60 * 1000,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useCreateWallet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: WalletRequest) => walletService.create(req),
    onSuccess: (data) => {
      invalidateWallets(qc);
      notify.success(`Đã tạo ví "${data.name}"`);
    },
    onError: (err) => notify.error(getApiErrorMessage(err)),
  });
};

export const useUpdateWallet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: WalletRequest }) =>
      walletService.update(id, request),
    onSuccess: (data) => {
      invalidateWallets(qc);
      notify.success(`Đã cập nhật "${data.name}"`);
    },
    onError: (err) => notify.error(getApiErrorMessage(err)),
  });
};

export const useCancelWallet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletService.cancel(id),
    onSuccess: (data) => {
      invalidateWallets(qc);
      notify.success(`Đã đóng ví "${data.name}" — slot đã được giải phóng`);
    },
    onError: (err) => notify.error(getApiErrorMessage(err)),
  });
};

/**
 * Mở lại ví đã đóng.
 * Nếu Free user hết slot → backend trả 403 với PLAN_UPGRADE_REQUIRED.
 */
export const useReopenWallet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletService.reopen(id),
    onSuccess: (data) => {
      invalidateWallets(qc);
      notify.success(`Đã mở lại ví "${data.name}"`);
    },
    onError: (err) => notify.error(getApiErrorMessage(err)),
  });
};

export const useDeleteWallet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletService.delete(id),
    onSuccess: () => {
      invalidateWallets(qc);
      qc.invalidateQueries({ queryKey: ["transactions"] });
      notify.success("Đã xóa ví");
    },
    onError: (err) => notify.error(getApiErrorMessage(err)),
  });
};
