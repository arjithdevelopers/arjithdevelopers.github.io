import * as THREE from 'three';
import { GLTFLoader } from './vendor/addons/loaders/GLTFLoader.js';
import { M } from './model.js';

export async function loadInteriorAssets(renderer) {
  const manager = new THREE.LoadingManager();
  const textureLoader = new THREE.TextureLoader(manager);
  const modelLoader = new GLTFLoader(manager);
  const anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  async function surface(slug, repeat = 1) {
    const maps = await Promise.all(['diff','nor_gl','rough'].map(type => textureLoader.loadAsync(`./assets/materials/${slug}/${slug}_${type}_2k.jpg`)));
    maps.forEach((texture,i) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeat,repeat);
      texture.anisotropy = anisotropy;
      if (i === 0) texture.colorSpace = THREE.SRGBColorSpace;
    });
    return {map:maps[0],normalMap:maps[1],roughnessMap:maps[2]};
  }
  const [oak,stone,fabric,dining] = await Promise.all([
    surface('oak_veneer_01'), surface('marble_01'), surface('terlenka',4),
    modelLoader.loadAsync('./assets/props/dining_chair_02/dining_chair_02_2k.gltf'),
  ]);
  for (const material of [M.oak,M.wood]) {
    Object.assign(material,oak); material.color.set(material===M.oak?'#e6d5bf':'#9b7658');
    material.normalScale.set(.25,.25); material.roughness=.8; material.needsUpdate=true;
  }
  for (const material of [M.linen,M.cream,M.blue,M.rug,M.terracotta]) {
    Object.assign(material,fabric);material.normalScale.set(.4,.4);material.roughness=.94;material.needsUpdate=true;
  }
  const floor = new THREE.MeshStandardMaterial({...stone,color:'#fffaf2',roughness:.42,normalScale:new THREE.Vector2(.25,.25)});
  floor.userData.metres=1.5;
  const woodFloor = new THREE.MeshStandardMaterial({...oak,color:'#d4b28d',roughness:.65,normalScale:new THREE.Vector2(.2,.2)});
  woodFloor.userData.metres=1.83;
  const quartzCanvas=document.createElement('canvas');quartzCanvas.width=quartzCanvas.height=2048;const quartzContext=quartzCanvas.getContext('2d');quartzContext.fillStyle='#e6e4dd';quartzContext.fillRect(0,0,2048,2048);let seed=1847;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;for(let i=0;i<55000;i++){quartzContext.fillStyle=i%3?'rgba(139,130,112,.16)':'rgba(255,255,255,.6)';quartzContext.fillRect(rand()*2048,rand()*2048,rand()*2+1,rand()*2+1);}const quartz=new THREE.CanvasTexture(quartzCanvas);quartz.colorSpace=THREE.SRGBColorSpace;quartz.wrapS=quartz.wrapT=THREE.RepeatWrapping;quartz.anisotropy=anisotropy;
  const counter = new THREE.MeshPhysicalMaterial({map:quartz,color:'#ffffff',roughness:.23,clearcoat:.28,clearcoatRoughness:.2});
  const door = new THREE.MeshStandardMaterial({...oak,color:'#aa7950',roughness:.48,normalScale:new THREE.Vector2(.22,.22)});
  const fabricAccent=color=>new THREE.MeshStandardMaterial({...fabric,color,roughness:.92,normalScale:new THREE.Vector2(.36,.36)});
  for (const model of [dining.scene]) model.traverse(mesh=>{
    if(!mesh.isMesh)return;
    mesh.castShadow=mesh.receiveShadow=true;
    for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
      for(const property of ['map','normalMap','roughnessMap','metalnessMap','aoMap'])if(material[property])material[property].anisotropy=anisotropy;
    }
  });
  return {floor,woodFloor,counter,door,fabricAccent,diningChair:dining.scene};
}
