import type { APIContext } from 'astro';
import { getNotes } from '../lib/garden';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function GET(context: APIContext) {
  const site = (context.site ?? new URL('https://luizh.com')).toString().replace(/\/$/, '');
  const items = getNotes()
    .map(
      (n) => `    <item>
      <title>${esc(n.title)}</title>
      <link>${site}/notas/${n.slug}/</link>
      <guid>${site}/notas/${n.slug}/</guid>
      <pubDate>${n.tended.toUTCString()}</pubDate>
      <description>${esc(n.description)}</description>
    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Luiz Henrique</title>
    <link>${site}/</link>
    <description>Um jardim digital em crescimento.</description>
    <language>pt-BR</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
