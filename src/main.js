// Delta Uno: todo el juego. Se va a separar en módulos por partes (ver README).
import * as THREE from 'three';
import './style.css';
import { stats } from './stats.js';
import { APP_VERSION, FEEDBACK_URL } from './config.js';
import { REPARTO, MISIONES, PROXIMAS } from './historia/campana1.js';
window.THREE = THREE; // las pruebas lo usan para armar matrices

(function(){
'use strict';
const $=s=>document.querySelector(s);
const stage=$('#stage'),game=$('#game'),canvas=$('#view'),hud=$('#hud');

function fatal(msg){const f=$('#fatal');f.querySelector('p').textContent=msg;f.hidden=false;hud.hidden=true;$('#loading').hidden=true;}
function sizeFallback(){game.style.width='100%';game.style.height='100%';}

if(typeof THREE==='undefined'){sizeFallback();fatal('No se pudo cargar el motor 3D. Revisá la conexión y recargá la página.');return;}
const T=THREE,V3=T.Vector3,Q=T.Quaternion;

let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
catch(e){sizeFallback();fatal('Este navegador no pudo abrir los gráficos 3D. Probá con Chrome o Safari actualizados.');return;}
renderer.setClearColor(0x0a1022);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fatal('El teléfono cerró los gráficos 3D. Recargá la página para seguir.');});

/* ---------- Ajustes de vuelo: todo lo que define cómo se siente está acá ---------- */
const TUNE={
  vmax:130,        // velocidad a empuje 100 %
  pitch:1.35,      // cabeceo, rad/s
  roll:3.3,        // rotación con botones o en manual, rad/s
  rudder:.85,      // timón en modo manual, rad/s
  yaw:.4,          // giro directo de la palanca en asistido, rad/s
  bankTurn:.9,     // cuánto dobla la nave por estar inclinada, rad/s a 90°
  maxBank:72*Math.PI/180, // inclinación máxima que pide la palanca en asistido
  level:4.2,       // fuerza con la que busca esa inclinación
  resp:5.5,        // inercia de los giros (más alto = más seco)
  grip:4.5,        // agarre: qué tan rápido la velocidad sigue a la nariz
  engine:1.8       // respuesta del motor
};
const SENS={suave:.72,media:1,rapida:1.3};

/* ---------- Tamaño del planeta ---------- */
const PLANET_R=3650;  // a empuje 100 % y altura baja, una vuelta completa tarda unos 3 minutos
const MAX_H=820;      // la cima más alta posible
const CEIL_WARN=1200; // sobre el nivel del mar: empieza el aviso de falta de presión
const CEIL_PUSH=1300; // empieza a empujar hacia abajo
const CEIL_MAX=1620;  // acá el empuje ya le gana al motor a fondo

/* ---------- Combate: valores para ajustar jugando ---------- */
const CRUISE=.5,THROTTLE_MIN=.2;   // crucero sin costo; por encima calienta el motor
const HEAT_TIME=6,COOL_TIME=8,OVERHEAT_LOCK=3,OVERHEAT_THRUST=.3; // segundos a 100 % hasta recalentar, enfriado, bloqueo y empuje bloqueado
const DODGE_TIME=.42,DODGE_DIST=35,DODGE_COOL=3,DOUBLE_TAP=.3;
const SHIELD_MAX=100,HULL_MAX=100,SHIELD_DELAY=4,SHIELD_REGEN=12,ROCK_DAMAGE=35,COMBO_TIME=6;
const MISSILE_MAX=4,MISSILE_RELOAD=20,LOCK_TIME=1,LOCK_RANGE=900,LOCK_CONE=.92,MISSILE_SPEED=310,MISSILE_TURN=2.8,MISSILE_LIFE=7,MISSILE_DMG=6,SPLASH_R=28,SPLASH_DMG=2;
const REPAIR_TIME=8,REPAIR_AMOUNT=30,REPAIR_COOL=45;
const ENEMY_MAX=20;    // enemigos activos a la vez: en una zona densa entran 6 defensas de tierra, 3 escuadrones y la nodriza
const ZONE_WAKE=1500,ZONE_SLEEP=2300,ZONE_LEASH=650,ZONE_REGROW=120;
const DEG=Math.PI/180;
// Puntería enemiga. Un solo lugar para ajustar, y más adelante uno por dificultad.
const AIM={
  lag:.3,          // s: ven tu rumbo con este retraso, así que maniobrar les hace errar
  errMin:1.6,      // m: desvío de cada tiro aunque estén encima
  errK:.01,        // m por metro de distancia: de lejos se abren más
  gimbal:3*DEG     // el cañón corrige como mucho esto respecto de la trompa: la bala sale derecha
};
// Detección: cada grupo te ve si estás cerca, más lejos si estás adelante de él
const DETECT_FRONT=650,DETECT_SIDE=300,DETECT_LOSE=1300,DETECT_FORGET=3;
// Tipos de zona: cuántos enemigos, qué tan juntos y qué tan rápido se avisan entre ellos
const ZONE_KIND={
  dispersa:{name:'Dispersa',r:1000,groups:4,active:3,turrets:2,launchers:1,mix:['par','intercept','enjambre4','par'],anchor:[.4,.85],patrol:240,form:1.5,link:450,bonus:700},
  normal:{name:'Normal',r:760,groups:5,active:3,turrets:3,launchers:1,mix:['cazas','enjambre','intercept','escolta','cazas'],anchor:[.1,.7],patrol:320,form:1,link:750,bonus:1000},
  densa:{name:'Densa',r:560,groups:6,active:3,turrets:4,launchers:2,mix:['escolta','enjambre','cazas','intercept','enjambre','escolta'],anchor:[0,.4],patrol:190,form:.7,link:1100,bonus:1500}
};
const ZONE_ORDER=['dispersa','normal','densa','dispersa','normal','densa'];

const STORE='delta-uno-ajustes-v3';
// v3: "lateral" cambió de significado, así que de los ajustes viejos se conserva todo menos eso
const settings=Object.assign({mode:'asistido',invert:true,invertX:false,lateral:'dobla',sens:'media',sound:true,flip:false,tgtCam:'camara',diff:'medio',lastMode:'conquista',touchUI:'auto',vibrate:true,stats:true,statsSeen:false},(()=>{
  try{
    const cur=localStorage.getItem(STORE);if(cur)return JSON.parse(cur)||{};
    const old=JSON.parse(localStorage.getItem('delta-uno-ajustes-v2'))||{};delete old.lateral;return old;
  }catch(e){return {};}
})());
function saveSettings(){try{localStorage.setItem(STORE,JSON.stringify(settings));}catch(e){}}
// Datos anónimos de uso: solo si el jugador no los apagó (ver src/stats.js)
stats.allow(()=>settings.stats!==false);
stats.watchErrors();

const reduceMotion=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const smooth01=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const sstep=(a,b,x)=>smooth01((x-a)/(b-a));
const wrapPi=a=>{a=(a+Math.PI)%(2*Math.PI);if(a<0)a+=2*Math.PI;return a-Math.PI;};
const _v=new V3(),_v2=new V3(),_q=new Q(),_m=new T.Matrix4(),_one=new V3(1,1,1),_a=new V3(),_w=new V3(),_d=new V3(),_hit=new V3();

/* ---------- El planeta: la misma función dibuja el suelo y decide los choques. Recibe una dirección desde el centro. ---------- */
const PERM=new Uint8Array(512),VAL=new Float32Array(256);
(function(){
  let s=20261105;
  const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s;};
  const p=[];
  for(let i=0;i<256;i++){p[i]=i;VAL[i]=rnd()/4294967296;}
  for(let i=255;i>0;i--){const j=rnd()%(i+1),t=p[i];p[i]=p[j];p[j]=t;}
  for(let i=0;i<512;i++)PERM[i]=p[i&255];
})();
function vn3(x,y,z){
  const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),fx=x-xi,fy=y-yi,fz=z-zi;
  const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz);
  const X=xi&255,Y=yi&255,Z=zi&255,X1=(X+1)&255,Y1=(Y+1)&255,Z1=(Z+1)&255;
  const a=PERM[X],b=PERM[X1],aa=PERM[a+Y],ab=PERM[a+Y1],ba=PERM[b+Y],bb=PERM[b+Y1];
  const c000=VAL[PERM[aa+Z]],c100=VAL[PERM[ba+Z]],c010=VAL[PERM[ab+Z]],c110=VAL[PERM[bb+Z]];
  const c001=VAL[PERM[aa+Z1]],c101=VAL[PERM[ba+Z1]],c011=VAL[PERM[ab+Z1]],c111=VAL[PERM[bb+Z1]];
  const x00=c000+(c100-c000)*u,x10=c010+(c110-c010)*u,x01=c001+(c101-c001)*u,x11=c011+(c111-c011)*u;
  const y0=x00+(x10-x00)*v,y1=x01+(x11-x01)*v;
  return y0+(y1-y0)*w;
}
const BIOMES=['Mar','Playa','Pradera','Bosque','Desierto','Mesetas','Hielo','Montaña','Volcán'];
const S={r:0,g:0,b:0,water:0,lava:0,strata:0,canopy:0,biome:0}; // resultado de la última muestra completa
// lod: tamaño de la malla que pregunta, para no calcular detalle que no puede mostrar. full: también calcula color y material.
function terrain(x,y,z,lod,full){
  const cont=vn3(x*1.5+11.3,y*1.5+4.1,z*1.5+7.7)*.66+vn3(x*3.4+2.2,y*3.4+9.6,z*3.4+1.3)*.34;
  const land=sstep(.40,.50,cont);
  if(land<=0&&!full)return 0;
  // Clima: más frío hacia los polos, con manchas para que las zonas no sean franjas
  const temp=1-Math.abs(x)*1.05+(vn3(x*2.3+5.1,y*2.3+.7,z*2.3+9.3)-.5)*.6;
  const wet=vn3(x*2.7+31.2,y*2.7+17.4,z*2.7+2.8);
  const ice=1-sstep(.12,.28,temp);
  const mount=sstep(.62,.72,vn3(x*2.6+41.7,y*2.6+23.1,z*2.6+13.9))*land;
  const volc=sstep(.75,.80,vn3(x*3.3+71.3,y*3.3+37.6,z*3.3+59.2))*land*(1-mount)*(1-ice);
  let wDe=sstep(.58,.74,temp)*(1-sstep(.40,.54,wet))*(1-ice);
  let wFo=sstep(.46,.60,wet)*sstep(.24,.40,temp)*(1-ice);
  let wPl=Math.max(0,1-ice-wDe-wFo),wIc=ice;
  const wSum=wDe+wFo+wPl+wIc;wDe/=wSum;wFo/=wSum;wPl/=wSum;wIc/=wSum;

  let h=0,mesa=0,ridge=0;
  if(land>0){
    const hA=vn3(x*9.1+3.3,y*9.1+8.8,z*9.1+1.9),hB=vn3(x*21.3+6.1,y*21.3+2.7,z*21.3+4.4);
    if(wIc>0)h+=wIc*(22+hA*50+hB*14);           // hielo: lomas suaves
    if(wPl>0)h+=wPl*(18+hA*38+hB*10);           // pradera: lo más bajo de la tierra firme
    if(wFo>0){                                  // bosque: colinas más altas, con copas de árboles como relieve
      let f=40+hA*85+hB*22;
      if(lod<=12)f+=vn3(x*230,y*230,z*230)*4.5;
      h+=wFo*f;
    }
    if(wDe>0){                                  // desierto: dunas y mesetas de paredes empinadas
      let d=24+hA*42;
      mesa=sstep(.66,.72,vn3(x*6.5+91.1,y*6.5+11.7,z*6.5+47.3)*.7+vn3(x*16.1+7.9,y*16.1+53.3,z*16.1+29.1)*.3);
      d+=mesa*125;
      if(lod<=48){
        const ph=(x*.62+y*.38+z*.69)*PLANET_R/46+vn3(x*8.7+3.1,y*8.7+29.3,z*8.7+77.7)*9,dn=Math.sin(ph)*.5+.5;
        d+=dn*dn*(1-mesa)*(5+11*hB);
      }
      h+=wDe*d;
    }
    if(mount>0||volc>0){                        // montaña y volcán: crestas, lo más alto del planeta
      const r1=1-Math.abs(2*vn3(x*7.3+13.1,y*7.3+5.3,z*7.3+31.9)-1),r2=1-Math.abs(2*vn3(x*15.7+29.9,y*15.7+41.3,z*15.7+3.7)-1);
      ridge=r1*r1*.62+r2*r2*r1*.28;
      if(lod<=64){const r3=1-Math.abs(2*vn3(x*33.1+2.3,y*33.1+19.1,z*33.1+67.3)-1);ridge+=r3*r3*r1*r2*.10;}
      if(mount>0)h+=(150+ridge*640-h)*mount;
      if(volc>0)h+=(90+ridge*240-h)*volc;
    }
    h*=land;
  }
  if(h<0)h=0;
  if(full){
    const hot=sstep(.5,.85,temp);
    let r=wPl*(.50+hot*.20)+wFo*.11+wDe*(.80-mesa*.12)+wIc*.87;
    let g=wPl*(.62-hot*.08)+wFo*.27+wDe*(.56-mesa*.17)+wIc*.93;
    let b=wPl*(.30-hot*.08)+wFo*.14+wDe*(.30-mesa*.08)+wIc*.98;
    if(mount>0){r+=(.40-r)*mount;g+=(.37-g)*mount;b+=(.38-b)*mount;}
    if(volc>0){r+=(.11-r)*volc;g+=(.10-g)*volc;b+=(.11-b)*volc;}
    // Nieve por altura, en cualquier zona lo bastante alta
    const snow=sstep(240+temp*130,310+temp*130,h);
    if(snow>0){r+=(.88-r)*snow;g+=(.90-g)*snow;b+=(.95-b)*snow;}
    // Costa: franja ancha para que no se vea dentada desde lejos
    const shore=sstep(0,1,land);
    r=.80+(r-.80)*shore;g=.72+(g-.72)*shore;b=.54+(b-.54)*shore;
    let water=1-sstep(0,1.2,h);
    if(water>0){
      const sh=sstep(.30,.40,cont);
      let wr=.02+.03*sh,wg=.11+.19*sh,wb=.27+.13*sh;
      wr+=(.86-wr)*ice;wg+=(.93-wg)*ice;wb+=(.98-wb)*ice; // el mar polar está congelado
      r+=(wr-r)*water;g+=(wg-g)*water;b+=(wb-b)*water;
      water*=1-ice;
    }
    S.r=r;S.g=g;S.b=b;S.water=water;
    S.lava=volc*(1-sstep(.10,.24,ridge));
    S.strata=wDe*(1-mount)*(1-volc);
    S.canopy=wFo*land*(1-mount)*(1-volc);
    S.biome=h<1.2?(ice>.5?6:0):land<.45?1:volc>.5?7+1:mount>.5?7:wDe>.5?(mesa>.5?5:4):wIc>.5?6:wFo>.5?3:2;
  }
  return h;
}
const heightAt=(x,y,z,lod)=>terrain(x,y,z,lod,false);
// Punto más alto en los próximos 900 m en esa dirección, para reaparecer sin chocar
function clearance(u,f){
  let top=0;
  for(let t=0;t<=900;t+=60){
    const a=t/PLANET_R,c=Math.cos(a),s=Math.sin(a);
    top=Math.max(top,heightAt(u.x*c+f.x*s,u.y*c+f.y*s,u.z*c+f.z*s,64));
  }
  return top;
}
// Orientación nivelada mirando hacia f sobre el suelo local
const _bx=new V3(),_bz=new V3();
function setLevel(q,u,f){
  _bz.copy(f).addScaledVector(u,-f.dot(u));
  if(_bz.lengthSq()<1e-5){_bz.set(1,0,0).addScaledVector(u,-u.x);if(_bz.lengthSq()<1e-5)_bz.set(0,0,1);}
  _bz.normalize();
  _bx.crossVectors(_bz,u).normalize();
  _bz.negate();
  _m.makeBasis(_bx,u,_bz);q.setFromRotationMatrix(_m);
}

/* ---------- Escena ---------- */
const scene=new T.Scene();
scene.fog=new T.Fog(0xb3c9e0,500,4200);
const camera=new T.PerspectiveCamera(58,2,1,14000);
const SUN=new V3(.55,.45,-.7).normalize();
const MOON=new V3(-.62,.2,.76).normalize(); // casi opuesta al sol: se ve llena e ilumina el lado de noche

const hemi=new T.HemisphereLight(0xa8c8ff,0xb08a66,.72);scene.add(hemi);
const sunLight=new T.DirectionalLight(0xfff0d8,.95);
sunLight.position.copy(SUN).multiplyScalar(100);
scene.add(sunLight);

/* Cielo: solo pinta el fondo. El planeta lo tapa con su propia malla. Se oscurece al subir y al pasar al lado de noche. */
const airU={value:1};
const skyU={uU:{value:new V3(0,1,0)},uSun:{value:SUN},uMoon:{value:MOON},uR:{value:PLANET_R},uCamR:{value:PLANET_R+100},uAir:airU};
const sky=new T.Mesh(new T.SphereGeometry(2000,24,16),new T.ShaderMaterial({
  uniforms:skyU,side:T.BackSide,depthWrite:false,depthTest:false,fog:false,
  vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`
    uniform vec3 uU;uniform vec3 uSun;uniform vec3 uMoon;uniform float uR;uniform float uCamR;uniform float uAir;varying vec3 vDir;
    void main(){
      vec3 d=normalize(vDir);
      float tanD=sqrt(max(uCamR*uCamR-uR*uR,0.));
      vec3 nP=normalize(uU*uCamR+d*tanD);
      float sunAt=dot(nP,uSun),dayR=smoothstep(-.22,.22,sunAt);
      float e=asin(clamp(dot(d,uU),-1.,1.))+acos(clamp(uR/uCamR,0.,1.));
      float u=max(e,0.);
      vec3 dayC=mix(vec3(.66,.76,.85),vec3(.15,.33,.60),smoothstep(0.,.75,u));
      vec3 nightC=vec3(.010,.016,.04);
      vec3 s=mix(nightC,mix(nightC,dayC,uAir),dayR);
      float rim=exp(-u*(9.+(1.-uAir)*26.));
      s+=rim*(vec3(1.,.56,.32)*exp(-abs(sunAt)*5.5)*.9+vec3(.60,.78,1.)*dayR*(.22+.6*(1.-uAir)));
      float sd=max(dot(d,uSun),0.);
      s+=vec3(1.,.9,.72)*(pow(sd,1100.)*2.6+pow(sd,60.)*(.1+.22*uAir));
      float mc=dot(d,uMoon);
      if(mc>.9975){
        vec3 o=(d-uMoon)/sqrt(1.-.9975*.9975);
        float r2=dot(o,o);
        vec3 n=o+uMoon*sqrt(max(1.-r2,0.));
        float l=max(dot(n,uSun),0.);
        vec3 mcol=vec3(.86,.84,.86)*(l*.85+.15)+vec3(.05,.07,.12);
        s=mix(s,mcol,(1.-smoothstep(.86,1.,r2))*(1.-dayR*uAir*.8));
      }
      gl_FragColor=vec4(s,1.);
    }`
}));
sky.frustumCulled=false;sky.renderOrder=-10;scene.add(sky);

/* Estrellas: el planeta las tapa solo, y de día con aire no se ven */
const stars=(function(){
  const n=900,p=new Float32Array(n*3),c=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    const u=Math.random()*2-1,th=Math.random()*Math.PI*2,r=Math.sqrt(1-u*u);
    p[i*3]=Math.cos(th)*r*12000;p[i*3+1]=u*12000;p[i*3+2]=Math.sin(th)*r*12000;
    const b=.25+Math.random()*.75,warm=Math.random();
    c[i*3]=b;c[i*3+1]=b*(.88+warm*.12);c[i*3+2]=b*(.78+(1-warm)*.22);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('color',new T.BufferAttribute(c,3));
  const m=new T.Points(g,new T.PointsMaterial({size:1.5,sizeAttenuation:false,vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false}));
  m.frustumCulled=false;scene.add(m);return m;
})();

/* Textura de ruido compartida: mucho más liviana para el teléfono que calcular ruido en cada píxel */
const noiseTex=(function(){
  const n=256,d=new Uint8Array(n*n*4);
  let s=90210;
  for(let i=0;i<d.length;i++){s=(s*1664525+1013904223)>>>0;d[i]=s>>>24;}
  const t=new T.DataTexture(d,n,n,T.RGBAFormat,T.UnsignedByteType);
  t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;
  return t;
})();

/* ---------- Mallas del suelo: una esfera completa fija, y anillos finos que acompañan a la nave ---------- */
const GU={
  uNoise:{value:noiseTex},uSun:{value:SUN},uMoon:{value:MOON},uTime:{value:0},uAir:airU,
  uG:{value:new V3()},uT1:{value:new V3()},uT2:{value:new V3()},uE0:{value:new V3()},uE1:{value:new V3()},uE2:{value:new V3()},uShadow:{value:0},
  uCenter:{value:new V3(0,1,0)},uSinkA:{value:Math.cos(720/PLANET_R)},uSinkB:{value:Math.cos(640/PLANET_R)}
};
const GROUND_VS=`
  attribute vec3 aCol;attribute vec4 aMat;
  varying vec3 vP;varying vec3 vN;varying vec3 vC;varying vec4 vM;
  #ifdef SINK
  uniform vec3 uCenter;uniform float uSinkA;uniform float uSinkB;
  #endif
  void main(){
    vec3 p=position;
    #ifdef SINK
    vec3 dr=normalize(p);
    p-=dr*smoothstep(uSinkA,uSinkB,dot(dr,uCenter))*70.; // bajo los anillos finos, la esfera se hunde para no asomar
    #endif
    vP=position;vN=normal;vC=aCol;vM=aMat;
    gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);
  }`;
const GROUND_FS=`
  uniform sampler2D uNoise;uniform vec3 uSun;uniform vec3 uMoon;uniform float uTime;uniform float uAir;
  uniform vec3 uG;uniform vec3 uT1;uniform vec3 uT2;uniform vec3 uE0;uniform vec3 uE1;uniform vec3 uE2;uniform float uShadow;
  varying vec3 vP;varying vec3 vN;varying vec3 vC;varying vec4 vM;
  float tn(vec2 p){return texture2D(uNoise,p/256.).r;}
  float tri(vec3 p,vec3 w){return w.x*tn(p.yz)+w.y*tn(p.zx)+w.z*tn(p.xy);}
  void main(){
    vec3 up=normalize(vP);
    vec3 rel=vP-cameraPosition;
    float dist=length(rel);
    vec3 n=normalize(vN);
    vec3 w=abs(up);w*=w;w*=w;w/=(w.x+w.y+w.z);
    float big=tri(vP/90.,w),fine=tri(vP/9.,w);
    float water=vM.x,lava=vM.y,strata=vM.z,canopy=vM.w;
    vec3 c=vC*(1.+((big-.5)*(.30+canopy*.7)+(fine-.5)*(.26+canopy*.6))*(1.-water));
    float rock=smoothstep(.16,.38,1.-dot(n,up))*(1.-water)*(1.-canopy);
    if(rock>.002){ // paredes empinadas: roca gris, o con estratos rojos en el desierto
      float st=mix(.5+.5*sin(length(vP)*.36+big*4.),.5,smoothstep(250.,900.,dist));
      vec3 rc=mix(vec3(.36,.33,.34)*(.62+big*.5)*(.7+fine*.6),mix(vec3(.30,.13,.10),vec3(.60,.35,.23),st),strata);
      c=mix(c,rc,rock);
    }
    if(dist<150.){ // grano fino, solo en vuelo rasante: es lo que da la sensación de velocidad
      float micro=tri(vP/1.7,w);
      c*=1.+(micro-.5)*(.34+canopy*.3)*(1.-water)*(1.-smoothstep(30.,150.,dist));
    }
    if(water>.01){ // el mar: marejada grande, olas y espuma de cerca; dan escala y movimiento para calcular la distancia
      float sw=tri(vP/75.+vec3(uTime*.018,0.,uTime*.012),w);
      float rp=tri(vP/12.+vec3(uTime*.07,0.,-uTime*.05),w);
      float farW=smoothstep(500.,2200.,dist);
      float nearW=1.-smoothstep(180.,700.,dist);
      c*=1.+((sw-.5)*.6+(rp-.5)*.45*nearW)*water*(1.-farW*.6);
      c+=vec3(.02,.05,.07)*(smoothstep(.55,.75,sw)+smoothstep(.6,.8,rp)*nearW)*water*(1.-farW*.6); // crestas más claras
      float fm=tri(vP/3.4+vec3(-uTime*.16,0.,uTime*.11),w);
      float foam=smoothstep(.70,.80,fm)*smoothstep(.45,.65,rp)*(1.-smoothstep(70.,320.,dist));
      c=mix(c,vec3(.78,.86,.92),foam*.85*water);
    }
    float sunUp=dot(up,uSun),dayH=smoothstep(-.22,.18,sunUp);
    float l=max(dot(n,uSun),0.)*smoothstep(-.12,.08,sunUp);
    float lm=max(dot(n,uMoon),0.)*(1.-dayH);
    c*=mix(vec3(.25,.29,.42),vec3(.35,.38,.42),dayH)+vec3(1.,.93,.82)*l*.82+vec3(.35,.42,.6)*lm*.5;
    if(water>.01){ // brillo del sol sobre el mar
      vec3 wn=normalize(up+(vec3(tn(vP.xz/13.+uTime*.35),tn(vP.zy/13.-uTime*.3),tn(vP.xy/13.+uTime*.25))-.5)*.12);
      c+=vec3(1.,.94,.84)*pow(max(dot(reflect(normalize(rel),wn),uSun),0.),70.)*water*dayH*1.1;
    }
    if(uShadow>.002){ // sombra triangular de la nave
      vec2 p=vec2(dot(vP-uG,uT1),dot(vP-uG,uT2));
      float m=min(dot(uE0.xy,p)+uE0.z,min(dot(uE1.xy,p)+uE1.z,dot(uE2.xy,p)+uE2.z));
      c*=1.-smoothstep(-.5,.7,m)*.6*uShadow;
    }
    if(lava>.01)c=mix(c,vec3(1.,.38,.07)*(.75+fine*.7),lava*smoothstep(.42,.58,big));
    vec3 hz=mix(vec3(.04,.06,.12),mix(vec3(.70,.79,.88),vec3(1.,.66,.46),exp(-abs(sunUp)*6.)),dayH);
    c=mix(c,hz,(1.-exp(-dist*.00026))*mix(.35,1.,uAir));
    gl_FragColor=vec4(c,1.);
  }`;
const ringMat=new T.ShaderMaterial({uniforms:GU,fog:false,vertexShader:GROUND_VS,fragmentShader:GROUND_FS});
const baseMat=new T.ShaderMaterial({uniforms:GU,fog:false,defines:{SINK:1},vertexShader:GROUND_VS,fragmentShader:GROUND_FS});

/* Esfera completa con relieve, dividida en 20 caras para no dibujar las que quedan fuera de cámara. Se calcula una sola vez. */
function buildPlanet(){
  const t=(1+Math.sqrt(5))/2;
  const V=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
  const F=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  const n=72,vc=10*n*n+2;
  const pos=new Float32Array(vc*3),nor=new Float32Array(vc*3),col=new Float32Array(vc*3),mat=new Float32Array(vc*4);
  const shared=new Map();
  let next=0;
  function vid(fa,fb,fc,i,j){
    const k=n-i-j;
    let key=null;
    if(i===0||j===0||k===0){ // borde de cara: el vértice se comparte con la cara vecina
      const parts=[];
      if(k)parts.push(fa*1000+k);if(i)parts.push(fb*1000+i);if(j)parts.push(fc*1000+j);
      parts.sort((a,b)=>a-b);key=parts.join('_');
      const e=shared.get(key);if(e!==undefined)return e;
    }
    const A=V[fa],B=V[fb],C=V[fc];
    let x=A[0]*k+B[0]*i+C[0]*j,y=A[1]*k+B[1]*i+C[1]*j,z=A[2]*k+B[2]*i+C[2]*j;
    const l=1/Math.sqrt(x*x+y*y+z*z);x*=l;y*=l;z*=l;
    const h=terrain(x,y,z,57,true),rad=PLANET_R+h,id=next++;
    pos[id*3]=x*rad;pos[id*3+1]=y*rad;pos[id*3+2]=z*rad;
    col[id*3]=S.r;col[id*3+1]=S.g;col[id*3+2]=S.b;
    mat[id*4]=S.water;mat[id*4+1]=S.lava;mat[id*4+2]=S.strata;mat[id*4+3]=S.canopy;
    if(key)shared.set(key,id);
    return id;
  }
  const faces=F.map(f=>{
    const grid=[];
    for(let i=0;i<=n;i++){grid[i]=[];for(let j=0;j<=n-i;j++)grid[i][j]=vid(f[0],f[1],f[2],i,j);}
    const idx=[];
    for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){
      idx.push(grid[i][j],grid[i+1][j],grid[i][j+1]);
      if(i+j<n-1)idx.push(grid[i+1][j],grid[i+1][j+1],grid[i][j+1]);
    }
    return {f,idx};
  });
  const ax=new V3(),bx=new V3(),cx=new V3(),e1=new V3(),e2=new V3();
  faces.forEach(({idx})=>{
    for(let i=0;i<idx.length;i+=3){
      const a=idx[i],b=idx[i+1],c=idx[i+2];
      ax.fromArray(pos,a*3);bx.fromArray(pos,b*3);cx.fromArray(pos,c*3);
      e1.subVectors(bx,ax);e2.subVectors(cx,ax);e1.cross(e2);
      for(const v of [a,b,c]){nor[v*3]+=e1.x;nor[v*3+1]+=e1.y;nor[v*3+2]+=e1.z;}
    }
  });
  for(let i=0;i<vc;i++){
    const x=nor[i*3],y=nor[i*3+1],z=nor[i*3+2],l=1/(Math.sqrt(x*x+y*y+z*z)||1);
    nor[i*3]=x*l;nor[i*3+1]=y*l;nor[i*3+2]=z*l;
  }
  const aPos=new T.BufferAttribute(pos,3),aNor=new T.BufferAttribute(nor,3),aCol=new T.BufferAttribute(col,3),aMat=new T.BufferAttribute(mat,4);
  faces.forEach(({f,idx})=>{
    const g=new T.BufferGeometry();
    g.setAttribute('position',aPos);g.setAttribute('normal',aNor);g.setAttribute('aCol',aCol);g.setAttribute('aMat',aMat);
    g.setIndex(new T.BufferAttribute(new Uint16Array(idx),1));
    const center=new V3(V[f[0]][0]+V[f[1]][0]+V[f[2]][0],V[f[0]][1]+V[f[1]][1]+V[f[2]][1],V[f[0]][2]+V[f[1]][2]+V[f[2]][2]).normalize().multiplyScalar(PLANET_R+MAX_H/2);
    let rad=0;
    for(const vi of f){_v.fromArray(V[vi]).normalize().multiplyScalar(PLANET_R+MAX_H/2);rad=Math.max(rad,_v.distanceTo(center));}
    g.boundingSphere=new T.Sphere(center,rad+MAX_H);
    scene.add(new T.Mesh(g,baseMat));
  });
}

/* Anillos finos: una grilla plana apoyada sobre el planeta, con su origen en un punto de anclaje que se renueva al avanzar */
const RN=36,RH=RN/2,RW=RN+3;
const chart={A:new V3(0,1,0),E1:new V3(1,0,0),E2:new V3(0,0,1)};
function setAnchor(d){
  chart.A.copy(d);
  chart.E1.set(Math.abs(d.y)<.9?0:1,Math.abs(d.y)<.9?1:0,0).addScaledVector(d,Math.abs(d.y)<.9?-d.y:-d.x).normalize();
  chart.E2.crossVectors(chart.E1,d).normalize();
}
function chartDir(u,v,out){
  const A=chart.A,E=chart.E1,F=chart.E2;
  out.set(A.x*PLANET_R+E.x*u+F.x*v,A.y*PLANET_R+E.y*u+F.y*v,A.z*PLANET_R+E.z*u+F.z*v);
  return out.normalize();
}
const rings=[6,12,24,48].map((s,k)=>{
  const vc=(RN+1)*(RN+1),pos=new Float32Array(vc*3),nor=new Float32Array(vc*3),col=new Float32Array(vc*3),mat=new Float32Array(vc*4);
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.BufferAttribute(pos,3).setUsage(T.DynamicDrawUsage));
  geo.setAttribute('normal',new T.BufferAttribute(nor,3).setUsage(T.DynamicDrawUsage));
  geo.setAttribute('aCol',new T.BufferAttribute(col,3).setUsage(T.DynamicDrawUsage));
  geo.setAttribute('aMat',new T.BufferAttribute(mat,4).setUsage(T.DynamicDrawUsage));
  const idx=[];
  for(let j=0;j<RN;j++)for(let i=0;i<RN;i++){
    const ci=i-RH,cj=j-RH;
    if(k>0&&ci>=-7&&ci<7&&cj>=-7&&cj<7)continue; // el centro lo cubre el anillo más fino
    const v=j*(RN+1)+i,vz=v+RN+1;
    idx.push(v,vz,v+1,v+1,vz,vz+1);
  }
  geo.setIndex(idx);
  const mesh=new T.Mesh(geo,ringMat);mesh.frustumCulled=false;scene.add(mesh);
  return {s,k,mesh,geo,pos,nor,col,mat,a:new Float32Array(RW*RW*8),b:new Float32Array(RW*RW*8),cu:NaN,cv:NaN};
});
const _t1=new V3(),_t2=new V3();
function updateRing(r,cu,cv){
  const s=r.s,di=Number.isNaN(r.cu)?1e6:Math.round((cu-r.cu)/s),dj=Number.isNaN(r.cv)?1e6:Math.round((cv-r.cv)/s);
  const A=r.a,B=r.b;
  // Reutiliza lo ya calculado: al avanzar solo hacen falta las filas nuevas del borde
  for(let j=0;j<RW;j++)for(let i=0;i<RW;i++){
    const o=(j*RW+i)*8,oi=i+di,oj=j+dj;
    if(oi>=0&&oi<RW&&oj>=0&&oj<RW){
      const q=(oj*RW+oi)*8;
      for(let k=0;k<8;k++)B[o+k]=A[q+k];
    }else{
      chartDir(cu+(i-1-RH)*s,cv+(j-1-RH)*s,_d);
      B[o]=terrain(_d.x,_d.y,_d.z,s,true);
      B[o+1]=S.r;B[o+2]=S.g;B[o+3]=S.b;B[o+4]=S.water;B[o+5]=S.lava;B[o+6]=S.strata;B[o+7]=S.canopy;
    }
  }
  r.a=B;r.b=A;r.cu=cu;r.cv=cv;
  const pos=r.pos,nor=r.nor,col=r.col,mat=r.mat,E1=chart.E1,E2=chart.E2,RW8=RW*8;
  for(let j=0;j<=RN;j++)for(let i=0;i<=RN;i++){
    const c=((j+1)*RW+i+1)*8,n=j*(RN+1)+i,n3=n*3,n4=n*4;
    chartDir(cu+(i-RH)*s,cv+(j-RH)*s,_d);
    const hx=B[c-8]-B[c+8],hz=B[c-RW8]-B[c+RW8];
    _t1.copy(E1).addScaledVector(_d,-E1.dot(_d));_t2.copy(E2).addScaledVector(_d,-E2.dot(_d));
    let nx=_d.x*2*s+_t1.x*hx+_t2.x*hz,ny=_d.y*2*s+_t1.y*hx+_t2.y*hz,nz=_d.z*2*s+_t1.z*hx+_t2.z*hz;
    const l=1/Math.sqrt(nx*nx+ny*ny+nz*nz);
    // el borde interior baja un poco y queda tapado por el anillo fino, para que no se vean cortes
    const edge=r.k>0&&Math.max(Math.abs(i-RH),Math.abs(j-RH))===7;
    const rad=PLANET_R+B[c]-(edge?s*.2:0);
    pos[n3]=_d.x*rad;pos[n3+1]=_d.y*rad;pos[n3+2]=_d.z*rad;
    nor[n3]=nx*l;nor[n3+1]=ny*l;nor[n3+2]=nz*l;
    col[n3]=B[c+1];col[n3+1]=B[c+2];col[n3+2]=B[c+3];
    mat[n4]=B[c+4];mat[n4+1]=B[c+5];mat[n4+2]=B[c+6];mat[n4+3]=B[c+7];
  }
  const at=r.geo.attributes;
  at.position.needsUpdate=true;at.normal.needsUpdate=true;at.aCol.needsUpdate=true;at.aMat.needsUpdate=true;
}
// Como mucho dos anillos por cuadro, empezando por los cercanos: evita tirones al volar rápido
let anchored=false;
function stepTerrain(force){
  _v.copy(ship.pos).normalize();
  GU.uCenter.value.copy(_v);
  const A=chart.A;
  let k=PLANET_R/_v.dot(A),u=_v.dot(chart.E1)*k,w=_v.dot(chart.E2)*k;
  let budget=force?99:2;
  if(!anchored||_v.dot(A)<.2||Math.abs(u)>1800||Math.abs(w)>1800){
    setAnchor(_v);anchored=true;u=0;w=0;budget=99;
    rings.forEach(r=>{r.cu=NaN;r.cv=NaN;});
  }
  for(const r of rings){
    const st=r.s*2,cu=Math.round(u/st)*st,cv=Math.round(w/st)*st;
    if((cu!==r.cu||cv!==r.cv)&&budget>0){updateRing(r,cu,cv);budget--;}
  }
}

