import "dotenv/config";
import express from "express"; import cors from "cors"; import mongoose from "mongoose"; import crypto from "crypto";
import {UPIPay,generateUPIQR,buildIntentLinks} from "upipay";
import {Bill,Payment} from "./models.js";
const app=express(), mode=(process.env.PAYMENT_MODE||"qr").toLowerCase();
app.use(cors({origin:process.env.FRONTEND_URL||"http://localhost:5173"})); app.use(express.json());
function client(){
 if(mode==="phonepe")return new UPIPay({provider:"phonepe",environment:process.env.PHONEPE_ENV||"sandbox",credentials:{merchantId:process.env.PHONEPE_MERCHANT_ID,saltKey:process.env.PHONEPE_SALT_KEY,saltIndex:process.env.PHONEPE_SALT_INDEX||"1"}});
 if(mode==="paytm")return new UPIPay({provider:"paytm",environment:process.env.PAYTM_ENV||"sandbox",credentials:{merchantId:process.env.PAYTM_MERCHANT_ID,merchantKey:process.env.PAYTM_MERCHANT_KEY}});
 throw new Error("PSP client unavailable in QR mode");
}
app.get("/api/config",(_q,r)=>r.json({mode,automaticVerification:mode!=="qr"}));
app.get("/api/bills",async(_q,r)=>r.json(await Bill.find().sort({createdAt:1}).lean()));
app.get("/api/payments",async(_q,r)=>r.json(await Payment.find().sort({createdAt:-1}).lean()));
app.post("/api/payments/create",async(q,r)=>{try{
 const b=await Bill.findById(q.body.billId); if(!b)return r.status(404).json({message:"Bill not found"}); if(b.status==="paid")return r.status(409).json({message:"Already paid"});
 const orderId=`LAD_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
 let checkout;
 if(mode==="qr"){
  const vpa=process.env.UPI_VPA; if(!vpa||vpa.startsWith("your-"))throw new Error("Set your real UPI_VPA in backend/.env");
  const qr=await generateUPIQR({vpa,name:process.env.UPI_PAYEE_NAME||"LAD Society",amount:b.amount,orderId,note:`LAD ${orderId}`,mode:"fixed"});
  checkout={type:"qr",qrImage:qr.qrImage,upiUri:qr.upiUri,links:buildIntentLinks(qr.upiUri)};
 }else{
  const base=(process.env.PUBLIC_BASE_URL||"").replace(/\/$/,""); if(!base.startsWith("https://"))throw new Error("PUBLIC_BASE_URL must be public HTTPS for PSP mode");
  const x=await client().createPayment({amount:Math.round(b.amount*100),orderId,customerPhone:q.body.phone||"9999999999",callbackUrl:`${base}/api/payments/webhook`,redirectUrl:`${base}/payment-result?orderId=${orderId}`,idempotencyKey:crypto.randomUUID()});
  checkout={type:"psp",paymentUrl:x.paymentUrl}; 
 }
 const p=await Payment.create({billId:b._id,orderId,mode,amount:b.amount,amountPaise:Math.round(b.amount*100),providerResponse:{}});
 r.status(201).json({payment:p,checkout});
}catch(e){r.status(400).json({message:e.message})}});
app.post("/api/payments/:id/verify",async(q,r)=>{try{
 if(mode==="qr")return r.status(400).json({message:"QR-only UPI has no automatic status API. Check your bank/merchant app manually."});
 const p=await Payment.findOne({orderId:q.params.id}); if(!p)return r.status(404).json({message:"Payment not found"});
 const s=await client().checkStatus(p.orderId,{expectedAmount:p.amountPaise,maxRetries:3}); p.providerResponse=s;
 if(s.status==="SUCCESS"){p.status="paid";p.transactionId=s.transactionId;await p.save();await Bill.findByIdAndUpdate(p.billId,{status:"paid",paymentId:p._id});}
 else{p.status=s.status==="FAILED"?"failed":"pending";await p.save();} r.json({payment:p,status:s});
}catch(e){r.status(400).json({message:e.message})}});
app.post("/api/dev/reset",async(_q,r)=>{await Payment.deleteMany({});await Bill.deleteMany({});await seed();r.json({ok:true})});
async function seed(){if(await Bill.countDocuments())return;await Bill.insertMany([{billNumber:"LAD-TEST-001",title:"₹1 UPI Integration Test",amount:1,dueDate:new Date("2026-08-10")},{billNumber:"LAD-MAINT-001",title:"Maintenance - August 2026",amount:2500,dueDate:new Date("2026-08-10")}])}
await mongoose.connect(process.env.MONGODB_URI||"mongodb://127.0.0.1:27017/lad_upipay_poc");await seed();app.listen(process.env.PORT||5000,()=>console.log(`LAD UPIPay API http://localhost:${process.env.PORT||5000} (${mode})`));