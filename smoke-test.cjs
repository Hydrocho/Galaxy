'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {generateGalaxy,armField,dustTransmission,surfaceAt}=require('./galaxy-model.js');
const data=generateGalaxy();assert.equal(data.positions.length,data.colors.length);assert.equal(data.positions.length/3,74100);assert.ok(data.positions.every(Number.isFinite));assert.ok(data.colors.every(v=>v>=0&&v<=1));
function variance(group,axis){const g=data.groups[group];let sum=0;for(let i=g.start;i<g.start+g.count;i++)sum+=data.positions[i*3+axis]**2;return sum/g.count;}
assert.ok(variance('bar',0)>variance('bar',2)*12,'bar elongated');assert.ok(variance('disk',0)>variance('disk',1)*100,'disk thin');assert.ok(variance('bulge',1)>variance('disk',1)*3,'bulge thicker');
assert.ok(Math.abs(Math.hypot(data.sun.x,data.sun.z)/85-.52)<.001);assert.ok(data.sun.y<1);
assert.deepEqual(generateGalaxy().positions,data.positions);
const html=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('app.js','utf8');for(const [,path] of html.matchAll(/(?:src|href)="([^"]+)"/g)){assert.ok(!/^https?:/.test(path));assert.ok(fs.existsSync(path));}assert.ok(!/블랙홀|퀴즈|항법|guided.js/.test(html+app));
const THREE=require('./vendor/three.min.js'),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(data.positions,3));geometry.computeBoundingSphere();assert.ok(geometry.boundingSphere.radius<110);geometry.dispose();
let minLight=255,maxLight=0,minDust=1,maxDust=0,wideArms=0;
for(let j=0;j<360;j++){const a=j*Math.PI/180,x=50*Math.cos(a),z=50*Math.sin(a),c=surfaceAt(x,z),d=dustTransmission(x,z);assert.ok(c.every(v=>Number.isFinite(v)&&v>=0&&v<=255));minLight=Math.min(minLight,c[3]);maxLight=Math.max(maxLight,c[3]);minDust=Math.min(minDust,d);maxDust=Math.max(maxDust,d);if(armField(x,z)>.18)wideArms++;}
assert.ok(minLight>20,'continuous interarm starlight');assert.ok(maxLight/minLight<6,'moderate arm contrast');assert.ok(wideArms>70,'arms are broad areas rather than lines');assert.ok(minDust>.4&&minDust<.95&&maxDust>.99,'patchy nonblack dust');assert.equal(surfaceAt(100,100)[3],0);
console.log('PASS: 74,100 stars; diffuse elongated bar; thin disk/thick bulge; continuous interarm light; broad arms; moderate contrast; patchy dust; finite coordinates; offline assets.');
