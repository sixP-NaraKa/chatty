import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { UserChats, ChatMessage, User } from '../../../../shared/types/db-dtos';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

  title = 'chatty';

  // TODO: take user from localstorage or something, maybe the login component/view will pass data to here
  // @Input()
  currentlyLoggedInUser: User & { password: string } = {
    display_name: "Test",
    password: "12345",
    creation_date: new Date(),
    user_id: 1,
  };

  constructor(private http: HttpClient) { }

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
    const msgs = this.http.post<ChatMessage[]>("http://localhost:3100/api/chat/messages?chat_id=" + chat.chat_id, { username: this.currentlyLoggedInUser.display_name, password: this.currentlyLoggedInUser.password }).subscribe(msgs => {
      console.log("msgs in frontend...", msgs);
      this.chatMessages = msgs;
      this.chatMessages.forEach(message => console.log(message))
    });

    // this.http.post("http://localhost:3100/auth/login", { username: chat.users_chats_with_userTousers.display_name, password: null }).subscribe(resp => console.log(resp));
  }

}
