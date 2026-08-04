import { HttpInterceptorFn } from '@angular/common/http';

export const csrfInterceptor: HttpInterceptorFn = (request, next) => {
  const method = request.method.toUpperCase();
  const csrfToken = localStorage.getItem('csrfToken');

  let updatedRequest = request.clone({ withCredentials: true });

  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    updatedRequest = updatedRequest.clone({
      setHeaders: {
        'X-XSRF-TOKEN': csrfToken
      }
    });
  }

  return next(updatedRequest);
};
