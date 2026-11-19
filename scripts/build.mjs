import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, 'dist');
const site = JSON.parse(fs.readFileSync(path.join(root, 'site.json'), 'utf8'));
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read = file => {
  const source = fs.readFileSync(path.join(root, 'content', file), 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const meta = {};
  if (match) for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue;
    const colon = line.indexOf(':');
    if (colon < 1) throw new Error(`Invalid metadata in ${file}: ${line}`);
    meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  const body = match ? source.slice(match[0].length) : source;
  return {meta, body, html: marked.parse(body), slug: path.basename(file, '.md')};
};
const collection = dir => fs.readdirSync(path.join(root, 'content', dir)).filter(f => f.endsWith('.md')).map(f => read(`${dir}/${f}`));
const projects = collection('projects').filter(p => p.meta.draft !== 'true').sort((a,b) => Number(a.meta.order ?? 99) - Number(b.meta.order ?? 99));
const posts = collection('posts').filter(p => p.meta.draft !== 'true').sort((a,b) => b.meta.date.localeCompare(a.meta.date));
for (const post of posts) if (!/^\d{4}-\d{2}-\d{2}$/.test(post.meta.date ?? '') || Number.isNaN(Date.parse(post.meta.date))) throw new Error(`Invalid date in ${post.slug}`);
const date = value => new Intl.DateTimeFormat('en', {year:'numeric',month:'long',day:'numeric', timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`));
const minutes = body => Math.max(1, Math.ceil(body.split(/\s+/).length / 220));
fs.rmSync(out, {recursive:true, force:true});
fs.mkdirSync(out, {recursive:true});
fs.cpSync(path.join(root,'public'), out, {recursive:true});
const write = (url, html) => {
  const target = path.join(out, url, 'index.html');
  fs.mkdirSync(path.dirname(target), {recursive:true});
  fs.writeFileSync(target, html);
};
const nav = [['/','About'],['/research/','Research'],['/writing/','Writing'],['/cv/','CV']];
const layout = (title, content, active='/', description=site.description, extra='') => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title === site.name ? title : `${title} · ${site.name}`)}</title>
<meta name="description" content="${esc(description)}"><meta name="theme-color" content="#fafbf9">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css"><link rel="alternate" type="application/rss+xml" title="${esc(site.name)} — Writing" href="/feed.xml">
</head><body><a class="skip" href="#main">Skip to content</a>
<div class="shell"><header class="site-header"><a class="identity" href="/" aria-label="${esc(site.name)} home">${esc(site.name)}</a>
<nav aria-label="Main navigation">${nav.map(([url,label])=>`<a href="${url}"${active===url?' aria-current="page"':''}>${label}</a>`).join('')}</nav></header>
<main id="main" tabindex="-1">${content}</main>
<footer class="site-footer"><p>${esc(site.name)}<span class="footer-location">${esc(site.location)}</span></p><div><a href="mailto:${esc(site.email)}">Email</a><a href="${esc(site.github)}">GitHub</a><a href="${esc(site.linkedin)}">LinkedIn</a></div></footer></div>${extra}
</body></html>`;
const projectRows = list => `<div class="project-list">${list.map(p=>`<a class="project-row" href="/research/${p.slug}/"><div><span class="eyebrow">${esc(p.meta.category)}</span><h3>${esc(p.meta.title)}</h3><p>${esc(p.meta.summary)}</p></div><span class="project-period">${esc(p.meta.period)}</span></a>`).join('')}</div>`;
const postRows = list => `<div class="post-list">${list.map(p=>`<a class="post-row" href="/writing/${p.slug}/"><time datetime="${esc(p.meta.date)}">${esc(date(p.meta.date))}</time><div><h3>${esc(p.meta.title)}</h3><p>${esc(p.meta.summary)}</p></div><span class="reading-time">${minutes(p.body)} min read</span></a>`).join('')}</div>`;
const about = read('about.md');
write('', layout(site.name, `
<section class="intro"><div class="eyebrow intro-label">${esc(about.meta.role)}</div><h1>${esc(about.meta.title)}</h1>
<div class="intro-columns"><div class="prose intro-copy">${about.html}</div>
<aside class="current"><span class="eyebrow">Currently</span><p>Master's thesis researcher<br><strong>Institute of Biological Physics</strong></p><p>MSc Computational Sciences<br><strong>University of Cologne</strong></p><span class="location">${esc(site.location)}</span></aside></div></section>`));
write('research', layout('Research & projects', `<section class="content-page"><h1 class="sr-only">Research & projects</h1>${projectRows(projects)}</section>`, '/research/'));
for (const p of projects) write(`research/${p.slug}`,layout(p.meta.title, `<a class="back-link" href="/research/">All research & projects</a><header class="article-heading"><span class="eyebrow">${esc(p.meta.category)} · ${esc(p.meta.period)}</span><h1>${esc(p.meta.title)}</h1><dl class="project-facts"><div><dt>Institution</dt><dd>${esc(p.meta.institution)}</dd></div><div><dt>Role</dt><dd>${esc(p.meta.role)}</dd></div><div><dt>Period</dt><dd>${esc(p.meta.dates)}</dd></div></dl></header><article class="prose article-body">${p.html}</article><div class="article-end"><p>Interested in this work?</p><a class="text-link" href="mailto:${esc(site.email)}">Get in touch</a></div>`, '/research/', p.meta.summary));
write('writing', layout('Writing', `<section class="content-page"><h1 class="sr-only">Writing</h1>${posts.length?postRows(posts):'<p class="empty-writing">No posts published yet.</p>'}<div class="feed-link"><a class="text-link" href="/feed.xml">Subscribe via RSS</a></div></section>`, '/writing/'));
for(const p of posts) write(`writing/${p.slug}`,layout(p.meta.title,`<a class="back-link" href="/writing/">All writing</a><header class="article-heading"><div class="eyebrow"><time datetime="${esc(p.meta.date)}">${esc(date(p.meta.date))}</time> · ${minutes(p.body)} min read</div><h1>${esc(p.meta.title)}</h1></header><article class="prose article-body">${p.html}</article>`, '/writing/', p.meta.summary));
const cv = read('cv.md');
write('cv',layout(cv.meta.title,`<section class="content-page cv-page"><h1 class="sr-only">${esc(cv.meta.title)}</h1><div class="print-identity"><h2>${esc(site.name)}</h2><p>${esc(site.location)} · ${esc(site.email)}</p><p>${esc(site.github)} · ${esc(site.linkedin)}</p></div><article class="prose cv-body">${cv.html}</article><div class="cv-actions"><button type="button" onclick="window.print()">Print / save as PDF</button><a class="text-link" href="/cv.md" download="Berkay-Ozkirli-CV.md">Download Markdown</a></div></section>`, '/cv/'));
fs.copyFileSync(path.join(root,'content/cv.md'),path.join(out,'cv.md'));
const xml = esc;
fs.writeFileSync(path.join(out,'feed.xml'),`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xml(site.name)} — Writing</title><link>${xml(site.url)}/writing/</link><description>${xml(site.description)}</description><language>en</language>${posts.map(p=>`<item><title>${xml(p.meta.title)}</title><link>${xml(site.url)}/writing/${p.slug}/</link><guid>${xml(site.url)}/writing/${p.slug}/</guid><pubDate>${new Date(`${p.meta.date}T12:00:00Z`).toUTCString()}</pubDate><description>${xml(p.meta.summary)}</description></item>`).join('')}</channel></rss>`);
fs.writeFileSync(path.join(out,'404.html'),layout('Page not found',`<section class="page-heading"><span class="eyebrow">404</span><h1>A little off the page.</h1><p>This page doesn't exist, or it has moved.</p><a class="text-link" href="/">Back to the homepage</a></section>`));
console.log(`Built ${projects.length} projects, ${posts.length} published posts, and CV into dist/.`);
