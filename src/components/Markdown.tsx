// Render markdown sederhana (aman: escape HTML dulu) untuk isi kabar.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(s: string): string {
  let t = escapeHtml(s);
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");
  t = t.replace(/`(.+?)`/g, "<code>$1</code>");
  t = t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return t;
}

export function markdownToHtml(src: string): string {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let listOpen = false;
  let quoteOpen = false;

  const closeBlocks = () => {
    if (listOpen) {
      out.push("</ul>");
      listOpen = false;
    }
    if (quoteOpen) {
      out.push("</blockquote>");
      quoteOpen = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^#{1,3}\s/.test(line)) {
      closeBlocks();
      const level = line.match(/^#+/)![0].length;
      const tag = level === 1 ? "h2" : "h3";
      out.push(`<${tag}>${inline(line.replace(/^#+\s*/, ""))}</${tag}>`);
    } else if (/^>\s?/.test(line)) {
      if (listOpen) {
        out.push("</ul>");
        listOpen = false;
      }
      if (!quoteOpen) {
        out.push("<blockquote>");
        quoteOpen = true;
      }
      out.push(`<p>${inline(line.replace(/^>\s?/, ""))}</p>`);
    } else if (/^[-*]\s+/.test(line)) {
      if (quoteOpen) {
        out.push("</blockquote>");
        quoteOpen = false;
      }
      if (!listOpen) {
        out.push("<ul>");
        listOpen = true;
      }
      out.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
    } else if (/^\d+\.\s+/.test(line)) {
      if (!listOpen) {
        out.push("<ol>");
        listOpen = true;
      }
      out.push(`<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`);
    } else if (line.trim() === "") {
      closeBlocks();
    } else {
      closeBlocks();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeBlocks();
  return out.join("\n");
}

export default function Markdown({ teks }: { teks: string }) {
  return (
    <div
      className="prose-warga text-ink"
      dangerouslySetInnerHTML={{ __html: markdownToHtml(teks) }}
    />
  );
}
