import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { walletService } from "@/services/walletService";
import { transactionService } from "@/services/transactionService";
import type { WalletRequest } from "@/types/wallet";
import { notify } from "@/lib/toast";
import { getApiErrorMessage } from "@/utils/errorUtils";

export const WALLET_KEYS = {
  all: ["wallets"] as const,
  active: ["wallets", "active"] as const,
  transactions: (walletId: string, page: number) =>
    ["wallets", "transactions", walletId, page] as const,
};

const invalidateWallets = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: WALLET_KEYS.all });
  qc.invalidateQueries({ queryKey: ["wallets", "active"] });
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
 * Lấy tất cả transactions của một wallet cụ thể.
 * Dùng trong WalletTransactionsDrawer.
 * Bao gồm cả transfer_in và transfer_out của ví đó.
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
    staleTime: 1 * 60 * 1000, // 1 phút
  });

export const useWalletCount = () =>
  useQuery({
    queryKey: ["wallets", "count"],
    queryFn: walletService.getCount,
    staleTime: 2 * 60 * 1000,
  });

export const useCreateWallet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: WalletRequest) => walletService.create(req),
    onSuccess: (data) => {
      invalidateWallets(qc);
      qc.invalidateQueries({ queryKey: ["wallets", "count"] });
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
    onSuccess: () => {
      invalidateWallets(qc);
      qc.invalidateQueries({ queryKey: ["wallets", "count"] });
      notify.success("Đã đóng ví");
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
      qc.invalidateQueries({ queryKey: ["wallets", "count"] });
      notify.success("Đã xóa ví");
    },
    onError: (err) => notify.error(getApiErrorMessage(err)),
  });
};
