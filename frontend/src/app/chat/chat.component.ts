import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserChats, ChatMessage } from '../../../../shared/types/db-dtos';
import { ApplicationUser } from '../auth/auth.service';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

    title = 'chatty';
    currentUser: ApplicationUser;

    constructor(private http: HttpClient, private userService: UserService) {
        this.currentUser = this.userService.currentUser;
    }

    ngOnInit(): void {
    }

    chat!: UserChats;
    displayChat(chat: UserChats) {
        this.chat = chat;
        this.displayChatMessages(chat);
    }

    chatMessages!: ChatMessage[];
    displayChatMessages(chat: UserChats) {
        // make API call to backend to fetch the chats messages, then display these messages in the chat window
        this.http.get<ChatMessage[]>("http://localhost:3100/api/chat/messages?chat_id=" + chat.chat_id).subscribe(msgs => {
            console.log("msgs in frontend...", msgs);
            this.chatMessages = msgs;
            this.chatMessages.forEach(message => console.log(message));
        });
    }

    logout() {
        this.userService.logout();
    }

}
