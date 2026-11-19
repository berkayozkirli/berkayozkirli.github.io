import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root,'dist');
const rebuild = () => spawnSync(process.execPath, [path.join(root,'scripts/build.mjs')], {stdio:'inherit'});
if (rebuild().status !== 0) process.exit(1);
const fingerprint = () => {
  const scan = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry => {
    const file=path.join(dir,entry.name);
    return entry.isDirectory()?scan(file):[`${file}:${fs.statSync(file).mtimeMs}`];
  });
  return [...scan(path.join(root,'content')),...scan(path.join(root,'public')),String(fs.statSync(path.join(root,'site.json')).mtimeMs)].join('|');
};
let previous=fingerprint();
setInterval(()=>{const next=fingerprint();if(next!==previous){previous=next;rebuild();}},750);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.md':'text/markdown; charset=utf-8','.xml':'application/xml; charset=utf-8','.png':'image/png','.pdf':'application/pdf'};
http.createServer((req,res)=>{
  let pathname;
  try {pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);} catch {res.writeHead(400).end();return;}
  let file=path.resolve(dist,`.${pathname}`);
  if (file!==dist && !file.startsWith(dist+path.sep)) {res.writeHead(403).end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory()) {
    if(!pathname.endsWith('/')) {res.writeHead(301,{Location:pathname+'/'}).end();return;}
    file=path.join(file,'index.html');
  }
  const exists=fs.existsSync(file)&&fs.statSync(file).isFile();
  if(!exists) file=path.join(dist,'404.html');
  res.writeHead(exists?200:404,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
