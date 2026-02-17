import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";

/**
 * Send a welcome email to a new user.
 * Called internally after sign-up (not user-facing).
 * Expects JSON body: { userId: string }
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const supabase = createServiceSupabase();

    // Get user email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    if (!authUser?.user?.email) {
      return NextResponse.json({ error: "User not found or no email" }, { status: 404 });
    }

    const email = authUser.user.email;
    const displayName =
      authUser.user.user_metadata?.full_name ||
      authUser.user.user_metadata?.name ||
      email.split("@")[0];

    // Check if we already sent a welcome email to this user
    try {
      const { data: existingEmail } = await supabase
        .from("email_log")
        .select("id")
        .eq("user_id", userId)
        .eq("email_type", "welcome")
        .limit(1);

      if (existingEmail && existingEmail.length > 0) {
        console.log(`Welcome email already sent to ${email}, skipping`);
        return NextResponse.json({ success: true, skipped: true });
      }
    } catch {
      // email_log table may not exist yet — continue anyway
    }

    // Build and send the welcome email
    const html = buildWelcomeEmailHtml(displayName);
    const sent = await sendWelcomeEmail(email, html);

    // Log it
    try {
      await supabase.from("email_log").insert({
        user_id: userId,
        email_type: "welcome",
        metadata: { sent },
      });
    } catch {
      // Table might not exist yet
    }

    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error("Welcome email error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send welcome email" },
      { status: 500 }
    );
  }
}

async function sendWelcomeEmail(to: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Welcome Email] No RESEND_API_KEY — would send to ${to}`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "RunSplit <support@runsplit.co>",
        to,
        subject: "Welcome to RunSplit — let's get you faster",
        html,
        reply_to: "support@runsplit.co",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend welcome email failed:", res.status, body);
      return false;
    }

    console.log(`Welcome email sent to ${to}`);
    return true;
  } catch (err) {
    console.error("Resend welcome email error:", err);
    return false;
  }
}

function buildWelcomeEmailHtml(name: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://runsplit.co";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F8FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8FA;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr><td style="background:#0C0C0F;padding:32px 24px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:800;color:#F8F8FA;letter-spacing:-0.02em;">RunSplit</p>
          <p style="margin:6px 0 0;font-size:13px;color:#9898A6;">AI-Powered Running Intelligence</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 24px 16px;">
          <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#0C0C0F;">Hey ${name}, welcome aboard!</p>
          <p style="margin:0 0 20px;font-size:14px;color:#4A4A5A;line-height:1.7;">
            You've just joined RunSplit — the running platform that uses AI to help you train smarter, race faster, and enjoy every kilometre.
          </p>
        </td></tr>

        <!-- What you can do -->
        <tr><td style="padding:0 24px 24px;">
          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0C0C0F;">Here's what you can do right now:</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E8;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #E4E4E8;">
                <p style="margin:0;font-size:14px;color:#0C0C0F;font-weight:600;">&#9889; 12 Free Running Calculators</p>
                <p style="margin:4px 0 0;font-size:13px;color:#6E6E7A;line-height:1.5;">Pace calculator, race predictor, splits planner, VDOT estimator, and more — no sign-up needed.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #E4E4E8;">
                <p style="margin:0;font-size:14px;color:#0C0C0F;font-weight:600;">&#127939; AI Training Plans (Pro)</p>
                <p style="margin:4px 0 0;font-size:13px;color:#6E6E7A;line-height:1.5;">Get a custom plan built around your goal race, fitness level, and schedule — powered by AI coaching.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0;font-size:14px;color:#0C0C0F;font-weight:600;">&#128200; Strava Integration (Pro)</p>
                <p style="margin:4px 0 0;font-size:13px;color:#6E6E7A;line-height:1.5;">Connect your watch, sync your runs, and let your plan adapt to your actual training data.</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 24px 32px;text-align:center;">
          <a href="${appUrl}/start" style="display:inline-block;background:#3B82F6;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:10px;">
            Get Started
          </a>
          <p style="margin:12px 0 0;font-size:12px;color:#A0A0AC;">
            Or explore the <a href="${appUrl}/tools" style="color:#3B82F6;text-decoration:none;">free tools</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 24px;background:#F8F8FA;border-top:1px solid #E4E4E8;text-align:center;">
          <p style="margin:0;font-size:11px;color:#A0A0AC;line-height:1.6;">
            Questions? Just reply to this email — we're real runners who love to help.
            <br/>
            <a href="${appUrl}" style="color:#6E6E7A;text-decoration:none;">runsplit.co</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

