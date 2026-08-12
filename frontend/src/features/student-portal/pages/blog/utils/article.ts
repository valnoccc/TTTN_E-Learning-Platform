import DOMPurify from 'dompurify';

export const ARTICLE_CATEGORIES = {
  ANNOUNCEMENT: 'Thông báo',
  SYSTEM_UPDATE: 'Cập nhật hệ thống',
  PROMOTION: 'Khuyến mãi',
  NEWS: 'Tin tức',
} as const;

export type ArticleCategory = keyof typeof ARTICLE_CATEGORIES;

export function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
  });
}
