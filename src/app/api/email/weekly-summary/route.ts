import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";

// This endpoint is designed to be called by a cron job (e.g. Vercel Cron, GitHub Actions)
// It sends weekly training summaries to Pro users who have opted in.
// Protect it with a secret key in production.

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceSupabase();

    // Get all Pro users who have opted in to weekly emails
    const { data: eligibleUsers, error: usersError } = await supabase
      .from("profiles")
      .select("id, display_name, email_weekly_summary, preferred_unit, current_weekly_km")
      .in("subscription_status", ["active", "trialing"])
      .eq("email_weekly_summary", true);

    if (usersError) {
      console.error("Error fetching eligible users:", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    if (!eligibleUsers || eligibleUsers.length === 0) {
      return NextResponse.json({ message: "No eligible users for weekly summary", sent: 0 });
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const results: { userId: string; status: string }[] = [];

    for (const userProfile of eligibleUsers) {
      try {
        // Check if we already sent a weekly summary in the last 6 days
        const { data: recentEmails } = await supabase
          .from("email_log")
          .select("id")
          .eq("user_id", userProfile.id)
          .eq("email_type", "weekly_summary")
          .gte("sent_at", new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (recentEmails && recentEmails.length > 0) {
          results.push({ userId: userProfile.id, status: "skipped_recent" });
          continue;
        }

        // Get user's email from auth
        const { data: authUser } = await supabase.auth.admin.getUserById(userProfile.id);
        if (!authUser?.user?.email) {
          results.push({ userId: userProfile.id, status: "no_email" });
          continue;
        }

        // Get active training plan
        const { data: plans } = await supabase
          .from("training_plans")
          .select("id, name, plan_data, plan_weeks, goal_race_date, goal_race_distance_meters")
          .eq("user_id", userProfile.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1);

        const activePlan = plans?.[0];

        // Get training log entries from last week
        const { data: logEntries } = await supabase
          .from("training_log")
          .select("*")
          .eq("user_id", userProfile.id)
          .gte("date", oneWeekAgo.toISOString().split("T")[0])
          .lte("date", now.toISOString().split("T")[0]);

        // Get Strava activities from last week
        const { data: stravaActivities } = await supabase
          .from("strava_activities")
          .select("*")
          .eq("user_id", userProfile.id)
          .gte("start_date", oneWeekAgo.toISOString())
          .lte("start_date", now.toISOString());

        // Build email data
        const totalLoggedKm = (logEntries || []).reduce(
          (sum: number, e: { distance_meters?: number | null }) => sum + (e.distance_meters ? e.distance_meters / 1000 : 0), 0
        );
        const totalStravaKm = (stravaActivities || []).reduce(
          (sum: number, a: { distance_meters?: number | null }) => sum + (a.distance_meters ? a.distance_meters / 1000 : 0), 0
        );
        const totalKm = Math.max(totalLoggedKm, totalStravaKm);
        const totalRuns = Math.max(
          (logEntries || []).filter((e: { completed?: boolean }) => e.completed).length,
          (stravaActivities || []).length
        );

        // Calculate days until race
        let daysUntilRace: number | null = null;
        if (activePlan?.goal_race_date) {
          daysUntilRace = Math.ceil(
            (new Date(activePlan.goal_race_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        // Build the email HTML
        const emailHtml = buildWeeklyEmailHtml({
          displayName: userProfile.display_name || "Runner",
          totalKm: Math.round(totalKm * 10) / 10,
          totalRuns,
          planName: activePlan?.name || null,
          daysUntilRace,
          preferredUnit: userProfile.preferred_unit || "km",
        });

        // Send email via Supabase Edge Function or configured email provider
        // For now, we use Supabase's built-in email (or you can swap for Resend/SendGrid)
        const emailSent = await sendEmail({
          to: authUser.user.email,
          subject: `Your Week in Running — ${Math.round(totalKm * 10) / 10}km logged`,
          html: emailHtml,
        });

        if (emailSent) {
          // Log the email
          await supabase.from("email_log").insert({
            user_id: userProfile.id,
            email_type: "weekly_summary",
            metadata: {
              total_km: totalKm,
              total_runs: totalRuns,
              plan_name: activePlan?.name || null,
            },
          });
          results.push({ userId: userProfile.id, status: "sent" });
        } else {
          results.push({ userId: userProfile.id, status: "send_failed" });
        }
      } catch (err) {
        console.error(`Error processing user ${userProfile.id}:`, err);
        results.push({ userId: userProfile.id, status: "error" });
      }
    }

    const sentCount = results.filter((r) => r.status === "sent").length;
    return NextResponse.json({
      message: `Weekly summaries processed`,
      total: eligibleUsers.length,
      sent: sentCount,
      results,
    });
  } catch (err) {
    console.error("Weekly summary error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send weekly summaries" },
      { status: 500 }
    );
  }
}

// ============================================
// Email sending helper
// ============================================

async function sendEmail(options: { to: string; subject: string; html: string }): Promise<boolean> {
  // Option 1: Resend (recommended)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "RunSplit <noreply@runsplit.co>",
          to: options.to,
          subject: options.subject,
          html: options.html,
        }),
      });
      return res.ok;
    } catch (err) {
      console.error("Resend email error:", err);
      return false;
    }
  }

  // Option 2: SendGrid
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
          from: { email: process.env.EMAIL_FROM || "noreply@runsplit.co", name: "RunSplit" },
          subject: options.subject,
          content: [{ type: "text/html", value: options.html }],
        }),
      });
      return res.ok || res.status === 202;
    } catch (err) {
      console.error("SendGrid email error:", err);
      return false;
    }
  }

  // No email provider configured — log and skip
  console.log(`[Email] Would send to ${options.to}: ${options.subject}`);
  console.log(`[Email] Configure RESEND_API_KEY or SENDGRID_API_KEY to enable sending.`);
  return true; // Return true so we still log it
}

