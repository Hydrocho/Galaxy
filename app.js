'use strict';
(function(){
 const $=s=>document.querySelector(s);
 let scene,camera,renderer,controls,marker,sun,transition=null,texture,previousTime=0,eyeMode=false,eyeYaw=0,eyePitch=0,starlightDisk;
 const eyePointers=new Map();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const descriptions={overall:'길쭉한 중심 막대와 그 양끝에서 이어지는 나선팔, 납작한 원반을 관찰해 보세요.',top:'중심의 길쭉한 막대와, 별빛 원반 안에서 넓게 퍼지고 갈라지는 나선 구조를 살펴보세요.',side:'옆에서는 얇은 원반과 볼록하게 부푼 중심부가 보입니다.','sun-eye':'태양을 원점으로 시선만 회전합니다. 은하 중심·반대쪽·원반 위쪽을 비교하세요. 실제 지구 밤하늘이 아닌 은하 구조 학습 모형입니다.',sun:'태양계는 은하 중심에서 약 2만 6천 광년 떨어진 원반 안에 있습니다. 노란 표식은 위치를 강조한 것입니다.'};
 const names={overall:'전체 모습',top:'위에서 본 막대와 나선팔',side:'옆에서 본 원반과 중심부',sun:'태양계 위치','sun-eye':'태양 원점 · 내부 관찰'};
 function sprite(){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#fff');g.addColorStop(.15,'rgba(255,255,255,.9)');g.addColorStop(.45,'rgba(255,255,255,.22)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
 function points(positions,colors,size,opacity){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));return new THREE.Points(geo,new THREE.PointsMaterial({size,map:texture,vertexColors:true,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false}));}
 function createStarlightDisk(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=768;
  const ctx=canvas.getContext('2d'),image=ctx.createImageData(768,768);
  for(let y=0;y<768;y++)for(let x=0;x<768;x++){
   const color=surfaceAt((x/767-.5)*200,(y/767-.5)*200),offset=(y*768+x)*4;
   for(let c=0;c<4;c++)image.data[offset+c]=color[c];
  }
  ctx.putImageData(image,0,0);const map=new THREE.CanvasTexture(canvas);
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshBasicMaterial({map,transparent:true,side:THREE.DoubleSide,depthWrite:false,opacity:.95}));
  mesh.rotation.x=-Math.PI/2;mesh.position.y=-.05;mesh.renderOrder=0;scene.add(mesh);starlightDisk=mesh;
 }
 function init(){try{
  if(!window.THREE||!THREE.OrbitControls)throw Error('Missing local libraries');
  scene=new THREE.Scene();scene.background=new THREE.Color('#03050c');
  camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,1800);
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'default'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);$('#universe').appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','은하 3D 모형. 드래그로 회전하고 두 손가락 또는 휠로 확대하세요.');
  controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.enablePan=false;controls.minDistance=35;controls.maxDistance=650;controls.autoRotate=false;controls.autoRotateSpeed=.35;controls.addEventListener('start',()=>{transition=null;setRotation(false);clearActive();$('#view-tag').textContent='직접 관찰 중';});
  texture=sprite();createStarlightDisk();const data=generateGalaxy();const stars=points(data.positions,data.colors,.62,.72);stars.renderOrder=1;scene.add(stars);sun=new THREE.Vector3(data.sun.x,data.sun.y,data.sun.z);
  const bgPositions=[],bgColors=[];for(let i=0;i<1000;i++){const a=Math.random()*Math.PI*2,v=Math.random()*2-1,r=450+Math.random()*300;bgPositions.push(Math.cos(a)*Math.sqrt(1-v*v)*r,v*r,Math.sin(a)*Math.sqrt(1-v*v)*r);bgColors.push(.45,.53,.7);}scene.add(points(new Float32Array(bgPositions),new Float32Array(bgColors),1.2,.55));
  marker=new THREE.Group();marker.position.copy(sun);const dot=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:0xffdb6c,transparent:true,depthTest:false}));dot.scale.set(4,4,4);dot.renderOrder=3;marker.add(dot);const ring=new THREE.Mesh(new THREE.RingGeometry(1.35,1.57,48),new THREE.MeshBasicMaterial({color:0xffd66a,side:THREE.DoubleSide,transparent:true,opacity:.9,depthTest:false}));ring.renderOrder=3;marker.add(ring);marker.userData.ring=ring;scene.add(marker);
  installEyeControls();document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('#rotate').onclick=()=>{transition=null;setRotation(!controls.autoRotate);};$('#zoom-in').onclick=()=>zoom(.8);$('#zoom-out').onclick=()=>zoom(1.25);
  window.addEventListener('resize',resize);renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#error').hidden=false;$('#error').textContent='3D 연결이 중단되었습니다. 페이지를 새로고침해 주세요.';});setView('overall',true);animate();
 }catch(error){$('#error').hidden=false;document.querySelectorAll('button').forEach(b=>b.disabled=true);console.error(error);}}
 function distance(){return Math.max(245,180/(Math.tan(THREE.MathUtils.degToRad(24))*camera.aspect)*.62);}
 function clearActive(){document.querySelectorAll('[data-view]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});}
 function setRotation(value){controls.autoRotate=value;$('#rotate').textContent=value?'자동 회전 멈춤':'자동 회전 시작';$('#rotate').setAttribute('aria-pressed',String(value));}
 function setView(name,immediate=false){setRotation(false);const wasEye=eyeMode;eyeMode=name==='sun-eye';eyePointers.clear();controls.enabled=!eyeMode;marker.visible=!eyeMode;starlightDisk.visible=!eyeMode;$('#eye-controls').hidden=!eyeMode;camera.fov=eyeMode?75:48;camera.updateProjectionMatrix();if(eyeMode){transition=null;eyeYaw=0;eyePitch=0;updateEye();clearActive();const button=document.querySelector('[data-view="sun-eye"]');button.classList.add('active');button.setAttribute('aria-pressed','true');$('#description').textContent=descriptions[name];$('#view-tag').textContent=names[name];return;}if(wasEye)immediate=true;const d=distance(),target=name==='sun'?sun.clone():new THREE.Vector3(),position=name==='top'?new THREE.Vector3(0,d,.01):name==='side'?new THREE.Vector3(0,4,d):name==='sun'?sun.clone().add(new THREE.Vector3(0,58,76)):new THREE.Vector3(d*.12,d*.82,d*.56);transition={position,target};if(immediate||reduced){camera.position.copy(position);controls.target.copy(target);transition=null;}clearActive();const b=document.querySelector(`[data-view="${name}"]`);b.classList.add('active');b.setAttribute('aria-pressed','true');$('#view-tag').textContent=names[name];$('#description').textContent=descriptions[name];controls.update();}
 function zoom(factor){transition=null;if(eyeMode){camera.fov=THREE.MathUtils.clamp(camera.fov*factor,30,100);camera.updateProjectionMatrix();return;}const delta=camera.position.clone().sub(controls.target);delta.setLength(THREE.MathUtils.clamp(delta.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(delta);controls.update();}

 function updateEye(){
  eyeYaw=Math.atan2(Math.sin(eyeYaw),Math.cos(eyeYaw));eyePitch=THREE.MathUtils.clamp(eyePitch,-Math.PI*.4944,Math.PI*.4944);
  const center=Math.atan2(-sun.z,-sun.x),a=center+eyeYaw,c=Math.cos(eyePitch);
  camera.position.copy(sun);camera.up.set(0,1,0);camera.lookAt(sun.x+c*Math.cos(a),sun.y+Math.sin(eyePitch),sun.z+c*Math.sin(a));
  const yaw=Math.round(THREE.MathUtils.radToDeg(eyeYaw)),pitch=Math.round(THREE.MathUtils.radToDeg(eyePitch));
  $('#yaw').value=yaw;$('#pitch').value=pitch;$('#yaw-value').textContent=yaw+'°';$('#pitch-value').textContent=pitch+'°';
 }
 function installEyeControls(){
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{if(!eyeMode)return;setRotation(false);eyePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!eyeMode||!eyePointers.has(e.pointerId))return;const old=eyePointers.get(e.pointerId);if(eyePointers.size===2){const other=[...eyePointers.entries()].find(([id])=>id!==e.pointerId)[1],before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);if(before>0&&after>0)zoom(before/after);}else{eyeYaw-=(e.clientX-old.x)*.005;eyePitch+=(e.clientY-old.y)*.005;}eyePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});updateEye();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>eyePointers.delete(e.pointerId));
  canvas.addEventListener('wheel',e=>{if(!eyeMode)return;e.preventDefault();zoom(Math.exp(e.deltaY*.001));},{passive:false});
  $('#yaw').oninput=e=>{setRotation(false);eyeYaw=THREE.MathUtils.degToRad(Number(e.target.value));updateEye();};
  $('#pitch').oninput=e=>{setRotation(false);eyePitch=THREE.MathUtils.degToRad(Number(e.target.value));updateEye();};
  for(const [id,yaw,pitch] of [['look-center',0,0],['look-out',Math.PI,0],['look-up',0,Math.PI*89/180]])$('#'+id).onclick=()=>{setRotation(false);eyeYaw=yaw;eyePitch=pitch;updateEye();};
 }
 function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
 function animate(time=0){requestAnimationFrame(animate);if(!renderer)return;const delta=Math.min((time-previousTime)/1000,.05);previousTime=time;if(transition){const amount=1-Math.exp(-delta*6);camera.position.lerp(transition.position,amount);controls.target.lerp(transition.target,amount);if(camera.position.distanceTo(transition.position)<.08&&controls.target.distanceTo(transition.target)<.08){camera.position.copy(transition.position);controls.target.copy(transition.target);transition=null;}}
  if(eyeMode){if(controls.autoRotate)eyeYaw+=delta*.12;updateEye();}else controls.update();marker.userData.ring.quaternion.copy(camera.quaternion);renderer.render(scene,camera);const p=sun.clone().project(camera),label=$('#sun-label');label.hidden=eyeMode||p.z>1||p.z< -1||Math.abs(p.x)>.96||Math.abs(p.y)>.96;if(!label.hidden){label.style.left=Math.min(innerWidth-160,Math.max(8,(p.x*.5+.5)*innerWidth+12))+'px';label.style.top=Math.max(8,(-p.y*.5+.5)*innerHeight-16)+'px';}}
 init();
})();
