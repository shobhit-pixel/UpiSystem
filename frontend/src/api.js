const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const getBills = () => request("/bills");
export const getPayments = () => request("/payments");
export const createPayment = (billId) =>
  request("/payments/create", { method: "POST", body: JSON.stringify({ billId }) });
export const simulate = (orderId, result) =>
  request(`/payments/${orderId}/simulate`, { method: "POST", body: JSON.stringify({ result }) });
export const verify = (orderId) =>
  request(`/payments/${orderId}/verify`, { method: "POST" });
export const resetPoc = () => request("/dev/reset", { method: "POST" });
