const House=require("../models/house")
const User=require("../models/user")

exports.toggleFavorite =async (req,res)=>{
    try {
        const user = await User.findById(req.user._id)
        if (!user) return res.status(404).json({ message: "User not found" })

        const houseId = req.params.id
        if (!houseId) return res.status(400).json({ message: "House id required" })

        if (!user.favorites) user.favorites = []

        const index = user.favorites.findIndex(fav => fav.toString() === houseId)

        if (index === -1) {
            user.favorites.push(houseId)
        } else {
            user.favorites.splice(index, 1)
        }

        await user.save()
        const updatedUser = await User.findById(req.user._id).populate("favorites")

        res.json({ favorites: updatedUser.favorites })

    } catch(error){
        res.status(500).json({message:error.message})
    }
}
 exports.getFavorites=async (req,res)=>{
    try{
        const user=await User.findById(req.user._id).populate("favorites")
        res.json(user.favorites)
    }catch(error){
        res.status(500).json({message:error.message})
    }
 }