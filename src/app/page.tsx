import Header from "@/components/Header";
import Landing from "@/components/Landing";
import componentsRaw from "@/data/components.json";
import type { ComponentEntry } from "@/lib/types";
import { buildOriginalEntries } from "@/lib/originalEntries";

const data = [...buildOriginalEntries(), ...(componentsRaw as ComponentEntry[])];

export default function Home() {
  // Newest first, so the shelf shows what just came in.
  const featured = [...data].sort((a, b) => a.addedRank - b.addedRank).slice(0, 6);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <Landing featured={featured} total={data.length} />
    </div>
  );
}
