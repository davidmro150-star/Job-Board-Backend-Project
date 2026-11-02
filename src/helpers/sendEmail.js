const nodemailer = require("nodemailer");

// 1. Added a 'templateType' parameter to determine which subject and HTML to use
exports.sendEmail = async (email, otp, name, templateType = "verify-account") => {
  
  // Create a transporter using SMTP
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false, // use STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  }); 

  // 2. Dynamically set the subject based on the template type
  let subject = "User Verification Email";
  if (templateType === "resend-otp") {
    subject = "Resend OTP Verification";
  }

  // 3. Dynamically set distinct HTML templates and titles based on the type
  let htmlContent = "";

  if (templateType === "resend-otp") {
    // DESIGN 2: OTP Resend Verification Template (Warm/Alert themed orange-blue accent)
    htmlContent = `
      <div style="margin:0;padding:24px 12px;background:#fefefe;font-family:Arial,sans-serif">
        <div style="max-width:420px;margin:auto;background:#fff;border:1px solid #e4e7ec;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.03)">
          <div style="background:#101b35;padding:20px;text-align:center;color:#fff">
            <h2 style="margin:0;font-size:21px">CareerConnect</h2>
            <p style="margin:6px 0 0;font-size:12px;color:#c5d1e8">Requested a new code?</p>
          </div>
          <div style="padding:24px 20px;text-align:center">
            <h3 style="margin:0 0 10px;color:#15213a">New Verification Code</h3>
            <p style="font-size:13px;line-height:20px;color:#667085;margin-bottom:5px">Hello <strong>${name}</strong>,</p>
            <p style="font-size:13px;line-height:20px;color:#667085;margin-top:0">Here is your fresh authentication code as requested. Use it quickly to finalize your verification step.</p>
            <div style="margin:20px 0;padding:16px;background:#fff6ed;border:1px dashed #fdba74;border-radius:8px;color:#ea580c;font-size:28px;font-weight:700;letter-spacing:6px">${otp}</div>
            <p style="font-size:12px;color:#667085">This new code will remain valid for exactly <strong>5 minutes</strong>.</p>
            <p style="font-size:11px;line-height:19px;color:#98a2b3;margin-top:20px">If you didn't trigger this request, please change your account security settings immediately.</p>
          </div>
          <div style="background:#f8fafc;padding:14px;text-align:center;border-top:1px solid #f1f5f9">
            <p style="margin:0;font-size:11px;color:#98a2b3">© CareerConnect · Connecting talent with opportunity.</p>
          </div>
        </div>
      </div>`;
  } else {
    // DESIGN 1: Must User Verification Template (Standard Welcome Deep Blue accent)
    htmlContent = `
      <div style="margin:0;padding:24px 12px;background:#f3f6fc;font-family:Arial,sans-serif">
        <div style="max-width:420px;margin:auto;background:#fff;border-radius:10px;overflow:hidden">
          <div style="background:#101b35;padding:20px;text-align:center;color:#fff">
            <h2 style="margin:0;font-size:21px">CareerConnect</h2>
            <p style="margin:6px 0 0;font-size:12px;color:#c5d1e8">Your next opportunity starts here.</p>
          </div>
          <div style="padding:24px 20px;text-align:center">
            <h3 style="margin:0 0 10px;color:#15213a">Verify Your Email</h3>
            <p style="font-size:13px;line-height:20px;color:#667085;margin-bottom:5px">Welcome to the platform, <strong>${name}</strong>!</p>
            <p style="font-size:13px;line-height:20px;color:#667085;margin-top:0">Use the code below to complete your registration and secure your profile.</p>
            <div style="margin:20px 0;padding:16px;background:#f0f5ff;border-radius:8px;color:#2864d7;font-size:28px;font-weight:700;letter-spacing:6px">${otp}</div>
            <p style="font-size:12px;color:#667085">This code expires in <strong>5 minutes</strong>.</p>
            <p style="font-size:12px;line-height:19px;color:#667085">Didn't create an account? You can safely ignore this email.</p>
          </div>
          <div style="background:#f8fafc;padding:14px;text-align:center">
            <p style="margin:0;font-size:11px;color:#98a2b3">© CareerConnect · Connecting talent with opportunity.</p>
          </div>
        </div>
      </div>`;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: subject, // Dynamically loaded subject lines
      text: `Your code is ${otp}`, 
      html: htmlContent // Dynamically loaded template layouts
    });

    console.log("Message sent: %s", info.messageId);
  } catch (err) {
    console.error("Error while sending mail:", err);
  }
};
