import type { CategoryResponse } from "./category";
import type { WalletResponse } from "./wallet";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type FilterType = "ALL" | "INCOME" | "EXPENSE" | "TRANSFER";

// ─── Request gửi lên API ──────────────────────────────────────────────────────

export interface TransactionRequest {
  type: TransactionType;
  amount: number;
  note?: string;
  transactionDate: string; // "YYYY-MM-DD"
  currency?: string;
  categoryId?: string | null;
  walletId?: string | null; // nguồn tiền (hoặc ví NGUỒN cho TRANSFER)
  targetWalletId?: string | null; // ví ĐÍCH — chỉ dùng khi type = TRANSFER
}

// ─── Response từ API ──────────────────────────────────────────────────────────

export interface TransactionResponse {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  note: string | null;
  transactionDate: string;
  source: string; // 'manual' | 'transfer_out' | 'transfer_in'
  createdAt: string;
  category: CategoryResponse | null;
  wallet: WalletResponse | null;
  // Transfer fields
  transferPairId?: string | null;
  transferSourceWalletName?: string | null; // tên ví nguồn trong transfer
  transferTargetWalletName?: string | null; // tên ví đích trong transfer
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface TransactionPage {
  content: TransactionResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  transactionLimit: number; // -1 = không giới hạn
  limitReached: boolean;
  startDate?: string;
  endDate?: string;
}

export interface SummaryParams {
  year?: number;
  month?: number; // 1-12
  quarter?: number; // 1-4
}
