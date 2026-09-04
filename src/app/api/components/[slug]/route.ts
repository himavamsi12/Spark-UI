import { NextResponse } from "next/server";
import { getComponentSource } from "@/lib/componentSource";

// Reads component sources off disk, so this must not be statically evaluated.
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const source = await getComponentSource(slug);
  if (!source) {
    return NextResponse.json({ error: `Unknown component: ${slug}` }, { status: 404 });
  }

  // ?format=file streams the raw .tsx as a download; default returns JSON metadata.
  const format = new URL(request.url).searchParams.get("format");
  if (format === "file") {
    return new NextResponse(source.code, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${source.fileName}"`,
      },
    });
  }

  return NextResponse.json(source);
}
