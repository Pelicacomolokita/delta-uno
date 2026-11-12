/* ---------- Efectos: fuego, humo, restos, onda expansiva y escudo ----------
   Todo se dibuja con texturas hechas en código (sin archivos). Cuando llegue el pack de partículas de Kenney,
   alcanza con reemplazar las texturas de makePuffAtlas por las del pack.
   La cantidad de partículas depende de la calidad elegida (q.fx: 0,45 en Baja, 0,75 en Media, 1 en Alta). */

// Atlas de 4×4 bocanadas distintas: bordes irregulares con ruido, para que el fuego y el humo no sean círculos
function makePuffAtlas(T, fire) {
  const S = 64, cv = document.createElement('canvas');
  cv.width = cv.height = S * 4;
  const g = cv.getContext('2d');
  let s = fire ? 91 : 57; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let f = 0; f < 16; f++) {
    const ox = (f % 4) * S, oy = Math.floor(f / 4) * S;
    for (let i = 0; i < 14; i++) { // varios círculos suaves superpuestos
      const a = rnd() * Math.PI * 2, d = rnd() * S * 0.18, r = S * (0.14 + rnd() * 0.2);
      const x = ox + S / 2 + Math.cos(a) * d, y = oy + S / 2 + Math.sin(a) * d;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      if (fire) { gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.5, 'rgba(255,240,220,0.45)'); gr.addColorStop(1, 'rgba(255,220,200,0)'); }
      else { gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); }
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  }
  const t = new T.CanvasTexture(cv);
  return t;
}

