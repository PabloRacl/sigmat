import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EquipmentService } from '../../../nucleo/servicos/equipamentos.service';
import { ROTAS } from '../../../nucleo/utilitarios/rotas.constantes';

@Component({
  selector: 'app-qr-movel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-movel.component.html',
  styleUrls: ['./qr-movel.component.scss']
})
export class MobileQrcodeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private equipmentService = inject(EquipmentService);

  equipamento: any = null;
  historico: any[] = [];
  exibirHistorico = false;
  erro: string = '';
  carregando = true;

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.carregarEquipamento(Number(idParam));
    } else {
      this.erro = 'Equipamento não especificado na URL.';
      this.carregando = false;
    }
  }

  carregarEquipamento(id: number) {
    this.equipmentService.buscarPorId(id).subscribe({
      next: (res) => {
        this.equipamento = res;
        this.carregarHistorico(id);
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          // Usuário não autenticado, redireciona para o login com returnUrl
          this.router.navigate([ROTAS.LOGIN], { queryParams: { returnUrl: `/qrcode/${id}` } });
        } else if (err.status === 404) {
          this.erro = 'Equipamento não encontrado no acervo.';
        } else {
          this.erro = 'Erro ao buscar dados do equipamento.';
        }
        this.carregando = false;
      }
    });
  }

  carregarHistorico(id: number) {
    this.equipmentService.obterHistorico(id).subscribe({
      next: (res) => {
        this.historico = res;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      }
    });
  }

  voltarAoSistema() {
    this.router.navigate([ROTAS.EQUIPAMENTOS]);
  }
}


