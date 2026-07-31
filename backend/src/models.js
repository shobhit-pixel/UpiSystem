import mongoose from "mongoose";
const Bill=mongoose.model("Bill",new mongoose.Schema({billNumber:{type:String,unique:true},title:String,amount:Number,status:{type:String,default:"pending"},dueDate:Date,paymentId:mongoose.Schema.Types.ObjectId},{timestamps:true}));
const Payment=mongoose.model("Payment",new mongoose.Schema({billId:mongoose.Schema.Types.ObjectId,orderId:{type:String,unique:true},mode:String,amount:Number,amountPaise:Number,status:{type:String,default:"pending"},transactionId:String,providerResponse:Object},{timestamps:true}));
export {Bill,Payment};