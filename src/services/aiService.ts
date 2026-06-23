import { api } from "@/lib/api";

export interface AIParseResult {
  type: "INCOME" | "EXPENSE";
  amount: number;
  note: string;
  suggestedCategory: string;
  rawText: string;
  success: boolean;
  errorMessage?: string;
}

export interface AIClassifyResult {
  category: string; // "SKINCARE" | "HOUSECARE" | "FOOD" | "CLOTHES" | "OTHER"
  subcategory: string;
  reasoning: string;
  success: boolean;
  errorMessage?: string;
}

export const aiService = {
  /**
   * Gửi text lên backend → backend gọi Gemini → trả về parsed data.
   * geminiApiKey lấy từ localStorage (user tự nhập ở Settings > AI).
   */
  parseTransaction: async (text: string): Promise<AIParseResult> => {
    const geminiApiKey = localStorage.getItem("gemini_api_key");
    if (!geminiApiKey) {
      throw new Error("Chưa có Gemini API key. Vào Settings > AI để nhập.");
    }
    const { data } = await api.post<AIParseResult>(
      "/api/ai/parse-transaction",
      {
        text,
        geminiApiKey,
      },
    );
    return data;
  },

  classifyItem: async (
    name: string,
    brand?: string,
  ): Promise<AIClassifyResult> => {
    const geminiApiKey = localStorage.getItem("gemini_api_key");
    if (!geminiApiKey) {
      throw new Error("Chưa có Gemini API key. Vào Settings > AI để nhập.");
    }
    const { data } = await api.post<AIClassifyResult>("/api/ai/classify-item", {
      name,
      brand,
      geminiApiKey,
    });
    return data;
  },
};
