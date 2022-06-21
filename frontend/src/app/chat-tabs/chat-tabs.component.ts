import { AfterContentInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { UserChats } from '../../../../shared/types/db-dtos';
import { ApplicationUser } from '../auth/auth.service';
import { UserService } from '../services/user.services';


@Component({
    selector: 'app-chat-tabs',
    templateUrl: './chat-tabs.component.html',
    styleUrls: ['./chat-tabs.component.scss']
})
export class ChatTabsComponent implements AfterContentInit {

    @Output()
    loadChat = new EventEmitter<UserChats>();

    availableChats!: UserChats[];

    selectedChatId: number = -1;

    currentUser: ApplicationUser;

    constructor(private http: HttpClient, private userService: UserService) {
        this.currentUser = this.userService.currentUser;
        console.log("currentUser", this.currentUser);
    }

    async ngAfterContentInit() {
        this.http.get<UserChats[]>("http://localhost:3100/api/user/chats?user_id=" + this.currentUser.userId).subscribe(chats => {
            this.availableChats = chats;
            console.log("chats", this.availableChats);
        });
    }

    notifyLoadChat(chat: UserChats) {
        if (this.selectedChatId === chat.chat_id) { // no need to load the chat again
            return;
        }
        this.selectedChatId = chat.chat_id;
        this.loadChat.emit(chat);
    }

}