// Un sistema de bocanadas (un solo dibujo para todas): crecen, giran, cambian de color y se desvanecen
function puffSystem(T, scene, N, tex, additive) {
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), alpha = new Float32Array(N), frame = new Float32Array(N), rot = new Float32Array(N);
  const vel = new Float32Array(N * 3), life = new Float32Array(N), max = new Float32Array(N), s0 = new Float32Array(N), s1 = new Float32Array(N), kind = new Uint8Array(N), spin = new Float32Array(N), a0 = new Float32Array(N), base = new Float32Array(N * 3);
  const geo = new T.BufferGeometry();
  const attr = (name, arr, n) => { const a = new T.BufferAttribute(arr, n); a.setUsage(T.DynamicDrawUsage); geo.setAttribute(name, a); return a; };
  attr('position', pos, 3); attr('aCol', col, 3); attr('aSize', size, 1); attr('aAlpha', alpha, 1); attr('aFrame', frame, 1); attr('aRot', rot, 1);
  const uni = { uMap: { value: tex }, uScale: { value: 600 } };
  const mat = new T.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, fog: false,
    blending: additive ? T.AdditiveBlending : T.NormalBlending,
    vertexShader: `attribute vec3 aCol;attribute float aSize;attribute float aAlpha;attribute float aFrame;attribute float aRot;
      uniform float uScale;varying vec3 vCol;varying float vA;varying float vF;varying float vR;
      void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=aAlpha<=0.?0.:min(aSize*uScale/max(-mv.z,1.),512.);vCol=aCol;vA=aAlpha;vF=aFrame;vR=aRot;}`,
    fragmentShader: `uniform sampler2D uMap;varying vec3 vCol;varying float vA;varying float vF;varying float vR;
      void main(){vec2 p=gl_PointCoord-.5;float c=cos(vR),s=sin(vR);p=vec2(c*p.x-s*p.y,s*p.x+c*p.y)+.5;
        if(p.x<0.||p.y<0.||p.x>1.||p.y>1.)discard;
        vec2 uv=(vec2(mod(vF,4.),floor(vF/4.))+p)/4.;vec4 t=texture2D(uMap,vec2(uv.x,1.-uv.y));
        gl_FragColor=vec4(vCol*t.rgb,t.a*vA);}`
  });
  const pts = new T.Points(geo, mat);
  pts.frustumCulled = false; pts.renderOrder = additive ? 3 : 2;
  scene.add(pts);
  let next = 0;
  return {
    uni,
    // k: 0 fuego (blanco → naranja → rojo oscuro), 1 humo (gris que se aclara)
    emit(p, vx, vy, vz, sizeA, sizeB, lifeS, k, grey, alpha0) {
      const i = next; next = (next + 1) % N;
      const j = i * 3;
      pos[j] = p.x; pos[j + 1] = p.y; pos[j + 2] = p.z;
      vel[j] = vx; vel[j + 1] = vy; vel[j + 2] = vz;
      life[i] = max[i] = lifeS; s0[i] = sizeA; s1[i] = sizeB; kind[i] = k;
      frame[i] = Math.floor(Math.random() * 16); rot[i] = Math.random() * 6.283; spin[i] = (Math.random() - 0.5) * 1.6;
      a0[i] = alpha0 === undefined ? 1 : alpha0;
      base[j] = base[j + 1] = base[j + 2] = grey === undefined ? 0.16 : grey;
    },
    step(dt, scale) {
      uni.uScale.value = scale;
      const drag = Math.exp(-1.6 * dt);
      for (let i = 0; i < N; i++) {
        if (life[i] <= 0) { if (alpha[i] !== 0) alpha[i] = 0; continue; }
        const j = i * 3;
        life[i] -= dt;
        const u = Math.max(life[i], 0) / max[i], t = 1 - u; // t: 0 al nacer, 1 al morir
        pos[j] += vel[j] * dt; pos[j + 1] += vel[j + 1] * dt; pos[j + 2] += vel[j + 2] * dt;
        vel[j] *= drag; vel[j + 1] *= drag; vel[j + 2] *= drag;
        rot[i] += spin[i] * dt;
        size[i] = s0[i] + (s1[i] - s0[i]) * (1 - (1 - t) * (1 - t));
        if (kind[i] === 0) {
          // fuego: blanco amarillento, naranja y rojo oscuro
          // (se suman entre sí: cada una aporta poco para que el centro no quede amarillo plano)
          const gg = t < 0.12 ? 0.9 - t * 2.5 : Math.max(0.1, 0.6 - (t - 0.12) * 0.9), b = t < 0.1 ? 0.6 - t * 5 : 0.03;
          const fade = (t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45) * 0.62;
          col[j] = fade * (1 - t * 0.45); col[j + 1] = gg * fade; col[j + 2] = b * fade;
          alpha[i] = a0[i] * Math.min(1, u * 3);
        } else {
          // humo: aparece rápido, se aclara un poco y se va desvaneciendo
          const gcol = base[j] + t * 0.18;
          col[j] = col[j + 1] = col[j + 2] = gcol;
          alpha[i] = a0[i] * Math.min(1, t * 8) * u * u * 0.85;
        }
      }
      const a = geo.attributes;
      a.position.needsUpdate = a.aCol.needsUpdate = a.aSize.needsUpdate = a.aAlpha.needsUpdate = a.aRot.needsUpdate = true;
      a.aFrame.needsUpdate = true;
    },
    clear() { life.fill(0); alpha.fill(0); }
  };
}

