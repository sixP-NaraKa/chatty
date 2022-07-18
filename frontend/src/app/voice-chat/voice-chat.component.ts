import { AfterViewInit, Component, Input } from '@angular/core';
import { ChatRoomWithParticipantsExceptSelf } from '../../../../shared/types/db-dtos';
import { CallService } from '../services/call.service';

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
        // if (this.isInCall) {
        //     console.log("currently in call, setting current chatroom");
        //     this.currentChatroom = chatroom;
        //     return;
        // }
        if (!chatroom) return;
        this.currentChatroom = chatroom;
    }

    constructor(private callService: CallService) { }

    async ngAfterViewInit() {
        await this.callService.addIncomingMessageHandler();
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

        // // get the selected audio device from the select element
        // const selectedDeviceId = (document.getElementById("audioDeviceSelectElement") as HTMLSelectElement).value;
        // // get audio element via constraints
        // const constraints = {
        //     audio: { deviceId: selectedDeviceId },
        //     video: false
        // }

        // const err = await this.callService.getSelectedAudioMediaDevice(constraints);
        // if (err) {
        //     console.log("error in getting user media", err);
        //     alert("could not get microphone " + selectedDeviceId);
        //     return;
        // }

        this.isInCall = true;
        await this.callService.call(this.inCallWithChatroom.chatroom_id);
    }

}
