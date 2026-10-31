// Transforma [[slug|texto]] (ou [[slug]]) em link para /notas/slug.
// Assim as notas se ligam entre si no Markdown, sem sintaxe especial no resto do site.
const RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

function walk(node) {
  if (!node.children) return;
  const out = [];
  for (const child of node.children) {
    if (child.type === 'text' && child.value.includes('[[')) {
      let last = 0;
      let m;
      RE.lastIndex = 0;
      while ((m = RE.exec(child.value))) {
        if (m.index > last) out.push({ type: 'text', value: child.value.slice(last, m.index) });
        const slug = m[1].trim();
        const label = (m[2] ?? slug).trim();
        out.push({ type: 'link', url: `/notas/${slug}`, children: [{ type: 'text', value: label }] });
        last = m.index + m[0].length;
      }
      if (last < child.value.length) out.push({ type: 'text', value: child.value.slice(last) });
    } else {
      if (!['link', 'code', 'inlineCode'].includes(child.type)) walk(child);
      out.push(child);
    }
  }
  node.children = out;
}

export default function wikilinks() {
  return (tree) => walk(tree);
}
