import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'app-login-form',
    templateUrl: './login-form.component.html',
    styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit {

    constructor(private router: Router, private authService: AuthService) { }

    ngOnInit(): void {
    }

    loginFormGroup = new FormGroup({
        usernameInput: new FormControl("", Validators.required),
        passwordInput: new FormControl("", Validators.required)
    });

    loginErrorMessage: string = "";

    async onLoginSubmit() {
        this.loginErrorMessage = "";
        console.log("onLoginSubmit()...");
        const username = this.loginFormGroup.value.usernameInput as string;
        const password = this.loginFormGroup.value.passwordInput as string;

        this.authService.login(username, password).pipe(first()).subscribe(
            data => {
                console.log("authService.login(...) =>", data);
                this.router.navigate(["/chat"]);
            },
            error => {
                console.log(error);
                this.loginErrorMessage = "Wrong username/password.";
            }
        );
    }

}
