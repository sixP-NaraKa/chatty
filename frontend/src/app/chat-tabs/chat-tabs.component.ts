import { AfterContentInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { ChatRoomWithParticipantsExceptSelf, User } from '../../../../shared/types/db-dtos';
import { ApplicationUser } from '../auth/auth.service';
import { NotificationService } from '../services/notification.service';
import { UserService } from '../services/user.services';
import { WebsocketService } from '../services/websocket.service';

@Component({
    selector: 'app-chat-tabs',
    templateUrl: './chat-tabs.component.html',
    styleUrls: ['./chat-tabs.component.scss'],
})
export class ChatTabsComponent implements AfterContentInit {
    @Output()
    loadChat = new EventEmitter<ChatRoomWithParticipantsExceptSelf>();

    @Input()
    filterOutEmpty1on1Chats: boolean = true;

    showGroupChatCreateWindow: boolean = false;

    chatrooms = new Array<ChatRoomWithParticipantsExceptSelf>();

    selectedChatId: number = -1;

    currentUser: ApplicationUser;

    newUnreadMessagesChatroomIds = new Array<number>();

    // audio element to play sounds indicating a new unread message came in
    audioElementUnreadMessage = new Audio('../../assets/VULULU.m4a');

    constructor(
        private userService: UserService,
        private wsService: WebsocketService,
        private notificationService: NotificationService
    ) {
        this.audioElementUnreadMessage.volume = 0.1; // 10%
        this.currentUser = this.userService.currentUser;
    }

    ngAfterContentInit() {
        this.userService.getChatroomsForUserWithParticipantsExceptSelf().subscribe((chats) => {
            // create temporary array to not trigger angulars *ngFor directive during processing
            let tempArray = new Array<ChatRoomWithParticipantsExceptSelf>();

            // join all websocket chat rooms first
            chats.forEach((chat) => {
                this.wsService.joinChatroom(chat.chatroom_id);
            });

            // as a workaround to not being able to wait for the Observables/Promises correctly,
            // we will simply sort the tempArray after each iteration, so that it always stays in the correct order
            chats.forEach((chat, index) => {
                // if the chat is a group, we add it always
                if (chat.chatrooms.isgroup) {
                    tempArray.splice(index, 0, chat);
                    tempArray.sort((a, b) => a.chatrooms.chatroom_id - b.chatrooms.chatroom_id);
                    return;
                }

                this.userService.getChatroomMessagesCount(chat.chatroom_id).subscribe((amount) => {
                    if (amount >= 1) {
                        tempArray.splice(index, 0, chat);
                    } else if (chat.chatrooms.created_by === this.currentUser.userId) {
                        if (this.filterOutEmpty1on1Chats) {
                            return;
                        }
                        tempArray.splice(index, 0, chat);
                    }
                    tempArray.sort((a, b) => a.chatrooms.chatroom_id - b.chatrooms.chatroom_id);
                });
            });
            this.chatrooms = tempArray;
        });
        this.listenForNewChatroomsAndJoinThem();
        this.listenForNewMessagesFromNotOpenChatrooms();
        this.listenForRemoveChatroomAndRemoveChatFromList();
        this.listenForNewMessageReactionsFromNotOpenChatrooms();
        this.listenForAvailabilityStatusChanges();
    }

    /**
     * Notifies the event subscribers and emits the chat, if it is not the current opened one.
     *
     * @param chat the chat to emit
     */
    notifyLoadChat(chat: ChatRoomWithParticipantsExceptSelf) {
        if (this.selectedChatId === chat.chatroom_id) {
            // no need to load the chat again
            return;
        }
        this.selectedChatId = chat.chatroom_id;
        // remove the "unread messages" flag from the new chat, if it is present
        let idxOf = this.newUnreadMessagesChatroomIds.indexOf(this.selectedChatId);
        if (idxOf !== -1) {
            this.newUnreadMessagesChatroomIds.splice(idxOf, 1);
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
        this.userService.getSingleChatroomForUserWithUserIdAndParticipantUserId(user.user_id).subscribe((room) => {
            if (!room) {
                // make API call to create a new chatroom with the two participants
                this.userService.createChatroom(user.user_id, false).subscribe((room) => {
                    this.chatrooms.push(room);
                    this.notifyLoadChat(room);
                    this.wsService.createChatroom(room, [user.user_id]);
                });
            } else {
                // load the existing chatroom
                // see if the chat needs to be added to the opened chat-tabs
                if (!this.chatrooms.some((c) => c.chatroom_id === room.chatroom_id)) {
                    this.chatrooms.push(room);
                }
                this.notifyLoadChat(room);
            }
        });
    }

    /**
     * Listen for new chatrooms the user is a part of and join their respective websocket rooms.
     */
    listenForNewChatroomsAndJoinThem() {
        // listen for new chatrooms which have been created and the user is a part of.
        // join these chatrooms first, but do not show them in the UI unless there have been messages.
        // listen in a second part (done in the app-chat-tabs component for the moment) to the websocket event "get:message"
        // and if this chat is not yet part of our locally stored list, show them in the UI.
        // Note for 1on1 chats: we do not need to fetch here the chat from the db or add it to the list,
        // since we will get the latest info anyway upon receiving chat messages and then opening the chat
        this.wsService.getNewChatroom().subscribe((chatroom) => {
            this.wsService.joinChatroom(chatroom.chatroom_id);

            if (chatroom.chatrooms.isgroup) {
                this.userService
                    .getSingleChatroomForUserWithParticipantsExceptSelf(chatroom.chatroom_id)
                    .subscribe((cr) => this.chatrooms.push(cr));
            }
        });
    }

    /**
     * Listens for chatrooms (groups) to leave, if the user has been kicked by the creator.
     * As of now, if the group chat from which the user was removed is currently open, they will still leave the chatroom
     * and the websocket room (this happens in the backend directly), but in the UI the room is still there,
     * but not otherwise interactable (e.g. sending/receicing messages will not work).
     */
    listenForRemoveChatroomAndRemoveChatFromList() {
        this.wsService.listenForRemoveChatroom().subscribe((chatroomId) => {
            const filteredChatrooms = this.chatrooms.filter((chat) => chat.chatroom_id === chatroomId);
            if (filteredChatrooms.length !== 0) {
                const idxOf = this.chatrooms.indexOf(filteredChatrooms[0]);
                this.chatrooms.splice(idxOf, 1);
            }
        });
    }

    /**
     * Listen for new messages from not yet added/visible chatrooms the user might be a part of.
     */
    listenForNewMessagesFromNotOpenChatrooms() {
        this.wsService.getChatMessage().subscribe((msg) => {
            const chatroomAlreadyShown = this.chatrooms.some((chatroom) => chatroom.chatroom_id === msg.chatroom_id);
            if (!chatroomAlreadyShown) {
                // fetch the chatroom from the API and add it to the list
                this.userService
                    .getSingleChatroomForUserWithParticipantsExceptSelf(msg.chatroom_id)
                    .subscribe((chatroom) => {
                        this.chatrooms.push(chatroom);
                    });
            }
            this.addNewUnreadNotificationAndNotifyUser(msg.chatroom_id, msg.users.user_id, {
                type: 'message',
                data: msg.msg_content,
            });
        });
    }

    /**
     * Listen to new reactions from other chatrooms.
     */
    listenForNewMessageReactionsFromNotOpenChatrooms() {
        this.wsService.getNewEmoteReaction().subscribe(([chatroomId, messageId, userId, reaction]) => {
            this.addNewUnreadNotificationAndNotifyUser(chatroomId, userId, {
                type: 'reaction',
                data: reaction.emote.emote,
            });
        });
    }

    /**
     * (Extracted) Helper function to add a new unread notification/event and to notify the user via an audio clip.
     *
     * @param chatroomIdFromNotification chatroom ID from the new unread notification/event
     */
    addNewUnreadNotificationAndNotifyUser(
        chatroomIdFromNotification: number,
        originatedFromUserId: number,
        content: { type: 'message' | 'reaction' | 'call'; data: string }
    ) {
        // reload will empty this again, but for now it is fine
        if (this.selectedChatId !== chatroomIdFromNotification) {
            if (!this.newUnreadMessagesChatroomIds.includes(chatroomIdFromNotification)) {
                this.newUnreadMessagesChatroomIds.push(chatroomIdFromNotification);
            }
            // emit new notification event
            // this will save it into the db and show it in the UI
            this.emitNewUnreadNotification(chatroomIdFromNotification, originatedFromUserId, content);

            // play sound indicating a new message or reaction
            // Note - not needed anymore: reset time to 0, as sometimes the audio does not get played additional times otherwise
            //                            also, this makes the audio play from the beginning
            //                            if a new message during the duration of the audio came in, which is quite ok
            this.audioElementUnreadMessage.currentTime = 0;
            // Note - Firefox: audio cannot get played due to Firefox blocking it, but only if no chat has been loaded before...
            //                 after any chat has been loaded (e.g. clicked on), the audio works fine...
            this.audioElementUnreadMessage.play();
        }
    }

    /**
     * Helper function which sends the next unread notification event to the subscribed components.
     *
     * @param chatroomId the chatroom ID in which the notification event happened
     * @param userId the user Id which started the notification event
     * @param content the content of the event, consists of a type and the data
     */
    emitNewUnreadNotification(
        chatroomId: number,
        userId: number,
        content: { type: 'message' | 'reaction' | 'call'; data: string }
    ) {
        // add unread message to notificaion summary list (e.g. notify component)
        this.notificationService.newUnread({
            notification_id: -1, // noop
            user_id: this.currentUser.userId,
            originated_from: userId,
            chatroom_id: chatroomId,
            type: content.type,
            content: content.data,
            date: new Date(Date.now()),
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

    availabilityStatusUsers = new Array<number>();
    /**
     * Listens for user availability changes and saves them locally.
     */
    listenForAvailabilityStatusChanges() {
        // get after each connect/disconnect by users the up-to-date availability statuses
        this.wsService.getChangedAvailabilities().subscribe((ids) => {
            this.availabilityStatusUsers = ids;
        });
    }
}
