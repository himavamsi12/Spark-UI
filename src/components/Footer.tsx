import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Spark UI, free animated components for the web.</span>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            Made with
            <img src="/icons/pixel-heart.png" alt="love" className="w-3.5 h-3.5" draggable={false} />
            by Vamsi
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/components" className="text-xs text-muted hover:text-pearl transition-colors">
            Components
          </Link>
          <Link href="/mcp" className="text-xs text-muted hover:text-pearl transition-colors">
            MCP
          </Link>
        </div>
      </div>
    </footer>
  );
}
