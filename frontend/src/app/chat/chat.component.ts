import { Component, OnInit } from '@angular/core';
import { ChatRoomWithParticipantsExceptSelf } from '../../../../shared/types/db-dtos';
import { ApplicationUser } from '../auth/auth.service';
import { UserService } from '../services/user.services';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ChatData } from './chat.dto';
import { WebsocketService } from '../services/websocket.service';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

    currentUser: ApplicationUser;
    chatDataDTO: ChatData = new ChatData();

    constructor(private userService: UserService, private wsService: WebsocketService) {
        this.currentUser = this.userService.currentUser;
    }

    ngOnInit(): void {
        // for now here, but this will be put then only as soon as we actually entered a chat (e.g. into the displayChat() method)
        this.wsService.getChatMessage().subscribe(msg => {
            console.log("message from websocket => ", msg);
            this.chatDataDTO.chatroomMessages.push(msg);
            this.scrollToLatestMessage();
        })
    }

    displayChat(chat: ChatRoomWithParticipantsExceptSelf) {
        // leave an existing chatroom first (only for now)
        this.leaveChatroom();

        // create new instance here, in case any errors might happen during chatroom navigation or whatnot
        this.chatDataDTO = new ChatData();
        this.chatDataDTO.chat = chat;
        this.displayChatMessages();

        // join websocket room
        this.wsService.joinChatroom(this.chatDataDTO.chat.chatroom_id);
    }

    displayChatMessages() {
        // or "this.chatDataDTO.chat.user_id"
        this.userService.getChatroomMessages(this.chatDataDTO.chat.chatroom_id, this.currentUser.userId).subscribe(chatroomData => {
            this.chatDataDTO.chatroomData = chatroomData;

            const { participants, chat_messages, ...chatroom } = this.chatDataDTO.chatroomData;
            this.chatDataDTO.participantsList = participants;
            this.chatDataDTO.chatroomMessages = chat_messages;
            this.chatDataDTO.chatroomOnly = chatroom;

            this.scrollToLatestMessage();
        });
    }

    logout() {
        this.leaveChatroom();
        document.onclick = null; // otherwise "window" if used
        this.userService.logout();
    }

    formGroup = new FormGroup({
        messageInput: new FormControl("", Validators.required)
    });
    sendMessage() {
        this.userService.sendMessage(
            this.formGroup.value.messageInput,
            this.currentUser.userId,
            this.chatDataDTO.chatroomOnly.chatroom_id).subscribe(msg => {
                this.formGroup.reset();
                this.chatDataDTO.chatroomMessages.push(msg);

                // emit msg via websocket
                this.wsService.sendChatMessage(msg);
                
                this.scrollToLatestMessage();
            });
    }

    scrollToLatestMessage() {
        setTimeout(function() {
            const lastMessageDiv = Array.from(document.getElementsByClassName("chat-message-div")).pop();
            lastMessageDiv?.scrollIntoView({ behavior: 'smooth' });
        }, 1);
    }

    leaveChatroom() {
        if (this.chatDataDTO && this.chatDataDTO.chat) {
            this.wsService.leaveChatroom(this.chatDataDTO.chat.chatroom_id);
        }
    }
    
}
