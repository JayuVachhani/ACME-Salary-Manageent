import http from 'node:http';
import {createReadStream,existsSync} from 'node:fs';
import {stat,realpath} from 'node:fs/promises';
import path from 'node:path';
const port=Number(process.argv[2]),apiPort=Number(process.env.QA_API_PORT??3001);
if(!Number.isInteger(port)||port<0||port>65535||!Number.isInteger(apiPort)||apiPort<1||apiPort>65535)throw Error('Invalid QA server port');
const root=await realpath(path.resolve('apps/web/dist'));
if(!existsSync(path.join(root,'index.html')))throw Error('Build frontend before browser QA');
const inside=file=>{const rel=path.relative(root,file);return !rel.startsWith('..')&&!path.isAbsolute(rel);};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
 let url;try{url=new URL(req.url,'http://127.0.0.1');}catch{res.writeHead(400).end();return;}
 if(url.pathname.startsWith('/api/')||['/healthz','/readyz'].includes(url.pathname)){
  const upstream=http.request({hostname:'127.0.0.1',port:apiPort,path:url.pathname+url.search,method:req.method,headers:{...req.headers,host:`127.0.0.1:${apiPort}`}},reply=>{res.writeHead(reply.statusCode??502,reply.headers);reply.on('error',()=>res.destroy());reply.pipe(res);});
  upstream.on('error',()=>{if(res.destroyed)return;if(!res.headersSent)res.writeHead(502,{'content-type':'application/json','cache-control':'no-store'});res.end('{"message":"QA API unavailable"}');});
  req.on('aborted',()=>upstream.destroy());req.on('error',()=>upstream.destroy());res.on('close',()=>{if(!res.writableFinished)upstream.destroy();});req.pipe(upstream);return;
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'allow':'GET, HEAD'}).end();return;}
 try{
  const decoded=decodeURIComponent(url.pathname);if(decoded.includes('\0')){res.writeHead(400).end();return;}
  let file=path.resolve(root,'.'+decoded);
  if(!inside(file)||decoded.split(/[\\/]/).some(v=>v.startsWith('.'))){res.writeHead(403).end();return;}
  try{if(!(await stat(file)).isFile())file=path.join(root,'index.html');}catch{if(path.extname(file)){res.writeHead(404).end();return;}file=path.join(root,'index.html');}
  file=await realpath(file);if(!inside(file)){res.writeHead(403).end();return;}
  const info=await stat(file);res.writeHead(200,{'content-type':types[path.extname(file)]??'application/octet-stream','content-length':info.size,'cache-control':'no-store','x-content-type-options':'nosniff'});
  if(req.method==='HEAD'){res.end();return;}const stream=createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
 }catch{if(!res.headersSent)res.writeHead(400);res.end();}
});
server.listen(port,'127.0.0.1',()=>console.log(JSON.stringify({event:'qa_web_started',port:server.address().port})));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
