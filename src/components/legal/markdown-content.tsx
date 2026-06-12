import * as React from "react";

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "hr" }
  | { type: "noteItalic"; text: string };

export function MarkdownContent({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return <>{blocks.map((block, idx) => renderBlock(block, idx))}</>;
}

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").trim().split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed === "---") {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    const h2 = trimmed.match(/^##\s+(.+)$/);
    if (h2) {
      blocks.push({ type: "h2", text: h2[1] });
      i++;
      continue;
    }

    const h3 = trimmed.match(/^###\s+(.+)$/);
    if (h3) {
      blocks.push({ type: "h3", text: h3[1] });
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (/^[-*]\s+/.test(t)) {
          items.push(t.replace(/^[-*]\s+/, ""));
          i++;
        } else if (t === "") {
          break;
        } else {
          items[items.length - 1] += " " + t;
          i++;
        }
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (/^\d+\.\s+/.test(t)) {
          items.push(t.replace(/^\d+\.\s+/, ""));
          i++;
        } else if (t === "") {
          break;
        } else {
          items[items.length - 1] += " " + t;
          i++;
        }
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    let para = trimmed;
    i++;
    while (i < lines.length && lines[i].trim() !== "") {
      para += " " + lines[i].trim();
      i++;
    }

    const italicWhole = para.match(/^\*([^*].*[^*])\*$/);
    if (italicWhole) {
      blocks.push({ type: "noteItalic", text: italicWhole[1] });
    } else {
      blocks.push({ type: "p", text: para });
    }
  }

  return blocks;
}

function renderBlock(block: Block, idx: number): React.ReactNode {
  switch (block.type) {
    case "h2":
      return (
        <h2
          key={idx}
          className="mt-10 font-display text-2xl text-ink first:mt-0"
        >
          {renderInline(block.text)}
        </h2>
      );
    case "h3":
      return (
        <h3
          key={idx}
          className="mt-7 font-display text-lg font-semibold text-ink"
        >
          {renderInline(block.text)}
        </h3>
      );
    case "p":
      return (
        <p key={idx} className="leading-7">
          {renderInline(block.text)}
        </p>
      );
    case "ul":
      return (
        <ul
          key={idx}
          className="list-disc space-y-2 pl-6 marker:text-olive-700"
        >
          {block.items.map((item, j) => (
            <li key={j} className="leading-7">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol
          key={idx}
          className="list-decimal space-y-2 pl-6 marker:font-semibold marker:text-olive-700"
        >
          {block.items.map((item, j) => (
            <li key={j} className="leading-7">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
    case "hr":
      return <hr key={idx} className="my-8 border-olive-900/15" />;
    case "noteItalic":
      return (
        <p
          key={idx}
          className="border-l-2 border-olive-700/40 pl-4 text-sm italic text-ink/60"
        >
          {renderInline(block.text)}
        </p>
      );
  }
}

function renderInline(text: string): React.ReactNode {
  const out: Array<string | React.ReactElement> = [];
  let buf = "";
  let i = 0;
  let key = 0;
  const flush = () => {
    if (buf) {
      out.push(buf);
      buf = "";
    }
  };

  while (i < text.length) {
    if (text.startsWith("**", i)) {
      const end = text.indexOf("**", i + 2);
      if (end !== -1) {
        flush();
        out.push(
          <strong key={key++} className="font-semibold text-ink">
            {text.slice(i + 2, end)}
          </strong>
        );
        i = end + 2;
        continue;
      }
    }

    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        flush();
        out.push(
          <code
            key={key++}
            className="rounded bg-cream px-1 py-0.5 font-mono text-[0.85em] text-ink"
          >
            {text.slice(i + 1, end)}
          </code>
        );
        i = end + 1;
        continue;
      }
    }

    if (text[i] === "[") {
      const close = text.indexOf("]", i + 1);
      if (close !== -1 && text[close + 1] === "(") {
        const paren = text.indexOf(")", close + 2);
        if (paren !== -1) {
          flush();
          const label = text.slice(i + 1, close);
          const href = text.slice(close + 2, paren);
          out.push(
            <a
              key={key++}
              href={href}
              className="text-olive-700 underline hover:text-olive-900"
            >
              {label}
            </a>
          );
          i = paren + 1;
          continue;
        }
      }
    }

    if (
      text[i] === "*" &&
      text[i + 1] !== "*" &&
      (i === 0 || text[i - 1] !== "*")
    ) {
      const end = text.indexOf("*", i + 1);
      if (end !== -1 && text[end + 1] !== "*") {
        flush();
        out.push(
          <em key={key++} className="italic">
            {text.slice(i + 1, end)}
          </em>
        );
        i = end + 1;
        continue;
      }
    }

    buf += text[i];
    i++;
  }

  flush();
  return (
    <>
      {out.map((node, j) =>
        typeof node === "string" ? (
          <React.Fragment key={j}>{node}</React.Fragment>
        ) : (
          node
        )
      )}
    </>
  );
}