// ============================================
// Email HTML template
// ============================================

function buildWeeklyEmailHtml(data: {
  displayName: string;
  totalKm: number;
  totalRuns: number;
  planName: string | null;
  daysUntilRace: number | null;
  preferredUnit: string;
}): string {
  const distance = data.preferredUnit === "mile"
    ? `${(data.totalKm * 0.621371).toFixed(1)} miles`
    : `${data.totalKm} km`;

  const raceCountdown = data.daysUntilRace && data.daysUntilRace > 0
    ? `<tr><td style="padding:16px 24px;background:#EFF6FF;border-radius:8px;text-align:center;">
        <p style="margin:0;font-size:14px;color:#1E40AF;">
          <strong>${data.daysUntilRace} days</strong> until race day
        </p>
      </td></tr><tr><td style="height:16px"></td></tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F8FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8FA;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr><td style="background:#0C0C0F;padding:24px;text-align:center;">
          <p style="margin:0;font-size:18px;font-weight:700;color:#F8F8FA;letter-spacing:-0.02em;">RunSplit</p>
          <p style="margin:4px 0 0;font-size:13px;color:#9898A6;">Your Weekly Training Summary</p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:24px 24px 8px;">
          <p style="margin:0;font-size:16px;font-weight:600;color:#0C0C0F;">Hey ${data.displayName},</p>
          <p style="margin:8px 0 0;font-size:14px;color:#6E6E7A;line-height:1.5;">Here's how your week of training went:</p>
        </td></tr>

        <!-- Stats -->
        <tr><td style="padding:16px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E8;border-radius:12px;overflow:hidden;">
            <tr>
              <td width="50%" style="padding:20px;text-align:center;border-right:1px solid #E4E4E8;">
                <p style="margin:0;font-size:28px;font-weight:800;color:#3B82F6;">${distance}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#A0A0AC;text-transform:uppercase;letter-spacing:0.05em;">Total Distance</p>
              </td>
              <td width="50%" style="padding:20px;text-align:center;">
                <p style="margin:0;font-size:28px;font-weight:800;color:#3B82F6;">${data.totalRuns}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#A0A0AC;text-transform:uppercase;letter-spacing:0.05em;">Runs Completed</p>
              </td>
            </tr>
          </table>
        </td></tr>

        ${raceCountdown}

        <!-- Plan info -->
        ${data.planName ? `
        <tr><td style="padding:0 24px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:8px;padding:12px 16px;">
            <tr><td>
              <p style="margin:0;font-size:13px;color:#166534;">
                Active plan: <strong>${data.planName}</strong>
              </p>
            </td></tr>
          </table>
        </td></tr>` : ""}

        <!-- CTA -->
        <tr><td style="padding:8px 24px 24px;text-align:center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://runsplit.co"}/plan" style="display:inline-block;background:#3B82F6;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:10px;">
            View Your Plan
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 24px;background:#F8F8FA;border-top:1px solid #E4E4E8;text-align:center;">
          <p style="margin:0;font-size:11px;color:#A0A0AC;">
            You're receiving this because you're a RunSplit Pro member with weekly summaries enabled.
            <br/>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://runsplit.co"}/settings" style="color:#6E6E7A;">Manage preferences</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}





