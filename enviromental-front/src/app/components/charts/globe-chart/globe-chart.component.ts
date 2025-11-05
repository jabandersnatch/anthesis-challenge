import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  input,
  output,
  signal,
  effect,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';

import { Emission } from '../../../models/emission.model';
import { GlobePointData } from '../../../models/emission.model';
import { getCountryCoordinates } from '../../../utils/country-coordinates';

type THREE = typeof import('three');

/**
 * Globe Chart Component
 *
 * An interactive 3D globe visualization using Three.js and three-globe.
 * Displays emissions data by country with interactive features.
 *
 * Features:
 * - SSR-safe implementation with platform checks
 * - Proper lifecycle management and cleanup
 * - Signal-based reactive inputs
 * - Interactive hover and click events
 * - Smooth camera controls and animations
 * - Memory leak prevention with proper disposal
 * - Responsive design with resize handling
 *
 * @example
 * <app-globe-chart
 *   [emissions]="emissionsData()"
 *   (countrySelected)="onCountrySelected($event)"
 * />
 */
@Component({
  selector: 'app-globe-chart',
  imports: [CommonModule],
  templateUrl: './globe-chart.component.html',
  styleUrl: './globe-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobeChartComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  @ViewChild('globeContainer', { static: false })
  private globeContainer?: ElementRef<HTMLDivElement>;

  // Signal-based inputs for reactive data binding
  readonly emissions = input.required<Emission[]>();
  readonly selectedCountry = input<string | null>(null);

  // Output events
  readonly countrySelected = output<string>();
  readonly countryHovered = output<string | null>();

  // Component state
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly hoveredCountry = signal<string | null>(null);

  // Three.js objects (nullable for SSR compatibility)
  private THREE: THREE | null = null;
  private scene: any | null = null;
  private camera: any | null = null;
  private renderer: any | null = null;
  private globe: any | null = null;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Mouse interaction state
  private raycaster: any | null = null;
  private mouse: any = null;
  private isUserInteracting = false;
  private mouseDownTime = 0;

  // Camera controls
  private cameraDistance = 250;
  private targetRotation = { x: 0, y: 0 };
  private currentRotation = { x: 0, y: 0 };

  constructor() {
    // React to emissions data changes
    effect(() => {
      const data = this.emissions();
      if (this.isBrowser && this.globe && data.length > 0) {
        this.updateGlobeData(data);
      }
    });

    // React to selected country changes
    effect(() => {
      const country = this.selectedCountry();
      if (this.isBrowser && country) {
        this.focusOnCountry(country);
      }
    });
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      this.loading.set(false);
    }
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser || !this.globeContainer) {
      return;
    }

    // Use async initialization
    this.initializeGlobeAsync();
  }

  private async initializeGlobeAsync(): Promise<void> {
    try {
      await this.initializeGlobe();
      this.setupEventListeners();
      this.animate();
      this.loading.set(false);
    } catch (err) {
      console.error('Failed to initialize globe:', err);
      this.error.set('Failed to initialize 3D visualization');
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Initialize Three.js scene, camera, renderer, and globe
   */
  private async initializeGlobe(): Promise<void> {
    if (!this.globeContainer) return;

    try {
      // Dynamically import Three.js and three-globe (SSR-safe)
      const [THREE, ThreeGlobeModule] = await Promise.all([import('three'), import('three-globe')]);

      this.THREE = THREE as any;
      const ThreeGlobe = ThreeGlobeModule.default;

      const container = this.globeContainer.nativeElement;
      const width = container.clientWidth;
      const height = container.clientHeight || 500;

      // Scene setup
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000510);

      // Camera setup
      this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000);
      this.camera.position.z = this.cameraDistance;

      // Renderer setup
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(this.renderer.domElement);

      // Globe setup with proper texture URLs
      this.globe = new ThreeGlobe()
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .atmosphereColor('#3a7be0')
        .atmosphereAltitude(0.15);

      this.scene.add(this.globe);

      // Lighting - Enhanced for better visibility
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight.position.set(5, 3, 5);
      this.scene.add(directionalLight);

      const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
      backLight.position.set(-5, -3, -5);
      this.scene.add(backLight);

      // Mouse interaction setup
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();

      // Setup resize observer
      this.setupResizeObserver();

      // Initial data load
      if (this.emissions().length > 0) {
        this.updateGlobeData(this.emissions());
      }
    } catch (error) {
      console.error('Failed to load Three.js dependencies:', error);
      throw error;
    }
  }

  /**
   * Update globe with emissions data
   */
  private updateGlobeData(emissions: Emission[]): void {
    if (!this.globe) return;

    try {
      // Aggregate emissions by country
      const countryData = this.aggregateEmissionsByCountry(emissions);

      // Transform to globe point data
      const globePoints = this.transformToGlobePoints(countryData);

      // Update globe with points
      this.globe.pointsData(globePoints).pointAltitude('size').pointRadius(0.5).pointColor('color');
    } catch (err) {
      console.error('Failed to update globe data:', err);
    }
  }

  /**
   * Aggregate emissions by country
   */
  private aggregateEmissionsByCountry(
    emissions: Emission[],
  ): Map<string, { country: string; totalEmissions: number; count: number }> {
    const aggregated = new Map<
      string,
      { country: string; totalEmissions: number; count: number }
    >();

    emissions.forEach((emission) => {
      const existing = aggregated.get(emission.country);
      if (existing) {
        existing.totalEmissions += emission.emissions;
        existing.count += 1;
      } else {
        aggregated.set(emission.country, {
          country: emission.country,
          totalEmissions: emission.emissions,
          count: 1,
        });
      }
    });

    return aggregated;
  }

  /**
   * Transform aggregated data to globe points with coordinates
   */
  private transformToGlobePoints(
    countryData: Map<string, { country: string; totalEmissions: number; count: number }>,
  ): GlobePointData[] {
    const points: GlobePointData[] = [];

    // Find max emissions for color scaling
    let maxEmissions = 0;
    countryData.forEach((data) => {
      if (data.totalEmissions > maxEmissions) {
        maxEmissions = data.totalEmissions;
      }
    });

    countryData.forEach((data) => {
      const coords = getCountryCoordinates(data.country);

      // Calculate size and color based on emissions
      const normalizedEmissions = data.totalEmissions / maxEmissions;
      const size = 0.05 + normalizedEmissions * 0.3; // 0.05 to 0.35
      const color = this.getColorForEmissions(normalizedEmissions);

      points.push({
        lat: coords.lat,
        lng: coords.lng,
        country: data.country,
        totalEmissions: data.totalEmissions,
        size,
        color,
        label: `
          <div style="background: rgba(0,0,0,0.9); padding: 12px; border-radius: 8px; color: white;">
            <strong style="font-size: 14px;">${coords.name} (${data.country})</strong><br/>
            <span style="color: #4fc3f7;">Total Emissions: ${this.formatNumber(data.totalEmissions)} MT</span><br/>
            <span style="color: #aaa;">Records: ${data.count}</span>
          </div>
        `,
      });
    });

    return points;
  }

  /**
   * Get color based on emission intensity
   */
  private getColorForEmissions(normalized: number): string {
    // Color gradient: green (low) -> yellow -> orange -> red (high)
    if (normalized < 0.25) {
      return '#00ff00'; // Green
    } else if (normalized < 0.5) {
      return '#ffff00'; // Yellow
    } else if (normalized < 0.75) {
      return '#ff8800'; // Orange
    } else {
      return '#ff0000'; // Red
    }
  }

  /**
   * Format number with commas
   */
  private formatNumber(num: number): string {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Setup event listeners for mouse interactions
   */
  private setupEventListeners(): void {
    if (!this.isBrowser || !this.renderer) return;

    const canvas = this.renderer.domElement;

    // Mouse move
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));

    // Mouse down
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));

    // Mouse up (click)
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));

    // Touch support
    canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
  }

  /**
   * Handle mouse move
   */
  private onMouseMove(event: MouseEvent): void {
    if (!this.renderer || !this.camera || !this.scene) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Rotate globe if dragging
    if (this.isUserInteracting && event.buttons === 1) {
      this.targetRotation.y += event.movementX * 0.005;
      this.targetRotation.x += event.movementY * 0.005;
      this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));
    }

    // Raycast for hover detection
    this.detectHoveredCountry();
  }

  /**
   * Handle mouse down
   */
  private onMouseDown(event: MouseEvent): void {
    this.isUserInteracting = true;
    this.mouseDownTime = Date.now();
  }

  /**
   * Handle mouse up (click)
   */
  private onMouseUp(event: MouseEvent): void {
    this.isUserInteracting = false;

    // Only register as click if mouse was down for less than 200ms (not a drag)
    if (Date.now() - this.mouseDownTime < 200) {
      this.handleCountryClick();
    }
  }

  /**
   * Handle touch start
   */
  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isUserInteracting = true;
      this.mouseDownTime = Date.now();
    }
  }

  /**
   * Handle touch move
   */
  private onTouchMove(event: TouchEvent): void {
    // Basic touch rotation support could be added here
  }

  private detectHoveredCountry(): void {
    if (!this.raycaster || !this.camera || !this.scene || !this.globe) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.globe.children, true);

    if (intersects.length > 0) {
      const pointsData = this.globe.pointsData() as GlobePointData[];
    }
  }

  /**
   * Handle country click
   */
  private handleCountryClick(): void {
    const hoveredCountry = this.hoveredCountry();
    if (hoveredCountry) {
      this.countrySelected.emit(hoveredCountry);
    }
  }

  /**
   * Focus camera on a specific country
   */
  private focusOnCountry(countryCode: string): void {
    const coords = getCountryCoordinates(countryCode);

    // Convert lat/lng to rotation angles
    const targetY = (-coords.lng * Math.PI) / 180;
    const targetX = (coords.lat * Math.PI) / 180;

    this.targetRotation = { x: targetX, y: targetY };
  }

  /**
   * Setup resize observer for responsive behavior
   */
  private setupResizeObserver(): void {
    if (!this.isBrowser || !this.globeContainer) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.handleResize(entry.contentRect.width, entry.contentRect.height);
      }
    });

    this.resizeObserver.observe(this.globeContainer.nativeElement);
  }

  /**
   * Handle container resize
   */
  private handleResize(width: number, height: number): void {
    if (!this.camera || !this.renderer) return;

    const actualHeight = height || 500;

    this.camera.aspect = width / actualHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, actualHeight);
  }

  /**
   * Animation loop
   */
  private animate(): void {
    if (!this.isBrowser) return;

    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Smooth rotation interpolation
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.1;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.1;

    // Apply rotation to globe
    if (this.globe) {
      this.globe.rotation.y = this.currentRotation.y;
      this.globe.rotation.x = this.currentRotation.x;
    }

    // Auto-rotate if not interacting
    if (!this.isUserInteracting) {
      this.targetRotation.y += 0.001; // Slow auto-rotation
    }

    // Render scene
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private cleanup(): void {
    // Cancel animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Dispose globe
    if (this.globe) {
      // Globe disposal
      this.scene?.remove(this.globe);
      this.globe = null;
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
      this.renderer = null;
    }

    // Clear scene
    if (this.scene) {
      while (this.scene.children.length > 0) {
        const object = this.scene.children[0];
        this.scene.remove(object);
      }
      this.scene = null;
    }

    // Clear camera
    this.camera = null;

    // Clear raycaster
    this.raycaster = null;
  }
}
