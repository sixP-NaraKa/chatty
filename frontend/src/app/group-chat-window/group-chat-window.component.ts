import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ChatRoomWithParticipantsExceptSelf, User } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';
import { WebsocketService } from '../services/websocket.service';

@Component({
    selector: 'app-group-chat-window',
    templateUrl: './group-chat-window.component.html',
    styleUrls: ['./group-chat-window.component.scss'],
})
export class GroupChatWindowComponent {
    @Input()
    shouldShowWindow: boolean = false;

    @Output()
    groupChatClosedEvent = new EventEmitter<boolean>();

    selectedUsers = new Array<User>();

    formGroup = new FormGroup({
        groupChatName: new FormControl('', Validators.required),
    });

    @Output()
    groupChatCreatedEvent = new EventEmitter<ChatRoomWithParticipantsExceptSelf>();

    constructor(private userService: UserService, private wsService: WebsocketService) {}

    /**
     * Close the group chat window.
     */
    closeMenu() {
        // clear locally stored list of selected users
        this.selectedUsers = new Array<User>();
        // clear the input of the name field
        this.formGroup.reset();

        this.shouldShowWindow = false;
        this.groupChatClosedEvent.emit(false);
    }

    userSelection(user: User) {
        if (!this.selectedUsers.some((u) => user.user_id === u.user_id)) {
            this.selectedUsers.push(user);
        }
    }

    removeUser(user: User) {
        const idxOf = this.selectedUsers.indexOf(user);
        this.selectedUsers.splice(idxOf, 1);
    }

    onSubmit() {
        const groupChatName = this.formGroup.value.groupChatName as string;
        const groupChatParticipantUserIds = new Array<number>();
        for (let user of this.selectedUsers) {
            groupChatParticipantUserIds.push(user.user_id);
        }
        this.userService.createChatroom(groupChatParticipantUserIds, true, groupChatName).subscribe((chatroom) => {
            this.closeMenu();
            this.wsService.createChatroom(chatroom, groupChatParticipantUserIds);
            this.groupChatCreatedEvent.emit(chatroom);
        });
    }
}
