import { api } from "@/lib/api";

// ─── Helper: parse lỗi từ Blob response ──────────────────────────────────────

/**
 * Khi Axios dùng responseType="blob", lỗi trả về từ server (4xx/5xx)
 * vẫn là Blob chứa JSON, KHÔNG phải object thông thường.
 *
 * VD: backend trả { "error": "AUTH_ERROR", "message": "Tháng 6/2026 chưa đến..." }
 * → Axios nhét vào error.response.data dưới dạng Blob
 * → getErrorMessage() đọc blob.message → undefined → fallback "Có lỗi xảy ra"
 *
 * Fix: đọc Blob → text → JSON.parse → lấy message rồi throw Error mới
 * để getErrorMessage() ở component đọc được bình thường.
 */
async function parseErrorBlob(error: unknown): Promise<never> {
  const axiosError = error as {
    response?: { data?: Blob; status?: number };
  };

  const blob = axiosError?.response?.data;

  if (blob instanceof Blob) {
    try {
      const text = await blob.text(); // Blob → string
      const json = JSON.parse(text); // string → object
      // Tạo lại error object đúng shape mà getErrorMessage() mong đợi
      const wrapped = {
        response: {
          data: json,
          status: axiosError?.response?.status,
        },
      };
      throw wrapped;
    } catch (parseErr) {
      // Nếu parse thất bại (response không phải JSON) → throw error gốc
      if (parseErr !== error) throw parseErr;
    }
  }

  throw error;
}

// ─── Helper download ──────────────────────────────────────────────────────────

const triggerDownload = (blobData: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blobData);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const buildSuffix = (year?: number, month?: number) => {
  const y = year ?? new Date().getFullYear();
  return month ? `${y}_${String(month).padStart(2, "0")}` : `${y}`;
};

// ─── Export Service ───────────────────────────────────────────────────────────

export const exportService = {
  downloadExcel: async (year?: number, month?: number): Promise<void> => {
    const params = new URLSearchParams();
    if (year) params.append("year", year.toString());
    if (month) params.append("month", month.toString());

    try {
      const response = await api.get(`/api/export/excel?${params}`, {
        responseType: "blob",
      });
      triggerDownload(
        new Blob([response.data]),
        `transactions_${buildSuffix(year, month)}.xlsx`,
      );
    } catch (error) {
      // Parse blob error → re-throw với shape đúng để getErrorMessage() đọc được
      await parseErrorBlob(error);
    }
  },

  downloadPdf: async (year?: number, month?: number): Promise<void> => {
    const params = new URLSearchParams();
    if (year) params.append("year", year.toString());
    if (month) params.append("month", month.toString());

    try {
      const response = await api.get(`/api/export/pdf?${params}`, {
        responseType: "blob",
      });
      triggerDownload(
        new Blob([response.data], { type: "application/pdf" }),
        `transactions_${buildSuffix(year, month)}.pdf`,
      );
    } catch (error) {
      await parseErrorBlob(error);
    }
  },
};
