import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApplicationUser } from '../auth/auth.service';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

    // would work, but the "leavingChatroom" function does not seem to be triggered correctly
    // @Input()
    // leaveChatRoomCallback!: Function;

    @Output()
    logginOutEvent = new EventEmitter<boolean>();

    currentUser: ApplicationUser;
    constructor(private userService: UserService) {
        this.currentUser = this.userService.currentUser;
    }

    ngOnInit(): void {
    }

    logout() {
        this.logginOutEvent.emit(true);
    }

}
