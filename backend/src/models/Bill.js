import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  residentId: { type: String, required: true },
  residentName: { type: String, required: true },
  house: { type: String, required: true },
  type: { type: String, enum: ["maintenance", "water", "electricity", "other"], required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ["pending", "paid"], default: "pending" },
  dueDate: { type: Date, required: true },
  paidAt: Date,
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" }
}, { timestamps: true });

export default mongoose.model("Bill", billSchema);
