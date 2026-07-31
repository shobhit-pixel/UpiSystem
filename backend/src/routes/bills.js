import express from "express";
import Bill from "../models/Bill.js";
import Payment from "../models/Payment.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const bills = await Bill.find().sort({ status: 1, dueDate: 1 }).lean();
  res.json(bills);
});

router.get("/:id", async (req, res) => {
  const bill = await Bill.findById(req.params.id).lean();
  if (!bill) return res.status(404).json({ message: "Bill not found" });
  res.json(bill);
});

router.get("/:id/payments", async (req, res) => {
  const payments = await Payment.find({ billId: req.params.id }).sort({ createdAt: -1 }).lean();
  res.json(payments);
});

export default router;
