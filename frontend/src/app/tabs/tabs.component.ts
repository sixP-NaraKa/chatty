import { AfterContentInit, Component, ContentChildren, EventEmitter, Input, Output, QueryList } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { TabComponent } from '../tab/tab.component';
import { UserChats } from '../../../../shared/types/db-dtos';
import { ApplicationUser, AuthService } from '../auth/auth.service';


@Component({
    selector: 'app-tabs',
    templateUrl: './tabs.component.html',
    styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements AfterContentInit {

    @ContentChildren(TabComponent)
    tabs!: QueryList<TabComponent>;

    @Output()
    loadChat = new EventEmitter<UserChats>();

    availableChats!: UserChats[];

    selectedChatId: number = -1;

    currentUser: ApplicationUser;

    constructor(private http: HttpClient, private authService: AuthService) {
        this.currentUser = this.authService.currentUserValue;
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