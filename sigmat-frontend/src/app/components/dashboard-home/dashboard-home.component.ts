import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';

type GraficoKey = 'porStatus' | 'porTipo' | 'porDisponibilidade' | 'porBatalhao' | 'porMarca';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, ChartModule, DropdownModule, FormsModule],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
})
export class DashboardHomeComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  summary: any = null;
  charts: any = null;
  activities: any[] = [];
  loading = true;

  // Seletor de gráfico principal
  opcoesGrafico = [
    { label: 'Por Status', value: 'porStatus', tipo: 'pie' },
    { label: 'Por Tipo de Equipamento', value: 'porTipo', tipo: 'bar' },
    { label: 'Por Disponibilidade', value: 'porDisponibilidade', tipo: 'doughnut' },
    { label: 'Por Batalhão', value: 'porBatalhao', tipo: 'bar' },
    { label: 'Por Marca', value: 'porMarca', tipo: 'bar' },
  ];
  graficoSelecionado = this.opcoesGrafico[0];

  get dadosGraficoAtual(): any {
    if (!this.charts) return null;
    return this.charts[this.graficoSelecionado.value as GraficoKey];
  }

  opcoesPie = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeOutQuart',
      animateRotate: true,
      animateScale: true
    },
    plugins: {
      legend: { 
        position: 'bottom' as const, 
        labels: { 
          padding: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 10, weight: '600' },
          color: '#64748b'
        } 
      },
      tooltip: { 
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8
      },
    },
    cutout: '55%',
  };

  opcoesPolar = {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      duration: 1200,
      easing: 'easeOutQuart',
      animateRotate: true,
      animateScale: true
    },
    plugins: {
      legend: { 
        position: 'bottom' as const, 
        labels: { 
          padding: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 9, weight: '600' },
          color: '#64748b'
        } 
      },
      tooltip: { 
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 10,
        cornerRadius: 8
      },
    },
    scales: {
      r: {
        grid: { color: 'rgba(226, 232, 240, 0.5)' },
        angleLines: { display: false },
        ticks: { display: false }
      }
    }
  };

  get opcoesBar() {
    const isHorizontal = this.graficoSelecionado.value === 'porMarca' || this.graficoSelecionado.value === 'porBatalhao';
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: isHorizontal ? ('y' as const) : ('x' as const),
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: { display: false },
        tooltip: { 
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 12,
          cornerRadius: 8
        },
      },
      scales: {
        x: { 
          beginAtZero: true, 
          grid: { display: false }, 
          ticks: { color: '#94a3b8', font: { size: 11 } } 
        },
        y: { 
          beginAtZero: true, 
          grid: { color: 'rgba(226, 232, 240, 0.5)', borderDash: [5, 5] },
          ticks: { color: '#94a3b8', font: { size: 11 } }
        },
      },
    };
  }

  get tipoGraficoAtual(): 'pie' | 'bar' | 'doughnut' | 'line' | 'polarArea' {
    return this.graficoSelecionado.tipo as any;
  }

  get opcoesGraficoAtual(): any {
    if (this.tipoGraficoAtual === 'bar') return this.opcoesBar;
    if (this.tipoGraficoAtual === 'polarArea') return this.opcoesPolar;
    return this.opcoesPie;
  }

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados() {
    this.loading = true;
    this.dashboardService.obterEstatisticas().subscribe({
      next: (res) => {
        this.summary = res.resumo;
        this.charts = res.graficos;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
    this.dashboardService.obterAtividades().subscribe(res => this.activities = res);
  }

  irParaEquipamentos(q: string) {
    if (!q) return;
    this.router.navigate(['/dashboard/equipment'], { queryParams: { q } });
  }
}
