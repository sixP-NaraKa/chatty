import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { User } from '../../../../shared/types/db-dtos';
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

    currentUser: ApplicationUser;
    constructor(private userService: UserService) {
        this.currentUser = this.userService.currentUser;
    }

    ngOnInit(): void {
    }

    logout() {
        this.logOutEvent.emit(true);
    }

}
