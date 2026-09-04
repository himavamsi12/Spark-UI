import { Suspense } from "react";
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
      {/* Explorer reads ?view= with useSearchParams, which opts it out of
          prerendering. Without this boundary the production build fails on
          /components, even though dev renders it fine. */}
      <Suspense fallback={<div className="flex-1 min-h-0" />}>
        <Explorer data={data} />
      </Suspense>
    </div>
  );
}
