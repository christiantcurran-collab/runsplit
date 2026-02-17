import { NextResponse } from "next/server";

/**
 * Quick test endpoint to verify Resend is configured and can send.
 * Usage: POST /api/email/test { "to": "your@email.com" }
 * Protected: requires CRON_SECRET in Authorization header.
 */
export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to } = await request.json();
    if (!to) {
      return NextResponse.json({ error: "\"to\" email is required" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://runsplit.co";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "RunSplit <support@runsplit.co>",
        to,
        subject: "RunSplit Email Test - It Works!",
        html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8F8FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8FA;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:#0C0C0F;padding:24px;text-align:center;">
          <p style="margin:0;font-size:20px;font-weight:800;color:#F8F8FA;">RunSplit</p>
        </td></tr>
        <tr><td style="padding:32px 24px;text-align:center;">
          <p style="margin:0 0 12px;font-size:32px;">&#9989;</p>
          <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0C0C0F;">Email is working!</p>
          <p style="margin:0;font-size:14px;color:#6E6E7A;line-height:1.6;">
            This is a test email sent from <strong>support@runsplit.co</strong> via Resend.<br/>
            Sent at: ${new Date().toISOString()}
          </p>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#F8F8FA;border-top:1px solid #E4E4E8;text-align:center;">
          <p style="margin:0;font-size:11px;color:#A0A0AC;">
            <a href="${appUrl}" style="color:#3B82F6;">runsplit.co</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
        reply_to: "support@runsplit.co",
      }),
    });

    const body = await res.json();

    if (res.ok) {
      return NextResponse.json({ success: true, resend_id: body.id });
    } else {
      return NextResponse.json({ success: false, status: res.status, error: body }, { status: 500 });
    }
  } catch (err) {
    console.error("Email test error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Test failed" },
      { status: 500 }
    );
  }
}

