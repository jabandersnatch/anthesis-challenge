import { Injectable, signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';

import { EmissionsService } from '../services/emissions.service';
import { Emission, EmissionFilters, PaginatedResponse, ApiError } from '../models/emission.model';

/**
 * Signal-based store for emissions data
 * Provides reactive state management using Angular signals
 */
@Injectable({
  providedIn: 'root',
})
export class EmissionsStore {
  private readonly emissionsService = inject(EmissionsService);

  // State signals
  private readonly emissionsState = signal<Emission[]>([]);
  private readonly filtersState = signal<EmissionFilters>({
    page: 1,
    page_size: 50,
    ordering: '-year',
  });
  private readonly loadingState = signal<boolean>(false);
  private readonly errorState = signal<ApiError | null>(null);
  private readonly totalCountState = signal<number>(0);
  private readonly selectedEmissionState = signal<Emission | null>(null);
  private readonly selectedCountryState = signal<string | null>(null);

  // Public readonly signals
  readonly emissions = this.emissionsState.asReadonly();
  readonly filters = this.filtersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly totalCount = this.totalCountState.asReadonly();
  readonly selectedEmission = this.selectedEmissionState.asReadonly();
  readonly selectedCountry = this.selectedCountryState.asReadonly();

  // Computed signals
  readonly hasEmissions = computed(() => this.emissionsState().length > 0);
  readonly isEmpty = computed(() => !this.loadingState() && this.emissionsState().length === 0);
  readonly hasError = computed(() => this.errorState() !== null);

  readonly currentPage = computed(() => this.filtersState().page || 1);
  readonly pageSize = computed(() => this.filtersState().page_size || 50);
  readonly totalPages = computed(() =>
    Math.ceil(this.totalCountState() / this.pageSize())
  );

  // Computed: unique countries from current emissions
  readonly uniqueCountries = computed(() => {
    const countries = new Set(this.emissionsState().map((e) => e.country));
    return Array.from(countries).sort();
  });

  // Computed: emissions grouped by year
  readonly emissionsByYear = computed(() => {
    const byYear: Record<number, Emission[]> = {};
    this.emissionsState().forEach((emission) => {
      if (!byYear[emission.year]) {
        byYear[emission.year] = [];
      }
      byYear[emission.year].push(emission);
    });
    return byYear;
  });

  // Computed: emissions grouped by country
  readonly emissionsByCountry = computed(() => {
    const byCountry: Record<string, Emission[]> = {};
    this.emissionsState().forEach((emission) => {
      if (!byCountry[emission.country]) {
        byCountry[emission.country] = [];
      }
      byCountry[emission.country].push(emission);
    });
    return byCountry;
  });

  /**
   * Load emissions with current filters
   */
  async loadEmissions(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const response = await new Promise<PaginatedResponse<Emission>>((resolve, reject) => {
        this.emissionsService.getAll(this.filtersState()).subscribe({
          next: resolve,
          error: reject,
        });
      });

      this.emissionsState.set(response.results);
      this.totalCountState.set(response.count);
    } catch (error) {
      this.errorState.set(error as ApiError);
      this.emissionsState.set([]);
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Update filters and reload emissions
   */
  async updateFilters(filters: Partial<EmissionFilters>): Promise<void> {
    this.filtersState.update((current) => ({
      ...current,
      ...filters,
      // Reset to page 1 when filters change (except pagination changes)
      page: filters.page !== undefined ? filters.page : 1,
    }));
    await this.loadEmissions();
  }

  /**
   * Reset filters to default
   */
  async resetFilters(): Promise<void> {
    this.filtersState.set({
      page: 1,
      page_size: 50,
      ordering: '-year',
    });
    await this.loadEmissions();
  }

  /**
   * Go to specific page
   */
  async goToPage(page: number): Promise<void> {
    await this.updateFilters({ page });
  }

  /**
   * Change page size
   */
  async changePageSize(pageSize: number): Promise<void> {
    await this.updateFilters({ page_size: pageSize, page: 1 });
  }

  /**
   * Load a single emission by ID
   */
  async loadEmissionById(id: number): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const emission = await new Promise<Emission>((resolve, reject) => {
        this.emissionsService.getById(id).subscribe({
          next: resolve,
          error: reject,
        });
      });

      this.selectedEmissionState.set(emission);
    } catch (error) {
      this.errorState.set(error as ApiError);
      this.selectedEmissionState.set(null);
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Create a new emission
   */
  async createEmission(emission: Omit<Emission, 'id' | 'created_at'>): Promise<Emission | null> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const created = await new Promise<Emission>((resolve, reject) => {
        this.emissionsService.create(emission).subscribe({
          next: resolve,
          error: reject,
        });
      });

      // Reload emissions to reflect the new one
      await this.loadEmissions();
      return created;
    } catch (error) {
      this.errorState.set(error as ApiError);
      return null;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Update an existing emission
   */
  async updateEmission(id: number, emission: Partial<Emission>): Promise<Emission | null> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const updated = await new Promise<Emission>((resolve, reject) => {
        this.emissionsService.patch(id, emission).subscribe({
          next: resolve,
          error: reject,
        });
      });

      // Update the emission in the current list
      this.emissionsState.update((emissions) =>
        emissions.map((e) => (e.id === id ? updated : e))
      );

      this.selectedEmissionState.set(updated);
      return updated;
    } catch (error) {
      this.errorState.set(error as ApiError);
      return null;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Delete an emission
   */
  async deleteEmission(id: number): Promise<boolean> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      await new Promise<void>((resolve, reject) => {
        this.emissionsService.delete(id).subscribe({
          next: resolve,
          error: reject,
        });
      });

      // Remove from current list
      this.emissionsState.update((emissions) => emissions.filter((e) => e.id !== id));
      this.totalCountState.update((count) => count - 1);

      return true;
    } catch (error) {
      this.errorState.set(error as ApiError);
      return false;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Select a country for globe visualization
   */
  selectCountry(country: string | null): void {
    this.selectedCountryState.set(country);
  }

  /**
   * Clear selected emission
   */
  clearSelectedEmission(): void {
    this.selectedEmissionState.set(null);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.errorState.set(null);
  }
}
