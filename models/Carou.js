import mongoose from 'mongoose';

const carouSchema = new mongoose.Schema({
    carouId: {
        type: String,
        require: true,
        unique: true
    },
    images: [
        {
            imageId: {
                type: String,
                require: true,
                unique: true
            },
            sellerId:{
                type: String,
                require: true,
            },
            url: {
                type: String,
                required: true
            },
            productId: {
                type: String,
                required: true
            },
            created: {
                type: Date,
                default: Date.now
            },
            expires: {
                type: Date,
                required: true
            },
            status: {
                type: String,
            }
        }
    ],
    pending:[
        {
            imageId: {
                type: String,
                require: true,
                unique: true
            },
            sellerId:{
                type: String,
                require: true,
            },
            url: {
                type: String,
                required: true
            },
            productId: {
                type: String,
                required: true
            },
            created: {
                type: Date,
                default: Date.now
            },
            adsCarou:{
                type:Number,
            },
            status: {
                type: String,
                default: "Waiting for approval"
              }
        }
    ]

})


export const Carou = mongoose.model('Carou', carouSchema);

export default Carou;
