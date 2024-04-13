import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-registration-form',
    templateUrl: './registration-form.component.html',
    styleUrls: ['./registration-form.component.scss'],
})
export class RegistrationFormComponent implements OnInit {
    constructor(private userService: UserService, private router: Router) {}

    ngOnInit(): void {
        (document.getElementById('username') as HTMLInputElement).focus();
    }

    registrationFormGroup = new UntypedFormGroup({
        usernameInput: new UntypedFormControl('', Validators.required),
        passwordInput: new UntypedFormControl('', Validators.required),
        repeatPasswordInput: new UntypedFormControl('', Validators.required),
    });

    registrationErrorMessage: string = '';

    onRegistrationSubmit() {
        this.registrationErrorMessage = '';
        if (!this.arePasswordsEqualAndUsernameSupplied()) {
            this.registrationErrorMessage = 'Passwords do not match.';
            return;
        }

        const username = this.registrationFormGroup.value.usernameInput as string;
        const password = this.registrationFormGroup.value.passwordInput as string;
        this.userService
            .register(username, password)
            .pipe(first())
            .subscribe(
                (data) => {
                    window.alert('User created. Redirecting to login page.');
                    this.router.navigate(['/login']);
                },
                (error) => {
                    console.error(error);
                    this.registrationErrorMessage = error?.error?.message ?? 'Unknown problem. Try again later.';
                }
            );
    }

    arePasswordsEqualAndUsernameSupplied(): boolean {
        const password = this.registrationFormGroup.value.passwordInput as string;
        const repeatPassword = this.registrationFormGroup.value.repeatPasswordInput as string;
        return password !== repeatPassword || !password || !repeatPassword || !this.registrationFormGroup.valid
            ? false
            : true; // !username instead of ".valid" works too here
    }
}
