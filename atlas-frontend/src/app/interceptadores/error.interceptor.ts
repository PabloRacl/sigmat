import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMsg = 'Ocorreu um erro inesperado.';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMsg = `Erro: ${error.error.message}`;
      } else {
        // Server-side error
        if (error.error && error.error.message) {
          const backendMessage = error.error.message;
          errorMsg = Array.isArray(backendMessage) ? backendMessage.join(', ') : backendMessage;
        } else if (error.status !== 0) {
          errorMsg = `Erro ${error.status}: ${error.message}`;
        }
      }

      if (error.status !== 401) {
        messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: errorMsg,
          life: 5000
        });
      }

      return throwError(() => error);
    })
  );
};
