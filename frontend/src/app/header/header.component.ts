import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { User } from '../../../../shared/types/db-dtos';
import { UserSettings } from '../../../../shared/types/user-settings';
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

    /**
     * EventEmitter to passthrough the catched "applySettingsEveent" event to the subscribed components.
     */
    @Output()
    applySettingsPassthroughEvent = new EventEmitter<UserSettings>();

    showMenu: boolean = false;

    currentUser: ApplicationUser;
    constructor(private userService: UserService) {
        this.currentUser = this.userService.currentUser;
    }

    ngOnInit(): void {
    }

    /**
     * Emits the logout event to subscribed components.
     */
    logout() {
        this.logOutEvent.emit(true);
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

    applySettingsPassthrough(userSettings: UserSettings) {
        this.applySettingsPassthroughEvent.emit(userSettings);
    }

}
