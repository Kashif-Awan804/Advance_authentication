const nodemailer = require("nodemailer");

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log(
    "EMAIL_PASSWORD loaded:",
    Boolean(process.env.EMAIL_PASSWORD)
);
console.log(
    "EMAIL_PASSWORD length:",
    process.env.EMAIL_PASSWORD?.length
);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

module.exports = transporter;