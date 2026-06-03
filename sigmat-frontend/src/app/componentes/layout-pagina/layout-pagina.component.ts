import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout-pagina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './layout-pagina.component.html',
  styleUrls: ['./layout-pagina.component.scss']
})
export class LayoutPaginaComponent {
  @Input() hasStats = false;
  @Input() hasSearch = false;
  @Input() hasBulkActions = false;
  @Input() noContentPadding = true;
}
