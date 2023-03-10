import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { ChatRoomWithParticipantsExceptSelf } from '../../../../shared/types/db-dtos';
import { CallService } from '../services/call.service';
import { NotificationService } from '../services/notification.service';
import { UserService } from '../services/user.services';
import { WebsocketService } from '../services/websocket.service';

@Component({
    selector: 'app-voice-chat',
    templateUrl: './voice-chat.component.html',
    styleUrls: ['./voice-chat.component.scss']
})
export class VoiceChatComponent implements AfterViewInit {

    isInCall: boolean = false;
    inCallWithChatroom!: ChatRoomWithParticipantsExceptSelf;
    // a flag to look if a call request is already in progress, since we only want to allow one request at a time to be made by one user
    // (and therefore we only allow once active voice chat)
    callRequestInProgress: boolean = false;
    callingChatroomUser: string = "";
    // callingChatroomUserId: number = -1;

    currentChatroom!: ChatRoomWithParticipantsExceptSelf;
    @Input()
    set setChatroom(chatroom: ChatRoomWithParticipantsExceptSelf) {
        if (!chatroom) return;
        this.currentChatroom = chatroom;
    }

    @ViewChild("notif")
    notifDivElement!: any;

    // current active notifications IDs (element IDs and their corresponding chatrooms)
    notifsCurrentlyActiveMap = new Map<string, ChatRoomWithParticipantsExceptSelf>();

    audioIncomingCall = new Audio("../../assets/They callin me.m4a");

    constructor(private callService: CallService, private wsService: WebsocketService, private userService: UserService,
        private notificationService: NotificationService) { }

    async ngAfterViewInit() {
        await this.callService.addIncomingMessageHandler();
        this.listenForVoiceChatRequests();
    }

    listenForVoiceChatRequests() {
        this.wsService.getVoiceChatRequest().subscribe(async msg => {
            switch (msg.type) {
                case "request":
                    this.userService.getSingleChatroomForUserWithParticipantsExceptSelf(this.userService.currentUser.userId, msg.chatroomId).subscribe(room => {
                        this.showNotificationOfVoiceChatRequest(room);
                        this.playRingtone(true);
                        // save a call notification event for the current user,
                        // regardless if they accepted, declined or ignored the call request
                        this.notificationService.newUnread(this.userService.currentUser.userId, {
                            notification_id: -1, // noop
                            user_id: this.userService.currentUser.userId,
                            originated_from: msg.userId,
                            chatroom_id: msg.chatroomId,
                            type: "call",
                            content: "",
                            date: new Date(Date.now()),
                        });
                    });
                    break;
                case "accept":
                    console.log("accept", this.isInCall);
                    this.stopRingtone();
                    this.callRequestInProgress = false;
                    await this.callService.call(msg.chatroomId, true); // here we are the initiator/caller
                    this.userService.getSingleChatroomForUserWithParticipantsExceptSelf(this.userService.currentUser.userId, msg.chatroomId).subscribe(async room => {
                        this.inCallWithChatroom = room;
                        this.isInCall = true;
                    });
                    break;
                case "decline":
                    console.log("switch: call declined, noop (atm)");
                    this.callRequestInProgress = false;
                    break;
                case "hangup": // just to get the hangup event here as well, to handle some UI stuff
                    console.log(msg);
                    if (this.isInCall) {
                        this.isInCall = false;
                        this.callService.hangup(msg.chatroomId);
                    }
                    break;
                default: // e.g case: "ignored", etc. => see websocket backend implementation (might be reworked, so to cover all cases)
                    console.log("call has been ignored, enabling calling functionality");
                    this.callRequestInProgress = false;
                    break;
            }

        });
    }

    /**
     * Helper function to play a ringtone for incoming audio, no notify the user of this.
     * The ringtone will either be stopped by the optional 10sec timer, by accepting or declining the call.
     * 
     * @param isTimer if a timer should be used to stop the audio from playing
     */
    playRingtone(isTimer: boolean) {
        this.audioIncomingCall.loop = true;
        this.audioIncomingCall.play();
        if (isTimer) {
            setTimeout(() => {
                this.stopRingtone();
            }, 10000);
        }
    }

