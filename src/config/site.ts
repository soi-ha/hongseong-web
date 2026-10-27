export const SITE_NAME = '홍성 아이디어북';

export const SITE_PAGES = [
  { id: 'ideas', href: '/', label: '아이디어' },
  { id: 'research', href: '/research/', label: '자료조사' },
] as const;

export type SitePage = (typeof SITE_PAGES)[number]['id'];

// Keep the tab and header icons on the same reviewed asset version.
export const SITE_ICONS = {
  svg: '/favicon.svg?v=4',
  ico: '/favicon.ico?v=4',
} as const;
