import * as THREE from 'three';
import { PLAN } from './plan.js';
import { APARTMENTS } from './apartments.js';
import { M, mat, box, cyl, sphere, group, batch } from './model.js';
export const world=([x,z])=>[(x-900)/53,(z-641)/53];
export function inside(x,z,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [xi,zi]=polygon[i],[xj,zj]=polygon[j];if((zi>z)!=(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)yes=!yes;}return yes;}
const H=2.85;
function poly(g,points,y,material){const p=points.map(world);const shape=new THREE.Shape(p.map(([x,z])=>new THREE.Vector2(x,-z)));const geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);const uv=geo.attributes.uv,pos=geo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getX(i)/(material.userData.metres||2.4),pos.getZ(i)/(material.userData.metres||2.4));const mesh=new THREE.Mesh(geo,material);mesh.position.y=y;mesh.receiveShadow=true;g.add(mesh);return mesh;}
function segment(g,a,b,bottom,height,width,m){const [x,z]=a,[x2,z2]=b;const len=Math.hypot(x2-x,z2-z);const q=box(g,(x+x2)/2,bottom+height/2,(z+z2)/2,len,height,width,m);q.rotation.y=-Math.atan2(z2-z,x2-x);return q;}
function bounds(poly){return {minX:Math.min(...poly.map(p=>p[0])),maxX:Math.max(...poly.map(p=>p[0])),minZ:Math.min(...poly.map(p=>p[1])),maxZ:Math.max(...poly.map(p=>p[1]))};}
export const rooms=PLAN.rooms.filter(r=>r.flat&&r.kind!=='void').map(r=>({...r,bounds:bounds(r.polygonWorldXZ)}));
const visits={
'a-living':{at:[1421,630],look:[1350,485],name:'Living & dining'},'a-kitchen':{at:[1540,753],look:[1620,675]},'a-bed1':{at:[1290,832],look:[1380,904],name:'Primary bedroom'},'a-bed2':{at:[1505,500],look:[1580,420],name:'Bedroom two'},'a-bed3':{at:[1250,460],look:[1102,380],name:'Bedroom three'},'a-balcony':{at:[1380,384],look:[1380,200]},'a-foyer':{at:[1200,550],look:[1360,550]},'a-bath1':{at:[1540,885],look:[1520,920],name:'Primary bathroom'},'a-bath2':{at:[1615,608],look:[1645,594],name:'Bathroom two'},'a-bath3':{at:[1258,392],look:[1260,333],name:'Bathroom three'},'a-utility':{at:[1628,850],look:[1647,930]},
'b-living':{at:[957,829],look:[900,632],name:'Living & dining'},'b-kitchen':{at:[1050,855],look:[1090,795]},'b-bed1':{at:[789,795],look:[706,843],name:'Primary bedroom'},'b-bed2':{at:[1040,637],look:[1100,703],name:'Bedroom two'},'b-balcony':{at:[908,922],look:[970,995]},'b-bath1':{at:[726,672],look:[705,611],name:'Primary bathroom'},'b-bath2':{at:[1250,701],look:[1249,650],name:'Bathroom two'},'b-utility':{at:[1040,940],look:[1100,940]},
'c-living':{at:[449,710],look:[382,510],name:'Living & dining'},'c-kitchen':{at:[543,777],look:[618,740]},'c-bed1':{at:[280,816],look:[181,855],name:'Primary bedroom'},'c-bed2':{at:[277,499],look:[196,421],name:'Bedroom two'},'c-bed3':{at:[615,465],look:[703,380],name:'Bedroom three'},'c-balcony':{at:[412,382],look:[412,200]},'c-foyer':{at:[580,554],look:[397,552]},'c-bath1':{at:[203,684],look:[140,670],name:'Primary bathroom'},'c-bath2':{at:[194,583],look:[145,570],name:'Bathroom two'},'c-bath3':{at:[549,398],look:[542,336],name:'Bathroom three'},'c-utility':{at:[560,927],look:[623,922]}
};
for(const r of rooms){const v=visits[r.id];r.visit=world(v.at);r.look=world(v.look);r.label=v.name||r.name;r.dim=r.printedDimensions;}
export const orderedRooms=flat=>rooms.filter(r=>r.flat===flat).sort((a,b)=>{const order=['living','foyer','kitchen','room','balcony','bathroom','utility'];return order.indexOf(a.kind)-order.indexOf(b.kind)||a.id.localeCompare(b.id);});
export function createInterior(assets){const root=new THREE.Group(),floors=group(root),walls=group(root),furniture=group(root),ceilings=group(root),details=group(root);const props=group(root),doors=group(root),identity=group(root);const accents=Object.fromEntries(Object.entries(APARTMENTS).map(([id,a])=>[id,assets.fabricAccent(a.finish)]));root.name='Brochure traced typical floor';const collisions=[];const furnitureBounds=[];
function block(x,z,w,d,flat){furnitureBounds.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,flat});}
for(const [flat,points] of Object.entries(PLAN.footprintPolygonsPx)){poly(floors,points,-.06,mat('slab','#a3aaa7'));poly(floors,points,0,assets.floor);poly(ceilings,points,H,mat('ceiling','#f3f1eb',.9,{side:THREE.DoubleSide}));}
for(const room of PLAN.rooms){if(room.kind==='void')continue;const floorMat=room.kind==='room'?assets.woodFloor:room.kind==='bathroom'?M.bath:room.kind==='balcony'?mat('deck','#b9af97'):assets.floor;poly(floors,room.polygonPx,.012,floorMat);}
// Leave the shaft visibly open; surrounding room polygons still follow the drawing.
const shaft=PLAN.rooms.find(r=>r.kind==='void');poly(floors,shaft.polygonPx,.017,mat('shaft','#75877e'));
const seen=new Set();
for(const wall of PLAN.wallBaselines){if(wall.kind==='railing')continue;const a=world(wall.aPx),b=world(wall.bPx);const key=[...a,...b].map(v=>v.toFixed(2)).join(',');if(seen.has(key))continue;seen.add(key);const length=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=(b[0]-a[0])/length,dz=(b[1]-a[1])/length;const at=t=>[a[0]+dx*t,a[1]+dz*t];const cuts=PLAN.openings.filter(o=>o.wallId===wall.id).map(o=>{const oa=world(o.aPx),ob=world(o.bPx);const t1=(oa[0]-a[0])*dx+(oa[1]-a[1])*dz,t2=(ob[0]-a[0])*dx+(ob[1]-a[1])*dz;return{...o,start:Math.max(0,Math.min(t1,t2)),end:Math.min(length,Math.max(t1,t2))};}).sort((a,b)=>a.start-b.start);
function solid(start,end,bottom=0,h=H,collide=true){if(end-start<.008)return;segment(walls,at(start),at(end),bottom,h,wall.thicknessPx/53,M.plaster);if(bottom===0){segment(walls,at(start),at(end),.025,.1,.205,M.white);}if(collide)collisions.push({a:at(start),b:at(end),width:wall.thicknessPx/53,id:wall.id});}
let cursor=0;for(const o of cuts){solid(cursor,o.start);const window=o.kind==='window',sill=window?(o.id.includes('bath')?1.6:.72):0,top=window?2.35:2.3;if(sill)solid(o.start,o.end,0,sill);solid(o.start,o.end,top,H-top,false);
const start=at(o.start),end=at(o.end),center=at((o.start+o.end)/2),len=o.end-o.start;
if(window||o.kind==='slider'){segment(walls,start,end,sill,.055,.22,M.frame);segment(walls,start,end,top-.05,.05,.22,M.frame);for(const t of [o.start,o.end])box(walls,...[at(t)[0],(sill+top)/2,at(t)[1]],.05,top-sill,.05,M.frame);
if(window){segment(walls,start,end,sill+.04,top-sill-.09,.022,M.glass);box(walls,center[0],(sill+top)/2,center[1],.04,top-sill,.04,M.frame);}
else {const q=at(o.end-(o.end-o.start)*.2);segment(walls,q,end,.08,top-.14,.027,M.glass);collisions.push({a:q,b:end,width:.06,id:o.id});}
}else if(o.kind!=='open'){for(const t of [o.start-.018,o.end+.018]){const [x,z]=at(t);box(walls,x,1.15,z,.08,2.3,.21,M.oak);}segment(walls,start,end,2.26,.085,.22,M.oak);}
if(o.kind==='liftDoor'){segment(walls,start,end,0,2.3,.1,M.metal);collisions.push({a:start,b:end,width:.1,id:'lift'});}cursor=Math.max(cursor,o.end);}solid(cursor,length);}
// Hinged oak leaves, hardware and signs make each room threshold readable.
function plaque(parent,text,subtitle,width,height,bg){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);ctx.fillStyle='#fffaf2';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 83px "DM Sans", sans-serif';ctx.fillText(text,512,subtitle?96:130);if(subtitle){ctx.font='400 33px "DM Sans", sans-serif';ctx.fillText(subtitle,512,192);}const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({map:tex,roughness:.65}));parent.add(mesh);return mesh;
}
for(const opening of PLAN.openings.filter(o=>o.kind==='door')){
 const flat=opening.id[0].toUpperCase(),entry=opening.id.includes('entry'),a=world(opening.aPx),b=world(opening.bPx),hinge=world(opening.hingePx);
 const end=Math.hypot(hinge[0]-a[0],hinge[1]-a[1])<.05?b:a,dx=end[0]-hinge[0],dz=end[1]-hinge[1],length=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx);
 const room=rooms.find(r=>r.id===(entry?flat.toLowerCase()+(flat==='B'?'-living':'-foyer'):opening.id.replace('-door','')));
 const sign=room&&inside((a[0]+b[0])/2+dz/length*.3,(a[1]+b[1])/2-dx/length*.3,room.polygonWorldXZ)?1:-1;
 const swing=group(doors,hinge[0],0,hinge[1],angle+sign*Math.PI/2),width=length-.055;
 box(swing,width/2,1.115,0,width,2.23,.055,assets.door,true);
 for(const side of [-1,1]){
  box(swing,width/2,1.16,side*.031,width-.16,1.94,.016,M.oak,true);
  box(swing,width-.12,1.03,side*.052,.045,.16,.024,M.metal,true);
  box(swing,width-.18,1.065,side*.086,.17,.025,.035,M.metal,true);
  for(const y of [.22,1.15,2.03])cyl(swing,.018,y,side*.016,.018,.13,M.metal);
 }
 collisions.push({a:hinge,b:[hinge[0]+sign*dz,hinge[1]-sign*dx],width:.055,id:opening.id+'-leaf'});
 // The lever projects beyond the leaf at hand height and is part of walking clearance.
 const handleAt=t=>[hinge[0]+sign*dz/length*t,hinge[1]-sign*dx/length*t];
 collisions.push({a:handleAt(width-.265),b:handleAt(width-.095),width:.207,id:opening.id+'-handle'});
 const arch=group(doors,hinge[0],0,hinge[1],angle),roomSide=-sign;
 const signMesh=plaque(arch,entry?'APARTMENT '+flat:room?.label||'Room',entry?APARTMENTS[flat].beds+' · '+APARTMENTS[flat].area:null,entry?1.05:Math.min(.85,length),entry?.29:.19,entry?APARTMENTS[flat].color:'#73604e');signMesh.position.set(length/2,2.51,-roomSide*.125);if(roomSide>0)signMesh.rotation.y=Math.PI;
 if(entry){
  const color=mat('entry-'+flat,APARTMENTS[flat].color,.7);
  segment(floors,a,b,.014,.022,.42,color);
  for(const p of [a,b])box(doors,p[0],1.15,p[1],.1,2.3,.23,color);
 }
}
for(const [flat,p] of Object.entries(PLAN.footprintPolygonsPx)){
 if(!APARTMENTS[flat])continue;const points=p.map(world),color=mat('boundary-'+flat,APARTMENTS[flat].color);
 for(let i=0;i<points.length;i++)segment(identity,points[i],points[(i+1)%points.length],1.002,.035,.24,color);
}
// Balcony front edges are railings, not full-height walls.
for(const r of rooms.filter(r=>r.kind==='balcony')){const b=r.bounds,z=r.flat==='B'?b.maxZ:b.minZ;segment(details,[b.minX,z],[b.maxX,z],.16,.82,.045,M.glass);segment(details,[b.minX,z],[b.maxX,z],1.02,.045,.065,M.frame);for(let x=b.minX;x<=b.maxX+.1;x+=.7)cyl(details,x,.56,z,.018,1,M.frame);collisions.push({a:[b.minX,z],b:[b.maxX,z],width:.1,id:r.id+'-rail'});}
function pgroup(px,pz,angle=0){const [x,z]=world([px,pz]);return group(furniture,x,0,z,angle);}
function collideLocal(g,x,z,w,d,flat){const a=new THREE.Vector3(x*g.scale.x,0,z*g.scale.z);w*=g.scale.x;d*=g.scale.z;a.applyAxisAngle(new THREE.Vector3(0,1,0),g.rotation.y).add(g.position);if(Math.abs(Math.sin(g.rotation.y))>.7)[w,d]=[d,w];block(a.x,a.z,w,d,flat);}
function bed(px,pz,angle,flat,color=null,sideTables=null,headboardWidth=1.8){const g=pgroup(px,pz,angle);color=color||accents[flat];box(g,0,.17,0,1.62,.26,2.14,M.oak,true);box(g,0,.4,0,1.57,.24,2.03,M.linen,true);box(g,0,.85,-1.07,headboardWidth,1.3,.12,M.oak,true);for(const x of [-.58,0,.58])box(g,x,.93,-.985,.55,1.1,.07,accents[flat],true);box(g,0,.54,.24,1.59,.12,1.4,color,true);for(const x of [-.4,.4]){box(g,x,.59,-.66,.61,.18,.42,M.white,true);box(g,x,.65,-.39,.45,.19,.26,M.cream,true);}box(g,0,.615,.68,1.61,.035,.5,M.rug);for(const x of sideTables??(flat==='B'?(angle===Math.PI?[-.98]:[.98]):[-.98,.98])){box(g,x,.27,-.78,.29,.44,.32,M.oak,true);collideLocal(g,x,-.78,.29,.32,flat);cyl(g,x,.57,-.78,.1,.07,M.metal);cyl(g,x,.78,-.78,.025,.39,M.metal);cyl(g,x,.91,-.78,.14,.25,M.cream);}box(g,0,.03,.25,2.2,.018,2.4,M.rug);collideLocal(g,0,0,1.65,2.17,flat);collideLocal(g,0,-1.07,headboardWidth,.12,flat);}
function wardrobe(px,pz,w,d,angle,flat){const g=pgroup(px,pz,angle);box(g,0,1.2,0,w,2.4,d,M.oak);const count=Math.max(2,Math.round(w/.5));for(let i=0;i<count;i++){const x=-w/2+(i+.5)*w/count;box(g,x,1.2,d/2+.014,w/count-.016,2.32,.025,M.white);box(g,x+w/count*.3,1.13,d/2+.05,.018,.27,.025,M.metal);}collideLocal(g,0,.035,w,d+.07,flat);}
function sofa(px,pz,angle,flat,compact=false){const g=pgroup(px,pz,angle);if(compact){g.scale.x=1.7/2.05;g.scale.z=.95;}box(g,0,.28,0,2.05,.34,.83,M.linen,true);box(g,0,.59,-.38,2.052,.54,.22,M.linen,true);for(const x of compact?[-.44,.44]:[-.59,0,.59]){const back=box(g,x,.76,-.29,compact?.86:.58,.46,.19,M.linen,true);back.rotation.x=.13;}for(const x of [-.95,.95])box(g,x,.5,0,.16,.49,.86,M.linen,true);for(const x of compact?[-.44,.44]:[-.59,0,.59]){box(g,x,.54,.03,compact?.86:.55,.16,.66,M.linen,true);const cushion=box(g,x,.76,-.2,.45,.37,.16,(compact?x<0:x===0)?accents[flat]:M.linen,true);cushion.rotation.x=.14;cushion.rotation.z=x*.12;}for(const x of [-.8,.8])for(const z of [-.27,.28])cyl(g,x,.12,z,.035,.22,M.wood);if(compact){collideLocal(g,0,0,2.05,.87,flat);return;}box(g,0,.027,1.2,2.35,.018,2.2,M.rug);box(g,0,.43,1.03,.92,.065,.48,assets.counter,true);for(const x of [-.33,.33])for(const z of [.87,1.19])cyl(g,x,.2,z,.025,.4,M.frame);box(g,-.23,.5,1.03,.3,.04,.22,M.cream);cyl(g,.25,.53,1.1,.09,.12,M.ceramic);collideLocal(g,0,0,2.05,.87,flat);collideLocal(g,0,1.03,.92,.48,flat);}
function dining(px,pz,angle,flat,small=false){
 const g=pgroup(px,pz,angle),length=small?1.1:1.35;box(g,0,.76,0,small?.72:.8,.065,length,M.oak,true);
 for(const x of [-.31,.31])for(const z of [-length*.36,length*.36])box(g,x,.36,z,.055,.73,.055,M.wood);
 const models=group(props,g.position.x,0,g.position.z,angle);
 for(const x of [-.53,.53])for(const z of [-length*.29,length*.29]){
  const c=group(models,x,0,z,x>0?-Math.PI/2:Math.PI/2);c.add(assets.diningChair.clone(true));
  const plate=cyl(g,Math.sign(x)*.25,.801,z,.135,.015,M.ceramic);cyl(g,Math.sign(x)*.25,.812,z,.096,.004,M.white);
  const glass=new THREE.Mesh(new THREE.CylinderGeometry(.035,.029,.12,24,1,true),M.glass);glass.position.set(Math.sign(x)*.31,.86,z+.2);g.add(glass);
  box(g,Math.sign(x)*.25,.82,z-.18,.13,.012,.055,accents[flat]);
 }
 cyl(g,0,.88,0,.075,.23,M.ceramic);for(let i=0;i<5;i++){const stem=cyl(g,Math.sin(i*2.4)*.05,1.12,Math.cos(i*2.4)*.05,.004,.35,M.leaf);stem.rotation.z=(i-2)*.15;sphere(g,Math.sin(i*2.4)*.075,1.27,Math.cos(i*2.4)*.075,.06,.025,.04,M.leaf2);}
 collideLocal(g,0,0,1.64,length+.1,flat);
 // Pendant shades and brass suspension above the table.
 for(const z of [-.38,.38]){cyl(ceilings,g.position.x,2.65,g.position.z+z,.012,.37,M.metal);const shade=new THREE.Mesh(new THREE.CylinderGeometry(.1,.23,.16,40,1,true),M.cream);shade.position.set(g.position.x,2.39,g.position.z+z);ceilings.add(shade);cyl(ceilings,g.position.x,2.32,g.position.z+z,.2,.015,M.warm);}
}
function bistro(px,pz,flat){const g=pgroup(px,pz);box(g,0,.76,0,.72,.055,.95,M.oak,true);for(const x of [-.26,.26])for(const z of [-.35,.35])box(g,x,.37,z,.045,.73,.045,M.wood);const models=group(props,g.position.x,0,g.position.z);for(const z of [-.65,.65]){const c=group(models,0,0,z,z>0?Math.PI:0);c.add(assets.diningChair.clone(true));cyl(g,0,.802,Math.sign(z)*.28,.13,.015,M.ceramic);box(g,.21,.817,Math.sign(z)*.28,.045,.012,.13,accents[flat]);}cyl(g,0,.88,0,.045,.19,M.ceramic);collideLocal(g,0,0,.76,1.92,flat);}
function television(px,pz,angle,flat){
 const g=pgroup(px,pz,angle);g.name='Wall-mounted television '+flat;
 box(g,0,1.4,0,1.18,.69,.028,M.black,true);
 box(g,0,1.4,.017,1.13,.64,.009,mat('screen','#45595a',.26));
 collideLocal(g,0,.006,1.18,.045,flat);
}
// Furniture follows the positions and scale of the illustrated plan.
bed(195,423,Math.PI/2,'C');bed(191,849,Math.PI/2,'C',M.terracotta);bed(702,404.5,-Math.PI/2,'C',null,[],1.72);
bed(711,842,Math.PI/2,'B',M.blue);bed(1114,706,Math.PI,'B',M.terracotta,[]);
bed(1103,405.5,Math.PI/2,'A',null,[],1.72);bed(1595,426,-Math.PI/2,'A',M.terracotta);bed(1381,905,Math.PI,'A',M.blue);
// Storage is only placed on solid walls with a usable approach aisle.
wardrobe(238,949,2.35,.45,Math.PI,'C');
wardrobe(1278,894,1.4,.45,Math.PI/2,'A');
sofa(1326,493,Math.PI/2,'A');television(1469,505,-Math.PI/2,'A');dining(1370,705,0,'A');
sofa(339,518,Math.PI/2,'C');television(485,660,-Math.PI/2,'C');dining(386,812,0,'C');

