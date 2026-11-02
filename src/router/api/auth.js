const express = require("express")
const { signupController, signinController, optVerifyController, otpResendController } = require("../../controllers/auth.controller")
const router = express.Router()

//localhost:3000/api/auth/signup
console.log("router")
router.post("/signup", signupController)
router.post("/signin", signinController)
router.post("/otp-verify", optVerifyController)
router.post("/otp-resend", otpResendController )


module.exports = router;