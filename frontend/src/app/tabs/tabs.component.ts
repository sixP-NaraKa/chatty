import { AfterContentInit, Component, ContentChildren, EventEmitter, Input, Output, QueryList } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { TabComponent } from '../tab/tab.component';
import { chats } from '../../../../shared/types/db-dtos';


type Chat = {
  chat_id: number,
  chat_partner_id: number,
  chat_partner_name: string
}

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements AfterContentInit {

  @ContentChildren(TabComponent)
  tabs!: QueryList<TabComponent>;

  // @Output()
  // loadAvailableChats = new EventEmitter();

  @Output()
  loadChat = new EventEmitter();

  availableChats!: chats[];

  selectedChatId: number = -1;

  constructor(private http: HttpClient) { }
  
  async ngAfterContentInit() {
    // let activeTabs = this.tabs.filter((tab) => tab.active);
    // if (activeTabs.length === 0) {
    //   this.selectTab(this.tabs.first);
    // }

    this.http.get<chats[]>("http://localhost:3100/api/user/chats").subscribe(chats => {
      this.availableChats = chats;
      console.log("chats", this.availableChats);
      // this.loadAvailableChats.emit(this.availableChats);
    });
  }

  // TODO: if a chat has been clicked on, notfiy the parent component (done) and pass it the needed chat metadata (chat id, partner id, partner name) (done)
  //       the parent component should then notify the display chat component that it should display the messages of the given chat (not yet) => fetch messages from db (via prisma)
  // TODO: configure new db tables "user_messages" (verknüpfungstabelle) und "messages" und "user" correctly (foreign keys, etc. pp.)

  notifyLoadChat(chat: chats) {
    this.selectedChatId = chat.chat_id;
    this.loadChat.emit(chat);
  }

  // selectTab(tab: TabComponent) {
  //   this.tabs.toArray().forEach(tab => tab.active = false);
  //   tab.active = true;
  // }

}
