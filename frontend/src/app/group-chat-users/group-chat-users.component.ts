import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-group-chat-users',
    templateUrl: './group-chat-users.component.html',
    styleUrls: ['./group-chat-users.component.scss'],
})
export class GroupChatUsersComponent {
    users: { users: User }[] = [];
    @Input() set groupChatUsers(users: { users: User }[]) {
        this.users = users;
    }

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
    onRemoveParticipant(user: { users: User }) {
        this.removeUserFromGroupChat.emit(user.users);
    }

    onUserSelection(user: User) {
        if (this.users.some((u) => u.users.user_id === user.user_id)) {
            return;
        }
        this.addUserToGroupChatEvent.emit(user);
    }
}
