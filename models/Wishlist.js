import mongoose from "mongoose";


const wishlistSchema = new mongoose.Schema({
    productId:{
        type:String,
        require:true,
        unique:true
    },
    likes:[     
],
})


export const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist