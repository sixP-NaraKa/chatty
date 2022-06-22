import { AfterContentInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { ChatRoomWithParticipantsExceptSelf } from '../../../../shared/types/db-dtos';
import { ApplicationUser } from '../auth/auth.service';
import { UserService } from '../services/user.services';


@Component({
    selector: 'app-chat-tabs',
    templateUrl: './chat-tabs.component.html',
    styleUrls: ['./chat-tabs.component.scss']
})
export class ChatTabsComponent implements AfterContentInit {

    @Output()
    loadChat = new EventEmitter<ChatRoomWithParticipantsExceptSelf>();

    chatrooms!: ChatRoomWithParticipantsExceptSelf[];

    selectedChatId: number = -1;

    currentUser: ApplicationUser;

    constructor(private userService: UserService) {
        this.currentUser = this.userService.currentUser;
        console.log("currentUser", this.currentUser);
    }

    async ngAfterContentInit() {
        this.userService.getChatroomsForUserWithParticipantsExceptSelf(this.currentUser.userId).subscribe(chats => {
            this.chatrooms = chats;
            console.log("chatrooms =>", this.chatrooms);
        });
    }

    notifyLoadChat(chat: ChatRoomWithParticipantsExceptSelf) {
        if (this.selectedChatId === chat.chatroom_id) { // no need to load the chat again
            return;
        }
        this.selectedChatId = chat.chatroom_id;
        this.loadChat.emit(chat);
    }

}
