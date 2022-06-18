import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { chats, messages } from '../../../shared/types/db-dtos';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'chatty';

  chat!: chats;
  displayChat(chat: chats) {
    this.chat = chat;
    this.displayChatMessages(chat);
  }

  http!: HttpClient;
  chatMessages!: {messages: messages}[];
  displayChatMessages(chat: chats) {
    // make API call to backend to fetch the chats messages, then display these messages in the chat window
    const msgs = this.http.get<{messages: messages}[]>("http://localhost:3100/api/chat/messages?chat_id" + chat.chat_id).subscribe(msgs => {
      console.log("msgs in frontend...", msgs);
      this.chatMessages = msgs;
      this.chatMessages.forEach(data => console.log(data.messages.content))
    });
  }

}
