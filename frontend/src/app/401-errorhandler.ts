import { HttpErrorResponse } from "@angular/common/http";
import { ErrorHandler, Inject, Injectable, Injector, NgZone } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { UserService } from "./services/user.services";

@Injectable({
    providedIn: "root"
})
export class UnauthorizedErroHandler implements ErrorHandler {

    constructor(private userService: UserService, private ngZone: NgZone, @Inject(Injector) private injector: Injector) { }

    private get toastrService(): ToastrService {
        return this.injector.get(ToastrService);
    }

    handleError(error: any): void {
        console.error(error);
        this.toastrService.error(error.error?.error ?? error.message, "Error occurred");
        if (error instanceof HttpErrorResponse && error.status === 401) {
            this.ngZone.run(() => {
                window.alert("Unauthorized access. Please login again.");
                this.userService.logout();
            });
        }
    }

}