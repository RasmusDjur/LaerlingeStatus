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

    // ✅ NY: Til Shift-click valg
    lastCheckedIndex: number | null = null;

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
  const files = input.files;
  if (!files || files.length === 0) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (this.files.includes(file.name)) {
      console.warn(`Filen "${file.name}" er allerede uploadet – springes over.`);
      continue;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });
      await response.json();
    } catch (error) {
      console.error(`Upload failed for "${file.name}":`, error);
    }
  }

  // Opdater listen over uploadede filer efter alle uploads
  await this.fetchUploadedFiles();
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

      // ✅ Sortér filerne efter år og uge
      this.files.sort((a, b) => {
        const getWeekYear = (str: string): { week: number, year: number } => {
          const match = str.match(/uge\s*(\d{1,2})\s*[-–]\s*(\d{4})/i);
          return {
            week: match ? parseInt(match[1], 10) : 0,
            year: match ? parseInt(match[2], 10) : 0,
          };
        };

        const aDate = getWeekYear(a);
        const bDate = getWeekYear(b);

        if (aDate.year !== bDate.year) return aDate.year - bDate.year;
        return aDate.week - bDate.week;
      });

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
    const værdityper = ['oplæring', 'skole', 'vfo', 'delaftale', 'iAlt', 'muligePåVej'];

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
      'oplæring': '#1f77b4',    // Blue
      'skole': '#ff7f0e',      // Orange
      'vfo': '#2ca02c',        // Green
      'delaftale': '#d62728',  // Red
      'iAlt': '#9467bd',       // Purple
      'muligePåVej': '#8c564b' // Brown
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
        default: return valueType;
      }
    }
  }
  onCheckboxClick(event: MouseEvent, index: number): void {
    if (event.shiftKey && this.lastCheckedIndex !== null) {
      const [start, end] = [
        Math.min(this.lastCheckedIndex, index),
        Math.max(this.lastCheckedIndex, index)
      ];
  
      for (let i = start; i <= end; i++) {
        const file = this.files[i];
        this.tempSelectedFilesMap[file] = true;
      }
    } else {
      const file = this.files[index];
      this.tempSelectedFilesMap[file] = !this.tempSelectedFilesMap[file];
    }
  
    this.lastCheckedIndex = index;
  }
  
}
