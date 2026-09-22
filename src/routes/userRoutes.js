const express = require("express");
const router = express.Router();
const {auth} = require('../middleware/auth')
const {authorize} = require("../middleware/authorize")

const {
    createUser,
    Login,
    deleteUser,
    refreshAccessToken
} = require("../controllers/userController");

router.post("/register", createUser);
router.post("/login", Login);
router.post("/refresh", refreshAccessToken);
router.delete( "/users/:id", auth, authorize("admin"), deleteUser);

module.exports = router;