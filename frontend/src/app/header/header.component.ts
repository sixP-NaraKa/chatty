import { Component, EventEmitter, Output } from '@angular/core';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
    @Output()
    logOutEvent = new EventEmitter<boolean>();

    currentUserName: string;
    constructor(private userService: UserService) {
        this.currentUserName = this.userService.currentUser.username;
    }

    /**
     * Logs out the user and emits the logout event to subscribed components for further processing if needed.
     */
    logout() {
        this.logOutEvent.emit(true);
        this.userService.logout();
    }
}
