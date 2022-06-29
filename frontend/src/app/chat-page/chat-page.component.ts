import { Component, OnInit } from '@angular/core';
import { ChatRoomWithParticipantsExceptSelf } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';
import { WebsocketService } from '../services/websocket.service';

@Component({
    selector: 'app-chat-page',
    templateUrl: './chat-page.component.html',
    styleUrls: ['./chat-page.component.scss']
})
export class ChatPageComponent implements OnInit {

    /**
     * Chatroom ID will be used to notify the app-chat component which chat to load.
     */
    chatroomIdToLoad: number = -1;

    constructor(private userService: UserService, private wsService: WebsocketService) { }

    ngOnInit(): void {
        this.listenForNewChatroomsAndJoinThem();
    }

    /**
     * Log out the user. Catches the "logoutOutEvent(...)" event from the app-header component.
     */
    logout() {
        document.onclick = null; // otherwise "window" if used
        this.userService.logout();
    }

    /**
     * Catches the "loadChat(...)" event from the app-chat-tabs component
     * and passes it to the app-chat component to load messages for the given chat ID.
     * 
     * @param chat the chat to pass to the app-chat component (we only take the ID at the moment)
     */
    displayChat(chat: ChatRoomWithParticipantsExceptSelf) {
        console.log("new chat to load", chat)
        this.chatroomIdToLoad = chat.chatroom_id;
        console.log("new chatId to load", this.chatroomIdToLoad);
    }

    listenForNewChatroomsAndJoinThem() {
        // listen for new chatrooms which have been created and the user is a part of.
        // join these chatrooms first, but do not show them in the UI unless there have been messages.
        // listen in a second part (done in the app-chat-tabs component for the moment) to the websocket event "get:message"
        // and if this chat is not yet part of our locally stored list, show them in the UI.
        this.wsService.getNewChatroom().subscribe(([chatroom, participantUserId]) => {
            if (participantUserId === this.userService.currentUser.userId) {
                this.wsService.joinChatroom(chatroom.chatroom_id);
            }
        });
    }

}