const softTex=(function(){
  const c=document.createElement('canvas');c.width=c.height=64;
  const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);
})();
const glow=(color,scale)=>{const s=new T.Sprite(new T.SpriteMaterial({map:softTex,color,blending:T.AdditiveBlending,transparent:true,depthWrite:false,fog:false}));s.scale.setScalar(scale);return s;};

/* ---------- La nave: un triángulo delta. Lomo claro y panza azul para leer al toque si está dada vuelta ---------- */
const WING_L=new V3(-2.4,-.1,1.6),WING_R=new V3(2.4,-.1,1.6),TAIL=new V3(0,.05,1.7);
const shipGroup=new T.Group();scene.add(shipGroup);
// mark: color de las puntas de ala (los aliados llevan el suyo; la del jugador es coral)
function shipGeometry(mark){
  const N=[0,0,-3],L=[-2.4,-.1,1.6],R=[2.4,-.1,1.6],Sp=[0,.62,.55],B=[0,-.34,.7],TL=[-.85,.06,1.35],TR=[.85,.06,1.35];
  const ivory=[.96,.92,.84],shade=[.72,.68,.64],belly=[.16,.28,.56],bellyD=[.10,.17,.38],coral=mark||[1,.40,.22],glass=[.06,.16,.22],glassD=[.03,.08,.12];
  const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  const pos=[],col=[];
  const tri=(a,b,c,k)=>{pos.push(...a,...b,...c);col.push(...k,...k,...k);};
  const P1=lerp(N,L,.74),Q1=lerp(L,Sp,.28),P2=lerp(L,TL,.4);
  const P3=lerp(N,R,.74),Q2=lerp(R,Sp,.28),P4=lerp(R,TR,.4);
  // lomo izquierdo
  tri(P1,L,Q1,coral);tri(N,P1,Q1,ivory);tri(N,Q1,Sp,ivory);
  tri(L,P2,Q1,coral);tri(P2,TL,Sp,shade);tri(P2,Sp,Q1,shade);
  // lomo derecho
  tri(Q2,R,P3,coral);tri(N,Sp,Q2,ivory);tri(N,Q2,P3,ivory);
  tri(P4,R,Q2,coral);tri(TR,P4,Q2,shade);tri(TR,Q2,Sp,shade);
  tri(TL,TR,Sp,shade);
  // panza
  tri(N,B,L,belly);tri(N,R,B,belly);tri(L,B,TL,bellyD);tri(TL,B,TR,bellyD);tri(TR,B,R,bellyD);
  // cabina
  const C1=[0,.335,-1.15],C2=[-.38,.42,.1],C3=[.38,.42,.1],C4=[0,.78,.35];
  tri(C1,C2,C4,glass);tri(C1,C4,C3,glass);tri(C2,C3,C4,glassD);
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  g.setAttribute('color',new T.Float32BufferAttribute(col,3));
  g.computeVertexNormals();
  return g;
}
(function buildShip(){
  const m=new T.Mesh(shipGeometry(),new T.MeshLambertMaterial({vertexColors:true,fog:false,emissive:0x15151c}));
  shipGroup.add(m);
  // luces de navegación: rojo a babor, verde a estribor
  const nl=glow(0xff3b30,.6);nl.position.copy(WING_L);shipGroup.add(nl);
  const nr=glow(0x3dff8b,.6);nr.position.copy(WING_R);shipGroup.add(nr);
})();
const flames=[-.55,.55].map(x=>{
  const g=new T.ConeGeometry(.27,1,10);g.rotateX(Math.PI/2);g.translate(0,0,.5);
  const m=new T.Mesh(g,new T.MeshBasicMaterial({color:0x4fd8c8,blending:T.AdditiveBlending,transparent:true,depthWrite:false,fog:false}));
  m.position.set(x,.04,1.42);shipGroup.add(m);
  const s=glow(0x7ff0e1,2);s.position.set(x,.04,1.5);shipGroup.add(s);
  return {cone:m,glow:s};
});
const muzzleL=new V3(-1.55,-.02,.3),muzzleR=new V3(1.55,-.02,.3);
const flashL=glow(0xbafff5,1.8),flashR=glow(0xbafff5,1.8);
flashL.position.copy(muzzleL);flashR.position.copy(muzzleR);flashL.material.opacity=flashR.material.opacity=0;
shipGroup.add(flashL,flashR);

/* ---------- Estado ---------- */
const ship={pos:new V3(),q:new Q(),vel:new V3(0,0,-65),speed:65,w:new V3(),throttle:CRUISE,pull:0,turn:0,bank:0,pitchA:0,heading:0,cool:0,side:0,rocks:0,kills:0,alt:100,biome:2,thin:0,tf:0,turnBtn:0,t:0};
const input={x:0,y:0,rollL:false,rollR:false,fire:false};
const fwd=new V3(0,0,-1),right=new V3(1,0,0),up=new V3(0,1,0),U=new V3(0,1,0); // U: el arriba local, desde el centro del planeta
let horiz=1;
let dead=0,inv=0; // dead: segundos hasta reaparecer. inv: segundos sin poder chocar.
let heat=0,overheat=0,hull=HULL_MAX,shield=SHIELD_MAX,shieldWait=0,bounceT=0,hitInv=0;
const dodge={t:0,cool:0,dir:0,side:new V3()};
let missileRegen=true; // las misiones pueden arrancar sin que los misiles se recarguen solos
let missiles=MISSILE_MAX,missileT=0,lockOn=false,lockTarget=null,lockP=0,lockBeep=0,repairT=0,repairCool=0,repairFxT=0;
let camTarget=null,camBlend=0,tgtTimer=0,tgtHint=false; // camTarget: el enemigo elegido con el botón Blanco
const TGT_RANGE=1800,TGT_HOLD=450;
let score=0,combo=0,lastKill=-99,record=(()=>{try{return +localStorage.getItem('delta-uno-record')||0;}catch(e){return 0;}})();
const camFwd=new V3(0,0,-1),camUp=new V3(0,1,0),_upT=new V3(),_look=new V3();

// Punto de partida: de día, en verde, con vía libre y una montaña bien visible adelante
(function pickStart(){
  let s=7321;
  const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  const cand=new V3(),f=new V3(),e=new V3(),n=new V3(),q=new V3();
  let best=-1,bestU=new V3(0,1,0),bestF=new V3(0,0,-1),bestH=120;
  for(let c=0;c<220;c++){
    cand.set(rnd()*1.5-.75,1,rnd()*1.5-.75).normalize();
    if(cand.dot(SUN)<.42)continue;
    const h0=terrain(cand.x,cand.y,cand.z,64,true),bio=S.biome;
    if((bio!==2&&bio!==3)||h0<3)continue;
    e.set(1,0,0).addScaledVector(cand,-cand.x).normalize();n.crossVectors(cand,e);
    for(let k=0;k<8;k++){
      const a=k/8*Math.PI*2;
      f.copy(e).multiplyScalar(Math.cos(a)).addScaledVector(n,Math.sin(a));
      let near=0,far=0;
      for(let t=0;t<=1700;t+=170){
        const ang=t/PLANET_R,cc=Math.cos(ang),ss=Math.sin(ang);
        q.copy(cand).multiplyScalar(cc).addScaledVector(f,ss);
        const h=heightAt(q.x,q.y,q.z,64);
        if(t<=680)near=Math.max(near,h);else far=Math.max(far,h);
      }
      const score=far-near*1.3+f.dot(SUN)*60;
      if(far>260&&near<h0+90&&score>best){best=score;bestU.copy(cand);bestF.copy(f);bestH=near;}
    }
  }
  U.copy(bestU);
  setLevel(ship.q,U,bestF);
  ship.pos.copy(U).multiplyScalar(PLANET_R+bestH+105);
  fwd.set(0,0,-1).applyQuaternion(ship.q);right.set(1,0,0).applyQuaternion(ship.q);up.set(0,1,0).applyQuaternion(ship.q);
  ship.vel.copy(fwd).multiplyScalar(ship.speed);
  camFwd.copy(fwd);camUp.copy(U);
})();

const startU=U.clone(),startF=fwd.clone();

/* ---------- Física de vuelo ---------- */
const POLE=new V3(-1,0,0),_e=new V3(),_n=new V3();
function headingNow(){
  _e.crossVectors(POLE,U);
  if(_e.lengthSq()<1e-6)return ship.heading;
  _e.normalize();_n.crossVectors(U,_e);
  return (Math.atan2(fwd.dot(_e),fwd.dot(_n))*180/Math.PI+360)%360;
}
function stepFlight(dt){
  const s=ship,k=SENS[settings.sens]||1,assisted=settings.mode==='asistido';
  U.copy(s.pos).normalize();
  fwd.set(0,0,-1).applyQuaternion(s.q);right.set(1,0,0).applyQuaternion(s.q);up.set(0,1,0).applyQuaternion(s.q);
  const py=input.y*(settings.invert?-1:1); // como avión: palanca abajo levanta la trompa
  const sx=input.x*(settings.invertX?-1:1);
  const dodging=dodge.t>0;
  const btn=dodging?0:(input.rollL?1:0)-(input.rollR?1:0); // +1: botón izquierdo
  // turnIn: inclinar y doblar (-1 izquierda). rollIn: girar sobre el eje (+1 izquierda).
  let turnIn=sx,rollIn=btn;
  if(assisted&&settings.lateral==='rota'){ // palanca gira sobre el eje, botones inclinan y doblan
    s.turnBtn+=(-btn-s.turnBtn)*(1-Math.exp(-7*dt)); // entra de a poco: un toque corto corrige poco
    if(Math.abs(s.turnBtn)<.003)s.turnBtn=0;
    turnIn=s.turnBtn;rollIn=-sx;
  }else s.turnBtn=0;
  const fu=fwd.dot(U),ru=right.dot(U);
  const bank=Math.atan2(ru,up.dot(U)); // >0: ala derecha arriba, inclinada a la izquierda
  horiz=smooth01((1-Math.abs(fu))/.12); // 0 mirando recto arriba o abajo, donde la inclinación no tiene sentido

  // Techo: al subir falta presión, el motor rinde menos y la trompa cae
  const r0=s.pos.length(),altSea=r0-PLANET_R;
  const thin=s.thin=sstep(CEIL_PUSH,CEIL_MAX,altSea);

  let wx=py*TUNE.pitch*k,wy=0,wz=0,headingInput=0;
  if(thin>0&&fu>-.25)wx-=thin*1.7;
  if(assisted){
    headingInput=-turnIn*TUNE.yaw*k*horiz;
    if(Math.abs(rollIn)>.02){wz=rollIn*TUNE.roll*k;}
    else{
      const err=wrapPi(-turnIn*TUNE.maxBank-bank);
      // trompa a fondo y sin doblar: deja hacer un rizo completo sin nivelar
      const hold=Math.abs(turnIn)>.02?1:1-Math.min(1,Math.abs(py)*1.15);
      wz=clamp(err*TUNE.level,-TUNE.roll,TUNE.roll)*hold*horiz+(-turnIn*TUNE.roll*.55*k)*(1-horiz);
    }
  }else if(settings.lateral==='rota'){ // palanca alerón, botones timón
    wz=-sx*TUNE.roll*k;
    wy=btn*TUNE.rudder*k;
  }else{ // palanca timón: mueve la trompa sin inclinar. Botones alerón: la nave queda inclinada.
    wy=-sx*TUNE.rudder*k;
    wz=btn*TUNE.roll*k;
  }
  if(dodging)wz=0;
  const a=1-Math.exp(-TUNE.resp*dt);
  s.w.x+=(wx-s.w.x)*a;s.w.y+=(wy-s.w.y)*a;s.w.z+=(wz-s.w.z)*a;

  _q.set(s.w.x*dt*.5,s.w.y*dt*.5,s.w.z*dt*.5,1).normalize();
  s.q.multiply(_q);
  if(dodging){ // la evasión hace un giro completo mientras se desplaza
    _q.setFromAxisAngle(Z_AXIS,dodge.dir*Math.PI*2/DODGE_TIME*Math.min(dt,dodge.t));
    s.q.multiply(_q);
  }

  // Giro coordinado: estar inclinada hace doblar, igual que un avión. Se aplica sobre la vertical local para que la nariz no se caiga.
  const lift=clamp(s.speed/45,.2,1);
  s.turn=TUNE.bankTurn*k*(assisted?1:.75)*ru*lift;
  _q.setFromAxisAngle(U,(s.turn+headingInput)*dt);
  s.q.premultiply(_q).normalize();

  const thrustNow=overheat>0?OVERHEAT_THRUST:s.throttle;
  s.speed+=(thrustNow*TUNE.vmax*(1-thin*.5)-s.speed)*(1-Math.exp(-TUNE.engine*dt));
  fwd.set(0,0,-1).applyQuaternion(s.q);
  s.vel.lerp(_v.copy(fwd).multiplyScalar(s.speed),1-Math.exp(-(bounceT>0?1.2:TUNE.grip)*dt));

  // Avanza sobre la esfera: al moverse, la nave y su velocidad giran con el suelo. Por eso volar recto da la vuelta al planeta.
  const vr=s.vel.dot(U);
  s.pos.addScaledVector(s.vel,dt);
  s.pos.setLength(r0+vr*dt-thin*175*dt);
  if(dodging){ // desplazamiento lateral: rápido al medio, suave al principio y al final
    const u=1-dodge.t/DODGE_TIME;
    s.pos.addScaledVector(dodge.side,DODGE_DIST/DODGE_TIME*(Math.PI/2)*Math.sin(Math.PI*u)*dt);
  }
  _v.copy(s.pos).normalize();
  _q.setFromUnitVectors(U,_v);
  s.q.premultiply(_q).normalize();
  s.vel.applyQuaternion(_q);camFwd.applyQuaternion(_q);camUp.applyQuaternion(_q);
  U.copy(_v);
  if(thin>.02&&!reduceMotion)shake=Math.max(shake,thin*.45);

  fwd.set(0,0,-1).applyQuaternion(s.q);right.set(1,0,0).applyQuaternion(s.q);up.set(0,1,0).applyQuaternion(s.q);
  s.bank=Math.atan2(right.dot(U),up.dot(U));
  s.pitchA=Math.asin(clamp(fwd.dot(U),-1,1));
  s.heading=headingNow();
  s.pull=(Math.abs(s.w.x)+Math.abs(s.turn+headingInput))*(s.speed/TUNE.vmax);

  shipGroup.position.copy(s.pos);shipGroup.quaternion.copy(s.q);
}

/* ---------- Cámara de persecución: la nariz la sigue rápido, el "arriba" despacio, y así se ve la nave rotar contra el horizonte ---------- */
let shake=0,lastFov=0;
const _cd=new V3(),fogDay=new T.Color(.70,.79,.88),fogNight=new T.Color(.04,.06,.12);
const _tD=new V3(),_ax=new V3();
// Gira el vector v hacia t una fracción k del ángulo, sin pasar por cero cuando t queda del otro lado
function turnToward(v,t,k){
  const ang=Math.acos(clamp(v.dot(t),-1,1));
  if(ang<1e-5)return;
  _ax.crossVectors(v,t);
  if(_ax.lengthSq()<1e-10)_ax.copy(camUp);
  _ax.normalize();
  _q.setFromAxisAngle(_ax,ang*k);v.applyQuaternion(_q).normalize();
}
const CAM_TGT_MAX=35*Math.PI/180,_tAx=new V3();
function stepCamera(dt,time){
  const sf=ship.speed/TUNE.vmax,tf=ship.tf=sstep(.52,.95,sf); // tf: cuánto turbo hay en este momento
  // Con un blanco elegido, la cámara se pone detrás de la nave en la línea hacia el enemigo: se ven los dos
  const tgtCam=camTarget&&camTarget.on&&settings.tgtCam==='camara'&&dead<=0;
  let wantF=fwd;
  if(tgtCam){
    _tD.copy(camTarget.pos).sub(ship.pos);
    const dd=_tD.length();
    _tD.divideScalar(dd||1);
    const near=sstep(20,55,dd); // muy cerca, vuelve a mirar hacia adelante para no marear
    if(near<1)_tD.lerp(fwd,1-near).normalize();
    // gira como mucho 35° desde la trompa: la nave siempre se ve de atrás y no perdés para dónde vas.
    // Si el blanco queda más afuera, lo señala la flecha en el borde de la pantalla.
    const ang=Math.acos(clamp(fwd.dot(_tD),-1,1));
    if(ang>CAM_TGT_MAX){_tAx.crossVectors(fwd,_tD);if(_tAx.lengthSq()>1e-8){_tAx.normalize();_tD.copy(fwd).applyAxisAngle(_tAx,CAM_TGT_MAX);}else _tD.copy(fwd);}
    wantF=_tD;
  }
  camBlend+=((tgtCam?1:0)-camBlend)*(1-Math.exp(-3.5*dt));
  turnToward(camFwd,wantF,1-Math.exp(-(tgtCam?4.2:7)*dt));
  _upT.copy(up);
  if(settings.mode==='asistido')_upT.addScaledVector(U,.9*horiz*horiz);
  if(camBlend>.01)_upT.addScaledVector(U,2.2*camBlend); // mirando al blanco, el horizonte queda más derecho
  if(_upT.lengthSq()<1e-4)_upT.copy(up);
  _upT.normalize();
  camUp.lerp(_upT,1-Math.exp(-2.8*dt));
  camUp.addScaledVector(camFwd,-camUp.dot(camFwd));
  if(camUp.lengthSq()<1e-4)camUp.copy(up);
  camUp.normalize();
  const cp=camera.position;
  cp.copy(ship.pos).addScaledVector(camFwd,-(11.5+tf*5+camBlend*3)).addScaledVector(camUp,5.2+camBlend*1.4);
  let camR=cp.length();
  _cd.copy(cp).divideScalar(camR);
  const camFloor=PLANET_R+heightAt(_cd.x,_cd.y,_cd.z,16)+1.8;
  if(camR<camFloor){cp.copy(_cd).multiplyScalar(camFloor);camR=camFloor;} // la cámara no se mete bajo tierra
  if(shake>.001){
    cp.x+=(Math.random()-.5)*shake;cp.y+=(Math.random()-.5)*shake;cp.z+=(Math.random()-.5)*shake;
    shake*=Math.exp(-5*dt);
  }
  camera.up.copy(camUp);
  // Cuanto más alto, más mira hacia abajo: el horizonte cae con la altura. Con tope, para que la mira nunca salga de cuadro.
  const dip=Math.acos(clamp(PLANET_R/Math.max(camR,PLANET_R),0,1));
  camera.lookAt(_look.copy(ship.pos).addScaledVector(camFwd,20+camBlend*16).addScaledVector(U,-Math.min(Math.tan(dip*.5),.2)*31*(1-camBlend)));
  const fov=reduceMotion?60:62+tf*15;
  if(Math.abs(fov-lastFov)>.04){camera.fov=fov;camera.updateProjectionMatrix();lastFov=fov;}
  sky.position.copy(cp);stars.position.copy(cp);
  // Luz y aire según dónde está la cámara: más alto hay menos aire, y del otro lado del planeta es de noche
  const air=Math.exp(-Math.max(camR-PLANET_R,0)/550),sunH=_cd.dot(SUN),dayL=sstep(-.14,.14,sunH);
  airU.value=air;
  skyU.uU.value.copy(_cd);skyU.uCamR.value=camR;
  GU.uTime.value=time;
  stars.material.opacity=clamp(1-sstep(-.2,.2,sunH)*air*1.2,0,1);
  hemi.position.copy(_cd);hemi.intensity=.28+.26*dayL;
  sunLight.intensity=.72*dayL;
  scene.fog.color.copy(fogNight).lerp(fogDay,sstep(-.22,.18,sunH));
}

/* Sombra de la nave en el suelo: la mejor pista para calcular la altura. Cae hacia adelante para que siempre entre en cuadro, y se acerca a la nave a medida que bajás. */
const SHADOW_PTS=[new V3(0,0,-3),WING_L,WING_R],_sh=[new T.Vector2(),new T.Vector2(),new T.Vector2()],_hf=new V3(),_g=new V3(),_tA=new V3(),_tB=new V3();
function updateShadow(){
  const rad=ship.pos.length(),g=heightAt(U.x,U.y,U.z,0),vis=dead>0?0:1-sstep(60,170,rad-PLANET_R-g);
  GU.uShadow.value=vis;
  if(vis<=.002)return;
  _hf.copy(fwd).addScaledVector(U,-fwd.dot(U));
  const hfl=_hf.length();
  if(hfl>1e-3)_tB.copy(_hf).divideScalar(hfl);else _tB.copy(right).addScaledVector(U,-right.dot(U)).normalize();
  _tA.crossVectors(_tB,U).normalize();
  _g.copy(U).multiplyScalar(PLANET_R+g);
  GU.uG.value.copy(_g);GU.uT1.value.copy(_tA);GU.uT2.value.copy(_tB);
  SHADOW_PTS.forEach((pt,i)=>{
    _a.copy(pt).applyQuaternion(ship.q).add(ship.pos);
    const t=Math.max(_a.length()-PLANET_R-g,0)*.9;
    _a.sub(_g);
    _sh[i].set(_a.dot(_tA),_a.dot(_tB)+t*hfl);
  });
  const A=_sh[0],B=_sh[1],C=_sh[2],area=(B.x-A.x)*(C.y-A.y)-(B.y-A.y)*(C.x-A.x);
  if(Math.abs(area)<.05){GU.uShadow.value=0;return;} // nave de canto: casi no proyecta
  const sg=area>0?1:-1;
  [[A,B,GU.uE0],[B,C,GU.uE1],[C,A,GU.uE2]].forEach(e=>{
    const p=e[0],q=e[1];
    let nx=-(q.y-p.y)*sg,ny=(q.x-p.x)*sg;
    const l=1/(Math.sqrt(nx*nx+ny*ny)||1);nx*=l;ny*=l;
    e[2].value.set(nx,ny,-(nx*p.x+ny*p.y));
  });
}

/* ---------- Estelas ---------- */
function Ribbon(n,r,g,b){
  this.n=n;this.pos=new Float32Array(n*6);this.col=new Float32Array(n*6);this.amt=new Float32Array(n);this.r=r;this.g=g;this.b=b;
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.BufferAttribute(this.pos,3).setUsage(T.DynamicDrawUsage));
  geo.setAttribute('color',new T.BufferAttribute(this.col,3).setUsage(T.DynamicDrawUsage));
  const idx=[];for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  geo.setIndex(idx);this.geo=geo;
  const m=new T.Mesh(geo,new T.MeshBasicMaterial({vertexColors:true,blending:T.AdditiveBlending,transparent:true,depthWrite:false,side:T.DoubleSide,fog:false}));
  m.frustumCulled=false;scene.add(m);
}
Ribbon.prototype.push=function(p,w,amt){
  const P=this.pos,C=this.col,A=this.amt,n=this.n,cam=camera.position;
  P.copyWithin(6,0,(n-1)*6);A.copyWithin(1,0,n-1);
  P[0]=p.x+w.x;P[1]=p.y+w.y;P[2]=p.z+w.z;P[3]=p.x-w.x;P[4]=p.y-w.y;P[5]=p.z-w.z;A[0]=amt;
  for(let i=0;i<n;i++){
    const j=i*6,cx=(P[j]+P[j+3])*.5-cam.x,cy=(P[j+1]+P[j+4])*.5-cam.y,cz=(P[j+2]+P[j+5])*.5-cam.z;
    const f=A[i]*Math.pow(1-i/(n-1),1.25)*smooth01((Math.sqrt(cx*cx+cy*cy+cz*cz)-7)/18);
    C[j]=C[j+3]=this.r*f;C[j+1]=C[j+4]=this.g*f;C[j+2]=C[j+5]=this.b*f;
  }
  this.geo.attributes.position.needsUpdate=true;this.geo.attributes.color.needsUpdate=true;
};
const trailL=new Ribbon(64,.86,.92,1),trailR=new Ribbon(64,.86,.92,1),trailE=new Ribbon(64,.34,.86,.8);
let contrail=0;
function stepTrails(dt){
  const target=Math.max(smooth01((ship.pull-.32)/.7),ship.tf*.8);
  contrail+=((dead>0?0:target)-contrail)*(1-Math.exp(-6*dt));
  const live=dead>0?0:1;
  _w.copy(up).multiplyScalar(.055);
  _a.copy(WING_L).applyQuaternion(ship.q).add(ship.pos);trailL.push(_a,_w,contrail*.6);
  _a.copy(WING_R).applyQuaternion(ship.q).add(ship.pos);trailR.push(_a,_w,contrail*.6);
  _w.copy(right).multiplyScalar(.17);
  _a.copy(TAIL).applyQuaternion(ship.q).add(ship.pos);trailE.push(_a,_w,live*(.1+ship.speed/TUNE.vmax*.34));
  const th=ship.speed/TUNE.vmax,fl=.82+Math.random()*.36;
  flames.forEach(f=>{f.cone.scale.set(1,1,(.45+th*2.6)*fl);f.glow.scale.setScalar((.5+th*.95)*fl);f.glow.material.opacity=.3+th*.4;});
}

/* ---------- Polvo: rayas que dan la sensación de velocidad ---------- */
const DUST=170,DUST_BOX=190;
const dustBase=new Float32Array(DUST*3),dustPos=new Float32Array(DUST*6),dustCol=new Float32Array(DUST*6);
for(let i=0;i<DUST*3;i++)dustBase[i]=Math.random()*DUST_BOX;
const dustGeo=new T.BufferGeometry();
dustGeo.setAttribute('position',new T.BufferAttribute(dustPos,3).setUsage(T.DynamicDrawUsage));
dustGeo.setAttribute('color',new T.BufferAttribute(dustCol,3).setUsage(T.DynamicDrawUsage));
const dust=new T.LineSegments(dustGeo,new T.LineBasicMaterial({vertexColors:true,blending:T.AdditiveBlending,transparent:true,depthWrite:false,fog:false}));
dust.frustumCulled=false;scene.add(dust);
function stepDust(){
  const c=camera.position,v=ship.vel,len=.08+ship.tf*.14,h=DUST_BOX/2,bright=clamp(ship.speed/TUNE.vmax*1.7,.15,1);
  for(let i=0;i<DUST;i++){
    const b=i*3,j=i*6;
    const rx=(((dustBase[b]-c.x)%DUST_BOX)+DUST_BOX)%DUST_BOX-h;
    const ry=(((dustBase[b+1]-c.y)%DUST_BOX)+DUST_BOX)%DUST_BOX-h;
    const rz=(((dustBase[b+2]-c.z)%DUST_BOX)+DUST_BOX)%DUST_BOX-h;
    const x=c.x+rx,y=c.y+ry,z=c.z+rz;
    dustPos[j]=x;dustPos[j+1]=y;dustPos[j+2]=z;
    dustPos[j+3]=x-v.x*len;dustPos[j+4]=y-v.y*len;dustPos[j+5]=z-v.z*len;
    const f=bright*(1-Math.min(1,Math.sqrt(rx*rx+ry*ry+rz*rz)/h))*.95;
    dustCol[j]=f;dustCol[j+1]=f*.95;dustCol[j+2]=f*.88;
  }
  dustGeo.attributes.position.needsUpdate=true;dustGeo.attributes.color.needsUpdate=true;
}

/* ---------- Rocas: sólidas y de tamaño fijo, repartidas por todo el planeta. Unas apoyadas en el suelo, otras flotando. ---------- */
const rockRadius=(seed,x,y,z)=>1+.26*Math.sin(x*3.1+seed*1.7)*Math.cos(y*2.7-seed)+.15*Math.sin(z*5.3+seed*2.9);
const rockGeos=[0,1,2,3].map(seed=>{
  const g=new T.IcosahedronGeometry(1,1),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    _v.fromBufferAttribute(p,i);
    _v.multiplyScalar(rockRadius(seed,_v.x,_v.y,_v.z));p.setXYZ(i,_v.x,_v.y,_v.z);
  }
  g.computeVertexNormals();return g;
});
const ROCK_N=520,ROCK_POOL=110,ROCK_SEE=1250,ROCK_HIDE=1600;
const ROCK_HEX=[0x74677a,0x8a6250,0x8f8a96];
// Solo las rocas cercanas ocupan una malla: así puede haber cientos sin pesar
const rockPool=[];
for(let i=0;i<ROCK_POOL;i++){
  const m=new T.Mesh(rockGeos[0],new T.MeshLambertMaterial({color:ROCK_HEX[0]}));
  m.visible=false;scene.add(m);rockPool.push(m);
}
const rocks=[],activeRocks=[];
const _rl=new V3(),_iq=new Q();
let rockSeed=424242;
const rockRnd=()=>{rockSeed=(rockSeed*1664525+1013904223)>>>0;return rockSeed/4294967296;};
function randomDir(out){const z=rockRnd()*2-1,t=rockRnd()*Math.PI*2,s=Math.sqrt(1-z*z);return out.set(Math.cos(t)*s,z,Math.sin(t)*s);}
function sizeRock(r){r.bound=r.r*Math.max(r.sx,r.sy,r.sz)*1.45;r.hp=Math.ceil(r.r/9);if(r.mesh)r.mesh.scale.set(r.r*r.sx,r.r*r.sy,r.r*r.sz);}
function seatRock(r){
  const h=heightAt(r.dir.x,r.dir.y,r.dir.z,0);
  r.onGround=r.ground&&h>1.5; // sobre el mar, las de suelo no tienen dónde apoyarse y flotan
  r.pos.copy(r.dir).multiplyScalar(PLANET_R+(r.onGround?h-r.r*.3:h+r.lift));
}
function placeRockAt(r,world){
  r.dir.copy(world).normalize();
  r.ground=false;r.onGround=false;
  r.lift=world.length()-PLANET_R-heightAt(r.dir.x,r.dir.y,r.dir.z,0);
  r.pos.copy(world);
}
for(let i=0;i<ROCK_N;i++){
  const ground=i%5<2,rr=(ground?6:5)+Math.pow(rockRnd(),1.7)*(ground?26:20);
  const rock={mesh:null,dir:new V3(),pos:new V3(),seed:i%4,hex:ROCK_HEX[i%3],ground,onGround:false,r:rr,lift:rr*1.7+25+Math.pow(rockRnd(),1.5)*380,hp:1,bound:1,
    sx:.8+rockRnd()*.45,sy:.75+rockRnd()*.45,sz:.8+rockRnd()*.45,
    spin:new V3(rockRnd()-.5,rockRnd()-.5,rockRnd()-.5).normalize(),rate:.08+rockRnd()*.3,q:new Q()};
  rock.q.setFromAxisAngle(rock.spin,rockRnd()*6);
  randomDir(rock.dir);
  sizeRock(rock);seatRock(rock);
  rocks.push(rock);
}
// El primer tramo queda libre, salvo tres rocas a los costados de la ruta para tener blanco desde el primer segundo
for(const r of rocks){
  const d=r.pos.distanceTo(ship.pos);
  if(d<1000){randomDir(r.dir);seatRock(r);while(r.pos.distanceTo(ship.pos)<1000){randomDir(r.dir);seatRock(r);}}
}
[[-34,14,170,9],[46,-14,250,13],[-6,44,340,18]].forEach((d,i)=>{
  const r=rocks[i];
  r.r=d[3];sizeRock(r);
  _v.copy(ship.pos).addScaledVector(right,d[0]).addScaledVector(U,d[1]).addScaledVector(fwd,d[2]);
  placeRockAt(r,_v);
});
function takeRock(r){
  const m=rockPool.pop();
  m.geometry=rockGeos[r.seed];m.material.color.setHex(r.hex);
  m.scale.set(r.r*r.sx,r.r*r.sy,r.r*r.sz);m.quaternion.copy(r.q);m.position.copy(r.pos);m.visible=true;
  r.mesh=m;
}
function freeRock(r){
  r.q.copy(r.mesh.quaternion);r.mesh.visible=false;rockPool.push(r.mesh);r.mesh=null;
}
// ¿Este punto está dentro de la forma que se ve de la roca? Sirve igual para la nave y para los disparos.
function insideRock(r,pt){
  _rl.copy(pt).sub(r.pos).applyQuaternion(_iq.copy(r.mesh.quaternion).conjugate());
  const x=_rl.x/(r.r*r.sx),y=_rl.y/(r.r*r.sy),z=_rl.z/(r.r*r.sz),len=Math.sqrt(x*x+y*y+z*z);
  if(len>1.5)return false;
  if(len<1e-4)return true;
  return len<rockRadius(r.seed,x/len,y/len,z/len)*.95;
}
// La roca destruida vuelve lejos, oculta por la distancia: nunca aparece a la vista
function respawnRock(r){
  if(r.mesh)freeRock(r);
  do{randomDir(r.dir);seatRock(r);}while(r.pos.distanceTo(ship.pos)<ROCK_HIDE+60);
  r.hp=Math.ceil(r.r/9);
}
function stepRocks(dt){
  const p=ship.pos,canHit=dead<=0,hide2=ROCK_HIDE*ROCK_HIDE; // las rocas son sólidas siempre, también en los segundos de gracia
  activeRocks.length=0;
  for(const r of rocks){
    const dx=r.pos.x-p.x,dy=r.pos.y-p.y,dz=r.pos.z-p.z,d2=dx*dx+dy*dy+dz*dz;
    if(d2>=hide2){if(r.mesh)freeRock(r);continue;}
    if(!r.mesh){if(!rockPool.length)continue;takeRock(r);}
    activeRocks.push(r);
    const d=Math.sqrt(d2),al=1-sstep(ROCK_SEE,ROCK_HIDE,d),m=r.mesh,mat=m.material;
    mat.transparent=al<.995;mat.opacity=mat.transparent?al:1;
    if(!r.onGround){_q.setFromAxisAngle(r.spin,r.rate*dt);m.quaternion.premultiply(_q);}
    if(canHit&&d<r.bound+3.4){
      for(const pt of SHIP_PTS){
        _a.copy(pt).applyQuaternion(ship.q).add(p);
        if(insideRock(r,_a)){rockHit(r);break;}
      }
    }
  }
}

