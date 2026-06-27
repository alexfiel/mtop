import nodemailer from "nodemailer";
import "dotenv/config";

async function test() {
  console.log("Testing email with config:", {
    host: process.env.SMTP_HOST || "localhost",
    port: Number(process.env.SMTP_PORT) || 1025,
    secure: process.env.SMTP_SECURE === "true"
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: Number(process.env.SMTP_PORT) || 1025,
    secure: process.env.SMTP_SECURE === "true",
  });

  try {
    const info = await transporter.sendMail({
      from: '"Test" <test@example.com>',
      to: "receiver@example.com",
      subject: "Test email",
      text: "Testing 123",
    });
    console.log("Success! Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

test();
