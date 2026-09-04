"use client";

import { useState } from "react";
import { X, Terminal, Code2, Cable, Sparkles, Copy, Check } from "lucide-react";
import type { ComponentEntry } from "@/lib/types";

type Method = "cli" | "code" | "mcp" | "ai";
type PM = "bun" | "npm" | "yarn" | "pnpm";

const PM_COMMANDS: Record<PM, (slug: string) => string> = {
  bun: (slug) => `bunx --bun spark-ui@latest add ${slug}`,
  npm: (slug) => `npx spark-ui@latest add ${slug}`,
  yarn: (slug) => `yarn dlx spark-ui@latest add ${slug}`,
  pnpm: (slug) => `pnpm dlx spark-ui@latest add ${slug}`,
};

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="flex items-center gap-1.5 bg-chalk text-void text-sm font-medium px-3 py-1.5 rounded-pills hover:bg-pearl shrink-0"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied" : label}
    </button>
  );
}

function SignInGate({ title }: { title: string }) {
  return (
    <div className="border border-border rounded-cards p-5">
      <h4 className="text-base font-semibold text-chalk mb-1">{title}</h4>
      <p className="text-sm text-muted mb-4">Sign in to continue.</p>
      <button
        onClick={() => alert("This clone doesn't implement real authentication. On the live site this signs you in with Google.")}
        className="w-full flex items-center justify-center gap-2 border border-border rounded-pills py-2.5 text-sm text-pearl hover:border-pearl/40 mb-4"
      >
        <svg width="16" height="16" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.8 4.1-17.1 10.1z"/>
          <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5c-2 1.5-4.6 2.6-7.6 2.6-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.9 39.6 16.4 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.5 5.5C41.4 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-3.5z"/>
        </svg>
        Continue with Google
      </button>
      <div className="flex items-center gap-3 text-xs text-muted mb-4">
        <div className="h-px bg-border flex-1" />
        OR
        <div className="h-px bg-border flex-1" />
      </div>
      <label className="text-sm text-pearl block mb-1.5">
        Email<span className="text-accent">*</span>
      </label>
      <input
        type="email"
        placeholder="you@example.com"
        className="w-full bg-panel border border-border rounded-pills px-3 py-2 text-sm mb-4 focus:outline-none focus:border-accent"
      />
      <button
        onClick={() => alert("This clone doesn't implement real authentication.")}
        className="w-full bg-panel border border-border text-muted rounded-pills py-2.5 text-sm font-medium mb-3 cursor-not-allowed"
      >
        Continue
      </button>
      <p className="text-xs text-center text-muted">
        Don&apos;t have an account? <span className="underline cursor-pointer">Sign Up</span>
      </p>
    </div>
  );
}

export default function GetComponentModal({
  entry,
  onClose,
}: {
  entry: ComponentEntry;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<Method>("cli");
  const [pm, setPm] = useState<PM>("bun");

  const methods: { key: Method; label: string; icon: React.ElementType }[] = [
    { key: "cli", label: "CLI", icon: Terminal },
    { key: "code", label: "Code", icon: Code2 },
    { key: "mcp", label: "MCP", icon: Cable },
    { key: "ai", label: "AI Prompt", icon: Sparkles },
  ];

  const mcpPrompt = `Use the Spark UI MCP to add the "${entry.name}" component to this project.\n\nRun the following MCP tool call:\n  spark-ui: get ${entry.slug}`;

  return (
    <div className="fixed inset-0 z-50 bg-void/70 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-panel border border-border rounded-cards w-full max-w-lg max-h-[85vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 pt-5">
          <div>
            <h3 className="text-lg font-semibold text-chalk">Get this component</h3>
            <p className="text-sm text-muted mt-1">
              Choose an installation method and copy this component into your project.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-pills text-muted hover:text-chalk hover:bg-slate">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pt-4 text-sm text-muted flex items-center gap-1.5">
          {entry.name}
          <span>›</span>
          <span className="border border-border rounded-small px-2 py-0.5 text-pearl">Variant 1</span>
        </div>

        <div className="px-5 pt-4">
          <h4 className="text-sm font-medium text-pearl mb-2">Installation Method</h4>
          <div className="border border-border rounded-medium overflow-hidden mb-4">
            {methods.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMethod(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm border-b border-border last:border-b-0 transition-colors ${
                  method === key ? "bg-slate text-chalk" : "text-pearl hover:bg-charcoal"
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    method === key ? "border-accent" : "border-pearl/30"
                  }`}
                >
                  {method === key && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                </span>
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {method === "cli" && (
            <div className="border border-border rounded-medium p-4 mb-4">
              <h4 className="text-sm font-semibold text-chalk mb-1">Install with CLI</h4>
              <p className="text-xs text-muted mb-3">Get the complete component source.</p>
              <div className="flex gap-1 mb-2">
                {(["bun", "npm", "yarn", "pnpm"] as PM[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPm(p)}
                    className={`text-xs px-2.5 py-1 rounded-pills ${
                      pm === p ? "bg-slate text-chalk" : "text-muted hover:text-pearl"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-void border border-border rounded-medium px-3 py-2">
                <code className="flex-1 text-xs text-pearl font-mono truncate">
                  $ {PM_COMMANDS[pm](entry.slug)}
                </code>
                <CopyButton text={PM_COMMANDS[pm](entry.slug)} />
              </div>
              <p className="text-xs text-muted mt-3">
                Don&apos;t know how to integrate this in your project?{" "}
                <span className="underline cursor-pointer">Read the guide.</span>
              </p>
            </div>
          )}

          {method === "code" && (
            <div className="mb-4">
              <SignInGate title="Let's get started." />
              <p className="text-xs text-muted mt-3 text-center">
                Not sure where this code goes in your project?{" "}
                <span className="underline cursor-pointer">Read the guide.</span>
              </p>
            </div>
          )}

          {method === "mcp" && (
            <div className="border border-border rounded-medium p-4 mb-4">
              <h4 className="text-sm font-semibold text-chalk mb-1">MCP</h4>
              <p className="text-xs text-muted mb-3">
                Paste this prompt into Claude, Cursor, Codex, Windsurf, or any agent connected to the Spark UI
                MCP.
              </p>
              <div className="flex items-start gap-2 bg-void border border-border rounded-medium px-3 py-2 mb-3">
                <pre className="flex-1 text-xs text-pearl font-mono whitespace-pre-wrap">{mcpPrompt}</pre>
              </div>
              <CopyButton text={mcpPrompt} label="Copy MCP Prompt" />
              <p className="text-xs text-muted mt-3">
                Not sure how Spark UI MCP works? <span className="underline cursor-pointer">Read the docs.</span>
              </p>
            </div>
          )}

          {method === "ai" && (
            <div className="mb-4">
              <SignInGate title="Sign in to use AI Prompt" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
