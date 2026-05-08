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

  get opcoesPie() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' as const, labels: { padding: 20, font: { size: 13 } } },
        tooltip: { padding: 12 },
      },
    };
  }

  get opcoesBar() {
    const isHorizontal = this.graficoSelecionado.value === 'porMarca' || this.graficoSelecionado.value === 'porBatalhao';
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: isHorizontal ? ('y' as const) : ('x' as const),
      plugins: {
        legend: { display: false },
        tooltip: { padding: 12 },
      },
      scales: {
        x: { beginAtZero: true, grid: { display: !isHorizontal }, ticks: { stepSize: 1 } },
        y: { beginAtZero: true, grid: { display: isHorizontal } },
      },
    };
  }

  get tipoGraficoAtual(): 'pie' | 'bar' | 'doughnut' | 'line' {
    return this.graficoSelecionado.tipo as 'pie' | 'bar' | 'doughnut' | 'line';
  }

  get opcoesGraficoAtual(): any {
    return this.tipoGraficoAtual === 'bar' ? this.opcoesBar : this.opcoesPie;
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
