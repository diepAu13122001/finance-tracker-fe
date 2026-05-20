// ─── Plan IDs ────────────────────────────────────────────────────────────────

export type PlanId = "FREE" | "PLUS" | "PREMIUM";

// ─── Feature Keys ─────────────────────────────────────────────────────────────
// Mọi tính năng bị giới hạn trong app phải được liệt kê ở đây.
// Khi thêm tính năng mới, thêm vào đây trước — buộc bạn quyết định
// tính năng đó thuộc gói nào trước khi viết code.

export type Feature =
  | "unlimited_transactions"
  | "categories"
  | "financial_goals"
  | "budgets"
  | "dark_mode"
  | "custom_accent_colors"
  | "csv_export"
  | "analytics_advanced"
  | "ai_voice_input"
  | "ai_assistant"
  | "ai_categorization"
  | "household_tracker"
  | "expiry_notifications"
  | "product_reviews";

// ─── Plan Levels ──────────────────────────────────────────────────────────────
// Cấp độ số cho phép so sánh >= đơn giản.
// PREMIUM (3) >= PLUS (2) >= FREE (1)

export const PLAN_LEVELS: Record<PlanId, number> = {
  FREE: 1,
  PLUS: 2,
  PREMIUM: 3,
};

// ─── Feature → Gói tối thiểu yêu cầu ─────────────────────────────────────────

export const FEATURE_PLAN: Record<Feature, PlanId> = {
  unlimited_transactions: "PLUS",
  categories: "PLUS",
  financial_goals: "PLUS",
  budgets: "PLUS",
  dark_mode: "PLUS",
  custom_accent_colors: "PLUS",
  csv_export: "PLUS",
  analytics_advanced: "PLUS",
  ai_voice_input: "PLUS",
  ai_assistant: "PLUS",
  ai_categorization: "PREMIUM",
  household_tracker: "PREMIUM",
  expiry_notifications: "PREMIUM",
  product_reviews: "PREMIUM",
};

// ─── Plan Config (nhãn, giới hạn) ────────────────────────────────────────────

export interface PlanConfig {
  id: PlanId;
  name: string;
  nameVi: string;
  priceVnd: number;
  maxTransactionsPerMonth: number; // -1 = không giới hạn
  maxAiMessagesPerMonth: number; // -1 = không giới hạn
}

export const PLAN_CONFIG: Record<PlanId, PlanConfig> = {
  FREE: {
    id: "FREE",
    name: "Free",
    nameVi: "Miễn phí",
    priceVnd: 0,
    maxTransactionsPerMonth: 50,
    maxAiMessagesPerMonth: 0,
  },
  PLUS: {
    id: "PLUS",
    name: "Plus",
    nameVi: "Plus",
    priceVnd: 0,
    maxTransactionsPerMonth: -1,
    maxAiMessagesPerMonth: 20,
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    nameVi: "Premium",
    priceVnd: 499_000,
    maxTransactionsPerMonth: -1,
    maxAiMessagesPerMonth: -1,
  },
};

// ─── Hàm hỗ trợ ───────────────────────────────────────────────────────────────

/**
 * Trả về true nếu `userPlan` có quyền truy cập `feature`.
 * Ví dụ: canUseFeature('PLUS', 'categories') → true
 *         canUseFeature('FREE', 'categories') → false
 */
export function canUseFeature(userPlan: PlanId, feature: Feature): boolean {
  const required = PLAN_LEVELS[FEATURE_PLAN[feature]];
  const user = PLAN_LEVELS[userPlan];
  return user >= required;
}

/**
 * Trả về tên gói tối thiểu cần thiết cho một tính năng, bằng tiếng Việt.
 * Dùng trong upgrade prompt: "Tính năng này cần gói Plus"
 */
export function requiredPlanName(feature: Feature): string {
  return PLAN_CONFIG[FEATURE_PLAN[feature]].nameVi;
}
