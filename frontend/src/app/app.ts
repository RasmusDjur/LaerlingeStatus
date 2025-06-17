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
  files: string[] = [];
  selectedFilesMap: { [filename: string]: boolean } = {};
  valgtKategori: string = 'Programmering';
  dropdownOpen = false;
  tempSelectedFilesMap: { [filename: string]: boolean } = {};
  chart!: Chart;

  @ViewChild('chartCanvas') chartRef!: ElementRef<HTMLCanvasElement>;

  constructor() {
    this.fetchUploadedFiles();
  }

  toggleDropdown(): void {
    this.tempSelectedFilesMap = { ...this.selectedFilesMap };
    this.dropdownOpen = !this.dropdownOpen;
  }

  confirmSelection(): void {
    this.selectedFilesMap = { ...this.tempSelectedFilesMap };
    this.tempSelectedFilesMap = {}; // Nulstil dropdown-valgene
    this.dropdownOpen = false;
    this.onCompareSelectionChange();
  }

  get hasSelectedFiles(): boolean {
    return Object.values(this.selectedFilesMap).some(val => val);
  }

  // Reset selections (clear files and dropdown selections)
resetSelections(): void {
  console.log('Resetting everything...');

  // 1. Ryd alle valgte filer
  this.selectedFilesMap = {};
  this.tempSelectedFilesMap = {}; // Ryd midlertidige dropdown-valg

  // 2. Luk dropdown-menuen hvis den er åben
  this.dropdownOpen = false;
  console.log('Dropdown Open:', this.dropdownOpen);

  // 3. Ryd kategori-valg
  this.valgtKategori = 'Programmering'; // Reset kategori
  console.log('Valgt Kategori efter reset:', this.valgtKategori);

  // 4. Hvis der er et chart, fjern det
  if (this.chart) {
    console.log('Destroying chart...');
    this.chart.destroy();  // Ryd chartet
    this.chart = null!;  // Fjern chartet
    console.log('Chart destroyed');
  }

  // 5. Reset dropdown data
  this.files.forEach(f => {
    this.selectedFilesMap[f] = false;  // Fjern markering af alle filer i dropdown
    this.tempSelectedFilesMap[f] = false;  // Fjern midlertidige markeringer
  });

  // 6. Force a refresh of the UI
  this.files = [];  // Tøm filerne (hvis nødvendigt)
  console.log('Files after reset:', this.files);

  // 7. Tøm dropdown
  this.dropdownOpen = false;

  // Bekræft status efter reset
  console.log('selectedFilesMap efter reset:', this.selectedFilesMap);
  console.log('tempSelectedFilesMap efter reset:', this.tempSelectedFilesMap);
}

  async onFileUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (this.files.includes(file.name)) {
      alert(`Filen "${file.name}" er allerede uploadet.`);
      input.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });
      await response.json();

      // Opdater fil-listen EFTER uploaden er færdig
      await this.fetchUploadedFiles();
    } catch (error) {
      console.error('Upload failed:', error);
    }

    input.value = '';
  }

  fetchUploadedFiles(): Promise<void> {
    return fetch('http://localhost:3001/upload')
      .then(response => response.json())
      .then((data: any[]) => {
        if (typeof data[0] === 'string') {
          this.files = data;
        } else {
          this.files = data.map(file => file.name);
        }

        this.files.forEach(f => {
          if (!(f in this.selectedFilesMap)) {
            this.selectedFilesMap[f] = false;
          }
        });

        this.onCompareSelectionChange();
      })
      .catch(error => {
        console.error('Failed to fetch uploaded files:', error);
      });
  }

  onCompareSelectionChange(): void {
    const selectedFiles = this.files.filter(f => this.selectedFilesMap[f]);

    if (selectedFiles.length === 0) {
      if (this.chart) this.chart.destroy();
      return;
    }

    fetch('http://localhost:3001/upload/compare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filenames: selectedFiles }),
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
    const værdityper = ['oplæring', 'skole', 'vfo', 'delaftale', 'iAlt', 'muligePåVej', 'oversigt2023'];

    // Sortér filerne efter uge og år
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
      'oplæring': '#3498DB',
      'skole': '#5DADE2',
      'vfo': '#7D5FFF',
      'delaftale': '#BA55D3',
      'iAlt': '#9966CC',
      'muligePåVej': '#800080',
      'oversigt2023': '#4B0082',
    };

    const labels = data.map(file => file.file); // fx 'uge 40 - 2024'

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
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            enabled: true,
            callbacks: {
              title: (tooltipItems) => tooltipItems[0]?.label ?? '',
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}`
            }
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Antal elever'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Uge'
            }
          }
        }
      }
    });

    function formatLabel(valueType: string): string {
      switch (valueType) {
        case 'oplæring': return 'Oplæring';
        case 'skole': return 'Skole';
        case 'vfo': return 'VFO';
        case 'delaftale': return 'Delaftale';
        case 'iAlt': return 'I alt';
        case 'muligePåVej': return 'Mulige på vej';
        case 'oversigt2023': return 'Oversigt 2023';
        default: return valueType;
      }
    }
  }
}
