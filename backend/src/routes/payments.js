import crypto from "crypto";
import express from "express";
import Bill from "../models/Bill.js";
import Payment from "../models/Payment.js";
import {
  createProviderOrder,
  getProviderStatus,
  simulateProviderResult
} from "../services/paymentProvider.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const payments = await Payment.find().populate("billId").sort({ createdAt: -1 }).lean();
  res.json(payments);
});

router.post("/create", async (req, res) => {
  try {
    const { billId } = req.body;
    if (!billId) return res.status(400).json({ message: "billId is required" });

    const bill = await Bill.findById(billId);
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    if (bill.status === "paid") return res.status(409).json({ message: "Bill is already paid" });

    const existing = await Payment.findOne({
      billId: bill._id,
      status: { $in: ["created", "pending"] }
    }).sort({ createdAt: -1 });

    if (existing) return res.json(existing);

    const orderId = `LAD_${Date.now()}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    // Security: amount comes from the bill stored in the database, never from req.body.
    const payment = await Payment.create({
      billId: bill._id,
      orderId,
      amount: bill.amount,
      provider: "mock",
      status: "pending"
    });

    const providerResponse = await createProviderOrder({
      orderId,
      amount: bill.amount
    });

    payment.providerResponse = providerResponse;
    await payment.save();

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:orderId/simulate", async (req, res) => {
  try {
    const result = req.body.result;
    if (!["success", "failed"].includes(result)) {
      return res.status(400).json({ message: "result must be success or failed" });
    }

    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.status === "paid") return res.status(409).json({ message: "Payment already completed" });

    await simulateProviderResult(payment.orderId, result);
    res.json({ message: `Mock payment ${result}. Verify it to update the bill.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:orderId/verify", async (req, res) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment.status === "paid") {
      const bill = await Bill.findById(payment.billId);
      return res.json({ payment, bill });
    }

    const provider = await getProviderStatus(payment.orderId);

    if (provider.status === "SUCCESS") {
      // Verify amount from provider against the server-created payment.
      if (Number(provider.amount) !== Number(payment.amount)) {
        payment.status = "failed";
        payment.providerResponse = provider;
        await payment.save();
        return res.status(400).json({ message: "Payment amount mismatch" });
      }

      const bill = await Bill.findById(payment.billId);
      if (!bill) return res.status(404).json({ message: "Bill not found" });

      if (Number(bill.amount) !== Number(payment.amount)) {
        return res.status(400).json({ message: "Bill amount mismatch" });
      }

      const paidAt = new Date();
      payment.status = "paid";
      payment.transactionId = provider.transactionId;
      payment.paidAt = paidAt;
      payment.providerResponse = provider;
      await payment.save();

      bill.status = "paid";
      bill.paidAt = paidAt;
      bill.paymentId = payment._id;
      await bill.save();

      return res.json({ payment, bill });
    }

    payment.status = provider.status === "FAILED" ? "failed" : "pending";
    payment.providerResponse = provider;
    await payment.save();

    res.json({ payment, message: `Provider status: ${provider.status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
