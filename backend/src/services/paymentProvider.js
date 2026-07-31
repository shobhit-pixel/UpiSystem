import crypto from "crypto";

// Development-only provider. Replace this module with the real provider adapter later.
const mockTransactions = new Map();

export async function createProviderOrder({ orderId, amount }) {
  mockTransactions.set(orderId, {
    orderId,
    amount,
    status: "PENDING",
    transactionId: null
  });

  return { orderId, amount, status: "PENDING" };
}

export async function simulateProviderResult(orderId, result) {
  const transaction = mockTransactions.get(orderId);
  if (!transaction) throw new Error("Mock provider order not found");

  if (result === "success") {
    transaction.status = "SUCCESS";
    transaction.transactionId = `MOCK_${crypto.randomUUID().replaceAll("-", "").slice(0, 18).toUpperCase()}`;
  } else {
    transaction.status = "FAILED";
  }

  mockTransactions.set(orderId, transaction);
  return { ...transaction };
}

export async function getProviderStatus(orderId) {
  const transaction = mockTransactions.get(orderId);
  if (!transaction) return { orderId, status: "NOT_FOUND" };
  return { ...transaction };
}
