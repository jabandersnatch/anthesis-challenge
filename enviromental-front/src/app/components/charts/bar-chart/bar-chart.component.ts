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
import { Emission } from '../../../models/emission.model';

// Register Chart.js components
if (typeof window !== 'undefined') {
  Chart.register(...registerables);
}

/**
 * Bar Chart Component
 * Displays emissions data as a bar chart using Chart.js
 */
@Component({
  selector: 'app-bar-chart',
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
export class BarChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() emissions: Emission[] = [];
  @Input() groupBy: 'country' | 'year' | 'type' = 'country';
  @Input() limit: number = 10;

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
      type: 'bar',
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
            text: `Emissions by ${this.groupBy.charAt(0).toUpperCase() + this.groupBy.slice(1)}`,
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
              text:
                this.groupBy === 'country'
                  ? 'Country'
                  : this.groupBy === 'year'
                    ? 'Year'
                    : 'Emission Type',
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
    this.chart.options.plugins!.title!.text = `Emissions by ${this.groupBy.charAt(0).toUpperCase() + this.groupBy.slice(1)}`;
    this.chart.update();
  }

  private prepareChartData(): ChartConfiguration['data'] {
    const groupedData = this.groupEmissions();
    const labels = Object.keys(groupedData).slice(0, this.limit);
    const data = labels.map((label) => groupedData[label]);

    // Color palette
    const colors = [
      'rgba(63, 81, 181, 0.8)', // Indigo
      'rgba(233, 30, 99, 0.8)', // Pink
      'rgba(0, 150, 136, 0.8)', // Teal
      'rgba(255, 152, 0, 0.8)', // Orange
      'rgba(156, 39, 176, 0.8)', // Purple
      'rgba(76, 175, 80, 0.8)', // Green
      'rgba(244, 67, 54, 0.8)', // Red
      'rgba(33, 150, 243, 0.8)', // Blue
      'rgba(255, 235, 59, 0.8)', // Yellow
      'rgba(121, 85, 72, 0.8)', // Brown
    ];

    return {
      labels,
      datasets: [
        {
          label: 'Total Emissions',
          data,
          backgroundColor: colors,
          borderColor: colors.map((color) => color.replace('0.8', '1')),
          borderWidth: 2,
        },
      ],
    };
  }

  private groupEmissions(): Record<string, number> {
    const grouped: Record<string, number> = {};

    this.emissions.forEach((emission) => {
      let key: string;

      switch (this.groupBy) {
        case 'country':
          key = emission.country;
          break;
        case 'year':
          key = emission.year.toString();
          break;
        case 'type':
          key = emission.emission_type;
          break;
        default:
          key = emission.country;
      }

      if (!grouped[key]) {
        grouped[key] = 0;
      }
      grouped[key] += emission.emissions;
    });

    // Sort by emissions (descending) and return top N
    const sorted = Object.entries(grouped)
      .sort(([, a], [, b]) => b - a)
      .reduce(
        (acc, [key, value]) => {
          acc[key] = value;
          return acc;
        },
        {} as Record<string, number>,
      );

    return sorted;
  }
}
