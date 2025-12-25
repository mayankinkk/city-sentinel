import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-status-change function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { issue_id, old_status, new_status }: NotifyStatusChangeRequest = await req.json();
    
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

    // Only notify if there's a reporter
    if (!issue.reporter_id) {
      console.log("No reporter_id, skipping notification");
      return new Response(
        JSON.stringify({ message: "No reporter to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const newStatusLabel = statusLabels[new_status] || new_status;
    const notificationTitle = `Issue Status Updated: ${newStatusLabel}`;
    const notificationMessage = `Your issue "${issue.title}" has been updated from ${statusLabels[old_status] || old_status} to ${newStatusLabel}.`;

    // Create in-app notification
    const { error: notifError } = await supabase
      .from("notifications")
      .insert([{
        user_id: issue.reporter_id,
        issue_id: issue_id,
        title: notificationTitle,
        message: notificationMessage,
        type: `status_${new_status}`,
      }]);

    if (notifError) {
      console.error("Error creating notification:", notifError);
    } else {
      console.log("In-app notification created successfully");
    }

    // Send email notification if reporter has email
    if (issue.reporter_email && RESEND_API_KEY) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "CityFix <onboarding@resend.dev>",
            to: [issue.reporter_email],
            subject: notificationTitle,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
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
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0; font-size: 24px;">🏙️ CityFix</h1>
                    <p style="margin: 10px 0 0; opacity: 0.9;">Issue Status Update</p>
                  </div>
                  <div class="content">
                    <h2 style="margin-top: 0;">Your issue has been updated!</h2>
                    <div class="issue-card">
                      <h3 style="margin-top: 0;">${issue.title}</h3>
                      <p style="color: #6b7280; margin-bottom: 15px;">${issue.description.substring(0, 150)}${issue.description.length > 150 ? '...' : ''}</p>
                      <p><strong>New Status:</strong></p>
                      <span class="status-badge status-${new_status}">${newStatusLabel}</span>
                    </div>
                    <p>Thank you for helping improve our city! We appreciate your patience and engagement.</p>
                  </div>
                  <div class="footer">
                    <p>CityFix - Making our city better, together</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          }),
        });

        const emailData = await emailRes.json();
        console.log("Email sent successfully:", emailData);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-status-change function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
