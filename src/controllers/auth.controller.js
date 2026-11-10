
const { sendEmail } = require("../helpers/sendEmail");
const UserModel = require("../model/user.model");
const apiResponse = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");

// ==========================================
// SIGNUP
// ==========================================

exports.signupController = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return apiResponse(res, 400, "Name, email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await UserModel.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    return apiResponse(res, 400, "Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const otp = uuidv4().substring(0, 4);

  const user = new UserModel({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    otp,
    otpExpire: new Date(Date.now() + 5 * 60 * 1000),
  });

  await user.save();

  try {
    await sendEmail(normalizedEmail, otp, name);

    return apiResponse(res, 201, "Account created successfully", {
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("Signup email error:", error.message);

    return apiResponse(
      res,
      500,
      "Account created, but verification email could not be sent. Please request a new OTP."
    );
  }
});


// ==========================================
// SIGNIN
// ==========================================

exports.signinController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return apiResponse(res, 400, "Email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await UserModel.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!existingUser) {
    return apiResponse(res, 401, "Invalid email or password");
  }

  if (!existingUser.isVerified) {
    return apiResponse(res, 403, "Please verify your email before signing in");
  }

  if (!existingUser.isActive) {
    return apiResponse(res, 403, "Your account is inactive");
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    existingUser.password
  );

  if (!isPasswordCorrect) {
    return apiResponse(res, 401, "Invalid email or password");
  }

  if (!process.env.privateKey) {
    return apiResponse(res, 500, "Authentication configuration error");
  }

  const token = jwt.sign(
    {
      email: existingUser.email,
      id: existingUser._id,
    },
    process.env.privateKey,
    {
      expiresIn: "2h",
    }
  );

  const user = {
    id: existingUser._id,
    email: existingUser.email,
    name: existingUser.name,
    role: existingUser.role,
    isActive: existingUser.isActive,
    isVerified: existingUser.isVerified,
  };

  return apiResponse(res, 200, "Login successful", {
    ...user,
    token,
  });
});


// ==========================================
// OTP VERIFICATION
// ==========================================

exports.optVerifyController = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return apiResponse(res, 400, "Email and OTP are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await UserModel.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    return apiResponse(res, 404, "User not found");
  }

  if (user.isVerified) {
    return apiResponse(res, 400, "Account is already verified");
  }

  if (!user.otp || !user.otpExpire || user.otpExpire <= new Date()) {
    return apiResponse(
      res,
      400,
      "OTP has expired. Please request a new one."
    );
  }

  if (user.otp !== otp) {
    return apiResponse(res, 400, "Invalid OTP");
  }

  user.otp = null;
  user.otpExpire = null;
  user.isVerified = true;

  await user.save();

  return apiResponse(res, 200, "OTP verification successful");
});


// ==========================================
// RESEND OTP
// ==========================================

exports.otpResendController = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return apiResponse(res, 400, "Email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await UserModel.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    return apiResponse(res, 404, "User not found");
  }

  if (user.isVerified) {
    return apiResponse(
      res,
      400,
      "This account is already verified. Please login directly."
    );
  }

  if (user.otpExpire && user.otpExpire > new Date()) {
    return apiResponse(
      res,
      429,
      "Please wait until your current OTP expires before requesting another."
    );
  }

  const otp = uuidv4().substring(0, 4);

  user.otp = otp;
  user.otpExpire = new Date(Date.now() + 5 * 60 * 1000);

  await user.save();

  try {
    await sendEmail(
      user.email,
      otp,
      user.name,
      "resend-otp"
    );

    return apiResponse(res, 200, "OTP resent successfully");
  } catch (error) {
    console.error("OTP resend email error:", error.message);

    return apiResponse(
      res,
      500,
      "Unable to send OTP email. Please try again later."
    );
  }
});



exports.forgotPasswordController = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return apiResponse(res, 400, "Email is required");
  }

  const user = await UserModel.findOne({
    email: email.trim().toLowerCase(),
  });

  if (!user) {
    return apiResponse(res, 404, "User not found");
  }

// Generate 4-digit reset code
const resetToken = crypto.randomInt(1000, 10000).toString();

// Hash reset code
const hashedToken = crypto
  .createHash("sha256")
  .update(resetToken)
  .digest("hex");

  // Save token and expiration
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 5 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  // Send reset token through email
  await sendEmail(
    user.email,
    resetToken,
    user.name,
    "forgot-password"
  );

  return apiResponse(res, 200, "Password reset token sent to your email");
});




exports.resetPasswordController = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  // Validate input
  if (!token || !password || !confirmPassword) {
    return apiResponse(res, 400, "All fields are required");
  }

  if (password.length < 6) {
    return apiResponse(res, 400, "Password must be at least 6 characters");
  }

  if (password !== confirmPassword) {
    return apiResponse(res, 400, "Passwords do not match");
  }

  // Hash the received reset code
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find user using reset code
  const user = await UserModel.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    return apiResponse(res, 400, "Invalid or expired reset code");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update password
  user.password = hashedPassword;

  // Remove reset code after successful reset
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return apiResponse(
    res,
    200,
    "Password reset successful. Please login with your new password."
  );
});
// RESET PASSWORD
// ==========================================


exports.resetPasswordController = asyncHandler(async (req, res) => {
  const { otp, password, confirmPassword } = req.body;

  // Validate fields
  if (!otp || !password || !confirmPassword) {
    return apiResponse(res, 400, "All fields are required");
  }

  if (!/^\d{4}$/.test(otp)) {
    return apiResponse(res, 400, "OTP must be exactly 4 digits");
  }

  if (password.length < 6) {
    return apiResponse(res, 400, "Password must be at least 6 characters");
  }

  if (password !== confirmPassword) {
    return apiResponse(res, 400, "Passwords do not match");
  }

  // Hash OTP
  const hashedToken = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  // Find user with valid OTP
  const user = await UserModel.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    return apiResponse(res, 400, "Invalid or expired OTP");
  }

  // Hash new password
  user.password = await bcrypt.hash(password, 10);

  // Remove used OTP
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return apiResponse(
    res,
    200,
    "Password reset successful. Please login with your new password."
  );
});

