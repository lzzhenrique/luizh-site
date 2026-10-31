export type Stage = 'semente' | 'broto' | 'perene';

export const STAGES: Record<Stage, { label: string; hint: string }> = {
  semente: { label: 'Semente', hint: 'ideia crua, anotada rápido' },
  broto: { label: 'Broto', hint: 'já organizei e esclareci' },
  perene: { label: 'Perene', hint: 'razoavelmente completa, mas continuo cuidando' },
};

export interface Note {
  slug: string;
  title: string;
  description: string;
  stage: Stage;
  tags: string[];
  planted: Date;
  tended: Date;
  Content: any;
  links: string[];
}

const modules = import.meta.glob('../content/notas/*.md', { eager: true }) as Record<string, any>;
const WIKILINK = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;

function toNote(path: string, mod: any): Note {
  const slug = path.split('/').pop()!.replace(/\.md$/, '');
  const fm = mod.frontmatter ?? {};
  const raw: string = typeof mod.rawContent === 'function' ? mod.rawContent() : '';
  const links = [...raw.matchAll(WIKILINK)].map((m) => m[1].trim());
  return {
    slug,
    title: fm.title ?? slug,
    description: fm.description ?? '',
    stage: (fm.stage ?? 'semente') as Stage,
    tags: (fm.tags ?? []) as string[],
    planted: new Date(fm.planted),
    tended: new Date(fm.tended ?? fm.planted),
    Content: mod.Content,
    links,
  };
}

export function getNotes(): Note[] {
  return Object.entries(modules)
    .map(([path, mod]) => toNote(path, mod))
    .sort((a, b) => b.tended.getTime() - a.tended.getTime());
}

export function getNote(slug: string): Note | undefined {
  return getNotes().find((n) => n.slug === slug);
}

/** Notas que apontam para `slug` (links de volta). */
export function backlinksFor(slug: string): Note[] {
  return getNotes().filter((n) => n.slug !== slug && n.links.includes(slug));
}

export function tagSlug(tag: string): string {
  return tag
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function tagLabel(tag: string): string {
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

/** Canteiros: uma seção por assunto. Uma nota pode aparecer em mais de um. */
export function canteiros(): { tag: string; slug: string; label: string; notes: Note[] }[] {
  const map = new Map<string, Note[]>();
  for (const note of getNotes()) {
    for (const tag of note.tags) {
      map.set(tag, [...(map.get(tag) ?? []), note]);
    }
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
    .map(([tag, notes]) => ({ tag, slug: tagSlug(tag), label: tagLabel(tag), notes }));
}

const fmt = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function fmtDate(d: Date): string {
  return fmt.format(d).replace(/\./g, '');
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
