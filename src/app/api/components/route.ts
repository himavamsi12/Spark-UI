import { NextResponse } from "next/server";
import { ORIGINALS } from "@/lib/originalControls";
import { ORIGINAL_SOURCE_FILES } from "@/lib/originalSources";

export const dynamic = "force-dynamic";

/** Catalogue of every component available for download or via MCP. */
export async function GET() {
  const components = ORIGINALS.filter((o) => o.key in ORIGINAL_SOURCE_FILES).map((o) => ({
    slug: o.key,
    name: o.name,
    category: o.category,
    description: o.blurb,
    props: o.controls.map((c) => c.key),
  }));

  return NextResponse.json({ count: components.length, components });
}
