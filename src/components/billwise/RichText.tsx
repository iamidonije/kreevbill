import { Fragment, type ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (/^(\*\*|__).+\1$/.test(p)) return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
    if (/^`.+`$/.test(p)) return <code key={i} className="rounded bg-muted px-1">{p.slice(1, -1)}</code>;
    if (/^([*_]).+\1$/.test(p)) return <em key={i}>{p.slice(1, -1)}</em>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

export function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: ReactNode[] = [];
  let list: ReactNode[] = [];
  const flush = () => {
    if (list.length) out.push(<ul key={`u${out.length}`} className="my-1 list-disc space-y-1 pl-5">{list}</ul>);
    list = [];
  };
  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
    if (bullet) { list.push(<li key={i}>{inline(bullet[1]!)}</li>); return; }
    flush();
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) out.push(<p key={i} className="mt-2 font-semibold">{inline(h[1]!)}</p>);
    else if (line.trim()) out.push(<p key={i}>{inline(line)}</p>);
  });
  flush();
  return <div className="space-y-1.5">{out}</div>;
}
