const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide a name"],
        minlength: [3, "Name must be at least 3 characters long"],
        maxlength: [50, "Name must be less than 50 characters long"],
    },

    email: {
        type: String,
        required: [true, "Please provide an email"],
        validate: {
            validator: validator.isEmail,
            message: "Please provide a valid email",
        }
    },
    
    emailVerified: {
       type: Boolean,
       default: false
    },

    password: {
        type: String,
        required: [true, "Please provide a password"],
        validate: {
            validator: (value) => {
                return validator.isStrongPassword(value, {});
            }
        }
    },
     role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },

});

const User = mongoose.model("User", userSchema);

module.exports = User;