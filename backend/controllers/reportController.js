const Report=require("../models/report")
const House=require("../models/house")

exports.reportHouse=async (req,res)=>{
    const {houseId,reason}=req.body
    if(!houseId||!reason) return res.status(400).json({message:"House id and reason required"})
    try{
     const house=await House.findById(houseId)
     if(!house) return res.status(404).json({message:"House not found"})
     const report=await Report.create({
        house:houseId,
        reportBy:req.user._id,
        reason,
    })
    res.status(201).json(report)
    } catch(error){
        res.status(500).json({message:error.message})
    }
}

exports.getReports=async (req,res)=>{
    try{
        const reports=await Report.find()
        .populate("house","title location house_status owner")
        .populate("reportBy","name email")

    res.json(reports)
    }catch(error){
        res.status(500).json({message:error.message})
    }
}

exports.deleteReportedHouse=async(req,res)=>{
    try{
        const house =await House.findById(req.params.houseId)
        if(!house) return res.status(404).json({message:"House not Found"})
        await House.findByIdAndDelete(req.params.houseId)
       await Report.deleteMany({house:req.params.houseId})

       res.json({message:"House and related reports deleted"})
    }catch(error){
        res.status(500).json({message:error.message})
    }
}
