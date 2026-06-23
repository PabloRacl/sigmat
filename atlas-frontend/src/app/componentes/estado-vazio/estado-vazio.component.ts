import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-estado-vazio',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="estado-vazio">
      <p><i [class]="'pi ' + icone"></i></p>
      <p>{{ mensagem }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
    .estado-vazio {
      text-align: center;
      padding: 2rem;
      color: var(--text-color-secondary);
    }
  `,
  ],
})
export class EstadoVazioComponent {
  @Input() mensagem = 'Nenhum registro encontrado.';
  @Input() icone = 'pi-info-circle';
}
