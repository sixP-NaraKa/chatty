import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import config from 'src/environments/config';
import { WebsocketService } from '../services/websocket.service';

export interface ApplicationUser {
    access_token: string;
    username: string;
    userId: number;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private currentUserSubject: BehaviorSubject<ApplicationUser>;
    public currentUserToken: Observable<ApplicationUser>;

    constructor(private http: HttpClient, private router: Router, private wsService: WebsocketService) {
        this.currentUserSubject = new BehaviorSubject<ApplicationUser>(
            JSON.parse(localStorage.getItem('chatty-current-user') as string)
        );
        this.currentUserToken = this.currentUserSubject.asObservable();
    }

    /**
     * Return the application-wide saved User.
     */
    public get currentUserValue(): ApplicationUser {
        return this.currentUserSubject.value;
    }

    login(username: string, password: string): Observable<ApplicationUser> {
        return this.http
            .post<ApplicationUser>(
                `${config.BACKEND_HOST}/auth/login`,
                { username: username, password: password },
                { withCredentials: true }
            )
            .pipe(
                map((user) => {
                    if (user && user.access_token) {
                        localStorage.setItem('chatty-current-user', JSON.stringify(user)); // TODO: would rather not do this here, but for now no other "easy" way to store needed user info
                        this.currentUserSubject.next(user);
                    }
                    return user;
                })
            );
    }

    logout(): void {
        localStorage.removeItem('chatty-current-user');
        this.currentUserSubject.next(null as any);
        this.wsService.disconnect();
        this.router.navigate(['/login']);
    }

    isLoggedIn(): boolean {
        const value = this.currentUserValue;
        return value && value.access_token ? true : false;
    }
}
