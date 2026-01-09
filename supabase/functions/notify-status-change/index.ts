import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

// Valid status values for issue status
const VALID_ISSUE_STATUSES = ["pending", "in_progress", "resolved", "withdrawn"] as const;
type IssueStatus = typeof VALID_ISSUE_STATUSES[number];

// Valid admin roles that can trigger notifications
const ADMIN_ROLES = ["admin", "super_admin", "moderator", "department_admin", "field_worker"] as const;

// UUID regex pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface NotifyStatusChangeRequest {
  issue_id: string;
  old_status: string;
  new_status: string;
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  withdrawn: "Withdrawn",
};

// Input validation functions
function isValidUUID(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

function isValidIssueStatus(value: unknown): value is IssueStatus {
  return typeof value === "string" && VALID_ISSUE_STATUSES.includes(value as IssueStatus);
}

function validateRequest(body: unknown): { valid: true; data: NotifyStatusChangeRequest } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be an object" };
  }

  const { issue_id, old_status, new_status } = body as Record<string, unknown>;

  if (!isValidUUID(issue_id)) {
    return { valid: false, error: "issue_id must be a valid UUID" };
  }

  if (!isValidIssueStatus(old_status)) {
    return { valid: false, error: `old_status must be one of: ${VALID_ISSUE_STATUSES.join(", ")}` };
  }

  if (!isValidIssueStatus(new_status)) {
    return { valid: false, error: `new_status must be one of: ${VALID_ISSUE_STATUSES.join(", ")}` };
  }

  return { valid: true, data: { issue_id, old_status, new_status } };
}

