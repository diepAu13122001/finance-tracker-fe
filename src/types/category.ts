import type { TransactionType } from "./transaction";

export interface CategoryResponse {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  createdAt: string;
  transactionCount?: number;
  totalAmount?: number;
  parentCategoryId?: string | null;
  parentName?: string | null;
  children?: CategoryResponse[];
  monthlyBudget?: number | null;
  budgetStartedAt?: string | null; // ── THÊM MỚI ──
  effectiveBudget?: number;
  currentMonthSpent?: number;
  rolloverAmount?: number;
  budgetProgressPercent?: number;
  overBudget?: boolean;
  warningBudget?: boolean;
}

export interface CategoryRequest {
  name: string;
  icon?: string;
  color?: string;
  type: TransactionType;
  parentCategoryId?: string | null;
  monthlyBudget?: number | null;
}

// ── Top spending — đồng nhất với CategoryResponse ──
export interface TopSpendingItem {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  monthlyBudget: number | null;
  effectiveBudget: number | null; // ── THÊM MỚI ──
  rolloverAmount: number | null; // ── THÊM MỚI ──
  totalSpent: number;
  transactionCount: number;
  budgetProgressPercent: number | null;
  overBudget: boolean;
}

export const CATEGORY_ICONS = [
  "tag",
  "utensils",
  "car",
  "shopping-bag",
  "home",
  "heart",
  "gift",
  "briefcase",
  "book",
  "coffee",
  "plane",
  "dumbbell",
  "film",
  "wallet",
  "trending-up",
  "banknote",
] as const;

export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

export const CATEGORY_COLORS = [
  "#82b01e",
  "#ff748b",
  "#b267e0",
  "#42b9bc",
  "#f59e0b",
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
] as const;
