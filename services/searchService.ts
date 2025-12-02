export type SearchEntityType =
  | 'project'
  | 'inventory'
  | 'machine'
  | 'vendor'
  | 'document'
  | 'action';

export interface SearchEntry {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  keywords?: string[];
  action?: () => void;
}

export interface SearchResult extends SearchEntry {
  score: number;
}

const escapeRegex = (value: string) => value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

export class SearchService {
  private entries: SearchEntry[] = [];

  setEntries(entries: SearchEntry[]) {
    this.entries = entries;
  }

  search(query: string, additionalEntries: SearchEntry[] = []): SearchResult[] {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (terms.length === 0) return [];

    const haystackEntries = [...this.entries, ...additionalEntries];

    const scored = haystackEntries
      .map((entry) => {
        const haystack = [entry.title, entry.subtitle, ...(entry.keywords || [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const matches = terms.map((term) => haystack.includes(term));
        if (matches.some((m) => !m)) return null;

        const score = terms.reduce((acc, term) => {
          const matcher = new RegExp(escapeRegex(term), 'gi');
          const titleHits = (entry.title.match(matcher) || []).length;
          const keywordHits = (haystack.match(matcher) || []).length;
          return acc + titleHits * 3 + keywordHits;
        }, 0);

        return { ...entry, score } as SearchResult;
      })
      .filter((entry): entry is SearchResult => Boolean(entry));

    return scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  }
}

export default SearchService;
