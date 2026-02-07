import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface ContactBody {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * POST /api/contact — Send a contact form email via nodemailer.
 */
export async function POST(request: Request) {
  let body: ContactBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { name, email, subject, message } = body;

  // Server-side validation
  const errors: string[] = [];

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters.");
  }
  if (name && name.length > 100) {
    errors.push("Name must be under 100 characters.");
  }

  if (
    !email ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    errors.push("A valid email address is required.");
  }

  if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
    errors.push("Subject must be at least 3 characters.");
  }
  if (subject && subject.length > 200) {
    errors.push("Subject must be under 200 characters.");
  }

  if (!message || typeof message !== "string" || message.trim().length < 10) {
    errors.push("Message must be at least 10 characters.");
  }
  if (message && message.length > 5000) {
    errors.push("Message must be under 5000 characters.");
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: errors.join(" ") },
      { status: 400 }
    );
  }

  // Environment variables
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_APP_PASSWORD;

  if (!smtpEmail || !smtpPassword) {
    console.error("Missing SMTP_EMAIL or SMTP_APP_PASSWORD env variables");
    return NextResponse.json(
      { error: "Email service is not configured. Please try again later." },
      { status: 500 }
    );
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });

  const sanitizedName = name.trim().replace(/[<>]/g, "");
  const sanitizedEmail = email.trim();
  const sanitizedSubject = subject.trim().replace(/[<>]/g, "");
  const sanitizedMessage = message.trim();

  try {
    await transporter.sendMail({
      from: `"GenTales Contact" <${smtpEmail}>`,
      to: smtpEmail,
      replyTo: sanitizedEmail,
      subject: `[GenTales Contact] ${sanitizedSubject}`,
      text: [
        `Name: ${sanitizedName}`,
        `Email: ${sanitizedEmail}`,
        `Subject: ${sanitizedSubject}`,
        "",
        "Message:",
        sanitizedMessage,
      ].join("\n"),
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">New Contact Message — GenTales</h2>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Name</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${sanitizedName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Email</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
                <a href="mailto:${sanitizedEmail}">${sanitizedEmail}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Subject</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${sanitizedSubject}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; white-space: pre-wrap;">
            ${sanitizedMessage.replace(/\n/g, "<br>")}
          </div>
          <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
            Sent from GenTales contact form
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to send contact email:", err);
    return NextResponse.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 }
    );
  }
}
