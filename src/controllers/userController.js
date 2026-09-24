const User = require("../model/user");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


const Session = require("../model/session");
const EmailVerificationToken = require("../model/emailVerificationToken");
const transporter = require("../config/mail");

async function createUser(req, res) {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // Check required fields
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check password match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and confirm password do not match"
            });
        }

        // Check existing user
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();
        const verificationToken = crypto.randomBytes(32).toString("hex");

        const tokenHash = await bcrypt.hash(verificationToken, 10);

        await EmailVerificationToken.create({
            userId: user._id,
            tokenHash,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        const verificationLink =
       `http://localhost:5000/auth/verify-email?token=${verificationToken}`;

       await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Verify your email",
        html: `
          <h2>Welcome ${user.name}!</h2>
          <p>Please verify your email address by clicking the button below:</p>
           <a href="${verificationLink}">
             Verify Email
           </a>
           <p>This link will expire in 15 minutes.</p>
        `
      });


        console.log("Verification Token:", verificationToken);
        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
     console.error("Register Error:", err);

    return res.status(500).json({
        success: false,
        message: err.message
    });
    }
}

//Login api 

async function Login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate Access Token
        const accessToken = jwt.sign(
            {
                userId: user._id
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "15m"
            }
        );

        // Generate Refresh Token
        const refreshToken = jwt.sign(
            {
                userId: user._id
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: "7d"
            }
        );

        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

        await Session.create({
           userId: user._id,
           refreshTokenHash,
           expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error("Login Error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

//Delete user
async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });

    } catch (err) {
        console.error("Delete User Error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

//Refresh Token

async function refreshAccessToken(req, res) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const session = await Session.findOne({
            userId: decoded.userId
        });

        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Session not found"
            });
        }

        const isTokenValid = await bcrypt.compare(
            refreshToken,
            session.refreshTokenHash
        );

        if (!isTokenValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        const accessToken = jwt.sign(
            {
                userId: decoded.userId
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "15m"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Access token refreshed successfully",
            accessToken
        });

    } catch (err) {
        console.error("Refresh Token Error:", err);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired refresh token"
        });
    }
}

//Logout 

async function logout(req, res) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const session = await Session.findOne({
            userId: decoded.userId
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        const isTokenValid = await bcrypt.compare(
            refreshToken,
            session.refreshTokenHash
        );

        if (!isTokenValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        await Session.deleteOne({
            _id: session._id
        });

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });

    } catch (err) {
        console.error("Logout Error:", err);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired refresh token"
        });
    }
}

//Verify_Email

// Verify Email

async function verifyEmail(req, res) {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Verification token is required"
            });
        }

        // Find all unexpired verification tokens
        const verificationTokens = await EmailVerificationToken.find({
            expiresAt: { $gt: new Date() }
        });

        let validToken = null;

        // Compare plain token with hashed tokens
        for (const verificationToken of verificationTokens) {
            const isMatch = await bcrypt.compare(
                token,
                verificationToken.tokenHash
            );

            if (isMatch) {
                validToken = verificationToken;
                break;
            }
        }

        if (!validToken) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification token"
            });
        }

        // Find user
        const user = await User.findById(validToken.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Already verified
        if (user.emailVerified) {
            return res.status(200).json({
                success: true,
                message: "Email is already verified"
            });
        }

        // Mark email as verified
        user.emailVerified = true;

        await user.save();

        // Delete verification token so it cannot be reused
        await EmailVerificationToken.deleteOne({
            _id: validToken._id
        });

        return res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });

    } catch (err) {
        console.error("Email Verification Error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

module.exports = {
    createUser,
    Login,
    deleteUser,
    refreshAccessToken,
    logout,
    verifyEmail
}