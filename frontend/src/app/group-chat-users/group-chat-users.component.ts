import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-group-chat-users',
    templateUrl: './group-chat-users.component.html',
    styleUrls: ['./group-chat-users.component.scss'],
})
export class GroupChatUsersComponent {
    users = new Array<User>();
    @Input() set groupChatUsers(users: Array<User>) {
        this.users = users;
    }

    @Input()
    hideDropdown: boolean = true;

    @Input()
    groupChatCreatedBy: number | null = -1;

    @Output()
    removeUserFromGroupChat = new EventEmitter<User>();

    @Output()
    addUserToGroupChatEvent = new EventEmitter<User>();

    currentUserId: number;
    constructor(private userService: UserService) {
        this.currentUserId = this.userService.currentUser.userId;
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

    onUserSelection(user: User) {
        if (this.users.some((u) => u.user_id === user.user_id)) {
            return;
        }
        // this.users.push(user); // no need to push here, as we do that already in the chat-page component (we would do it twice therefore)
        this.addUserToGroupChatEvent.emit(user);
    }
}