/* ---------- Disparos ---------- */
const BOLT_MAX=48,BOLT_SPEED=430,BOLT_LIFE=1.15,FIRE_EVERY=.115;
const boltMesh=new T.InstancedMesh(new T.BoxGeometry(.3,.3,8),new T.MeshBasicMaterial({color:0xb4fff4,blending:T.AdditiveBlending,transparent:true,depthWrite:false,fog:false}),BOLT_MAX);
boltMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);boltMesh.frustumCulled=false;boltMesh.count=0;scene.add(boltMesh);
const bolts=Array.from({length:BOLT_MAX},()=>({on:false,p:new V3(),prev:new V3(),v:new V3(),q:new Q(),life:0}));
let boltNext=0;
const Z_AXIS=new V3(0,0,1);
function spawnBolt(){
  const side=ship.side=1-ship.side,local=side?muzzleR:muzzleL;
  const b=bolts[boltNext];boltNext=(boltNext+1)%BOLT_MAX;
  b.p.copy(local).applyQuaternion(ship.q).add(ship.pos);b.prev.copy(b.p);
  _v.copy(ship.pos).addScaledVector(fwd,240).sub(b.p).normalize();
  if(target&&targetAssist>0){ // asistencia suave: si la mira está cerca del punto de impacto, el tiro se corrige hacia ahí
    _v2.copy(leadPoint).sub(b.p).normalize();
    _v.lerp(_v2,targetAssist).normalize();
  }
  b.q.setFromUnitVectors(Z_AXIS,_v);
  b.v.copy(_v).multiplyScalar(BOLT_SPEED+ship.speed);
  b.life=BOLT_LIFE;b.on=true;
  (side?flashR:flashL).material.opacity=1;
  sfxShot();
}
function segmentSphereHit(a,b,c,rad){
  _v.copy(b).sub(a);_v2.copy(c).sub(a);
  const len2=_v.lengthSq(),t=len2>0?clamp(_v2.dot(_v)/len2,0,1):0;
  _v2.copy(a).addScaledVector(_v,t);
  return _v2.distanceToSquared(c)<=rad*rad?_v2:null;
}
function stepBolts(dt){
  ship.cool-=dt;
  if(input.fire&&dead<=0&&ship.cool<=0){spawnBolt();ship.cool=FIRE_EVERY;}
  let count=0;
  for(const b of bolts){
    if(!b.on)continue;
    b.prev.copy(b.p);b.p.addScaledVector(b.v,dt);b.life-=dt;
    if(b.life<=0){b.on=false;continue;}
    const br=b.p.length();
    if(br-PLANET_R<MAX_H&&br<=PLANET_R+heightAt(b.p.x/br,b.p.y/br,b.p.z/br,64)){ // el planeta también frena los disparos
      burst(b.p,9,24,.5,.6,.5,.4);sfxTick();b.on=false;continue;
    }
    for(const e of enemies){
      const h=segmentSphereHit(b.prev,b.p,e.pos,e.def.hit);
      if(!h)continue;
      _hit.copy(h);b.on=false;hitEnemy(e,_hit);
      break;
    }
    if(!b.on)continue;
    for(const r of activeRocks){
      if(!r.mesh||!segmentSphereHit(b.prev,b.p,r.pos,r.bound+1))continue;
      let hit=false;
      for(let t=0;t<=1.001;t+=.2){_hit.copy(b.prev).lerp(b.p,t);if(insideRock(r,_hit)){hit=true;break;}}
      if(!hit)continue;
      b.on=false;r.hp--;
      if(r.hp<=0){explode(r.pos,r.r);ship.rocks++;addScore(20,false);maybeDrop(r.pos,.25);respawnRock(r);}
      else{burst(_hit,14,46,.45,.75,1,.95);sfxTick();}
      break;
    }
    if(!b.on)continue;
    _m.compose(b.p,b.q,_one);boltMesh.setMatrixAt(count++,_m);
  }
  boltMesh.count=count;boltMesh.instanceMatrix.needsUpdate=true;
  const fade=Math.exp(-22*dt);flashL.material.opacity*=fade;flashR.material.opacity*=fade;
}

/* ---------- Explosiones ---------- */
const P_MAX=460;
const pPos=new Float32Array(P_MAX*3),pCol=new Float32Array(P_MAX*3),pVel=new Float32Array(P_MAX*3),pBase=new Float32Array(P_MAX*3),pLife=new Float32Array(P_MAX),pMaxL=new Float32Array(P_MAX);
let pNext=0;
const pGeo=new T.BufferGeometry();
pGeo.setAttribute('position',new T.BufferAttribute(pPos,3).setUsage(T.DynamicDrawUsage));
pGeo.setAttribute('color',new T.BufferAttribute(pCol,3).setUsage(T.DynamicDrawUsage));
const pPoints=new T.Points(pGeo,new T.PointsMaterial({size:2.1,map:softTex,vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,sizeAttenuation:true,fog:false}));
pPoints.frustumCulled=false;scene.add(pPoints);
function burst(at,n,speed,life,r,g,b){
  for(let i=0;i<n;i++){
    const k=pNext;pNext=(pNext+1)%P_MAX;
    const j=k*3;
    _v2.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(speed*(.3+Math.random()*.85));
    pPos[j]=at.x;pPos[j+1]=at.y;pPos[j+2]=at.z;
    pVel[j]=_v2.x+ship.vel.x*.2;pVel[j+1]=_v2.y+ship.vel.y*.2;pVel[j+2]=_v2.z+ship.vel.z*.2;
    pBase[j]=r;pBase[j+1]=g;pBase[j+2]=b;
    pLife[k]=pMaxL[k]=life*(.55+Math.random()*.6);
  }
}
const flashes=Array.from({length:5},()=>{const s=glow(0xffc48a,1);s.material.opacity=0;scene.add(s);return {s,t:1,size:1};});
let flashNext=0;
function explode(at,radius){
  const c=at.clone();
  burst(c,Math.min(90,34+radius*3|0),30+radius*5,1.1,1,.66,.34);
  burst(c,Math.min(40,16+radius|0),14+radius*2.6,1.5,.9,.86,.82);
  const f=flashes[flashNext];flashNext=(flashNext+1)%flashes.length;
  f.s.position.copy(c);f.t=0;f.size=radius*5+10;
  sfxBoom(radius);
  shake=reduceMotion?0:Math.max(shake,Math.min(1.4,radius*.05*(120/(40+c.distanceTo(ship.pos)))));
}
function stepParticles(dt){
  const drag=Math.exp(-1.1*dt);
  for(let k=0;k<P_MAX;k++){
    if(pLife[k]<=0)continue;
    const j=k*3;
    pLife[k]-=dt;
    pPos[j]+=pVel[j]*dt;pPos[j+1]+=pVel[j+1]*dt;pPos[j+2]+=pVel[j+2]*dt;
    pVel[j]*=drag;pVel[j+1]*=drag;pVel[j+2]*=drag;
    const f=pLife[k]<=0?0:Math.pow(pLife[k]/pMaxL[k],1.4);
    pCol[j]=pBase[j]*f;pCol[j+1]=pBase[j+1]*f;pCol[j+2]=pBase[j+2]*f;
  }
  pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true;
  for(const f of flashes){
    if(f.t>=1)continue;
    f.t=Math.min(1,f.t+dt/.38);
    f.s.scale.setScalar(f.size*(.45+f.t*.75));
    f.s.material.opacity=(1-f.t)*(1-f.t);
  }
}

/* ---------- Choques: el planeta y las rocas destruyen la nave. Reaparece sola, con unos segundos de gracia ---------- */
const SHIP_PTS=[new V3(0,0,-3),WING_L,WING_R,new V3(0,-.3,.7),new V3(0,.6,.55)];
const CRASH_TIME=2.6,GRACE=2.4;
const crashMsg=$('#crashMsg'),warnEl=$('#warn');
const CRASH_TEXT={combate:'Nave destruida',suelo:'Te estrellaste contra el planeta',mar:'Te estrellaste contra el mar',sector:'Saliste del sector'};
let warning=false,thinWarn=false,warnT=0,beepT=0,puffT=0;
function crash(kind){
  const out=kind==='sector'; // salir del sector de una misión: se pierde la parte, sin explosión
  if(dead>0||(inv>0&&!out))return;
  dead=out?1.8:CRASH_TIME;
  run.crashes++;
  stats.track('caida',{causa:kind,t_partida:Math.round(run.t),cerca_de:curZone?curZone.kind.name:run.mode==='historia'&&mis.def?mis.def.id:undefined});
  const at=ship.pos.clone();
  if(!out){explode(at,24);burst(at,60,70,1.3,1,.8,.55);shipGroup.visible=false;shake=reduceMotion?0:3.4;}
  ship.w.set(0,0,0);ship.vel.set(0,0,0);
  crashMsg.textContent=CRASH_TEXT[kind];
  const card=document.createElement('small');
  card.textContent=onCrash();
  crashMsg.appendChild(card);
  crashMsg.hidden=false;
  warning=false;warnEl.hidden=true;
  hull=0;shield=0;
  lockCancel();repairT=0;camTarget=null;
}
function respawn(){
  dead=0;inv=GRACE;
  U.copy(ship.pos).normalize();
  _hf.copy(fwd);
  // Si cayó en una zona enemiga, reaparece afuera y mirando hacia afuera
  groups.forEach(g=>{g.alert=false;g.lostT=0;});
  [roamZone,waveZone,carrierZone].forEach(z=>{z.seen=false;});
  if(run.mode==='carrera')raceRespawnSpot(U,_hf); // en la carrera vuelve al último anillo
  else if(run.mode==='historia')histRestart(U,_hf); // en una misión se repite la parte
  else for(const z of zones){
    z.seen=false;
    if(z.state!=='hostil')continue;
    if(arcTo(U,z.dir)<z.r+ZONE_LEASH){
      _a.copy(U).addScaledVector(z.dir,-U.dot(z.dir));
      if(_a.lengthSq()<1e-6)_a.copy(z.e1);
      _a.normalize();
      const ang=(z.r+ZONE_LEASH+150)/PLANET_R,c=Math.cos(ang),sn=Math.sin(ang);
      U.copy(z.dir).multiplyScalar(c).addScaledVector(_a,sn).normalize();
      _hf.copy(z.dir).multiplyScalar(-sn).addScaledVector(_a,c);
    }
  }
  resetVitals();
  if(run.mode==='historia'&&mis.P)histApplyStart(mis.P); // la parte puede arrancar con menos, según la historia
  if(run.mode==='libre'){score=0;combo=0;} // en Conquista y Supervivencia los puntos se conservan entre vidas
  shipAt(U,_hf,75);
  ship.speed=Math.max(ship.speed,25);ship.vel.copy(fwd).multiplyScalar(ship.speed);
  shipGroup.visible=true;crashMsg.hidden=true;
  run.prev.copy(ship.pos);
}
function resetVitals(){
  hull=HULL_MAX;shield=SHIELD_MAX;shieldWait=0;heat=0;overheat=0;bounceT=0;hitInv=0;
  dodge.t=0;dodge.cool=0;
  missiles=MISSILE_MAX;missileT=0;repairT=0;repairCool=0;lockCancel();
  rockets.forEach(m=>{m.on=false;m.mesh.visible=false;});
  ship.throttle=CRUISE;turbo.on=false;showThrust();
  bolts.forEach(b=>{b.on=false;});eBolts.forEach(b=>{b.on=false;});
}
// Pone la nave nivelada sobre la dirección u, mirando hacia f, a "extra" metros sobre lo más alto del terreno
function shipAt(u,f,extra){
  anchored=false;
  U.copy(u);
  setLevel(ship.q,U,f);
  ship.w.set(0,0,0);
  fwd.set(0,0,-1).applyQuaternion(ship.q);right.set(1,0,0).applyQuaternion(ship.q);up.set(0,1,0).applyQuaternion(ship.q);
  ship.pos.copy(U).multiplyScalar(PLANET_R+clearance(U,fwd)+extra);
  ship.alt=ship.pos.length()-PLANET_R-heightAt(U.x,U.y,U.z,0);ship.bank=0;ship.pitchA=0;
  ship.vel.copy(fwd).multiplyScalar(ship.speed);
  camFwd.copy(fwd);camUp.copy(U);
  shipGroup.position.copy(ship.pos);shipGroup.quaternion.copy(ship.q);
}
function groundCheck(dt){
  const p=ship.pos,rad=p.length(),g=terrain(U.x,U.y,U.z,0,true);
  ship.biome=S.biome;
  ship.alt=rad-PLANET_R-g;
  const overWater=S.water>.5;
  const pr=S.r,pg=S.g,pb=S.b;
  if(inv>0){
    if(ship.alt<6){
      p.setLength(PLANET_R+g+6);ship.alt=6;
      const vr=ship.vel.dot(U);if(vr<0)ship.vel.addScaledVector(U,-vr);
    }
  }else{
    for(const pt of SHIP_PTS){ // trompa, puntas de ala y panza: raspar un ala también cuenta
      _a.copy(pt).applyQuaternion(ship.q).add(p);
      const ar=_a.length();
      if(ar<=PLANET_R+heightAt(_a.x/ar,_a.y/ar,_a.z/ar,0)+.1){crash(ship.biome===0?'mar':'suelo');return;}
    }
  }
  puffT-=dt;
  if(ship.alt<14&&ship.speed>25&&puffT<=0){ // arena, nieve o agua levantada en vuelo rasante
    puffT=.05;_hit.copy(U).multiplyScalar(PLANET_R+g+.5);
    if(overWater)burst(_hit,2,10,.6,.5,.55,.6);else burst(_hit,2,9,.6,pr*.45,pg*.45,pb*.45);
  }
  warnT-=dt;
  if(warnT<=0){ // mira dónde va a estar la nave en los próximos 2 segundos
    warnT=.1;warning=false;
    if(inv<=0&&ship.speed>12){
      const v=ship.vel;
      for(let t=.7;t<2.3;t+=.75){
        _a.copy(p).addScaledVector(v,t);
        const ar=_a.length();
        if(ar<PLANET_R+heightAt(_a.x/ar,_a.y/ar,_a.z/ar,64)+5){warning=true;break;}
      }
    }
    thinWarn=rad-PLANET_R>CEIL_WARN;
    const hotNow=overheat>0||heat>.75;
    warnEl.textContent=warning?'Terreno adelante':mis.warn?mis.warn:thinWarn?'Falta de presión · Bajá':overheat>0?'Motor recalentado':'Motor caliente';
    warnEl.hidden=!(warning||mis.warn||thinWarn||hotNow);
  }
  if(warning||thinWarn||mis.out){beepT-=dt;if(beepT<=0){beepT=.45;blip(920,920,.07,.03,'square');}}else beepT=0;
}

/* ---------- Sonido ---------- */
const sfx={ctx:null,master:null,engGain:null,osc1:null,osc2:null,filter:null,noise:null};
function audioInit(){
  if(sfx.ctx)return;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  try{
    const c=new AC();sfx.ctx=c;
    sfx.master=c.createGain();sfx.master.gain.value=settings.sound?.85:0;sfx.master.connect(c.destination);
    sfx.filter=c.createBiquadFilter();sfx.filter.type='lowpass';sfx.filter.frequency.value=260;
    sfx.engGain=c.createGain();sfx.engGain.gain.value=.03;
    sfx.osc1=c.createOscillator();sfx.osc1.type='sawtooth';sfx.osc1.frequency.value=52;
    sfx.osc2=c.createOscillator();sfx.osc2.type='triangle';sfx.osc2.frequency.value=78;
    sfx.osc1.connect(sfx.filter);sfx.osc2.connect(sfx.filter);sfx.filter.connect(sfx.engGain);sfx.engGain.connect(sfx.master);
    sfx.osc1.start();sfx.osc2.start();
    const b=c.createBuffer(1,c.sampleRate,c.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    sfx.noise=b;
    if(c.state==='suspended')c.resume();
  }catch(e){sfx.ctx=null;}
}
function sfxEngine(){
  if(!sfx.ctx)return;
  const th=ship.speed/TUNE.vmax,t=sfx.ctx.currentTime;
  sfx.osc1.frequency.setTargetAtTime(44+th*62,t,.15);
  sfx.osc2.frequency.setTargetAtTime(66+th*94,t,.15);
  sfx.filter.frequency.setTargetAtTime(170+th*620+contrail*280,t,.15);
  sfx.engGain.gain.setTargetAtTime(dead>0?0:.022+th*.04,t,.2);
}
function blip(from,to,dur,vol,type){
  if(!sfx.ctx)return;
  const c=sfx.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(from,t);o.frequency.exponentialRampToValueAtTime(to,t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  o.connect(g);g.connect(sfx.master);o.start(t);o.stop(t+dur+.02);
}
function sfxShot(){blip(1250,240,.09,.045,'square');}
function sfxTick(){blip(1900,700,.05,.035,'triangle');}
function sfxEnemyShot(){blip(520,180,.1,.016,'sawtooth');}
function sfxShieldHit(){blip(1500,850,.09,.05,'sine');}
function sfxHullHit(){blip(190,70,.16,.09,'square');}
function sfxPickup(){blip(660,1320,.16,.05,'triangle');}
function sfxDodge(){blip(280,1100,.2,.035,'sine');}
function sfxMissile(){
  blip(180,620,.34,.06,'sawtooth');
  if(!sfx.ctx||!sfx.noise)return;
  const c=sfx.ctx,t=c.currentTime,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  s.buffer=sfx.noise;f.type='bandpass';f.Q.value=1;f.frequency.setValueAtTime(700,t);f.frequency.exponentialRampToValueAtTime(2400,t+.45);
  g.gain.setValueAtTime(.16,t);g.gain.exponentialRampToValueAtTime(.0008,t+.55);
  s.connect(f);f.connect(g);g.connect(sfx.master);s.start(t);s.stop(t+.6);
}
function sfxWhoosh(){
  if(!sfx.ctx||!sfx.noise)return;
  const c=sfx.ctx,t=c.currentTime,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  s.buffer=sfx.noise;f.type='bandpass';f.Q.value=.8;f.frequency.setValueAtTime(240,t);f.frequency.exponentialRampToValueAtTime(2600,t+.28);f.frequency.exponentialRampToValueAtTime(400,t+.7);
  g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.2,t+.2);g.gain.exponentialRampToValueAtTime(.0008,t+.75);
  s.connect(f);f.connect(g);g.connect(sfx.master);s.start(t);s.stop(t+.8);
}
function sfxBoom(r){
  if(!sfx.ctx||!sfx.noise)return;
  const c=sfx.ctx,t=c.currentTime,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  s.buffer=sfx.noise;f.type='lowpass';f.frequency.setValueAtTime(1100,t);f.frequency.exponentialRampToValueAtTime(90,t+.7);
  g.gain.setValueAtTime(Math.min(.34,.14+r*.01),t);g.gain.exponentialRampToValueAtTime(.0008,t+.75);
  s.connect(f);f.connect(g);g.connect(sfx.master);s.start(t);s.stop(t+.8);
}
function applySound(){if(sfx.master)sfx.master.gain.value=settings.sound?.85:0;}

/* ---------- Pantalla: siempre en horizontal, aunque el teléfono tenga bloqueada la rotación ---------- */
let rot=0,gw=1,gh=1,viewW=1,viewH=1;
const coarse=!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches);
let cueDone=false;
function hideCue(){$('#turnCue').hidden=true;}
function dismissCue(){cueDone=true;hideCue();}
function layout(){
  const prevRot=rot;
  viewW=Math.max(1,stage.clientWidth);viewH=Math.max(1,stage.clientHeight);
  rot=(coarse&&viewH>viewW)?(settings.flip?-90:90):0;
  gw=rot?viewH:viewW;gh=rot?viewW:viewH;
  game.style.width=gw+'px';game.style.height=gh+'px';
  game.style.transform=rot===90?`translateX(${viewW}px) rotate(90deg)`:rot===-90?`translateY(${viewH}px) rotate(-90deg)`:'none';
  game.classList.toggle('rot90',rot===90);game.classList.toggle('rotm90',rot===-90);
  game.classList.toggle('compact',gw<600);
  renderer.setSize(gw,gh,false);
  camera.aspect=gw/gh;camera.updateProjectionMatrix();
  $('#flipBtn').hidden=!rot;
  if(!rot)hideCue();else if(!cueDone)$('#turnCue').hidden=false;
  if(rot!==prevRot)releaseAll();
}
function toGame(cx,cy){
  if(rot===90)return {x:cy,y:viewW-cx};
  if(rot===-90)return {x:viewH-cy,y:cx};
  return {x:cx,y:cy};
}

/* ---------- Controles táctiles: cada dedo se sigue por separado, para volar y disparar a la vez ---------- */
const releases=[];
function releaseAll(){releases.forEach(f=>f());}
let unlocked=false,wakeLock=null;
function requestWake(){
  try{if(navigator.wakeLock&&!wakeLock)navigator.wakeLock.request('screen').then(l=>{wakeLock=l;l.addEventListener('release',()=>{wakeLock=null;});}).catch(()=>{});}catch(e){}
}
function unlock(){
  if(cueDone===false&&!$('#turnCue').hidden)dismissCue();
  if(unlocked){if(sfx.ctx&&sfx.ctx.state==='suspended')sfx.ctx.resume();return;}
  unlocked=true;audioInit();requestWake();
}

// cancel: lo que pasa si el sistema corta el toque; off: lo que pasa cuando el dedo se levanta de verdad
function hold(el,on,off,cancel){
  const ids=new Set();
  el.addEventListener('pointerdown',e=>{
    e.preventDefault();ids.add(e.pointerId);
    try{el.setPointerCapture(e.pointerId);}catch(_){}
    el.classList.add('on');on();unlock();
  });
  const up=e=>{if(!ids.delete(e.pointerId))return;if(!ids.size){el.classList.remove('on');(e.type==='pointerup'?off:(cancel||off))();}};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);
  releases.push(()=>{ids.clear();el.classList.remove('on');(cancel||off)();});
}
const touchFire={on:false};
hold($('#fire'),()=>{touchFire.on=true;},()=>{touchFire.on=false;});
hold($('#rollL'),()=>{input.rollLT=true;tapRoll(1);},()=>{input.rollLT=false;});
hold($('#rollR'),()=>{input.rollRT=true;tapRoll(-1);},()=>{input.rollRT=false;});
hold($('#missile'),lockStart,lockRelease,lockCancel);
hold($('#repair'),tryRepair,()=>{});
hold($('#tgtBtn'),tgtPress,tgtRelease,tgtCancel);
// Dos toques seguidos en el mismo botón: evasión hacia ese lado
const lastTap={side:0,t:-9};
function tapRoll(side){
  const now=performance.now()/1000;
  if(lastTap.side===side&&now-lastTap.t<DOUBLE_TAP){tryDodge(side);lastTap.t=-9;}
  else{lastTap.side=side;lastTap.t=now;}
}
function tryDodge(dir){
  if(dodge.cool>0||dodge.t>0||dead>0)return false;
  dodge.t=DODGE_TIME;dodge.cool=DODGE_COOL;dodge.dir=dir;
  dodge.side.copy(right).addScaledVector(U,-right.dot(U)).normalize().multiplyScalar(dir>0?-1:1);
  sfxDodge();
  $('#rollTag').classList.add('gone');
  return true;
}

/* Palanca flotante: aparece donde apoyás el pulgar, así no hace falta mirarla */
const zone=$('#stickZone'),stickEl=$('#stick'),knob=$('#knob'),stickTag=$('#stickTag');
const STICK_R=58;
const st={id:null,cx:0,cy:0,x:0,y:0};
function stickRest(){return {x:zone.offsetLeft+stickEl.offsetLeft+stickEl.offsetWidth/2,y:zone.offsetTop+stickEl.offsetTop+stickEl.offsetHeight/2};}
const curve=v=>{const a=Math.abs(v);if(a<.1)return 0;return Math.sign(v)*Math.pow((a-.1)/.9,1.45);};
function stickMove(cx,cy){
  const p=toGame(cx,cy);
  let dx=p.x-st.cx,dy=p.y-st.cy;
  const d=Math.hypot(dx,dy);
  if(d>STICK_R){dx*=STICK_R/d;dy*=STICK_R/d;}
  knob.style.transform=`translate(${dx}px,${dy}px)`;
  st.x=curve(dx/STICK_R);st.y=curve(-dy/STICK_R);
}
function stickRelease(){
  st.id=null;st.x=0;st.y=0;
  knob.style.transform='';stickEl.style.transform='';stickEl.classList.remove('live');
}
zone.addEventListener('pointerdown',e=>{
  if(st.id!==null)return;
  e.preventDefault();unlock();
  st.id=e.pointerId;
  try{zone.setPointerCapture(e.pointerId);}catch(_){}
  const p=toGame(e.clientX,e.clientY),rest=stickRest();
  st.cx=clamp(p.x,rest.x,Math.max(rest.x,zone.offsetLeft+zone.offsetWidth-STICK_R));
  st.cy=clamp(p.y,Math.min(rest.y,zone.offsetTop+STICK_R),rest.y);
  stickEl.classList.add('live');
  stickEl.style.transform=`translate(${st.cx-rest.x}px,${st.cy-rest.y}px)`;
  stickMove(e.clientX,e.clientY);
  stickTag.classList.add('gone');
});
zone.addEventListener('pointermove',e=>{if(e.pointerId===st.id)stickMove(e.clientX,e.clientY);});
const zoneUp=e=>{if(e.pointerId===st.id)stickRelease();};
zone.addEventListener('pointerup',zoneUp);zone.addEventListener('pointercancel',zoneUp);zone.addEventListener('lostpointercapture',zoneUp);
releases.push(stickRelease);

/* Empuje: queda donde lo dejás, así el pulgar puede volver al disparo */
const thrust=$('#thrust'),thrustTrack=$('#thrustTrack'),thrustFill=$('#thrustFill'),thrustGrip=$('#thrustGrip'),thrustVal=$('#thrustVal');
let thrustId=null;
function showThrust(){
  const pct=Math.round(ship.throttle*100),track=(ship.throttle-THROTTLE_MIN)/(1-THROTTLE_MIN)*100;
  thrustFill.style.height=track+'%';thrustGrip.style.bottom=track+'%';thrustVal.textContent=pct;
  thrust.setAttribute('aria-valuenow',pct);
}
function thrustFrom(cx,cy){
  const p=toGame(cx,cy),top=thrust.offsetTop+thrustTrack.offsetTop,h=thrustTrack.offsetHeight;
  ship.throttle=clamp(THROTTLE_MIN+(1-THROTTLE_MIN)*(1-(p.y-top)/h),THROTTLE_MIN,1);showThrust();
}
thrust.addEventListener('pointerdown',e=>{
  e.preventDefault();unlock();thrustId=e.pointerId;
  try{thrust.setPointerCapture(e.pointerId);}catch(_){}
  thrustFrom(e.clientX,e.clientY);
});
thrust.addEventListener('pointermove',e=>{if(e.pointerId===thrustId)thrustFrom(e.clientX,e.clientY);});
const thrustUp=e=>{if(e.pointerId===thrustId)thrustId=null;};
thrust.addEventListener('pointerup',thrustUp);thrust.addEventListener('pointercancel',thrustUp);thrust.addEventListener('lostpointercapture',thrustUp);
releases.push(()=>{thrustId=null;});

/* El navegador no debe hacer zoom, scroll ni menú mientras se juega */
document.addEventListener('touchmove',e=>{if(!e.target.closest||!e.target.closest('#sheetBody,#menuBody,#endBody'))e.preventDefault();},{passive:false});
['gesturestart','gesturechange','contextmenu','selectstart','dblclick'].forEach(t=>document.addEventListener(t,e=>e.preventDefault()));

/* ---------- Teclado, mouse y mando: cada acción tiene hasta dos teclas o botones, y se cambian en Ajustes ---------- */
const ACTIONS=[
  {id:'up',name:'Palanca arriba'},{id:'down',name:'Palanca abajo'},
  {id:'left',name:'Palanca a la izquierda'},{id:'right',name:'Palanca a la derecha'},
  {id:'btnL',name:'Botón izquierdo'},{id:'btnR',name:'Botón derecho'},
  {id:'fire',name:'Disparar'},
  {id:'missile',name:'Misil',hint:'mantené para fijar, soltá para disparar'},
  {id:'target',name:'Blanco',hint:'tocá para elegir, mantené para soltar'},
  {id:'turbo',name:'Turbo',hint:'mientras lo mantenés'},
  {id:'faster',name:'Más empuje'},{id:'slower',name:'Menos empuje'},
  {id:'repair',name:'Reparar'},
  {id:'camera',name:'Cámara',hint:'sigue al blanco o normal'}
];
// Esquema de fábrica. Teclado: el que definió Santiago; las flechas, F y T quedan de alternativa.
const DEFAULT_BINDS={
  kb:{up:['KeyW','ArrowUp'],down:['KeyS','ArrowDown'],left:['KeyQ','ArrowLeft'],right:['KeyE','ArrowRight'],btnL:['KeyA',''],btnR:['KeyD',''],
    fire:['Mouse0',''],missile:['Mouse2','KeyF'],target:['Space','KeyT'],turbo:['ShiftLeft','ShiftRight'],
    faster:['WheelUp',''],slower:['WheelDown',''],repair:['KeyR',''],camera:['KeyC','']},
  // Mando con distribución estándar (Xbox; en PlayStation, A=✕ B=○ X=□ Y=△)
  pad:{up:['a1-',''],down:['a1+',''],left:['a0-',''],right:['a0+',''],btnL:['b4',''],btnR:['b5',''],
    fire:['b7',''],missile:['b6',''],target:['b3',''],turbo:['b0',''],
    faster:['a3-','b12'],slower:['a3+','b13'],repair:['b2',''],camera:['b1','']}
};
const PAD_PAUSE=9; // Start: pausa, fijo
function loadBinds(dev){
  const d=DEFAULT_BINDS[dev],sv=settings[dev+'Binds']||{},o={};
  for(const a of ACTIONS){const v=sv[a.id];o[a.id]=Array.isArray(v)&&v.length===2?v.slice():d[a.id].slice();}
  return o;
}
const binds={kb:loadBinds('kb'),pad:loadBinds('pad')};
function saveBinds(){settings.kbBinds=binds.kb;settings.padBinds=binds.pad;saveSettings();}
const KEY_NAMES={Space:'Espacio',ShiftLeft:'Shift',ShiftRight:'Shift der.',ControlLeft:'Ctrl',ControlRight:'Ctrl der.',AltLeft:'Alt',AltRight:'Alt der.',
  Enter:'Enter',Tab:'Tab',CapsLock:'Mayús',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',
  Mouse0:'Clic izq.',Mouse1:'Clic medio',Mouse2:'Clic der.',Mouse3:'Botón 4',Mouse4:'Botón 5',WheelUp:'Rueda ↑',WheelDown:'Rueda ↓'};
function keyName(c){
  if(!c)return '';if(KEY_NAMES[c])return KEY_NAMES[c];
  if(/^Key[A-Z]$/.test(c))return c.slice(3);if(/^Digit\d$/.test(c))return c.slice(5);
  if(/^Numpad/.test(c))return 'Num '+c.slice(6);return c;
}
const PAD_NAMES=['A','B','X','Y','LB','RB','LT','RT','Back','Start','Clic stick I','Clic stick D','Cruz ↑','Cruz ↓','Cruz ←','Cruz →','Guía'];
const AXIS_NAMES=[['Stick I ←','Stick I →'],['Stick I ↑','Stick I ↓'],['Stick D ←','Stick D →'],['Stick D ↑','Stick D ↓']]; // I: izquierdo, D: derecho
function padName(c){
  if(!c)return '';
  if(c[0]==='b')return PAD_NAMES[+c.slice(1)]||('Botón '+c.slice(1));
  const i=+c.slice(1,-1),pos=c.slice(-1)==='+'?1:0;
  return (AXIS_NAMES[i]||['Eje '+i+' −','Eje '+i+' +'])[pos];
}
const bindName=(dev,c)=>dev==='kb'?keyName(c):padName(c);

/* Con qué está jugando: en PC se esconden los botones táctiles. En teléfonos el teclado no los esconde; el mando sí. */
let inputDev=coarse?'touch':'kbd',lastTouch=-9e9;
function useDev(d){if(inputDev===d)return;inputDev=d;applyTouchUI();}
function applyTouchUI(){
  const m=settings.touchUI||'auto';
  const show=m==='siempre'||(m==='auto'&&inputDev==='touch');
  hud.classList.toggle('kbd',!show);
  const dev=inputDev==='pad'?'pad':'kb';
  [['#kbMissile','missile'],['#kbRepair','repair'],['#kbTarget','target']].forEach(([sel,id])=>{const el=$(sel);if(el)el.textContent=bindName(dev,binds[dev][id][0]||binds[dev][id][1]);});
}

