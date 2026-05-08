import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsService } from '../../services/reports.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, TooltipModule, InputTextModule],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.scss'
})
export class AuditLogsComponent implements OnInit {
  private reportsService = inject(ReportsService);

  logs: any[] = [];
  carregando = true;

  ngOnInit() {
    this.carregarLogs();
  }

  carregarLogs() {
    this.carregando = true;
    this.reportsService.obterAuditoria().subscribe({
      next: (res) => {
        this.logs = res;
        this.carregando = false;
      },
      error: () => this.carregando = false
    });
  }

  obterCorAcao(acao: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (acao?.toUpperCase()) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'danger';
      case 'LOGIN': return 'success';
      case 'LOGOUT': return 'secondary';
      default: return 'secondary';
    }
  }

  formatarJSON(json: any): string {
    if (!json) return '—';
    return JSON.stringify(json, null, 2);
  }
}
