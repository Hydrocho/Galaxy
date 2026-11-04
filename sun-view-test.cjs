const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),THREE=require('./vendor/three.min.js');
const source=fs.readFileSync('app.js','utf8'),elements=new Map();
const sandbox={THREE,eyeYaw:0,eyePitch:0,eyeMode:true,transition:null,sun:new THREE.Vector3(33,.35,29),camera:new THREE.PerspectiveCamera(75,1,.1,1800),$:key=>{if(!elements.has(key))elements.set(key,{});return elements.get(key);}};
vm.createContext(sandbox);vm.runInContext(source.slice(source.indexOf(' function updateEye(){'),source.indexOf(' function installEyeControls(){')),sandbox);
const zoomStart=source.indexOf(' function zoom(factor){');vm.runInContext(source.slice(zoomStart,source.indexOf(' function updateEye(){')),sandbox);
for(const yaw of [-Math.PI,-1,0,1,Math.PI,50])for(const pitch of [-5,-1,0,1,5]){sandbox.eyeYaw=yaw;sandbox.eyePitch=pitch;vm.runInContext('updateEye()',sandbox);assert.ok(sandbox.camera.position.equals(sandbox.sun),'observer must stay at Sun');assert.ok(sandbox.camera.quaternion.toArray().every(Number.isFinite));assert.ok(Math.abs(sandbox.eyePitch)<Math.PI/2);}
sandbox.eyeYaw=0;sandbox.eyePitch=0;vm.runInContext('updateEye()',sandbox);const direction=new THREE.Vector3();sandbox.camera.getWorldDirection(direction);assert.ok(direction.distanceTo(new THREE.Vector3(-33,0,-29).normalize())<1e-8,'zero yaw faces galactic center in disc plane');
vm.runInContext('zoom(.0001)',sandbox);assert.equal(sandbox.camera.fov,30);assert.ok(sandbox.camera.position.equals(sandbox.sun));vm.runInContext('zoom(1000)',sandbox);assert.equal(sandbox.camera.fov,100);assert.ok(sandbox.camera.position.equals(sandbox.sun));
console.log('PASS: fixed Sun origin across 30 yaw/pitch combinations, finite orientation, pitch limits, center direction, zoom FOV limits without translation.');
