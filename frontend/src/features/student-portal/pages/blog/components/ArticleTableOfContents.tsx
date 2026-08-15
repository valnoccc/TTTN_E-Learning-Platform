import { RefObject, useEffect, useState } from 'react';

interface Heading {
  id: string;
  label: string;
  level: 'h2' | 'h3';
}

export default function ArticleTableOfContents({
  containerRef,
  content,
}: {
  containerRef: RefObject<HTMLElement>;
  content: string;
}) {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const nextHeadings = Array.from(container.querySelectorAll('h2, h3')).map((heading, index) => {
      const id = heading.id || `article-section-${index + 1}`;
      heading.id = id;
      heading.classList.add('scroll-mt-24');
      return { id, label: heading.textContent?.trim() || `Mục ${index + 1}`, level: heading.tagName.toLowerCase() as 'h2' | 'h3' };
    });
    setHeadings(nextHeadings);
  }, [containerRef, content]);

  if (!headings.length) return null;

  return (
    <aside className="sticky top-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-sm font-bold text-slate-800">Mục lục</p>
      <nav className="space-y-2">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`block text-sm text-slate-600 hover:text-emerald-600 ${heading.level === 'h3' ? 'pl-3' : ''}`}
          >
            {heading.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
