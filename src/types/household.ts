export type ItemCategory =
  | "SKINCARE"
  | "HOUSECARE"
  | "FOOD"
  | "CLOTHES"
  | "OTHER";
export type ItemStatus = "IN_USE" | "FINISHED" | "NEED_RESTOCK";

export interface HouseholdItemResponse {
  id: string;
  name: string;
  brand: string | null;
  category: ItemCategory;
  aiCategory: string | null;
  price: number | null;
  purchaseDate: string | null;
  expiryDate: string | null;
  quantity: number | null;
  unit: string | null;
  status: ItemStatus;
  notifyBeforeDays: number;
  notes: string | null;
  createdAt: string;
  // Computed từ backend
  daysUntilExpiry: number | null;
  expiringSoon: boolean;
  expired: boolean;
}

export interface HouseholdItemRequest {
  name: string;
  brand?: string;
  category: ItemCategory;
  price?: number;
  purchaseDate?: string;
  expiryDate?: string;
  quantity?: number;
  unit?: string;
  notifyBeforeDays?: number;
  notes?: string;
}

export interface ReviewRequest {
  rating: number; // 1-5
  reviewText?: string;
  wouldBuyAgain?: boolean;
}

export const ITEM_CATEGORY_CONFIG: Record<
  ItemCategory,
  {
    label: string;
    emoji: string;
    color: string;
  }
> = {
  SKINCARE: { label: "Chăm sóc da", emoji: "💆", color: "#ec4899" },
  HOUSECARE: { label: "Vệ sinh nhà", emoji: "🏠", color: "#3b82f6" },
  FOOD: { label: "Thực phẩm", emoji: "🍎", color: "#22c55e" },
  CLOTHES: { label: "Quần áo", emoji: "👗", color: "#f59e0b" },
  OTHER: { label: "Khác", emoji: "📦", color: "#6b7280" },
};

export const ITEM_STATUS_CONFIG: Record<
  ItemStatus,
  {
    label: string;
    color: string;
    bg: string;
  }
> = {
  IN_USE: { label: "Đang dùng", color: "#22c55e", bg: "bg-success-50" },
  FINISHED: { label: "Đã hết", color: "#6b7280", bg: "bg-surface-muted" },
  NEED_RESTOCK: { label: "Cần mua thêm", color: "#f59e0b", bg: "bg-amber-50" },
};
