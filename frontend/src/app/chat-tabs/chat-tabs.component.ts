import { AfterContentInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { ChatRoomWithParticipantsExceptSelf, User } from '../../../../shared/types/db-dtos';
import { ApplicationUser } from '../auth/auth.service';
import { UserService } from '../services/user.services';
import { WebsocketService } from '../services/websocket.service';


@Component({
    selector: 'app-chat-tabs',
    templateUrl: './chat-tabs.component.html',
    styleUrls: ['./chat-tabs.component.scss']
})
export class ChatTabsComponent implements AfterContentInit {

    @Output()
    loadChat = new EventEmitter<ChatRoomWithParticipantsExceptSelf>();

    @Input()
    filterOutEmpty1on1Chats: boolean = true;

    @Input()
    incomingNewChatroom!: ChatRoomWithParticipantsExceptSelf;

    chatrooms = new Array<ChatRoomWithParticipantsExceptSelf>();

    selectedChatId: number = -1;

    currentUser: ApplicationUser;

    constructor(private userService: UserService, private wsService: WebsocketService) {
        this.currentUser = this.userService.currentUser;
    }

    ngAfterContentInit() {
        this.userService.getChatroomsForUserWithParticipantsExceptSelf(this.currentUser.userId).subscribe(chats => {
            // join all websocket chat rooms first
            chats.forEach(chat => {
                this.wsService.joinChatroom(chat.chatroom_id);
            })

            if (this.filterOutEmpty1on1Chats) { // will be a user defineable setting
                // group chats will always be added
                const groupChats = chats.filter(chats => chats.chatrooms.isgroup);
                chats.forEach(chat => { // TODO: I think because of this loop here, sometimes the order in the UI is moving around a little on page reload => seems to happen if chat messages are sent (but sometimes not...)
                    // fetch the amount of messages
                    this.userService.getChatroomMessagesCount(chat.chatroom_id, this.currentUser.userId).subscribe(amount => {
                        if (amount >= 1 && !chat.chatrooms.isgroup) this.chatrooms.push(chat);
                    });
                })
                this.chatrooms = this.chatrooms.concat(groupChats);
            }
            else {
                this.chatrooms = chats;
            }
            console.log("chatrooms =>", this.chatrooms);
        });
        this.listenForMessagesFromNotYetAddedChatrooms();
    }

    /**
     * Notifies the event subscribers and emits the chat.
     * 
     * @param chat the chat to emit
     */
    notifyLoadChat(chat: ChatRoomWithParticipantsExceptSelf) {
        if (this.selectedChatId === chat.chatroom_id) { // no need to load the chat again
            return;
        }
        this.selectedChatId = chat.chatroom_id;
        this.loadChat.emit(chat);
    }

    /**
     * Catches the "userSelectionEvent" event and is responsible for creating the chatroom if it does not yet exist.
     * 
     * @param user the user which has been selected to start a chat with
     */
    userSelection(user: User) {
        console.log("user emitted from user-search", user);
        this.userService.getSingleChatroomForUserWithUserIdAndParticipantUserId(this.currentUser.userId, user.user_id)
            .subscribe(room => {
                if (!room) {
                    // make API call to create a new chatroom with the two participants
                    console.log("creating new chatroom (frontend)");
                    this.userService.create1on1Chatroom(this.currentUser.userId, user.user_id).subscribe(room => {
                        this.chatrooms.push(room);
                        this.notifyLoadChat(room);
                        // purposefully not sending a notification via websockets (anymore),
                        // as then the user will only see the chat if there are messages in it
                        // Note: we will actually emit the new created chatroom, as this is now needed
                        //       this websocket event will be listened to by the app-chat-page component,
                        //       which in turn will notify this component here of the chat to add,
                        //       once new messages of these types of chatrooms come in
                        this.wsService.createChatroom(room, user.user_id);
                    });
                }
                else {
                    // load the existing chatroom
                    console.log("loading existing chatroom");
                    // see if the chat needs to be added to the opened chat-tabs
                    if (!this.chatrooms.some(c => c.chatroom_id === room.chatroom_id)) {
                        this.chatrooms.push(room);
                    }
                    this.notifyLoadChat(room);
                }
            });
    }

    listenForMessagesFromNotYetAddedChatrooms() {
        this.wsService.getChatMessage().subscribe(msg => {
            const chatroomAlreadyShown = this.chatrooms.some(chatroom => chatroom.chatroom_id === msg.chatroom_id);
            if (!chatroomAlreadyShown) {
                // fetch the chatroom from the API and add it to the list
                this.userService.getSingleChatroomForUserWithParticipantsExceptSelf(this.currentUser.userId, msg.chatroom_id)
                    .subscribe(chatroom => {
                        this.chatrooms.push(chatroom);
                });
            }
        });
    }

}
