import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  LineController,
  LineElement,
  PointElement,
} from 'chart.js';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  LineController,
  LineElement,
  PointElement,
);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  years: string[] = [];
  selectedYearsMap: { [year: string]: boolean } = {};
  valgtKategori: string = 'Data og kommunikation';
  dropdownOpen = false;
  tempSelectedYearsMap: { [year: string]: boolean } = {};
  chart!: Chart;

  @ViewChild('chartCanvas') chartRef!: ElementRef<HTMLCanvasElement>;

  lastCheckedIndex: number | null = null;

  constructor() {
    this.fetchUploadedYears();
  }

  toggleDropdown(): void {
    this.tempSelectedYearsMap = { ...this.selectedYearsMap };
    this.dropdownOpen = !this.dropdownOpen;
  }

  confirmSelection(): void {
    this.selectedYearsMap = { ...this.tempSelectedYearsMap };
    this.tempSelectedYearsMap = {};
    this.dropdownOpen = false;
    this.onCompareSelectionChange();
  }

  get hasSelectedYears(): boolean {
    return Object.values(this.selectedYearsMap).some(val => val);
  }

  resetSelections(): void {
    this.selectedYearsMap = {};
    this.tempSelectedYearsMap = {};
    this.dropdownOpen = false;
    this.valgtKategori = 'Programmering';

    if (this.chart) {
      this.chart.destroy();
      this.chart = null!;
    }

    this.years.forEach(y => {
      this.selectedYearsMap[y] = false;
      this.tempSelectedYearsMap[y] = false;
    });

    this.years = [];
  }

  async onFileUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://10.0.1.210:3001/upload', {
          method: 'POST',
          body: formData,
        });
        await response.json();
      } catch (error) {
        console.error(`Upload failed for "${file.name}":`, error);
      }
    }

    await this.fetchUploadedYears();
    input.value = '';
  }

  fetchUploadedYears(): Promise<void> {
    return fetch('http://10.0.1.210:3001/upload')
      .then(response => response.json())
      .then((data: string[]) => {
        this.years = data.sort();
        this.years.forEach(y => {
          if (!(y in this.selectedYearsMap)) {
            this.selectedYearsMap[y] = false;
          }
        });
      })
      .catch(error => {
        console.error('Failed to fetch uploaded years:', error);
      });
  }

  onCompareSelectionChange(): void {
    const selectedYears = this.years.filter(y => this.selectedYearsMap[y]);

    if (selectedYears.length === 0) {
      if (this.chart) this.chart.destroy();
      return;
    }

    fetch('http://10.0.1.210:3001/upload/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ years: selectedYears }),
    })
      .then(response => response.json())
      .then((data) => {
        this.renderChart(data);
      })
      .catch(error => {
        console.error('Fejl ved hentning af diagramdata:', error);
      });
  }

  renderChart(data: any[]): void {
    const værdityper = ['oplæring', 'skole', 'vfo', 'delaftale', 'iAlt', 'muligePåVej'];

    data.sort((a, b) => {
      const getWeekYear = (str: string): { week: number, year: number } => {
        const match = str.match(/uge\s*(\d+)\s*[-–]\s*(\d{4})/i);
        return {
          week: match ? parseInt(match[1], 10) : 0,
          year: match ? parseInt(match[2], 10) : 0,
        };
      };

      const aDate = getWeekYear(a.file);
      const bDate = getWeekYear(b.file);
      if (aDate.year !== bDate.year) return aDate.year - bDate.year;
      return aDate.week - bDate.week;
    });

    const farver: { [key: string]: string } = {
      'oplæring': 'rgb(155, 0, 0)',
      'skole': 'rgb(168, 168, 0)',
      'vfo': 'rgb(0, 158, 0)',
      'delaftale': 'rgb(0, 0, 172)',
      'iAlt': 'rgb(168, 101, 0)',
      'muligePåVej': 'rgb(185, 0, 185)',
    };

    const labels = data.map(file => file.file);

    const datasets = værdityper.map(type => ({
      label: formatLabel(type),
      data: data.map(file => {
        const stat = file.stats.find((s: any) => s.name === this.valgtKategori);
        return stat ? stat[type] : 0;
      }),
      borderColor: farver[type],
      tension: 0,
      fill: false,
    }));

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            enabled: true,
            callbacks: {
              title: (tooltipItems) => tooltipItems[0]?.label ?? '',
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}`,
            },
          },
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Antal elever' } },
          x: { title: { display: true, text: 'Uge' } },
        },
      },
    });

    function formatLabel(valueType: string): string {
      switch (valueType) {
        case 'oplæring': return 'Oplæring';
        case 'skole': return 'Skole';
        case 'vfo': return 'VFO';
        case 'delaftale': return 'Delaftale';
        case 'iAlt': return 'I alt';
        case 'muligePåVej': return 'Mulige på vej';
        default: return valueType;
      }
    }
  }

  onCheckboxClick(event: MouseEvent, index: number): void {
    if (event.shiftKey && this.lastCheckedIndex !== null) {
      const [start, end] = [Math.min(this.lastCheckedIndex, index), Math.max(this.lastCheckedIndex, index)];
      for (let i = start; i <= end; i++) {
        const year = this.years[i];
        this.tempSelectedYearsMap[year] = true;
      }
    } else {
      const year = this.years[index];
      this.tempSelectedYearsMap[year] = !this.tempSelectedYearsMap[year];
    }

    this.lastCheckedIndex = index;
  }
}