const generateEmailHtml = (issue: any, newStatus: string, newStatusLabel: string, isFollower: boolean = false) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 10px 0; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-in_progress { background: #dbeafe; color: #1e40af; }
    .status-resolved { background: #d1fae5; color: #065f46; }
    .status-withdrawn { background: #f3f4f6; color: #374151; }
    .issue-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
    .follower-note { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; margin: 15px 0; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">🏙️ City Sentinel</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Issue Status Update</p>
    </div>
    <div class="content">
      ${isFollower ? `
      <div class="follower-note">
        <strong>📌 You're following this issue</strong>
        <p style="margin: 5px 0 0; font-size: 14px;">You're receiving this because you're following this issue.</p>
      </div>
      ` : ''}
      <h2 style="margin-top: 0;">${isFollower ? 'An issue you follow has been updated!' : 'Your issue has been updated!'}</h2>
      <div class="issue-card">
        <h3 style="margin-top: 0;">${escapeHtml(issue.title)}</h3>
        <p style="color: #6b7280; margin-bottom: 15px;">${escapeHtml(issue.description.substring(0, 150))}${issue.description.length > 150 ? '...' : ''}</p>
        ${issue.address ? `<p style="font-size: 14px; color: #6b7280;">📍 ${escapeHtml(issue.address)}</p>` : ''}
        <p><strong>New Status:</strong></p>
        <span class="status-badge status-${newStatus}">${escapeHtml(newStatusLabel)}</span>
      </div>
      <p>Thank you for helping improve our city! We appreciate your patience and engagement.</p>
    </div>
    <div class="footer">
      <p>City Sentinel - Making our city better, together</p>
      <p style="font-size: 12px; color: #9ca3af;">You can manage your notification preferences in your profile settings.</p>
    </div>
  </div>
</body>
</html>
`;

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
  console.log("=== notify-status-change function called ===");
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("Environment check - SUPABASE_URL exists:", !!supabaseUrl);
    console.log("Environment check - SUPABASE_SERVICE_ROLE_KEY exists:", !!supabaseKey);

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
      console.error("Empty request body received");
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

    const { issue_id, old_status, new_status } = validationResult.data;
    
    console.log(`Processing status change for issue ${issue_id}: ${old_status} -> ${new_status}`);

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

    // ============================================
    // AUTHORIZATION CHECK - Verify user can trigger notifications
    // ============================================
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasAdminRole = userRoles?.some(r => 
      ADMIN_ROLES.includes(r.role as typeof ADMIN_ROLES[number])
    );
    const isReporter = issue.reporter_id === user.id;

    if (!hasAdminRole && !isReporter) {
      console.error(`User ${user.id} lacks permission to trigger notifications for issue ${issue_id}`);
      return new Response(
        JSON.stringify({ error: "Forbidden: insufficient permissions to trigger notifications" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Authorization passed - hasAdminRole: ${hasAdminRole}, isReporter: ${isReporter}`);

    const newStatusLabel = statusLabels[new_status] || new_status;
    const oldStatusLabel = statusLabels[old_status] || old_status;
    const notificationTitle = `Issue Status Updated: ${newStatusLabel}`;

    const emailsSent: string[] = [];
    const notificationsCreated: string[] = [];

    // 1. Notify the reporter using the secure RPC function
    if (issue.reporter_id) {
      // Create in-app notification for reporter using RPC
      const { error: notifError } = await supabase.rpc('insert_notification', {
        p_user_id: issue.reporter_id,
        p_issue_id: issue_id,
        p_title: notificationTitle,
        p_message: `Your issue "${issue.title.substring(0, 100)}" has been updated from ${oldStatusLabel} to ${newStatusLabel}.`,
        p_type: `status_${new_status}`,
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
          const emailHtml = generateEmailHtml(issue, new_status, newStatusLabel, false);
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

    // 2. Notify all followers (excluding the reporter to avoid duplicates)
    const { data: followers, error: followersError } = await supabase
      .from("issue_follows")
      .select("user_id")
      .eq("issue_id", issue_id);

    if (followersError) {
      console.error("Error fetching followers:", followersError);
    } else if (followers && followers.length > 0) {
      console.log(`Found ${followers.length} followers for this issue`);

      // Get follower profiles with emails
      const followerIds = followers
        .map(f => f.user_id)
        .filter(id => id !== issue.reporter_id); // Exclude reporter

      if (followerIds.length > 0) {
        // Get profiles for followers
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, notification_email")
          .in("user_id", followerIds);

        // Get auth emails for followers
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const userEmailMap = new Map<string, string>();
        
        if (authUsers?.users) {
          for (const user of authUsers.users) {
            if (followerIds.includes(user.id) && user.email) {
              userEmailMap.set(user.id, user.email);
            }
          }
        }

        const notificationMessage = `Issue "${issue.title.substring(0, 100)}" has been updated from ${oldStatusLabel} to ${newStatusLabel}.`;

        // Create notifications and send emails to followers
        for (const followerId of followerIds) {
          // Check if user wants email notifications
          const profile = profiles?.find(p => p.user_id === followerId);
          const wantsEmail = profile?.notification_email !== false;

          // Create in-app notification using RPC
          const { error: followerNotifError } = await supabase.rpc('insert_notification', {
            p_user_id: followerId,
            p_issue_id: issue_id,
            p_title: "Issue You Follow Updated",
            p_message: notificationMessage,
            p_type: `status_${new_status}`,
          });

          if (followerNotifError) {
            console.error(`Error creating notification for follower ${followerId}:`, followerNotifError);
          } else {
            notificationsCreated.push(`follower_${followerId}`);
          }

          // Send email if user wants it and we have their email
          if (wantsEmail) {
            const followerEmail = userEmailMap.get(followerId);
            if (followerEmail && !emailsSent.includes(followerEmail)) {
              try {
                const emailHtml = generateEmailHtml(issue, new_status, newStatusLabel, true);
                const result = await sendEmail(followerEmail, `Issue Update: ${issue.title.substring(0, 50)}`, emailHtml);
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
        message: "Notifications sent",
        notifications_created: notificationsCreated.length,
        emails_sent: emailsSent.length
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-status-change function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);