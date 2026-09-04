import { NextResponse } from "next/server";
import { getComponentSource, listComponentSlugs } from "@/lib/componentSource";
import { getOriginal } from "@/lib/originalControls";

/**
 * shadcn-compatible registry.
 *
 *   npx shadcn@latest add https://<site>/r/<slug>.json
 *
 * Serving this format means people install components with the tool they
 * already have, instead of trusting a one-off CLI. `/r/registry.json` lists
 * everything available.
 */
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
  // The shadcn CLI may be pointed here from any project.
  "Access-Control-Allow-Origin": "*",
};

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params;
  const slug = raw.replace(/\.json$/, "");
  const origin = new URL(request.url).origin;

  if (slug === "registry" || slug === "index") {
    return NextResponse.json(
      {
        $schema: "https://ui.shadcn.com/schema/registry.json",
        name: "spark-ui",
        homepage: origin,
        items: listComponentSlugs().map((s) => {
          const entry = getOriginal(s);
          return {
            name: s,
            type: "registry:component",
            title: entry?.name ?? s,
            description: entry?.blurb ?? "",
          };
        }),
      },
      { headers: HEADERS },
    );
  }

  const source = await getComponentSource(slug);
  if (!source) {
    return NextResponse.json(
      { error: `Unknown component "${slug}".`, available: listComponentSlugs() },
      { status: 404, headers: HEADERS },
    );
  }

  const target = `components/spark-ui/${source.fileName}`;
  const assets = source.assets.filter((a) => !a.endsWith("/*"));

  return NextResponse.json(
    {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: slug,
      type: "registry:component",
      title: source.name,
      description: source.description,
      dependencies: source.dependencies,
      files: [
        {
          path: target,
          target,
          type: "registry:component",
          content: source.code,
        },
      ],
      // The registry format carries text only, so any images the component
      // references are listed here rather than written by the CLI.
      meta: assets.length
        ? { assets: assets.map((a) => ({ path: a, url: `${origin}${a}` })) }
        : undefined,
    },
    { headers: HEADERS },
  );
}
