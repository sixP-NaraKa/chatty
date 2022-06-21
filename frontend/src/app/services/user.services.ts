import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { User } from "../../../../shared/types/db-dtos";
import { ApplicationUser, AuthService } from "../auth/auth.service";

@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(private authService: AuthService, private http: HttpClient) { }

    public get currentUser() : ApplicationUser {
        return this.authService.currentUserValue;
    }

    /* LOGIN */

    login(username: string, password: string): Observable<ApplicationUser> {
        return this.authService.login(username, password);
    }

    logout(): void {
        this.authService.logout();
    }

    isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }

    /* REGISTRATION */

    register(username: string, password: string): Observable<User> {
        return this.http.post<User>("http://localhost:3100/auth/create", { username: username, password: password });
    }

    /* FETCHING OF DATA */


}