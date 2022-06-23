import { Component, OnInit } from '@angular/core';
import { ChatRoomWithParticipantsExceptSelf } from '../../../../shared/types/db-dtos';
import { ApplicationUser } from '../auth/auth.service';
import { UserService } from '../services/user.services';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ChatData } from './chat.dto';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

    currentUser: ApplicationUser;
    chatDataDTO: ChatData = new ChatData();

    constructor(private userService: UserService) {
        this.currentUser = this.userService.currentUser;
    }

    ngOnInit(): void {
    }

    displayChat(chat: ChatRoomWithParticipantsExceptSelf) {
        // create new instance here, in case any errors might happen during chatroom navigation or whatnot
        this.chatDataDTO = new ChatData();
        this.chatDataDTO.chat = chat;
        this.displayChatMessages();
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
                
                this.scrollToLatestMessage();
            });
    }

    scrollToLatestMessage() {
        setTimeout(function() {
            const lastMessageDiv = Array.from(document.getElementsByClassName("chat-message-div")).pop();
            lastMessageDiv?.scrollIntoView({ behavior: 'smooth' });
        }, 1);
    }

}
