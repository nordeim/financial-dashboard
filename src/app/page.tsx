import type { Metadata } from "next";
import { FinaraApp } from "@/components/finara/finara-app";

/** `/` (live-probed round 8): renders the dashboard content, bare title,
 *  and NO active nav pill — the home marker is normalized by FinaraApp. */
export const metadata: Metadata = {
  title: "Finara",
};

export default function Home() {
  return <FinaraApp route={{ kind: "home" }} />;
}
