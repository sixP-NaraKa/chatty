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
    }

    registrationFormGroup = new FormGroup({
        usernameInput: new FormControl("", Validators.required),
        passwordInput: new FormControl("", Validators.required)
    });

    registrationErrorMessage: string = "";

    onRegistrationSubmit() {
        this.registrationErrorMessage = "";
        const username = this.registrationFormGroup.value.usernameInput as string;
        const password = this.registrationFormGroup.value.passwordInput as string;
        this.userService.register(username, password).pipe(first()).subscribe(
            data => {
                console.log("userService.register(...) =>", data);
                window.alert("User created. Redirecting to login page.");
                this.router.navigate(["/login"]);
            },
            error => {
                console.log(error);
                if (error as string) {
                    this.registrationErrorMessage = error;
                }
                else {
                    this.registrationErrorMessage = "Unknown problem. Try again later.";
                }
            }
        )
    }

}
