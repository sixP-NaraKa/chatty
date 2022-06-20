import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HTTP_INTERCEPTORS
  } from '@angular/common/http';
  import { Observable } from 'rxjs';
  import { Injectable } from '@angular/core';
  import { AuthService } from '../auth.service';
  
  @Injectable({
    providedIn: 'root'
  })
  export class JwtInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) {}
  
    intercept(
      request: HttpRequest<any>,
      next: HttpHandler
    ): Observable<HttpEvent<any>> {
      // add authorization header with jwt token if available
      const currentUserToken = this.authService.currentUserValue;
      console.log("intercepting => currentUserToken", currentUserToken);
      if (currentUserToken) {
        request = request.clone({
          setHeaders: {
            "Authorization": `Bearer ${currentUserToken}`
          },
          // withCredentials: true
        });
      }
      console.log("cloned request", request);
  
      return next.handle(request);
    }
  }
  
  export const jwtInterceptorProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: JwtInterceptor,
    multi: true
  };
  