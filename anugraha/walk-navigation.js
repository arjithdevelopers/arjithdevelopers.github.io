import * as THREE from 'three';

// Routes use the same physical clearances as manual walking.
export function createWalkNavigation({scene,interior,camera,canvas,canStand,onStatus}) {
  const walkable=(x,z)=>canStand(x,z,.24);
  const step=.12,minX=-15.2,minZ=-6.7,nx=256,nz=118,count=nx*nz;
  let grid=null,path=[],destination=null,lastResult=null,travelled=0,frames=0,started=0;
  const marker=new THREE.Mesh(new THREE.RingGeometry(.1,.15,40),new THREE.MeshBasicMaterial({color:'#357b7b',side:THREE.DoubleSide,transparent:true,opacity:.8,depthWrite:false}));
  marker.rotation.x=-Math.PI/2;marker.visible=false;scene.add(marker);
  const route=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:'#357b7b',transparent:true,opacity:.5,depthWrite:false}));route.visible=false;scene.add(route);
  const point=k=>[minX+(k%nx)*step,minZ+Math.floor(k/nx)*step];
  const index=(x,z)=>Math.round((z-minZ)/step)*nx+Math.round((x-minX)/step);
  const clearLine=(a,b)=>{const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.02);for(let i=1;i<=n;i++)if(!walkable(a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n))return false;return true;};
  function nearest(p){let best=-1,distance=.38;const cx=Math.round((p[0]-minX)/step),cz=Math.round((p[1]-minZ)/step);for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const x=cx+dx,z=cz+dz,k=z*nx+x;if(x<0||x>=nx||z<0||z>=nz||!grid[k])continue;const q=point(k),d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d<distance&&clearLine(p,q)){distance=d;best=k;}}return best;}
  function findPath(from,to){
    if(!walkable(...to))return null;
    if(clearLine(from,to))return [to];
    if(!grid){grid=new Uint8Array(count);for(let k=0;k<count;k++)grid[k]=walkable(...point(k));}
    const start=nearest(from),goal=nearest(to);if(start<0||goal<0)return null;
    const parent=new Int32Array(count);parent.fill(-1);parent[start]=start;const queue=new Int32Array(count);queue[0]=start;let head=0,tail=1;
    while(head<tail&&parent[goal]<0){const current=queue[head++],cx=current%nx,cz=Math.floor(current/nx);for(const [dx,dz] of [[0,-1],[1,0],[0,1],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=cx+dx,z=cz+dz,k=z*nx+x;if(x<0||x>=nx||z<0||z>=nz||!grid[k]||parent[k]>=0)continue;if(dx&&dz&&(!grid[current+dx]||!grid[current+dz*nx]))continue;parent[k]=current;queue[tail++]=k;}}
    if(parent[goal]<0)return null;
    const points=[to];for(let k=goal;k!==start;k=parent[k])points.push(point(k));points.push(point(start));points.push(from);points.reverse();
    const smooth=[];for(let i=0;i<points.length-1;){let next=i+1;for(let j=i+2;j<points.length;j++){if(clearLine(points[i],points[j]))next=j;else break;}smooth.push(points[next]);i=next;}return smooth;
  }
  function cancel(reason='cancelled'){if(destination)lastResult={reason,destination:[...destination],position:[camera.position.x,camera.position.z],distanceRemaining:Math.hypot(camera.position.x-destination[0],camera.position.z-destination[1]),travelled,frames,elapsedMs:Math.round(performance.now()-started)};path=[];destination=null;marker.visible=route.visible=false;onStatus(false);}
  function begin(target){const from=[camera.position.x,camera.position.z],next=findPath(from,target);if(!next)return false;cancel();path=next;destination=[...target];travelled=0;frames=0;started=performance.now();marker.position.set(target[0],.047,target[1]);marker.visible=true;route.geometry.dispose();route.geometry=new THREE.BufferGeometry().setFromPoints([from,...path].map(([x,z])=>new THREE.Vector3(x,.043,z)));route.visible=true;onStatus(true);return true;}
  function click(clientX,clientY){
    const r=canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),camera);
    const hit=ray.intersectObjects([interior.floors,interior.walls,interior.furniture,interior.doors,interior.props,interior.details],true).find(h=>h.object.visible);
    if(!hit||hit.point.y>.075)return false;
    return begin([hit.point.x,hit.point.z]);
  }
  return {click,cancel,findPath,begin,get lastResult(){return lastResult;},get active(){return path.length>0;},get destination(){return destination;},update(dt){if(!path.length)return null;const [x,z]=path[0],dx=x-camera.position.x,dz=z-camera.position.z,distance=Math.hypot(dx,dz),amount=Math.min(distance,dt*1.9);if(distance<.018){path.shift();if(!path.length)cancel('arrived');return null;}const px=camera.position.x+dx/distance*amount,pz=camera.position.z+dz/distance*amount;if(!canStand(px,pz)){cancel('blocked');return null;}camera.position.set(px,1.62,pz);travelled+=amount;frames++;return {dx,dz};}};
}
