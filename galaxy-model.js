/* Illustrative density-field galaxy, informed by ESA/Gaia's 2025 reconstruction.
   This is not a fit to Gaia data or a map of measured arm positions. */
(function(root){
 'use strict';
 function angleAt(r){return 2.8*Math.log(Math.max(18,r)/18);}
 function angleDistance(a,b){return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));}
 function hash(x,y){const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);}
 function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y);let u=x-ix,v=y-iy;u=u*u*(3-2*u);v=v*v*(3-2*v);return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;}
 function smooth(a,b,x){const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
 function armField(x,z){
  const r=Math.hypot(x,z),a=Math.atan2(z,x),phase=angleAt(r);let density=0;
  for(let k=0;k<4;k++){
   const wobble=.11*Math.sin(r*.095+k*1.9)+.06*Math.sin(r*.24-k);
   const center=phase+k*Math.PI/2+wobble;
   const width=.19+.08*(.5+.5*Math.sin(r*.12+k*2));
   const gap=.53+.47*noise(r*.10+k*17,k*3.1);
   const d=angleDistance(a,center);
   density+=Math.exp(-Math.pow(d/width,2))*(k%2?.68:1)*gap;
  }
  return density*smooth(14,33,r)*(1-smooth(70,98,r));
 }
 function dustTransmission(x,z){
  const r=Math.hypot(x,z);if(r<15||r>96)return 1;
  const patches=smooth(.42,.76,noise(x*.15+9,z*.15-7));
  const filaments=.35+.65*noise(x*.65,z*.65);
  const cloud=armField(x*.98-z*.07,z*.98+x*.07);
  return 1-.6*Math.min(1,cloud*1.5)*patches*filaments;
 }
 function surfaceAt(x,z){
  const r=Math.hypot(x,z);if(r>=100)return [0,0,0,0];
  const edge=1-smooth(65,100,r);
  const coarse=noise(x*.065,z*.065),medium=noise(x*.23,z*.23),fine=noise(x*.9,z*.9);
  const mottling=.50+.22*coarse+.18*medium+.10*fine;
  // Continuous stellar disc first; broad spiral overdensities second.
  const disc=.29*Math.exp(-r*r/7200)*edge*mottling;
  const arms=armField(x,z)*(.15+.18*medium+.08*fine);
  const bar=.45*Math.exp(-x*x/440-z*z/30);
  const bulge=.16*Math.exp(-x*x/125-z*z/85);
  const inner=.16*Math.exp(-r*r/1000);
  const warm=bar+bulge+inner,light=(disc+arms)*dustTransmission(x,z),sum=warm+light;
  const warmth=warm/Math.max(.001,sum);
  return [(0.76+.24*warmth)*255,(0.79+.07*warmth)*255,(.85-.24*warmth)*255,Math.min(230,sum*330)];
 }
 function generateGalaxy(seed=81){
  function random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
  function normal(){return Math.max(-3,Math.min(3,Math.sqrt(-2*Math.log(Math.max(1e-9,random())))*Math.cos(2*Math.PI*random())));}
  const positions=[],colors=[],groups={};
  function add(x,y,z,color){positions.push(x,y,z);const b=(.45+random()*.55)*dustTransmission(x,z);colors.push(...color.map(c=>c*b));}
  function group(name,fn){const start=positions.length/3;fn();groups[name]={start,count:positions.length/3-start};}
  // Gaussian populations avoid pointed, hard-edged bar ends and a detached core.
  group('bar',()=>{for(let i=0;i<6500;i++)add(normal()*11.5,normal()*1.6,normal()*2.8,[.65,.53,.39]);});
  group('bulge',()=>{for(let i=0;i<5000;i++)add(normal()*5.7,normal()*3.2,normal()*4.8,[.57,.49,.39]);});
  function sampleDisc(){const r=Math.sqrt(random())*96,a=random()*2*Math.PI;return [r*Math.cos(a),r*Math.sin(a),r];}
  group('disk',()=>{for(let i=0;i<35000;){const [x,z,r]=sampleDisc();if(random()>Math.exp(-r*r/6500)*(1-smooth(68,96,r)))continue;add(x,normal()*1.15,z,[.43,.44,.48]);i++;}});
  // Rejection sampling fills broad irregular regions, rather than tracing curves.
  group('arms',()=>{for(let i=0;i<25000;){const [x,z,r]=sampleDisc();if(random()>armField(x,z)/1.5)continue;add(x,normal()*(.7+r*.006),z,[.44,.54,.69]);i++;}});
  group('regions',()=>{for(let c=0;c<130;){const [x,z]=sampleDisc();if(random()>armField(x,z)*.7)continue;for(let n=0;n<20;n++)add(x+normal()*.7,normal()*.5,z+normal()*.7,[.83,.36,.45]);c++;}});
  return {positions:new Float32Array(positions),colors:new Float32Array(colors),groups,sun:{x:44.2*Math.cos(.72),y:.35,z:44.2*Math.sin(.72)}};
 }
 const api={generateGalaxy,angleAt,armField,dustTransmission,surfaceAt};if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root,api);
})(typeof globalThis!=='undefined'?globalThis:this);
