import entries from './research.json';

export interface ResearchSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  type: string;
  publishedAt: string;
  coverage: string;
  checkedAt: string;
  pages?: string;
  note?: string;
}

export interface ResearchEntry {
  id: number;
  slug: string;
  title: string;
  category: string;
  period: string;
  summary: string;
  operationSummary?: string;
  hongseongTakeaway?: string;
  sections: {
    heading: string;
    legacyIds?: string[];
    paragraphs: { text: string; sourceIds: string[] }[];
  }[];
  sources: ResearchSource[];
}

export const researchEntries: ResearchEntry[] = entries;

export function getResearch(slug: string): ResearchEntry {
  const entry = researchEntries.find(entry => entry.slug === slug);
  if (!entry) throw new Error(`Unknown research topic: ${slug}`);
  return entry;
}

export const researchPath = (slug: string) => `/research/${slug}/`;

// Old list-page fragments remain resolvable after articles gain their own URLs.
export const legacyResearchLinks = researchEntries.flatMap(entry => {
  const path = researchPath(entry.slug);
  return [
    { id: `research-${entry.slug}`, href: path },
    { id: `research-title-${entry.slug}`, href: path },
    ...entry.sections.flatMap((section, index) => [
      { id: `research-${entry.slug}-section-${index}`, href: `${path}#research-${entry.slug}-section-${index}` },
      ...(section.legacyIds ?? []).map(id => ({ id, href: `${path}#${id}` })),
    ]),
    { id: `research-${entry.slug}-sources`, href: `${path}#sources` },
    ...entry.sources.map(source => ({ id: `research-${entry.slug}-source-${source.id}`, href: `${path}#research-${entry.slug}-source-${source.id}` })),
  ];
});

legacyResearchLinks.push(
  { id: 'research-hongseong-refund-policy', href: researchPath('hongseong-refund') },
  { id: 'research-title-hongseong-refund-policy', href: researchPath('hongseong-refund') },
  { id: 'research-hongseong-refund-policy-sources', href: `${researchPath('hongseong-refund')}#sources` },
  ...['s1', 's2', 's3', 's4', 's5', 's6'].map(id => ({
    id: `research-hongseong-refund-policy-source-${id}`,
    href: `${researchPath(['s1', 's2'].includes(id) ? 'hongseong-refund' : 'stay-tourism-policy')}#research-hongseong-refund-policy-source-${id}`,
  })),
);
