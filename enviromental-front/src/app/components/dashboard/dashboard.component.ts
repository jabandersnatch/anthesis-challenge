import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { EmissionsStore } from '../../store/emissions.store';
import { BarChartComponent } from '../charts/bar-chart/bar-chart.component';

/**
 * Dashboard Component
 * Displays overview statistics and visualizations
 */
@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    BarChartComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly store = inject(EmissionsStore);

  // Expose store signals
  readonly loading = this.store.loading;
  readonly emissions = this.store.emissions;
  readonly error = this.store.error;
  readonly totalCount = this.store.totalCount;

  // Computed statistics
  readonly totalEmissions = computed(() => {
    const emissionsArray = this.emissions();
    if (!emissionsArray || emissionsArray.length === 0) return 0;

    const total = emissionsArray.reduce((sum, e) => {
      const value = Number(e.emissions) || 0;
      return sum + value;
    }, 0);

    return total;
  });

  readonly avgEmissions = computed(() => {
    const emissionsArray = this.emissions();
    if (!emissionsArray || emissionsArray.length === 0) return 0;
    const total = emissionsArray.reduce((sum, e) => {
      const value = Number(e.emissions) || 0;
      return sum + value;
    }, 0);
    return total / emissionsArray.length;
  });

  readonly countriesCount = computed(() => {
    return this.store.uniqueCountries().length;
  });

  readonly latestYear = computed(() => {
    const years = this.emissions().map((e) => e.year);
    return years.length > 0 ? Math.max(...years) : new Date().getFullYear();
  });

  readonly totalEmissionsFormatted = computed(() => {
    const total = this.totalEmissions();
    return Number(total || 0).toFixed(2);
  });

  readonly avgEmissionsFormatted = computed(() => {
    const avg = this.avgEmissions();
    return Number(avg || 0).toFixed(2);
  });

  async ngOnInit(): Promise<void> {
    await this.store.loadEmissions();
  }

  async refresh(): Promise<void> {
    await this.store.loadEmissions();
  }
}
