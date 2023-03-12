import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-registration-form',
    templateUrl: './registration-form.component.html',
    styleUrls: ['./registration-form.component.scss']
})
export class RegistrationFormComponent implements OnInit {

    constructor(private userService: UserService, private router: Router) { }

    ngOnInit(): void {
        (document.getElementById("username") as HTMLInputElement).focus();
    }

    registrationFormGroup = new FormGroup({
        usernameInput: new FormControl("", Validators.required),
        passwordInput: new FormControl("", Validators.required),
        repeatPasswordInput: new FormControl("", Validators.required)
    });

    registrationErrorMessage: string = "";

    onRegistrationSubmit() {
        this.registrationErrorMessage = "";
        const username = this.registrationFormGroup.value.usernameInput as string;
        const password = this.registrationFormGroup.value.passwordInput as string;
        if (!this.arePasswordsEqualAndUsernameSupplied()) {
            this.registrationErrorMessage = "Passwords do not match.";
            return;
        }

        this.userService.register(username, password).pipe(first()).subscribe(
            data => {
                window.alert("User created. Redirecting to login page.");
                this.router.navigate(["/login"]);
            },
            error => {
                console.log(error);
                if (error as string) {
                    this.registrationErrorMessage = error.error.message;
                }
                else {
                    this.registrationErrorMessage = "Unknown problem. Try again later.";
                }
            }
        )
    }

    arePasswordsEqualAndUsernameSupplied(): boolean {
        const password = this.registrationFormGroup.value.passwordInput as string;
        const repeatPassword = this.registrationFormGroup.value.repeatPasswordInput as string;
        return password !== repeatPassword || !password || !repeatPassword || !this.registrationFormGroup.valid ? false : true; // !username instead of ".valid" works too here
    }

}
