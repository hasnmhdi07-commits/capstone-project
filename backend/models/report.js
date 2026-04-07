const mongoose=require("mongoose")
const reportSchema= new mongoose.Schema({
    house:{type:mongoose.Schema.Types.ObjectId,ref:"House",required:true},
    reportBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    reason:{type:String,required:true},
    createdAt:{type:Date,default:Date.now},
})

module.exports=mongoose.model("Report",reportSchema)