import { Component, Input, OnInit } from '@angular/core';


type Chat = {
  chatId: number,
  chatPartnerId: number,
  chatPartnerName: string
}

@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss']
})
export class TabComponent implements OnInit {

  @Input("tabTitle")
  tabTitle: string = "";
  @Input()
  active: boolean = false;
  @Input("tabId")
  tabId: string = "";

  @Input()
  metaData!: Chat;

  constructor() { }

  ngOnInit(): void {
  }

}