    /**
     * Helper function to stop the ringtone from playing.
     */
    stopRingtone() {
        this.audioIncomingCall.pause()
        this.audioIncomingCall.currentTime = 0;
    }

    /**
     * Shows a notification to the user about a incoming voice chat request.
     * The user has then the option to accept or decline the call.
     * 
     * @param room the chatroom to display information for
     */
    showNotificationOfVoiceChatRequest(room: ChatRoomWithParticipantsExceptSelf) {
        const divId = Math.random().toString().substring(2, 8);
        this.notifsCurrentlyActiveMap.set(divId, room);
        (this.notifDivElement.nativeElement as HTMLDivElement).style.display = "block";
        setTimeout(() => {
            this.removeNotification(divId, room.chatroom_id);
        }, 10000);
    }

    /**
     * Helper function to remove a <div> element.
     * 
     * @param divId the id of the div
     */
    removeNotification(divId: string, chatroomId: number) {
        if (this.notifsCurrentlyActiveMap.has(divId)) {
            this.notifsCurrentlyActiveMap.delete(divId);
            const div = (document.getElementById(divId) as HTMLDivElement);
            if (div) {
                (this.notifDivElement.nativeElement as HTMLDivElement).removeChild(div);
                div.remove();
            }
            // since we only allow one call at a time as well as one in progress call request, we should notify the callee about "ignored" requests
            // this only works for online users
            // for offline users see websocket backend implementation
            this.wsService.sendVoiceChatRequest({ type: "decline", chatroomId: chatroomId, userId: this.userService.currentUser.userId });
        }

        if (this.notifsCurrentlyActiveMap.size === 0) {
            (this.notifDivElement.nativeElement as HTMLDivElement).style.display = "none";
        }
    }

    async onAcceptCall(divId: string, chatroomId: number) {
        console.log("call accepted, notifying the user who send the request and creating peer connection and the like");
        this.stopRingtone();
        this.inCallWithChatroom = this.notifsCurrentlyActiveMap.get(divId) as any;
        this.isInCall = true;

        this.removeNotification(divId, chatroomId);

        await this.callService.call(chatroomId, false); // here we are the receiver/accepter
        this.wsService.sendVoiceChatRequest({ type: 'accept', chatroomId: chatroomId, userId: this.userService.currentUser.userId });
    }

    onDeclineCall(divId: string, chatroomId: number) {
        console.log("call declined");
        this.stopRingtone();
        this.removeNotification(divId, chatroomId);
        this.wsService.sendVoiceChatRequest({ type: 'decline', chatroomId: chatroomId, userId: this.userService.currentUser.userId });
    }

    /**
     * On click method for the slide-in / slide-out functionality.
     */
    onVoiceChatSliderClick() {
        const element = (document.getElementById("slideContent") as HTMLDivElement);
        if (element.classList.contains("dismiss")) {
            element.classList.remove("dismiss");
            element.classList.add("selected");
            element.style.display = "block";
        }
        else if (element.classList.contains("selected")) {
            element.classList.remove("selected");
            element.classList.add("dismiss");
        }
    }

    audioDevices = new Array<MediaDeviceInfo>();
    /**
     * Shows the avaikable audio media devices and lets the user select one of them to use.
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

    /**
     * Starts the voice call with the chatroom user(s) - 1on1 only at the moment.
     */
    async startCall() {
        // leave call (e.g. remove src from audio element) if pressed again
        if (this.isInCall) {
            (document.getElementById("audioPlaybackElement") as HTMLAudioElement).srcObject = null;
            this.callService.hangup(this.inCallWithChatroom.chatroom_id);
            this.isInCall = false;
            return;
        }
        this.callRequestInProgress = true;
        this.callingChatroomUser = this.currentChatroom.chatrooms.participants[0].users.display_name;
        // this.callingChatroomUserId = this.currentChatroom.chatrooms.participants[0].users.user_id;

        // this.playRingtone(true); // if we want to play a sound as well, we can do it here
        this.wsService.sendVoiceChatRequest({ type: 'request', chatroomId: this.currentChatroom.chatroom_id, userId: this.userService.currentUser.userId });
    }

}
