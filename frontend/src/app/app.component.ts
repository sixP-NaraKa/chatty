import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { UserChats, ChatMessage, User } from '../../../shared/types/db-dtos';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'chatty';
}
