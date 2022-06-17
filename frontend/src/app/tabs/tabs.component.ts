import { AfterContentInit, Component, ContentChildren, EventEmitter, Input, Output, QueryList } from '@angular/core';
import { TabComponent } from '../tab/tab.component';
import { chatty, PrismaClient, PrismaPromise } from "@prisma/client";

// const prisma = new PrismaClient();

type Chat = {
  chatId: number,
  chatPartnerId: number,
  chatPartnerName: string
}

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements AfterContentInit {

  @ContentChildren(TabComponent)
  tabs!: QueryList<TabComponent>;

  @Output()
  loadChat = new EventEmitter();

  // availableChats!: Promise<{ chat_id: number; }[]>;
  // availableChats!: PrismaPromise<chatty[]>;
  availableChats!: PrismaPromise<chatty[]>;

  constructor() {
      // load chats (tabs to click on) from the db
      // this.availableChats = prisma.chatty.findMany({
      //   // select: {
      //   //   chat_id: true
      //   // },
      //   where: {
      //     chat_id: 1
      //   }
      // });
      // console.dir(this.availableChats, { depth: null });
  }


  async ngAfterContentInit() {
    let activeTabs = this.tabs.filter((tab) => tab.active);
    if (activeTabs.length === 0) {
      this.selectTab(this.tabs.first);
    }
  }

  selectTab(tab: TabComponent) {
    this.tabs.toArray().forEach(tab => tab.active = false);
    tab.active = true;
    this.loadChat.emit(tab.metaData);
  }

}
