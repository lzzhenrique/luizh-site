// Prepara o build de prévia (PREVIEW=1) para rodar fora da raiz de um domínio:
// transforma links absolutos (/notas/x) em relativos (../notas/x.html) e confere se todos existem.
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { join, relative, sep, dirname, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist-preview');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk(root);
const broken = [];
let rewritten = 0;

for (const file of files) {
  if (file.endsWith('.css')) {
    // fontes referenciadas como /_astro/... dentro do CSS (que também está em _astro/)
    let css = readFileSync(file, 'utf8');
    // prévia enxuta: só os subconjuntos latin / latin-ext das fontes (o navegador nem baixaria os outros)
    css = css.replace(/@font-face\{[^}]*\}/g, (block) => {
      const m = block.match(/\/([a-z0-9-]+?)\.[A-Za-z0-9_-]+\.woff2/);
      if (!m) return block;
      return /-latin(-ext)?-/.test(m[1] + '-') ? block : '';
    });
    const out = css.replace(/url\(\s*\/_astro\//g, 'url(./');
    if (out !== css) writeFileSync(file, out);
    continue;
  }
  if (!file.endsWith('.html')) continue;

  const rel = relative(root, file).split(sep).join('/');
  const depth = rel.split('/').length - 1;
  const prefix = depth === 0 ? './' : '../'.repeat(depth);

  const html = readFileSync(file, 'utf8');
  const out = html.replace(/\b(href|src)="(\/[^"]*)"/g, (all, attr, value) => {
    if (value.startsWith('//')) return all;
    const [pathAndQuery, hash = ''] = value.split(/(?=#)/);
    const path = pathAndQuery.split('?')[0];
    let target;
    if (path === '/') target = 'index.html';
    else if (/\.[a-z0-9]+$/i.test(path.split('/').pop())) target = path.slice(1);
    else target = path.slice(1).replace(/\/$/, '') + '.html';

    if (!existsSync(join(root, target))) broken.push(`${rel} -> ${value}`);
    rewritten++;
    return `${attr}="${prefix}${target}${hash}"`;
  });
  if (out !== html) writeFileSync(file, out);
}

// remove do disco as fontes que ficaram sem uso
const cssAll = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(f, 'utf8')).join('\n');
let pruned = 0;
for (const f of files) {
  if (f.endsWith('.woff2') && !cssAll.includes(f.split(sep).pop())) { rmSync(f); pruned++; }
}
console.log(`fontes removidas: ${pruned}`);
console.log(`links reescritos: ${rewritten}`);
if (broken.length) {
  console.error('LINKS QUEBRADOS:\n' + broken.map((b) => '  ' + b).join('\n'));
  process.exit(1);
}
console.log('nenhum link quebrado');
