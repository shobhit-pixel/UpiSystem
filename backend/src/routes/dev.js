import express from "express";
import Bill from "../models/Bill.js";
import Payment from "../models/Payment.js";

const router = express.Router();

async function seed() {
  if (await Bill.countDocuments()) return;

  await Bill.insertMany([
    {
      billNumber: "LAD-TEST-0001",
      residentId: "TEST001",
      residentName: "Test Resident",
      house: "A-101",
      type: "maintenance",
      title: "Maintenance - August 2026",
      amount: 2500,
      status: "pending",
      dueDate: new Date("2026-08-10")
    },
    {
      billNumber: "LAD-TEST-0002",
      residentId: "TEST001",
      residentName: "Test Resident",
      house: "A-101",
      type: "water",
      title: "Water Bill - July 2026",
      amount: 740,
      status: "pending",
      dueDate: new Date("2026-08-05")
    }
  ]);
}

router.post("/seed", async (_req, res) => {
  await seed();
  res.json({ message: "Test data ready" });
});

router.post("/reset", async (_req, res) => {
  await Payment.deleteMany({});
  await Bill.deleteMany({});
  await seed();
  res.json({ message: "POC reset complete" });
});

export { seed };
export default router;
