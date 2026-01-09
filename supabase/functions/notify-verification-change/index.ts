import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

// Valid verification status values
const VALID_VERIFICATION_STATUSES = ["pending_verification", "verified", "invalid", "spam"] as const;
type VerificationStatus = typeof VALID_VERIFICATION_STATUSES[number];

// Valid roles that can verify issues
const VERIFIER_ROLES = ["admin", "super_admin", "moderator", "department_admin", "field_worker"] as const;

// UUID regex pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// Input validation functions
function isValidUUID(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

function isValidVerificationStatus(value: unknown): value is VerificationStatus {
  return typeof value === "string" && VALID_VERIFICATION_STATUSES.includes(value as VerificationStatus);
}

function isNullableString(value: unknown, maxLength: number = 100): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.length <= maxLength);
}

function validateRequest(body: unknown): { valid: true; data: NotifyVerificationChangeRequest } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be an object" };
  }

  const { issue_id, old_status, new_status, verifier_name, verifier_role } = body as Record<string, unknown>;

  if (!isValidUUID(issue_id)) {
    return { valid: false, error: "issue_id must be a valid UUID" };
  }

  // old_status can be null for first-time verification
  if (old_status !== null && !isValidVerificationStatus(old_status)) {
    return { valid: false, error: `old_status must be null or one of: ${VALID_VERIFICATION_STATUSES.join(", ")}` };
  }

  if (!isValidVerificationStatus(new_status)) {
    return { valid: false, error: `new_status must be one of: ${VALID_VERIFICATION_STATUSES.join(", ")}` };
  }

  if (!isNullableString(verifier_name, 100)) {
    return { valid: false, error: "verifier_name must be null or a string with max 100 characters" };
  }

  if (!isNullableString(verifier_role, 50)) {
    return { valid: false, error: "verifier_role must be null or a string with max 50 characters" };
  }

  return { 
    valid: true, 
    data: { 
      issue_id, 
      old_status: old_status as string | null, 
      new_status, 
      verifier_name: (verifier_name as string | null) || null,
      verifier_role: (verifier_role as string | null) || null,
    } 
  };
}

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

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
        <h3 style="margin-top: 0;">${escapeHtml(issue.title)}</h3>
        <p style="color: #6b7280; margin-bottom: 15px;">${escapeHtml(issue.description.substring(0, 150))}${issue.description.length > 150 ? '...' : ''}</p>
        ${issue.address ? `<p style="font-size: 14px; color: #6b7280;">📍 ${escapeHtml(issue.address)}</p>` : ''}
        <p><strong>Verification Status:</strong></p>
        <span class="status-badge status-${newStatus}">${escapeHtml(newStatusLabel)}</span>
        ${verifierName || verifierRole ? `
        <div class="verifier-info">
          <strong>Verified by:</strong> ${escapeHtml(verifierName || 'Unknown')} ${verifierRole ? `(${escapeHtml(verifierRole)})` : ''}
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

    // ============================================
    // AUTHENTICATION CHECK - Verify caller identity
    // ============================================
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create a client with the user's auth token to verify identity
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseAnon) {
      console.error("Missing SUPABASE_ANON_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Authenticated user:", user.id);

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ============================================
    // AUTHORIZATION CHECK - Verify user has verifier role
    // ============================================
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasVerifierRole = userRoles?.some(r => 
      VERIFIER_ROLES.includes(r.role as typeof VERIFIER_ROLES[number])
    );

    if (!hasVerifierRole) {
      console.error(`User ${user.id} lacks verifier role`);
      return new Response(
        JSON.stringify({ error: "Forbidden: only moderators and admins can trigger verification notifications" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Authorization passed - user has verifier role");

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

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(body);
    } catch (parseError) {
      console.error("Error parsing JSON body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate input with strict schema validation
    const validationResult = validateRequest(parsedBody);
    if (!validationResult.valid) {
      console.error("Validation error:", validationResult.error);
      return new Response(
        JSON.stringify({ error: validationResult.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { issue_id, old_status, new_status, verifier_name, verifier_role } = validationResult.data;
    
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

    const emailsSent: string[] = [];
    const notificationsCreated: string[] = [];

    // 1. Notify the reporter using secure RPC function
    if (issue.reporter_id) {
      const reporterMessage = `Your issue "${issue.title.substring(0, 80)}" has been ${newStatusLabel.toLowerCase()}${verifier_role ? ` by a ${verifier_role}` : ''}.`;
      
      const { error: notifError } = await supabase.rpc('insert_notification', {
        p_user_id: issue.reporter_id,
        p_issue_id: issue_id,
        p_title: notificationTitle,
        p_message: reporterMessage,
        p_type: `verification_${new_status}`,
      });

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

        const notificationMessage = `Issue "${issue.title.substring(0, 80)}" verification status changed from ${oldStatusLabel} to ${newStatusLabel}.`;

        for (const followerId of followerIds) {
          const profile = profiles?.find(p => p.user_id === followerId);
          const wantsEmail = profile?.notification_email !== false;

          const { error: followerNotifError } = await supabase.rpc('insert_notification', {
            p_user_id: followerId,
            p_issue_id: issue_id,
            p_title: "Issue You Follow - Verification Update",
            p_message: notificationMessage,
            p_type: `verification_${new_status}`,
          });

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
                const result = await sendEmail(followerEmail, `Verification Update: ${issue.title.substring(0, 50)}`, emailHtml);
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
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);