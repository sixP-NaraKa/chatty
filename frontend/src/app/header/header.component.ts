import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { settings, User } from '../../../../shared/types/db-dtos';
import { ApplicationUser } from '../auth/auth.service';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

    @Output()
    logOutEvent = new EventEmitter<boolean>();

    @Output()
    userSelectionEvent = new EventEmitter<User>();

    showMenu: boolean = false;

    currentUser: ApplicationUser;
    constructor(private userService: UserService) {
        this.currentUser = this.userService.currentUser;
    }

    ngOnInit(): void {
    }

    /**
     * Logs out the user and emits the logout event to subscribed components for further processing if needed.
     */
    logout() {
        this.logOutEvent.emit(true);
        this.userService.logout();
    }

    /**
     * Shows the settings menu.
     */
    onMenuButtonClick() {
        this.showMenu = true;
    }

    /**
     * Catches the event emitted from the settings-menu component,
     * when the settings menu has been closed.
     */
    onSettingsMenuClosed() {
        this.showMenu = false;
    }
}
