
const nodemailer = require("nodemailer");


exports.sendEmail =async (email, otp, name) => {
  

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}); 

  try {
  const info = await transporter.sendMail({
    from: process.env.SMTP_USER, // sender addressprocess.env.SMTP_USER,
    to: email, // list of recipients
    subject: "Hello", // subject line
    text: "Hello world?", // plain text body
    html: `<div style="margin:0;padding:24px 12px;background:#f3f6fc;font-family:Arial,sans-serif"><div style=max-width:420px;margin:auto;background:#fff;border-radius:10px;overflow:hidden><div style=background:#101b35;padding:20px;text-align:center;color:#fff><h2 style=margin:0;font-size:21px>CareerConnect</h2><p style="margin:6px 0 0;font-size:12px;color:#c5d1e8">Your next opportunity starts here.</div><div style="padding:24px 20px;text-align:center"><h3 style="margin:0 0 10px;color:#15213a">Verify Your Email</h3><p style=font-size:13px;line-height:20px;color:#667085>Use the code below to complete your registration.<div style="margin:20px 0;padding:16px;background:#f0f5ff;border-radius:8px;color:#2864d7;font-size:28px;font-weight:700;letter-spacing:6px">${otp}</div><p style=font-size:12px;color:#667085>This code expires in <strong>5 minutes</strong>.<p style=font-size:12px;line-height:19px;color:#667085>Didn't create an account? You can safely ignore this email.</div><div style=background:#f8fafc;padding:14px;text-align:center><p style=margin:0;font-size:11px;color:#98a2b3>© CareerConnect · Connecting talent with opportunity.</div></div></div>`
  });

  console.log("Message sent: %s", info.messageId);

} catch (err) {
  console.error("Error while sending mail:", err);
}
  
  
}