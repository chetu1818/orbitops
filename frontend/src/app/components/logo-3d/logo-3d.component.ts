import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener, inject, NgZone } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-logo-3d',
  standalone: true,
  template: `
    <div class="canvas-container">
      <canvas #logoCanvas></canvas>
    </div>
  `,
  styles: [`
    .canvas-container {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    canvas {
      width: 44px;
      height: 44px;
      display: block;
    }
  `]
})
export class Logo3dComponent implements AfterViewInit, OnDestroy {
  private ngZone = inject(NgZone);

  @ViewChild('logoCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  
  private logoGroup!: THREE.Group;
  private coreSphere!: THREE.Mesh;
  private orbitRing1!: THREE.Mesh;
  private orbitRing2!: THREE.Mesh;
  private stars!: THREE.Points;

  private animationFrameId?: number;
  private frameCount = 0;

  // Parallax properties
  private targetRotationX = 0;
  private targetRotationY = 0;
  private currentRotationX = 0;
  private currentRotationY = 0;

  ngAfterViewInit() {
    this.initThree();
    this.createLogoGeometry();
    this.startAnimationLoop();
  }

  private initThree() {
    const width = 44;
    const height = 44;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.z = 6.5;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private createLogoGeometry() {
    this.logoGroup = new THREE.Group();

    // Core Sphere (representing the "Ops" database/system node)
    const sphereGeo = new THREE.SphereGeometry(1.0, 10, 10);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6, // Cyber Blue
      wireframe: true
    });
    this.coreSphere = new THREE.Mesh(sphereGeo, sphereMat);
    this.logoGroup.add(this.coreSphere);

    // Orbit Ring 1 (representing Make.com connection path)
    const ringGeo1 = new THREE.TorusGeometry(1.7, 0.04, 6, 32);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x10b981, // Teal
      wireframe: true
    });
    this.orbitRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    this.orbitRing1.rotation.x = Math.PI / 3;
    this.logoGroup.add(this.orbitRing1);

    // Orbit Ring 2 (representing n8n connection path)
    const ringGeo2 = new THREE.TorusGeometry(1.7, 0.04, 6, 32);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6, // Violet
      wireframe: true
    });
    this.orbitRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    this.orbitRing2.rotation.x = -Math.PI / 3;
    this.orbitRing2.rotation.y = Math.PI / 4;
    this.logoGroup.add(this.orbitRing2);

    // Sparkling Logo Stars (particles that twinkle/sparkle around the logo)
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 12;
    const positions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
      const radius = 1.3 + Math.random() * 1.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.16,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.stars = new THREE.Points(starsGeo, starsMat);
    this.logoGroup.add(this.stars);

    this.scene.add(this.logoGroup);
  }

  private startAnimationLoop() {
    // Run outside Angular's zone to prevent change detection cycles on every animation frame
    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        this.animationFrameId = requestAnimationFrame(animate);
        this.renderFrame();
      };
      animate();
    });
  }

  private renderFrame() {
    this.frameCount++;

    if (this.frameCount <= 60) {
      // 1. Initial 360-degree load spin (around Y-axis) over 60 frames
      const spinAngle = (Math.PI * 2) / 60;
      this.logoGroup.rotation.y += spinAngle;
    } else {
      // 2. Parallax Cursor Tracking (interpolate current rotation towards mouse targets)
      const lerpFactor = 0.08;
      this.currentRotationX += (this.targetRotationX - this.currentRotationX) * lerpFactor;
      this.currentRotationY += (this.targetRotationY - this.currentRotationY) * lerpFactor;

      // Base idle spin
      this.logoGroup.rotation.y += 0.005;

      // Apply cursor offsets
      this.logoGroup.rotation.x = this.currentRotationX;
      this.logoGroup.rotation.y = this.currentRotationY + (this.frameCount * 0.005);
    }

    // Individual node animations
    this.coreSphere.rotation.y -= 0.002;
    this.orbitRing1.rotation.z += 0.01;
    this.orbitRing2.rotation.z -= 0.008;

    // Twinkle and spin the sparkling stars
    if (this.stars) {
      this.stars.rotation.y += 0.012;
      this.stars.rotation.z -= 0.008;
      (this.stars.material as THREE.PointsMaterial).size = 0.14 + 0.08 * Math.sin(this.frameCount * 0.12);
    }

    this.renderer.render(this.scene, this.camera);
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    // Normalize coordinates around the center of the window (-0.5 to 0.5)
    const normX = (event.clientX / window.innerWidth) - 0.5;
    const normY = (event.clientY / window.innerHeight) - 0.5;

    // Map to rotations
    this.targetRotationY = normX * 0.8; // Left-right tracking
    this.targetRotationX = normY * 0.8; // Up-down tracking
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Dispose geometries and materials to prevent WebGL memory leaks
    this.logoGroup.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.renderer.dispose();
  }
}
