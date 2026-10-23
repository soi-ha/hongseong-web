import type { ProposalSection } from './proposal';

const decode = (value: string) => value.replace(/&amp;/g, '&');

/** Use only the source URLs already recorded with this slide. */
export function getSourceDetails({ notes = '', photo }: { notes?: string; photo?: ProposalSection['photo'] }) {
  const urls = [...notes.matchAll(/<a\b[^>]*href="(https?:[^\"]+)"[^>]*>/g)].map(match => decode(match[1]!));
  if (photo) urls.push(photo.page_url, photo.image_url);
  const links = [...new Set(urls)].map(href => {
    const domain = new URL(href).hostname.replace(/^www\./, '');
    const label = href === photo?.page_url ? `사진 출처 · ${photo.provider}`
      : href === photo?.image_url ? '사진 원본'
      : domain === 'itv.com' ? '관련 보도 · ITV News'
      : domain === 'media.stellantis.com' ? '관련 자료 · Vauxhall'
      : '참고 자료';
    return { href, label, domain };
  });
  // Keep the note wording. URL-only lines are represented by the link list above.
  const paragraphs = notes.replace(/<\/?details>|<summary>[\s\S]*?<\/summary>/g, '')
    .split(/<br\s*\/?>|<\/?p>/).map(line => line.trim()).filter(Boolean)
    .filter(line => {
      if (!/<a\b/.test(line)) return true;
      const withoutLinks = line.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, '').trim();
      return !/^(?:(?:출처|이미지|사진 URL):)?\s*$/.test(withoutLinks);
    })
    .map(line => line.replace(/<a href=/g, '<a target="_blank" rel="noopener noreferrer" href='));
  return { links, paragraphs };
}
