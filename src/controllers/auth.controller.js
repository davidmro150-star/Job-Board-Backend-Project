const { sendEmail } = require("../helpers/sendEmail");
const UserModel = require("../model/user.model");
const apiResponse = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { v4: uuidv4 } = require("uuid");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.signupController = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Check for duplicate email BEFORE doing anything else
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    return apiResponse(res, 400, "Email is already registered");
  }

  bcrypt.hash(password, 10, async function(err, hash) {
    if (err) {
      return apiResponse(res, 500, err || "Internal server error");
    }

    // 2. Use try/catch inside the callback to catch any database/email errors securely
    try {
      const otp = uuidv4().substring(0, 4);

      const user = new UserModel({
        name,
        email,
        password: hash, 
        otpExpire: Date.now() + 5 * 60 * 1000,
        otp
      });

      await user.save();

      setTimeout(async() => {
        user.otp = null;
        user.otpExpire = null;
        await user.save()
      },120000);
       sendEmail(email, otp, name);

      return apiResponse(
        res,
        201,
        "Account created successfully",
        {
          id: user._id,
          name: user.name,
          email: user.email,
        }
      );
    } catch (dbError) {
      // Prevents the server from crashing if saving or emailing fails
      return apiResponse(res, 500, "Database or email service failure");
    }
  });
});


exports.signinController = asyncHandler(async (req, res) => {
  let { email, password } = req.body;
  let existingUser = await UserModel.findOne({ email }).select("+password");
  
  if (!existingUser) {
    //Added 'return' to prevent execution from continuing into bcrypt
    return apiResponse(res, 404, "email not found"); 
  } 

  // Load hash from your password DB.
  bcrypt.compare(password, existingUser.password, function(err, result) {
    if (err) {
      return apiResponse(res, 500, "Error comparing passwords");
    }

    if (result) {
      let user = {
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
        isActive: existingUser.isActive,
        isVerified: existingUser.isVerified,
      };

      //Double check that process.env.privateKey is defined in your .env file
      jwt.sign(
        { email: existingUser.email, id: existingUser._id },
        process.env.privateKey || 'fallback_secret_for_testing', 
        { expiresIn: "2m" },
        function (err, token) {
          if (err) {
            return apiResponse(res, 500, "Error signing token");
          }
          return apiResponse(res, 200, "user login successfull", { ...user, token });
        }
      );
    } else {
      return apiResponse(res, 401, "invalid password"); // Changed from 404 to 401 Unauthorized
    }
  }); 
});

exports.optVerifyController = asyncHandler(async (req, res) => {

  const { email, otp } = req.body;
  const user = await UserModel.findOne({ email });
 
  if (user.otp == otp) {
    if (user.otpExpire > new Date()) {

      user.otp = null;
      user.isVerified = true;
      await user.save()
      apiResponse(res, 200, "otp verify successful") 
    }
  } else {
    apiResponse(res, 400, "the one time password hass expired. Please request a new one.")
  }

  res.send(user)
   
});
exports.otpResendController = asyncHandler(async (req, res) => {
  let { email } = req.body;
  let existingUser = await UserModel.findOne({ email });
  
  if (existingUser) {
    // 1. MATCHED TO SCHEMA: Blocks resending if the account is already email-verified
    if (existingUser.isVerified) {
      return apiResponse(res, 400, "This account is already verified. Please login directly.");
    }

    // 2. Cooldown check
    if (existingUser.otpExpire && existingUser.otpExpire > new Date()) {
      return apiResponse(res, 429, "OTP resend limit exceeded. Please wait before trying again.");
    } else {
      const otp = uuidv4().substring(0, 4); 
      
      existingUser.otpExpire = Date.now() + 2 * 60 * 1000; // 2 minutes cooldown
      existingUser.otp = otp;
      
      await existingUser.save();
      
      await sendEmail(email, otp, existingUser.name, "resend-otp");

      return apiResponse(res, 200, "OTP resent successfully");
    }
  } else {
    return apiResponse(res, 404, "user not found");
  }
});




