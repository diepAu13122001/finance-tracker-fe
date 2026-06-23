import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { householdService } from "@/services/householdService";
import type {
  ItemCategory,
  ItemStatus,
  HouseholdItemRequest,
  ReviewRequest,
} from "@/types/household";
import { notify } from "@/lib/toast";
import { getApiErrorMessage } from "@/utils/errorUtils";

export const HOUSEHOLD_KEYS = {
  all: ["household"] as const,
  list: (status?: ItemStatus, category?: ItemCategory) =>
    ["household", "list", status, category] as const,
  detail: (id: string) => ["household", "detail", id] as const,
  topRated: (category?: string) =>
    ["household", "top-rated", category] as const,
  analytics: ["household", "analytics"] as const,
  restockPrediction: (id: string) =>
    ["household", "restock-prediction", id] as const,
};

export const useHouseholdItems = (
  page = 0,
  size = 20,
  status?: ItemStatus,
  category?: ItemCategory,
) =>
  useQuery({
    queryKey: HOUSEHOLD_KEYS.list(status, category),
    queryFn: () => householdService.getAll(page, size, status, category),
    staleTime: 2 * 60 * 1000,
  });

export const useHouseholdItem = (id: string, enabled = true) =>
  useQuery({
    queryKey: HOUSEHOLD_KEYS.detail(id),
    queryFn: () => householdService.getById(id),
    enabled: enabled && !!id,
  });

export const useTopRatedItems = (category?: string) =>
  useQuery({
    queryKey: HOUSEHOLD_KEYS.topRated(category),
    queryFn: () => householdService.getTopRated(category),
    staleTime: 5 * 60 * 1000,
  });

export const useHouseholdAnalytics = () =>
  useQuery({
    queryKey: HOUSEHOLD_KEYS.analytics,
    queryFn: () => householdService.getAnalytics(),
    staleTime: 5 * 60 * 1000,
  });

export const useRestockPrediction = (id: string, enabled = true) =>
  useQuery({
    queryKey: HOUSEHOLD_KEYS.restockPrediction(id),
    queryFn: () => householdService.getRestockPrediction(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });

export const useCreateHouseholdItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: HouseholdItemRequest) => householdService.create(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOUSEHOLD_KEYS.all });
      notify.success("Đã thêm đồ dùng");
    },
    onError: (err) => notify.error(getApiErrorMessage(err)),
  });
};

export const useUpdateHouseholdItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: HouseholdItemRequest }) =>
      householdService.update(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOUSEHOLD_KEYS.all });
      notify.success("Đã cập nhật");
    },
    onError: (err) => notify.error(getApiErrorMessage(err)),
  });
};

export const useUpdateItemStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ItemStatus }) =>
      householdService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOUSEHOLD_KEYS.all });
    },
    onError: (err) => notify.error(getApiErrorMessage(err)),
  });
};

export const useDeleteHouseholdItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => householdService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOUSEHOLD_KEYS.all });
      notify.success("Đã xóa");
    },
  });
};

export const useAddReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: ReviewRequest }) =>
      householdService.addReview(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOUSEHOLD_KEYS.all });
      notify.success("Cảm ơn đánh giá của bạn!");
    },
    onError: (err) => notify.error(getApiErrorMessage(err)),
  });
};