export function createEffects(T, scene, camera, getQ) {
  const fireTex = makePuffAtlas(T, true), smokeTex = makePuffAtlas(T, false);
  const fire = puffSystem(T, scene, 260, fireTex, true);
  const smoke = puffSystem(T, scene, 220, smokeTex, false);
  const _v = new T.Vector3(), _u = new T.Vector3(), _c = new T.Vector3(), _q = new T.Quaternion(), _m = new T.Matrix4(), _s = new T.Vector3(1, 1, 1);

  /* Restos: pedazos de chapa que salen volando, caen hacia el planeta y dejan una estela de humo */
  const DEB_N = 64;
  const debGeo = new T.TetrahedronGeometry(0.55, 0);
  debGeo.scale(1, 0.35, 1.6);
  const debMat = new T.MeshLambertMaterial({ color: 0x3b3e44, emissive: 0x120804 });
  const debris = new T.InstancedMesh(debGeo, debMat, DEB_N);
  debris.instanceMatrix.setUsage(T.DynamicDrawUsage);
  debris.frustumCulled = false; debris.count = DEB_N;
  scene.add(debris);
  const deb = Array.from({ length: DEB_N }, () => ({ on: false, p: new T.Vector3(), v: new T.Vector3(), q: new T.Quaternion(), w: new T.Vector3(), life: 0, s: 1, trail: 0, hot: 0 }));
  const hide = new T.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < DEB_N; i++) debris.setMatrixAt(i, hide);
  let debNext = 0;

  /* Onda expansiva: un anillo que crece mirando a la cámara */
  const ringTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 30, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.72, 'rgba(255,230,200,0.85)'); gr.addColorStop(0.86, 'rgba(255,200,150,0.35)'); gr.addColorStop(1, 'rgba(255,200,150,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c);
  })();
  const waves = Array.from({ length: 5 }, () => {
    const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, color: 0xffd7b0 }));
    m.visible = false; m.renderOrder = 4; scene.add(m);
    return { m, t: 1, r: 1 };
  });
  let waveNext = 0;

  const fx = () => (getQ().fx || 1);

  return {
    fire, smoke,
    // Explosión con fuego, humo, restos y onda. at: posición; radius: tamaño (las naves chicas ~6, la nodriza ~30)
    explode(at, radius, carry) {
      const q = getQ(), k = fx(), cv = _c.copy(carry || _u.set(0, 0, 0));
      const up = _v.copy(at).normalize();
      const nf = Math.round(Math.min(26, 7 + radius * 0.9) * k);
      for (let i = 0; i < nf; i++) {
        const d = _u.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(radius * (0.6 + Math.random() * 1.6));
        fire.emit(at, d.x + cv.x * 0.3, d.y + cv.y * 0.3, d.z + cv.z * 0.3, radius * (0.5 + Math.random() * 0.4), radius * (1.5 + Math.random() * 1.2), 0.45 + Math.random() * 0.5, 0);
      }
      const ns = Math.round(Math.min(18, 4 + radius * 0.5) * k);
      for (let i = 0; i < ns; i++) {
        const d = _u.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(radius * 0.5);
        smoke.emit(at, d.x + up.x * 3, d.y + up.y * 3, d.z + up.z * 3, radius * 0.9, radius * (3 + Math.random() * 1.5), 1.8 + Math.random() * 1.8, 1, 0.1 + Math.random() * 0.08, 0.9);
      }
      const nd = Math.round(Math.min(q.debris || 14, 3 + radius * 0.6) * (k >= 0.7 ? 1 : 0.6));
      for (let i = 0; i < nd; i++) {
        const d = deb[debNext]; debNext = (debNext + 1) % DEB_N;
        d.on = true; d.p.copy(at);
        d.v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(radius * (2 + Math.random() * 3)).addScaledVector(up, radius * 1.2).addScaledVector(cv, 0.3);
        d.q.set(Math.random(), Math.random(), Math.random(), Math.random()).normalize();
        d.w.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(14);
        d.life = 1.4 + Math.random() * 1.6; d.s = Math.min(2.6, 0.5 + radius * 0.08) * (0.6 + Math.random() * 0.8); d.trail = 0; d.hot = 1;
      }
      if (q.shock !== false && radius >= 4) {
        const w = waves[waveNext]; waveNext = (waveNext + 1) % waves.length;
        w.m.position.copy(at); w.t = 0; w.r = radius; w.m.visible = true;
      }
    },
    // Chispas de impacto: usan el fuego, chiquitas y rápidas
    sparks(at, n, speed) {
      const k = fx(), c = Math.max(1, Math.round(n * k));
      for (let i = 0; i < c; i++) {
        const d = _u.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(speed * (0.4 + Math.random()));
        fire.emit(at, d.x, d.y, d.z, 0.5, 0.15, 0.18 + Math.random() * 0.2, 0, 0, 0.9);
      }
    },
    // Humo suelto (estelas de misil, daño de la nave)
    puff(at, vx, vy, vz, size, lifeS, grey, alpha) { smoke.emit(at, vx, vy, vz, size * 0.6, size * 2.2, lifeS, 1, grey, alpha); },
    step(dt, scale) {
      fire.step(dt, scale); smoke.step(dt, scale);
      for (let i = 0; i < DEB_N; i++) {
        const d = deb[i];
        if (!d.on) continue;
        d.life -= dt;
        if (d.life <= 0) { d.on = false; debris.setMatrixAt(i, hide); continue; }
        _u.copy(d.p).normalize();
        d.v.addScaledVector(_u, -22 * dt).multiplyScalar(Math.exp(-0.5 * dt));
        d.p.addScaledVector(d.v, dt);
        _q.setFromAxisAngle(_v.copy(d.w).normalize(), d.w.length() * dt); d.q.premultiply(_q);
        const sc = d.s * Math.min(1, d.life * 2);
        _s.set(sc, sc, sc);
        _m.compose(d.p, d.q, _s); debris.setMatrixAt(i, _m);
        d.trail -= dt;
        if (d.trail <= 0 && d.hot > 0) {
          d.trail = 0.07 / Math.max(0.4, fx());
          smoke.emit(d.p, 0, 0, 0, 0.6 * d.s, 2.6 * d.s, 0.9 + Math.random() * 0.5, 1, 0.12, 0.7);
          if (d.life > 1.2 && Math.random() < 0.5) fire.emit(d.p, 0, 0, 0, 0.7 * d.s, 0.2, 0.25, 0, 0, 0.8);
        }
      }
      debris.instanceMatrix.needsUpdate = true;
      for (const w of waves) {
        if (!w.m.visible) continue;
        w.t += dt / 0.5;
        if (w.t >= 1) { w.m.visible = false; continue; }
        const e = 1 - (1 - w.t) * (1 - w.t);
        w.m.scale.setScalar(w.r * (1 + e * 9));
        w.m.material.opacity = (1 - w.t) * 0.9;
        w.m.quaternion.copy(camera.quaternion);
      }
    },
    clear() { fire.clear(); smoke.clear(); deb.forEach((d, i) => { d.on = false; debris.setMatrixAt(i, hide); }); waves.forEach(w => { w.m.visible = false; }); },
    debug: () => ({ debris: deb.filter(d => d.on).length, waves: waves.filter(w => w.m.visible).length })
  };
}