/* Acciones */
const keys=new Set(); // teclas y botones del mouse apretados ahora
const kbHeld=id=>{const b=binds.kb[id];return !!((b[0]&&keys.has(b[0]))||(b[1]&&keys.has(b[1])));};
const turbo={on:false,prev:CRUISE};
function turboStart(){if(turbo.on)return;turbo.on=true;turbo.prev=ship.throttle;ship.throttle=1;showThrust();}
function turboEnd(){if(!turbo.on)return;turbo.on=false;ship.throttle=Math.min(ship.throttle,turbo.prev);showThrust();}
function toggleCam(){
  settings.tgtCam=settings.tgtCam==='camara'?'marca':'camara';saveSettings();syncSheet();
  toast(settings.tgtCam==='camara'?'Cámara: sigue al blanco':'Cámara normal: el blanco solo se marca',1.8);
}
function actPress(id){
  if(id==='btnL')tapRoll(1);else if(id==='btnR')tapRoll(-1);
  else if(id==='missile')lockStart();else if(id==='target')tgtPress();
  else if(id==='repair')tryRepair();else if(id==='camera')toggleCam();
  else if(id==='turbo')turboStart();
}
function actRelease(id){
  if(id==='missile')lockRelease();else if(id==='target')tgtRelease();else if(id==='turbo')turboEnd();
}
function codeDown(code){
  if(keys.has(code))return;
  const before=ACTIONS.map(a=>kbHeld(a.id));
  keys.add(code);
  ACTIONS.forEach((a,i)=>{if(!before[i]&&kbHeld(a.id))actPress(a.id);});
}
function codeUp(code){
  if(!keys.has(code))return;
  const before=ACTIONS.map(a=>kbHeld(a.id));
  keys.delete(code);
  ACTIONS.forEach((a,i)=>{if(before[i]&&!kbHeld(a.id))actRelease(a.id);});
}
// Al abrir un menú o perder el foco: se sueltan todas sin disparar el misil a medio fijar
function dropKeys(){
  const was=ACTIONS.filter(a=>kbHeld(a.id)).map(a=>a.id);
  keys.clear();
  was.forEach(id=>{if(id==='missile')lockCancel();else if(id==='target')tgtCancel();else if(id==='turbo')turboEnd();});
}
const isAction=(dev,code)=>!!code&&ACTIONS.some(a=>binds[dev][a.id].includes(code));

window.addEventListener('keydown',e=>{
  if(overlayOpen()&&!sheetOpen())return;
  if(e.code==='Escape'){sheetOpen()?closeSheet():openSheet();return;}
  if(sheetOpen())return;
  if(!coarse)useDev('kbd');
  if(isAction('kb',e.code)||e.code==='Space')e.preventDefault();
  if(!e.repeat)codeDown(e.code);
  unlock();
});
window.addEventListener('keyup',e=>codeUp(e.code));
window.addEventListener('blur',()=>{dropKeys();releaseAll();});
// Mouse: clics sobre el juego (no sobre botones ni paneles) y la rueda
const MOUSE_SKIP='button,#sheet,#menu,#end,#thrust,#gear,#fatal';
window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){lastTouch=performance.now();useDev('touch');}},true);
window.addEventListener('mousedown',e=>{
  if(performance.now()-lastTouch<900)return; // el navegador repite los toques como clics
  if(overlayOpen()||sheetOpen())return;
  if(e.target.closest&&e.target.closest(MOUSE_SKIP))return;
  useDev('kbd');unlock();
  codeDown('Mouse'+e.button);
});
window.addEventListener('mouseup',e=>codeUp('Mouse'+e.button));
window.addEventListener('wheel',e=>{
  if(overlayOpen()||sheetOpen())return; // en los paneles la rueda desplaza
  e.preventDefault();
  const code=e.deltaY<0?'WheelUp':'WheelDown';
  for(const a of ACTIONS){
    if(!binds.kb[a.id].includes(code))continue;
    if(a.id==='faster'||a.id==='slower'){if(!turbo.on){ship.throttle=clamp(ship.throttle+(a.id==='faster'?.1:-.1),THROTTLE_MIN,1);showThrust();}}
    else{actPress(a.id);actRelease(a.id);}
  }
  if(!coarse)useDev('kbd');
},{passive:false});

/* Mando: se lee en cada cuadro. Los sticks dan valores intermedios, así se puede apuntar fino. */
const pad={on:false,id:'',val:{},start:false};
function padGet(){
  const list=navigator.getGamepads?navigator.getGamepads():[];
  for(const g of list)if(g&&g.connected)return g;
  return null;
}
function padCodeValue(gp,code){
  if(!code)return 0;
  if(code[0]==='b'){const b=gp.buttons[+code.slice(1)];if(!b)return 0;return typeof b==='object'?(b.value||(b.pressed?1:0)):+b;}
  const i=+code.slice(1,-1),x=(gp.axes[i]||0)*(code.slice(-1)==='+'?1:-1);
  return x<=.15?0:Math.min(1,(x-.15)/.85); // zona muerta del stick
}
function stepPad(){
  const gp=padGet();
  pad.on=!!gp;pad.id=gp?gp.id:'';
  if(!gp){for(const a of ACTIONS)pad.val[a.id]=0;return;}
  const paused=sheetOpen()||overlayOpen();
  let any=false;
  for(const a of ACTIONS){
    const b=binds.pad[a.id],v=Math.max(padCodeValue(gp,b[0]),padCodeValue(gp,b[1]));
    const was=(pad.val[a.id]||0)>.5,is=v>.5;
    pad.val[a.id]=paused?0:v;
    if(v>.25)any=true;
    if(paused||capture.on)continue;
    if(is&&!was)actPress(a.id);else if(!is&&was)actRelease(a.id);
  }
  const st9=gp.buttons[PAD_PAUSE],start=!!(st9&&st9.pressed);
  if(start&&!pad.start&&!capture.on&&(!overlayOpen()||sheetOpen()))sheetOpen()?closeSheet():openSheet();
  pad.start=start;
  if(any&&!paused){useDev('pad');unlock();}
}
window.addEventListener('gamepadconnected',()=>{renderBinds();toast('Mando conectado',1.6);});
window.addEventListener('gamepaddisconnected',()=>{renderBinds();toast('Se desconectó el mando',1.6);});

/* Elegir teclas y botones (Ajustes → Teclado y mouse / Mando) */
const capture={on:false,dev:'',act:'',i:0,el:null,armed:false,raf:0,base:null,mouseAt:-9e9};
function bindHint(id){
  const manual=settings.mode==='manual',rolls=settings.lateral==='rota';
  if(id==='up')return (settings.invert?'baja':'sube')+' la trompa';
  if(id==='down')return (settings.invert?'sube':'baja')+' la trompa';
  if(id==='left'||id==='right')return rolls?'gira sobre su eje':manual?'timón':'dobla';
  if(id==='btnL'||id==='btnR')return (!rolls?'rota':manual?'timón':'dobla')+'; dos toques esquivan';
  const a=ACTIONS.find(x=>x.id===id);return a&&a.hint||'';
}
function renderBinds(){
  for(const [dev,box] of [['kb','#bindsKb'],['pad','#bindsPad']]){
    const el=$(box);if(!el)continue;
    el.textContent='';
    for(const a of ACTIONS){
      const row=document.createElement('div');row.className='bind';
      const n=document.createElement('span');n.className='bName';n.textContent=a.name;
      const h=bindHint(a.id);if(h){const sm=document.createElement('small');sm.textContent=h;n.appendChild(sm);}
      row.appendChild(n);
      for(let i=0;i<2;i++){
        const b=document.createElement('button');b.type='button';b.className='slot';
        b.dataset.dev=dev;b.dataset.act=a.id;b.dataset.i=i;
        const code=binds[dev][a.id][i];
        b.textContent=code?bindName(dev,code):'—';b.classList.toggle('empty',!code);
        b.setAttribute('aria-label',a.name+', '+(i?'alternativa':'principal')+': '+(code?bindName(dev,code):'vacío'));
        if(capture.on&&capture.dev===dev&&capture.act===a.id&&capture.i===i){b.classList.add('wait');b.textContent=dev==='kb'?'Apretá…':'Mové o apretá…';capture.el=b;}
        row.appendChild(b);
      }
      el.appendChild(row);
    }
  }
  const ps=$('#padStatus');
  if(ps){const gp=padGet();ps.textContent=gp?'Mando conectado: '+gp.id.replace(/\s*\(.*$/,'').slice(0,60)+'.':'No hay ningún mando conectado. Conectalo por cable o Bluetooth y apretá cualquier botón.';}
}
function padSnapshot(){const gp=padGet();return gp?{b:gp.buttons.map(x=>x.value||(x.pressed?1:0)),a:gp.axes.slice()}:null;}
function startCapture(el){
  stopCapture(true);
  Object.assign(capture,{on:true,dev:el.dataset.dev,act:el.dataset.act,i:+el.dataset.i,el,armed:false,base:padSnapshot()});
  setTimeout(()=>{capture.armed=true;},120); // el clic que abrió la espera no cuenta
  renderBinds();
  if(capture.dev==='pad')capture.raf=requestAnimationFrame(padCaptureLoop);
}
function stopCapture(silent){
  if(!capture.on)return;
  capture.on=false;cancelAnimationFrame(capture.raf);
  if(!silent)renderBinds();
}
function assign(code){
  const {dev,act,i}=capture,b=binds[dev];
  if(code){ // una tecla hace una sola cosa: se saca de donde estaba
    for(const a of ACTIONS)for(let j=0;j<2;j++)if(b[a.id][j]===code&&!(a.id===act&&j===i)){b[a.id][j]='';toast(bindName(dev,code)+' estaba en «'+a.name+'»: la saqué de ahí',2.4);}
  }
  b[act][i]=code;
  saveBinds();stopCapture();syncSheet();
}
function padCaptureLoop(){
  if(!capture.on)return;
  const gp=padGet();
  if(gp){
    if(!capture.base)capture.base=padSnapshot();
    for(let i=0;i<gp.buttons.length;i++){
      if(i===PAD_PAUSE)continue;
      const v=gp.buttons[i].value||(gp.buttons[i].pressed?1:0);
      if(v>.6&&(capture.base.b[i]||0)<.3){assign('b'+i);return;}
    }
    for(let i=0;i<gp.axes.length;i++){
      const v=gp.axes[i],b0=capture.base.a[i]||0;
      if(Math.abs(v)>.6&&Math.abs(b0)<.3){assign('a'+i+(v>0?'+':'-'));return;}
    }
  }
  capture.raf=requestAnimationFrame(padCaptureLoop);
}
window.addEventListener('keydown',e=>{
  if(!capture.on)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(e.code==='Escape'){stopCapture();return;}
  if(capture.dev!=='kb')return;
  if(e.code==='Backspace'||e.code==='Delete'){assign('');return;}
  assign(e.code);
},true);
window.addEventListener('mousedown',e=>{
  if(!capture.on||capture.dev!=='kb'||!capture.armed)return;
  const onSlot=e.target.closest&&e.target.closest('.slot')===capture.el;
  if(e.button===0&&!onSlot){stopCapture();return;} // clic izquierdo afuera: cancela
  e.preventDefault();e.stopImmediatePropagation();
  if(e.button===0)capture.mouseAt=performance.now(); // el clic que sigue al botón izquierdo no tiene que abrir otra espera
  assign('Mouse'+e.button);
},true);
window.addEventListener('wheel',e=>{
  if(!capture.on||capture.dev!=='kb')return;
  e.preventDefault();e.stopImmediatePropagation();
  assign(e.deltaY<0?'WheelUp':'WheelDown');
},{capture:true,passive:false});
$('#sheetBody').addEventListener('click',e=>{
  const slot=e.target.closest&&e.target.closest('.slot');
  if(slot){if(performance.now()-capture.mouseAt<600){capture.mouseAt=-9e9;return;}startCapture(slot);return;}
  const tab=e.target.closest&&e.target.closest('.tab');
  if(tab){showTab(tab.dataset.tab);return;}
  const rs=e.target.closest&&e.target.closest('.resetBinds');
  if(rs){
    const dev=rs.dataset.dev;
    for(const a of ACTIONS)binds[dev][a.id]=DEFAULT_BINDS[dev][a.id].slice();
    saveBinds();syncSheet();toast(dev==='kb'?'Teclas de fábrica':'Botones de fábrica',1.6);
  }
});
function showTab(name){
  stopCapture(true);
  document.querySelectorAll('.tab').forEach(t=>t.setAttribute('aria-selected',t.dataset.tab===name?'true':'false'));
  document.querySelectorAll('#sheetBody [data-panel]').forEach(p=>{p.hidden=p.dataset.panel!==name;});
  renderBinds();
  $('#sheetBody').scrollTop=0;scrollHints();
}

function readInput(dt){
  const v=id=>Math.max(kbHeld(id)?1:0,pad.val[id]||0);
  const kx=v('right')-v('left'),ky=v('up')-v('down');
  if(st.id!==null){input.x=st.x;input.y=st.y;}
  else{
    const a=1-Math.exp(-11*dt);
    input.x+=(kx-input.x)*a;input.y+=(ky-input.y)*a;
    if(Math.abs(input.x)<.003)input.x=0;if(Math.abs(input.y)<.003)input.y=0;
  }
  input.rollL=!!input.rollLT||v('btnL')>.5;
  input.rollR=!!input.rollRT||v('btnR')>.5;
  input.fire=touchFire.on||v('fire')>.5;
  const dT=v('faster')-v('slower');
  if(dT&&!turbo.on){ship.throttle=clamp(ship.throttle+dT*.55*dt,THROTTLE_MIN,1);showThrust();}
  if(turbo.on&&ship.throttle<1){ship.throttle=1;showThrust();}
}

/* ---------- Ajustes ---------- */
const sheet=$('#sheet');
const sheetOpen=()=>!sheet.hidden;
const MODE_NOTE={
  asistido_dobla:'La palanca a los costados inclina y dobla la nave. Los botones la giran sobre su eje. Al soltar, se nivela sola.',
  asistido_rota:'La palanca a los costados gira la nave sobre su eje. Los botones la inclinan y la hacen doblar. Al soltar, se nivela sola.',
  manual_dobla:'La palanca a los costados es el timón: mueve la trompa sin inclinar la nave. Los botones la giran sobre su eje y queda inclinada hasta que la corrijas.',
  manual_rota:'La palanca gira la nave sobre su eje como un alerón y queda inclinada hasta que la corrijas. Los botones son el timón.'
};
function syncSheet(){
  document.querySelectorAll('.seg').forEach(seg=>{
    const cur=String(settings[seg.dataset.key]);
    seg.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.val===cur?'true':'false'));
  });
  const manual=settings.mode==='manual',stickRolls=settings.lateral==='rota';
  $('#modeNote').textContent=MODE_NOTE[(manual?'manual_':'asistido_')+(stickRolls?'rota':'dobla')];
  $('#lateralNote').textContent='Vale para los dos modos. Dos toques seguidos en un botón siguen esquivando.';
  // los botones hacen lo contrario que la palanca: si ella dobla, ellos giran sobre el eje
  hud.classList.toggle('rudderbtn',stickRolls&&manual);
  hud.classList.toggle('turnbtn',stickRolls&&!manual);
  const stickWord=stickRolls?'Girar sobre el eje':manual?'Timón':'Doblar';
  stickTag.textContent=stickWord+' · '+(settings.invert?'Abajo':'Arriba')+' levanta la trompa';
  $('#invertNote').textContent=settings.invert?'Hacia abajo levanta la trompa, como el mando de un avión.':'Hacia arriba levanta la trompa.';
  const word=!stickRolls?'Rotar':manual?'Timón':'Doblar';
  document.querySelectorAll('.rollWord').forEach(w=>{w.textContent=word;});
  $('#rollL').setAttribute('aria-label',word+' a la izquierda');
  $('#rollR').setAttribute('aria-label',word+' a la derecha');
  $('#keys').textContent=keysLine(stickWord,word);
  applyTouchUI();renderBinds();
  applySound();
}
function keysLine(stickWord,word){
  const k=id=>binds.kb[id][0]||binds.kb[id][1],pair=(a,b)=>{const x=keyName(k(a)),y=keyName(k(b));return /^Rueda/.test(x)&&/^Rueda/.test(y)?'Rueda':x+' '+y;};
  const sw=stickWord.toLowerCase().replace('girar sobre el eje','girar');
  return pair('up','down')+': trompa · '+pair('left','right')+': '+sw+' · '+pair('btnL','btnR')+': '+word.toLowerCase()+', dos toques esquivan · '+
    keyName(k('fire'))+': disparar · '+keyName(k('missile'))+': misil · '+keyName(k('target'))+': blanco · '+keyName(k('turbo'))+': turbo · '+
    pair('faster','slower')+': empuje · '+keyName(k('repair'))+': reparar · '+keyName(k('camera'))+': cámara · Esc: pausa';
}
// Al cerrar los ajustes se avisa qué cambió (sin el modo elegido en el menú, que se mide al despegar)
let settingsSnap=null;
function noteSettings(){
  if(!settingsSnap)return;
  const before=settingsSnap;settingsSnap=null;
  const ch={};
  for(const k in settings)if(!['lastMode','diff','statsSeen'].includes(k)&&String(settings[k])!==String(before.s[k]))ch[k]=settings[k];
  const keys=JSON.stringify(binds)!==before.b;
  if(Object.keys(ch).length||keys)stats.track('ajustes',Object.assign({teclas_cambiadas:keys},ch));
}
function openSheet(){if(!settingsSnap)settingsSnap={s:Object.assign({},settings),b:JSON.stringify(binds)};releaseAll();dropKeys();sheet.hidden=false;syncSheet();$('#sheetBody').scrollTop=0;scrollHints();if(sfx.ctx&&sfx.ctx.state==='running')sfx.ctx.suspend();}
function closeSheet(){stopCapture(true);sheet.hidden=true;if(menuEl.hidden)noteSettings();if(!overlayOpen()&&sfx.ctx&&sfx.ctx.state==='suspended')sfx.ctx.resume();}
$('#gear').addEventListener('click',()=>{unlock();openSheet();});
$('#resume').addEventListener('click',closeSheet);
document.querySelectorAll('.seg').forEach(seg=>{
  seg.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    const k=seg.dataset.key;let v=b.dataset.val;
    if(v==='true')v=true;else if(v==='false')v=false;
    settings[k]=v;saveSettings();syncSheet();
    if(k==='stats'&&!v)stats.optOut();
    if(!menuEl.hidden)syncMenu();
  });
});
function straighten(){
  U.copy(ship.pos).normalize();
  fwd.set(0,0,-1).applyQuaternion(ship.q);
  setLevel(ship.q,U,fwd);
  ship.w.set(0,0,0);
  fwd.set(0,0,-1).applyQuaternion(ship.q);right.set(1,0,0).applyQuaternion(ship.q);up.set(0,1,0).applyQuaternion(ship.q);
  ship.vel.copy(fwd).multiplyScalar(ship.speed);
  const top=PLANET_R+clearance(U,fwd)+40;
  if(ship.pos.length()<top)ship.pos.setLength(top);
  camFwd.copy(fwd);camUp.copy(U);
  inv=Math.max(inv,1.5);
}
$('#straighten').addEventListener('click',()=>{straighten();closeSheet();});
$('#flipBtn').addEventListener('click',()=>{settings.flip=!settings.flip;saveSettings();layout();});
const fsBtn=$('#fsBtn');
fsBtn.hidden=stats.native()||!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
fsBtn.addEventListener('click',()=>{
  try{
    const r=(stage.requestFullscreen||stage.webkitRequestFullscreen).call(stage);
    if(r&&r.then)r.then(()=>{if(screen.orientation&&screen.orientation.lock)return screen.orientation.lock('landscape');}).catch(()=>{});
  }catch(e){}
});
$('#keys').hidden=false; // lo muestra o esconde el estilo, según con qué se juegue
applyTouchUI();

/* ---------- Instrumentos ---------- */
const cellAlt=$('#cellAlt'),elAlt=$('#vAlt'),elZone=$('#zone');
const elBall=$('#ballInner'),elVel=$('#vVel'),elBank=$('#vBank'),elPitch=$('#vPitch'),elHead=$('#vHead'),elScore=$('#vScore');
const elRet=$('#reticle'),elFpm=$('#fpm');
let hudT=0;
const signed=n=>{const r=Math.round(n);return (r>0?'+':r<0?'−':' ')+String(Math.abs(r)).padStart(2,'0')+'°';};
function place(el,world,w,h){
  _v.copy(world).sub(camera.position);
  camera.getWorldDirection(_v2);
  if(_v.dot(_v2)<=1){if(el.style.visibility!=='hidden')el.style.visibility='hidden';return;}
  _v.copy(world).project(camera);
  const x=(_v.x*.5+.5)*gw,y=(-_v.y*.5+.5)*gh;
  if(el.style.visibility==='hidden')el.style.visibility='';
  el.style.transform=`translate(${(x-w/2).toFixed(1)}px,${(y-h/2).toFixed(1)}px)`;
}
const _aim=new V3();
function updateHud(dt){
  if(dead>0){elRet.style.visibility='hidden';elFpm.style.visibility='hidden';}
  else{
    place(elRet,_aim.copy(ship.pos).addScaledVector(fwd,240),56,56);
    if(ship.vel.lengthSq()>25){
      _aim.copy(ship.vel).normalize().multiplyScalar(240).add(ship.pos);
      place(elFpm,_aim,44,26);
    }else if(elFpm.style.visibility!=='hidden')elFpm.style.visibility='hidden';
  }
  const px=ship.pitchA*180/Math.PI;
  elBall.style.transform=`rotate(${(ship.bank*180/Math.PI).toFixed(1)}deg) translateY(${(clamp(px,-90,90)*.42).toFixed(1)}px)`;
  hudT+=dt;
  if(hudT>.1){
    hudT=0;
    elVel.textContent=String(Math.round(ship.vel.length())).padStart(3,'0');
    elAlt.textContent=String(Math.max(0,Math.round(ship.alt))).padStart(3,'0');
    cellAlt.classList.toggle('alert',warning||thinWarn||ship.alt<18);
    elBank.textContent=signed(-ship.bank*180/Math.PI);
    elPitch.textContent=signed(px);
    elHead.textContent=String(Math.round(ship.heading)%360).padStart(3,'0')+'°';
    elScore.textContent=score;
    elZone.textContent=modeLine();
    elZone.classList.toggle('enemy',!!curZone);
    elZone.hidden=false;
  }
}

/* ---------- Zonas enemigas: cada una tiene su territorio, sus escuadrones y su reserva. Los enemigos solo nacen adentro. ---------- */
const zones=[],groups=[],enemies=[],lost={suelo:0,roca:0};
let curZone=null,zoneT=0;
const arcTo=(a,b)=>Math.acos(clamp(a.dot(b),-1,1))*PLANET_R;
function zoneWall(z,color){
  color=color||[.85,.26,.09];
  const N=96,pos=new Float32Array((N+1)*6),col=new Float32Array((N+1)*6),a=z.r/PLANET_R,ca=Math.cos(a),sa=Math.sin(a);
  for(let i=0;i<=N;i++){
    const t=i/N*Math.PI*2,c=Math.cos(t),s=Math.sin(t);
    _d.copy(z.dir).multiplyScalar(ca).addScaledVector(z.e1,sa*c).addScaledVector(z.e2,sa*s).normalize();
    const h=heightAt(_d.x,_d.y,_d.z,16),j=i*6;
    pos[j]=_d.x*(PLANET_R+h-6);pos[j+1]=_d.y*(PLANET_R+h-6);pos[j+2]=_d.z*(PLANET_R+h-6);
    pos[j+3]=_d.x*(PLANET_R+h+170);pos[j+4]=_d.y*(PLANET_R+h+170);pos[j+5]=_d.z*(PLANET_R+h+170);
    col[j]=color[0];col[j+1]=color[1];col[j+2]=color[2];
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('color',new T.BufferAttribute(col,3));
  const idx=[];for(let i=0;i<N;i++){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}
  g.setIndex(idx);
  const m=new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,blending:T.AdditiveBlending,transparent:true,opacity:.42,depthWrite:false,side:T.DoubleSide,fog:false}));
  scene.add(m);return m;
}
function makeZone(dir){
  const e1=new V3(Math.abs(dir.y)<.9?0:1,Math.abs(dir.y)<.9?1:0,0);
  e1.addScaledVector(dir,-e1.dot(dir)).normalize();
  const kind=ZONE_KIND[ZONE_ORDER[zones.length%ZONE_ORDER.length]];
  const z={dir:dir.clone(),e1,e2:new V3().crossVectors(e1,dir).normalize(),kind,r:kind.r,state:'hostil',reserve:kind.groups,level:1,spawned:0,spawnT:0,regrow:0,seen:false,arc:1e9,wall:null,sites:[]};
  // Lugares de las defensas de tierra: en terreno abierto y parejo (no en montañas ni volcanes, donde quedan tapadas),
  // separados entre sí y, entre varios candidatos, el más plano y un poco elevado
  const cand=new V3(),best=new V3(),need=kind.turrets+kind.launchers;
  for(let k=0;k<need;k++){
    let bestScore=-1e9;
    for(let t=0;t<110;t++){
      const strict=t<70; // si en tierra firme no hay lugar (zona en el mar), queda como plataforma sobre el agua
      const frac=.15+Math.random()*.6,a=frac*z.r/PLANET_R,ang=Math.random()*Math.PI*2,sa=Math.sin(a);
      cand.copy(z.dir).multiplyScalar(Math.cos(a)).addScaledVector(z.e1,sa*Math.cos(ang)).addScaledVector(z.e2,sa*Math.sin(ang)).normalize();
      terrain(cand.x,cand.y,cand.z,0,true);
      if(strict&&(S.water>.3||S.lava>.3||S.biome>=7))continue;
      if(z.sites.some(q=>arcTo(q.dir,cand)<160))continue;
      const h=Math.max(heightAt(cand.x,cand.y,cand.z,0),0),sl=siteSlope(cand,h);
      if(strict&&sl>.45)continue;
      const score=Math.min(h,160)*.25-sl*220+Math.random()*20;
      if(score>bestScore){bestScore=score;best.copy(cand);}
      if(t===69&&bestScore>-1e9)break; // ya hay un lugar en tierra firme
    }
    if(bestScore>-1e9)z.sites.push({dir:best.clone(),alive:true,on:false,kind:k<kind.turrets?'torreta':'lanzamisiles'});
  }
  z.wall=zoneWall(z);
  zones.push(z);
}
function buildZones(){
  // La primera (dispersa, para empezar tranquilo) queda adelante del punto de partida; las demás, repartidas por el planeta
  const a=(ZONE_KIND[ZONE_ORDER[0]].r+1150)/PLANET_R;
  makeZone(_v.copy(startU).multiplyScalar(Math.cos(a)).addScaledVector(startF,Math.sin(a)).normalize().clone());
  let s=2718;
  const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  for(let tries=0;tries<500&&zones.length<6;tries++){
    const y=rnd()*1.6-.8,t=rnd()*Math.PI*2,r=Math.sqrt(1-y*y);
    const d=new V3(Math.cos(t)*r,y,Math.sin(t)*r);
    if(arcTo(d,startU)<ZONE_KIND.dispersa.r+1100)continue;
    if(zones.every(z=>arcTo(d,z.dir)>3400))makeZone(d);
  }
}
// dirección (unitaria) dentro de la zona: a "frac" del radio y con ángulo "t"
// Pendiente del terreno alrededor de un punto (0 plano, 1 a 45°)
const _slA=new V3(),_slB=new V3(),_slT=new V3();
function siteSlope(u,h){
  _slA.set(Math.abs(u.y)<.9?0:1,Math.abs(u.y)<.9?1:0,0);_slA.addScaledVector(u,-_slA.dot(u)).normalize();
  _slB.crossVectors(u,_slA);
  let m=0;
  for(const [e,sg] of [[_slA,1],[_slA,-1],[_slB,1],[_slB,-1]]){
    _slT.copy(u).addScaledVector(e,sg*14/PLANET_R).normalize();
    m=Math.max(m,Math.abs(heightAt(_slT.x,_slT.y,_slT.z,0)-h)/14);
  }
  return m;
}
function zoneDir(z,frac,t,out){
  const a=frac*z.r/PLANET_R,sa=Math.sin(a);
  return out.copy(z.dir).multiplyScalar(Math.cos(a)).addScaledVector(z.e1,sa*Math.cos(t)).addScaledVector(z.e2,sa*Math.sin(t)).normalize();
}
function zonePoint(z,minF,maxF,alt,out){
  zoneDir(z,minF+(maxF-minF)*Math.sqrt(Math.random()),Math.random()*Math.PI*2,_d);
  return out.copy(_d).multiplyScalar(PLANET_R+heightAt(_d.x,_d.y,_d.z,64)+alt);
}
// punto al azar a menos de "rad" metros de la dirección c, a "alt" metros del suelo
const _apE1=new V3(),_apE2=new V3();
function aroundPoint(c,rad,alt,out){
  _apE1.set(Math.abs(c.y)<.9?0:1,Math.abs(c.y)<.9?1:0,0);_apE1.addScaledVector(c,-_apE1.dot(c)).normalize();
  _apE2.crossVectors(_apE1,c);
  const t=Math.random()*Math.PI*2,a=rad*Math.sqrt(Math.random())/PLANET_R,sa=Math.sin(a);
  _d.copy(c).multiplyScalar(Math.cos(a)).addScaledVector(_apE1,sa*Math.cos(t)).addScaledVector(_apE2,sa*Math.sin(t)).normalize();
  return out.copy(_d).multiplyScalar(PLANET_R+heightAt(_d.x,_d.y,_d.z,64)+alt);
}

