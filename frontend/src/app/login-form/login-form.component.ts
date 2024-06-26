import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-login-form',
    templateUrl: './login-form.component.html',
    styleUrls: ['./login-form.component.scss'],
})
export class LoginFormComponent implements OnInit {
    constructor(private router: Router, private userService: UserService) {}

    ngOnInit(): void {
        (document.getElementById('username') as HTMLInputElement).focus();
    }

    loginFormGroup = new UntypedFormGroup({
        usernameInput: new UntypedFormControl('', Validators.required),
        passwordInput: new UntypedFormControl('', Validators.required),
    });

    loginErrorMessage: string = '';

    async onLoginSubmit() {
        this.loginErrorMessage = '';
        const username = this.loginFormGroup.value.usernameInput as string;
        const password = this.loginFormGroup.value.passwordInput as string;

        this.userService
            .login(username, password)
            .pipe(first())
            .subscribe(
                (data) => {
                    this.router.navigate(['/chat']);
                },
                (error) => {
                    console.log(error);
                    this.loginErrorMessage = 'Wrong username/password.';
                }
            );
    }
}
