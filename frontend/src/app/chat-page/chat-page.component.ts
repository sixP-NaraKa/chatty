import { Component, OnInit } from '@angular/core';
import { ChatRoomWithParticipantsExceptSelf, settings } from '../../../../shared/types/db-dtos';
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

    // locally stored user settings with default values
    userSettings!: settings;

    constructor(private userService: UserService, private wsService: WebsocketService) {
        // (re)connect the websocket on page reload
        // why here? because if this app-chat-page component gets loaded, we are logged in and ready to go
        this.wsService.connect();

        // fetch initial user settings
        this.userService.getUserSettings(this.userService.currentUser.userId).subscribe(stts => {
            // this will (re)trigger the [filterOutEmpty1on1Chats] directive (as it seems) before it gets loaded (?)
            this.userSettings = stts;
            console.log("fetched user settings", this.userSettings);
            this.editChatWindowElementFontSize(stts); // both will have the same values, but this doesn't matter
        });
    }

    ngOnInit(): void {
        // this.listenForNewChatroomsAndJoinThem();
    }

    /**
     * Log out the user. Catches the "logoutOutEvent(...)" event from the app-header component.
     */
    logout() {
        // document.onclick = null; // otherwise "window" if used
        document.removeAllListeners!("click");
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

    applySettings(usrSetts: settings) {
        // TODO: no idea why after the first time here, both userSettings are ALWAYS the same... makes no sense
        //       does not matter for the filter changes, but font-size changes need therefore a small,
        //       rather insignificant workaround, but a workaround nonetheless
        console.log("passed usersettings", usrSetts, "this.userSettings", this.userSettings);
        let shouldReload: boolean = false;
        this.editChatWindowElementFontSize(usrSetts);

        if (this.userSettings.filter !== usrSetts.filter) {
            shouldReload = true;
        }
        this.userSettings = usrSetts;

        // page reload will, if it happened, repopulate the settings, etc.
        // TODO: either reload the page, or pass an event to the chat-tabs component, to reload the chat-tabs?
        if (shouldReload) {
            window.alert("Filter changes will be applied after a page reload. Reloading page for the changes to take effect...");
            document.location.reload();
        }
    }

    editChatWindowElementFontSize(usrSetts: settings) {
        let chatWindowElement = (document.getElementById("chatWindowDiv") as HTMLDivElement);
        if (usrSetts.font_size === "default") {
            chatWindowElement.classList.add("text-xs", "md:text-base");
            chatWindowElement.classList.remove("text-sm", "text-base", "text-lg", "text-xl", "text-2xl");
        }
        else {
            chatWindowElement.classList.remove("text-xs", "md:text-base", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl");
            chatWindowElement.classList.add(`${usrSetts.font_size}`);
        }
    }

}
