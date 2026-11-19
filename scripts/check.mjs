import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist=path.join(root,'dist');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const files=walk(dist);
for(const file of files.filter(f=>f.endsWith('.html'))){
  const html=fs.readFileSync(file,'utf8');
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`One primary heading: ${file}`);
  assert(html.includes('name="viewport"'),`Mobile viewport: ${file}`);
  for(const match of html.matchAll(/(?:href|src)="(\/[^"#]*)(?:#[^"]*)?"/g)){
    const url=match[1];
    const target=path.join(dist,url,url.endsWith('/')?'index.html':'');
    assert(fs.existsSync(target),`Broken local link ${url} in ${file}`);
  }
}
assert(!fs.existsSync(path.join(dist,'writing/first-note')), 'Draft posts must not be published');
assert(!files.some(f=>f.endsWith('.md')&&!f.endsWith('/cv.md')),'Private Markdown sources must not be copied to dist');
assert(fs.readFileSync(path.join(dist,'cv/index.html'),'utf8').includes('window.print()'),'CV print action');
assert(fs.readFileSync(path.join(dist,'feed.xml'),'utf8').includes('<rss version="2.0">'),'RSS feed');
console.log(`Checked ${files.filter(f=>f.endsWith('.html')).length} HTML pages: local links, headings, viewport, CV, RSS, and draft exclusion passed.`);
