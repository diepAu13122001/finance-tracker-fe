import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { transactionService } from "@/services/transactionService";

// Mock transactionService
vi.mock("@/services/transactionService", () => ({
  transactionService: {
    getAll: vi.fn(),
    getSummary: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

// Wrapper cần thiết cho hooks dùng React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("transactionService mock tests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getAll trả về đúng page structure", async () => {
    const mockPage = {
      content: [
        {
          id: "1",
          type: "EXPENSE",
          amount: 45000,
          transactionDate: "2026-01-15",
          source: "manual",
          note: "Cà phê",
          category: null,
          wallet: null,
        },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      empty: false,
    };

    vi.mocked(transactionService.getAll).mockResolvedValueOnce(mockPage as any);

    const result = await transactionService.getAll(0, 20, "ALL");

    expect(result.content).toHaveLength(1);
    expect(result.totalElements).toBe(1);
    expect(result.content[0].type).toBe("EXPENSE");
  });

  it("getSummary tính đúng balance = income - expense", async () => {
    const mockSummary = {
      totalIncome: 10_000_000,
      totalExpense: 6_000_000,
      balance: 4_000_000,
      transactionCount: 15,
      transactionLimit: 50,
      limitReached: false,
    };
    vi.mocked(transactionService.getSummary).mockResolvedValueOnce(
      mockSummary as any,
    );

    const result = await transactionService.getSummary({
      year: 2026,
      month: 5,
    });

    expect(result.balance).toBe(result.totalIncome - result.totalExpense);
    expect(result.limitReached).toBe(false);
  });

  it("Free user với 50 giao dịch → limitReached = true", async () => {
    const mockSummary = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 50,
      transactionLimit: 50,
      limitReached: true,
    };
    vi.mocked(transactionService.getSummary).mockResolvedValueOnce(
      mockSummary as any,
    );

    const result = await transactionService.getSummary({});

    expect(result.limitReached).toBe(true);
    expect(result.transactionCount).toBe(result.transactionLimit);
  });
});
