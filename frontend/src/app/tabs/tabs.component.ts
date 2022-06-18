import { AfterContentInit, Component, ContentChildren, EventEmitter, Input, Output, QueryList } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { TabComponent } from '../tab/tab.component';
import { UserChats } from '../../../../shared/types/db-dtos';


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

  constructor(private http: HttpClient) { }
  
  async ngAfterContentInit() {
    this.http.get<UserChats[]>("http://localhost:3100/api/user/chats?user_id=" + 1).subscribe(chats => {
      this.availableChats = chats;
      console.log("chats", this.availableChats);
      // this.loadAvailableChats.emit(this.availableChats);
    });
  }

  // TODO: if a chat has been clicked on, notfiy the parent component (done) and pass it the needed chat metadata (chat id, partner id, partner name) (done)
  //       the parent component should then notify the display chat component that it should display the messages of the given chat => fetch messages from db (via prisma) (done)

  notifyLoadChat(chat: UserChats) {
    if (this.selectedChatId === chat.chat_id) { // no need to load the chat again
      return;
    }
    this.selectedChatId = chat.chat_id;
    console.log("emitting...", chat);
    this.loadChat.emit(chat);
  }

}
