import Header from "@/components/Header";
import Explorer from "@/components/Explorer";
import componentsRaw from "@/data/components.json";
import type { ComponentEntry } from "@/lib/types";
import { buildOriginalEntries } from "@/lib/originalEntries";

const data = [...buildOriginalEntries(), ...(componentsRaw as ComponentEntry[])];

export const metadata = {
  title: "Components | Spark UI",
  description: "Browse every animated React component in the Spark UI library.",
};

export default function ComponentsPage() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <Explorer data={data} />
    </div>
  );
}
