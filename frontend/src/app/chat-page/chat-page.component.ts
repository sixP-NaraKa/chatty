import { Component, OnInit } from '@angular/core';
import { ChatRoomWithParticipantsExceptSelf } from '../../../../shared/types/db-dtos';
import { UserSettings } from '../../../../shared/types/user-settings';
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

    // locally stored UserSettings with default values
    userSettings: UserSettings;

    constructor(private userService: UserService, private wsService: WebsocketService) {
        // (re)connect the websocket on page reload
        // why here? because if this app-chat-page component gets loaded, we are logged in and ready to go
        this.wsService.connect();

        // TODO: fetch initial User Settings from db and apply them, or store them in the usersService if needed/wanted
        this.userSettings =  {
            filter: "filter",
            fontSize: "default"
        };
    }

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
        // join the chatroom websocket room
        this.wsService.joinChatroom(chat.chatroom_id);
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

    applySettings(userSettings: UserSettings) {
        console.log(userSettings);
        // check settings and act accordingly
        this.userSettings = userSettings;

        // for font size, something like the following might work:
        // check if default was selected, e.g. don't change anything here
        // let element = (document.getElementById("DIV element which holds chat window contents") as HTMLDivElement);
        // element.classList.remove("ELEMENTS TO REMOVE"); // e.g. md:text-base, and text-sm from this element
        // element.classList.add("TAILWIND TEXT FONT SIZE => text-[12px], etc.");
    }

}