/* Naves enemigas: dardos oscuros con marcas naranjas, para no confundirlas con la propia */
function enemyGeometry(N,L,R,Sp,B,TL,TR){
  const top=[.22,.20,.24],aft=[1,.34,.12],belly=[.36,.10,.08],bellyD=[.22,.07,.07];
  const pos=[],col=[],tri=(a,b,c,k)=>{pos.push(...a,...b,...c);col.push(...k,...k,...k);};
  tri(N,L,Sp,top);tri(N,Sp,R,top);tri(L,TL,Sp,aft);tri(TL,TR,Sp,top);tri(TR,R,Sp,aft);
  tri(N,B,L,belly);tri(N,R,B,belly);tri(L,B,TL,bellyD);tri(TL,B,TR,bellyD);tri(TR,B,R,bellyD);
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));
  g.computeVertexNormals();return g;
}
// Torreta: cúpula baja con un cañón largo hacia -Z
function turretGeometry(){
  const pos=[],col=[],tri=(a,b,c,k)=>{pos.push(...a,...b,...c);col.push(...k,...k,...k);};
  const top=[.24,.21,.25],side=[.18,.12,.12],gun=[.9,.3,.1];
  const n=6,R=2.1,H=1.3,ring=[];
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2;ring.push([Math.cos(a)*R,0,Math.sin(a)*R]);}
  for(let i=0;i<n;i++){const a=ring[i],b=ring[(i+1)%n];tri([0,H,0],b,a,i%2?top:side);tri([0,-.6,0],a,b,side);}
  const bx=.32,y0=.55,z0=-.6,z1=-4.6,c=[[-bx,y0-bx],[bx,y0-bx],[bx,y0+bx],[-bx,y0+bx]];
  for(let i=0;i<4;i++){const [x1,yA]=c[i],[x2,yB]=c[(i+1)%4];tri([x1,yA,z0],[x2,yB,z0],[x2,yB,z1],gun);tri([x1,yA,z0],[x2,yB,z1],[x1,yA,z1],gun);}
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));
  g.computeVertexNormals();return g;
}
// Cajas sueltas con color propio: para armar piezas simples sin modelos
function boxesGeometry(list){
  const pos=[],col=[];
  for(const [x0,y0,z0,x1,y1,z1,c] of list){
    const v=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
    for(const [a,b,cc,d] of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]){
      pos.push(...v[a],...v[b],...v[cc],...v[a],...v[cc],...v[d]);
      for(let k=0;k<6;k++)col.push(...c);
    }
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));
  g.computeVertexNormals();return g;
}
// Lanzamisiles: una base con un cajón de cuatro tubos que apunta hacia -Z
function launcherGeometry(){
  const base=[.22,.2,.22],rack=[.30,.26,.20],tube=[.12,.11,.12],tip=[.95,.32,.12];
  return boxesGeometry([
    [-1.5,-.6,-1.5,1.5,.3,1.5,base],
    [-1.25,.3,-2.2,1.25,2.1,1.6,rack],
    [-1.05,.45,-2.35,-.2,1.15,-2.2,tube],[.2,.45,-2.35,1.05,1.15,-2.2,tube],
    [-1.05,1.25,-2.35,-.2,1.95,-2.2,tube],[.2,1.25,-2.35,1.05,1.95,-2.2,tube],
    [-.9,.55,-2.4,-.35,1.05,-2.35,tip],[.35,1.35,-2.4,.9,1.85,-2.35,tip]
  ]);
}
const ENEMY_GEO={
  caza:enemyGeometry([0,0,-3.4],[-2,-.05,1.5],[2,-.05,1.5],[0,.6,.5],[0,-.3,.6],[-.6,.06,1.2],[.6,.06,1.2]),
  pesada:enemyGeometry([0,0,-2.6],[-3,-.1,1.2],[3,-.1,1.2],[0,1,.2],[0,-.6,.4],[-1,.1,1.3],[1,.1,1.3]),
  interceptor:enemyGeometry([0,0,-4.6],[-1.5,-.05,1.9],[1.5,-.05,1.9],[0,.45,.8],[0,-.25,.9],[-.4,.05,1.7],[.4,.05,1.7]),
  dron:enemyGeometry([0,0,-2],[-1.6,0,.9],[1.6,0,.9],[0,.9,.2],[0,-.9,.2],[-.5,0,.9],[.5,0,.9]),
  torreta:turretGeometry(),
  lanzamisiles:launcherGeometry(),
  nodriza:enemyGeometry([0,0,-3],[-3.2,-.2,1.6],[3.2,-.2,1.6],[0,1.3,.4],[0,-.9,.3],[-1.6,.2,1.8],[1.6,.2,1.8])
};
// ram: daño si te choca (los drones se tiran encima). ground: fija en el suelo. carrier: la nodriza.
const ENEMY_DEF={
  caza:{name:'Caza',hp:3,patrol:48,attack:66,turn:1.05,hit:3.6,range:420,cone:Math.cos(7*DEG),burstN:3,coolA:1.7,coolB:1.2,dmg:8,breakDist:75,score:100,drop:.35,boom:9,scale:1},
  pesada:{name:'Pesada',hp:12,patrol:36,attack:46,turn:.55,hit:7.4,range:480,cone:Math.cos(8.5*DEG),burstN:4,coolA:2.4,coolB:1.2,dmg:14,breakDist:130,score:400,drop:1,boom:20,scale:2.1},
  interceptor:{name:'Interceptor',hp:2,patrol:62,attack:98,turn:1.35,hit:3.2,range:380,cone:Math.cos(6*DEG),burstN:2,coolA:1.3,coolB:.8,dmg:6,breakDist:150,breakTime:2.6,score:150,drop:.3,boom:8,scale:.9},
  dron:{name:'Dron',hp:1,patrol:58,attack:86,turn:1.9,hit:2.6,range:0,cone:2,burstN:0,coolA:99,coolB:0,dmg:0,breakDist:0,ram:12,score:40,drop:.06,boom:6,scale:.6},
  torreta:{name:'Torreta',hp:7,patrol:0,attack:0,turn:1.1,hit:7.5,range:680,radar:800,cone:Math.cos(5*DEG),burstN:3,coolA:2.2,coolB:1.4,dmg:9,breakDist:0,ground:true,score:250,drop:.5,boom:16,scale:2.2},
  // Lanzamisiles: te fija con línea de vista y tira un misil que te persigue (ver Misiles enemigos)
  lanzamisiles:{name:'Lanzamisiles',hp:6,patrol:0,attack:0,turn:.9,hit:7,range:1100,radar:900,cone:-1,burstN:0,coolA:99,coolB:0,dmg:0,breakDist:0,ground:true,launcher:true,lockTime:2.5,reload:9,score:300,drop:.6,boom:18,scale:2},
  nodriza:{name:'Nodriza',hp:60,patrol:30,attack:30,turn:.22,hit:16,range:560,cone:-1,gimbal:Math.PI,burstN:5,coolA:2.6,coolB:1.6,dmg:10,breakDist:0,carrier:true,score:2000,drop:1,boom:46,scale:5.2}
};
// Escuadrones posibles: cada tipo de zona va rotando entre los suyos
const GROUP_T={
  par:['caza','caza'],cazas:['caza','caza','caza'],escolta:['pesada','caza','caza'],
  intercept:['interceptor','interceptor'],enjambre:['dron','dron','dron','dron','dron','dron'],enjambre4:['dron','dron','dron','dron']
};
const enemyMat=new T.MeshLambertMaterial({vertexColors:true,emissive:0x1a0a08});
const enemySlots=Array.from({length:ENEMY_MAX},()=>{
  const mesh=new T.Mesh(ENEMY_GEO.caza,enemyMat);mesh.visible=false;
  const g=glow(0xff7a3c,2);g.position.set(0,.04,1.7);mesh.add(g);
  scene.add(mesh);
  return {mesh,free:true};
});
const freeSlots=()=>enemySlots.reduce((n,s)=>n+(s.free?1:0),0);
// Torres de las defensas de tierra: verticales, con la cabeza a 14 m. Se hunden 26 m en el suelo, así el terreno
// lejano (que se dibuja con menos detalle y puede quedar más alto o más bajo) nunca las deja flotando ni tapadas.
const TOWER_H=18,Y_AXIS=new V3(0,1,0);
const towerMat=new T.MeshLambertMaterial({color:0x50555f,emissive:0x0d0a0a});
const towerGeo=new T.CylinderGeometry(1.3,2.3,TOWER_H+26,6);towerGeo.translate(0,-(TOWER_H+26)/2,0);
const platGeo=new T.CylinderGeometry(3.4,3.0,1.1,6);platGeo.translate(0,-.55,0);
const towers=Array.from({length:12},()=>{
  const g=new T.Group();g.add(new T.Mesh(towerGeo,towerMat),new T.Mesh(platGeo,towerMat));
  g.visible=false;scene.add(g);return {g,free:true};
});
const _sp=new V3(),_eU=new V3(),_eT=new V3(),_eD=new V3(),_eP=new V3(),_eL=new V3(),_eR=new V3(),_eV=new V3(),_ex=new V3(),_ey=new V3(),_ez=new V3(),_eA=new V3();
const FORM_SLOTS=[[0,0,0],[-18,2,16],[18,2,16],[0,6,32],[-34,4,30],[34,4,30]];
function spawnGroup(z){
  const K=z.kind,idx=z.spawned++;
  const kinds=GROUP_T[K.mix[idx%K.mix.length]].slice();
  // Cada grupo tiene su lugar en la zona. En las dispersas, lo más lejos posible de los otros grupos.
  const others=groups.filter(o=>o.zone===z).map(o=>o.anchor);
  const anchor=new V3(),cand=new V3(),home=new V3();let best=-1;
  for(let t=0;t<12;t++){
    zoneDir(z,K.anchor[0]+(K.anchor[1]-K.anchor[0])*Math.random(),Math.random()*Math.PI*2,cand);
    aroundPoint(cand,K.patrol*.5,150+Math.random()*110,_sp);
    if(_sp.distanceTo(ship.pos)<520)continue; // que no nazcan en la cara
    const sep=others.length?Math.min(...others.map(o=>arcTo(cand,o))):1e9;
    const score=K.form>1?sep:Math.random();
    if(score>best){best=score;anchor.copy(cand);home.copy(_sp);}
  }
  if(best<0){zoneDir(z,K.anchor[1],Math.random()*Math.PI*2,anchor);aroundPoint(anchor,K.patrol*.5,200,home);}
  return makeGroup(z,kinds,home,anchor,K.form,false);
}
// Arma un escuadrón en "home", que después patrulla alrededor de "anchor" (dirección unitaria)
function makeGroup(z,kinds,home,anchor,form,alert){
  const g={zone:z,leader:null,members:[],wp:new V3(),anchor:anchor.clone(),state:'patrol',alert:!!alert,lostT:0};
  const u=home.clone().normalize();
  aroundPoint(anchor,z.kind.patrol,170,g.wp);
  const heading=g.wp.clone().sub(home);heading.addScaledVector(u,-heading.dot(u));
  if(heading.lengthSq()<1e-6)heading.copy(z.e1||_v.set(1,0,0)).addScaledVector(u,-heading.dot(u));
  heading.normalize();
  const side=new V3().crossVectors(heading,u).normalize();
  kinds.slice(0,freeSlots()).forEach((k,i)=>{
    const def=ENEMY_DEF[k],f=form*(k==='dron'?.55:1);
    const sl=FORM_SLOTS[i%FORM_SLOTS.length].map(v=>v*f),slot=enemySlots.find(s=>s.free); // formación más apretada o más abierta según la zona
    slot.free=false;
    slot.mesh.geometry=ENEMY_GEO[k];slot.mesh.material=enemyMat;slot.mesh.scale.setScalar(def.scale);slot.mesh.visible=true;
    const gl=slot.mesh.children[0];gl.position.set(0,.04,1.7);gl.material.color.set(0xff7a3c);gl.scale.setScalar(2);gl.material.opacity=1;
    const e={kind:k,def,group:g,slot,mesh:slot.mesh,on:true,hp:def.hp,speed:def.patrol,bank:0,cool:.6+Math.random()*2,burst:0,gap:0,breakT:0,
      breakDir:new V3(),ox:(Math.random()-.5)*120,oy:(Math.random()-.5)*60,sx:sl[0],sy:sl[1],sz:sl[2],
      pos:home.clone().addScaledVector(side,sl[0]).addScaledVector(u,sl[1]).addScaledVector(heading,-sl[2]),fwd:heading.clone()};
    e.mesh.position.copy(e.pos);
    enemies.push(e);g.members.push(e);
  });
  g.leader=g.members[0]||null;
  if(g.leader)groups.push(g);
  // Si nacen a la vista, un destello: no aparecen de la nada
  if(home.distanceTo(ship.pos)<900)flashAt(home,26);
  return g;
}
// Defensas de tierra (torretas y lanzamisiles): fijas sobre una torre. Cada una es un "grupo" de uno,
// así comparte la detección y el aviso con los escuadrones de su zona.
function spawnTurret(z,site){
  const kind=site.kind||'torreta',def=ENEMY_DEF[kind],slot=enemySlots.find(s=>s.free),tw=towers.find(t=>t.free);
  if(!slot||!tw)return null;
  slot.free=false;tw.free=false;site.on=true;
  const d=site.dir,top=PLANET_R+Math.max(heightAt(d.x,d.y,d.z,0),0)+TOWER_H;
  tw.g.position.copy(d).multiplyScalar(top);tw.g.quaternion.setFromUnitVectors(Y_AXIS,d);tw.g.visible=true;
  slot.mesh.geometry=ENEMY_GEO[kind];slot.mesh.material=enemyMat;slot.mesh.scale.setScalar(def.scale);slot.mesh.visible=true;
  // la luz del motor pasa a ser una baliza roja arriba de la cabeza
  const bc=slot.mesh.children[0];bc.position.set(0,1.9,0);bc.material.color.set(0xff2a1a);bc.scale.setScalar(7);
  const pos=d.clone().multiplyScalar(top+.65*def.scale);
  const fwd=z.e1.clone().addScaledVector(d,-z.e1.dot(d)).normalize().addScaledVector(d,.35).normalize();
  const g={zone:z,leader:null,members:[],wp:pos.clone(),anchor:d.clone(),state:'patrol',alert:false,lostT:0,ground:true,site};
  const e={kind,def,group:g,slot,mesh:slot.mesh,on:true,hp:def.hp,speed:0,bank:0,cool:1+Math.random()*2,burst:0,gap:0,breakT:0,
    breakDir:new V3(),ox:0,oy:0,sx:0,sy:0,sz:0,pos,fwd,tower:tw,lockT:0,reload:2+Math.random()*3,los:false,losT:0,blink:Math.random()*6};
  e.mesh.position.copy(pos);
  enemies.push(e);g.members.push(e);g.leader=e;groups.push(g);
  return g;
}
function flashAt(at,size){
  const f=flashes[flashNext];flashNext=(flashNext+1)%flashes.length;
  f.s.position.copy(at);f.t=0;f.size=size;
}
function removeEnemy(e){
  const i=enemies.indexOf(e);if(i>=0)enemies.splice(i,1);
  e.on=false;e.slot.free=true;e.mesh.visible=false;
  const g=e.group,mi=g.members.indexOf(e);if(mi>=0)g.members.splice(mi,1);
  if(g.leader===e)g.leader=g.members[0]||null;
  if(!g.members.length){const gi=groups.indexOf(g);if(gi>=0)groups.splice(gi,1);}
  if(g.site)g.site.on=false;
  if(e.tower){e.tower.free=true;e.tower.g.visible=false;e.tower=null;}
  if(target===e)target=null;
}
function killEnemy(e,scored){
  explode(e.pos,e.def.boom);
  if(e.misPart!==undefined&&e.misPart===mis.part)mis.kills++; // blanco de una misión
  if(e.group.site)e.group.site.alive=false; // torreta destruida: no vuelve
  if(scored){ship.kills++;addScore(e.def.score,true);maybeDrop(e.pos,e.def.drop);}
  removeEnemy(e);
  if(e.def.carrier)carrierDown(scored);
}
function alertGroup(g){g.alert=true;g.lostT=0;}
function hitEnemy(e,at,n){
  e.hp-=n||1;hitFlash=.14;
  alertGroup(e.group); // el que recibe un tiro te descubre, y avisa a los grupos cercanos
  burst(at,10,40,.4,1,.72,.35);sfxTick();
  if(e.hp<=0)killEnemy(e,true);
}
function stepZones(dt){
  zoneT-=dt;
  if(zoneT>0)return;
  zoneT=.25;
  _d.copy(ship.pos).normalize();
  const here=_v2.copy(_d);
  let inside=null;
  for(const z of zones){
    if(z.state!=='hostil')continue; // libre (ya la despejaste) o apagada (en los modos sin zonas)
    const arc=z.arc=arcTo(here,z.dir);
    if(dead<=0&&arc<=z.r)inside=z;
    const mine=groups.filter(g=>g.zone===z);
    const seen=detectGroups(z,mine,arc);
    if(arc<z.r+ZONE_WAKE){
      for(const s of z.sites)if(s.alive&&!s.on&&freeSlots()>=1)spawnTurret(z,s);
      const squads=mine.filter(g=>!g.ground).length;
      z.spawnT-=.25;
      const slack=carrier&&carrier.on&&carrier.group.alert?3:0; // deja lugar para los drones de la nodriza
      if(z.reserve>0&&z.spawnT<=0&&squads<z.kind.active&&freeSlots()>=2+slack){
        spawnGroup(z);z.reserve--;z.spawnT=seen?7:2;
      }
      if(z.reserve<=0&&!mine.length&&z.spawned>0&&z.sites.every(s=>!s.alive)&&dead<=0){ // sin reserva, sin naves y sin torretas: zona despejada
        z.state='libre';z.seen=false;z.wall.visible=false;
        if(curZone===z){curZone=null;inside=null;}
        addScore(z.kind.bonus,false);toast('Zona despejada · +'+z.kind.bonus,3);
        onZoneCleared(z);
      }
    }else if(arc>z.r+ZONE_SLEEP&&!seen&&mine.length){ // lejos de la nave se guardan, para no gastar teléfono
      mine.forEach(g=>{if(!g.ground)z.reserve++;g.members.slice().forEach(removeEnemy);});
    }
  }
  if(inside!==curZone){
    if(inside)toast('Entraste en zona '+inside.kind.name.toLowerCase(),2.5);
    else if(curZone&&dead<=0)toast('Saliste de la zona enemiga',1.8);
    curZone=inside;
  }
}
// Quién te ve: cada grupo por su cuenta según la distancia (de frente ven más lejos que de costado o de atrás),
// y el que te ve avisa a los grupos de su zona que estén cerca. En las zonas densas el aviso llega a todos.
function detectGroups(z,mine,arc){
  const out=dead>0||arc>z.r+ZONE_LEASH;
  for(const g of mine){
    const L=g.leader;if(!L)continue;
    _eA.copy(ship.pos).sub(L.pos);
    const d=_eA.length();
    if(g.alert){
      if(out||d>DETECT_LOSE){g.lostT+=.25;if(g.lostT>=DETECT_FORGET){g.alert=false;g.lostT=0;}}
      else g.lostT=0;
    }else if(!out){
      if(g.ground||L.def.carrier){if(d<(L.def.radar||L.def.range+120))alertGroup(g);} // defensas de tierra y nodriza: radar, ven para todos lados
      else{
        const front=Math.max(0,L.fwd.dot(_eA)/(d||1));
        if(d<DETECT_SIDE+(DETECT_FRONT-DETECT_SIDE)*front)alertGroup(g);
      }
    }
  }
  if(!out){
    for(let changed=true;changed;){
      changed=false;
      for(const g of mine){
        if(g.alert||!g.leader)continue;
        for(const o of mine){
          if(o.alert&&o.lostT===0&&o.leader&&o.leader.pos.distanceTo(g.leader.pos)<z.kind.link){alertGroup(g);changed=true;break;}
        }
      }
    }
  }
  const seen=mine.some(g=>g.alert);
  if(seen&&!z.seen&&dead<=0&&z!==waveZone)toast(mine.every(g=>g.alert)&&mine.length>1?'Te detectaron · vienen todos':'Te detectaron',2);
  z.seen=seen;
  return seen;
}
function stepEnemies(dt){
  seenVel.lerp(ship.vel,1-Math.exp(-dt/AIM.lag));
  for(const g of groups)g.state=(g.alert&&dead<=0)?'attack':'patrol';
  for(let i=enemies.length-1;i>=0;i--)stepEnemy(enemies[i],dt);
}
function stepEnemy(e,dt){
  if(e.def.ground){stepTurret(e,dt);return;}
  const g=e.group,def=e.def,p=e.pos,attacking=g.state==='attack'&&!def.carrier; // la nodriza no persigue: sigue su ruta y usa los cañones
  const r=p.length();
  _eU.copy(p).divideScalar(r);
  _eP.copy(ship.pos).sub(p);
  const dP=_eP.length();
  let wantSpeed=def.patrol;
  if(attacking&&def.ram){ // dron: se tira derecho adonde vas a estar
    _eT.copy(ship.pos).addScaledVector(seenVel,clamp(dP/(e.speed+30),0,2.5));
    wantSpeed=def.attack;
  }else if(attacking){
    e.breakT-=dt;
    if(e.breakT>0){ // pasó cerca: sigue de largo y después vuelve a buscarte
      _eT.copy(p).addScaledVector(e.fwd,200).addScaledVector(e.breakDir,120);
      wantSpeed=def.attack*1.1;
    }else{
      // de lejos se abren para rodearte; al entrar en alcance de tiro apuntan la trompa adonde vas a estar
      const k=clamp((dP-120)/320,0,1);
      _eT.copy(ship.pos).addScaledVector(seenVel,clamp(dP/(EB_SPEED+e.speed),0,1.6)).addScaledVector(right,e.ox*k).addScaledVector(U,e.oy*k);
      wantSpeed=dP>320?def.attack*1.25:def.attack;
      if(dP<def.breakDist){
        e.breakT=(def.breakTime||1.3)+Math.random()*.9;
        e.breakDir.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();
      }
    }
  }else if(e===g.leader){
    if(def.carrier){if(p.distanceTo(g.wp)<260)carrierNextWp(g);}
    else if(p.distanceTo(g.wp)<90)aroundPoint(g.anchor,g.zone.kind.patrol,170,g.wp); // patrulla alrededor de su lugar
    _eT.copy(g.wp);
  }else if(g.leader){ // en formación con el líder
    const L=g.leader;
    _eA.copy(L.pos).normalize();
    _eR.crossVectors(L.fwd,_eA).normalize();
    _eT.copy(L.pos).addScaledVector(_eR,e.sx).addScaledVector(_eA,e.sy).addScaledVector(L.fwd,-e.sz);
    wantSpeed=L.speed*clamp(.85+p.distanceTo(_eT)/70,.85,1.7);
  }
  _eD.copy(_eT).sub(p).normalize();

  // Evita el terreno, las rocas y a sus compañeros
  const altH=r-PLANET_R-heightAt(_eU.x,_eU.y,_eU.z,64);
  _eL.copy(p).addScaledVector(e.fwd,e.speed*.8);
  const rl=_eL.length(),altA=rl-PLANET_R-heightAt(_eL.x/rl,_eL.y/rl,_eL.z/rl,64);
  _eL.copy(p).addScaledVector(e.fwd,e.speed*1.7);
  const rl2=_eL.length(),altB=rl2-PLANET_R-heightAt(_eL.x/rl2,_eL.y/rl2,_eL.z/rl2,64);
  const need=attacking?45:70;
  const lift=Math.max(altA<need?(need-altA)/need:0,altB<need?(need-altB)/need:0,altH<need?(need-altH)/need:0);
  if(lift>0)_eD.addScaledVector(_eU,lift*4);
  if(r-PLANET_R>1050)_eD.addScaledVector(_eU,-(r-PLANET_R-1050)/100);
  for(const rk of activeRocks){
    _eA.copy(p).sub(rk.pos);
    const d=_eA.length();
    if(d<rk.bound+40){
      if(d<rk.bound*.62){lost.roca++;killEnemy(e,false);return;}
      _eD.addScaledVector(_eA,(1-(d-rk.bound)/40)*2.2/(d||1));
    }
  }
  for(const o of enemies){
    if(o===e)continue;
    _eA.copy(p).sub(o.pos);
    const d=_eA.length();
    if(d>0&&d<24)_eD.addScaledVector(_eA,(1-d/24)*1.2/d);
  }
  _eD.normalize();

  // Gira de a poco hacia donde quiere ir e inclina las alas al doblar
  const ang=Math.acos(clamp(e.fwd.dot(_eD),-1,1));
  let turnRate=0;
  if(ang>1e-4){
    _eA.crossVectors(e.fwd,_eD);
    if(_eA.lengthSq()<1e-8)_eA.copy(_eU);
    _eA.normalize();
    const step=Math.min(ang,def.turn*dt);
    _q.setFromAxisAngle(_eA,step);e.fwd.applyQuaternion(_q).normalize();
    turnRate=_eA.dot(_eU)*step/dt;
  }
  e.bank+=(clamp(turnRate,-1.2,1.2)-e.bank)*(1-Math.exp(-4*dt));
  e.speed+=(wantSpeed-e.speed)*(1-Math.exp(-1.2*dt));
  p.addScaledVector(e.fwd,e.speed*dt);

  _eR.crossVectors(e.fwd,_eU);
  if(_eR.lengthSq()<1e-6)_eR.set(1,0,0).addScaledVector(e.fwd,-e.fwd.x);
  _eR.normalize();
  _eV.crossVectors(_eR,e.fwd).normalize();
  const cb=Math.cos(e.bank),sb=Math.sin(e.bank);
  _ex.copy(_eR).multiplyScalar(cb).addScaledVector(_eV,sb);
  _ey.copy(_eV).multiplyScalar(cb).addScaledVector(_eR,-sb);
  _ez.copy(e.fwd).negate();
  _m.makeBasis(_ex,_ey,_ez);e.mesh.quaternion.setFromRotationMatrix(_m);
  e.mesh.position.copy(p);

  // Dispara en ráfagas cuando tiene la trompa apuntada adonde cree que vas a estar
  if(g.state==='attack'&&def.burstN>0&&dead<=0)enemyGuns(e,dP,dt);
  // Choques
  if(altH<1.5){lost.suelo++;killEnemy(e,false);return;}
  if(dead<=0&&inv<=0&&dodge.t<=0&&dP<def.hit+2.4){
    _eA.copy(_eP).negate();
    if(def.carrier){damage(ROCK_DAMAGE,_eA);inv=Math.max(inv,.8);} // chocar la nodriza duele, pero ella sigue
    else{damage(def.ram||ROCK_DAMAGE,_eA);killEnemy(e,!def.ram);}
  }
}
function enemyGuns(e,dP,dt){
  const def=e.def,p=e.pos;
  {
    e.cool-=dt;
    _eA.copy(ship.pos).addScaledVector(seenVel,dP/(EB_SPEED+e.speed)).sub(p).normalize();
    const facing=e.fwd.dot(_eA);
    if(e.cool<=0&&e.burst===0&&dP<def.range&&facing>def.cone)e.burst=def.burstN;
    if(e.burst>0){
      e.gap-=dt;
      if(e.gap<=0){
        fireEnemyBolt(e,dP);e.gap=.14;e.burst--;
        if(e.burst===0)e.cool=def.coolA+Math.random()*def.coolB;
      }
    }
  }
}
// Torreta: no se mueve. Gira el cañón hacia adonde vas a estar, nunca por debajo del horizonte.
const _tU=new V3();
function stepTurret(e,dt){
  const g=e.group,def=e.def,p=e.pos;
  _tU.copy(p).normalize();
  _eP.copy(ship.pos).sub(p);
  const dP=_eP.length(),attacking=g.state==='attack'&&dead<=0;
  if(attacking)_eD.copy(ship.pos).addScaledVector(seenVel,dP/EB_SPEED).sub(p).normalize();
  else{_q.setFromAxisAngle(_tU,.35*dt);_eD.copy(e.fwd).applyQuaternion(_q);} // vigila dando vueltas
  const el=_eD.dot(_tU),minEl=attacking?.06:.3;
  if(el<minEl)_eD.addScaledVector(_tU,minEl-el).normalize();
  const ang=Math.acos(clamp(e.fwd.dot(_eD),-1,1));
  if(ang>1e-4){
    _eA.crossVectors(e.fwd,_eD);
    if(_eA.lengthSq()>1e-10){_eA.normalize();_q.setFromAxisAngle(_eA,Math.min(ang,def.turn*dt));e.fwd.applyQuaternion(_q).normalize();}
  }
  _eR.crossVectors(e.fwd,_tU);
  if(_eR.lengthSq()<1e-6)_eR.set(1,0,0);
  _eR.normalize();
  _ey.crossVectors(_eR,e.fwd).normalize();
  _ez.copy(e.fwd).negate();
  _m.makeBasis(_eR,_ey,_ez);e.mesh.quaternion.setFromRotationMatrix(_m);
  e.blink+=dt;const bc=e.mesh.children[0];bc.material.opacity=(e.blink%1.4)<.25?1:.18; // baliza que titila: se las ve de lejos
  if(def.launcher)launcherStep(e,dt,dP,attacking);
  else if(attacking&&_eP.dot(_tU)/(dP||1)>.08)enemyGuns(e,dP,dt);
  if(dead<=0&&inv<=0&&dodge.t<=0&&dP<def.hit+2.4){_eA.copy(_eP).negate();damage(ROCK_DAMAGE,_eA);killEnemy(e,true);}
}

/* Disparos enemigos */
const EB_MAX=36,EB_SPEED=270;
const eBoltMesh=new T.InstancedMesh(new T.BoxGeometry(.42,.42,6),new T.MeshBasicMaterial({color:0xff8a4a,blending:T.AdditiveBlending,transparent:true,depthWrite:false,fog:false}),EB_MAX);
eBoltMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);eBoltMesh.frustumCulled=false;eBoltMesh.count=0;scene.add(eBoltMesh);
const eBolts=Array.from({length:EB_MAX},()=>({on:false,p:new V3(),prev:new V3(),v:new V3(),q:new Q(),life:0,dmg:8}));
let eBoltNext=0;
const seenVel=new V3(); // tu velocidad como la ven ellos: con retraso
const _aimR=new V3(),_aimAx=new V3(),_aimQ=new Q();
function fireEnemyBolt(e,dP){
  const b=eBolts[eBoltNext];eBoltNext=(eBoltNext+1)%EB_MAX;
  if(e.def.carrier)b.p.copy(e.pos).addScaledVector(_aimR.copy(e.pos).normalize(),1.3*e.def.scale); // cañones arriba del casco
  else b.p.copy(e.pos).addScaledVector(e.fwd,3*e.def.scale);
  b.prev.copy(b.p);
  const speed=EB_SPEED+e.speed,gimbal=e.def.gimbal||AIM.gimbal;
  // adonde cree que vas a estar, más un error en metros que nunca baja de AIM.errMin
  do{_aimR.set(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1);}while(_aimR.lengthSq()>1);
  _eA.copy(ship.pos).addScaledVector(seenVel,dP/speed).addScaledVector(_aimR,AIM.errMin+dP*AIM.errK).sub(b.p).normalize();
  // el cañón sale por la trompa y corrige poco: si la nave no te apunta, la bala no te busca
  const ang=Math.acos(clamp(e.fwd.dot(_eA),-1,1));
  if(ang>gimbal){
    _aimAx.crossVectors(e.fwd,_eA);
    if(_aimAx.lengthSq()>1e-10){_aimAx.normalize();_aimQ.setFromAxisAngle(_aimAx,gimbal);_eA.copy(e.fwd).applyQuaternion(_aimQ);}
    else _eA.copy(e.fwd);
  }
  b.q.setFromUnitVectors(Z_AXIS,_eA);
  b.v.copy(_eA).multiplyScalar(speed);
  b.life=1.7;b.dmg=e.def.dmg*(e.dmgK||1);b.on=true; // dmgK: munición de práctica en las misiones
  if(dP+80>speed*1.7)b.life=(dP+80)/speed; // las torretas tiran más lejos
  sfxEnemyShot();
}
// ¿La bala tocó la nave? Primero una bola grande (barato) y después la forma real:
// el triángulo de la nave visto desde arriba y su poco espesor.
const _hInv=new Q(),_hS=new V3(),_hP=new V3();
function boltHitsShip(a,b){
  if(!segmentSphereHit(a,b,ship.pos,3.4))return false;
  _hInv.copy(ship.q).invert();
  _hS.copy(b).sub(a);
  const n=Math.min(48,Math.ceil(_hS.length()/.35));
  for(let i=0;i<=n;i++){
    _hP.copy(a).addScaledVector(_hS,i/n).sub(ship.pos).applyQuaternion(_hInv);
    if(Math.abs(_hP.y-.12)>.62)continue;
    // dentro del triángulo punta (0,-3), alas (±2.4,1.6), con medio metro de margen por el grosor de la bala
    const x=Math.abs(_hP.x),z=_hP.z,m=.45;
    if(z>1.6+m||z<-3-m)continue;
    if(x*4.6-(z+3)*2.4>m*5.19)continue; // borde de la punta al ala (5.19 = largo del borde)
    return true;
  }
  return false;
}
function stepEnemyBolts(dt){
  let count=0;
  for(const b of eBolts){
    if(!b.on)continue;
    b.prev.copy(b.p);b.p.addScaledVector(b.v,dt);b.life-=dt;
    if(b.life<=0){b.on=false;continue;}
    const br=b.p.length();
    if(br-PLANET_R<MAX_H&&br<=PLANET_R+heightAt(b.p.x/br,b.p.y/br,b.p.z/br,64)){burst(b.p,6,20,.4,.6,.5,.4);b.on=false;continue;}
    if(dead<=0&&inv<=0&&dodge.t<=0&&boltHitsShip(b.prev,b.p)){
      b.on=false;damage(b.dmg,b.v);
      continue;
    }
    _m.compose(b.p,b.q,_one);eBoltMesh.setMatrixAt(count++,_m);
  }
  eBoltMesh.count=count;eBoltMesh.instanceMatrix.needsUpdate=true;
}

/* ---------- Daño, escudo y recalentamiento ---------- */
const elBarShield=$('#barShield'),elBarHull=$('#barHull'),elBarDodge=$('#barDodge'),elVitals=$('#vitals'),elHeat=$('#heatBar'),elFx=$('#speedFx'),elHurt=$('#hurt'),elDmg=$('#dmgDir'),elToast=$('#toast'),elLead=$('#lead'),elZoneMk=$('#zoneMk'),elZoneDist=$('#zoneDist');
let hurtA=0,dmgA=0,toastT=0,hitFlash=0,smokeT=0,sparkT=0,alarmT=0,wasTurbo=false,vitT=0,zoneMkT=0;
const shieldFx=glow(0x86f2e4,8);shieldFx.material.opacity=0;shipGroup.add(shieldFx);
function toast(text,secs){elToast.textContent=text;elToast.hidden=false;toastT=secs||1.2;}
function damage(n,dir){
  if(dead>0||inv>0)return;
  shieldWait=SHIELD_DELAY;
  const onShield=Math.min(shield,n);
  shield-=onShield;hull-=n-onShield;
  if(run.mode==='historia')mis.dmg+=Math.min(n,shield+hull+n); // shield+hull+n: lo que había antes del golpe
  if(repairT>0)endRepair(true); // cualquier golpe corta la reparación
  if(settings.vibrate&&navigator.vibrate)try{navigator.vibrate(n>=20?60:30);}catch(e){}
  elHurt.classList.toggle('shield',n-onShield<=0);
  hurtA=n-onShield<=0?.55:1;
  if(n-onShield<=0){shieldFx.material.opacity=.5;sfxShieldHit();}
  else{sfxHullHit();if(!reduceMotion)shake=Math.max(shake,1.1);}
  if(dir){ // arco que marca de dónde vino el golpe
    _eA.copy(ship.pos).sub(_v.copy(dir).normalize().multiplyScalar(60)).applyMatrix4(camera.matrixWorldInverse);
    elDmg.style.transform='rotate('+(Math.atan2(_eA.x,_eA.y)*180/Math.PI).toFixed(1)+'deg)';
    dmgA=1;
  }
  if(hull<=0){hull=0;crash('combate');}
}
const _n2=new V3();
function rockHit(r){
  _n2.copy(ship.pos).sub(r.pos).normalize();
  ship.pos.addScaledVector(_n2,2.4);
  const vn=fwd.dot(_n2);
  if(vn<0){ // la trompa rebota contra la roca
    _d.copy(fwd).addScaledVector(_n2,-1.6*vn).normalize();
    _q.setFromUnitVectors(fwd,_d);
    ship.q.premultiply(_q).normalize();
    fwd.copy(_d);right.set(1,0,0).applyQuaternion(ship.q);up.set(0,1,0).applyQuaternion(ship.q);
  }
  ship.vel.copy(_n2).multiplyScalar(Math.max(ship.speed*.8,40));
  bounceT=.55;
  if(inv<=0&&hitInv<=0){
    hitInv=.9;
    burst(ship.pos,24,40,.5,1,.7,.4);
    if(!reduceMotion)shake=Math.max(shake,2.4);
    damage(ROCK_DAMAGE,_n2.clone().negate());
  }
}
function stepHeat(dt){
  if(overheat>0){
    overheat=Math.max(0,overheat-dt);
    heat=Math.max(0,heat-dt/COOL_TIME);
    return;
  }
  const over=ship.throttle-CRUISE;
  heat=clamp(over>.001?heat+over/(1-CRUISE)*dt/HEAT_TIME:heat-dt/COOL_TIME,0,1);
  if(heat>=1){ // se pasó: el motor cae un rato y la barra vuelve a crucero
    overheat=OVERHEAT_LOCK;ship.throttle=CRUISE;showThrust();
    blip(240,70,.5,.08,'sawtooth');
  }
}
/* Mira de punto de impacto: el enemigo más cerca de la nariz, y hacia dónde conviene apuntar para pegarle */
let target=null,targetAssist=0;
const leadPoint=new V3();
function updateTarget(){
  target=null;targetAssist=0;
  if(!run.assist)return; // Extremo: sin marca de impacto ni corrección de tiros
  let best=.978;
  for(const e of enemies){
    _eA.copy(e.pos).sub(ship.pos);
    const d=_eA.length();
    if(d>620||d<5)continue;
    const c=_eA.dot(fwd)/d;
    if(c>best){best=c;target=e;}
  }
  if(camTarget&&camTarget.on&&camTarget!==target){ // el blanco elegido tiene prioridad si está al alcance de la mira
    _eA.copy(camTarget.pos).sub(ship.pos);
    const d=_eA.length();
    if(d<=620&&d>=5&&_eA.dot(fwd)/d>.978)target=camTarget;
  }
  if(target){
    const t=target.pos.distanceTo(ship.pos)/(BOLT_SPEED+ship.speed);
    leadPoint.copy(target.pos).addScaledVector(target.fwd,target.speed*t);
    _eA.copy(leadPoint).sub(ship.pos).normalize();
    targetAssist=sstep(.978,.995,_eA.dot(fwd));
  }
}
/* ---------- Botón Blanco: tocar elige o cambia de enemigo, mantener lo suelta ---------- */
function tgtCandidates(){
  return enemies.filter(e=>e.on&&e.pos.distanceTo(ship.pos)<TGT_RANGE);
}
// El primero: el que está más adelante de la nariz, con preferencia por los cercanos y los que te atacan
function tgtBest(){
  let best=null,bs=-1e9;
  for(const e of tgtCandidates()){
    _eA.copy(e.pos).sub(ship.pos);
    const d=_eA.length(),s=_eA.dot(fwd)/(d||1)*1.2-d/TGT_RANGE+(e.group.state==='attack'?.3:0);
    if(s>bs){bs=s;best=e;}
  }
  return best;
}
// Los siguientes: de más cerca a más lejos, y vuelve a empezar
function tgtNext(){
  const list=tgtCandidates().sort((a,b)=>a.pos.distanceTo(ship.pos)-b.pos.distanceTo(ship.pos));
  if(!list.length)return null;
  return list[(list.indexOf(camTarget)+1)%list.length];
}
function tgtTap(){
  if(dead>0)return;
  const t=camTarget&&camTarget.on?tgtNext():tgtBest();
  if(!t){toast('No hay enemigos cerca',1.2);return;}
  if(t===camTarget){toast('Es el único enemigo cerca',1.1);return;}
  camTarget=t;blip(1150,1500,.06,.03,'square');
  if(!tgtHint){tgtHint=true;toast('Tocá para cambiar · Mantené para soltar',2.6);}
}
function tgtOff(silent){
  if(camTarget&&!silent){blip(900,560,.09,.03,'square');toast('Blanco suelto',1);}
  camTarget=null;
}
function tgtPress(){
  if(tgtTimer)clearTimeout(tgtTimer);
  tgtTimer=setTimeout(()=>{tgtTimer=0;tgtOff(false);},TGT_HOLD);
}
function tgtRelease(){
  if(!tgtTimer)return; // ya lo soltó al mantener
  clearTimeout(tgtTimer);tgtTimer=0;tgtTap();
}
function tgtCancel(){if(tgtTimer){clearTimeout(tgtTimer);tgtTimer=0;}}
function stepCamTarget(){
  if(!camTarget)return;
  if(dead>0){camTarget=null;return;}
  if(!camTarget.on){ // el blanco cayó o se retiró: pasa solo al siguiente
    camTarget=tgtBest();
    if(camTarget)blip(1150,1500,.06,.025,'square');else toast('Sin blancos cerca',1.2);
    return;
  }
  if(camTarget.pos.distanceTo(ship.pos)>TGT_RANGE*1.25){camTarget=null;toast('Blanco perdido',1.2);}
}

