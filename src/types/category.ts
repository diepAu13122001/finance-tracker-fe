import type { TransactionType } from "./transaction";

// ── Response từ API ─────────────────────────────────────────
export interface CategoryResponse {
  id: string;
  name: string;
  icon: string; // tên icon từ lucide-react
  color: string; // hex color #RRGGBB
  type: TransactionType;
  createdAt: string;
  transactionCount?: number; // optional — chỉ có ở /api/categories
  totalAmount?: number; // 👈 THÊM MỚI: tổng tiền all-time của category
  parentCategoryId?: string | null;
  parentName?: string | null;
  children?: CategoryResponse[]; // chỉ có khi GET tree
}

// ── Request gửi lên API ─────────────────────────────────────
export interface CategoryRequest {
  name: string;
  icon?: string; // optional, backend default 'tag'
  color?: string; // optional, backend default '#82b01e'
  type: TransactionType;
  parentCategoryId?: string | null;
}

// ── Icon list cho CategorySelector ──────────────────────────
// Khớp với tên icon trong lucide-react để render được
export const CATEGORY_ICONS = [
  "tag",
  "utensils", // ăn uống
  "car", // di chuyển
  "shopping-bag", // mua sắm
  "home", // nhà cửa
  "heart", // sức khỏe
  "gift", // quà cáp
  "briefcase", // công việc
  "book", // học hành
  "coffee", // cafe
  "plane", // du lịch
  "dumbbell", // thể thao
  "film", // giải trí
  "wallet", // lương
  "trending-up", // đầu tư
  "banknote", // tiền mặt
] as const;

export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

// ── Color list cho CategorySelector ─────────────────────────
export const CATEGORY_COLORS = [
  "#82b01e", // green
  "#ff748b", // pink
  "#b267e0", // purple
  "#42b9bc", // teal
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#ec4899", // hot pink
] as const;
