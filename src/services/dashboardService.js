import api from "./api";

export async function getDashboardStats() {
  const response = await api.get("/admin/dashboard/stats");

  return response.data;
}