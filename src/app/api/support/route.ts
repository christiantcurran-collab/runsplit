import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceSupabase } from "@/lib/supabase-server";

// Use Haiku (cheapest Claude model) for support responses
const SUPPORT_MODEL = "claude-3-5-haiku-20241022";

const SYSTEM_PROMPT = `You are the RunSplit customer support assistant. RunSplit is an AI-powered running coach and training tools platform at runsplit.co.

Key facts about RunSplit:
- Free tier: 12 running tools (pace calculator, race predictor, splits planner, training paces, pace converter, age grade, VO2max estimator, heart rate zones, calories, treadmill converter, negative split, run/walk planner) and 5 sample training plans. No signup needed.
- Pro tier: £4.99/month (or £39.99/year). Includes AI-powered custom training plans, Strava integration & sync, weekly email summaries, race-day strategy, training log with trends, calendar exports, and plan adjustments.
- Users can connect Strava in Settings.
- Billing is managed through Stripe. Users can cancel anytime from Settings or the Stripe billing portal.
- Weekly email summaries can be toggled on/off in Settings.
- Sign in options: Email/password, Google, Apple.

Guidelines:
- Be warm, friendly, and concise. Use a supportive runner-to-runner tone.
- If a question is about billing, direct them to Settings > Manage Subscription or ask them to email support@runsplit.co for manual help.
- If a question is clearly outside your knowledge (e.g. a specific bug you can't diagnose), say you'll escalate it and the team will follow up via email.
- Never reveal internal implementation details, API keys, or system architecture.
- Keep responses under 200 words unless the question genuinely requires more detail.
- Format responses with markdown for readability.`;

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 }
      );
    }

    // Generate AI response
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const aiResponse = await anthropic.messages.create({
      model: SUPPORT_MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `From: ${name || "A user"} (${email})\nSubject: ${subject || "Support request"}\n\nMessage:\n${message}`,
        },
      ],
    });

    const responseText =
      aiResponse.content[0].type === "text"
        ? aiResponse.content[0].text
        : "Thanks for reaching out! Our team will get back to you soon.";

    // Log the support ticket in Supabase (table may not exist yet — fail gracefully)
    try {
      const supabase = createServiceSupabase();
      const { error: insertError } = await supabase.from("support_tickets").insert({
        name: name || null,
        email,
        subject: subject || null,
        message,
        ai_response: responseText,
        status: "auto_replied",
      });
      if (insertError) {
        console.warn("Could not log support ticket (table may not exist):", insertError.message);
      }
    } catch (dbErr) {
      console.warn("Support ticket DB error:", dbErr);
    }

    // Send auto-reply email if email provider configured
    await sendSupportReply({
      to: email,
      name: name || "there",
      subject: subject || "Your RunSplit support request",
      originalMessage: message,
      aiReply: responseText,
    });

    return NextResponse.json({
      success: true,
      reply: responseText,
    });
  } catch (err) {
    console.error("Support API error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to process support request",
      },
      { status: 500 }
    );
  }
}

async function sendSupportReply(options: {
  to: string;
  name: string;
  subject: string;
  originalMessage: string;
  aiReply: string;
}): Promise<boolean> {
  const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F8FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8FA;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:#0C0C0F;padding:24px;text-align:center;">
          <p style="margin:0;font-size:18px;font-weight:700;color:#F8F8FA;letter-spacing:-0.02em;">RunSplit Support</p>
        </td></tr>
        <tr><td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:15px;color:#0C0C0F;">Hey ${options.name},</p>
          <p style="margin:0 0 16px;font-size:14px;color:#6E6E7A;line-height:1.6;">Thanks for reaching out! Here's what we can tell you:</p>
          <div style="background:#F0F4FF;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
            <p style="margin:0;font-size:14px;color:#1E293B;line-height:1.6;white-space:pre-wrap;">${options.aiReply.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#A0A0AC;">Your original message:</p>
          <p style="margin:0 0 20px;font-size:13px;color:#6E6E7A;line-height:1.5;font-style:italic;border-left:3px solid #E4E4E8;padding-left:12px;">${options.originalMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;").substring(0, 500)}</p>
          <p style="margin:0;font-size:13px;color:#6E6E7A;line-height:1.5;">If this doesn't fully answer your question, just reply to this email and a human will follow up.</p>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#F8F8FA;border-top:1px solid #E4E4E8;text-align:center;">
          <p style="margin:0;font-size:11px;color:#A0A0AC;">RunSplit · AI-powered running intelligence · <a href="https://runsplit.co" style="color:#3B82F6;">runsplit.co</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Try Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "RunSplit Support <support@runsplit.co>",
          to: options.to,
          subject: `Re: ${options.subject}`,
          html: htmlBody,
          reply_to: "support@runsplit.co",
        }),
      });
      return res.ok;
    } catch (err) {
      console.error("Resend support email error:", err);
      return false;
    }
  }

  // Try SendGrid
  if (process.env.SENDGRID_API_KEY) {
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: {
            email: process.env.EMAIL_FROM || "support@runsplit.co",
            name: "RunSplit Support",
          },
          reply_to: { email: "support@runsplit.co", name: "RunSplit Support" },
          subject: `Re: ${options.subject}`,
          content: [{ type: "text/html", value: htmlBody }],
        }),
      });
      return res.ok || res.status === 202;
    } catch (err) {
      console.error("SendGrid support email error:", err);
      return false;
    }
  }

  console.log(`[Support Email] Would send to ${options.to}: Re: ${options.subject}`);
  console.log(`[Support Email] Configure RESEND_API_KEY or SENDGRID_API_KEY to enable.`);
  return true;
}




