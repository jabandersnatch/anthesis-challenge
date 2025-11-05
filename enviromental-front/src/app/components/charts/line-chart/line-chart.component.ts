import {
  Component,
  Input,
  OnChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Emission, EmissionType } from '../../../models/emission.model';

// Register Chart.js components
if (typeof window !== 'undefined') {
  Chart.register(...registerables);
}

/**
 * Line Chart Component
 * Displays emissions data as a line chart over time
 */
@Component({
  selector: 'app-line-chart',
  template: `
    <div class="chart-wrapper">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [
    `
      .chart-wrapper {
        position: relative;
        height: 400px;
        width: 100%;
      }

      canvas {
        max-height: 100%;
        max-width: 100%;
      }
    `,
  ],
})
export class LineChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() emissions: Emission[] = [];
  @Input() country: string | null = null;

  private chart: Chart | null = null;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.createChart();
    }
  }

  ngOnChanges(): void {
    if (this.chart && this.isBrowser) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart(): void {
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const chartData = this.prepareChartData();

    const config: ChartConfiguration = {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          title: {
            display: true,
            text: this.country
              ? `Emissions Over Time - ${this.country}`
              : 'Emissions Over Time',
            font: {
              size: 16,
              weight: 'bold',
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y?.toFixed(2) ?? '0.00';
                return `${label}: ${value} Mt CO₂e`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Emissions (Mt CO₂ equivalent)',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Year',
            },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (!this.chart) return;

    const chartData = this.prepareChartData();
    this.chart.data = chartData;
    this.chart.options.plugins!.title!.text = this.country
      ? `Emissions Over Time - ${this.country}`
      : 'Emissions Over Time';
    this.chart.update();
  }

  private prepareChartData(): ChartConfiguration['data'] {
    // Group by year and emission type
    const emissionsByType: Record<string, Record<number, number>> = {};

    this.emissions.forEach((emission) => {
      const type = emission.emission_type;
      if (!emissionsByType[type]) {
        emissionsByType[type] = {};
      }
      if (!emissionsByType[type][emission.year]) {
        emissionsByType[type][emission.year] = 0;
      }
      emissionsByType[type][emission.year] += emission.emissions;
    });

    // Get all unique years and sort them
    const years = Array.from(
      new Set(this.emissions.map((e) => e.year))
    ).sort((a, b) => a - b);

    // Colors for different emission types
    const typeColors: Record<string, string> = {
      [EmissionType.CO2]: 'rgba(244, 67, 54, 0.8)',
      [EmissionType.CH4]: 'rgba(255, 152, 0, 0.8)',
      [EmissionType.N2O]: 'rgba(76, 175, 80, 0.8)',
      [EmissionType.F_GASES]: 'rgba(156, 39, 176, 0.8)',
    };

    // Create datasets for each emission type
    const datasets = Object.entries(emissionsByType).map(([type, yearData]) => ({
      label: type,
      data: years.map((year) => yearData[year] || 0),
      borderColor: typeColors[type] || 'rgba(63, 81, 181, 0.8)',
      backgroundColor: (typeColors[type] || 'rgba(63, 81, 181, 0.8)').replace('0.8', '0.2'),
      borderWidth: 2,
      fill: true,
      tension: 0.4,
    }));

    return {
      labels: years.map(String),
      datasets,
    };
  }
}
