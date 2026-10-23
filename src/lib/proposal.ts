import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import source from '../content/proposal-v02.md?raw';
import photoManifest from '../content/proposal-photos.json';

type Photo = (typeof photoManifest)[keyof typeof photoManifest];
const photos: Record<string, Photo> = photoManifest;
const escape = (text: string) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const groups = [
  { id: 'overview', label: '제안 개요', english: 'OVERVIEW', title: '홍성에서 보내는 하룻밤', from: 2, to: 3 },
  { id: 'plan-a', label: 'A안 코스', english: 'A / STAY COURSE', title: '궁리 1박 코스 + 홍성 1박 패스', from: 4, to: 8 },
  { id: 'operation-a', label: 'A안 운영', english: 'A / OPERATION', title: '체험부터 숙박까지, 하나의 코스로', from: 9, to: 12 },
  { id: 'results-a', label: 'A안 성과·협의', english: 'A / KPI & DISCUSSION', title: '성과의 가정과 시작 전 협의', from: 13, to: 15 },
  { id: 'plan-b', label: 'B안 구성', english: 'B / MONTHLY GATHERING', title: '궁리항 월별 브랜드 모임', from: 16, to: 20 },
  { id: 'operation-b', label: 'B안 운영·성과', english: 'B / OPERATION & KPI', title: '모임 운영과 지역 소비의 연결', from: 21, to: 25 },
  { id: 'comparison', label: '비교·추진', english: 'COMPARISON & NEXT STEP', title: '두 안의 비교와 다음 단계', from: 26, to: 27 },
  { id: 'appendix', label: '근거·조건', english: 'APPENDIX', title: '수치의 근거와 확인할 조건', from: 28, to: 29 },
] as const;

export async function getProposal() {
  // Render only our reviewed local source, never user-supplied HTML at runtime.
  const renderer = await createSatteriMarkdownProcessor({ syntaxHighlight: false, features: { smartPunctuation: false } });
  const matches = [...source.matchAll(/^## (\d{2})\. (.+)$/gm)];
  if (matches.length !== 29) throw new Error('v02 제안서의 29개 원문 항목을 확인해 주세요.');
  return Promise.all(matches.map(async (match, index) => {
    const number = Number(match[1]);
    const originalHeading = match[2]!;
    const [english, category] = originalHeading.split(' · ');
    let markdown = source.slice(match.index! + match[0].length, matches[index + 1]?.index ?? source.length).trim().replace(/\n---\s*$/, '');
    const imageMatch = markdown.match(/!\[([^\]]+)\]\(\.\/구성안_PPT_제작자료_v02\/assets\/([^\)]+)\)/);
    const photo = imageMatch ? photos[imageMatch[2]!] : undefined;
    if (imageMatch && !photo) throw new Error(`사진 연결 누락: ${imageMatch[2]}`);
    if (imageMatch) markdown = markdown.replace(imageMatch[0], '');
    // Korean numeric ranges are literal tildes, not GFM strikethrough markers.
    markdown = markdown.replace(/(?<!\\)~/g, '\\~');
    const rendered = await renderer.render(markdown);
    let html = rendered.code;
    // Only divider pages lack h3; ordinary h4 subheadings must stay in the body.
    const titleMatch = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/) ?? ([4, 16].includes(number) ? html.match(/<h4[^>]*>([\s\S]*?)<\/h4>/) : null);
    const title = titleMatch?.[1] ?? category ?? originalHeading;
    if (titleMatch) html = html.replace(titleMatch[0], '');
    html = html.replace(/ id="([^"]+)"/g, ` id="page-${match[1]}-$1"`);
    html = html.replace(/<table>/g, `<div class="table-scroll" role="region" aria-label="${escape(category ?? originalHeading)} 표 (가로 스크롤 가능)" tabindex="0"><table>`).replace(/<\/table>/g, '</table></div>');
    html = html.replace(/<th>/g, '<th scope="col">');
    const originalNotes = html.match(/<details>[\s\S]*?<\/details>/)?.[0] ?? '';
    html = html.replace(originalNotes, '');
    // Keep the source snapshot intact; shorten only the visible disclosure label.
    const notes = originalNotes.replace('<summary>출처·발표자 노트</summary>', '<summary>출처</summary>');
    if (photo) html = html.replace(`<p>${escape(photo.caption)}</p>`, '');
    if ([6, 7, 21, 27].includes(number)) {
      html = html.replace(/(?:<h4[^>]*>[\s\S]*?<\/h4>\s*<p>[\s\S]*?<\/p>\s*)+/g, (steps) =>
        `<div class="steps">${steps.replace(/(<h4[^>]*>[\s\S]*?<\/h4>\s*<p>[\s\S]*?<\/p>)/g, '<div class="step">$1</div>')}</div>`);
    }
    return { number, id: `page-${match[1]}`, english, category, title, html, notes, photo, originalHeading };
  }));
}
export type ProposalSection = Awaited<ReturnType<typeof getProposal>>[number];
