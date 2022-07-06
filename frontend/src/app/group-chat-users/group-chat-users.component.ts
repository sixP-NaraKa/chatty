import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { User, UserIdDisplayName, users } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-group-chat-users',
    templateUrl: './group-chat-users.component.html',
    styleUrls: ['./group-chat-users.component.scss']
})
export class GroupChatUsersComponent implements AfterViewInit {

    users = new Array<User>();
    @Input() set groupChatUsers(users: Array<User>) {
        this.users = users;
    }

    @Input()
    groupChatCreatedBy: number | null = -1;

    @Output()
    removeUserFromGroupChat = new EventEmitter<User>();

    currentUserId: number;
    constructor(private userService: UserService) {
        this.currentUserId = this.userService.currentUser.userId;
    }

    ngAfterViewInit(): void {
    }

    /**
     * Onclick function to remove a user from the group chat.
     * 
     * @param user the user to remove from the group chat
     */
    onRemoveParticipant(user: User) {
        const idxOf = this.users.indexOf(user);
        this.users.splice(idxOf, 1);
        this.removeUserFromGroupChat.emit(user);
    }

    // TODO: think about removing for other users the participants as well, via the existing websocket method(s)

}
