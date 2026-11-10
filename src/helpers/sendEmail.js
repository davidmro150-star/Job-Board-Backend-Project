
const nodemailer = require("nodemailer");

// Escape user-provided text before inserting it into HTML
const escapeHtml = (value = "") => {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
};

// Reusable Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS?.replace(/\s/g, ""),
  },
});

// Verify SMTP configuration
exports.verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("Email server connection successful");
    return true;
  } catch (error) {
    console.error("Email server connection failed:", error);
    throw error;
  }
};

// Send email
exports.sendEmail = async (
  email,
  content,
  name,
  templateType = "verify-account"
) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(
      "SMTP_USER or SMTP_PASS is missing from environment variables"
    );
  }

  const safeName = escapeHtml(name);
  const safeContent = escapeHtml(content);

  let subject;
  let htmlContent;
  let textContent;

  // Common email design
  const emailLayout = (title, subtitle, body) => `
    <div style="
      margin:0;
      padding:40px 15px;
      background:#f3f5f9;
      font-family:Arial,Helvetica,sans-serif;
    ">

      <div style="
        max-width:500px;
        margin:0 auto;
        background:#ffffff;
        border:1px solid #e5e7eb;
        border-radius:12px;
        overflow:hidden;
      ">

        <!-- Header -->
        <div style="
          background:#173b70;
          padding:28px 20px;
          text-align:center;
        ">
          <h1 style="
            margin:0;
            color:#ffffff;
            font-size:25px;
            font-weight:700;
          ">
            CareerConnect
          </h1>

          <p style="
            margin:8px 0 0;
            color:#dbeafe;
            font-size:13px;
          ">
            Your Career. Your Future.
          </p>
        </div>

        <!-- Content -->
        <div style="padding:35px 28px;text-align:center;">

          <h2 style="
            margin:0 0 12px;
            color:#172033;
            font-size:23px;
          ">
            ${title}
          </h2>

          <p style="
            margin:0 0 25px;
            color:#64748b;
            font-size:14px;
            line-height:1.8;
          ">
            ${subtitle}
          </p>

          ${body}

        </div>

        <!-- Footer -->
        <div style="
          padding:22px 20px;
          background:#f8fafc;
          border-top:1px solid #e5e7eb;
          text-align:center;
        ">
          <p style="
            margin:0 0 8px;
            color:#64748b;
            font-size:12px;
          ">
            © ${new Date().getFullYear()} CareerConnect. All rights reserved.
          </p>

          <p style="
            margin:0;
            color:#94a3b8;
            font-size:11px;
          ">
            This is an automated email. Please do not reply.
          </p>
        </div>

      </div>

    </div>
  `;

  // Verification code design
  const codeBox = (code, color = "#173b70") => `
    <div style="
      margin:25px 0;
      padding:22px 15px;
      background:#f1f5f9;
      border:1px solid #dbe3ef;
      border-radius:10px;
    ">
      <p style="
        margin:0 0 12px;
        color:#64748b;
        font-size:11px;
        font-weight:600;
        letter-spacing:1.5px;
      ">
        YOUR VERIFICATION CODE
      </p>

      <div style="
        color:${color};
        font-size:36px;
        font-weight:700;
        letter-spacing:10px;
      ">
        ${code}
      </div>
    </div>
  `;

  // FORGOT PASSWORD EMAIL
  if (templateType === "forgot-password") {
    subject = "Password Reset Code - CareerConnect";

    htmlContent = emailLayout(
      "Reset Your Password",
      `Hello <strong>${safeName}</strong>,<br>
       We received a request to reset your CareerConnect password.
       Use the code below to continue.`,
      `
        ${codeBox(safeContent)}

        <p style="
          color:#64748b;
          font-size:13px;
          line-height:1.7;
        ">
          This code will expire in <strong>10 minutes</strong>.
        </p>

        <p style="
          color:#94a3b8;
          font-size:12px;
          line-height:1.7;
        ">
          If you did not request a password reset,
          you can safely ignore this email.
          Your account will remain secure.
        </p>
      `
    );

    textContent = `
Hello ${name},

We received a request to reset your CareerConnect password.

Your password reset code is: ${content}

This code expires in 10 minutes.

If you did not request this, please ignore this email.
    `;
  }

  // RESEND OTP EMAIL
  else if (templateType === "resend-otp") {
    subject = "Your New Verification Code - CareerConnect";

    htmlContent = emailLayout(
      "New Verification Code",
      `Hello <strong>${safeName}</strong>,<br>
       Here is your new email verification code.
       Enter this code to verify your account.`,
      `
        ${codeBox(safeContent, "#ea580c")}

        <p style="
          color:#64748b;
          font-size:13px;
        ">
          This code will expire in <strong>5 minutes</strong>.
        </p>

        <p style="
          color:#94a3b8;
          font-size:12px;
          line-height:1.7;
        ">
          If you did not request a new verification code,
          you can ignore this email.
        </p>
      `
    );

    textContent = `
Hello ${name},

Your new CareerConnect verification code is: ${content}

This code expires in 5 minutes.
    `;
  }

  // ACCOUNT VERIFICATION EMAIL
  else if (templateType === "verify-account") {
    subject = "Verify Your Email Address - CareerConnect";

    htmlContent = emailLayout(
      "Welcome to CareerConnect!",
      `Hello <strong>${safeName}</strong>,<br>
       Thank you for creating your account.
       Please verify your email address using the code below.`,
      `
        ${codeBox(safeContent)}

        <p style="
          color:#64748b;
          font-size:13px;
        ">
          This code will expire in <strong>5 minutes</strong>.
        </p>

        <p style="
          color:#94a3b8;
          font-size:12px;
          line-height:1.7;
        ">
          If you did not create this account,
          please ignore this email.
        </p>
      `
    );

    textContent = `
Hello ${name},

Welcome to CareerConnect!

Your email verification code is: ${content}

This code expires in 5 minutes.
    `;
  }

  else {
    throw new Error("Invalid email template type");
  }

  // SEND EMAIL
  try {
    const info = await transporter.sendMail({
      from: `"CareerConnect" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log("Email successfully sent:", info.messageId);

    return info;
  } catch (error) {
    console.error("Email delivery failed:", error);
    throw error;
  }
};
