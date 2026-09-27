import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";

/**
 * POST /api/drivers/invite
 * Body: { email, name }
 * Sends a Supabase invite email to the driver so they can set a password
 * and join the company. The caller must be an owner, and the email must
 * match an unclaimed driver record they created.
 */
export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Caller must be a signed-in owner.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, company_name")
      .eq("user_id", user.id)
      .single();
    if (!profile || profile.role !== "owner") {
      return NextResponse.json({ error: "Owners only" }, { status: 403 });
    }

    // Only invite for an unclaimed driver record this owner created.
    const { data: driver } = await supabase
      .from("drivers")
      .select("id, user_id")
      .eq("owner_id", user.id)
      .eq("login_email", cleanEmail)
      .maybeSingle();
    if (!driver) {
      return NextResponse.json(
        { error: "Driver record not found" },
        { status: 404 }
      );
    }
    if (driver.user_id) {
      return NextResponse.json({ invited: false, reason: "already_signed_up" });
    }

    const admin = createAdminClient();
    const origin = new URL(request.url).origin;
    const { error } = await admin.auth.admin.inviteUserByEmail(cleanEmail, {
      data: {
        full_name: String(name ?? ""),
        invited_by_company: profile.company_name ?? "",
      },
      redirectTo: `${origin}/auth/callback?next=/invite`,
    });
    if (error) {
      // Address already has an account — they can just sign in.
      const msg = error.message.toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists")
      ) {
        return NextResponse.json({
          invited: false,
          reason: "already_signed_up",
        });
      }
      throw error;
    }
    return NextResponse.json({ invited: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invite failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
