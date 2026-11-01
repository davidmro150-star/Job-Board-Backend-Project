
const { sendEmail } = require("../helpers/sendEmail");
const UserModel = require("../model/user.model");
const apiResponse = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { v4: uuidv4 } = require("uuid");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.signupController = asyncHandler(async (req, res) => {
 

  const { name, email, password } = req.body;

   bcrypt.hash(password, 10,  async function(err, hash) {
     
     if (err) {
       apiResponse(res, 500, err|| "internal server error")
     } else {
        const otp = uuidv4().substring(0, 4);
       
       
       res.send(hash)
       const user = new UserModel({
    name,
    email,
    password: hash, 
    otpExpire: Date.now() + 5*60*1000
  });

  await user.save();

  await sendEmail(email, otp, name);

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
     }
   });
  
  
});

exports.signinController = asyncHandler (async (req, res) => {
  
  let {email, password} = req.body;
  let existingUser =await UserModel.findOne({ email }).select("+password");
  if (!existingUser) {
     apiResponse(res,404, "email not found")
  } else {
    // Load hash from your password DB.
     bcrypt.compare(password, existingUser.password, function(err, result) {
       if (result) {
         
         let user = {
           email: existingUser.email,
           name: existingUser.name,
           role: existingUser.role,
           isActive: existingUser.isActive,
           isVerified: existingUser.isVerified,
         }
jwt.sign(
  { email: existingUser.email, id: existingUser._id },
  process.env.privateKey,
  {
  
    expiresIn: "2m"
  },
  function (err, token) {
     apiResponse(res, 200, "user login successfull", { ...user, token});
  }
);

         
       } else {
         apiResponse(res,404, "invalid password")
   }
}); 
   }
    

})

