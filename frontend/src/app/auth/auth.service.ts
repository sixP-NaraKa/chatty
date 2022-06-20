import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

export interface ApplicationUser {
  access_token: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject: BehaviorSubject<ApplicationUser>;
  public currentUserToken: Observable<ApplicationUser>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<ApplicationUser>(
      JSON.parse(localStorage.getItem("chatty-current-user") as string)
    );
    this.currentUserToken = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): ApplicationUser { // actually string, since "currentUser.access_token" is undefined in the interceptor, and "currentUser" itself gives back the token
    return this.currentUserSubject.value;
  }

  login(username: string, password: string) {
    return this.http.post<ApplicationUser>("http://localhost:3100/auth/login", { username: username, password: password }, { withCredentials: true }).pipe(
      map(user => {
        console.log("user obj =>", user);
        if (user && user.access_token) {
          localStorage.setItem("chatty-current-user", JSON.stringify(user.access_token));
          this.currentUserSubject.next(user);
        }
        return user;
      })
    );
  }

  logout() {
    localStorage.removeItem("chatty-current-user");
    this.currentUserSubject.next(null as any);
  }

}
