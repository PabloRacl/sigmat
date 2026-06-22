import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabela-scroll',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabela-scroll.component.html',
  styleUrls: ['./tabela-scroll.component.scss']
})
export class TabelaScrollComponent implements AfterViewInit, OnDestroy {
  @ViewChild('topScroll') topScroll!: ElementRef;
  larguraTabela = 1000;
  private resizeObserver: ResizeObserver | null = null;
  private tableWrapper: Element | null = null;
  private checkInterval: any;

  constructor(private el: ElementRef, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.checkForTableWrapper();
  }

  checkForTableWrapper() {
    this.checkInterval = setInterval(() => {
      this.tableWrapper = this.getScrollableElement();
      if (this.tableWrapper) {
        clearInterval(this.checkInterval);
        this.initSync();
      }
    }, 500);
  }

  getScrollableElement(): Element | null {
    const parent = this.el.nativeElement.parentElement;
    if (!parent) return null;
    return parent.querySelector('.p-datatable-wrapper');
  }

  private updatePositionBound = this.updatePosition.bind(this);

  updatePosition() {
    if (!this.tableWrapper) return;
    const rect = this.tableWrapper.getBoundingClientRect();
    const hostEl = this.el.nativeElement as HTMLElement;
    const viewportHeight = window.innerHeight;
    
    // Se a tabela estiver na tela, mas seu fim estiver cortado pelo rodape do monitor:
    if (rect.top < viewportHeight && rect.bottom > viewportHeight) {
      hostEl.style.position = 'fixed';
      hostEl.style.bottom = '0px';
      hostEl.style.left = `${rect.left}px`;
      hostEl.style.width = `${rect.width}px`;
      hostEl.style.display = 'block';
      hostEl.style.zIndex = '9999';
    } else {
      hostEl.style.display = 'none';
    }
  }

  initSync() {
    if (this.tableWrapper && this.topScroll) {
      this.larguraTabela = this.tableWrapper.scrollWidth;
      this.cdr.detectChanges();
      
      this.tableWrapper.addEventListener('scroll', this.onBottomScroll);
      window.addEventListener('scroll', this.updatePositionBound, true);
      window.addEventListener('resize', this.updatePositionBound);
      
      // Monitora mudancas de tamanho interno continuamente
      this.resizeObserver = setInterval(() => {
         const realWidth = this.tableWrapper!.scrollWidth;
         if (realWidth !== this.larguraTabela) {
             this.larguraTabela = realWidth;
             this.cdr.detectChanges();
         }
         this.updatePosition();
      }, 300) as any;
    }
  }

  onBottomScroll = () => {
    if (this.topScroll && this.tableWrapper) {
      if (Math.abs(this.topScroll.nativeElement.scrollLeft - this.tableWrapper.scrollLeft) > 2) {
        this.topScroll.nativeElement.scrollLeft = this.tableWrapper.scrollLeft;
      }
    }
  };

  onTopScroll() {
    if (this.tableWrapper && this.topScroll) {
      if (Math.abs(this.tableWrapper.scrollLeft - this.topScroll.nativeElement.scrollLeft) > 2) {
        this.tableWrapper.scrollLeft = this.topScroll.nativeElement.scrollLeft;
      }
    }
  }

  ngOnDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.tableWrapper) {
      this.tableWrapper.removeEventListener('scroll', this.onBottomScroll);
    }
    window.removeEventListener('scroll', this.updatePositionBound, true);
    window.removeEventListener('resize', this.updatePositionBound);
    if (this.resizeObserver) {
      clearInterval(this.resizeObserver as any);
    }
  }
}
