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

export interface AIAnalyzeResult {
  success: boolean;
  overview: string;      // Nhận xét tổng quan
  topInsight: string;    // Insight quan trọng nhất
  suggestion: string;    // Gợi ý cải thiện
  warnings: string[];    // Cảnh báo nếu có
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
    const { data } = await api.post<AIParseResult>("/api/ai/parse-transaction", {
      text,
      geminiApiKey,
    });
    return data;
  },

  /**
   * Phân tích chi tiêu của 1 tháng cụ thể.
   * Backend tự lấy summary + category chart, gọi Gemini, trả về insights.
   *
   * Tại sao không gọi Gemini trực tiếp từ FE:
   *   - Backend kiểm soát data (summary, categories) trước khi gửi AI
   *   - Gemini key vẫn do client cung cấp, không lưu server
   */
  analyzeSpending: async (
    year: number,
    month: number,
  ): Promise<AIAnalyzeResult> => {
    const geminiApiKey = localStorage.getItem("gemini_api_key");
    if (!geminiApiKey) {
      throw new Error("Chưa có Gemini API key. Vào Settings > AI để nhập.");
    }
    const { data } = await api.post<AIAnalyzeResult>("/api/ai/analyze-spending", {
      year,
      month,
      geminiApiKey,
    });
    return data;
  },
};
