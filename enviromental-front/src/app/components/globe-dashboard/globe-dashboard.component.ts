import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { EmissionsStore } from '../../store/emissions.store';
import { LineChartComponent } from '../charts/line-chart/line-chart.component';
import { GlobeChartComponent } from '../charts/globe-chart/globe-chart.component';

/**
 * Globe Dashboard Component
 * Displays country-based emissions data with interactive visualization
 */
@Component({
  selector: 'app-globe-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    LineChartComponent,
    GlobeChartComponent,
  ],
  templateUrl: './globe-dashboard.component.html',
  styleUrl: './globe-dashboard.component.css',
})
export class GlobeDashboardComponent implements OnInit {
  private readonly store = inject(EmissionsStore);

  readonly loading = this.store.loading;
  readonly emissions = this.store.emissions;
  readonly selectedCountry = this.store.selectedCountry;
  readonly countries = this.store.uniqueCountries;

  readonly filteredEmissions = computed(() => {
    const country = this.selectedCountry();
    if (!country) return this.emissions();
    return this.emissions().filter((e) => e.country === country);
  });

  async ngOnInit(): Promise<void> {
    await this.store.loadEmissions();
  }

  selectCountry(country: string): void {
    this.store.selectCountry(country);
  }

  clearSelection(): void {
    this.store.selectCountry(null);
  }

  onCountrySelectedFromGlobe(country: string): void {
    this.selectCountry(country);
  }

  onCountryHovered(country: string | null): void {
    // Could be used for additional hover effects
  }
}
