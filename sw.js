const CACHE='tunnel-dip-v4-20261026a';
const PREFIX='tunnel-dip-';
const ASSETS=['./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('message',event=>{if(event.data==='GET_VERSION'&&event.ports[0])event.ports[0].postMessage(CACHE);});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3500);
      try{const response=await fetch(request,{cache:'no-store',signal:controller.signal});if(response.ok){await cache.put('./index.html',response.clone());return response;}throw new Error('HTTP '+response.status);}
      catch(error){const cached=await cache.match('./index.html');return cached||Response.error();}
      finally{clearTimeout(timer);}
    })());
  }else if(ASSETS.some(asset=>new URL(asset,self.registration.scope).pathname===url.pathname)){
    event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request,{ignoreSearch:true}))||fetch(request)));
  }
});
