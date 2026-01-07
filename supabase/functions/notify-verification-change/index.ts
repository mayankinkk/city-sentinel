import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

interface NotifyVerificationChangeRequest {
  issue_id: string;
  old_status: string | null;
  new_status: string;
  verifier_name: string | null;
  verifier_role: string | null;
}

const verificationLabels: Record<string, string> = {
  pending_verification: "Pending Verification",
  verified: "Verified",
  invalid: "Invalid",
  spam: "Spam",
};

const generateEmailHtml = (
  issue: any, 
  newStatus: string, 
  newStatusLabel: string, 
  verifierName: string | null,
  verifierRole: string | null,
  isFollower: boolean = false
) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 10px 0; }
    .status-pending_verification { background: #fef3c7; color: #92400e; }
    .status-verified { background: #d1fae5; color: #065f46; }
    .status-invalid { background: #fee2e2; color: #991b1b; }
    .status-spam { background: #f3f4f6; color: #374151; }
    .issue-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
    .follower-note { background: #f3e8ff; border-left: 4px solid #7c3aed; padding: 12px; margin: 15px 0; border-radius: 0 8px 8px 0; }
    .verifier-info { background: #ede9fe; padding: 10px 15px; border-radius: 6px; margin: 10px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">🏙️ City Sentinel</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Issue Verification Update</p>
    </div>
    <div class="content">
      ${isFollower ? `
      <div class="follower-note">
        <strong>📌 You're following this issue</strong>
        <p style="margin: 5px 0 0; font-size: 14px;">You're receiving this because you're following this issue.</p>
      </div>
      ` : ''}
      <h2 style="margin-top: 0;">${isFollower ? 'An issue you follow has been verified!' : 'Your issue verification status has changed!'}</h2>
      <div class="issue-card">
        <h3 style="margin-top: 0;">${issue.title}</h3>
        <p style="color: #6b7280; margin-bottom: 15px;">${issue.description.substring(0, 150)}${issue.description.length > 150 ? '...' : ''}</p>
        ${issue.address ? `<p style="font-size: 14px; color: #6b7280;">📍 ${issue.address}</p>` : ''}
        <p><strong>Verification Status:</strong></p>
        <span class="status-badge status-${newStatus}">${newStatusLabel}</span>
        ${verifierName || verifierRole ? `
        <div class="verifier-info">
          <strong>Verified by:</strong> ${verifierName || 'Unknown'} ${verifierRole ? `(${verifierRole})` : ''}
        </div>
        ` : ''}
      </div>
      <p>Thank you for helping improve our city! We appreciate your engagement.</p>
    </div>
    <div class="footer">
      <p>City Sentinel - Making our city better, together</p>
      <p style="font-size: 12px; color: #9ca3af;">You can manage your notification preferences in your profile settings.</p>
    </div>
  </div>
</body>
</html>
`;

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not set, skipping email");
    return null;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "City Sentinel <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  return response.json();
};

const handler = async (req: Request): Promise<Response> => {
  console.log("=== notify-verification-change function called ===");
  console.log("Request method:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: string;
    try {
      body = await req.text();
      console.log("Raw request body:", body);
    } catch (bodyError) {
      console.error("Error reading request body:", bodyError);
      return new Response(
        JSON.stringify({ error: "Failed to read request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!body) {
      return new Response(
        JSON.stringify({ error: "Empty request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let parsedBody: NotifyVerificationChangeRequest;
    try {
      parsedBody = JSON.parse(body);
    } catch (parseError) {
      console.error("Error parsing JSON body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { issue_id, old_status, new_status, verifier_name, verifier_role } = parsedBody;
    
    console.log(`Processing verification change for issue ${issue_id}: ${old_status} -> ${new_status}`);

    // Get the issue details
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("*")
      .eq("id", issue_id)
      .single();

    if (issueError || !issue) {
      console.error("Issue not found:", issueError);
      return new Response(
        JSON.stringify({ error: "Issue not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const newStatusLabel = verificationLabels[new_status] || new_status;
    const oldStatusLabel = old_status ? (verificationLabels[old_status] || old_status) : "None";
    const notificationTitle = `Issue Verification Updated: ${newStatusLabel}`;
    const notificationMessage = `Issue "${issue.title}" verification status changed from ${oldStatusLabel} to ${newStatusLabel}.`;

    const emailsSent: string[] = [];
    const notificationsCreated: string[] = [];

    // 1. Notify the reporter
    if (issue.reporter_id) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert([{
          user_id: issue.reporter_id,
          issue_id: issue_id,
          title: notificationTitle,
          message: `Your issue "${issue.title}" has been ${newStatusLabel.toLowerCase()}${verifier_role ? ` by a ${verifier_role}` : ''}.`,
          type: `verification_${new_status}`,
        }]);

      if (notifError) {
        console.error("Error creating notification for reporter:", notifError);
      } else {
        notificationsCreated.push("reporter");
        console.log("In-app notification created for reporter");
      }

      // Send email to reporter
      if (issue.reporter_email) {
        try {
          const emailHtml = generateEmailHtml(issue, new_status, newStatusLabel, verifier_name, verifier_role, false);
          const result = await sendEmail(issue.reporter_email, notificationTitle, emailHtml);
          if (result) {
            emailsSent.push(issue.reporter_email);
            console.log("Email sent to reporter:", result);
          }
        } catch (emailError) {
          console.error("Error sending email to reporter:", emailError);
        }
      }
    }

    // 2. Notify all followers (excluding the reporter)
    const { data: followers, error: followersError } = await supabase
      .from("issue_follows")
      .select("user_id")
      .eq("issue_id", issue_id);

    if (followersError) {
      console.error("Error fetching followers:", followersError);
    } else if (followers && followers.length > 0) {
      console.log(`Found ${followers.length} followers for this issue`);

      const followerIds = followers
        .map(f => f.user_id)
        .filter(id => id !== issue.reporter_id);

      if (followerIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, notification_email")
          .in("user_id", followerIds);

        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const userEmailMap = new Map<string, string>();
        
        if (authUsers?.users) {
          for (const user of authUsers.users) {
            if (followerIds.includes(user.id) && user.email) {
              userEmailMap.set(user.id, user.email);
            }
          }
        }

        for (const followerId of followerIds) {
          const profile = profiles?.find(p => p.user_id === followerId);
          const wantsEmail = profile?.notification_email !== false;

          const { error: followerNotifError } = await supabase
            .from("notifications")
            .insert([{
              user_id: followerId,
              issue_id: issue_id,
              title: "Issue You Follow - Verification Update",
              message: notificationMessage,
              type: `verification_${new_status}`,
            }]);

          if (followerNotifError) {
            console.error(`Error creating notification for follower ${followerId}:`, followerNotifError);
          } else {
            notificationsCreated.push(`follower_${followerId}`);
          }

          if (wantsEmail) {
            const followerEmail = userEmailMap.get(followerId);
            if (followerEmail && !emailsSent.includes(followerEmail)) {
              try {
                const emailHtml = generateEmailHtml(issue, new_status, newStatusLabel, verifier_name, verifier_role, true);
                const result = await sendEmail(followerEmail, `Verification Update: ${issue.title}`, emailHtml);
                if (result) {
                  emailsSent.push(followerEmail);
                  console.log(`Email sent to follower ${followerId}:`, result);
                }
              } catch (emailError) {
                console.error(`Error sending email to follower ${followerId}:`, emailError);
              }
            }
          }
        }
      }
    }

    console.log(`Notifications created: ${notificationsCreated.length}, Emails sent: ${emailsSent.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification notifications sent",
        notifications_created: notificationsCreated.length,
        emails_sent: emailsSent.length
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-verification-change function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