/* ---------- Reparación: se activa con un toque y cualquier golpe la corta ---------- */
const repairFx=glow(0xa5e36f,7);repairFx.material.opacity=0;shipGroup.add(repairFx);
function tryRepair(){
  if(dead>0||repairT>0)return;
  if(repairCool>0){toast('Reparación en recarga · '+Math.ceil(repairCool)+' s',1.2);return;}
  if(hull>=HULL_MAX){toast('La vida está completa',1.2);return;}
  repairT=REPAIR_TIME;toast('Reparando',1.2);sfxPickup();
}
function endRepair(cut){
  repairT=0;repairCool=REPAIR_COOL;
  if(cut)toast('Reparación cortada',1.6);
}
function stepRepair(dt){
  if(repairT>0&&dead<=0){
    repairT-=dt;
    hull=Math.min(HULL_MAX,hull+REPAIR_AMOUNT/REPAIR_TIME*dt);
    repairFx.material.opacity=.26+.16*Math.sin(ship.t*9);
    repairFxT-=dt;
    if(repairFxT<=0){
      repairFxT=.07;
      _a.copy(ship.pos).add(_v.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(2+Math.random()*2));
      burst(_a,1,5,.5,.42,.95,.45);
    }
    if(repairT<=0||hull>=HULL_MAX)endRepair(false);
  }else{
    repairFx.material.opacity=0;
    if(repairCool>0)repairCool=Math.max(0,repairCool-dt);
  }
}

/* ---------- Misiles guiados: se mantiene apretado el botón para fijar el blanco y se dispara al soltar ---------- */
function lockCancel(){lockOn=false;lockTarget=null;lockP=0;}
function lockStart(){
  if(dead>0)return;
  if(missiles<=0){toast('Sin misiles',1);return;}
  lockOn=true;lockTarget=null;lockP=0;lockBeep=0;
}
function lockRelease(){
  if(!lockOn)return;
  const t=lockTarget,ready=t&&t.on&&lockP>=1&&missiles>0&&dead<=0;
  lockCancel();
  if(ready)launchMissile(t);
  else if(dead<=0&&missiles>0)toast('Sin blanco fijado',1); // no gasta el misil
}
function stepLock(dt){
  if(!lockOn)return;
  let best=null,bestC=LOCK_CONE,curOk=false;
  for(const e of enemies){
    _eA.copy(e.pos).sub(ship.pos);
    const d=_eA.length();
    if(d>LOCK_RANGE||d<5)continue;
    const c=_eA.dot(fwd)/d;
    if(c<=LOCK_CONE)continue;
    if(e===lockTarget)curOk=true;
    if(c>bestC){bestC=c;best=e;}
  }
  if(camTarget&&camTarget.on&&lockTarget!==camTarget){ // el misil prefiere el blanco elegido si entra en el cono
    _eA.copy(camTarget.pos).sub(ship.pos);
    const d=_eA.length();
    if(d<=LOCK_RANGE&&d>=5&&_eA.dot(fwd)/d>LOCK_CONE){lockTarget=camTarget;lockP=0;curOk=true;}
  }
  if(!curOk){lockTarget=best;lockP=0;}
  if(!lockTarget)return;
  lockP=Math.min(1,lockP+dt/LOCK_TIME);
  lockBeep-=dt;
  if(lockBeep<=0){
    lockBeep=lockP>=1?.11:.26;
    if(lockP>=1)blip(1640,1640,.06,.035,'square');else blip(980,980,.05,.025,'square');
  }
}
const rocketGeo=new T.ConeGeometry(.3,2.6,8);rocketGeo.rotateX(-Math.PI/2);
const NOSE=new V3(0,0,-1);
const rockets=Array.from({length:6},()=>{
  const mesh=new T.Mesh(rocketGeo,new T.MeshLambertMaterial({color:0xf0ece2,emissive:0x2a2a2a,fog:false}));
  const g=glow(0xffb45c,3.4);g.position.z=1.5;mesh.add(g);
  mesh.visible=false;scene.add(mesh);
  return {mesh,on:false,pos:new V3(),prev:new V3(),dir:new V3(),speed:0,life:0,target:null,smokeT:0,warned:false};
});
function launchMissile(t){
  const m=rockets.find(x=>!x.on);if(!m)return;
  missiles--;
  if(missileT<=0&&missileRegen)missileT=MISSILE_RELOAD;
  const side=ship.side=1-ship.side;
  m.pos.copy(side?muzzleR:muzzleL).applyQuaternion(ship.q).add(ship.pos).addScaledVector(up,-.5);
  m.prev.copy(m.pos);m.dir.copy(fwd);m.speed=ship.speed+25;m.life=MISSILE_LIFE;m.target=t;m.on=true;m.smokeT=0;m.warned=false;
  m.mesh.position.copy(m.pos);m.mesh.quaternion.setFromUnitVectors(NOSE,m.dir);m.mesh.visible=true;
  (side?flashR:flashL).material.opacity=1;
  alertGroup(t.group); // un misil lanzado delata tu posición al grupo de su blanco
  sfxMissile();
}
function blowMissile(m){
  const at=m.pos.clone();
  m.on=false;m.mesh.visible=false;
  explode(at,8);
  // Daño de lleno al que esté pegado, y una parte a los que estén cerca
  enemies.slice().forEach(e=>{
    const d=e.pos.distanceTo(at);
    if(d<e.def.hit+4)hitEnemy(e,at,MISSILE_DMG);
    else if(d<SPLASH_R)hitEnemy(e,at,SPLASH_DMG);
  });
}
function stepMissiles(dt){
  for(const m of rockets){
    if(!m.on)continue;
    m.life-=dt;
    if(m.life<=0){blowMissile(m);continue;}
    if(m.target&&!m.target.on){ // si el blanco ya cayó, busca al más cercano adelante
      m.target=null;
      let bd=500;
      for(const e of enemies){
        _eA.copy(e.pos).sub(m.pos);
        const d=_eA.length();
        if(d<bd&&_eA.dot(m.dir)/(d||1)>.5){bd=d;m.target=e;}
      }
    }
    if(m.target){
      const tg=m.target,dist=tg.pos.distanceTo(m.pos);
      _eT.copy(tg.pos).addScaledVector(tg.fwd,tg.speed*dist/Math.max(m.speed,60)*.6);
      _eD.copy(_eT).sub(m.pos).normalize();
      const ang=Math.acos(clamp(m.dir.dot(_eD),-1,1));
      if(ang>1e-4){
        _eA.crossVectors(m.dir,_eD);
        if(_eA.lengthSq()>1e-8){
          _q.setFromAxisAngle(_eA.normalize(),Math.min(ang,MISSILE_TURN*dt));
          m.dir.applyQuaternion(_q).normalize();
        }
      }
      // Algunos enemigos intentan esquivar en el último momento
      if(!m.warned&&dist<170){
        m.warned=true;
        if(Math.random()<.4){tg.breakT=1.1;tg.breakDir.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();}
      }
    }
    m.speed+=(MISSILE_SPEED-m.speed)*(1-Math.exp(-1.7*dt));
    m.prev.copy(m.pos);m.pos.addScaledVector(m.dir,m.speed*dt);
    m.mesh.position.copy(m.pos);m.mesh.quaternion.setFromUnitVectors(NOSE,m.dir);
    m.smokeT-=dt;
    if(m.smokeT<=0){m.smokeT=.045;emitSmoke(m.pos,1.5,.6,.72,false);}

    let boom=false;
    for(const e of enemies){if(segmentSphereHit(m.prev,m.pos,e.pos,e.def.hit+2)){boom=true;break;}}
    if(!boom){
      const mr=m.pos.length();
      if(mr-PLANET_R<MAX_H&&mr<=PLANET_R+heightAt(m.pos.x/mr,m.pos.y/mr,m.pos.z/mr,64))boom=true;
    }
    if(!boom)for(const r of activeRocks){if(r.mesh&&m.pos.distanceTo(r.pos)<r.bound&&insideRock(r,m.pos)){boom=true;break;}}
    if(boom)blowMissile(m);
  }
}

function stepCombat(dt){
  stepHeat(dt);
  stepRepair(dt);
  if(missileRegen&&missiles<MISSILE_MAX&&missileT>0){
    missileT-=dt;
    if(missileT<=0){missiles++;missileT=missiles<MISSILE_MAX?MISSILE_RELOAD:0;}
  }
  stepCamTarget();
  stepLock(dt);
  if(dodge.t>0)dodge.t=Math.max(0,dodge.t-dt);
  if(dodge.cool>0)dodge.cool=Math.max(0,dodge.cool-dt);
  if(bounceT>0)bounceT-=dt;
  if(hitInv>0)hitInv-=dt;
  if(hitFlash>0)hitFlash-=dt;
  shieldFx.material.opacity*=Math.exp(-7*dt);
  if(dead<=0){
    if(shieldWait>0)shieldWait-=dt;
    else if(shield<SHIELD_MAX)shield=Math.min(SHIELD_MAX,shield+SHIELD_REGEN*dt);
    // Daño visible: humo con media vida, chispas y alarma cuando queda poca
    if(hull<50){
      smokeT-=dt;
      if(smokeT<=0){smokeT=hull<25?.045:.09;_a.copy(TAIL).applyQuaternion(ship.q).add(ship.pos);emitSmoke(_a,hull<25?3.4:2.4,1.1);}
    }
    if(hull<25){
      sparkT-=dt;
      if(sparkT<=0){sparkT=.22;_a.copy(Math.random()<.5?WING_L:WING_R).applyQuaternion(ship.q).add(ship.pos);burst(_a,5,18,.35,1,.6,.25);}
      alarmT-=dt;
      if(alarmT<=0){alarmT=.8;blip(660,520,.16,.04,'sawtooth');}
    }
    const tf=ship.tf;
    if(tf>.05&&!reduceMotion)shake=Math.max(shake,tf*.16);
    if(tf>.3&&!wasTurbo){wasTurbo=true;startShock();sfxWhoosh();}
    else if(tf<.1)wasTurbo=false;
  }
  if(combo>0&&ship.t-lastKill>COMBO_TIME)combo=0;
  stepShock(dt);
  updateTarget();
}
/* Estallido al entrar en turbo */
const shockRing=new T.Mesh(new T.RingGeometry(.86,1,48),new T.MeshBasicMaterial({color:0xcffcf4,blending:T.AdditiveBlending,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide,fog:false}));
shockRing.visible=false;scene.add(shockRing);
let shockT=1;
function startShock(){shockT=0;shockRing.visible=true;shockRing.position.copy(ship.pos);shockRing.quaternion.copy(ship.q);if(!reduceMotion)shake=Math.max(shake,.7);}
function stepShock(dt){
  if(shockT>=1)return;
  shockT=Math.min(1,shockT+dt/.5);
  shockRing.scale.setScalar(2+shockT*26);
  shockRing.material.opacity=(1-shockT)*.8;
  if(shockT>=1)shockRing.visible=false;
}

/* ---------- Misiles enemigos: los lanzamisiles te fijan con línea de vista y tiran un misil que te persigue ----------
   Se esquiva con la evasión (le hace perder el rastro), con turbo a fondo (va apenas más lento que tu velocidad máxima)
   o poniendo una montaña en el medio. */
const EM={speed:118,turn:1.25,life:11,dmg:30,fuse:7,accel:60};
const threat={lock:0,incoming:0,beepT:0};
const eMslMat=new T.MeshLambertMaterial({color:0xb8392b,emissive:0x3a0a06,fog:false});
const eMsl=Array.from({length:6},()=>{
  const mesh=new T.Mesh(rocketGeo,eMslMat);mesh.scale.setScalar(1.4);
  const g=glow(0xff5a2a,3.6);g.position.z=1.5;mesh.add(g);
  mesh.visible=false;scene.add(mesh);
  return {mesh,on:false,pos:new V3(),vel:new V3(),life:0,track:false,smokeT:0};
});
const _los=new V3();
function lineOfSight(a,b){
  for(let i=1;i<10;i++){
    _los.copy(a).lerp(b,i/10);
    const r=_los.length();_los.divideScalar(r);
    if(r<PLANET_R+heightAt(_los.x,_los.y,_los.z,64)+2)return false;
  }
  return true;
}
function launcherStep(e,dt,dP,attacking){
  const def=e.def;
  e.reload=Math.max(0,e.reload-dt);
  e.losT-=dt;
  if(e.losT<=0){e.losT=.25;e.los=attacking&&dP<def.range&&lineOfSight(e.pos,ship.pos);}
  const can=attacking&&dead<=0&&e.reload<=0&&dP<def.range&&e.los&&dodge.t<=0;
  if(can)e.lockT+=dt;else e.lockT=Math.max(0,e.lockT-dt*1.5);
  if(e.lockT>0)threat.lock=Math.max(threat.lock,Math.min(1,e.lockT/def.lockTime));
  if(e.lockT>=def.lockTime){e.lockT=0;e.reload=def.reload;fireEnemyMissile(e);}
}
function fireEnemyMissile(e){
  const m=eMsl.find(x=>!x.on);if(!m)return;
  const u=_v.copy(e.pos).normalize();
  m.pos.copy(e.pos).addScaledVector(u,3);
  m.vel.copy(ship.pos).sub(m.pos).normalize().addScaledVector(u,.6).normalize().multiplyScalar(40); // sale hacia arriba y se endereza
  m.life=EM.life;m.track=true;m.on=true;m.smokeT=0;m.mesh.visible=true;
  m.mesh.position.copy(m.pos);
  blip(160,520,.45,.05,'sawtooth');
}
function killEnemyMissile(m,boom){if(boom)explode(m.pos,boom);m.on=false;m.mesh.visible=false;}
const _mT=new V3(),_mD=new V3(),_mA=new V3();
function stepEnemyMissiles(dt){
  let incoming=0;
  for(const m of eMsl){
    if(!m.on)continue;
    m.life-=dt;
    if(m.life<=0){killEnemyMissile(m,5);continue;}
    if(m.track&&(dodge.t>0||dead>0))m.track=false; // la evasión le hace perder el rastro
    _mT.copy(ship.pos).sub(m.pos);
    const d=_mT.length(),sp=m.vel.length(),nsp=Math.min(EM.speed,sp+EM.accel*dt);
    if(m.track&&m.vel.dot(_mT)<-.3*d*sp)m.track=false; // ya te pasó de largo
    if(m.track){
      _mD.copy(ship.pos).addScaledVector(ship.vel,Math.min(d/EM.speed,2)*.6).sub(m.pos).normalize();
      _mA.copy(m.vel).normalize();
      const ang=Math.acos(clamp(_mA.dot(_mD),-1,1));
      if(ang>1e-4){_eA.crossVectors(_mA,_mD);if(_eA.lengthSq()>1e-10){_eA.normalize();_mA.applyAxisAngle(_eA,Math.min(ang,EM.turn*dt));}}
      m.vel.copy(_mA).multiplyScalar(nsp);
      incoming++;
    }else m.vel.setLength(nsp);
    m.pos.addScaledVector(m.vel,dt);
    m.mesh.position.copy(m.pos);m.mesh.quaternion.setFromUnitVectors(NOSE,_mA.copy(m.vel).normalize());
    m.smokeT-=dt;if(m.smokeT<=0){m.smokeT=.05;emitSmoke(m.pos,1.8,.8,.6,false);}
    const r=m.pos.length();_mD.copy(m.pos).divideScalar(r);
    if(r<PLANET_R+heightAt(_mD.x,_mD.y,_mD.z,64)+1){killEnemyMissile(m,8);continue;} // contra el suelo o la montaña
    if(m.track&&dead<=0&&inv<=0&&_mT.copy(ship.pos).sub(m.pos).length()<EM.fuse){
      damage(EM.dmg,_mA.copy(_mT).negate().normalize());killEnemyMissile(m,11);
    }
  }
  threat.incoming=incoming;
}

// Aviso en pantalla: ámbar mientras te fijan (pita cada vez más rápido), rojo con un misil en camino
const elWarn=$('#warn'),emks=[];
for(let i=0;i<6;i++){const d=document.createElement('i');d.className='emk';d.hidden=true;$('#emks').appendChild(d);emks.push(d);}
function updateThreat(dt){
  const inc=threat.incoming>0&&dead<=0,lk=threat.lock>0&&!inc&&dead<=0;
  if(inc||lk){
    elWarn.hidden=false;elWarn.classList.toggle('msl',inc);
    const txt=inc?'¡Misil! Esquivá o acelerá':'Te están fijando';
    if(elWarn.textContent!==txt)elWarn.textContent=txt;
    threat.beepT-=dt;
    if(threat.beepT<=0){
      threat.beepT=inc?.13:.55-.4*threat.lock;
      if(inc)blip(2100,1800,.06,.035,'square');else blip(1300,1300,.07,.03,'square');
      elWarn.classList.toggle('blink');
    }
  }else if(!elWarn.hidden){elWarn.hidden=true;threat.beepT=0;}
  eMsl.forEach((m,i)=>{
    const el=emks[i];
    if(!m.on||!m.track||dead>0){if(!el.hidden)el.hidden=true;return;}
    screenSpot(m.pos,_spot);el.hidden=false;
    el.style.transform='translate('+_spot.x.toFixed(1)+'px,'+_spot.y.toFixed(1)+'px) rotate(45deg)';
  });
}

/* ---------- Humo ---------- */
const SMOKE_N=120,smG=new Float32Array(SMOKE_N),smPos=new Float32Array(SMOKE_N*3),smA=new Float32Array(SMOKE_N),smS=new Float32Array(SMOKE_N),smVel=new Float32Array(SMOKE_N*3),smLife=new Float32Array(SMOKE_N),smMax=new Float32Array(SMOKE_N),smBase=new Float32Array(SMOKE_N);
let smNext=0;
const smGeo=new T.BufferGeometry();
smGeo.setAttribute('position',new T.BufferAttribute(smPos,3).setUsage(T.DynamicDrawUsage));
smGeo.setAttribute('aA',new T.BufferAttribute(smA,1).setUsage(T.DynamicDrawUsage));
smGeo.setAttribute('aS',new T.BufferAttribute(smS,1).setUsage(T.DynamicDrawUsage));
smGeo.setAttribute('aG',new T.BufferAttribute(smG,1).setUsage(T.DynamicDrawUsage));
const smU={uMap:{value:softTex},uScale:{value:400}};
const smoke=new T.Points(smGeo,new T.ShaderMaterial({uniforms:smU,transparent:true,depthWrite:false,fog:false,
  vertexShader:`attribute float aA;attribute float aS;attribute float aG;uniform float uScale;varying float vA;varying float vG;
    void main(){vA=aA;vG=aG;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aS*uScale/max(-mv.z,1.);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform sampler2D uMap;varying float vA;varying float vG;
    void main(){gl_FragColor=vec4(vec3(vG),texture2D(uMap,gl_PointCoord).a*vA);}`}));
smoke.frustumCulled=false;scene.add(smoke);
// grey: tono del humo. drift: si arrastra parte de la velocidad de la nave.
function emitSmoke(at,size,life,grey,drift){
  const k=smNext;smNext=(smNext+1)%SMOKE_N;
  const j=k*3,dv=drift===false?0:.25;
  smPos[j]=at.x;smPos[j+1]=at.y;smPos[j+2]=at.z;
  smVel[j]=ship.vel.x*dv+(Math.random()-.5)*5;smVel[j+1]=ship.vel.y*dv+(Math.random()-.5)*5;smVel[j+2]=ship.vel.z*dv+(Math.random()-.5)*5;
  smLife[k]=smMax[k]=life*(.7+Math.random()*.5);smBase[k]=size;smG[k]=grey===undefined?.13:grey;
}
function stepSmoke(dt){
  for(let k=0;k<SMOKE_N;k++){
    if(smLife[k]<=0){smA[k]=0;continue;}
    const j=k*3;
    smLife[k]-=dt;
    smPos[j]+=smVel[j]*dt;smPos[j+1]+=smVel[j+1]*dt;smPos[j+2]+=smVel[j+2]*dt;
    const u=Math.max(smLife[k],0)/smMax[k];
    smA[k]=u*.8;smS[k]=smBase[k]*(1+(1-u)*2.4);
  }
  const at=smGeo.attributes;at.position.needsUpdate=true;at.aA.needsUpdate=true;at.aS.needsUpdate=true;at.aG.needsUpdate=true;
  smU.uScale.value=canvas.height*.85;
}

/* ---------- Repuestos ---------- */
const DROP_KIND={
  escudo:{color:0x86f2e4,text:'+40 Escudo',use(){shield=Math.min(SHIELD_MAX,shield+40);}},
  vida:{color:0xa5e36f,text:'+25 Vida',use(){hull=Math.min(HULL_MAX,hull+25);}},
  frio:{color:0xffc04d,text:'Motor enfriado',use(){heat=0;overheat=0;}},
  misil:{color:0xf6ead6,text:'+2 Misiles',use(){missiles=Math.min(MISSILE_MAX,missiles+2);if(missiles>=MISSILE_MAX)missileT=0;}}
};
const dropGeo=new T.OctahedronGeometry(1.7,0);
const drops=Array.from({length:8},()=>{
  const mesh=new T.Mesh(dropGeo,new T.MeshBasicMaterial({color:0xffffff,fog:false}));
  const g=glow(0xffffff,9);mesh.add(g);
  mesh.visible=false;scene.add(mesh);
  return {mesh,glow:g,on:false,kind:'escudo',life:0,pos:new V3()};
});
function maybeDrop(at,chance){
  if(Math.random()>chance)return;
  const d=drops.find(x=>!x.on);if(!d)return;
  const kind=hull<50&&Math.random()<.6?'vida':shield<40&&Math.random()<.6?'escudo':missiles<2&&Math.random()<.6?'misil':['escudo','vida','frio','misil'][Math.random()*4|0];
  spawnDrop(d,at,kind);
}
function spawnDrop(d,at,kind){
  d.on=true;d.kind=kind;d.life=25;d.pos.copy(at);
  d.mesh.material.color.setHex(DROP_KIND[kind].color);d.glow.material.color.setHex(DROP_KIND[kind].color);
  d.mesh.position.copy(at);d.mesh.visible=true;
}
function stepDrops(dt){
  for(const d of drops){
    if(!d.on)continue;
    d.life-=dt;
    if(d.life<=0){d.on=false;d.mesh.visible=false;continue;}
    d.mesh.visible=d.life>5||Math.floor(d.life*6)%2===0;
    d.mesh.rotation.y+=dt*2.2;d.mesh.rotation.x+=dt*1.1;
    if(dead>0)continue;
    _eA.copy(ship.pos).sub(d.pos);
    const dist=_eA.length();
    if(dist<80)d.pos.addScaledVector(_eA,(90-dist)*1.2*dt/(dist||1)*3); // se acerca a la nave cuando pasás cerca
    d.mesh.position.copy(d.pos);
    if(dist<9){
      DROP_KIND[d.kind].use();toast(DROP_KIND[d.kind].text,1.4);sfxPickup();
      d.on=false;d.mesh.visible=false;
    }
  }
}

/* ---------- Puntaje ---------- */
function addScore(base,withCombo){
  let pts=base;
  if(withCombo){
    combo=ship.t-lastKill<COMBO_TIME?Math.min(5,combo+1):1;
    lastKill=ship.t;
    pts=base*combo;
    toast('+'+pts+(combo>1?' · ×'+combo:''),1.1);
  }
  score+=pts;
  if(score>record&&run.mode!=='carrera'){
    record=score;records[recKey()]=record;saveRecords();
  }
}

/* ---------- Modos de juego ---------- */
const DIFF={
  facil:{name:'Fácil',lives:Infinity,aim:{lag:.45,errMin:2.6,errK:.014},assist:true,note:'Vidas infinitas. Los enemigos apuntan peor.'},
  medio:{name:'Medio',lives:5,aim:{lag:.3,errMin:1.6,errK:.01},assist:true,note:'5 vidas.'},
  dificil:{name:'Difícil',lives:3,aim:{lag:.22,errMin:1.1,errK:.008},assist:true,note:'3 vidas. Los enemigos apuntan mejor.'},
  extremo:{name:'Extremo',lives:1,aim:{lag:.22,errMin:1.1,errK:.008},assist:false,note:'1 vida y sin ayudas para apuntar: tus tiros no se corrigen solos y no hay marca de impacto.'}
};
const MODES={
  conquista:{name:'Conquista',diff:true,desc:'Liberá las seis zonas enemigas. Para despejar una zona tenés que destruir sus torretas y todos sus escuadrones. Una nave nodriza recorre el planeta: si la derribás, cada zona pierde refuerzos y una torreta.'},
  supervivencia:{name:'Supervivencia',diff:true,desc:'Oleadas cada vez más grandes vienen a buscarte. Cada cinco oleadas llega una nodriza. Tenés una sola vida.'},
  libre:{name:'Vuelo libre',diff:false,desc:'Recorré el planeta sin objetivo. De vez en cuando aparecen escuadrones al azar. Vidas infinitas.'},
  carrera:{name:'Carrera',diff:false,desc:'Doce anillos contra reloj, siempre el mismo recorrido. Si te estrellás, volvés al último anillo con 5 segundos de castigo.'},
  historia:{name:'Historia',diff:false,desc:''} // la descripción sale de la misión (ver Historia)
};
const run={mode:null,diff:'medio',lives:Infinity,assist:true,t:0,wave:0,waveT:0,queue:[],randT:0,ring:0,raceT:0,over:null,endT:0,stepT:0,prev:new V3(),live:false,crashes:0,count:0};
// Cada evento de uso lleva el modo y la dificultad de la partida en curso, y con qué se está jugando
stats.context(()=>Object.assign({entrada:inputDev},run.live?{modo:run.mode,dificultad:MODES[run.mode].diff?run.diff:undefined}:{}));
function endRunStats(res){
  if(!run.live)return;
  const p={resultado:res,duracion_s:Math.round(run.t),puntos:score,derribos:ship.kills,caidas:run.crashes,fps_prom:perf.runT>3?Math.round(perf.runF/perf.runT):undefined};
  if(run.mode==='conquista'){p.zonas_libres=zones.filter(z=>z.state==='libre').length;p.vidas=run.lives===Infinity?'inf':run.lives;}
  if(run.mode==='supervivencia')p.oleada=run.wave;
  if(run.mode==='carrera'){p.anillos=run.ring;p.tiempo_carrera=Math.round(run.raceT*10)/10;}
  if(run.mode==='historia'&&mis.def){p.mision=mis.def.id;p.parte=mis.P?mis.P.id:undefined;}
  stats.track('partida_fin',p);
  run.live=false;
}
// Zonas "de mentira" para los enemigos que no son de una zona fija: los que aparecen al azar, las oleadas y la nodriza
function pseudoZone(name,patrol,link){return {kind:{name,patrol,form:1,link},r:1e9,dir:new V3(0,1,0),e1:new V3(1,0,0),e2:new V3(0,0,1),seen:false,state:'pseudo'};}
const roamZone=pseudoZone('Al azar',300,700),waveZone=pseudoZone('Oleada',300,4000),carrierZone=pseudoZone('Nodriza',300,1500);
const records=(()=>{try{return JSON.parse(localStorage.getItem('delta-uno-records'))||{};}catch(e){return {};}})();
if(!records.libre)records.libre=record; // el récord de antes queda para Vuelo libre
function recKey(m){m=m||run.mode;return MODES[m]&&MODES[m].diff?m+'-'+(m===run.mode?run.diff:settings.diff):m;}
function saveRecords(){try{localStorage.setItem('delta-uno-records',JSON.stringify(records));}catch(e){}}
const fmtTime=s=>{const m=Math.floor(s/60),r=s-m*60;return m+':'+(r<10?'0':'')+r.toFixed(1);};
const fmtNum=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
let carrier=null,keysHintT=0;
const _cw=new V3();

function clearWorld(){
  enemies.slice().forEach(removeEnemy);
  groups.length=0;carrier=null;
  eBolts.forEach(b=>{b.on=false;});bolts.forEach(b=>{b.on=false;});
  rockets.forEach(m=>{m.on=false;m.mesh.visible=false;});
  drops.forEach(d=>{d.on=false;d.mesh.visible=false;});
  eMsl.forEach(m=>{m.on=false;m.mesh.visible=false;});threat.lock=0;threat.incoming=0;
  camTarget=null;target=null;lockCancel();
  [roamZone,waveZone,carrierZone].forEach(z=>{z.seen=false;});
}
function setupZones(on){
  for(const z of zones){
    z.state=on?'hostil':'off';z.wall.visible=on;
    z.reserve=z.kind.groups;z.spawned=0;z.spawnT=0;z.seen=false;z.arc=1e9;
    z.sites.forEach(s=>{s.alive=true;s.on=false;});
  }
  curZone=null;
}
function startRun(mode,diff,missionId){
  if(run.live)endRunStats('reinicio');
  noteSettings();
  histStop();
  run.mode=mode;run.diff=MODES[mode].diff?(diff||'medio'):'medio';
  const D=DIFF[run.diff];
  Object.assign(AIM,D.aim);
  run.assist=MODES[mode].diff?D.assist:true;
  run.lives=mode==='conquista'?D.lives:mode==='supervivencia'?1:Infinity;
  run.t=0;run.wave=0;run.waveT=2;run.queue=[];run.randT=10;run.ring=0;run.raceT=0;run.over=null;run.endT=0;run.stepT=0;
  clearWorld();
  setupZones(mode==='conquista');
  ringsGroup.visible=mode==='carrera';
  if(mode==='carrera')buildCourse();
  score=0;combo=0;ship.kills=0;
  record=mode==='carrera'?0:(records[recKey()]||0);run.best0=record;
  resetVitals();
  dead=0;inv=GRACE;crashMsg.hidden=true;shipGroup.visible=true;
  ship.speed=CRUISE*TUNE.vmax;
  shipAt(startU,startF,105);
  run.prev.copy(ship.pos);
  if(mode==='conquista')spawnCarrier();
  updateRings();
  if(mode==='historia')histStart(MISIONES.find(m=>m.id===missionId)||MISIONES[0]);
  menuEl.hidden=true;endEl.hidden=true;briefEl.hidden=true;sheet.hidden=true;hud.classList.remove('off');
  $('#keys').classList.remove('gone');clearTimeout(keysHintT);keysHintT=setTimeout(()=>$('#keys').classList.add('gone'),15000);
  if(sfx.ctx&&sfx.ctx.state==='suspended')sfx.ctx.resume();
  last=performance.now();
  toast(mode==='historia'?mis.def.titulo+' · '+mis.P.objetivo.toLowerCase():{conquista:'Conquista · liberá las 6 zonas',supervivencia:'Supervivencia · preparate',libre:'Vuelo libre',carrera:'Carrera · pasá por los anillos'}[mode],2.5);
  run.live=true;run.crashes=0;run.count++;perfReset();
  stats.track('partida_inicio',{numero:run.count});
}
// Lo que pasa al caer, según el modo. Devuelve el texto de la tarjeta.
function onCrash(){
  if(run.mode==='carrera'){run.raceT+=5;return 'Volvés al último anillo · +5 s';}
  if(run.mode==='historia'){mis.falls++;return 'Repetís esta prueba';}
  if(run.mode==='supervivencia'){run.over='derrota';return 'Caíste en la oleada '+run.wave;}
  if(run.mode==='conquista'){
    if(run.lives!==Infinity)run.lives--;
    if(run.lives<=0){run.over='derrota';return 'Sin vidas · Puntos '+fmtNum(score);}
    return (run.lives===Infinity?'Vidas infinitas':'Te quedan '+run.lives+(run.lives===1?' vida':' vidas'))+' · Puntos '+fmtNum(score);
  }
  return (score>0&&score>=record?'¡Nuevo récord! ':'')+'Puntos '+score+' · Récord '+record;
}
// un punto a "dist" metros por la superficie, hacia adelante con un desvío al azar de hasta ±spread radianes
const _pfU=new V3(),_pfF=new V3();
function dirFromShip(dist,spread,out){
  _pfU.copy(ship.pos).normalize();
  _pfF.copy(fwd).addScaledVector(_pfU,-fwd.dot(_pfU));
  if(_pfF.lengthSq()<1e-6)_pfF.copy(right).cross(_pfU);
  _pfF.normalize().applyAxisAngle(_pfU,(Math.random()*2-1)*spread);
  const a=dist/PLANET_R;
  return out.copy(_pfU).multiplyScalar(Math.cos(a)).addScaledVector(_pfF,Math.sin(a)).normalize();
}
const groundPoint=(u,alt,out)=>out.copy(u).multiplyScalar(PLANET_R+heightAt(u.x,u.y,u.z,64)+alt);
// Los grupos sueltos que quedaron muy lejos y no te vieron, se guardan
function cleanupPseudo(z){
  for(const g of groups.slice()){
    if(g.zone!==z||g.alert||!g.leader||g.leader.def.carrier)continue;
    if(g.leader.pos.distanceTo(ship.pos)>3600)g.members.slice().forEach(removeEnemy);
  }
}

