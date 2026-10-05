import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import FleetLandingPage from "@/components/FleetLandingPage";

/**
 * Home: routes the signed-in user to the right place.
 * - No user -> public landing page
 * - No profile yet -> /onboarding (pick owner or driver)
 * - Owner -> /owner
 * - Driver -> /driver
 */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <FleetLandingPage />;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");
  if (profile.role === "owner") redirect("/owner");
  redirect("/driver");
}
