import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router';
import { UserChats, ChatMessage, User } from '../../../../shared/types/db-dtos';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

  title = 'chatty';

  // TODO: take user from localstorage or something, maybe the login component/view will pass data to here
  // Note: user JWT token is stored in localStorage, maybe also add some more data there, like username and id to fetch specific information, etc.
  // (or simply pass this data to the chat component, after successful login)
    // for example during the validation of the provided key during login, we can also do a db fetch and get the user that way, seems easier
  // @Input()
  currentlyLoggedInUser: User & { password: string } = {
    display_name: "Test",
    password: "12345",
    creation_date: new Date(),
    user_id: 1,
  };

  constructor(private http: HttpClient) {
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

}
