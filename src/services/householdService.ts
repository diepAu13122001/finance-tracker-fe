import { api } from "@/lib/api";
import type {
  HouseholdItemRequest,
  HouseholdItemResponse,
  HouseholdAnalyticsSummary,
  RestockPrediction,
  ReviewRequest,
} from "@/types/household";
import type { ItemCategory, ItemStatus } from "@/types/household";

interface HouseholdPage {
  content: HouseholdItemResponse[];
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export const householdService = {
  getAll: async (
    page = 0,
    size = 20,
    status?: ItemStatus,
    category?: ItemCategory,
  ): Promise<HouseholdPage> => {
    const params: Record<string, unknown> = { page, size };
    if (status) params.status = status;
    if (category) params.category = category;
    const { data } = await api.get<HouseholdPage>("/api/household", { params });
    return data;
  },

  getById: async (id: string): Promise<HouseholdItemResponse> => {
    const { data } = await api.get<HouseholdItemResponse>(
      `/api/household/${id}`,
    );
    return data;
  },

  create: async (req: HouseholdItemRequest): Promise<HouseholdItemResponse> => {
    const { data } = await api.post<HouseholdItemResponse>(
      "/api/household",
      req,
    );
    return data;
  },

  update: async (
    id: string,
    req: HouseholdItemRequest,
  ): Promise<HouseholdItemResponse> => {
    const { data } = await api.put<HouseholdItemResponse>(
      `/api/household/${id}`,
      req,
    );
    return data;
  },

  updateStatus: async (
    id: string,
    status: ItemStatus,
  ): Promise<HouseholdItemResponse> => {
    const { data } = await api.patch<HouseholdItemResponse>(
      `/api/household/${id}/status`,
      null,
      { params: { status } },
    );
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/household/${id}`);
  },

  addReview: async (id: string, req: ReviewRequest): Promise<void> => {
    await api.post(`/api/household/${id}/review`, req);
  },

  getAnalytics: async (): Promise<HouseholdAnalyticsSummary> => {
    const { data } = await api.get<HouseholdAnalyticsSummary>(
      "/api/household/analytics/summary",
    );
    return data;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTopRated: async (category?: string, limit = 10): Promise<any[]> => {
    const params: Record<string, unknown> = { limit };
    if (category) params.category = category;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await api.get<any[]>("/api/household/top-rated", {
      params,
    });
    return data;
  },
  
  getRestockPrediction: async (id: string): Promise<RestockPrediction> => {
    const { data } = await api.get<RestockPrediction>(
      `/api/ai/restock-prediction/${id}`,
    );
    return data;
  },
};