/* Nave nodriza: recorre las zonas, te ve con radar y larga drones */
function spawnCarrier(u){
  if(freeSlots()<1)return;
  if(!u){ // lejos del punto de partida, entre las zonas
    const far=zones.slice().sort((a,b)=>arcTo(b.dir,startU)-arcTo(a.dir,startU))[0];
    u=new V3().copy(far?far.dir:startU).addScaledVector(far?far.e1:startF,.25).normalize();
  }
  const home=groundPoint(u,450,new V3());
  carrierZone.dir.copy(u);
  const g=makeGroup(carrierZone,['nodriza'],home,u,1,false);
  carrier=g.leader;carrier.launchT=4;g.wpI=Math.floor(Math.random()*6);
  carrierNextWp(g);
  return carrier;
}
function carrierNextWp(g){
  const list=zones.filter(z=>z.state==='hostil');
  if(list.length){g.wpI=(g.wpI||0)+1;groundPoint(list[g.wpI%list.length].dir,450,g.wp);}
  else groundPoint(dirFromShip(1200,Math.PI,_cw),450,g.wp); // sin zonas (oleadas): te ronda
}
function stepCarrier(){
  if(!carrier||!carrier.on)return;
  const g=carrier.group;
  if(run.mode==='supervivencia')alertGroup(g);
  if(!g.alert||dead>0)return;
  carrier.launchT-=.25;
  const swarms=groups.filter(o=>o.zone===carrierZone&&o!==g).length;
  if(carrier.launchT<=0&&swarms<2&&freeSlots()>=2){
    carrier.launchT=13;
    const u=carrier.pos.clone().normalize();
    makeGroup(carrierZone,['dron','dron','dron','dron','dron'],carrier.pos.clone().addScaledVector(u,-22),u,1,true); // larga los que entren
    toast('La nodriza larga drones',1.6);
  }
}
function carrierDown(scored){
  carrier=null;
  if(!scored)return;
  if(run.mode==='conquista'){
    for(const z of zones){
      if(z.state!=='hostil')continue;
      z.reserve=Math.max(0,z.reserve-1);
      const s=z.sites.find(s=>s.alive&&!s.on)||z.sites.find(s=>s.alive);
      if(s){const t=s.on&&enemies.find(e=>e.group.site===s);if(t)killEnemy(t,false);s.alive=false;}
    }
    if(run.lives!==Infinity)run.lives++;
    toast('Nodriza derribada · cada zona pierde refuerzos y una torreta'+(run.lives!==Infinity?' · +1 vida':''),3.5);
  }else toast('Nodriza derribada',2.5);
}
function onZoneCleared(){
  if(run.mode==='conquista'&&zones.every(z=>z.state!=='hostil')&&!run.over){run.over='victoria';run.endT=2.5;}
}

/* Vuelo libre: escuadrones al azar */
function stepRoam(){
  cleanupPseudo(roamZone);cleanupPseudo(carrierZone);
  run.randT-=.25;
  if(run.randT>0)return;
  run.randT=20+Math.random()*20;
  if(groups.filter(g=>g.zone===roamZone).length>=3||freeSlots()<4||dead>0)return;
  const tpl=['par','cazas','intercept','enjambre','escolta','enjambre4'][Math.floor(Math.random()*6)];
  const u=dirFromShip(1300+Math.random()*500,1.4,new V3());
  makeGroup(roamZone,GROUP_T[tpl],groundPoint(u,180+Math.random()*120,new V3()),u,1,false);
  toast('Contacto en el radar',1.6);
}

/* Supervivencia: oleadas */
function startWave(n){
  run.wave=n;
  const pool=n<2?['par']:n<3?['cazas','par']:n<4?['cazas','enjambre4','intercept']:['escolta','enjambre','intercept','cazas','enjambre4'];
  const extra={facil:0,medio:.3,dificil:.6,extremo:.6}[run.diff];
  const count=Math.min(5,1+Math.floor(n*.55+extra));
  run.queue=[];
  for(let i=0;i<count;i++)run.queue.push(pool[(n+i)%pool.length]);
  if(n%5===0)run.queue.push('nodriza');
  if(n>1)addScore(150*(n-1),false);
  toast('Oleada '+n,2.5);sfxPickup();
}
function stepWaves(){
  cleanupPseudo(carrierZone);
  for(const g of groups)if(g.zone===waveZone)alertGroup(g); // las oleadas te buscan siempre
  if(run.queue.length){
    const tpl=run.queue[0];
    if(tpl==='nodriza'){if(!carrier&&freeSlots()>=1){spawnCarrier(dirFromShip(1500,Math.PI,new V3()));run.queue.shift();}}
    else if(freeSlots()>=Math.min(4,GROUP_T[tpl].length)){
      const u=dirFromShip(1000+Math.random()*350,Math.PI,new V3());
      makeGroup(waveZone,GROUP_T[tpl],groundPoint(u,200,new V3()),u,1,true);
      run.queue.shift();
    }
    return;
  }
  if(groups.some(g=>g.zone===waveZone||g.zone===carrierZone))return;
  run.waveT-=.25;
  if(run.waveT<=0&&dead<=0){startWave(run.wave+1);run.waveT=4;}
}

/* Carrera: anillos */
const RING_N=12,RING_R=17;
const ringsGroup=new T.Group();ringsGroup.visible=false;scene.add(ringsGroup);
const ringGeo=new T.TorusGeometry(RING_R,1.25,8,48);
const ringMatNext=new T.MeshBasicMaterial({color:0xffcf6e}),ringMatRest=new T.MeshBasicMaterial({color:0x86f2e4,transparent:true,opacity:.4,depthWrite:false});
const course=[];
function buildCourse(){
  if(course.length)return; // siempre el mismo recorrido, para que el récord valga
  let s=4242;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  const u=startU.clone(),f=startF.clone().addScaledVector(startU,-startF.dot(startU)).normalize();
  let dist=650;
  for(let i=0;i<RING_N;i++){
    const a=dist/PLANET_R,nu=u.clone().multiplyScalar(Math.cos(a)).addScaledVector(f,Math.sin(a)).normalize();
    f.multiplyScalar(Math.cos(a)).addScaledVector(u,-Math.sin(a)).normalize();u.copy(nu);
    const alt=i%3===2?240+rnd()*120:70+rnd()*80;
    course.push({u:u.clone(),pos:u.clone().multiplyScalar(PLANET_R+Math.max(heightAt(u.x,u.y,u.z,0),0)+alt),n:new V3()});
    f.applyAxisAngle(u,(rnd()-.5)*1.0);
    dist=430+rnd()*170;
  }
  course.forEach((c,i)=>{
    const prev=i?course[i-1].pos:startU.clone().multiplyScalar(PLANET_R+heightAt(startU.x,startU.y,startU.z,0)+105);
    const next=course[i+1]?course[i+1].pos:c.pos.clone().multiplyScalar(2).sub(prev);
    c.n.copy(next).sub(prev).normalize();
    const m=new T.Mesh(ringGeo,ringMatRest);m.position.copy(c.pos);m.quaternion.setFromUnitVectors(Z_AXIS,c.n);
    ringsGroup.add(m);c.mesh=m;
  });
}
function updateRings(){
  course.forEach((c,i)=>{c.mesh.visible=i>=run.ring;c.mesh.material=i===run.ring?ringMatNext:ringMatRest;});
}
const _rA=new V3(),_rB=new V3();
function stepRace(dt){
  if(run.over)return;
  if(dead<=0)run.raceT+=dt;
  const c=course[run.ring];
  if(c&&dead<=0){
    const s1=_rA.copy(run.prev).sub(c.pos).dot(c.n),s2=_rB.copy(ship.pos).sub(c.pos).dot(c.n);
    if((s1<0&&s2>=0)||(s1>0&&s2<=0)){
      const t=s1/(s1-s2);
      _rA.copy(run.prev).lerp(ship.pos,t);
      if(_rA.distanceTo(c.pos)<RING_R+.6){
        run.ring++;updateRings();
        blip(880,1320,.12,.05,'triangle');
        if(run.ring>=RING_N){run.over='carrera';run.endT=1.4;toast('¡Llegada! · '+fmtTime(run.raceT),3);}
        else toast('Anillo '+run.ring+'/'+RING_N+' · '+fmtTime(run.raceT),1.4);
      }
    }
  }
  c&&c.mesh&&c.mesh.scale.setScalar(1+.06*Math.sin(ship.t*6));
  run.prev.copy(ship.pos);
}
function raceRespawnSpot(u,f){
  const from=run.ring?course[run.ring-1].u:startU,to=course[Math.min(run.ring,RING_N-1)].u;
  u.copy(from);
  f.copy(to).sub(from).addScaledVector(from,-to.clone().sub(from).dot(from));
  if(f.lengthSq()<1e-8)f.copy(startF);
  f.normalize();
}

/* Paso del modo: cada cuarto de segundo, salvo la carrera que mide cada cuadro */
function stepRun(dt){
  if(!run.mode)return;
  run.t+=dt;
  if(run.endT>0){run.endT-=dt;if(run.endT<=0)showEnd(run.over);}
  if(run.mode==='carrera'){stepRace(dt);return;}
  if(run.mode==='historia')histStep(dt);
  run.stepT-=dt;if(run.stepT>0)return;run.stepT=.25;
  if(mis.sector){ // los blancos de la misión te ven y se avisan como los de una zona
    const mine=groups.filter(g=>g.zone===mis.sector);
    if(mine.length)detectGroups(mis.sector,mine,arcTo(_cw.copy(ship.pos).normalize(),mis.sector.dir));
  }
  for(const z of [roamZone,waveZone,carrierZone]){
    const mine=groups.filter(g=>g.zone===z);
    if(mine.length)detectGroups(z,mine,0);
  }
  stepCarrier();
  if(run.mode==='libre')stepRoam();
  else if(run.mode==='supervivencia')stepWaves();
}
function modeLine(){
  if(run.mode==='historia')return histLine();
  if(run.mode==='carrera')return 'Anillo '+Math.min(run.ring+1,RING_N)+'/'+RING_N+' · '+fmtTime(run.raceT)+(records.carrera?' · Récord '+fmtTime(records.carrera):'');
  if(run.mode==='supervivencia'){
    const n=enemies.length+run.queue.length;
    return 'Oleada '+run.wave+' · '+(n?n+' enemigos':'próxima oleada')+' · '+DIFF[run.diff].name;
  }
  if(run.mode==='conquista'){
    const freed=zones.filter(z=>z.state==='libre').length;
    let s=(curZone?'Zona '+curZone.kind.name.toLowerCase()+(curZone.seen?' · te vieron':'')+' · '+curZone.sites.filter(t=>t.alive).length+' defensas · ':'')+
      'Vidas '+(run.lives===Infinity?'∞':run.lives)+' · Libres '+freed+'/'+zones.length;
    if(carrier&&carrier.on)s+=' · Nodriza '+(carrier.pos.distanceTo(ship.pos)/1000).toFixed(1).replace('.',',')+' km';
    return s;
  }
  return BIOMES[ship.biome]+' · Vuelo libre';
}

/* ---------- Historia: misiones, radio y aliados ----------
   Las misiones son datos (src/historia/, formato en docs/historia/formato.md). Cada una se juega en un sector
   con borde visible: si salís, tenés unos segundos para volver o se pierde la parte. Al caer o perder la parte,
   se repite desde su comienzo, con la nave reparada. */
const SECTOR_OUT=8,SECTOR_NEAR=.92,PART_GAP=4.5,END_GAP=5.5,RADIO_GAP=4,RADIO_STALE=6;
const HIST_KEY='delta-uno-historia';
const progress=(()=>{try{return JSON.parse(localStorage.getItem(HIST_KEY))||{};}catch(e){return {};}})();
function saveProgress(){try{localStorage.setItem(HIST_KEY,JSON.stringify(progress));}catch(e){}}
const mis={def:null,sector:null,wall:null,part:-1,P:null,partT:0,t:0,events:[],emitted:new Set(),won:false,state:'off',gapT:0,
  ring:0,kills:0,spawned:0,pose:{u:new V3(),f:new V3()},outT:0,out:false,warn:'',falls:0,dmg:0,partFalls:0,partT0:0,sites:[],th0:0,result:null};
const sectorCache={};
const _hA=new V3(),_hB=new V3(),_hC=new V3(),_hD=new V3();
function basisOf(dir,e1,e2){
  e1.set(Math.abs(dir.y)<.9?0:1,Math.abs(dir.y)<.9?1:0,0).addScaledVector(dir,-(Math.abs(dir.y)<.9?dir.y:dir.x)).normalize();
  e2.crossVectors(e1,dir).normalize();
}
// Busca en el planeta un lugar que sirva para la misión. 'costa': de día, tierra pareja en el centro y mar alrededor.
function findSector(spec){
  const key=spec.busca+':'+spec.radio;
  if(sectorCache[key])return sectorCache[key];
  let s=9157;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  const c=new V3(),e1=new V3(),e2=new V3(),q=new V3();
  let best=-1e9;const out=startU.clone();
  for(let k=0;k<500;k++){
    const y=rnd()*1.6-.8,t=rnd()*Math.PI*2,r=Math.sqrt(1-y*y);
    c.set(Math.cos(t)*r,y,Math.sin(t)*r);
    if(c.dot(SUN)<.4)continue;
    basisOf(c,e1,e2);
    // centro: tierra firme y verde; el círculo de los anillos y el borde: algo de mar, nada de montaña
    let land=0,green=0,sea=0,bad=0,high=0;
    for(const [frac,cnt] of [[0,1],[.22,6],[.45,10],[.8,10]]){
      for(let i=0;i<cnt;i++){
        const ang=i/cnt*Math.PI*2+frac*3,a=frac*spec.radio/PLANET_R,sa=Math.sin(a);
        q.copy(c).multiplyScalar(Math.cos(a)).addScaledVector(e1,sa*Math.cos(ang)).addScaledVector(e2,sa*Math.sin(ang)).normalize();
        const h=terrain(q.x,q.y,q.z,64,true),water=S.water>.5,b=S.biome;
        if(b>=6||S.lava>.2)bad++;
        high=Math.max(high,h);
        if(!water&&b>=1&&b<=3)green++;
        if(frac<.3){if(!water&&b<6)land++;}
        else if(water)sea++;
      }
    }
    if(land<6)continue;
    const score=green*2-bad*3-Math.abs(sea-7)*1.5-Math.max(0,high-220)*.05+c.dot(SUN)*4;
    if(score>best){best=score;out.copy(c);}
  }
  sectorCache[key]=out;
  return out;
}
function makeSector(def){
  const dir=findSector(def.sector),e1=new V3(),e2=new V3();
  basisOf(dir,e1,e2);
  return {dir:dir.clone(),e1,e2,r:def.sector.radio,kind:{name:def.sector.nombre,patrol:320,form:1,link:1400},seen:false,state:'mision',arc:0};
}
// Lugares para las torretas de práctica: cerca del centro, en tierra pareja
function sectorSites(z,n){
  const out=[],cand=new V3();
  let s=4517;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  for(let k=0;k<n;k++){
    let best=-1e9,bd=null;
    for(let t=0;t<90;t++){
      const strict=t<60;
      zoneDir(z,.06+rnd()*.22,rnd()*Math.PI*2,cand);
      terrain(cand.x,cand.y,cand.z,0,true);
      if(strict&&(S.water>.3||S.lava>.3||S.biome>=7))continue;
      if(out.some(o=>arcTo(o.dir,cand)<150))continue;
      const h=Math.max(heightAt(cand.x,cand.y,cand.z,0),0),sl=siteSlope(cand,h);
      if(strict&&sl>.45)continue;
      const score=-sl*220+rnd()*20;
      if(score>best){best=score;bd=cand.clone();}
    }
    if(bd)out.push({dir:bd,alive:true,on:false,kind:'torreta'});
  }
  return out;
}

/* Anillos de la misión: sobre un círculo alrededor del centro del sector */
const misRings=new T.Group();scene.add(misRings);
const MIS_RING_RHO=.45,MIS_RING_STEP=430,MIS_RING_ALT=[85,120,175,100,145,205,110,160];
const misCourse=[];
function misRingAt(i,out){
  const z=mis.sector,dth=MIS_RING_STEP/(MIS_RING_RHO*z.r);
  return zoneDir(z,MIS_RING_RHO,mis.th0+i*dth,out);
}
function buildMisRings(n){
  clearMisRings();
  const prev=new V3();
  misRingAt(-1.2,_hA);prev.copy(_hA).multiplyScalar(PLANET_R+Math.max(heightAt(_hA.x,_hA.y,_hA.z,0),0)+100);
  for(let i=0;i<n;i++){
    misRingAt(i+1,_hA);
    const u=_hA.clone(),h=Math.max(heightAt(u.x,u.y,u.z,0),0);
    misCourse.push({u,pos:u.clone().multiplyScalar(PLANET_R+h+MIS_RING_ALT[i%MIS_RING_ALT.length]),n:new V3()});
  }
  misCourse.forEach((c,i)=>{
    const a=i?misCourse[i-1].pos:prev,b=misCourse[i+1]?misCourse[i+1].pos:c.pos.clone().multiplyScalar(2).sub(a);
    c.n.copy(b).sub(a).normalize();
    const m=new T.Mesh(ringGeo,ringMatRest);m.position.copy(c.pos);m.quaternion.setFromUnitVectors(Z_AXIS,c.n);
    misRings.add(m);c.mesh=m;
  });
  updateMisRings();
}
function clearMisRings(){misRings.clear();misCourse.length=0;}
function updateMisRings(){misCourse.forEach((c,i)=>{c.mesh.visible=i>=mis.ring;c.mesh.material=i===mis.ring?ringMatNext:ringMatRest;});}
// ¿El tramo a→b cruzó el anillo c por adentro?
function crossedRing(c,a,b){
  const s1=_rA.copy(a).sub(c.pos).dot(c.n),s2=_rB.copy(b).sub(c.pos).dot(c.n);
  if(!((s1<0&&s2>=0)||(s1>0&&s2<=0)))return false;
  _rA.copy(a).lerp(b,s1/(s1-s2));
  return _rA.distanceTo(c.pos)<RING_R+.6;
}

/* Arranque, partes y final */
function histStart(def){
  mis.def=def;mis.sector=makeSector(def);
  mis.wall=zoneWall(mis.sector,[.25,.62,.95]);
  mis.sites=sectorSites(mis.sector,Math.max(0,...def.partes.map(p=>p.torretas||0)));
  mis.th0=0;mis.t=0;mis.falls=0;mis.dmg=0;mis.result=null;mis.state='jugando';mis.part=-1;
  radio.q.length=0;radio.heard.clear();radio.cur=null;radio.gapT=0;elRadio.hidden=true;
  histPart(0,false);
  // posición de partida: sobre el círculo de los anillos, mirando al primero
  misRingAt(-1.2,_hA);misRingAt(0,_hB);
  _hC.copy(_hB).sub(_hA);_hC.addScaledVector(_hA,-_hC.dot(_hA)).normalize();
  ship.speed=CRUISE*TUNE.vmax;
  shipAt(_hA,_hC,90);
  run.prev.copy(ship.pos);
  mis.pose.u.copy(_hA);mis.pose.f.copy(_hC);
  makeAllies(def.aliados);
  stats.track('mision_inicio',{mision:def.id});
}
function histStop(){
  missileRegen=true;
  if(mis.wall){scene.remove(mis.wall);mis.wall.geometry.dispose();mis.wall.material.dispose();mis.wall=null;}
  clearMisRings();removeAllies();
  mis.def=null;mis.sector=null;mis.state='off';mis.part=-1;mis.P=null;mis.warn='';mis.out=false;
  radio.q.length=0;radio.cur=null;elRadio.hidden=true;
}
// Arma la parte i. restart: se repite después de caer o de salir del sector.
function histPart(i,restart){
  const def=mis.def,P=def.partes[i];
  // lo que quedaba de la parte anterior (o de este intento) se saca
  enemies.slice().forEach(e=>{if(e.misPart!==undefined)removeEnemy(e);});
  eBolts.forEach(b=>{b.on=false;});
  mis.part=i;mis.P=P;mis.partT=0;mis.won=false;mis.kills=0;mis.spawned=0;mis.ring=0;mis.outT=0;mis.out=false;mis.warn='';
  mis.emitted.clear();
  mis.events=P.eventos.map(ev=>({ev,done:false}));
  if(!restart){mis.partFalls=0;mis.partT0=mis.t;}
  clearMisRings();
  if(P.tipo==='anillos')buildMisRings(P.anillos);
  else if(P.tipo==='torretas'){
    mis.sites.slice(0,P.torretas).forEach(site=>{
      site.alive=true;site.on=false;
      const g=spawnTurret(mis.sector,site);
      if(g){g.members.forEach(e=>practice(e,P));mis.spawned++;}
    });
  }else if(P.tipo==='naves'){
    // salen del otro lado del centro del sector y vienen a buscarte
    _hA.copy(ship.pos).normalize();
    const away=arcTo(_hA,mis.sector.dir)>60?_hC.copy(mis.sector.dir).multiplyScalar(2).sub(_hA).normalize():zoneDir(mis.sector,.4,1,_hC);
    const g=makeGroup(mis.sector,P.naves,groundPoint(away,230,new V3()),away,1,true);
    g.members.forEach(e=>practice(e,P));mis.spawned=g.members.length;
  }
  allies.forEach(a=>{a.mode=P.aliados||'formacion';});
  histApplyStart(P);
  if(!restart&&i>0){toast('Prueba '+(i+1)+' de '+def.partes.length+' · '+P.objetivo,3);}
  // la posición para repetir esta parte: segura y mirando hacia el centro del sector
  if(!restart&&i>0){
    _hA.copy(ship.pos).normalize();
    const z=mis.sector;
    _hB.copy(_hA).addScaledVector(z.dir,-_hA.dot(z.dir));
    if(_hB.lengthSq()<1e-8)_hB.copy(z.e1);
    _hB.normalize();
    const a=.62*z.r/PLANET_R;
    mis.pose.u.copy(z.dir).multiplyScalar(Math.cos(a)).addScaledVector(_hB,Math.sin(a)).normalize();
    mis.pose.f.copy(z.dir).addScaledVector(mis.pose.u,-z.dir.dot(mis.pose.u)).normalize();
  }
}
/* Estado de la nave al empezar la parte (al llegar o al repetirla), si la misión lo define según la historia:
   inicio: { misiles: 0 a 4, casco: 1 a 100, escudo: 0 a 100, recargaMisiles: false }.
   Sin "inicio": al llegar seguís con lo que tenías y al repetir arrancás con todo lleno. */
function histApplyStart(P){
  const s=P.inicio;
  missileRegen=!(s&&s.recargaMisiles===false);
  if(!s)return;
  if(s.misiles!==undefined){missiles=clamp(s.misiles,0,MISSILE_MAX);missileT=0;}
  if(s.casco!==undefined)hull=clamp(s.casco,1,100);
  if(s.escudo!==undefined)shield=clamp(s.escudo,0,100);
}
function practice(e,P){
  e.misPart=mis.part;e.practice=true;e.dmgK=P.danio||1;
  e.mesh.material=practiceMat;
  const gl=e.mesh.children[0];if(gl)gl.material.color.set(0xffd23f);
}
// Al caer o salir del sector: se repite la parte. Devuelve en u y f dónde reaparece la nave.
function histRestart(u,f){
  if(!mis.def)return;
  mis.partFalls++;
  radio.q.length=0;radio.cur=null;elRadio.hidden=true;
  u.copy(mis.pose.u);f.copy(mis.pose.f);
  histPart(mis.part,true);
  placeAllies(u,f);
  if(mis.def.reinicio)say(...mis.def.reinicio);
}
function histStep(dt){
  if(!mis.def||mis.state==='off')return;
  mis.t+=dt;
  if(mis.state==='fin')return;
  if(mis.state==='entre'){ // pausa entre partes: se escucha la radio y aparece la siguiente
    mis.gapT-=dt;
    if(mis.gapT<=0){mis.state='jugando';histPart(mis.part+1,false);}
    return;
  }
  if(dead>0)return;
  mis.partT+=dt;
  const P=mis.P;
  if(P.tipo==='anillos'){
    const c=misCourse[mis.ring];
    if(c&&crossedRing(c,run.prev,ship.pos)){
      mis.ring++;updateMisRings();blip(880,1320,.12,.05,'triangle');
      if(mis.ring<P.anillos)toast('Anillo '+mis.ring+'/'+P.anillos,1.2);
    }
    if(c&&c.mesh)c.mesh.scale.setScalar(1+.06*Math.sin(ship.t*6));
    if(mis.ring>=P.anillos)mis.won=true;
  }else if(mis.spawned>0&&!enemies.some(e=>e.misPart===mis.part))mis.won=true;
  run.prev.copy(ship.pos);
  // eventos de la parte
  for(const x of mis.events){
    if(x.done||!histWhen(x.ev.cuando))continue;
    x.done=true;
    if(x.ev.radio)say(...x.ev.radio);
    if(x.ev.hacer)histDo(x.ev.hacer);
  }
  // borde del sector
  const arc=arcTo(_hA.copy(ship.pos).normalize(),mis.sector.dir),r=mis.sector.r;
  mis.out=arc>r;
  if(mis.out){
    mis.outT+=dt;
    const left=Math.ceil(SECTOR_OUT-mis.outT);
    mis.warn='Volvé al sector · '+Math.max(0,left);
    if(mis.outT>=SECTOR_OUT){mis.warn='';mis.out=false;crash('sector');return;}
  }else{mis.outT=0;mis.warn=arc>r*SECTOR_NEAR?'Límite del sector':'';}
  if(mis.won){
    stats.track('mision_parte',{mision:mis.def.id,parte:P.id,segundos:Math.round(mis.t-mis.partT0),caidas:mis.partFalls});
    if(mis.part+1<mis.def.partes.length){mis.state='entre';mis.gapT=PART_GAP;toast('Prueba completa',2);}
    else histComplete();
  }
}
function histWhen(c){
  if(c.t!==undefined)return mis.partT>=c.t;
  if(c.anillo!==undefined)return mis.ring>=c.anillo;
  if(c.derribos!==undefined)return mis.kills>=c.derribos;
  if(c.cascoBajo!==undefined)return hull<c.cascoBajo;
  if(c.fin)return mis.won;
  if(c.evento)return mis.emitted.has(c.evento);
  return false;
}
function histDo(a){
  if(a[0]==='firma'){const al=allies.find(x=>x.id===a[1]);if(al)startFirma(al);}
}
function histComplete(){
  const def=mis.def,secs=mis.t,falls=mis.falls;
  mis.state='fin';inv=1e9; // ya terminó: nada te puede voltear mientras sale el resumen
  const medals=def.medallas.filter(m=>m.id==='completa'||(m.id==='sin_caer'&&falls===0)||(m.id==='tiempo'&&secs<=m.seg)).map(m=>m.id);
  const prev=progress[def.id]||{};
  const newBest=!prev.best||secs<prev.best;
  progress[def.id]={done:true,medals:[...new Set([...(prev.medals||[]),...medals])],best:newBest?secs:prev.best};
  saveProgress();
  mis.result={secs,falls,dmg:mis.dmg,medals,newBest};
  enemies.slice().forEach(e=>{if(e.misPart!==undefined)removeEnemy(e);});
  stats.track('mision_fin',{mision:def.id,segundos:Math.round(secs),caidas:falls,medallas:medals.length});
  toast('Misión cumplida',3);
  run.over='mision';run.endT=END_GAP;
}
// Qué marca el hexágono: el próximo anillo, o el centro del sector si te estás yendo
function histObjective(){
  if(!mis.def||mis.state!=='jugando')return null;
  const z=mis.sector;
  if(mis.warn)return {pos:_hD.copy(z.dir).multiplyScalar(PLANET_R+380),label:'Sector'};
  if(mis.P.tipo==='anillos'){const c=misCourse[mis.ring];return c?{pos:c.pos,label:'Anillo '+(mis.ring+1)}:null;}
  if(!enemies.some(e=>e.misPart===mis.part&&e.pos.distanceTo(ship.pos)<1400))return {pos:_hD.copy(z.dir).multiplyScalar(PLANET_R+380),label:'Blancos'};
  return null;
}
function histLine(){
  if(!mis.def)return '';
  const P=mis.P,n=mis.def.partes.length;
  let goal=P.objetivo;
  if(P.tipo==='anillos')goal+=' '+Math.min(mis.ring,P.anillos)+'/'+P.anillos;
  else goal+=' '+mis.kills+'/'+(P.torretas||P.naves.length);
  return mis.def.titulo+' · Prueba '+(mis.part+1)+'/'+n+' · '+goal;
}
// Menú
function histRecText(){
  const done=MISIONES.filter(m=>progress[m.id]&&progress[m.id].done).length;
  const med=MISIONES.reduce((k,m)=>k+((progress[m.id]&&progress[m.id].medals)||[]).length,0);
  return done?'Medallas '+med+'/'+MISIONES.reduce((k,m)=>k+m.medallas.length,0):'Nuevo';
}
function histMenuTitle(){const m=MISIONES[0];return 'Campaña '+m.campana+' · Misión '+m.numero+': '+m.titulo;}
function histMenuDesc(){
  return 'Volá con el escuadrón Delta: anillos, torretas de práctica y blancos de simulación. Si caés, repetís la prueba. Próximamente: '+PROXIMAS.length+' misiones más de la campaña 1, empezando por "'+PROXIMAS[0].titulo+'".';
}
// Pantalla de instrucciones antes de despegar
function openBrief(def){
  releaseAll();dropKeys();
  menuEl.hidden=true;endEl.hidden=true;
  $('#briefKicker').textContent='Campaña '+def.campana+' · Misión '+def.numero+' · '+def.sector.nombre;
  $('#briefTitle').textContent=def.titulo;
  $('#briefText').textContent=def.instruccion;
  const ol=$('#briefParts');ol.textContent='';
  def.partes.forEach(p=>{const li=document.createElement('li');li.textContent=p.objetivo;ol.append(li);});
  const got=(progress[def.id]&&progress[def.id].medals)||[];
  const ul=$('#briefMedals');ul.textContent='';
  def.medallas.forEach(m=>{const li=document.createElement('li');li.textContent=(got.includes(m.id)?'★ ':'☆ ')+m.texto;ul.append(li);});
  briefEl.hidden=false;briefEl.dataset.mission=def.id;
  hud.classList.add('off');scrollHints();
}
$('#briefGo').addEventListener('click',()=>{unlock();startRun('historia','medio',briefEl.dataset.mission);});
$('#briefBack').addEventListener('click',openMenu);

/* Radio: un mensaje por vez, con al menos 4 segundos entre uno y otro. Primero los importantes;
   los comentarios que quedaron atrasados se descartan. Al repetir una parte, se vacía. */
const elRadio=$('#radio'),elRadioWho=$('#radioWho'),elRadioText=$('#radioText');
const radio={q:[],gapT:0,showT:0,cur:null,heard:new Set(),log:[]};
function say(who,text,prio){
  const k=who+'|'+text;
  if(prio==='baja'&&radio.heard.has(k))return; // un comentario ya escuchado no se repite al reintentar
  radio.q.push({who,text,prio:prio||'alta',part:mis.part,fin:!!mis.won,at:ship.t});
}
function stepRadio(dt){
  if(radio.showT>0){radio.showT-=dt;if(radio.showT<=0){elRadio.hidden=true;radio.cur=null;}}
  radio.gapT-=dt;
  if(radio.gapT>0||!radio.q.length)return;
  // fuera lo de partes anteriores (salvo el cierre de la parte) y los comentarios viejos
  radio.q=radio.q.filter(m=>(m.part===mis.part||m.fin)&&!(m.prio==='baja'&&ship.t-m.at>RADIO_STALE));
  if(!radio.q.length)return;
  let i=radio.q.findIndex(m=>m.prio==='alta');if(i<0)i=0;
  const m=radio.q.splice(i,1)[0],R=REPARTO[m.who]||{radio:m.who};
  radio.cur=m;radio.heard.add(m.who+'|'+m.text);radio.log.push({who:m.who,text:m.text,t:ship.t});
  if(radio.log.length>60)radio.log.shift();
  elRadioWho.textContent=R.radio;elRadioText.textContent=m.text;
  elRadio.style.setProperty('--who',R.marca?'rgb('+R.marca.map(v=>Math.round(v*255)).join(',')+')':'var(--paper)');
  elRadio.hidden=false;
  radio.showT=clamp(2.4+m.text.length*.05,3.6,6.5);radio.gapT=RADIO_GAP;
  blip(1500,1150,.05,.025,'square');
}

/* Aliados: vuelan solos en formación atrás del jugador, o en círculo arriba del sector mirando la prueba.
   Por ahora no combaten (llega con la misión 2). Rastro tiene su maniobra: la "firma". */
