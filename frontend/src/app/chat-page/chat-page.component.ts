import { Component, OnInit } from '@angular/core';
import { ChatRoomWithParticipantsExceptSelf, participants, settings, User, UserIdDisplayName, users } from '../../../../shared/types/db-dtos';
import { ApplicationUser } from '../auth/auth.service';
import { UserService } from '../services/user.services';
import { WebsocketService } from '../services/websocket.service';

@Component({
    selector: 'app-chat-page',
    templateUrl: './chat-page.component.html',
    styleUrls: ['./chat-page.component.scss']
})
export class ChatPageComponent implements OnInit {

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
    userSettings!: settings;

    // current user
    currentUser: ApplicationUser;

    constructor(private userService: UserService, private wsService: WebsocketService) {
        this.currentUser = this.userService.currentUser;

        // (re)connect the websocket on page reload
        // why here? because if this app-chat-page component gets loaded, we are logged in and ready to go
        // give the current User token to authenticate connection
        this.wsService.connect(this.currentUser);

        // fetch initial user settings
        this.userService.getUserSettings(this.userService.currentUser.userId).subscribe(stts => {
            // this will (re)trigger the [filterOutEmpty1on1Chats] directive (as it seems) before it gets loaded (?)
            this.userSettings = stts;
            this.editChatWindowElementFontSize(stts); // both will have the same values, but this doesn't matter
        });
    }

    ngOnInit(): void {
        // this.listenForNewChatroomsAndJoinThem();
    }

    /**
     * Log out the user. Catches the "logoutOutEvent(...)" event from the app-header component.
     */
    logout() {
        // document.onclick = null; // otherwise "window" if used
        document.removeAllListeners!("click");
        this.userService.logout();
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

    applySettings(usrSetts: settings) {
        // TODO: no idea why after the first time here, both userSettings are ALWAYS the same... makes no sense
        //       does not matter for the filter changes, but font-size changes need therefore a small,
        //       rather insignificant workaround, but a workaround nonetheless
        console.log("passed usersettings", usrSetts, "this.userSettings", this.userSettings);
        let shouldReload: boolean = false;
        this.editChatWindowElementFontSize(usrSetts);

        if (this.userSettings.filter !== usrSetts.filter) {
            shouldReload = true;
        }
        this.userSettings = usrSetts;

        // page reload will, if it happened, repopulate the settings, etc.
        // TODO: either reload the page, or pass an event to the chat-tabs component, to reload the chat-tabs?
        if (shouldReload) {
            window.alert("Filter changes will be applied after a page reload. Reloading page for the changes to take effect...");
            document.location.reload();
        }
    }

    editChatWindowElementFontSize(usrSetts: settings) {
        let chatWindowElement = (document.getElementById("chatWindowDiv") as HTMLDivElement);
        if (usrSetts.font_size === "default") {
            chatWindowElement.classList.add("text-xs", "md:text-base");
            chatWindowElement.classList.remove("text-sm", "text-base", "text-lg", "text-xl", "text-2xl");
        }
        else {
            chatWindowElement.classList.remove("text-xs", "md:text-base", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl");
            chatWindowElement.classList.add(`${usrSetts.font_size}`);
        }
    }

    groupChatParticipants = new Array<User>();
    hideDropdown: boolean = true;
    /**
     * On button click, shows the users which are part of the current opened group chat.
     */
    showUsersForGroupChat() {
        if (this.groupChatParticipants.length === 0) {
            this.hideDropdown = false;
            this.groupChatParticipants = new Array<User>();
            this.chatroom.chatrooms.participants.forEach(user => this.groupChatParticipants.push(user.users));
        }
        else {
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
        
        this.userService.removeUserFromGroupChat(this.userService.currentUser.userId, user.user_id, chatroomIdToRemoveParticipantFrom).subscribe(
            amountDeleted => {
                if (amountDeleted > 0) {
                    // remove user from the locally stored chatroom (only important until a page reload is done)
                    const userFromChatroom = this.chatroom.chatrooms.participants.filter(u => u.users.user_id === user.user_id);
                    if (userFromChatroom.length > 0) {
                        const idxOf = this.chatroom.chatrooms.participants.indexOf(userFromChatroom[0]);
                        this.chatroom.chatrooms.participants.splice(idxOf, 1);
                    }
                }
            }
        )
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
        this.userService.addUsersToGroupChat(this.currentUser.userId, user.user_id, chatroomIdToAddUsersTo).subscribe(_ => {
            this.wsService.addUserToChatroom(this.chatroom, user.user_id);
        });
    }

    audioDevices = new Array<MediaDeviceInfo>();
    /**
     * Initiates the voice call to the selected chat participant (user - 1on1 only at the moment).
     */
    showAudioDeviceSelection() {
        if (this.audioDevices.length !== 0) {
            this.audioDevices = new Array<MediaDeviceInfo>();
            return;
        }

        // let the user select which microphone they want to use for the voice chat
        navigator.mediaDevices.enumerateDevices().then(devices => {
            // filter only for audio devices
            // if any where found, they will be shown as <option> tags inside of the <select> box
            this.audioDevices = devices.filter(device => device.kind === "audioinput");
            console.log(this.audioDevices);
            if (this.audioDevices.length === 0) {
                window.alert("No microphone found. Please plug in a microphone device.");
                return;
            }
        });
    }

    isInCall: boolean = false;
    initiateAudioCall() {
        // leave call (e.g. remove src from audio element) if pressed again
        if (this.isInCall) {
            (document.getElementById("audioPlaybackElement") as HTMLAudioElement).srcObject = null;
            this.isInCall = false;
            return;
        }

        // get the selected audio device from the select element
        const selectedDeviceId = (document.getElementById("audioDeviceSelectElement") as HTMLSelectElement).value;
        // get audio element via constraints
        const constraints = {
            audio: { deviceId: selectedDeviceId },
            video: false
        }
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                this.isInCall = true;
                alert("Selected device: " + stream);
                // a quick timeout so the *ngIf directive is triggering
                setTimeout(() => {
                    (document.getElementById("audioPlaybackElement") as HTMLAudioElement).srcObject = stream;
                }, 1);
            })
            .catch(error => {
                alert("Could not access microphone: " + error);
            });
        
        // TODO: PeerToPeer audio connection, not only local playback via audio element
    }



}
