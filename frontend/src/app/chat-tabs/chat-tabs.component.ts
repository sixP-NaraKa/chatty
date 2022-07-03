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

    // will be a user defineable setting
    // if the user turns this off, empty chats which were created by the user will be shown
    // if it is turned on, no empty 1on1 chats will be shown whatsoever
    @Input()
    filterOutEmpty1on1Chats: boolean = true; // true per default

    @Input()
    incomingNewChatroom!: ChatRoomWithParticipantsExceptSelf;

    showGroupChatCreateWindow: boolean = false;

    chatrooms = new Array<ChatRoomWithParticipantsExceptSelf>();

    selectedChatId: number = -1;

    currentUser: ApplicationUser;

    newUnreadMessagesChatroomIds = new Array<number>();

    constructor(private userService: UserService, private wsService: WebsocketService) {
        this.currentUser = this.userService.currentUser;
        console.log("constructor currentUser", this.currentUser);
    }

    ngAfterContentInit() {
        this.userService.getChatroomsForUserWithParticipantsExceptSelf(this.currentUser.userId).subscribe(chats => {
            console.log("initial chats", chats);
            // join all websocket chat rooms first
            chats.forEach(chat => {
                this.wsService.joinChatroom(chat.chatroom_id);
            });

            // group chats will always be added
            const groupChats = chats.filter(chat => chat.chatrooms.isgroup);
            // create temporary array to not trigger angulars *ngFor directive during processing
            let tempArray = new Array<ChatRoomWithParticipantsExceptSelf>();

            // only go over 1on1 chats here
            chats.filter(chat => !chat.chatrooms.isgroup).forEach((chat, index) => {
                this.userService.getChatroomMessagesCount(chat.chatroom_id, this.currentUser.userId).subscribe(amount => {
                    if (amount >= 1) {
                        tempArray.splice(index, 0, chat);
                    }
                    else if (chat.chatrooms.created_by === this.currentUser.userId) {
                        console.log("empty chat created by me", chat);
                        if (this.filterOutEmpty1on1Chats) {
                            console.log("filtering the chat, because user settings");
                            return;
                        }
                        console.log("not filtering the chat");
                        tempArray.splice(index, 0, chat);
                    }
                });
            });
            tempArray = tempArray.concat(groupChats);
            tempArray.sort((a, b) => a.chatrooms.chatroom_id - b.chatrooms.chatroom_id);
            this.chatrooms = tempArray;
            // remove elements from the tempArray, as this is not needed anymore
            // tempArray.length = 0; => this somehow causes issues for adding group chats / pushing things manually >
            // because this part of the code is being executed before the .subscribe() is done,
            // and that is why the tempArray gets nuked and previous data is not there
            console.log("chatrooms =>", this.chatrooms);
        });
        this.listenForNewChatroomsAndJoinThem();
        this.listenForMessagesFromNotYetAddedChatrooms();
    }

    /**
     * Notifies the event subscribers and emits the chat, if it is not the current opened one.
     * 
     * @param chat the chat to emit
     */
    notifyLoadChat(chat: ChatRoomWithParticipantsExceptSelf) {
        if (this.selectedChatId === chat.chatroom_id) { // no need to load the chat again
            return;
        }
        this.selectedChatId = chat.chatroom_id;
        // remove the "unread messages" flag from the new chat, if it is present
        let idxOf = this.newUnreadMessagesChatroomIds.indexOf(this.selectedChatId);
        if (idxOf !== -1) {
            this.newUnreadMessagesChatroomIds.splice(idxOf, 1);
            console.log("new unread messages chatrooms", this.newUnreadMessagesChatroomIds, "idx", idxOf);
        }
        this.loadChat.emit(chat);
    }

    /**
     * Catches the "userSelectionEvent" event from the user-search component,
     * and is responsible for creating the chatroom if it does not yet exist.
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
                    this.userService.createChatroom(this.currentUser.userId, user.user_id, false).subscribe(room => {
                        this.chatrooms.push(room);
                        this.notifyLoadChat(room);
                        this.wsService.createChatroom(room, [user.user_id]);
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

    listenForNewChatroomsAndJoinThem() {
        // listen for new chatrooms which have been created and the user is a part of.
        // join these chatrooms first, but do not show them in the UI unless there have been messages.
        // listen in a second part (done in the app-chat-tabs component for the moment) to the websocket event "get:message"
        // and if this chat is not yet part of our locally stored list, show them in the UI.
        this.wsService.getNewChatroom().subscribe(([chatroom, participantUserIds]) => {
            if (participantUserIds.includes(this.userService.currentUser.userId)) {
                this.wsService.joinChatroom(chatroom.chatroom_id);
                // if the chatroom from the websocket is a group chat, add it to our list of chats
                if (chatroom.chatrooms.isgroup) {
                    this.chatrooms.push(chatroom);
                }
            }
        });
    }

    listenForMessagesFromNotYetAddedChatrooms() {
        this.wsService.getChatMessage().subscribe(msg => {
            const chatroomAlreadyShown = this.chatrooms.some(chatroom => chatroom.chatroom_id === msg.chatroom_id);
            if (!chatroomAlreadyShown) {
                // fetch the chatroom from the API and add it to the list
                this.userService.getSingleChatroomForUserWithParticipantsExceptSelf(this.userService.currentUser.userId, msg.chatroom_id)
                    .subscribe(chatroom => {
                        this.chatrooms.push(chatroom);
                    });
            }
            // reload will empty this again, but for now it is fine
            console.log("unread message chat ids", this.newUnreadMessagesChatroomIds, "this.selectedChatId", this.selectedChatId);
            if (this.selectedChatId !== msg.chatroom_id && !this.newUnreadMessagesChatroomIds.includes(msg.chatroom_id)) {
                this.newUnreadMessagesChatroomIds.push(msg.chatroom_id);
            }
        });
    }

    /**
     * Notifies the group-chat-window component to show the window.
     */
    onCreateGroupChatButtonClick() {
        this.showGroupChatCreateWindow = true;
    }

    /**
     * Catches the event emitted from the group-chat-window component,
     * when the group chat window has been closed.
     */
    onCreateGroupChatClosed() {
        this.showGroupChatCreateWindow = false;
    }

    /**
     * Catches the event emitted from the group-chat component,
     * when a group chat has been created. Adds the group-chat to the list of chats for the user.
     * 
     * @param chatroom group chatroom to add to the chats list
     */
    onCreateGroupChatEvent(chatroom: ChatRoomWithParticipantsExceptSelf) {
        this.chatrooms.push(chatroom);
    }

}
