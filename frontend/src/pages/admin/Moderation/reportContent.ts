const DEFAULT_ACCOUNT_TITLE = "Báo cáo tài khoản";
const DEFAULT_CONTENT_TITLE = "Nội dung bị báo cáo";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stripHtml(value: unknown) {
  const text = normalizeText(value);
  if (!text) return "";

  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+(?:[•]|-|:|–|—)+$/g, "");
}

function safeJsonParse(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseMaybeJson(raw: string) {
  let current = normalizeText(raw);
  for (let i = 0; i < 3; i += 1) {
    if (!current) return null;

    const parsed = safeJsonParse(current);
    if (parsed == null) return i === 0 ? null : current;

    if (typeof parsed === "string") {
      current = parsed.trim();
      continue;
    }

    return parsed;
  }

  return current;
}

function removeLeadingDuplicate(source: string, prefix: string) {
  if (!source || !prefix) return source;

  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escaped}\\s*[•\\-:|–—]*\\s*`, "i");
  return source.replace(pattern, "").trim();
}

export function formatReportContent(raw: unknown) {
  const text = normalizeText(raw);

  if (!text) {
    return {
      title: DEFAULT_ACCOUNT_TITLE,
      subtitle: "",
    };
  }

  const parsed = parseMaybeJson(text);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const title = stripHtml((parsed as Record<string, unknown>).title) || DEFAULT_CONTENT_TITLE;
    const lessonName = stripHtml((parsed as Record<string, unknown>).lessonName);
    const content = stripHtml((parsed as Record<string, unknown>).content);
    const subtitle = removeLeadingDuplicate(content, lessonName) || lessonName;

    return {
      title,
      subtitle,
    };
  }

  return {
    title: DEFAULT_CONTENT_TITLE,
    subtitle: stripHtml(text),
  };
}
