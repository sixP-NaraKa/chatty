import { Component, Input, OnInit } from '@angular/core';
import { emote, ChatMessageWithUser, ChatRoomWithParticipantsExceptSelf } from '../../../../shared/types/db-dtos';
import { ApplicationUser } from '../auth/auth.service';
import { UserService } from '../services/user.services';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { WebsocketService } from '../services/websocket.service';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

    currentUser: ApplicationUser;

    chatroomId: number = -1;
    @Input() set setChatroom(chatroom: ChatRoomWithParticipantsExceptSelf) {
        this.chatroomId = chatroom ? chatroom.chatroom_id : -1;
        this.displayChat(this.chatroomId);
    }

    chatroomMessages = new Array<ChatMessageWithUser>();

    constructor(private userService: UserService, private wsService: WebsocketService) {
        this.currentUser = this.userService.currentUser;
    }

    ngOnInit(): void {
        // get incoming messages from the joined chatrooms of the user
        // since we are leaving / joining the current room, we will also only care about this specific rooms
        // messages, other messages are handled by the parent app-chat-page component
        // Note / TODO: it should be possible to only listen to the current chatrooms messages, right? no need to do this anymore
        //              e.g.: new wsService.getChatMessageFromRoom(chatroomId)
        //              then we can simply create a setter for the incoming chatroom id, and then only fetch from that chatroom
        this.wsService.getChatMessage().subscribe(msg => {
            if (msg.chatroom_id === this.chatroomId) {
                this.chatroomMessages.push(msg);
                this.scrollToLatestMessage();
            }
        });
    }

    /**
     * Displays the given chats messages.
     * 
     * @param chatroomIdToLoad chat to load messages from
     */
    displayChat(chatroomIdToLoad: number) {
        this.showEmotesMenu = false;
        if (chatroomIdToLoad !== -1) {
            // create new instance here, in case any errors might happen during chatroom navigation or whatnot
            this.chatroomMessages = new Array<ChatMessageWithUser>();
            this.fetchAndDisplayChatMessages(chatroomIdToLoad);
        }
    }

    /**
     * Fetches and displays the chat messages in the UI.
     */
    fetchAndDisplayChatMessages(chatroomIdToLoad: number) {
        this.userService.getChatroomMessages(chatroomIdToLoad, this.currentUser.userId).subscribe(chatroomData => {
            const { chat_messages, ..._ } = chatroomData;
            this.chatroomMessages = chat_messages;
            this.scrollToLatestMessage();
        });
    }

    /**
     * Sends a message to the backend for inserting, as well as sending the chat message over the
     * correct websocket room.
     */
    formGroup = new FormGroup({
        messageInput: new FormControl("", Validators.required)
    });
    sendMessage() {
        if (this.chatroomId !== -1) {
            this.userService.sendMessage(this.formGroup.value.messageInput, this.currentUser.userId, this.chatroomId)
                .subscribe(msg => {
                    this.formGroup.reset();
                    this.chatroomMessages.push(msg);

                    // emit msg via websocket
                    this.wsService.sendChatMessage(msg);

                    this.scrollToLatestMessage();
                });
        }
    }

    /* EMOTES */

    showEmotesMenu: boolean = false;
    onEmoteMenu() {
        // TODO: show a dropdown (opened towards the top) to show the available and selectable emotes
        if (this.showEmotesMenu) {
            this.showEmotesMenu = false;
        }
        else {
            this.showEmotesMenu = true;
        }
    }

    onEmoteSelect(emote: emote) {
        this.formGroup.setValue({
            messageInput: this.formGroup.value.messageInput + emote.emote
        });
        document.getElementById("messageInput")?.focus();
        // ^ or use @ViewChield("messageInput") (#HashTagOnElement)
        // and then this.element.nativeElement.focus()
    }

    /**
     * Helper method to populate some message specific metadata information, like when it was posted.
     * This can be further used to fully populate the whole message itself, if wanted (e.g. the "div" which contains the message).
     * 
     * For now, only metadata information will be injected.
     * 
     * @param message the message
     * @returns the HTML to inject into the calling component (e.g. "[innerHTML]='...'")
     */
    populateMessageHeader(message: ChatMessageWithUser) {
        const isMessageFromCurrentUser = message.user_id === this.currentUser.userId;
        const msgDate = new Date(message.posted_at); // ... just why is this needed? xD
        // .substr(11, 5) => HH:MM format
        // .substr(11, 8) => HH:MM:SS format
        return `
                ${!isMessageFromCurrentUser ? `<b class="text-xs text-gray-400">${message.users.display_name}</b>` : ""}
                <b title="Posted at: ${msgDate}" class="text-xs text-gray-400">${msgDate.toISOString().substr(11, 5)}</b>
                `
    }

    // https://urlregex.com/
    urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
    /**
     * Helper method to highlight URLs in a given message. Returns the new replaced message with, if available, highlighted URLs.
     * Note: console.logs here are always being shown on each mousclick and input in the message box... makes no sense.
     * 
     * @param msg message to highlight URLs in
     * @returns 
     */
    urlify(msg: string): string {
        return msg.replace(new RegExp(this.urlRegex), match => {
            return `<a href="${match}" target="_blank" rel="noreferrer noopener" class="text-blue-500">${match}</a>`
        });
    }

    /**
     * Helper function to scroll to the latest message available in the UI.
     * Is being used by initial load of the chat messages,
     * and when writing, sending and receiving chat messages.
     */
    scrollToLatestMessage() {
        setTimeout(function () {
            const lastMessageDiv = Array.from(document.getElementsByClassName("chat-message-div")).pop();
            lastMessageDiv?.scrollIntoView({ behavior: 'smooth' });
        }, 1);
    }

}
