const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        username: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        fcm: { type: String, required: true, default: "none" },
        otp: { type: String, required: true, default: "none" },
        verification: {type: Boolean, default: false},
        password: { type: String, required: true },
        phone: { type: String, required: false, default:"01234567890"},
        phoneVerification: { type: Boolean, default: false},
        address: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Address", 
            required: false
        },
        userType: { type: String, required: true, enum: ['Admin', 'Driver', 'Vendor', 'Client'] },
        profile: {
            type: String,
            require: true,
            default: "https://dbestech-code.oss-ap-southeast-1.aliyuncs.com/foodly_flutter/icons/profile-photo.png?OSSAccessKeyId=LTAI5t8cUzUwGV1jf4n5JVfD&Expires=36001721319904&Signature=mxqrJ0bGFdbh05ORP7QHQsI3Ty0%3D"
        },

    }, { timestamps: true }
);
module.exports = mongoose.model("User", UserSchema)