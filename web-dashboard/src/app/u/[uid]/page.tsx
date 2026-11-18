import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import DashboardView, { type Show } from "@/components/DashboardView";

interface Props {
  params: Promise<{ uid: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uid } = await params;
  const numUid = parseInt(uid, 10);
  if (isNaN(numUid)) {
    return { title: "Invalid Profile | Ray Brook" };
  }

  const { data } = await supabase.rpc("get_public_profile", { p_uid: numUid });
  if (!data || data.length === 0) {
    return { title: "User Not Found | Ray Brook" };
  }

  const name = data[0].display_name || `User ${uid}`;
  return {
    title: `${name}'s Watchlist | Ray Brook`,
    description: `Track active anime and viewing progress for ${name}.`,
    openGraph: {
      title: `${name}'s Watchlist | Ray Brook`,
      description: `Track active anime and viewing progress for ${name}.`,
      images: ["/logo.png"],
    },
    twitter: {
      card: "summary",
      title: `${name}'s Watchlist | Ray Brook`,
      description: `Track active anime and viewing progress for ${name}.`,
    },
  };
}

export default async function PublicWatchlistPage({ params }: Props) {
  const { uid } = await params;
  const numUid = parseInt(uid, 10);
  let initialProfileName = "";
  let initialShows: Show[] = [];

  if (!isNaN(numUid)) {
    const { data: profileData } = await supabase.rpc("get_public_profile", {
      p_uid: numUid,
    });
    if (profileData && profileData.length > 0) {
      initialProfileName = profileData[0].display_name;
      const { data: showsData } = await supabase
        .from("active_shows")
        .select("id, show_name, latest_episode, total_episodes, updated_at")
        .eq("user_id", profileData[0].user_id)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false });

      if (showsData) {
        initialShows = showsData as Show[];
      }
    }
  }

  return (
    <DashboardView
      initialUid={uid}
      initialProfileName={initialProfileName}
      initialShows={initialShows}
    />
  );
}
