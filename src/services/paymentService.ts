import { api } from "@/lib/api";

export interface CreatePaymentRequest {
  planId: "PLUS" | "PREMIUM";
}

export interface PaymentLinkResponse {
  checkoutUrl: string;
  qrCode: string;
  orderCode: string;
}

export const paymentService = {
  // Gọi backend tạo PayOS link → backend trả về checkoutUrl
  createPaymentLink: async (
    planId: "PLUS" | "PREMIUM",
  ): Promise<PaymentLinkResponse> => {
    const { data } = await api.post<PaymentLinkResponse>(
      "/api/payments/create-link",
      { planId },
    );
    return data;
  },
};