// x: a la derecha, y: arriba, z: atrás (negativo: adelante). Los de adelante se ven desde la cámara.
const ALLY_SLOTS=[[-34,0,-42],[34,0,-42],[-46,3,-24],[46,3,-24],[0,12,60],[0,18,90]];
const allyMat=new T.MeshLambertMaterial({vertexColors:true,emissive:0x15151c});
const practiceMat=new T.MeshLambertMaterial({color:0xe2c24a,emissive:0x2a2006});
const allies=[];
const allyMarks=Array.from({length:ALLY_SLOTS.length},()=>{
  const el=document.createElement('div');el.className='amk';el.hidden=true;
  el.innerHTML='<span></span><i></i>';$('#amks').appendChild(el);
  return {el,label:el.querySelector('span')};
});
function makeAllies(ids){
  removeAllies();
  ids.forEach((id,i)=>{
    const R=REPARTO[id]||{radio:id};
    const mesh=new T.Group();
    mesh.add(new T.Mesh(shipGeometry(R.marca),allyMat));
    const flames=[-.55,.55].map(x=>{const g=glow(0x7ff0e1,1.7);g.position.set(x,.04,1.6);mesh.add(g);return g;});
    scene.add(mesh);
    allies.push({id,name:R.radio,mesh,flames,pos:new V3(),fwd:new V3(),speed:60,bank:0,roll:0,lat:0,mode:(mis.P&&mis.P.aliados)||'formacion',slot:ALLY_SLOTS[i%ALLY_SLOTS.length],orbitA:i/ids.length*Math.PI*2,man:null,seen:0});
  });
  placeAllies(U,fwd);
}
function removeAllies(){
  allies.forEach(a=>{scene.remove(a.mesh);a.mesh.children[0].geometry.dispose();a.flames.forEach(f=>f.material.dispose());});
  allies.length=0;allyMarks.forEach(m=>{m.el.hidden=true;});
}
// Los pone en su lugar de la formación alrededor de la nave (en u, mirando hacia f)
function placeAllies(u,f){
  _hB.copy(f).addScaledVector(u,-f.dot(u)).normalize();
  _hC.crossVectors(_hB,u).normalize();
  allies.forEach(a=>{
    a.man=null;a.lat=0;a.roll=0;a.bank=0;
    const base=_hD.copy(u).multiplyScalar(PLANET_R+clearance(u,_hB)+90);
    a.pos.copy(base).addScaledVector(_hC,a.slot[0]).addScaledVector(u,a.slot[1]).addScaledVector(_hB,-a.slot[2]);
    a.fwd.copy(_hB);a.speed=Math.max(ship.speed,50);
    a.flames.forEach(fl=>fl.scale.setScalar(1.7));
  });
}
const _aU=new V3(),_aH=new V3(),_aR=new V3(),_aT=new V3(),_aD=new V3(),_aA=new V3(),_aL=new V3(),_aX=new V3(),_aY=new V3(),_aZ=new V3(),_aV=new V3();
function stepAllies(dt){
  if(!allies.length)return;
  // rumbo del jugador, sin la componente vertical
  _aH.copy(fwd).addScaledVector(U,-fwd.dot(U));
  if(_aH.lengthSq()<1e-6)_aH.copy(up).addScaledVector(U,-up.dot(U));
  _aH.normalize();_aR.crossVectors(_aH,U).normalize();
  for(const a of allies)stepAlly(a,dt);
}
function stepAlly(a,dt){
  const p=a.pos,r=p.length(),ps=Math.max(ship.speed,40);
  _aU.copy(p).divideScalar(r);
  let want=ps;a.lat=0;
  if(a.man)want=firmaStep(a,dt,ps);
  else if(a.mode==='orbita'&&mis.sector){ // en círculo arriba del sector
    a.orbitA+=dt*55/560;
    zoneDir(mis.sector,560/mis.sector.r,a.orbitA,_aD);
    groundPoint(_aD,250+a.slot[1]*4,_aT);
    want=58;
  }else{ // formación: su lugar atrás del jugador, apuntando un poco más adelante para volar en paralelo
    _aT.copy(ship.pos).addScaledVector(_aR,a.slot[0]).addScaledVector(U,a.slot[1]).addScaledVector(_aH,-a.slot[2]);
    const along=_aA.copy(_aT).sub(p).dot(_aH),d=p.distanceTo(_aT);
    want=ps*clamp(1+along/90,.6,1.9);
    if(d<160)_aT.addScaledVector(_aH,70);
  }
  _aD.copy(_aT).sub(p).normalize();
  // suelo, techo, rocas y no pegarse al jugador ni entre ellos
  const altH=r-PLANET_R-heightAt(_aU.x,_aU.y,_aU.z,64);
  _aL.copy(p).addScaledVector(a.fwd,a.speed*1.2);
  const rl=_aL.length(),altA=rl-PLANET_R-heightAt(_aL.x/rl,_aL.y/rl,_aL.z/rl,64);
  const lift=Math.max(altA<45?(45-altA)/45:0,altH<45?(45-altH)/45:0);
  if(lift>0)_aD.addScaledVector(_aU,lift*4);
  if(r-PLANET_R>1050)_aD.addScaledVector(_aU,-(r-PLANET_R-1050)/100);
  for(const rk of activeRocks){
    _aA.copy(p).sub(rk.pos);const d=_aA.length();
    if(d<rk.bound+40)_aD.addScaledVector(_aA,(1-(d-rk.bound)/40)*2.2/(d||1));
  }
  _aA.copy(p).sub(ship.pos);const dS=_aA.length();
  if(dS<20)_aD.addScaledVector(_aA,(1-dS/20)*1.5/(dS||1));
  if(!a.man){
    for(const o of allies){if(o===a)continue;_aA.copy(p).sub(o.pos);const d=_aA.length();if(d>0&&d<18)_aD.addScaledVector(_aA,(1-d/18)*1.2/d);}
  }
  _aD.normalize();
  // gira hacia donde quiere ir e inclina las alas al doblar
  const ang=Math.acos(clamp(a.fwd.dot(_aD),-1,1));
  let turnRate=0;
  if(ang>1e-4){
    _aA.crossVectors(a.fwd,_aD);if(_aA.lengthSq()<1e-8)_aA.copy(_aU);_aA.normalize();
    const step=Math.min(ang,1.5*dt);
    _q.setFromAxisAngle(_aA,step);a.fwd.applyQuaternion(_q).normalize();
    turnRate=_aA.dot(_aU)*step/dt;
  }
  const bankT=a.man&&a.man.bank!==undefined?a.man.bank:clamp(turnRate*1.1,-1.2,1.2);
  a.bank+=(bankT-a.bank)*(1-Math.exp(-6*dt));
  a.speed+=(want-a.speed)*(1-Math.exp(-(a.man?3:1.4)*dt));
  p.addScaledVector(a.fwd,a.speed*dt);
  _aX.crossVectors(a.fwd,_aU);if(_aX.lengthSq()<1e-6)_aX.set(1,0,0);_aX.normalize();
  if(a.lat)p.addScaledVector(_aX,a.lat*dt); // desplazamiento de costado (la firma)
  if(r-PLANET_R-heightAt(_aU.x,_aU.y,_aU.z,0)<6)p.setLength(PLANET_R+heightAt(_aU.x,_aU.y,_aU.z,0)+6);
  _aV.crossVectors(_aX,a.fwd).normalize();
  const b=a.bank+a.roll,cb=Math.cos(b),sb=Math.sin(b);
  _aY.copy(_aV).multiplyScalar(cb).addScaledVector(_aX,-sb);
  _aX.multiplyScalar(cb).addScaledVector(_aV,sb);
  _aZ.copy(a.fwd).negate();
  _m.makeBasis(_aX,_aY,_aZ);a.mesh.quaternion.setFromRotationMatrix(_m);
  a.mesh.position.copy(p);
}
/* La firma de Rastro (reporte 01): se pone adelante del jugador, amaga hacia la izquierda, esquiva hacia la
   derecha con un tonel y sale con un golpe de turbo. Espera a estar a la vista antes de amagar. */
function startFirma(a){a.man={step:'ir',t:0};}
function onScreen(p){
  _aA.copy(p).sub(camera.position);
  camera.getWorldDirection(_aV);
  if(_aA.dot(_aV)<5)return false;
  _aA.copy(p).project(camera);
  return Math.abs(_aA.x)<.55&&_aA.y>-.5&&_aA.y<.62; // lejos de los bordes y de los instrumentos de arriba
}
function firmaStep(a,dt,ps){
  const m=a.man,p=a.pos;m.t+=dt;m.bank=undefined;
  const ahead=()=>_aT.copy(ship.pos).addScaledVector(_aH,58).addScaledVector(U,3); // cerca y casi a la altura del jugador: entre la nave y la mira
  switch(m.step){
    case 'ir':{ // se adelanta
      ahead();
      if(p.distanceTo(_aT)<16||m.t>12){m.step='mostrar';m.t=0;}
      return ps+45;
    }
    case 'mostrar':{ // adelante y a la vista
      ahead();
      const along=_aA.copy(_aT).sub(p).dot(_aH);
      if(m.t>.9&&(onScreen(p)||m.t>4)){m.step='amague';m.t=0;a.seen=onScreen(p)?1:0;}
      return ps+clamp(along*.6,-20,25);
    }
    case 'amague':{ // inclina y se tira apenas a la izquierda
      _aT.copy(p).addScaledVector(_aH,220);
      m.bank=.95;a.lat=-16;
      if(m.t>.5){m.step='esquiva';m.t=0;}
      return ps;
    }
    case 'esquiva':{ // tonel y salto a la derecha
      _aT.copy(p).addScaledVector(_aH,220);
      const k=Math.min(1,m.t/.75);
      m.bank=0;a.lat=70*(1-k*.6);a.roll=-Math.PI*2*(k*k*(3-2*k));
      if(m.t>.75){m.step='turbo';m.t=0;a.roll=0;}
      return ps+10;
    }
    case 'turbo':{ // golpe de turbo hacia adelante
      _aT.copy(p).addScaledVector(_aH,220).addScaledVector(U,15);
      a.flames.forEach(f=>f.scale.setScalar(4.2));
      if(m.t>1.5){a.man=null;a.flames.forEach(f=>f.scale.setScalar(1.7));mis.emitted.add('firma_fin');}
      return ps+80;
    }
  }
  return ps;
}
// Nombres de los aliados en pantalla, cuando están cerca y a la vista
function updateAllyHud(){
  allyMarks.forEach((mk,i)=>{
    const a=allies[i];
    if(!a||dead>0||a.pos.distanceTo(ship.pos)>1300){if(!mk.el.hidden)mk.el.hidden=true;return;}
    screenSpot(a.pos,_spot);
    if(_spot.off){if(!mk.el.hidden)mk.el.hidden=true;return;}
    if(mk.el.hidden)mk.el.hidden=false;
    if(mk.label.textContent!==a.name)mk.label.textContent=a.name;
    mk.el.style.transform='translate('+_spot.x.toFixed(1)+'px,'+_spot.y.toFixed(1)+'px)';
  });
}

/* ---------- Menú de inicio y fin de partida ---------- */
const menuEl=$('#menu'),endEl=$('#end'),briefEl=$('#brief');
const overlayOpen=()=>!menuEl.hidden||!endEl.hidden||!briefEl.hidden;
function recText(m){
  if(m==='carrera')return records.carrera?'Récord '+fmtTime(records.carrera):'';
  if(m==='historia')return histRecText();
  const r=records[MODES[m].diff?m+'-'+settings.diff:m];
  return r?'Récord '+fmtNum(r):'';
}
function syncMenu(){
  const sel=MODES[settings.lastMode]?settings.lastMode:'conquista',M=MODES[sel];
  document.querySelectorAll('.mode').forEach(b=>{
    const m=b.dataset.mode;
    b.setAttribute('aria-pressed',m===sel?'true':'false');
    if(MODES[m])b.querySelector('small').textContent=recText(m);
  });
  $('#modeTitle').textContent=sel==='historia'?histMenuTitle():M.name;
  $('#modeDesc').textContent=sel==='historia'?histMenuDesc():M.desc;
  $('#diffBox').hidden=!M.diff;
  const D=DIFF[settings.diff]||DIFF.medio;
  $('#diffNote').textContent=sel==='supervivencia'?(settings.diff==='extremo'?'Sin ayudas para apuntar. ':'')+'La dificultad cambia la puntería enemiga y el tamaño de las oleadas.':D.note;
  const rt=recText(sel);
  $('#modeRec').textContent=rt?rt+(M.diff?' en '+D.name.toLowerCase():''):sel==='historia'?'Todavía sin jugar':'Todavía sin récord';
  $('#goBtn').textContent=sel==='historia'?'Ver la misión':'Despegar';
  syncStatsNote();
  scrollHints();
}
function openMenu(){
  if(run.live)endRunStats('abandono');
  noteSettings();
  histStop();
  releaseAll();dropKeys();sheet.hidden=true;endEl.hidden=true;briefEl.hidden=true;crashMsg.hidden=true;
  menuEl.hidden=false;hud.classList.add('off');syncMenu();
  if(sfx.ctx&&sfx.ctx.state==='running')sfx.ctx.suspend();
}
function showEnd(kind){
  endRunStats(run.mode==='carrera'?'terminada':kind==='victoria'||kind==='mision'?'victoria':'derrota');
  releaseAll();dropKeys();
  const rows=[];let isNew=false,title='',text='';
  $('#againBtn').textContent=run.mode==='historia'?'Repetir la misión':'Jugar de nuevo';
  if(run.mode==='historia'){
    const r=mis.result;
    title='Misión cumplida · '+mis.def.titulo;text=mis.def.resumen;isNew=r.newBest;
    rows.push(['Tiempo',fmtTime(r.secs)],['Caídas',r.falls],['Daño recibido',Math.round(r.dmg)]);
    mis.def.medallas.forEach(m=>rows.push([(r.medals.includes(m.id)?'★ ':'☆ ')+m.texto,r.medals.includes(m.id)?'Sí':'No']));
    const next=PROXIMAS[0];
    if(next)rows.push(['Próxima: '+next.titulo,'En desarrollo']);
  }else if(run.mode==='carrera'){
    title='Carrera terminada';
    const best=records.carrera;
    if(!best||run.raceT<best){records.carrera=run.raceT;saveRecords();isNew=true;}
    rows.push(['Tiempo',fmtTime(run.raceT)],['Récord',fmtTime(records.carrera)]);
  }else{
    if(run.mode==='conquista')title=kind==='victoria'?'¡Planeta liberado!':'Sin vidas';
    else title='Caíste en la oleada '+run.wave;
    isNew=score>0&&score>run.best0;
    rows.push(['Puntos',fmtNum(score)],['Récord',fmtNum(record)],['Derribos',ship.kills]);
    if(run.mode==='conquista')rows.push(['Zonas liberadas',zones.filter(z=>z.state==='libre').length+'/'+zones.length],['Dificultad',DIFF[run.diff].name]);
    if(run.mode==='supervivencia')rows.push(['Oleada',run.wave],['Dificultad',DIFF[run.diff].name]);
    rows.push(['Tiempo',fmtTime(run.t)]);
  }
  $('#endTitle').textContent=title;
  $('#endText').textContent=text;$('#endText').hidden=!text;
  const st=$('#endStats');st.textContent='';
  rows.forEach(([k,v])=>{const d=document.createElement('div');d.append(k+' ');const b=document.createElement('b');b.textContent=v;d.append(b);st.append(d);});
  $('#endNew').hidden=!isNew;
  $('#endNew').textContent=run.mode==='historia'?'¡Mejor tiempo!':'¡Nuevo récord!';
  crashMsg.hidden=true;
  endEl.hidden=false;hud.classList.add('off');
  if(sfx.ctx&&sfx.ctx.state==='running')sfx.ctx.suspend();
}
document.querySelectorAll('.mode').forEach(b=>b.addEventListener('click',()=>{
  if(b.disabled)return;
  settings.lastMode=b.dataset.mode;saveSettings();syncMenu();
}));
$('#goBtn').addEventListener('click',()=>{
  unlock();
  if(settings.lastMode==='historia')openBrief(MISIONES[0]);
  else startRun(settings.lastMode||'conquista',settings.diff);
});
$('#menuGear').addEventListener('click',()=>{unlock();openSheet();});
$('#againBtn').addEventListener('click',()=>{unlock();if(run.mode==='historia')openBrief(mis.def||MISIONES[0]);else startRun(run.mode,run.diff);});
$('#endMenu').addEventListener('click',openMenu);
$('#toMenu').addEventListener('click',openMenu);
// Versión, aviso de datos de uso y "Dar tu opinión"
$('#ver').textContent='v'+APP_VERSION;
$('#statsOpt').hidden=!stats.configured;
function syncStatsNote(){$('#statsNote').hidden=!stats.configured||settings.statsSeen||settings.stats===false;}
$('#statsOk').addEventListener('click',()=>{settings.statsSeen=true;saveSettings();syncStatsNote();scrollHints();});
const feedbackUrl=(window.DELTA_UNO_STATS&&window.DELTA_UNO_STATS.feedback)||FEEDBACK_URL;
function openFeedback(from){
  stats.track('opinion_click',{desde:from});
  stats.flush(false);
  // en la app, Capacitor abre los enlaces de afuera en el navegador del teléfono
  if(stats.native())location.href=feedbackUrl;else window.open(feedbackUrl,'_blank','noopener');
}
['#feedbackBtn','#endFeedback'].forEach(s=>{const b=$(s);b.hidden=!feedbackUrl;b.addEventListener('click',()=>openFeedback(s==='#feedbackBtn'?'menu':'fin'));});

/* Deslizar los paneles con el dedo, también con la pantalla girada (el navegador solo no sabe hacerlo bien) */
function dragScroll(el){
  let drag=null,vel=0,raf=0,moved=false;
  const gy=e=>toGame(e.clientX,e.clientY).y;
  el.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse')return;
    cancelAnimationFrame(raf);moved=false;vel=0;
    const y=gy(e);drag={id:e.pointerId,y0:y,last:y,top:el.scrollTop,t:performance.now()};
  });
  el.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const y=gy(e),now=performance.now();
    if(!moved&&Math.abs(y-drag.y0)>7)moved=true;
    if(!moved)return;
    el.scrollTop=drag.top-(y-drag.y0);
    vel=vel*.5+((drag.last-y)/Math.max(1,now-drag.t))*.5;drag.last=y;drag.t=now;
  });
  const end=e=>{
    if(!drag||e.pointerId!==drag.id)return;
    drag=null;
    if(!moved)return;
    let v=vel*16;
    const step=()=>{if(Math.abs(v)<.4)return;el.scrollTop+=v;v*=.93;raf=requestAnimationFrame(step);};
    raf=requestAnimationFrame(step);
  };
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
  el.addEventListener('click',e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false;}},true); // un deslizamiento no es un toque
  el.addEventListener('scroll',scrollHints,{passive:true});
}
// "Deslizá para ver más" solo si hay algo abajo
function scrollHints(){
  document.querySelectorAll('.scrollHint').forEach(h=>{
    const el=h.parentElement;
    h.hidden=el.scrollHeight-el.clientHeight-el.scrollTop<8;
  });
}
['#sheetBody','#menuBody','#endBody','#briefBody'].forEach(s=>dragScroll($(s)));

/* ---------- Marcas en pantalla ---------- */
const marks=Array.from({length:ENEMY_MAX},()=>{
  const el=document.createElement('div');el.className='mk';el.hidden=true;
  el.innerHTML='<svg class="box" viewBox="-17 -17 34 34"><path d="M-14-7v-7h7M7-14h7v7M14 7v7h-7M-7 14h-7v-7" fill="none" stroke="currentColor" stroke-width="2"/></svg><svg class="arrow" viewBox="-17 -17 34 34"><path d="M13 0-7-9l4 9-4 9Z" fill="currentColor" stroke="#0a1022" stroke-width="1"/></svg><u><b></b></u><em></em>';
  $('#marks').appendChild(el);
  return {el,bar:el.querySelector('u b'),dist:el.querySelector('em'),dT:0};
});
const elTgt=$('#tgtBtn'),elTgtWord=$('#tgtWord');
const elLock=$('#lockMk'),elLockBox=$('#lockMk svg'),elLockText=$('#lockText'),elMissile=$('#missile'),elMissileN=$('#missileN'),elMissileBar=$('#missileBar'),elRepair=$('#repair'),elRepairWord=$('#repairWord');
const _vp=new V3();
// Devuelve la posición en pantalla; si queda afuera, la pega al borde y dice hacia dónde apunta
function screenSpot(world,out){
  _vp.copy(world).applyMatrix4(camera.matrixWorldInverse);
  const front=_vp.z<-1,cx=gw/2,cy=gh/2;
  let dx=_vp.x,dy=-_vp.y;
  if(front){
    _v.copy(_vp).applyMatrix4(camera.projectionMatrix);
    const x=(_v.x*.5+.5)*gw,y=(-_v.y*.5+.5)*gh;
    if(x>30&&x<gw-30&&y>30&&y<gh-30){out.x=x;out.y=y;out.off=false;return out;}
    dx=x-cx;dy=y-cy;
  }
  const mx=cx-52,my=cy-40,k=Math.min(mx/(Math.abs(dx)||1e-3),my/(Math.abs(dy)||1e-3));
  out.x=cx+dx*k;out.y=cy+dy*k;out.off=true;out.a=Math.atan2(dy,dx);
  return out;
}
const _spot={x:0,y:0,off:false,a:0};
function updateCombatHud(dt){
  marks.forEach((m,i)=>{
    const e=enemies[i];
    if(!e||dead>0){if(!m.el.hidden){m.el.hidden=true;m.el.classList.remove('sel');}return;}
    screenSpot(e.pos,_spot);
    // Las flechas de borde son solo para quien te está atacando; los que patrullan lejos no molestan
    const sel=e===camTarget;
    const show=sel||e.group.state==='attack'||e.def.carrier||(!_spot.off&&e.pos.distanceTo(ship.pos)<1500);
    m.el.classList.toggle('sel',sel);
    if(sel){
      m.dT-=dt;
      if(m.dT<=0){m.dT=.2;m.dist.textContent='Blanco '+Math.round(e.pos.distanceTo(ship.pos));}
    }
    if(!show){if(!m.el.hidden)m.el.hidden=true;return;}
    if(m.el.hidden)m.el.hidden=false;
    if(_spot.off){
      m.el.classList.add('off');
      m.el.style.transform='translate('+_spot.x.toFixed(1)+'px,'+_spot.y.toFixed(1)+'px) rotate('+_spot.a.toFixed(3)+'rad)';
    }else{
      m.el.classList.remove('off');
      m.el.style.transform='translate('+_spot.x.toFixed(1)+'px,'+_spot.y.toFixed(1)+'px)';
      m.bar.style.transform='scaleX('+(e.hp/e.def.hp).toFixed(2)+')';
    }
    m.el.classList.toggle('tgt',e===target);
    m.el.classList.toggle('pr',!!e.practice);
  });
  if(target&&dead<=0){
    screenSpot(leadPoint,_spot);
    if(!_spot.off){elLead.removeAttribute('hidden');elLead.style.transform='translate('+(_spot.x-13).toFixed(1)+'px,'+(_spot.y-13).toFixed(1)+'px)';}
    else elLead.setAttribute('hidden','');
  }else if(!elLead.hasAttribute('hidden'))elLead.setAttribute('hidden','');
  // Recuadro de fijación: se cierra sobre el blanco a medida que avanza
  if(lockOn&&lockTarget&&dead<=0){
    screenSpot(lockTarget.pos,_spot);
    if(!_spot.off){
      if(elLock.hidden)elLock.hidden=false;
      elLock.style.transform='translate('+_spot.x.toFixed(1)+'px,'+_spot.y.toFixed(1)+'px)';
      elLockBox.style.transform='scale('+(2.1-lockP*1.1).toFixed(3)+')';
      const done=lockP>=1;
      elLock.classList.toggle('locked',done);
      const txt=done?'Fijado':'Fijando';
      if(elLockText.textContent!==txt)elLockText.textContent=txt;
    }else if(!elLock.hidden)elLock.hidden=true;
  }else if(!elLock.hidden)elLock.hidden=true;
  elMissile.classList.toggle('locking',lockOn&&lockP<1);
  elMissile.classList.toggle('locked',lockOn&&lockP>=1);
  const flashColor=hitFlash>0?'#ffffff':'';
  if(elRet.style.color!==flashColor)elRet.style.color=flashColor;

  // Zona enemiga más cercana, cuando estás afuera
  let near=null;
  for(const z of zones)if(z.state==='hostil'&&(!near||z.arc<near.arc))near=z;
  const ringNext=run.mode==='carrera'&&!run.over?course[run.ring]:null;
  const objective=run.mode==='historia'&&dead<=0?histObjective():null;
  if(objective){
    elZoneMk.hidden=false;
    screenSpot(objective.pos,_spot);
    elZoneMk.style.transform='translate('+_spot.x.toFixed(1)+'px,'+_spot.y.toFixed(1)+'px)';
    zoneMkT-=dt;
    if(zoneMkT<=0){zoneMkT=.2;elZoneDist.textContent=objective.label+' · '+Math.round(objective.pos.distanceTo(ship.pos));}
  }else if(ringNext&&dead<=0){
    elZoneMk.hidden=false;
    screenSpot(ringNext.pos,_spot);
    elZoneMk.style.transform='translate('+_spot.x.toFixed(1)+'px,'+_spot.y.toFixed(1)+'px)';
    zoneMkT-=dt;
    if(zoneMkT<=0){zoneMkT=.2;elZoneDist.textContent='Anillo '+(run.ring+1)+' · '+Math.round(ringNext.pos.distanceTo(ship.pos));}
  }else if(near&&near.arc>near.r&&dead<=0){
    elZoneMk.hidden=false;
    _a.copy(near.dir).multiplyScalar(PLANET_R+380);
    screenSpot(_a,_spot);
    elZoneMk.style.transform='translate('+_spot.x.toFixed(1)+'px,'+_spot.y.toFixed(1)+'px)';
    zoneMkT-=dt;
    if(zoneMkT<=0){zoneMkT=.25;elZoneDist.textContent=near.kind.name+' · '+Math.round(near.arc-near.r);}
  }else if(!elZoneMk.hidden)elZoneMk.hidden=true;

  if(hurtA>.01){hurtA*=Math.exp(-5*dt);elHurt.style.opacity=(hurtA*.8).toFixed(3);}
  else if(hurtA>0){hurtA=0;elHurt.style.opacity=0;}
  if(dmgA>.01){dmgA*=Math.exp(-2.6*dt);elDmg.style.opacity=dmgA.toFixed(3);}
  else if(dmgA>0){dmgA=0;elDmg.style.opacity=0;}
  elFx.style.opacity=(ship.tf*.85).toFixed(3);
  elHeat.style.transform='scaleY('+heat.toFixed(3)+')';
  if(toastT>0){toastT-=dt;if(toastT<=0)elToast.hidden=true;}
  vitT-=dt;
  if(vitT<=0){
    vitT=.08;
    elBarShield.style.transform='scaleX('+(shield/SHIELD_MAX).toFixed(3)+')';
    elBarHull.style.transform='scaleX('+(hull/HULL_MAX).toFixed(3)+')';
    elBarDodge.style.transform='scaleX('+(1-dodge.cool/DODGE_COOL).toFixed(3)+')';
    elVitals.classList.toggle('low',hull<25);
    thrust.classList.toggle('hot',overheat>0);
    $('#rollL').classList.toggle('cool',dodge.cool>0);
    $('#rollR').classList.toggle('cool',dodge.cool>0);
    const tgOn=!!(camTarget&&camTarget.on);
    elTgt.classList.toggle('active',tgOn);
    const tgTxt=tgOn?'Cambiar':'Blanco';
    if(elTgtWord.textContent!==tgTxt)elTgtWord.textContent=tgTxt;
    const mTxt=String(missiles);
    if(elMissileN.textContent!==mTxt)elMissileN.textContent=mTxt;
    elMissile.classList.toggle('empty',missiles<=0);
    elMissileBar.style.transform='scaleX('+(missiles<MISSILE_MAX?1-missileT/MISSILE_RELOAD:0).toFixed(3)+')';
    const rTxt=repairT>0?Math.ceil(repairT)+' s':repairCool>0?Math.ceil(repairCool)+' s':'Reparar';
    if(elRepairWord.textContent!==rTxt)elRepairWord.textContent=rTxt;
    elRepair.classList.toggle('active',repairT>0);
    elRepair.classList.toggle('cool',repairT<=0&&repairCool>0);
  }
}

/* ---------- Bucle ---------- */
const maxPR=Math.min(window.devicePixelRatio||1,2);
let pr=maxPR,last=performance.now(),ema=16,prT=0;
renderer.setPixelRatio(pr);
// Cuadros por segundo para los datos de uso: promedio y el peor segundo de cada minuto jugado
const perf={f:0,t:0,secF:0,secT:0,min:999,runF:0,runT:0};
function perfReset(){perf.f=perf.t=perf.secF=perf.secT=perf.runF=perf.runT=0;perf.min=999;}
function perfStep(raw){
  perf.f++;perf.t+=raw;perf.runF++;perf.runT+=raw;perf.secF++;perf.secT+=raw;
  if(perf.secT>=1){perf.min=Math.min(perf.min,perf.secF/perf.secT);perf.secF=perf.secT=0;}
  if(perf.t>=60){
    stats.track('rendimiento',{fps_prom:Math.round(perf.f/perf.t),fps_min:Math.round(perf.min),resolucion:pr,enemigos:enemies.length,pantalla:gw+'x'+gh});
    perf.f=perf.t=0;perf.min=999;
  }
}
function gpuName(){
  try{const gl=renderer.getContext(),x=gl.getExtension('WEBGL_debug_renderer_info');return String(gl.getParameter(x?x.UNMASKED_RENDERER_WEBGL:gl.RENDERER)).slice(0,120);}catch(e){return '';}
}
function frame(now){
  requestAnimationFrame(frame);
  const raw=(now-last)/1000;last=now;
  if(document.hidden)return;
  const dt=clamp(raw,.001,.05);
  stepPad(); // también en pausa: Start la abre y la cierra
  if(!sheetOpen()&&!overlayOpen()){
    ship.t+=dt;
    readInput(dt);
    if(dead>0){dead-=dt;if(dead<=0){if(run.over==='derrota'){dead=1e9;showEnd('derrota');}else respawn();}}
    else{stepFlight(dt);groundCheck(dt);}
    if(inv>0){inv-=dt;if(dead<=0)shipGroup.visible=inv<=0||Math.floor(inv*12)%2===0;}
    stepCombat(dt);
    stepZones(dt);
    stepRun(dt);
    threat.lock=0;
    stepEnemies(dt);
    stepAllies(dt);
    stepRadio(dt);
    stepBolts(dt);
    stepMissiles(dt);
    stepEnemyMissiles(dt);
    stepEnemyBolts(dt);
    stepDrops(dt);
    stepRocks(dt);
    stepParticles(dt);
    stepSmoke(dt);
    stepTrails(dt);
    stepTerrain(false);
    stepCamera(dt,ship.t);
    updateShadow();
    stepDust();
    updateHud(dt);
    updateCombatHud(dt);
    updateAllyHud();
    updateThreat(dt);
    sfxEngine();
    if(run.live&&raw<.5)perfStep(raw);
  }
  renderer.render(scene,camera);
  // Si el teléfono no da abasto, baja la resolución en vez de trabar el vuelo
  ema+=(raw*1000-ema)*.06;prT+=raw;
  if(prT>1.4){prT=0;if(ema>25&&pr>1){pr=Math.max(1,pr-.25);renderer.setPixelRatio(pr);renderer.setSize(gw,gh,false);ema=16;}}
}

document.addEventListener('visibilitychange',()=>{
  if(document.hidden){releaseAll();dropKeys();if(sfx.ctx&&sfx.ctx.state==='running')sfx.ctx.suspend();}
  else{last=performance.now();if(sfx.ctx&&!sheetOpen()&&!overlayOpen())sfx.ctx.resume();if(unlocked)requestWake();}
});

function boot(data){
  const t0=performance.now();
  buildPlanet();
  buildZones();
  const buildMs=performance.now()-t0;
  try{
    const d=data&&data.ship;
    if(d&&d.world==='esfera'&&Array.isArray(d.pos)&&Array.isArray(d.q)){
      ship.pos.fromArray(d.pos);ship.q.fromArray(d.q);ship.throttle=clamp(+d.throttle||CRUISE,THROTTLE_MIN,1);ship.rocks=d.rocks|0;
      U.copy(ship.pos).normalize();
      fwd.set(0,0,-1).applyQuaternion(ship.q);right.set(1,0,0).applyQuaternion(ship.q);up.set(0,1,0).applyQuaternion(ship.q);
      ship.speed=ship.throttle*TUNE.vmax;ship.vel.copy(fwd).multiplyScalar(ship.speed);
      camFwd.copy(fwd);camUp.copy(up);
      const top=PLANET_R+clearance(U,fwd);
      if(ship.pos.length()<top+40)ship.pos.setLength(top+75);
    }
  }catch(e){}
  shipGroup.position.copy(ship.pos);shipGroup.quaternion.copy(ship.q);
  stepTerrain(true);
  try{if(window.claude&&window.claude.hot&&window.claude.hot.snapshot)window.claude.hot.snapshot(()=>({ship:{world:'esfera',pos:ship.pos.toArray(),q:ship.q.toArray(),throttle:ship.throttle,rocks:ship.rocks}}));}catch(e){}
  $('#loading').hidden=true;
  openMenu();
  // Primer dato de uso: con qué equipo se juega y de dónde vino el jugador
  const ini={primera_vez:stats.firstTime,gpu:gpuName(),dpr:window.devicePixelRatio||1,memoria_gb:navigator.deviceMemory,nucleos:navigator.hardwareConcurrency,idioma:navigator.language,carga_ms:Math.round(buildMs),resolucion:pr};
  try{ini.$referrer=document.referrer||'$direct';ini.$referring_domain=document.referrer?new URL(document.referrer).hostname:'$direct';}catch(e){}
  try{const q=new URLSearchParams(location.search);['utm_source','utm_medium','utm_campaign'].forEach(k=>{if(q.get(k))ini[k]=q.get(k);});}catch(e){}
  stats.track('sesion_inicio',ini);
  window.addEventListener('pagehide',()=>{endRunStats('cierre');stats.track('sesion_fin',{duracion_s:stats.sessionSecs(),partidas:run.count});stats.flush(true);});
  window.DeltaUno={renderer,ship,input,settings,TUNE,rocks,activeRocks,rings,chart,chartDir,straighten,terrain,heightAt,S,BIOMES,PLANET_R,CEIL:{CEIL_WARN,CEIL_PUSH,CEIL_MAX},buildMs,flags:()=>({dead,inv,warning,thinWarn}),
    zones,groups,enemies,lost,drops,DROP_KIND,damage,spawnDrop,dodge,tryDodge,rockets,lockCancel,AIM,seenVel,ZONE_KIND,eBolts,boltHitsShip,
    tgt:()=>camTarget,camBlend:()=>camBlend,camera,
    binds,turbo,inputDev:()=>inputDev,stats,perf,endRunStats,mis,allies,radio,MISIONES,REPARTO,misCourse,progress,openBrief,histObjective,crossedRing,SECTOR_OUT,RADIO_GAP,eMsl,EM,threat,lineOfSight,TOWER_H,camFwd,hitEnemyForTest:e=>hitEnemy(e,e.pos,99),setInv:v=>{inv=v;},setMissiles:n=>{missiles=n;},startRun,run,openMenu,showEnd,carrier:()=>carrier,course,RING_N,records,MODES,DIFF,ENEMY_DEF,GROUP_T,makeGroup,roamZone,waveZone,carrierZone,overlayOpen,lives:()=>run.lives,
    vit:()=>({hull,shield,heat,overheat,score,record,combo,curZone:curZone&&zones.indexOf(curZone),target:!!target,fov:camera.fov,missiles,missileT,lockOn,lockP,hasLock:!!lockTarget,repairT,repairCool})};
  last=performance.now();
  requestAnimationFrame(frame);
}
function start(data){
  syncSheet();showThrust();layout();
  if(window.ResizeObserver)new ResizeObserver(layout).observe(stage);
  window.addEventListener('resize',layout);
  window.addEventListener('orientationchange',layout);
  setTimeout(()=>boot(data),30); // deja pintar el aviso antes de calcular el planeta
}
const hot=window.claude&&window.claude.hot;
if(hot&&hot.ready)hot.ready(start);else start((hot&&hot.data)||{});
})();
