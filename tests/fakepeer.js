// Test-only stand-in for PeerJS: pages in one browser context talk over a BroadcastChannel instead of WebRTC.
(()=>{ const bc=new BroadcastChannel('fakepeer'); const peers={};
class Em{constructor(){this.h={}} on(e,f){(this.h[e]=this.h[e]||[]).push(f);return this} emit(e,...a){(this.h[e]||[]).forEach(f=>f(...a))}}
class Conn extends Em{constructor(p,r,id){super();this.peer=r;this._p=p;this.id=id;this.open=false}
 send(d){bc.postMessage({k:'data',to:this.peer,cid:this.id,d:JSON.parse(JSON.stringify(d))})}
 close(){if(!this.open)return;this.open=false;bc.postMessage({k:'close',to:this.peer,cid:this.id});this.emit('close')}}
class Peer extends Em{constructor(id){super();if(typeof id!=='string')id='c'+Math.random().toString(36).slice(2,8);this.id=id;this.conns={};this.destroyed=false;peers[id]=this;setTimeout(()=>this.emit('open',id),50)}
 connect(rid){const cid=Math.random().toString(36).slice(2);const c=new Conn(this,rid,cid);this.conns[cid]=c;bc.postMessage({k:'conn',to:rid,from:this.id,cid});c._t=setTimeout(()=>{if(!c.open)this.emit('error',{type:'peer-unavailable'})},2000);return c}
 call(){const e=new Em();e.close=()=>{};return e} destroy(){this.destroyed=true;for(const k in this.conns)this.conns[k].close()} reconnect(){}}
bc.onmessage=e=>{const m=e.data,p=peers[m.to];if(!p||p.destroyed)return;
 if(m.k==='conn'){const c=new Conn(p,m.from,m.cid);p.conns[m.cid]=c;p.emit('connection',c);setTimeout(()=>{c.open=true;c.emit('open');bc.postMessage({k:'ack',to:m.from,cid:m.cid})},20)}
 else if(m.k==='ack'){const c=p.conns[m.cid];if(c){c.open=true;clearTimeout(c._t);c.emit('open')}}
 else if(m.k==='data'){const c=p.conns[m.cid];if(c&&c.open)c.emit('data',m.d)}
 else if(m.k==='close'){const c=p.conns[m.cid];if(c&&c.open){c.open=false;c.emit('close')}}};
window.Peer=Peer;})();
