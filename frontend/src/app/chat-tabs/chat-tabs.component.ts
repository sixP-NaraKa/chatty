import { AfterContentInit, Component, EventEmitter, Output } from '@angular/core';
import { ChatRoomWithParticipantsExceptSelf, User } from '../../../../shared/types/db-dtos';
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
    }

    ngAfterContentInit() {
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

    userSelection(user: User) {
        console.log("user emitted from user-search", user);
        const existingChatroom = this.chatrooms.filter(room => !room.chatrooms.isgroup && room.chatrooms.participants.some(
            participant => participant.users.user_id === user.user_id
        ));
        console.log("chatroom already exists? (frontend) => ", existingChatroom);
        if (existingChatroom.length === 0) {
            // make API call to create a new chatroom with the two participants
            console.log("creating new chatroom (frontend)");
            this.userService.create1on1Chatroom(this.currentUser.userId, user.user_id).subscribe(room => {
                this.chatrooms.push(room);
                this.notifyLoadChat(room);
            })
        }
        else {
            // load the existing chatroom
            console.log("loading existing chatroom");
            this.notifyLoadChat(existingChatroom[0]);
        }
    }

}
