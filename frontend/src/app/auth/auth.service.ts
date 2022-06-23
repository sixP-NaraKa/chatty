import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface ApplicationUser {
    access_token: string,
    username: string,
    userId: number
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private currentUserSubject: BehaviorSubject<ApplicationUser>;
    public currentUserToken: Observable<ApplicationUser>;

    constructor(private http: HttpClient, private router: Router) {
        this.currentUserSubject = new BehaviorSubject<ApplicationUser>(
            JSON.parse(localStorage.getItem("chatty-current-user") as string)
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
        return this.http.post<ApplicationUser>("http://localhost:3100/auth/login", { username: username, password: password }, { withCredentials: true }).pipe(
            map(user => {
                console.log("user obj =>", user);
                if (user && user.access_token) {
                    localStorage.setItem("chatty-current-user", JSON.stringify(user)); // TODO: would rather not do this here, but for now no other "easy" way to store needed user info
                    this.currentUserSubject.next(user);
                }
                return user;
            })
        );
    }

    logout(): void {
        localStorage.removeItem("chatty-current-user");
        this.currentUserSubject.next(null as any);
        this.router.navigate(["/login"]);
    }

    isLoggedIn(): boolean {
        const value = this.currentUserValue;
        return value && value.access_token ? true : false;
    }

}
