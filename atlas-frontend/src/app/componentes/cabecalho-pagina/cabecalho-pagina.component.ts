import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cabecalho-pagina',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cabecalho-pagina">
      <h2>{{ titulo }}</h2>
      <p *ngIf="subtitulo">{{ subtitulo }}</p>
    </div>
  `,
  styles: [
    `
    .cabecalho-pagina {
      margin-bottom: 1.5rem;
    }
    .cabecalho-pagina h2 {
      margin: 0;
      font-size: 1.5rem;
    }
    .cabecalho-pagina p {
      margin: 0.25rem 0 0;
      color: var(--text-color-secondary);
    }
  `,
  ],
})
export class CabecalhoPaginaComponent {
  @Input({ required: true }) titulo = '';
  @Input() subtitulo = '';
}
