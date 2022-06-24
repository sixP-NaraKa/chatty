import { HttpErrorResponse } from "@angular/common/http";
import { ErrorHandler, Injectable, NgZone } from "@angular/core";
import { UserService } from "./services/user.services";

@Injectable({
    providedIn: "root"
})
export class UnauthorizedErroHandler implements ErrorHandler {

    constructor(private userService: UserService, private ngZone: NgZone) { }

    handleError(error: any): void {
        console.error(error);
        if (error instanceof HttpErrorResponse && error.status === 401) {
            this.ngZone.run(() => {
                window.alert("Unauthorized access. Please login again.");
                this.userService.logout();
            });
        }
    }

}