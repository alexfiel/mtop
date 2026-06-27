import nodemailer from "nodemailer";

// Create a reusable transporter object using SMTP transport.
// In production, these should be securely stored in your .env file.
const getTransporter = async () => {
  if (!process.env.SMTP_HOST && process.env.NODE_ENV !== "production") {
    return null;
  }

  // Production configuration using your environment variables
  const options: any = {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
  };

  if (process.env.SMTP_USER) {
    options.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || "",
    };
  }

  return nodemailer.createTransport(options);
};

export const sendVerificationEmail = async (to: string, url: string) => {
  try {
    const transporter = await getTransporter();

    if (!transporter) {
      console.log("\n=======================================================");
      console.log(" DEVELOPMENT MODE: NO SMTP CONFIGURED");
      console.log(" VERIFICATION URL:");
      console.log(` ${url}`);
      console.log("=======================================================\n");
      return { success: true };
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"MTOP Portal" <noreply@mtop.lgu.gov.ph>',
      to,
      subject: "Verify your MTOP Account",
      text: `Please verify your email by clicking the following link: ${url}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-w-lg mx-auto p-6 bg-white rounded shadow">
          <h2 style="color: #333;">Welcome to the MTOP Management Portal!</h2>
          <p>You recently created an account. Please verify your email address to get started.</p>
          <div style="margin: 24px 0;">
            <a href="${url}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${url}">${url}</a>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            If you did not request this, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log("Message sent: %s", info.messageId);
    
    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error };
  }
};
