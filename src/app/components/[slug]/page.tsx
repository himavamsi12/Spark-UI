import { notFound } from "next/navigation";
import componentsRaw from "@/data/components.json";
import type { ComponentEntry } from "@/lib/types";
import Header from "@/components/Header";
import DetailView from "@/components/DetailView";
import OriginalDetailView from "@/components/OriginalDetailView";
import { buildOriginalEntries } from "@/lib/originalEntries";

const data = [...buildOriginalEntries(), ...(componentsRaw as ComponentEntry[])];

export function generateStaticParams() {
  return data.map((d) => ({ slug: d.slug }));
}

export default async function ComponentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = data.find((d) => d.slug === slug);
  if (!entry) notFound();

  const similar = data
    .filter((d) => d.category === entry.category && d.slug !== entry.slug)
    .slice(0, 8);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      {entry.source === "original" ? (
        <OriginalDetailView key={entry.slug} entry={entry} similar={similar} allComponents={data} />
      ) : (
        <DetailView key={entry.slug} entry={entry} similar={similar} />
      )}
    </div>
  );
}