/* Escudo: una cáscara alrededor de la nave que se ilumina más donde pegó el tiro */
export function createShield(T, parent) {
  const geo = new T.SphereGeometry(1, 28, 18);
  geo.scale(3.1, 1.25, 3.7);
  geo.translate(0, 0.1, -0.5);
  const uni = { uHit: { value: new T.Vector3(0, 0, -1) }, uA: { value: 0 }, uT: { value: 0 } };
  const mat = new T.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, side: T.DoubleSide,
    vertexShader: `varying vec3 vN;varying vec3 vL;varying vec3 vV;
      void main(){vL=normalize(position);vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform vec3 uHit;uniform float uA;uniform float uT;varying vec3 vN;varying vec3 vL;varying vec3 vV;
      void main(){float fr=pow(1.-abs(dot(vN,vV)),2.2);
        float h=max(dot(vL,normalize(uHit)),0.);float spot=pow(h,10.);
        float ring=smoothstep(.08,.0,abs(h-uT))*step(.2,uT)*.8; // onda que se abre desde el impacto
        float hex=step(.86,fract((vL.x*7.+vL.z*4.)*1.2))+step(.86,fract((vL.x*-7.+vL.z*4.)*1.2));
        float a=uA*(fr*.55+spot*1.6+ring+hex*spot*.6);
        gl_FragColor=vec4(vec3(.53,.95,.9)*a,a);}`
  });
  const mesh = new T.Mesh(geo, mat);
  mesh.visible = false; mesh.renderOrder = 5;
  parent.add(mesh);
  return {
    mesh,
    hit(localDir) { uni.uHit.value.copy(localDir).normalize(); uni.uA.value = 1; uni.uT.value = 1; mesh.visible = true; },
    step(dt) {
      if (!mesh.visible) return;
      uni.uA.value *= Math.exp(-6 * dt);
      uni.uT.value = Math.max(0, uni.uT.value - dt * 2.2);
      if (uni.uA.value < 0.02) mesh.visible = false;
    }
  };
}
