import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { ChatRoomWithParticipantsExceptSelf } from '../../../../shared/types/db-dtos';
import { CallService } from '../services/call.service';
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

    constructor(private callService: CallService, private wsService: WebsocketService, private userService: UserService) { }

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
                    });
                    break;
                case "accept":
                    await this.callService.call(msg.chatroomId);
                    this.userService.getSingleChatroomForUserWithParticipantsExceptSelf(this.userService.currentUser.userId, msg.chatroomId).subscribe(async room => {
                        this.inCallWithChatroom = room;
                        this.isInCall = true;
                    });
                    break;
                case "decline":
                    console.log("switch: call declined, noop (atm)");
                    break;
            }

        });
    }

    /**
     * Shows a notification to the user about a incoming voice chat request.
     * The user has then the option to accept or decline the call.
     * 
     * @param room the chatroom to display information for
     */
    showNotificationOfVoiceChatRequest(room: ChatRoomWithParticipantsExceptSelf | any) {
        const divId = Math.random().toString().substring(2, 8);
        this.notifsCurrentlyActiveMap.set(divId, room);
        (this.notifDivElement.nativeElement as HTMLDivElement).style.display = "block";
        setTimeout(() => {
            this.removeNotification(divId);
        }, 10000);
    }

    /**
     * Helper function to remove a <div> element.
     * 
     * @param divId the id of the div
     */
    removeNotification(divId: string) {
        if (this.notifsCurrentlyActiveMap.has(divId)) {
            this.notifsCurrentlyActiveMap.delete(divId);
            const div = (document.getElementById(divId) as HTMLDivElement);
            if (div) {
                (this.notifDivElement.nativeElement as HTMLDivElement).removeChild(div);
                div.remove();
            }
        }

        if (this.notifsCurrentlyActiveMap.size === 0) {
            (this.notifDivElement.nativeElement as HTMLDivElement).style.display = "none";
        }
    }

    async onAcceptCall(divId: string, chatroomId: number | any) {
        console.log("call accepted, notifying the user who send the request and creating peer connection and the like");
        this.inCallWithChatroom = this.notifsCurrentlyActiveMap.get(divId) as any;
        this.isInCall = true;

        this.removeNotification(divId);

        await this.callService.call(chatroomId);
        this.wsService.sendVoiceChatRequest({ type: 'accept', chatroomId: chatroomId, userId: this.userService.currentUser.userId });
    }

    onDeclineCall(divId: string, chatroomId: number | any) {
        console.log("call declined");
        this.removeNotification(divId);
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
        // this.isInCall = true;
        this.wsService.sendVoiceChatRequest({ type: 'request', chatroomId: this.currentChatroom.chatroom_id, userId: this.userService.currentUser.userId });
    }

}
