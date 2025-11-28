import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  foundItemId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { foundItemId }: NotifyRequest = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the found item details
    const { data: foundItem, error: foundError } = await supabase
      .from("found_items")
      .select("*")
      .eq("id", foundItemId)
      .single();

    if (foundError || !foundItem) {
      throw new Error("Found item not found");
    }

    // Get matching lost items that haven't been notified
    const { data: matches, error: matchError } = await supabase
      .from("item_matches")
      .select(`
        *,
        lost_items (*)
      `)
      .eq("found_item_id", foundItemId)
      .eq("notified", false)
      .gte("match_score", 60)
      .order("match_score", { ascending: false });

    if (matchError) {
      throw matchError;
    }

    if (!matches || matches.length === 0) {
      return new Response(
        JSON.stringify({ message: "No matches found to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send emails to all matched lost item owners
    const emailPromises = matches
      .filter((match: any) => match.lost_items?.contact && !match.lost_items?.is_anonymous)
      .map(async (match: any) => {
        const lostItem = match.lost_items;
        
        try {
          await resend.emails.send({
            from: "NUST Lost & Found <onboarding@resend.dev>",
            to: [lostItem.contact],
            subject: "We Might Have Found Your Lost Item",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #333; margin-bottom: 20px;">
                  Hi ${lostItem.contact ? lostItem.contact.split('@')[0] : 'there'},
                </h1>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                  Good news! Someone just submitted a found item on our platform, and it looks like it might match the item you reported as lost.
                </p>
                
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
                  <h2 style="color: #4F46E5; margin-top: 0; font-size: 18px;">Here's what our system detected:</h2>
                  
                  <p style="margin: 10px 0;"><strong>Possible Match:</strong> ${foundItem.title}</p>
                  <p style="margin: 10px 0;"><strong>Location Found:</strong> ${foundItem.location}</p>
                  ${foundItem.description ? `<p style="margin: 10px 0;"><strong>Description:</strong> ${foundItem.description}</p>` : ""}
                  <p style="margin: 10px 0;"><strong>Match Confidence:</strong> ${match.match_score}%</p>
                </div>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                  Please log in to the platform and verify if this is your item.
                </p>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                  If it's a match, you can contact the person who found it directly and arrange handover.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="font-size: 14px; color: #888;">
                    Wishing you the best,<br>
                    <strong>NUST Lost & Found Team</strong>
                  </p>
                </div>
              </div>
            `,
          });

          // Mark as notified
          await supabase
            .from("item_matches")
            .update({ notified: true })
            .eq("id", match.id);

          console.log(`Email sent to ${lostItem.contact} for match ${match.id}`);
        } catch (error) {
          console.error(`Failed to send email for match ${match.id}:`, error);
        }
      });

    await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({ 
        message: "Notifications sent successfully",
        notified: emailPromises.length 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-match function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
