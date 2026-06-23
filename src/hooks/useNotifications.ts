import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const useNotifications = (page = 0, size = 20) => {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications", page],
    queryFn: async () => {
      const { data } = await api.get("/api/notifications", {
        params: { page, size },
      });
      return data;
    },
    refetchInterval: 60 * 1000, // poll mỗi 1 phút — thay bằng WebSocket nếu cần real-time
    staleTime: 30 * 1000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch("/api/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return {
    notifications: data?.content ?? [],
    unreadCount: data?.unreadCount ?? 0,
    markAllRead: () => markAllMutation.mutate(),
  };
};
