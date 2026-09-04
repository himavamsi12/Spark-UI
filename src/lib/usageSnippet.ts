import type { ControlDef } from "./controls";
import type { Params } from "./effects";
import { toComponentName } from "./naming";

/** Renders one prop value as it would be written in JSX. */
function formatValue(key: string, value: unknown): string {
  if (typeof value === "string") {
    // Uploaded images become huge data: URLs, so keep the snippet readable.
    if (value.startsWith("data:")) return `  ${key}="/your-image.jpg"`;
    return `  ${key}="${value}"`;
  }
  if (Array.isArray(value)) {
    const items = value.map((v) =>
      typeof v === "string" && v.startsWith("data:") ? '"/your-image.jpg"' : JSON.stringify(v),
    );
    const inline = `[${items.join(", ")}]`;
    if (inline.length <= 72) return `  ${key}={${inline}}`;
    return `  ${key}={[\n${items.map((i) => `    ${i},`).join("\n")}\n  ]}`;
  }
  return `  ${key}={${value}}`;
}

export function generateUsageSnippet(name: string, schema: ControlDef[], values: Params): string {
  const componentName = toComponentName(name);
  const props = schema
    .map((c) => formatValue(c.key, values[c.key] ?? c.default))
    .join("\n");

  return `import ${componentName} from "./${componentName}";

export default function Example() {
  return (
    <${componentName}
${props}
    />
  );
}
`;
}
