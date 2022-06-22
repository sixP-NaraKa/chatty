import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { chatrooms, ChatroomWithMessages, ChatRoomWithParticipantsExceptSelf, chat_messages, participants, User } from '../../../../shared/types/db-dtos';
import { ApplicationUser } from '../auth/auth.service';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

    currentUser: ApplicationUser;

    constructor(private userService: UserService) {
        this.currentUser = this.userService.currentUser;
    }

    ngOnInit(): void {
    }

    chat!: ChatRoomWithParticipantsExceptSelf;
    displayChat(chat: ChatRoomWithParticipantsExceptSelf) {
        this.chat = chat;
        this.displayChatMessages(chat);
    }

    chatroomData!: ChatroomWithMessages;
    chatroomOnly!: chatrooms;
    participantsList!: participants[];
    chatroomMessages!: (chat_messages & { users: User })[];
    displayChatMessages(chat: ChatRoomWithParticipantsExceptSelf) {
        this.userService.getChatroomMessages(chat.chatroom_id).subscribe(chatroomData => {
            this.chatroomData = chatroomData;
            console.dir("chatroom messages => ", chatroomData);

            const {participants, chat_messages, ...chatroom} = this.chatroomData;
            this.participantsList = participants;
            this.chatroomMessages = chat_messages;
            this.chatroomOnly = chatroom;
        })
    }

    logout() {
        this.userService.logout();
    }

}
