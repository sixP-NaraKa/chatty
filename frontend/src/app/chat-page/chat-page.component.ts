import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatRoomWithParticipantsExceptSelf, Settings, User } from '../../../../shared/types/db-dtos';
import { ApplicationUser } from '../auth/auth.service';
import { UserSettingsService } from '../services/user-settings.service';
import { UserService } from '../services/user.services';
import { WebsocketService } from '../services/websocket.service';

@Component({
    selector: 'app-chat-page',
    templateUrl: './chat-page.component.html',
    styleUrls: ['./chat-page.component.scss'],
})
export class ChatPageComponent implements OnInit, OnDestroy {
    /**
     * Chatroom ID will be used to notify the app-chat component which chat to load.
     * @deprecated
     */
    chatroomIdToLoad: number = -1;
    /**
     * Chatroom will be used to notfiy the app-chat component which chat to load.
     * Only the ID is of importance here, as the chat contens (e.g. messages) will be fetched in the component.
     */
    chatroom!: ChatRoomWithParticipantsExceptSelf;

    // locally stored user settings with default values
    userSettings!: Settings | null;

    // current user
    currentUser: ApplicationUser;

    currentUserSettingsSubscription: Subscription;

    constructor(
        private userService: UserService,
        private wsService: WebsocketService,
        private settingsService: UserSettingsService
    ) {
        this.currentUser = this.userService.currentUser;

        // (re)connect the websocket on page reload
        // why here? because if this app-chat-page component gets loaded, we are logged in and ready to go
        // give the current User token to authenticate connection
        this.wsService.connect(this.currentUser);

        this.userSettings = null;
        this.settingsService.loadUserSettings();
        this.currentUserSettingsSubscription = this.settingsService.currentUserSettingsSubject$.subscribe(
            (settings) => {
                this.applyFilterSettings(settings);
            }
        );
    }

    ngOnInit() {}

    ngOnDestroy() {
        this.currentUserSettingsSubscription.unsubscribe();
        this.settingsService.clearUserSettings();
    }

    /**
     * Log out the user. Catches the "logoutOutEvent(...)" event from the app-header component to do some further "cleanup".
     */
    logout() {
        // document.onclick = null; // otherwise "window" if used
        document.removeAllListeners!('click');
    }

    /**
     * Catches the "loadChat(...)" event from the app-chat-tabs component
     * and passes it to the app-chat component to load messages for the given chat ID.
     *
     * @param chat the chat to pass to the app-chat component (we only take the ID at the moment)
     */
    displayChat(chat: ChatRoomWithParticipantsExceptSelf) {
        // join the chatroom websocket room
        this.wsService.joinChatroom(chat.chatroom_id);
        this.chatroomIdToLoad = chat.chatroom_id;
        this.chatroom = chat;

        // set group chat participants/users to null
        this.groupChatParticipants.length = 0;
        this.hideDropdown = true;
    }

    private applyFilterSettings(usrSetts: Settings) {
        let shouldReload: boolean = false;

        if (this.userSettings !== null && this.userSettings.filter !== usrSetts.filter) {
            shouldReload = true;
        }
        this.userSettings = { ...usrSetts };

        // page reload will, if it happened, repopulate the settings, etc.
        // TODO: either reload the page, or pass an event to the chat-tabs component, to reload the chat-tabs?
        if (shouldReload) {
            window.alert(
                'Filter changes will be applied after a page reload. Reloading page for the changes to take effect...'
            );
            window.location.reload();
        }
    }

    groupChatParticipants = new Array<User>();
    hideDropdown: boolean = true;
    /**
     * On button click, shows the users which are part of the current opened group chat.
     */
    showUsersForGroupChat() {
        if (this.groupChatParticipants.length === 0) {
            this.hideDropdown = !this.hideDropdown;
            this.groupChatParticipants = new Array<User>();
            this.chatroom.chatrooms.participants.forEach((user) => this.groupChatParticipants.push(user.users));
        } else {
            this.hideDropdown = true;
            this.groupChatParticipants.length = 0;
        }
    }

    /**
     * Catches the event from the group-chat-users component,
     * indicating that a user should be removed from the group chat.
     *
     * @param user the user to remove from the group chat
     */
    onRemoveParticipantFromGroupChat(user: User) {
        const chatroomIdToRemoveParticipantFrom = this.chatroom.chatroom_id;

        // leave websocket chatroom for the given user
        // + remove the chat from the chats list (only important if the user is logged in)
        this.wsService.removeUserFromChatroom(user.user_id, chatroomIdToRemoveParticipantFrom);

        this.userService
            .removeUserFromGroupChat(user.user_id, chatroomIdToRemoveParticipantFrom)
            .subscribe((amountDeleted) => {
                if (amountDeleted > 0) {
                    // remove user from the locally stored chatroom (only important until a page reload is done)
                    const userFromChatroom = this.chatroom.chatrooms.participants.filter(
                        (u) => u.users.user_id === user.user_id
                    );
                    if (userFromChatroom.length > 0) {
                        const idxOf = this.chatroom.chatrooms.participants.indexOf(userFromChatroom[0]);
                        this.chatroom.chatrooms.participants.splice(idxOf, 1);
                    }
                }
            });
    }

    /**
     * Catches the event emitted from the group-chat-users component,
     * indicating that a user should be added to the group chat.
     *
     * @param user the user to add to the group chat
     */
    onAddParticipantToGroupChat(user: User) {
        const chatroomIdToAddUsersTo = this.chatroom.chatroom_id;

        // add the new user to the locally stored list(s)
        this.groupChatParticipants.push(user);
        this.chatroom.chatrooms.participants.push({ users: user });

        // notify user via websocket(s), and store in db
        this.userService.addUsersToGroupChat(user.user_id, chatroomIdToAddUsersTo).subscribe((_) => {
            this.wsService.addUserToChatroom(this.chatroom, user.user_id);
        });
    }

    notificationCounter: number = 0;
    onNotificationCounterChange(count: number) {
        this.notificationCounter = count;
    }
}
