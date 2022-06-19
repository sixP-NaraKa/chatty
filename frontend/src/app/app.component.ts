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

  // TODO: global user authenticated against the backend db
  currentUserId: number = 1;
  // TODO: take user from localstorage or something, maybe the login component/view will pass data to here
  // @Input()
  currentlyLoggedInUser!: User;

  constructor(private http: HttpClient) {
    // this.http.get<users[]>("http://localhost:3100/api/user/users").subscribe(users => console.log(users));
  }

  chat!: UserChats;
  displayChat(chat: UserChats) {
    this.chat = chat;
    this.displayChatMessages(chat);
  }

  chatMessages!: ChatMessage[];
  displayChatMessages(chat: UserChats) {
    // make API call to backend to fetch the chats messages, then display these messages in the chat window
    const msgs = this.http.get<ChatMessage[]>("http://localhost:3100/api/chat/messages?chat_id=" + chat.chat_id).subscribe(msgs => {
      console.log("msgs in frontend...", msgs);
      this.chatMessages = msgs;
      this.chatMessages.forEach(message => console.log(message))
    });

    this.http.post("http://localhost:3100/auth/login", { username: chat.users_chats_with_userTousers.display_name, password: null }).subscribe(resp => console.log(resp));
  }

}
