import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  billId: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", required: true },
  orderId: { type: String, required: true, unique: true },
  provider: { type: String, default: "mock" },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["created", "pending", "paid", "failed"],
    default: "created"
  },
  transactionId: { type: String, default: null },
  paidAt: Date,
  providerResponse: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
