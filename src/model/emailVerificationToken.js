const mongoose = require("mongoose");

const emailVerificationTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        tokenHash: {
            type: String,
            required: true
        },

        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const EmailVerificationToken = mongoose.model(
    "EmailVerificationToken",
    emailVerificationTokenSchema
);

module.exports = EmailVerificationToken;