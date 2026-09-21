import { PLAN } from './plan.js';
import { APARTMENTS } from './apartments.js';
import { world, inside, rooms } from './interior.js';

export function createPositionMap({getState,getPose,visit,onOpen}) {
  const mini=document.querySelector('#minimap'), full=document.querySelector('#expanded-map');
  const dialog=document.querySelector('#map-dialog');
  const footprints=Object.fromEntries(Object.entries(PLAN.footprintPolygonsPx).map(([id,p])=>[id,p.map(world)]));
  let transform=null,lastDraw=0;
  const centers={A:[9.6,-5.7],B:[.5,6.45],C:[-9.1,-5.7]};
  function draw(canvas,large) {
    const bounds=canvas.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
    const ratio=Math.min(devicePixelRatio,2.5),w=bounds.width,h=bounds.height;
    if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)) {canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
    const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
    const portrait=large&&w<650,scale=Math.min((w-(large?36:8))/(portrait?15.8:32.5),(h-(large?32:4))/(portrait?32.5:15.8));
    const project=([x,z])=>portrait?[w/2-z*scale,h/2+x*scale]:[w/2+x*scale,h/2+z*scale];
    if(large)transform={project,scale,portrait,w,h};
    const path=p=>{ctx.beginPath();p.forEach((p,i)=>{const [x,y]=project(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();};
    const line=(a,b)=>{ctx.beginPath();ctx.moveTo(...project(a));ctx.lineTo(...project(b));};
    const state=getState();
    for(const [id,p] of Object.entries(footprints)) {
      path(p);ctx.fillStyle=APARTMENTS[id]?.pale||'#e5e8e6';ctx.fill();
      ctx.strokeStyle=APARTMENTS[id]?.color||'#acb5b2';ctx.lineWidth=large?2.5:1;ctx.stroke();
    }
    for(const room of rooms){path(room.polygonWorldXZ);ctx.strokeStyle='#ffffffb0';ctx.lineWidth=large?1:.4;ctx.stroke();}
    const active=rooms.find(r=>r.id===state.room);
    if(active&&state.mode==='walk'){path(active.polygonWorldXZ);ctx.fillStyle=APARTMENTS[active.flat].color+'28';ctx.fill();}
    ctx.lineCap='square';
    for(const wall of PLAN.wallBaselines){
      if(wall.kind==='railing')continue;
      line(world(wall.aPx),world(wall.bPx));ctx.strokeStyle='#65716b';ctx.lineWidth=large?Math.max(1.5,wall.thicknessPx/53*scale):.9;ctx.stroke();
    }
    for(const opening of PLAN.openings){
      const a=world(opening.aPx),b=world(opening.bPx),flat=opening.id[0].toUpperCase();
      line(a,b);ctx.strokeStyle=APARTMENTS[flat]?.pale||'#e5e8e6';ctx.lineWidth=large?Math.max(3,.24*scale):1.8;ctx.stroke();
      if(opening.kind==='window'||opening.kind==='slider'){line(a,b);ctx.strokeStyle='#80a5b4';ctx.lineWidth=large?1.5:.6;ctx.stroke();}
      if(large&&opening.hingePx){
        const hinge=world(opening.hingePx),free=Math.hypot(hinge[0]-a[0],hinge[1]-a[1])<.05?b:a;
        const room=rooms.find(r=>r.id===(opening.id.includes('entry')?flat.toLowerCase()+(flat==='B'?'-living':'-foyer'):opening.id.replace('-door','')));
        const dx=free[0]-hinge[0],dz=free[1]-hinge[1],len=Math.hypot(dx,dz);
        const sign=room&&inside((a[0]+b[0])/2+dz/len*.3,(a[1]+b[1])/2-dx/len*.3,room.polygonWorldXZ)?1:-1;
        const tip=[hinge[0]+sign*dz,hinge[1]-sign*dx];
        line(hinge,tip);ctx.strokeStyle=APARTMENTS[flat]?.color||'#7a776c';ctx.lineWidth=1.5;ctx.stroke();
        const hp=project(hinge),fp=project(free),tp=project(tip);ctx.beginPath();ctx.arc(hp[0],hp[1],len*scale,Math.atan2(fp[1]-hp[1],fp[0]-hp[0]),Math.atan2(tp[1]-hp[1],tp[0]-hp[0]),sign>0);ctx.strokeStyle='#87918b70';ctx.lineWidth=.7;ctx.stroke();
      }
      if(/^[abc]-entry$/.test(opening.id)&&APARTMENTS[flat]){const [x,y]=project([(a[0]+b[0])/2,(a[1]+b[1])/2]);ctx.beginPath();ctx.arc(x,y,large?6:2.6,0,Math.PI*2);ctx.fillStyle=APARTMENTS[flat].color;ctx.fill();}
    }
    if(large){
      ctx.textAlign='center';ctx.textBaseline='middle';
      for(const room of rooms){
        const p=room.polygonWorldXZ,center=[p.reduce((s,a)=>s+a[0],0)/p.length,p.reduce((s,a)=>s+a[1],0)/p.length];
        const [x,y]=project(center);let name=room.label.replace('Primary bedroom','Bedroom 1').replace('Bedroom two','Bedroom 2').replace('Bedroom three','Bedroom 3').replace('Primary bathroom','Bath 1').replace('Bathroom two','Bath 2').replace('Bathroom three','Bath 3').replace('Bathroom','Bath').replace('Living & dining','Living / dining');
        const font=Math.max(9,Math.min(12,scale*.35));ctx.font=`500 ${font}px "DM Sans",sans-serif`;ctx.fillStyle='#344b4d';
        if(portrait)name=name.replace('Entrance foyer','Foyer').replace('North balcony','Balcony').replace('South balcony','Balcony').replace('Utility','Util.');const words=name.split(' / ');words.forEach((word,i)=>ctx.fillText(word,x,y+(i-(words.length-1)/2)*(font+2)));
      }
      const [cx,cy]=project([.5,-2]);ctx.font='500 10px "DM Sans",sans-serif';ctx.fillStyle='#596a65';if(portrait){ctx.fillText('SHARED',cx,cy-5);ctx.fillText('LOBBY',cx,cy+6);}else ctx.fillText('SHARED LOBBY',cx,cy);for(const r of PLAN.rooms.filter(r=>['stairs','lift'].includes(r.kind))){const p=r.polygonWorldXZ,center=[p.reduce((s,a)=>s+a[0],0)/p.length,p.reduce((s,a)=>s+a[1],0)/p.length];ctx.fillText(r.kind==='stairs'?'STAIRS':'LIFT',...project(center));}
      if(!portrait)for(const [id,p] of Object.entries(centers)){const [x,y]=project(p);ctx.font='650 12px "DM Sans",sans-serif';ctx.fillStyle=APARTMENTS[id].color;ctx.fillText(`APARTMENT ${id}`,x,y);}
      ctx.textAlign='left';ctx.fillStyle='#74857c';ctx.font='11px "DM Sans",sans-serif';ctx.fillText(portrait?'← N · Jayanagar 2nd Street':'N ↑ · Jayanagar 2nd Street',14,14);
    }
    if(state.mode==='walk'){
      const {x,z,yaw}=getPose(),[px,py]=project([x,z]);
      const forward=project([x-Math.sin(yaw),z-Math.cos(yaw)]),angle=Math.atan2(forward[1]-py,forward[0]-px);
      ctx.beginPath();ctx.moveTo(px,py);ctx.arc(px,py,large?30:13,angle-.52,angle+.52);ctx.closePath();ctx.fillStyle='#12364a26';ctx.fill();
      ctx.beginPath();ctx.arc(px,py,large?6:3.8,0,Math.PI*2);ctx.fillStyle='#163b49';ctx.fill();ctx.lineWidth=large?2.5:1.5;ctx.strokeStyle='#fff';ctx.stroke();
    }
  }
  function show(){onOpen();document.querySelector('#map-floor').textContent=String(getState().floor).padStart(2,'0');dialog.showModal();draw(full,true);}
  document.querySelector('#expand-map').onclick=show;
  document.querySelector('#minimap-open').onclick=show;
  full.onclick=e=>{
    if(!transform)return;
    const b=full.getBoundingClientRect(),px=e.clientX-b.left-transform.w/2,py=e.clientY-b.top-transform.h/2;
    const x=(transform.portrait?py:px)/transform.scale,z=(transform.portrait?-px:py)/transform.scale;
    const room=rooms.find(r=>inside(x,z,r.polygonWorldXZ));if(room){dialog.close();visit(room.id);}
  };
  for(const b of document.querySelectorAll('[data-map-flat]'))b.onclick=()=>{dialog.close();visit(b.dataset.mapFlat.toLowerCase()+'-living');};
  new ResizeObserver(()=>{if(dialog.open)draw(full,true);}).observe(full);
  return {render(now){if(now-lastDraw<80)return;lastDraw=now;draw(mini,false);if(dialog.open)draw(full,true);},show};
}
