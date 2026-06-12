import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { SceneCacheService } from '../../services/scene-cache.service';

interface ParticleData {
  r: number;
  theta: number;
  omega: number;
  driftSpeed: number;
  spreadX: number;
  spreadY: number;
  spreadZ: number;
  armIndex: number;
  baseColor: THREE.Color;
}

interface MeteoroidData {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  trailPoints: THREE.Points;
  trailGeo: THREE.BufferGeometry;
  trailData: { x: number; y: number; z: number; age: number }[];
  spawnTime: number;
}

@Component({
  selector: 'app-home-header-3d',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="canvas-wrapper" style="will-change: transform;">
      <canvas #headerCanvas></canvas>
    </div>
  `,
  styles: [`
    .canvas-wrapper {
      width: 100%;
      height: 100%;
      position: relative;
      contain: strict;
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class HomeHeader3dComponent implements AfterViewInit, OnDestroy {
  @ViewChild('headerCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private galaxyGroup!: THREE.Group;
  private galaxyPoints!: THREE.Points;
  private galaxyGeometry!: THREE.BufferGeometry;
  private galaxyMaterial!: THREE.PointsMaterial;

  private animationFrameId?: number;
  private particles: ParticleData[] = [];
  private activeMeteoroids: MeteoroidData[] = [];
  private lastMeteoroidSpawn = 0;

  private themeObserver!: MutationObserver;
  private activeTheme = 'dark';

  // Mouse tilt parameters
  private mouse = { x: 0, y: 0 };
  private target = { x: 0, y: 0 };

  // Performance — adaptive particle count based on device
  private readonly isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  private readonly PARTICLE_COUNT = this.isMobile ? 3000 : 6000;

  // Geometry constants (must match SceneCacheService CACHE_VERSION)
  private readonly ARM_SCALE  = 8.5;
  private readonly ARM_SPIRAL = 2.45;
  private readonly NUM_ARMS   = 4;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
    private sceneCache: SceneCacheService
  ) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initThree();
      this.createGalaxyAsync();
      this.setupThemeObserver();
      this.setupListeners();
    }
  }

  private initThree() {
    const canvas    = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;

    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 22);

    // Cap pixel ratio at 1.5 — a ratio of 2 doubles GPU fill rate with marginal visual gain
    const dpr = Math.min(window.devicePixelRatio, this.isMobile ? 1.2 : 1.5);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha:     true,
      antialias: !this.isMobile,   // disable MSAA on mobile for perf
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 15, 5);
    this.scene.add(dirLight);

    this.galaxyGroup = new THREE.Group();
    this.galaxyGroup.rotation.x =  1.15;
    this.galaxyGroup.rotation.y = -0.32;
    this.galaxyGroup.rotation.z = -0.68;
    this.scene.add(this.galaxyGroup);
  }

  // ── Galaxy creation (cache-aware) ─────────────────────────────────────────

  private async createGalaxyAsync() {
    this.activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';

    const cached = await this.sceneCache.loadGalaxyData(this.activeTheme);

    if (cached) {
      // Fast path: restore from IndexedDB cache
      this.buildGalaxyFromArrays(cached.positions, cached.colors);
    } else {
      // Slow path: compute, then store
      const { positions, colors } = this.computeGalaxyArrays();
      this.buildGalaxyFromArrays(positions, colors);

      // Save asynchronously — never block rendering
      this.sceneCache.saveGalaxyData(positions, colors, this.activeTheme).catch(() => {});
    }

    // Start render loop only after galaxy is ready
    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  /** Compute particle positions and colours from scratch. */
  private computeGalaxyArrays(): { positions: Float32Array; colors: Float32Array } {
    const total     = this.PARTICLE_COUNT;
    const positions = new Float32Array(total * 3);
    const colors    = new Float32Array(total * 3);

    for (let i = 0; i < total; i++) {
      const t        = Math.pow(Math.random(), 1.45);
      const armIndex = i % this.NUM_ARMS;
      const phiAngle = (armIndex * 2 * Math.PI) / this.NUM_ARMS;
      const theta    = t * this.ARM_SPIRAL * Math.PI + phiAngle;

      const spreadX = (Math.random() - 0.5) * 1.4 * (t + 0.12);
      const spreadY = (Math.random() - 0.5) * 0.58 * (t + 0.06);
      const spreadZ = (Math.random() - 0.5) * 1.4 * (t + 0.12);

      const r = t * this.ARM_SCALE;

      positions[i * 3]     = Math.cos(theta) * r + spreadX;
      positions[i * 3 + 1] = spreadY;
      positions[i * 3 + 2] = Math.sin(theta) * r + spreadZ;

      const color = this.getThemeColorForParticle(t, this.activeTheme);
      colors[i * 3]     = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      const omega      = 0.0012 / (0.4 + t * 0.12);
      const driftSpeed = 0.0004 + Math.random() * 0.0008;
      this.particles.push({ r, theta, omega, driftSpeed, spreadX, spreadY, spreadZ, armIndex, baseColor: color });
    }

    return { positions, colors };
  }

  /** Rebuild ParticleData from loaded cache arrays (avoids re-running Math.random). */
  private rebuildParticlesFromArrays(positions: Float32Array) {
    const total = this.PARTICLE_COUNT;
    this.particles = [];

    for (let i = 0; i < total; i++) {
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      const r = Math.sqrt(x * x + z * z);
      const t = r / this.ARM_SCALE;

      this.particles.push({
        r,
        theta:      Math.atan2(z, x),
        omega:      0.0012 / (0.4 + t * 0.12),
        driftSpeed: 0.0004 + 0.0004,   // avg drift
        spreadX:    0, spreadY: positions[i * 3 + 1], spreadZ: 0,
        armIndex:   i % this.NUM_ARMS,
        baseColor:  this.getThemeColorForParticle(t, this.activeTheme)
      });
    }
  }

  /** Attach BufferGeometry and Points to scene using pre-computed arrays. */
  private buildGalaxyFromArrays(positions: Float32Array, colors: Float32Array) {
    this.galaxyGeometry = new THREE.BufferGeometry();
    this.galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.galaxyGeometry.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    // Rebuild particle metadata (needed for animation)
    this.rebuildParticlesFromArrays(positions);

    this.galaxyMaterial = new THREE.PointsMaterial({
      size:          this.isMobile ? 0.16 : 0.14,
      vertexColors:  true,
      transparent:   true,
      blending:      THREE.AdditiveBlending,
      map:           this.createStarTexture(),
      depthWrite:    false,
      sizeAttenuation: true
    });

    this.galaxyPoints = new THREE.Points(this.galaxyGeometry, this.galaxyMaterial);
    this.galaxyGroup.add(this.galaxyPoints);
  }

  // ── Star disc texture ─────────────────────────────────────────────────────

  private createStarTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width  = 16;
    canvas.height = 16;
    const ctx  = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // ── Theme colour helpers ───────────────────────────────────────────────────

  private getThemeColorForParticle(t: number, theme: string): THREE.Color {
    const color = new THREE.Color();
    switch (theme) {
      case 'cyber':
        if (t < 0.18) color.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0xff00ff), t * 5.5);
        else if (t < 0.5) color.lerpColors(new THREE.Color(0xff007f), new THREE.Color(0x8b5cf6), (t - 0.18) * 3.1);
        else color.lerpColors(new THREE.Color(0x00f0ff), new THREE.Color(0x0a0f2b), (t - 0.5) * 2.0);
        break;
      case 'light':
        if (t < 0.18) color.lerpColors(new THREE.Color(0x0071E3), new THREE.Color(0x00B4D8), t * 5.5);
        else if (t < 0.5) color.lerpColors(new THREE.Color(0x7c3aed), new THREE.Color(0x2563eb), (t - 0.18) * 3.1);
        else color.lerpColors(new THREE.Color(0x1d4ed8), new THREE.Color(0xf4f6f9), (t - 0.5) * 2.0);
        break;
      case 'dark':
      default:
        if (t < 0.18) color.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0xffe5cc), t * 5.5);
        else if (t < 0.5) color.lerpColors(new THREE.Color(0xff44aa), new THREE.Color(0x9433ff), (t - 0.18) * 3.1);
        else color.lerpColors(new THREE.Color(0x00d2ff), new THREE.Color(0x050e2b), (t - 0.5) * 2.0);
        break;
    }
    return color;
  }

  // ── Theme observer ────────────────────────────────────────────────────────

  private setupThemeObserver() {
    this.themeObserver = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      if (newTheme !== this.activeTheme) {
        this.activeTheme = newTheme;
        // Try to load new theme from cache first
        this.sceneCache.loadGalaxyData(newTheme).then(cached => {
          if (cached) {
            this.updateGalaxyThemeColorsFromArrays(cached.colors);
          } else {
            this.updateGalaxyThemeColors();
          }
        });
      }
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  private updateGalaxyThemeColors() {
    const total = this.particles.length;
    const cArr  = this.galaxyGeometry.attributes['color'].array as Float32Array;

    for (let i = 0; i < total; i++) {
      const p    = this.particles[i];
      const t    = p.r / this.ARM_SCALE;
      p.baseColor = this.getThemeColorForParticle(t, this.activeTheme);
      const fade = Math.max(0, 1 - p.r / this.ARM_SCALE);
      cArr[i * 3]     = p.baseColor.r * fade;
      cArr[i * 3 + 1] = p.baseColor.g * fade;
      cArr[i * 3 + 2] = p.baseColor.b * fade;
    }
    this.galaxyGeometry.attributes['color'].needsUpdate = true;

    // Save the new theme colours into cache
    const newColors = new Float32Array(cArr);
    const positions = this.galaxyGeometry.attributes['position'].array as Float32Array;
    this.sceneCache.saveGalaxyData(positions, newColors, this.activeTheme).catch(() => {});
  }

  private updateGalaxyThemeColorsFromArrays(newColors: Float32Array) {
    const cArr = this.galaxyGeometry.attributes['color'].array as Float32Array;
    cArr.set(newColors);
    // Rebuild particle baseColors
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].baseColor = new THREE.Color(newColors[i * 3], newColors[i * 3 + 1], newColors[i * 3 + 2]);
    }
    this.galaxyGeometry.attributes['color'].needsUpdate = true;
  }

  // ── Event listeners ───────────────────────────────────────────────────────

  private setupListeners() {
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    window.addEventListener('resize',    this.onResize,    { passive: true });
  }

  private onMouseMove = (e: MouseEvent) => {
    this.mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  };

  private onResize = () => {
    const canvas    = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    if (container) {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
  };

  // ── Meteoroid spawning ─────────────────────────────────────────────────────

  private spawnMeteoroid() {
    if (this.isMobile) return; // skip on mobile for perf

    const size   = 0.08 + Math.random() * 0.09;
    const metGeo = new THREE.DodecahedronGeometry(size, 1);
    const posAttr = metGeo.attributes['position'];

    for (let k = 0; k < posAttr.count; k++) {
      posAttr.setXYZ(
        k,
        posAttr.getX(k) + (Math.random() - 0.5) * 0.03,
        posAttr.getY(k) + (Math.random() - 0.5) * 0.03,
        posAttr.getZ(k) + (Math.random() - 0.5) * 0.03
      );
    }
    metGeo.computeVertexNormals();

    const metMat = new THREE.MeshStandardMaterial({ color: 0x1e202b, roughness: 0.9, metalness: 0.15, flatShading: true });
    const mesh   = new THREE.Mesh(metGeo, metMat);
    mesh.position.set(-16 - Math.random() * 5, 4 + Math.random() * 4, (Math.random() - 0.5) * 4);
    this.scene.add(mesh);

    const maxTrail        = 45;
    const trailGeo        = new THREE.BufferGeometry();
    const trailPositions  = new Float32Array(maxTrail * 3);
    const trailColors     = new Float32Array(maxTrail * 3);

    let trailColor = new THREE.Color('#00f0ff');
    if (this.activeTheme === 'cyber')  trailColor = new THREE.Color('#ff007f');
    if (this.activeTheme === 'light')  trailColor = new THREE.Color('#0071e3');
    if (this.activeTheme === 'dark')   trailColor = new THREE.Color('#3b82f6');

    for (let k = 0; k < maxTrail; k++) {
      const c = trailColor.clone().multiplyScalar(k / maxTrail);
      trailColors[k * 3]     = c.r;
      trailColors[k * 3 + 1] = c.g;
      trailColors[k * 3 + 2] = c.b;
    }

    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setAttribute('color',    new THREE.BufferAttribute(trailColors,    3));

    const trailMat    = new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, map: this.createStarTexture(), depthWrite: false });
    const trailPoints = new THREE.Points(trailGeo, trailMat);
    this.scene.add(trailPoints);

    this.activeMeteoroids.push({
      mesh,
      velocity: new THREE.Vector3(0.06 + Math.random() * 0.05, -0.02 - Math.random() * 0.03, (Math.random() - 0.5) * 0.012),
      trailPoints,
      trailGeo,
      trailData:  [],
      spawnTime:  Date.now()
    });
  }

  // ── Main render loop ───────────────────────────────────────────────────────

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    if (!this.galaxyGeometry) return;   // guard during async init

    const pArr      = this.galaxyGeometry.attributes['position'].array as Float32Array;
    const cArr      = this.galaxyGeometry.attributes['color'].array    as Float32Array;

    // 1. Update galaxy particle positions
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.theta += p.omega;
      p.r     += p.driftSpeed;

      const angle = p.theta + (p.r / this.ARM_SCALE) * this.ARM_SPIRAL;
      pArr[i * 3]     = Math.cos(angle) * p.r + p.spreadX;
      pArr[i * 3 + 1] = p.spreadY;
      pArr[i * 3 + 2] = Math.sin(angle) * p.r + p.spreadZ;

      const fade = Math.max(0, 1 - p.r / this.ARM_SCALE);
      cArr[i * 3]     = p.baseColor.r * fade;
      cArr[i * 3 + 1] = p.baseColor.g * fade;
      cArr[i * 3 + 2] = p.baseColor.b * fade;

      if (p.r >= this.ARM_SCALE) {
        p.r     = 0.05 + Math.random() * 0.2;
        p.theta = Math.random() * Math.PI * 2;
        p.baseColor = this.getThemeColorForParticle(p.r / this.ARM_SCALE, this.activeTheme);
      }
    }

    this.galaxyGeometry.attributes['position'].needsUpdate = true;
    this.galaxyGeometry.attributes['color'].needsUpdate    = true;

    this.galaxyGroup.rotation.z += 0.00018;

    // 2. Meteoroid spawning (desktop only)
    if (!this.isMobile && Date.now() - this.lastMeteoroidSpawn > 12000) {
      this.spawnMeteoroid();
      this.lastMeteoroidSpawn = Date.now();
    }

    // 3. Update meteoroids
    for (let i = this.activeMeteoroids.length - 1; i >= 0; i--) {
      const met = this.activeMeteoroids[i];
      met.mesh.position.add(met.velocity);
      met.mesh.rotation.x += 0.01;
      met.mesh.rotation.y += 0.015;

      met.trailData.push({ x: met.mesh.position.x, y: met.mesh.position.y, z: met.mesh.position.z, age: 0 });
      if (met.trailData.length > 45) met.trailData.shift();

      const trailPos = met.trailGeo.attributes['position'].array as Float32Array;
      met.trailData.forEach((d, pIdx) => {
        trailPos[pIdx * 3]     = d.x + (Math.random() - 0.5) * 0.05;
        trailPos[pIdx * 3 + 1] = d.y + (Math.random() - 0.5) * 0.05;
        trailPos[pIdx * 3 + 2] = d.z + (Math.random() - 0.5) * 0.05;
      });
      met.trailGeo.attributes['position'].needsUpdate = true;

      if (met.mesh.position.x > 18 || Date.now() - met.spawnTime > 15000) {
        this.scene.remove(met.mesh);
        this.scene.remove(met.trailPoints);
        met.mesh.geometry.dispose();
        (met.mesh.material as THREE.Material).dispose();
        met.trailGeo.dispose();
        (met.trailPoints.material as THREE.Material).dispose();
        this.activeMeteoroids.splice(i, 1);
      }
    }

    // 4. Smooth camera parallax on mouse
    this.target.x += (this.mouse.x * 1.3 - this.target.x) * 0.035;
    this.target.y += (this.mouse.y * 1.3 - this.target.y) * 0.035;
    this.camera.position.set(this.target.x, this.target.y, 22);
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  };

  // ── Cleanup ───────────────────────────────────────────────────────────────

  ngOnDestroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.themeObserver)    this.themeObserver.disconnect();

    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize',    this.onResize);

    this.scene?.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
        object.geometry.dispose();
        const mat = object.material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else (mat as THREE.Material).dispose();
      }
    });

    this.renderer?.dispose();
  }
}
