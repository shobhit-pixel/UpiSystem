import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import { generateUPIQR, buildIntentLinks } from "upipay";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(express.json());

const bills = [
  {
    _id: "test-1",
    billNumber: "LAD-TEST-001",
    title: "₹5 UPI Integration Test",
    amount: 5,
    status: "pending",
    dueDate: "2026-08-10",
  },
  {
    _id: "maintenance-1",
    billNumber: "LAD-MAINT-001",
    title: "Maintenance - August 2026",
    amount: 2500,
    status: "pending",
    dueDate: "2026-08-10",
  },
];

const payments = [];

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LAD Society UPIPay API is running",
    mode: "qr",
  });
});

app.get("/api/config", (req, res) => {
  res.json({
    mode: "qr",
    automaticVerification: false,
  });
});

app.get("/api/bills", (req, res) => {
  res.json(bills);
});

app.get("/api/payments", (req, res) => {
  res.json(payments);
});

app.post("/api/payments/create", async (req, res) => {
  try {
    const bill = bills.find((item) => item._id === req.body.billId);

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    if (bill.status === "paid") {
      return res.status(409).json({
        message: "Bill already paid",
      });
    }

    const vpa = process.env.UPI_VPA;

    if (!vpa) {
      return res.status(500).json({
        message: "UPI_VPA missing in .env",
      });
    }

    const orderId =
      `LAD_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    const qr = await generateUPIQR({
      vpa,
      name: process.env.UPI_PAYEE_NAME || "LAD Society",
      amount: bill.amount,
      orderId,
      note: `LAD Society ${orderId}`,
      mode: "fixed",
    });

    const payment = {
      _id: crypto.randomUUID(),
      billId: bill._id,
      orderId,
      amount: bill.amount,
      mode: "qr",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    payments.push(payment);

    res.status(201).json({
      payment,
      checkout: {
        type: "qr",
        qrImage: qr.qrImage,
        upiUri: qr.upiUri,
        links: buildIntentLinks(qr.upiUri),
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message || "Payment creation failed",
    });
  }
});

app.post("/api/payments/:orderId/verify", (req, res) => {
  res.status(400).json({
    message:
      "Direct UPI QR payments cannot be automatically verified by this server.",
  });
});

app.post("/api/dev/reset", (req, res) => {
  bills.forEach((bill) => {
    bill.status = "pending";
  });

  payments.length = 0;

  res.json({
    success: true,
  });
});

app.listen(PORT, () => {
  console.log(`LAD UPIPay API running on port ${PORT}`);
});