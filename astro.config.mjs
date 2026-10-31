import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import wikilinks from './src/plugins/wikilinks.mjs';

// PREVIEW=1 gera arquivos soltos (notas/x.html) para a prévia hospedada;
// o build normal gera pastas (notas/x/index.html), que é o que o Cloudflare Pages serve.
const preview = process.env.PREVIEW === '1';

export default defineConfig({
  site: 'https://luizh.com',
  outDir: preview ? './dist-preview' : './dist',
  build: { format: preview ? 'file' : 'directory' },
  markdown: { processor: unified({ remarkPlugins: [wikilinks] }) },
});
