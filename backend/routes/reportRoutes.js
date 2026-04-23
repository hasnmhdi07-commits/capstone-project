const express=require("express")
const router=express.Router()
const {protect}=require("../middleware/authMiddleware")
const {authorizeRoles}=require("../middleware/roleMiddleware")
const {reportHouse,getReports,deleteReportedHouse}=require("../controllers/reportController")

router.post("/",protect,authorizeRoles("user"),reportHouse)
router.get("/admin/reports",protect,authorizeRoles("admin"),getReports)
router.delete("/admin/reports/:houseId",protect,authorizeRoles("admin"),deleteReportedHouse)

module.exports=router;