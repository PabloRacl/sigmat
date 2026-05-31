import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        // Tenta o refresh
        return authService.refresh().pipe(
          switchMap(res => {
            const newAuthReq = req.clone({
              setHeaders: { Authorization: `Bearer ${res.access_token}` }
            });
            return next(newAuthReq);
          }),
          catchError(refreshError => {
            authService.logout(); // Se falhar o refresh, desloga
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