sofa(900,632,0,'B',true);television(994,720,-Math.PI/2,'B');bistro(875,830,'B');
function kitchen(room){const b=room.bounds;const x=b.maxX-.32,z=b.minZ+.33,w=b.maxX-b.minX,d=b.maxZ-b.minZ;const g=furniture;box(g,x,.43,(b.minZ+b.maxZ)/2,.6,.84,d-.2,M.oak);box(g,x,.89,(b.minZ+b.maxZ)/2,.66,.08,d-.17,assets.counter);block(x,(b.minZ+b.maxZ)/2,.62,d-.2,room.flat);box(g,(b.minX+b.maxX)/2,.43,z,w-.14,.84,.6,M.oak);box(g,(b.minX+b.maxX)/2,.89,z,w-.1,.08,.65,assets.counter);block((b.minX+b.maxX)/2,z,w-.1,.6,room.flat);
for(let zz=b.minZ+.4;zz<b.maxZ-.15;zz+=.55){box(g,x-.31,.48,zz,.016,.65,.51,M.white);box(g,x-.335,.73,zz,.022,.035,.23,M.metal);}for(let xx=b.minX+.35;xx<b.maxX-.2;xx+=.55){box(g,xx,.48,z+.31,.51,.65,.015,M.white);box(g,xx,.73,z+.335,.23,.035,.025,M.metal);box(g,xx,1.97,b.minZ+.2,.52,.65,.36,M.white);}box(g,(b.minX+b.maxX)/2,1.37,b.minZ+.025,w-.1,.78,.03,M.bath);
box(g,x,.946,b.minZ+d*.55,.48,.015,.7,M.black,true);for(const zz of [-.18,.18])for(const xx of [-.11,.11])cyl(g,x+xx,.96,b.minZ+d*.55+zz,.08,.016,M.metal);
box(g,b.minX+w*.42,.94,z,.58,.026,.4,M.metal,true);box(g,b.minX+w*.42,.957,z,.47,.02,.3,M.dark,true);cyl(g,b.minX+w*.42,1.13,z-.15,.026,.35,M.metal);box(g,b.minX+w*.42,1.29,z-.1,.03,.025,.15,M.metal);box(g,x,2.05,b.minZ+d*.55,.4,.18,.85,M.frame);box(g,x,2.41,b.minZ+d*.55,.23,.55,.4,M.metal);}
for(const r of rooms.filter(r=>r.kind==='kitchen'))kitchen(r);
function bathroom(room){const b=room.bounds,w=b.maxX-b.minX,d=b.maxZ-b.minZ;let x=b.minX+.39,z=b.minZ+.4;if(room.id==='a-bath2'){x=b.maxX-.42;z=b.maxZ-.38;}const g=furniture;block(x,z,.46,.67,room.flat);box(g,x,.31,z,.46,.55,.67,M.ceramic,true);sphere(g,x,.6,z+.13,.235,.085,.29,M.ceramic);sphere(g,x,.632,z+.13,.155,.022,.21,M.dark);box(g,x,.85,z-.22,.48,.51,.16,M.ceramic,true);
const vx=b.maxX-.31;block(vx,b.minZ+.35,.52,.55,room.flat);box(g,vx,.5,b.minZ+.35,.52,.66,.55,M.oak,true);box(g,vx,.86,b.minZ+.35,.57,.09,.61,M.ceramic,true);sphere(g,vx,.905,b.minZ+.36,.2,.025,.18,M.bath);box(g,vx,1.6,b.minZ+.015,.51,.71,.025,mat('mirror','#b7d2d7',.04,{metalness:1}));cyl(g,vx,1,b.minZ+.1,.024,.25,M.metal);
const sz=b.maxZ-.37;box(g,b.minX+.38,.065,sz,.73,.07,.72,M.white,true);box(g,b.minX+.02,1.72,sz,.035,.83,.035,M.metal);box(g,b.minX+.15,2.15,sz,.27,.022,.17,M.metal);for(let zz=b.minZ;zz<b.maxZ;zz+=.6)box(details,b.minX+.003,1.1,zz,.013,2.15,.005,M.white);
}
for(const r of rooms.filter(r=>r.kind==='bathroom'))bathroom(r);
for(const r of rooms.filter(r=>r.kind==='utility')){const b=r.bounds;block(b.maxX-.34,b.maxZ-.34,.61,.62,r.flat);box(furniture,b.maxX-.34,.44,b.maxZ-.34,.61,.87,.62,M.white,true);const q=cyl(furniture,b.maxX-.66,.46,b.maxZ-.34,.19,.023,M.frame);q.rotation.z=Math.PI/2;box(furniture,b.maxX-.34,.9,b.maxZ-.34,.66,.04,.65,M.cream);}
// Framed abstract art and linen drapery are proposed decorative finishes.
const artCanvas=document.createElement('canvas');artCanvas.width=512;artCanvas.height=320;const artContext=artCanvas.getContext('2d');artContext.fillStyle='#e4dbca';artContext.fillRect(0,0,512,320);artContext.fillStyle='#49616b';artContext.beginPath();artContext.arc(174,155,115,0,Math.PI*2);artContext.fill();artContext.fillStyle='#b47d5d';artContext.fillRect(245,85,130,210);artContext.fillStyle='#cec09e';artContext.beginPath();artContext.arc(364,98,75,0,Math.PI*2);artContext.fill();artContext.strokeStyle='#f2eee4';artContext.lineWidth=3;for(let i=0;i<7;i++){artContext.beginPath();artContext.moveTo(60+i*21,75);artContext.lineTo(245+i*21,290);artContext.stroke();}const artTexture=new THREE.CanvasTexture(artCanvas);artTexture.colorSpace=THREE.SRGBColorSpace;const artMaterial=new THREE.MeshStandardMaterial({map:artTexture,roughness:.9});
for(const [px,pz,rotation] of [[319,510,Math.PI/2],[1306,661,Math.PI/2],[905,601,0]]){const g=pgroup(px,pz,rotation);box(g,0,1.86,0,1.5,.95,.045,M.oak);box(g,0,1.86,.032,1.43,.88,.02,artMaterial);}
for(const opening of PLAN.openings.filter(o=>o.kind==='slider'||o.kind==='window'&&o.id.includes('bed')&&!o.id.includes('bath'))){const wall=PLAN.wallBaselines.find(w=>w.id===opening.wallId),a=world(opening.aPx),b=world(opening.bPx);let n=wall.id.includes('south')?[0,-1]:wall.id.includes('east')?[-1,0]:wall.id.includes('west')?[1,0]:[0,1];const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);for(const end of [a,b])for(let i=0;i<3;i++){const x=end[0]+n[0]*.14+dx/length*(i-1)*.045,z=end[1]+n[1]*.14+dz/length*(i-1)*.045;cyl(furniture,x,1.36,z,.035,2.52,M.linen);}segment(furniture,[a[0]+n[0]*.17,a[1]+n[1]*.17],[b[0]+n[0]*.17,b[1]+n[1]*.17],2.65,.025,.025,M.metal);}
// Architectural stair and lift core remain inspectable in dollhouse view.
const [sx,sz]=world([807,477]);for(let i=0;i<10;i++){box(details,sx,.075+i*.14,sz-i*.19,1.0,.15,.21,M.concrete);box(details,sx+1.25,1.5+i*.14,sz-1.75+i*.19,1,.15,.21,M.concrete);}const [lx,lz]=world([970,444]);box(details,lx,1.15,lz-.04,.83,2.3,.1,M.metal);box(details,lx,1.15,lz-.1,.017,2.27,.02,M.frame);
// Simple pendants and ceiling discs, visible only at eye level.
for(const r of rooms.filter(r=>['living','room','kitchen','foyer'].includes(r.kind))){let [x,z]=r.look;if(!inside(x,z,r.polygonWorldXZ)){x=(r.bounds.minX+r.bounds.maxX)/2;z=(r.bounds.minZ+r.bounds.maxZ)/2;}cyl(ceilings,x,H-.015,z,.2,.04,M.warm);}
for(const room of rooms.filter(r=>r.kind==='living')){
 const x=(room.bounds.minX+room.bounds.maxX)/2,z=(room.bounds.minZ+room.bounds.maxZ)/2;
 const light=new THREE.RectAreaLight('#ffe9cd',4.5,2.5,3.5);light.position.set(x,2.76,z);light.rotation.x=-Math.PI/2;ceilings.add(light);
}
for(const g of [floors,walls,furniture,details,ceilings,doors,identity])batch(g);
return {root,floors,walls,furniture,details,ceilings,doors,identity,props,collisions,furnitureBounds,footprints:Object.fromEntries(Object.entries(PLAN.footprintPolygonsPx).map(([k,v])=>[k,v.map(world)])),setMode(walk){walls.scale.y=walk?1:.35;details.scale.y=walk?1:.65;ceilings.visible=walk;doors.scale.y=walk?1:.35;identity.visible=!walk;}};
}
