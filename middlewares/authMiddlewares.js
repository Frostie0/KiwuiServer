import JWT from 'jsonwebtoken';
import User from '../models/user.js'

export const isAuth = async(req,res,next) => {
    const {token} = req.cookies
    
    //validation
    if(token){
        return res.status(401).send({
            success:false,
            message:"unAuthorized User"
        })
    }
   const decodeData = JWT.verify(token,process.env.JWT_SECRET)
   req.user = await User.findById(decodeData._id);
   next();
};