const express = require("express")
const { signupController, signinController } = require("../../controllers/auth.controller")
const router = express.Router()

//localhost:3000/api/auth/signup
console.log("router")
router.post("/signup", signupController)
router.post("/signin", signinController)


module.exports = router;