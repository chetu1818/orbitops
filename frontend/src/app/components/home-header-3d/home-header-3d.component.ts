import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';

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
    <div class="canvas-wrapper">
      <canvas #headerCanvas></canvas>
    </div>
  `,
  styles: [`
    .canvas-wrapper {
      width: 100%;
      height: 100%;
      position: relative;
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
  private activeTheme = 'nova';

  // Mouse tilt parameters
  private mouse = { x: 0, y: 0 };
  private target = { x: 0, y: 0 };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initThree();
      this.createGalaxy();
      this.setupThemeObserver();
      this.setupListeners();
      
      this.ngZone.runOutsideAngular(() => {
        this.animate();
      });
    }
  }

  private initThree() {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;

    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 22);

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 15, 5);
    this.scene.add(dirLight);

    this.galaxyGroup = new THREE.Group();
    // Slanted premium angles
    this.galaxyGroup.rotation.x = 1.15;
    this.galaxyGroup.rotation.y = -0.32;
    this.galaxyGroup.rotation.z = -0.68;
    this.scene.add(this.galaxyGroup);
  }

  // Create soft round stardust textures
  private createStarTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createGalaxy() {
    const total = 6000;
    this.galaxyGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    
    const armScale = 8.5;
    const numArms = 4;
    const armSpiral = 2.45;

    this.activeTheme = document.documentElement.getAttribute('data-theme') || 'nova';

    for (let i = 0; i < total; i++) {
      const t = Math.pow(Math.random(), 1.45); // Core bias
      const armIndex = i % numArms;
      const phiAngle = (armIndex * 2 * Math.PI) / numArms;
      const theta = t * armSpiral * Math.PI + phiAngle;

      const spreadX = (Math.random() - 0.5) * 1.4 * (t + 0.12);
      const spreadY = (Math.random() - 0.5) * 0.58 * (t + 0.06);
      const spreadZ = (Math.random() - 0.5) * 1.4 * (t + 0.12);

      const r = t * armScale;
      const omega = 0.0012 / (0.4 + t * 0.12);
      const driftSpeed = 0.0004 + Math.random() * 0.0008;

      const color = this.getThemeColorForParticle(t, this.activeTheme);

      positions[i * 3] = Math.cos(theta) * r + spreadX;
      positions[i * 3 + 1] = spreadY;
      positions[i * 3 + 2] = Math.sin(theta) * r + spreadZ;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      this.particles.push({
        r,
        theta,
        omega,
        driftSpeed,
        spreadX,
        spreadY,
        spreadZ,
        armIndex,
        baseColor: color
      });
    }

    this.galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.galaxyMaterial = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      map: this.createStarTexture(),
      depthWrite: false
    });

    this.galaxyPoints = new THREE.Points(this.galaxyGeometry, this.galaxyMaterial);
    this.galaxyGroup.add(this.galaxyPoints);
  }

  private getThemeColorForParticle(t: number, theme: string): THREE.Color {
    const color = new THREE.Color();
    switch (theme) {
      case 'cyber':
        if (t < 0.18) color.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0xff00ff), t * 5.5);
        else if (t < 0.5) color.lerpColors(new THREE.Color(0xff007f), new THREE.Color(0x8b5cf6), (t - 0.18) * 3.1);
        else color.lerpColors(new THREE.Color(0x00f0ff), new THREE.Color(0x0a0f2b), (t - 0.5) * 2.0);
        break;
      case 'aurora':
        if (t < 0.18) color.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0xa7f3d0), t * 5.5);
        else if (t < 0.5) color.lerpColors(new THREE.Color(0x10b981), new THREE.Color(0x059669), (t - 0.18) * 3.1);
        else color.lerpColors(new THREE.Color(0x0d9488), new THREE.Color(0x022c22), (t - 0.5) * 2.0);
        break;
      case 'sunset':
        if (t < 0.18) color.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0xfde047), t * 5.5);
        else if (t < 0.5) color.lerpColors(new THREE.Color(0xf97316), new THREE.Color(0xef4444), (t - 0.18) * 3.1);
        else color.lerpColors(new THREE.Color(0x881337), new THREE.Color(0x18001a), (t - 0.5) * 2.0);
        break;
      case 'matrix':
        if (t < 0.18) color.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0xdcfce7), t * 5.5);
        else if (t < 0.5) color.lerpColors(new THREE.Color(0x00ff66), new THREE.Color(0x10b981), (t - 0.18) * 3.1);
        else color.lerpColors(new THREE.Color(0x064e3b), new THREE.Color(0x000000), (t - 0.5) * 2.0);
        break;
      case 'nova':
      default:
        if (t < 0.18) color.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0xffe5cc), t * 5.5);
        else if (t < 0.5) color.lerpColors(new THREE.Color(0xff44aa), new THREE.Color(0x9433ff), (t - 0.18) * 3.1);
        else color.lerpColors(new THREE.Color(0x00d2ff), new THREE.Color(0x050e2b), (t - 0.5) * 2.0);
        break;
    }
    return color;
  }

  private setupThemeObserver() {
    this.themeObserver = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute('data-theme') || 'nova';
      if (newTheme !== this.activeTheme) {
        this.activeTheme = newTheme;
        this.updateGalaxyThemeColors();
      }
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  private updateGalaxyThemeColors() {
    const total = this.particles.length;
    const cArr = this.galaxyGeometry.attributes['color'].array as Float32Array;
    const armScale = 8.5;

    for (let i = 0; i < total; i++) {
      const p = this.particles[i];
      const t = p.r / armScale;
      p.baseColor = this.getThemeColorForParticle(t, this.activeTheme);
      
      const fade = Math.max(0, 1 - p.r / armScale);
      cArr[i * 3] = p.baseColor.r * fade;
      cArr[i * 3 + 1] = p.baseColor.g * fade;
      cArr[i * 3 + 2] = p.baseColor.b * fade;
    }
    this.galaxyGeometry.attributes['color'].needsUpdate = true;
  }

  private setupListeners() {
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('resize', this.onResize);
  }

  private onMouseMove = (e: MouseEvent) => {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  };

  private onResize = () => {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    if (container) {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
  };

  private spawnMeteoroid() {
    const size = 0.08 + Math.random() * 0.09;
    // Flat rock distorted Dodecahedron
    const metGeo = new THREE.DodecahedronGeometry(size, 1);
    
    // Distort vertices slightly for realistic uneven rock look
    const posAttr = metGeo.attributes['position'];
    for (let k = 0; k < posAttr.count; k++) {
      const vx = posAttr.getX(k);
      const vy = posAttr.getY(k);
      const vz = posAttr.getZ(k);
      posAttr.setXYZ(
        k,
        vx + (Math.random() - 0.5) * 0.03,
        vy + (Math.random() - 0.5) * 0.03,
        vz + (Math.random() - 0.5) * 0.03
      );
    }
    metGeo.computeVertexNormals();

    const metMat = new THREE.MeshStandardMaterial({
      color: 0x1e202b,
      roughness: 0.9,
      metalness: 0.15,
      flatShading: true
    });
    
    const mesh = new THREE.Mesh(metGeo, metMat);
    // Spawn off-left and high
    mesh.position.set(-16 - Math.random() * 5, 4 + Math.random() * 4, (Math.random() - 0.5) * 4);
    this.scene.add(mesh);

    // Setup trailing points
    const maxTrail = 45;
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(maxTrail * 3);
    const trailColors = new Float32Array(maxTrail * 3);
    
    // Setup initial points colors
    let trailColor = new THREE.Color('#00f0ff');
    if (this.activeTheme === 'cyber') trailColor = new THREE.Color('#ff007f');
    else if (this.activeTheme === 'aurora') trailColor = new THREE.Color('#10b981');
    else if (this.activeTheme === 'sunset') trailColor = new THREE.Color('#f97316');
    else if (this.activeTheme === 'matrix') trailColor = new THREE.Color('#00ff66');

    for (let k = 0; k < maxTrail; k++) {
      const ratio = k / maxTrail;
      const c = trailColor.clone().multiplyScalar(ratio);
      trailColors[k * 3] = c.r;
      trailColors[k * 3 + 1] = c.g;
      trailColors[k * 3 + 2] = c.b;
    }

    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));

    const trailPointsMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      map: this.createStarTexture(),
      depthWrite: false
    });

    const trailPoints = new THREE.Points(trailGeo, trailPointsMat);
    this.scene.add(trailPoints);

    this.activeMeteoroids.push({
      mesh,
      velocity: new THREE.Vector3(
        0.06 + Math.random() * 0.05,
        -0.02 - Math.random() * 0.03,
        (Math.random() - 0.5) * 0.012
      ),
      trailPoints,
      trailGeo,
      trailData: [],
      spawnTime: Date.now()
    });
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    const pArr = this.galaxyGeometry.attributes['position'].array as Float32Array;
    const cArr = this.galaxyGeometry.attributes['color'].array as Float32Array;
    const armScale = 8.5;
    const armSpiral = 2.45;

    // 1. Update galaxy particles positions & drift
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Spiral rotation increment
      p.theta += p.omega;
      // Drift outwards
      p.r += p.driftSpeed;

      const angle = p.theta + (p.r / armScale) * armSpiral;

      pArr[i * 3] = Math.cos(angle) * p.r + p.spreadX;
      pArr[i * 3 + 1] = p.spreadY;
      pArr[i * 3 + 2] = Math.sin(angle) * p.r + p.spreadZ;

      // Soft fadeout at the boundary edges (to prevent harsh rectangle border clipping)
      const fade = Math.max(0, 1 - p.r / armScale);
      cArr[i * 3] = p.baseColor.r * fade;
      cArr[i * 3 + 1] = p.baseColor.g * fade;
      cArr[i * 3 + 2] = p.baseColor.b * fade;

      // Recycle outer stars back to core
      if (p.r >= armScale) {
        p.r = 0.05 + Math.random() * 0.2;
        p.theta = Math.random() * Math.PI * 2;
        p.baseColor = this.getThemeColorForParticle(p.r / armScale, this.activeTheme);
      }
    }

    this.galaxyGeometry.attributes['position'].needsUpdate = true;
    this.galaxyGeometry.attributes['color'].needsUpdate = true;

    // Slowly rotate the galaxy group
    this.galaxyGroup.rotation.z += 0.00018;

    // 2. Spawn meteoroids occasionally (every ~12 seconds)
    if (Date.now() - this.lastMeteoroidSpawn > 12000) {
      this.spawnMeteoroid();
      this.lastMeteoroidSpawn = Date.now();
    }

    // 3. Update active meteoroids and their trails
    for (let i = this.activeMeteoroids.length - 1; i >= 0; i--) {
      const met = this.activeMeteoroids[i];
      met.mesh.position.add(met.velocity);
      met.mesh.rotation.x += 0.01;
      met.mesh.rotation.y += 0.015;

      met.trailData.push({
        x: met.mesh.position.x,
        y: met.mesh.position.y,
        z: met.mesh.position.z,
        age: 0
      });

      if (met.trailData.length > 45) {
        met.trailData.shift();
      }

      const trailPos = met.trailGeo.attributes['position'].array as Float32Array;
      
      met.trailData.forEach((d, pIdx) => {
        trailPos[pIdx * 3] = d.x + (Math.random() - 0.5) * 0.05;
        trailPos[pIdx * 3 + 1] = d.y + (Math.random() - 0.5) * 0.05;
        trailPos[pIdx * 3 + 2] = d.z + (Math.random() - 0.5) * 0.05;
      });
      met.trailGeo.attributes['position'].needsUpdate = true;

      // Clean up out of bounds meteoroids
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

    // 4. Interpolate camera view on mouse movement
    this.target.x += (this.mouse.x * 1.3 - this.target.x) * 0.035;
    this.target.y += (this.mouse.y * 1.3 - this.target.y) * 0.035;
    this.camera.position.set(this.target.x, this.target.y, 22);
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  };

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
    
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);

    // Dispose all THREE assets
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        } else if (object instanceof THREE.Points) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
