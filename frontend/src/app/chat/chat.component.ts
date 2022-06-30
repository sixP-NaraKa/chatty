import { Component, Input, OnInit } from '@angular/core';
import { ChatMessageWithUser } from '../../../../shared/types/db-dtos';
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
    @Input() set setChatroomId(id: number) {
        this.chatroomId = id;
        this.displayChat(id);
    }
    
    chatroomMessages = new Array<ChatMessageWithUser>();

    constructor(private userService: UserService, private wsService: WebsocketService) {
        this.currentUser = this.userService.currentUser;
    }

    ngOnInit(): void {
        // get incoming messages from the joined chatrooms of the user
        // since we are leaving / joining the current room, we will also only care about this specific rooms
        // messages, other messages are handled by the parent app-chat-page component
        this.wsService.getChatMessage().subscribe(msg => {
            if (msg.chatroom_id === this.chatroomId) {
                console.log("message from websocket => ", msg);
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
        if (chatroomIdToLoad !== -1) {
            console.log("loading chatId", chatroomIdToLoad);
            // create new instance here, in case any errors might happen during chatroom navigation or whatnot
            this.chatroomMessages = new Array<ChatMessageWithUser>();
            this.fetchAndDisplayChatMessages();
        }
    }

    /**
     * Fetches and displays the chat messages in the UI.
     */
    fetchAndDisplayChatMessages() {
        this.userService.getChatroomMessages(this.chatroomId, this.currentUser.userId).subscribe(chatroomData => {
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

    /**
     * Helper function to scroll to the latest message available in the UI.
     * Is being used by initial load of the chat messages,
     * and when writing, sending and receiving chat messages.
     */
    scrollToLatestMessage() {
        setTimeout(function() {
            const lastMessageDiv = Array.from(document.getElementsByClassName("chat-message-div")).pop();
            lastMessageDiv?.scrollIntoView({ behavior: 'smooth' });
        }, 1);
    }
    
}
