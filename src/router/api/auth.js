
const express = require("express");

const {
  signupController,
  signinController,
  optVerifyController,
  otpResendController,
  forgotPasswordController,
  resetPasswordController,
  
} = require("../../controllers/auth.controller");

const router = express.Router();

console.log("router");

router.post("/signup", signupController);
router.post("/signin", signinController);
router.post("/otp-verify", optVerifyController);
router.post("/otp-resend", otpResendController);

// Forgot Password Routes
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

module.exports = router;
