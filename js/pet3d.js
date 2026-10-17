/* ============================================================
   pet3d.js — 低多边形 3D 宠物引擎（Three.js r128）
   · 六种宠物由基础几何体程序化拼装，无外部模型文件
   · 柔光 + 接触阴影 + 拖拽 360° 旋转
   · 待机动画：呼吸 / 眨眼 / 摇尾 / 耳朵微动 / 轻微浮动
   · 情绪动作：hop / jump / dance / eat / shake / spin / tilt
   ============================================================ */
"use strict";

const Pet3D = (() => {

  const stages = new Map(); // containerEl -> Stage

  const hasWebGL = (() => {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  })();

  /* ---------- 材质工厂 ---------- */
  function mat(color, opts = {}) {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: opts.rough !== undefined ? opts.rough : 0.68,
      metalness: 0.02,
      flatShading: false,
      ...opts.extra,
    });
  }

  /* ---------- 宠物模型 ---------- */
  function buildPet(sp, opts = {}) {
    const level = opts.level || 1;
    const stageInfo = stageOf(level);

    /* outer：动画位移 / 倾斜；spin：拖拽旋转 */
    const outer = new THREE.Group();
    const spin = new THREE.Group();
    outer.add(spin);

    const bodyMat = mat(sp.body);
    const shadeMat = mat(sp.shade);
    const bellyMat = mat(sp.belly, { rough: 0.8 });
    const innerMat = mat(sp.inner);
    const darkMat = mat(sp.id === "panda" ? "#3d3d3d" : "#43382e", { rough: 0.42 });
    const whiteMat = mat("#ffffff", { rough: 0.35 });
    const cheekMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(sp.cheek), transparent: true, opacity: 0.55, roughness: 0.9,
    });

    const model = new THREE.Group();
    spin.add(model);

    /* ============ 身体 ============ */
    const bodyGroup = new THREE.Group();
    bodyGroup.position.y = 0.92;
    model.add(bodyGroup);

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.82, 24, 18), bodyMat);
    body.scale.set(1, 0.94, 0.84);
    body.castShadow = true;
    bodyGroup.add(body);

    /* 肚皮 */
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 14), bellyMat);
    belly.scale.set(0.92, 0.88, 0.52);
    belly.position.set(0, -0.06, 0.34);
    bodyGroup.add(belly);

    /* 四肢 */
    const legs = [];
    [[-0.42, 0.26], [0.42, 0.26], [-0.42, -0.2], [0.42, -0.2]].forEach(([x, z], i) => {
      const leg = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 10), i < 2 ? bodyMat : shadeMat);
      leg.scale.set(0.85, 1.05, 0.9);
      leg.position.set(x, -0.68, z);
      leg.castShadow = true;
      bodyGroup.add(leg);
      legs.push(leg);
    });

    /* 猫/狐花纹（背部小色块） */
    if (sp.stripes) {
      for (let i = -1; i <= 1; i++) {
        const stripe = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), shadeMat);
        stripe.scale.set(1.7, 0.42, 0.9);
        stripe.position.set(i * 0.24, 0.55 - Math.abs(i) * 0.06, -0.42);
        bodyGroup.add(stripe);
      }
    }

    /* ============ 头部 ============ */
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.98;
    model.add(headGroup);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.78, 26, 20), bodyMat);
    head.scale.set(1, 0.96, 0.94);
    head.castShadow = true;
    headGroup.add(head);

    /* 熊猫眼罩 */
    if (sp.id === "panda") {
      const patchGeo = new THREE.SphereGeometry(0.27, 14, 10);
      [-0.28, 0.28].forEach(x => {
        const p = new THREE.Mesh(patchGeo, darkMat);
        p.scale.set(1, 1.15, 0.55);
        p.position.set(x, 0.04, 0.62);
        p.rotation.z = x > 0 ? -0.18 : 0.18;
        headGroup.add(p);
      });
    }

    /* 狐狸白下巴 */
    if (sp.id === "fox") {
      const chin = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), bellyMat);
      chin.scale.set(1, 0.72, 0.62);
      chin.position.set(0, -0.32, 0.38);
      headGroup.add(chin);
    }

    /* ---- 眼睛 ---- */
    const eyes = [];
    [-0.29, 0.29].forEach(x => {
      const eg = new THREE.Group();
      eg.position.set(x, 0.06, 0.66);

      const white = new THREE.Mesh(new THREE.SphereGeometry(0.185, 16, 12), whiteMat);
      white.scale.set(1, 1.12, 0.62);
      eg.add(white);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 10), darkMat);
      pupil.scale.set(1, 1.1, 0.7);
      pupil.position.set(0, 0, 0.1);
      eg.add(pupil);

      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), whiteMat);
      glint.position.set(-0.045, 0.055, 0.16);
      eg.add(glint);

      const glint2 = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), whiteMat);
      glint2.position.set(0.045, -0.04, 0.15);
      eg.add(glint2);

      headGroup.add(eg);
      eyes.push(eg);
    });

    /* ---- 腮红 ---- */
    [-0.52, 0.52].forEach(x => {
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), cheekMat);
      c.scale.set(1.25, 0.7, 0.28);
      c.position.set(x, -0.12, 0.56);
      c.rotation.y = x > 0 ? 0.42 : -0.42;
      headGroup.add(c);
    });

    /* ---- 鼻子 ---- */
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 8), innerMat);
    nose.scale.set(1.35, 0.85, 0.8);
    nose.position.set(0, -0.13, 0.75);
    headGroup.add(nose);

    /* ---- 嘴（微笑弧） ---- */
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.26, 0.73);
    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.115, 0.028, 6, 14, Math.PI),
      mat("#a97850", { rough: 0.6 })
    );
    smile.rotation.z = Math.PI;
    smile.rotation.x = 0.35;
    mouthGroup.add(smile);
    /* 张嘴（饥饿时显示） */
    const openMouth = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), mat("#d96a7e", { rough: 0.5 }));
    openMouth.scale.set(1, 1.2, 0.6);
    openMouth.visible = false;
    mouthGroup.add(openMouth);
    headGroup.add(mouthGroup);

    /* ---- 胡须（猫 / 狐 / 兔） ---- */
    if (["cat", "fox", "rabbit"].includes(sp.id)) {
      const whiskerMat = mat("#d8c7b0", { rough: 0.85 });
      [-1, 1].forEach(s => {
        for (let i = 0; i < 3; i++) {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.006, 0.4, 3), whiskerMat);
          w.position.set(s * 0.36, -0.18 - i * 0.075, 0.62);
          w.rotation.z = s * (Math.PI / 2 - 0.22 + i * 0.2);
          w.rotation.y = s * 0.28;
          headGroup.add(w);
        }
      });
    }

    /* ---- 耳朵 ---- */
    const ears = new THREE.Group();
    headGroup.add(ears);

    if (sp.ear === "point") {
      [-1, 1].forEach(s => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.62, 5), bodyMat);
        ear.position.set(s * 0.44, 0.76, -0.02);
        ear.rotation.z = -s * 0.24;
        ear.rotation.x = -0.12;
        ear.castShadow = true;
        ears.add(ear);
        const inner = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 5), innerMat);
        inner.position.set(s * 0.44, 0.74, 0.13);
        inner.rotation.z = -s * 0.24;
        inner.rotation.x = -0.12;
        ears.add(inner);
      });
    } else if (sp.ear === "flop") {
      [-1, 1].forEach(s => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), shadeMat);
        ear.scale.set(0.58, 1.05, 0.46);
        ear.position.set(s * 0.68, 0.16, 0);
        ear.rotation.z = s * 0.55;
        ear.castShadow = true;
        ears.add(ear);
      });
    } else if (sp.ear === "long") {
      [-1, 1].forEach(s => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 12), bodyMat);
        ear.scale.set(1, 2.7, 0.68);
        ear.position.set(s * 0.28, 1.0, -0.05);
        ear.rotation.z = -s * 0.15;
        ears.add(ear);
        const inner = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), innerMat);
        inner.scale.set(1, 2.5, 0.42);
        inner.position.set(s * 0.28, 1.0, 0.03);
        inner.rotation.z = -s * 0.15;
        ears.add(inner);
      });
    } else if (sp.ear === "round") {
      [-1, 1].forEach(s => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 10), darkMat);
        ear.position.set(s * 0.58, 0.63, -0.04);
        ear.scale.set(1, 0.92, 0.8);
        ears.add(ear);
      });
    } else if (sp.ear === "horn") {
      [-1, 1].forEach(s => {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.46, 5), bellyMat);
        horn.position.set(s * 0.4, 0.76, 0.02);
        horn.rotation.z = -s * 0.3;
        ears.add(horn);
      });
      /* 头顶小嵴 */
      for (let i = 0; i < 3; i++) {
        const ridge = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 4), shadeMat);
        ridge.position.set(0, 0.78 - i * 0.03, -0.12 - i * 0.11);
        model.add(ridge);
        ridge.position.y += 1.98;
      }
    }

    /* ---- 尾巴 ---- */
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.92, -0.66);
    model.add(tailGroup);

    if (sp.tail === "curl") {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.12, 0.34, -0.22),
        new THREE.Vector3(0.05, 0.7, -0.18),
        new THREE.Vector3(-0.16, 0.84, -0.05),
      ]);
      const tail = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.09, 8, false), bodyMat);
      tail.castShadow = true;
      tailGroup.add(tail);
    } else if (sp.tail === "fluffy") {
      const big = sp.id === "fox";
      const tail = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.38 : 0.28, 16, 12), bodyMat);
      tail.scale.set(0.85, big ? 1.25 : 1, big ? 2.0 : 1.5);
      tail.position.set(0, 0.16, -0.3);
      tail.rotation.x = -0.5;
      tail.castShadow = true;
      tailGroup.add(tail);
      if (big) {
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), bellyMat);
        tip.scale.set(0.85, 1, 1);
        tip.position.set(0, 0.55, -0.72);
        tailGroup.add(tip);
      }
    } else if (sp.tail === "puff") {
      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), mat(sp.id === "panda" ? "#f7f7f5" : sp.body));
      tail.position.set(0, 0.08, -0.18);
      tailGroup.add(tail);
    } else if (sp.tail === "spike") {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.05, -0.2, -0.3),
        new THREE.Vector3(0.0, -0.1, -0.62),
      ]);
      const tail = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.1, 8, false), bodyMat);
      tailGroup.add(tail);
      [-0.35, -0.5].forEach((z, i) => {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 4), bellyMat);
        spike.position.set(0, 0.02 + i * 0.05, z);
        spike.rotation.x = Math.PI / 2;
        tailGroup.add(spike);
      });
    }

    /* ---- 传奇皇冠 ---- */
    if (stageInfo.crown) {
      const crownGroup = new THREE.Group();
      crownGroup.position.set(0, 2.88, 0);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.12, 8), mat("#f5cf7a", { rough: 0.25, extra: { metalness: 0.45 } }));
      crownGroup.add(band);
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 4), mat("#f5cf7a", { rough: 0.25, extra: { metalness: 0.45 } }));
        const a = (i / 5) * Math.PI * 2;
        spike.position.set(Math.cos(a) * 0.28, 0.14, Math.sin(a) * 0.28);
        crownGroup.add(spike);
      }
      model.add(crownGroup);
    }

    /* ---- 成长体型 ---- */
    const modelScale = 1.04 * stageInfo.scale + 0.2;
    model.scale.setScalar(modelScale);

    return {
      outer, spin, model, bodyGroup, headGroup, ears, eyes, tailGroup,
      mouthGroup, smile, openMouth, legs, modelScale,
      parts: { body, head },
    };
  }

  /* ============ 舞台（每个宠物一个） ============ */
  class Stage {
    constructor(container, speciesId, opts) {
      this.container = container;
      this.speciesId = speciesId;
      this.opts = opts || {};
      this.disposed = false;
      this.act = null;
      this.blinkTimer = 2 + Math.random() * 3;
      this.blinkT = -1;
      this.earTimer = 4 + Math.random() * 4;
      this.earT = -1;
      this.clock = new THREE.Clock();
      this.drag = { active: false, lastX: 0, moved: 0, yaw: 0, autoT: 0 };
      this.pointerDownAt = 0;

      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(w, h, false);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.domElement.className = "pet3d-canvas";
      container.appendChild(this.renderer.domElement);

      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 100);
      this.setupCamera();

      this.setupLights();
      this.setupGround();

      const sp = speciesById(speciesId);
      this.pet = buildPet(sp, { level: this.opts.level || 1 });
      this.scene.add(this.pet.outer);
      this.setupCamera();

      this.applyMood();
      this.bindPointer();
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(container);

      this.loop = this.loop.bind(this);
      this.raf = requestAnimationFrame(this.loop);
    }

    /* 根据体型自动调整机位，保证幼崽到传奇都完整入画 */
    setupCamera() {
      const ms = this.pet ? this.pet.modelScale : 0.95;
      const fov = 34;
      const dist = (3.05 * ms) / (2 * 0.8 * Math.tan(fov * Math.PI / 360));
      this.camera.position.set(0, 1.45 * ms + 0.55, dist);
      this.camera.lookAt(0, 1.4 * ms, 0);
      this.camera.updateProjectionMatrix();
    }

    setupLights() {
      const hemi = new THREE.HemisphereLight(0xfffaf0, 0xcfc0a8, 0.62);
      this.scene.add(hemi);

      const key = new THREE.DirectionalLight(0xfff6e8, 1.05);
      key.position.set(3.2, 6, 4.5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.near = 0.5;
      key.shadow.camera.far = 20;
      key.shadow.camera.left = -4;
      key.shadow.camera.right = 4;
      key.shadow.camera.top = 5;
      key.shadow.camera.bottom = -2;
      key.shadow.radius = 4;
      key.shadow.bias = -0.0015;
      this.scene.add(key);

      const fill = new THREE.DirectionalLight(0xfff0dd, 0.32);
      fill.position.set(-4, 3.2, 3.4);
      this.scene.add(fill);

      const rim = new THREE.DirectionalLight(0xffe6c8, 0.55);
      rim.position.set(-1.5, 4.5, -5);
      this.scene.add(rim);
    }

    setupGround() {
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 14),
        new THREE.ShadowMaterial({ opacity: 0.16 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0.01;
      ground.receiveShadow = true;
      this.scene.add(ground);
    }

    /* 表情/状态 → 3D 表现 */
    applyMood() {
      const st = this.opts.stats || { food: 80, mood: 80, clean: 80, energy: 80 };
      let mood = "happy";
      if (st.food < 25) mood = "hungry";
      else if (st.energy < 22) mood = "sleepy";
      else if (st.clean < 25) mood = "dirty";
      else if (st.mood < 35) mood = "sad";

      const p = this.pet;
      if (!p) return;
      p.openMouth.visible = mood === "hungry";
      p.smile.visible = mood !== "hungry";
      if (this.container) this.container.dataset.mood = mood;
      this.mood = mood;
    }

    updateModel(level) {
      /* 等级变化 → 重建模型（形态/体型/皇冠变化） */
      if (level === this.opts.level) return;
      this.opts.level = level;
      this.scene.remove(this.pet.outer);
      disposeObject(this.pet.outer);
      const sp = speciesById(this.speciesId);
      this.pet = buildPet(sp, { level });
      this.scene.add(this.pet.outer);
      this.setupCamera();
      this.applyMood();
    }

    bindPointer() {
      const el = this.renderer.domElement;
      el.style.touchAction = "none";
      el.addEventListener("pointerdown", (e) => {
        this.drag.active = true;
        this.drag.lastX = e.clientX;
        this.drag.moved = 0;
        this.pointerDownAt = Date.now();
        el.setPointerCapture && el.setPointerCapture(e.pointerId);
      });
      el.addEventListener("pointermove", (e) => {
        if (!this.drag.active) return;
        const dx = e.clientX - this.drag.lastX;
        this.drag.lastX = e.clientX;
        this.drag.moved += Math.abs(dx);
        this.pet.spin.rotation.y += dx * 0.012;
        this.drag.yaw = this.pet.spin.rotation.y;
        this.drag.autoT = 0;
      });
      const end = () => {
        if (!this.drag.active) return;
        this.drag.active = false;
        /* 轻点（几乎没拖动）→ 触发表情互动 */
        if (this.drag.moved < 6 && Date.now() - this.pointerDownAt < 500 && this.onTap) {
          this.onTap();
        }
      };
      el.addEventListener("pointerup", end);
      el.addEventListener("pointercancel", end);
      el.addEventListener("pointerleave", () => { this.drag.active = false; });
    }

    resize() {
      if (this.disposed) return;
      const w = Math.max(1, this.container.clientWidth);
      const h = Math.max(1, this.container.clientHeight);
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }

    /* ---------- 动作 ---------- */
    play(name) {
      const durs = { hop: 620, jump: 800, dance: 1500, eat: 1100, shake: 900, spin: 900, tilt: 900, sleep: 2200 };
      this.act = { name, t: 0, dur: (durs[name] || 700) / 1000, spinStart: this.pet.spin.rotation.y };
    }

    /* ---------- 主循环 ---------- */
    loop() {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(this.loop);

      const dtRaw = this.clock.getDelta();
      const dt = Math.min(dtRaw, 0.05);
      const t = this.clock.elapsedTime;
      const p = this.pet;

      /* 待机：呼吸 + 轻微浮动 */
      const breathe = 1 + Math.sin(t * 2.1) * 0.018;
      p.bodyGroup.scale.set(1, breathe, 1);
      const baseY = Math.sin(t * 1.5) * 0.025;
      p.outer.position.y = baseY;

      /* 尾巴摇摆 */
      p.tailGroup.rotation.z = Math.sin(t * 3.1) * 0.22;
      p.tailGroup.rotation.x = Math.sin(t * 2.3) * 0.06;

      /* 自动轻旋（未拖拽时） */
      this.drag.autoT += dt;
      if (!this.drag.active && this.drag.autoT > 2.5) {
        p.spin.rotation.y = Math.sin(t * 0.45) * 0.38;
      }

      /* 眨眼 */
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0 && this.blinkT < 0) {
        this.blinkT = 0;
        this.blinkTimer = 2.6 + Math.random() * 3.4;
      }
      if (this.blinkT >= 0) {
        this.blinkT += dt;
        const bp = this.blinkT / 0.16;
        const closed = bp < 0.5 ? bp * 2 : (1 - bp) * 2;
        const sy = 1 - Math.min(1, Math.max(0, closed)) * 0.92;
        p.eyes.forEach(e => { e.scale.y = sy; });
        if (bp >= 1) { this.blinkT = -1; p.eyes.forEach(e => { e.scale.y = 1; }); }
      }

      /* 困倦：眼睛半闭 */
      if (this.mood === "sleepy" && this.blinkT < 0) {
        p.eyes.forEach(e => { e.scale.y = 0.38 + Math.sin(t * 1.2) * 0.04; });
      }

      /* 耳朵微动 */
      this.earTimer -= dt;
      if (this.earTimer <= 0 && this.earT < 0) {
        this.earT = 0;
        this.earTimer = 4.5 + Math.random() * 5;
      }
      if (this.earT >= 0) {
        this.earT += dt;
        const ep = Math.min(1, this.earT / 0.55);
        const wobble = Math.sin(ep * Math.PI * 3) * (1 - ep) * 0.2;
        p.ears.rotation.z = wobble;
        p.ears.rotation.x = wobble * 0.4;
        if (ep >= 1) { this.earT = -1; p.ears.rotation.set(0, 0, 0); }
      }

      /* 执行动作 */
      if (this.act) {
        this.act.t += dt;
        const prog = Math.min(1, this.act.t / this.act.dur);
        const ease = Math.sin(prog * Math.PI);
        switch (this.act.name) {
          case "hop":
            p.outer.position.y = baseY + ease * 0.45;
            break;
          case "jump":
            p.outer.position.y = baseY + ease * 1.0;
            p.outer.scale.setScalar(1 + ease * 0.04);
            break;
          case "dance": {
            const s = Math.sin(prog * Math.PI * 8);
            p.outer.rotation.z = s * 0.13;
            p.outer.position.y = baseY + Math.abs(s) * 0.16;
            p.ears.rotation.z = -s * 0.2;
            p.tailGroup.rotation.z = s * 0.5;
            p.headGroup.rotation.z = s * 0.09;
            break;
          }
          case "eat":
            p.headGroup.rotation.x = Math.abs(Math.sin(prog * Math.PI * 5)) * 0.22;
            break;
          case "shake": {
            const s = Math.sin(prog * Math.PI * 12) * (1 - prog);
            p.outer.rotation.z = s * 0.28;
            p.outer.position.x = s * 0.12;
            break;
          }
          case "spin":
            p.spin.rotation.y = this.act.spinStart + prog * Math.PI * 2;
            p.outer.position.y = baseY + ease * 0.25;
            break;
          case "tilt":
            p.headGroup.rotation.z = ease * 0.28;
            break;
          case "sleep":
            p.headGroup.rotation.x = ease * 0.2;
            break;
        }
        if (prog >= 1) {
          this.act = null;
          p.outer.position.set(0, baseY, 0);
          p.outer.rotation.set(0, 0, 0);
          p.outer.scale.setScalar(1);
          p.headGroup.rotation.set(0, 0, 0);
          this.drag.autoT = 0;
        }
      }

      this.renderer.render(this.scene, this.camera);
    }

    dispose() {
      this.disposed = true;
      cancelAnimationFrame(this.raf);
      if (this.resizeObserver) this.resizeObserver.disconnect();
      if (this.pet) disposeObject(this.pet.outer);
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }

  function disposeObject(obj) {
    obj.traverse(n => {
      if (n.geometry) n.geometry.dispose();
      if (n.material) {
        if (Array.isArray(n.material)) n.material.forEach(m => m.dispose());
        else n.material.dispose();
      }
    });
  }

  /* ============ 对外 API ============ */

  /**
   * 在容器里挂载 3D 舞台
   * @returns {boolean} 是否成功
   */
  function mount(container, speciesId, opts = {}) {
    if (!hasWebGL || !window.THREE) return false;
    try {
      stage(container);
      const s = new Stage(container, speciesId, opts);
      stages.set(container, s);
      return true;
    } catch (e) {
      console.warn("3D 初始化失败，回退 2D：", e);
      return false;
    }
  }

  function stage(container) { return stages.get(container); }

  function unmount(container) {
    const s = stages.get(container);
    if (s) { s.dispose(); stages.delete(container); }
  }

  function unmountAll() {
    for (const [c] of stages) unmount(c);
  }

  /** 播放动作 */
  function play(container, action) {
    const s = stages.get(container);
    if (s) { s.play(action); return true; }
    return false;
  }

  /** 更新等级（形态）与状态（表情） */
  function refresh(container, { level, stats }) {
    const s = stages.get(container);
    if (!s) return;
    if (level) s.updateModel(level);
    if (stats) { s.opts.stats = stats; s.applyMood(); }
  }

  function onTap(container, fn) {
    const s = stages.get(container);
    if (s) s.onTap = fn;
  }

  return { mount, unmount, unmountAll, stage, play, refresh, onTap, hasWebGL };
})();

window.Pet3D = Pet3D;
