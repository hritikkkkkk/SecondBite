import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { AppSidebar, MobileTopbar } from "@/components/AppSidebar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
    return { user: data.user };
  },
  component: AuthenticatedShell,
});

function AuthenticatedShell() {
  const [restaurantName, setRestaurantName] = useState<string | undefined>();

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("restaurants")
        .select("name")
        .eq("owner_id", u.user.id)
        .limit(1)
        .maybeSingle();
      if (alive && data?.name) setRestaurantName(data.name);
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="dark flex min-h-screen w-full bg-[oklch(0.11_0.008_60)] text-white">
      <AppSidebar restaurantName={restaurantName} />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileTopbar restaurantName={restaurantName} />
        <Outlet />
      </div>
    </div>
  );
}
