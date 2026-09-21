import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
const boxGeo = new THREE.BoxGeometry(1,1,1);
const cylGeo = new THREE.CylinderGeometry(1,1,1,32);
const ballGeo = new THREE.SphereGeometry(1,24,16);
const roundedGeometries = new Map();
export const materials={};
export function mat(name,color,roughness=.75,extra={}) {return materials[name]??=new THREE.MeshStandardMaterial({color,roughness,...extra});}
export const M={
 plaster:mat('plaster','#e8e6df'),white:mat('white','#f2f1ec'),stone:mat('stone','#cfc2a8'),dark:mat('dark','#3a4549'),frame:mat('frame','#353d3e',.3,{metalness:.45}),wood:mat('wood','#956544'),oak:mat('oak','#ba9370'),glass:mat('glass','#a9c4cb',.13,{metalness:.35,transparent:true,opacity:.48}),window:mat('window','#688894',.16,{metalness:.5}),leaf:mat('leaf','#547152'),leaf2:mat('leaf2','#77936b'),grass:mat('grass','#7e9272'),soil:mat('soil','#605144'),metal:mat('metal','#a19b88',.25,{metalness:.65}),road:mat('road','#798185'),concrete:mat('concrete','#c4c7c2'),cream:mat('cream','#e5dece'),linen:mat('linen','#d8cdbc'),blue:mat('blue','#526d74'),warm:mat('warm','#e9cb85',.6,{emissive:'#f6c984',emissiveIntensity:.3}),black:mat('black','#242c30'),bath:mat('bath','#a8b8b5'),ceramic:mat('ceramic','#f3f1e8',.18),rug:mat('rug','#b6a58d'),terracotta:mat('terracotta','#a47559')
};
export function box(g,x,y,z,w,h,d,m=M.white,round=false){let geometry=boxGeo;if(round){const key=[w,h,d].join(',');geometry=roundedGeometries.get(key);if(!geometry){geometry=new RoundedBoxGeometry(w,h,d,4,Math.min(.12,Math.min(w,h,d)*.3));roundedGeometries.set(key,geometry);}}const a=new THREE.Mesh(geometry,m);a.position.set(x,y,z);if(!round)a.scale.set(w,h,d);a.castShadow=true;a.receiveShadow=true;g.add(a);return a;}
export function cyl(g,x,y,z,r,h,m=M.metal){const a=new THREE.Mesh(cylGeo,m);a.position.set(x,y,z);a.scale.set(r,h,r);a.castShadow=true;a.receiveShadow=true;g.add(a);return a;}
export function sphere(g,x,y,z,sx,sy,sz,m){const a=new THREE.Mesh(ballGeo,m);a.position.set(x,y,z);a.scale.set(sx,sy,sz);a.castShadow=true;g.add(a);return a;}
export function group(g,x=0,y=0,z=0,rot=0){const q=new THREE.Group();q.position.set(x,y,z);q.rotation.y=rot;g.add(q);return q;}
export function plant(g,x,z,size=1,y=0,pot=true){if(pot){const p=cyl(g,x,y+.23*size,z,.23*size,.46*size,M.terracotta);p.scale.x*=.85;p.scale.z*=.85;}cyl(g,x,y+.65*size,z,.035*size,1.1*size,M.wood);for(let j=0;j<9;j++){let a=j*2.4;const l=sphere(g,x+Math.sin(a)*.22*size,y+(.65+j*.058)*size,z+Math.cos(a)*.22*size,.11*size,.3*size,.018*size,j%2?M.leaf:M.leaf2);l.rotation.set(Math.cos(a)*.7,a,Math.sin(a)*.7);}}
export function palm(g,x,z,h=5){
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.09,.15,h,10),M.wood);trunk.position.set(x,h/2,z);trunk.castShadow=true;g.add(trunk);
 const leafMaterial=mat('palmFrond','#53794a',.8,{side:THREE.DoubleSide});
 for(let j=0;j<11;j++){
  const angle=j*Math.PI*2/11,dx=Math.cos(angle),dz=Math.sin(angle),length=2.15+(j%3)*.15;
  const center=t=>new THREE.Vector3(x+dx*length*t,h+.68*Math.sin(Math.PI*t)-.65*t*t,z+dz*length*t);
  const path=new THREE.CatmullRomCurve3([center(0),center(.35),center(.7),center(1)]);const stem=new THREE.Mesh(new THREE.TubeGeometry(path,10,.018,4,false),M.leaf);g.add(stem);
  const vertices=[];for(let i=1;i<17;i++){const t=i/18,c=center(t),next=center(t+.022),width=.43*Math.sin(t*Math.PI)*(.95-t*.35);for(const side of [-1,1]){const tip=c.clone().add(new THREE.Vector3(-dz*side*width+dx*.22,-.16,dx*side*width+dz*.22));vertices.push(c.x,c.y,c.z,next.x,next.y,next.z,tip.x,tip.y,tip.z);}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();const leaf=new THREE.Mesh(geo,leafMaterial);leaf.castShadow=true;g.add(leaf);
 }
}
export function labelTexture(text,bg='#d0c2a8',fg='#253d46',size=512){const c=document.createElement('canvas');c.width=size;c.height=size/2;const p=c.getContext('2d');p.fillStyle=bg;p.fillRect(0,0,c.width,c.height);p.textAlign='center';p.fillStyle=fg;p.font=`${size*.065}px Georgia`;p.fillText('A R J I T H',size/2,size*.17);p.font=`${size*.11}px Georgia`;p.fillText(text,size/2,size*.32);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:t,roughness:.9});}
export function batch(g){g.updateMatrixWorld(true);const inv=g.matrixWorld.clone().invert(), buckets=new Map(), old=[];g.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)&&o.geometry){const key=o.material.uuid+Boolean(o.geometry.index)+Object.keys(o.geometry.attributes).filter(k=>k!=='uv1').sort().join(',');let b=buckets.get(key);if(!b){b={mat:o.material,geos:[]};buckets.set(key,b);}const geo=o.geometry.clone();geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));geo.deleteAttribute('uv1');b.geos.push(geo);old.push(o);}});for(const o of old)o.removeFromParent();for(const b of buckets.values()){const geo=mergeGeometries(b.geos,false);if(geo){const mesh=new THREE.Mesh(geo,b.mat);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);}for(const a of b.geos)a.dispose();}}
function facadeWindow(g,x,y,z,w=2.8,h=2.35){box(g,x,y,z,w+.15,h+.14,.16,M.frame);box(g,x,y,z-.1,w,h,.025,M.window);for(const dx of [-w/2,w/2,0])box(g,x+dx,y,z-.13,.045,h,.04,M.frame);box(g,x,y-.3,z-.14,w,.04,.05,M.frame);box(g,x,y-h/2-.11,z-.2,w+.3,.13,.45,M.white);box(g,x,y,z+.02,w-.2,h-.15,.02,M.linen);}
export function createExterior(){const g=new THREE.Group();g.name='Anugraha exterior';
box(g,0,-.3,0,36,.5,21,M.concrete);box(g,0,-.43,-16,220,.2,10,M.road);box(g,0,-.28,-10.25,220,.15,1.5,M.plaster);for(let x=-100;x<100;x+=7)box(g,x,-.315,-17,3,.02,.1,M.white);
box(g,0,1.4,.1,29.7,2.8,12.6,M.dark);
for(let f=0;f<5;f++){const y=3.1+f*3.1;box(g,0,y+.1,0,30,.24,12.8,M.white);box(g,0,y+1.6,.3,29.5,2.95,12.1,M.plaster);box(g,0,y+3,0,30,.17,12.75,M.white);
for(const x of [-12.3,-3.8,4.1,12.1])facadeWindow(g,x,y+1.6,-6.15,x===12.1?3.6:2.8);
for(const x of [-8.0,8.2]){box(g,x,y+1.5,-6.55,3.1,2.8,1.05,M.dark);box(g,x,y+.05,-6.8,3.65,.18,2.25,M.white);box(g,x,y+1.45,-6.1,2.7,2.5,.1,M.window);for(const dx of [-.9,0,.9])box(g,x+dx,y+1.45,-6.2,.055,2.5,.04,M.frame);box(g,x,y+.43,-7.88,3.5,.65,.14,M.wood);box(g,x,y+.98,-7.88,3.4,.5,.045,M.glass);box(g,x,y+1.23,-7.88,3.55,.04,.05,M.frame);for(const dx of [-1.72,1.72]){box(g,x+dx,y+.98,-7.15,.035,.5,1.4,M.glass);box(g,x+dx,y+1.23,-7.15,.05,.035,1.5,M.frame);}plant(g,x+1.15,-7.3,.68,y+.16);}
for(const side of [-1,1]){for(const z of [-3.8,.1,3.8]){const q=group(g,side*14.85,y+1.6,z,side===1?-Math.PI/2:Math.PI/2);facadeWindow(q,0,0,0,2.1,2.25);}}
for(let x=-12;x<=12;x+=4) {const q=group(g,x,y+1.6,6.36,Math.PI);facadeWindow(q,0,0,0,2.35,2.25);}}
// Distinctive stone spine and tall charcoal portals from the brochure illustration.
box(g,0,11.7,-6.52,3.8,17.4,.7,M.stone);for(let y=3.4;y<20.3;y+=1)box(g,0,y,-6.885,3.7,.018,.012,M.oak);for(let y=3.9;y<20;y+=2)box(g,y%4>2?.45:-.65,y,-6.89,.02,.95,.015,M.oak);
for(const x of [-8,8.2]){for(const dx of [-2,2])box(g,x+dx,11.5,-6.9,.4,17.2,2.6,M.dark);box(g,x,20,-6.9,4.4,.45,2.6,M.dark);}
for(const x of [-5.5,5.6]){box(g,x,10.6,-6.75,.95,15.6,.25,M.dark);for(let y=3.2;y<18.2;y+=.35){box(g,x,y,-6.9,.8,.045,.06,M.metal);for(const dx of [-.28,0,.28])box(g,x+dx,y+.12,-6.92,.033,.24,.035,M.metal);}}
box(g,0,18.6,.3,29.7,.22,12.8,M.concrete);box(g,0,19.1,6.4,29.7,.9,.18,M.white);for(const x of [-14.8,14.8])box(g,x,19.1,0,.18,.9,12.7,M.white);
for(let x=-13.5;x<14;x+=1.1){if(Math.abs(x)<2.5||Math.abs(Math.abs(x)-8)<2.2)continue;box(g,x,18.9,-5.3,1,.45,.6,M.stone);plant(g,x,-5.3,.75,18.95,false);}
// Ground entrance, front garden and gates.
for(let x=-13;x<=13;x+=4){box(g,x,1.4,-6.6,.45,2.8,.65,M.white);box(g,x,1.25,-6.1,2.7,2.25,.1,M.window);}
box(g,0,1.25,-8.2,4,2.5,.35,M.stone);box(g,0,1.65,-8.39,3,1.5,.025,labelTexture('Anugraha'));for(let x=-16.5;x<17;x+=1){if(Math.abs(x)<2.5||Math.abs(x+10)<2.6||Math.abs(x-10)<2.6)continue;box(g,x,.45,-8.65,1,.75,1.2,M.stone);sphere(g,x,.9,-8.65,.7,.35,.6,M.leaf);}
for(const x of [-10,10]){for(const dx of [-2.6,2.6])box(g,x+dx,1.65,-8.2,.35,3.3,.45,M.dark);box(g,x,3.15,-8.2,5.5,.35,.45,M.dark);for(let a=-2.4;a<=2.4;a+=.18)box(g,x+a,1.05,-8.2,.11,2.1,.09,M.wood);}
for(const side of [-1,1]){box(g,side*17,.7,0,.22,1.5,17,M.stone);for(let z=-6;z<9;z+=3){palm(g,side*16,z,4.5+(z+6)*.12);sphere(g,side*16,.6,z,1,.7,.8,M.leaf);}}
for(const x of [-4.5,4.5])palm(g,x,-8.4,4.8);
// Quiet background massing keeps the property legible without inventing neighboring buildings.
box(g,0,-.65,0,240,.4,240,mat('ground','#b5c1b8'));
batch(g);return g;
}
