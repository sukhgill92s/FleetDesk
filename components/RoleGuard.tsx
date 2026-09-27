"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

/**
 * RoleGuard: keeps owners and drivers on their own side of the app.
 * Put <RoleGuard expect="owner" /> in the owner layout and
 * <RoleGuard expect="driver" /> in the driver layout.
 * Wrong-role visits are redirected; users with no profile go to /onboarding.
 */
export default function RoleGuard({
  expect,
  children,
}: {
  expect: "owner" | "driver";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!profile) {
          router.replace("/onboarding");
          return;
        }
        if (profile.role !== expect) {
          router.replace(profile.role === "owner" ? "/owner" : "/driver");
          return;
        }
        if (!cancelled) setAllowed(true);
      } catch {
        // On error, stay put; page-level error handling takes over.
        if (!cancelled) setAllowed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expect, router]);

  if (!allowed) {
    return (
      <div className="card">
        <p className="muted">Loading…</p>
      </div>
    );
  }
  return <>{children}</>;
}
