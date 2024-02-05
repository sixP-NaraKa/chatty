import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HTTP_INTERCEPTORS,
    HttpParams,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { UserService } from 'src/app/services/user.services';

@Injectable({
    providedIn: 'root',
})
export class JwtInterceptor implements HttpInterceptor {
    constructor(private userService: UserService) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // add authorization header with jwt token if available
        const currentUser = this.userService.currentUser;
        // console.log("intercepting => currentUser", currentUser);
        if (currentUser && currentUser.access_token) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${currentUser.access_token}`,
                },
                params: new HttpParams().set('userId', currentUser.userId),
                // withCredentials: true
            });
            // console.log("cloned request", request);
        }

        return next.handle(request);
    }
}

export const jwtInterceptorProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: JwtInterceptor,
    multi: true,
};
