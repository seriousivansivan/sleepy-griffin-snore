import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. Initialize Supabase client with Service Role Key
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // 2. Manual Authentication (Verify Admin Role)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized: Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  
  // Get user claims to verify role
  const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getUser(token);

  if (claimsError || !claimsData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const adminUserId = claimsData.user.id;

  // Check if the user is an admin by querying the profiles table
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", adminUserId)
    .single();

  if (profileError || profileData?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden: User is not an admin" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3. Process Request Body
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { userId: targetUserId } = body;

  if (!targetUserId) {
    return new Response(JSON.stringify({ error: "Missing targetUserId" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 4. Fetch User Email using Admin API
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);

  if (userError) {
    console.error("Admin get user error:", userError);
    return new Response(JSON.stringify({ error: userError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!userData.user?.email) {
    return new Response(JSON.stringify({ error: "User email not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ email: userData.user.email }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});