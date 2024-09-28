import mongoose from "mongoose";


const transactionSchema = new mongoose.Schema({
  id:{
    type:String,
    require:true,
  },
  transactionId:{
    type:String,
    require:true,
    unique:true,
  },
  number:{
    type:String,
    require:true,
  },
  amount:{
    type:Number,
    require:true,
  },
  typePayment:{
    type:String,
    require:true
  },
  typeTransaction:{
    type:String,
    require:true
  },
  orderId:{
    type:String,
  },
  statut:{
    type:String,
    require:true,
  },
  createdAt:{
    type:Date,
    default:Date.now
},
})

export const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction