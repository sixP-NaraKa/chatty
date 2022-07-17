import { Injectable } from '@angular/core';
import { UserService } from './user.services';
import { WebsocketService } from './websocket.service';


const offerOptions = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: false,
}

@Injectable({
    providedIn: 'root'
})
export class CallService {

    private peerConnection!: RTCPeerConnection;

    private localStream!: MediaStream;

    chatroomId: number = -1;

    constructor(private wsService: WebsocketService, private userService: UserService) { }

    public async call(chatroomId: number) {
        console.log("PEER CONNECTION in call()", this.peerConnection);
        this.chatroomId = chatroomId;
        // if (!this.peerConnection) {
        //     await this.createPeerConnection();
        // }
        await this.createPeerConnection();

        // only audio offer option
        console.log("creating offer");
        const offer = await this.peerConnection.createOffer(offerOptions);
        await this.peerConnection.setLocalDescription(offer);

        this.wsService.sendVoiceChatMessage({ type: "offer", chatroomId: chatroomId, userId: this.userService.currentUser.userId, data: offer });
    }

    public hangup(chatroomId: number) {
        this.wsService.sendVoiceChatMessage({ type: "hangup", chatroomId: chatroomId, userId: this.userService.currentUser.userId, data: "" });
        this.closeCall();
    }

    private closeCall() {
        if (this.peerConnection) {
            // this.peerConnection.ontrack = null;
            // this.peerConnection.onicecandidate = null;
            // this.peerConnection.oniceconnectionstatechange = null;
            // this.peerConnection.onsignalingstatechange = null;

            this.peerConnection.removeEventListener("track", this.handleTrackEvent);
            this.peerConnection.removeEventListener("icecandidate", this.handleIceCandidateEvent);
            this.peerConnection.removeEventListener("iceconnectionstatechange", this.handleIceConnectionStateChangeEvent);
            this.peerConnection.removeEventListener("signalingstatechange", this.handleSignallingStateChangeEvent);

            // if (this.peerConnection.removeAllListeners !== undefined) {
            //     this.peerConnection.removeAllListeners();
            // }

            // Stop all transceivers on the connection
            this.peerConnection.getTransceivers().forEach(transceiver => {
                transceiver.stop();
            });
            // Stop all tracks
            this.localStream.getTracks().forEach(track => track.stop());

            // Close the peer connection
            this.peerConnection.close();
            this.peerConnection = null as unknown as RTCPeerConnection; // satisfying typescript :)
        }
    }

    private async createPeerConnection() {
        // this.peerConnection = new RTCPeerConnection({
        //     iceServers: [
        //         {
        //             urls: 'stun:stun1.l.google.com:19302'
        //         }
        //     ]
        // });

        console.log("creating peer connection 1")
        this.peerConnection = new RTCPeerConnection();

        // TODO: for some reason, upon the first connection we need to also use the call() method on the receiver to actually start the voice chat
        // consecutive calls go through just fine (meaning, these methods here are being called twice for the receiver... not sure why)
        // hence this simple check, this will then make it so once the call is done, we won't have lingering usage of media devices
        if (!this.localStream) {
            await this.getSelectedAudioMediaDevice();
        }
        this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));


        console.log("adding event listeners 5")
        this.peerConnection.addEventListener("icecandidate", this.handleIceCandidateEvent);
        this.peerConnection.addEventListener("iceconnectionstatechange", this.handleIceConnectionStateChangeEvent);
        this.peerConnection.addEventListener("signalingstatechange", this.handleSignallingStateChangeEvent);
        this.peerConnection.addEventListener("track", this.handleTrackEvent);
        console.log("done 6")
    }

    private handleIceCandidateEvent = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
            this.wsService.sendVoiceChatMessage({ type: "icecandidate", chatroomId: this.chatroomId, userId: this.userService.currentUser.userId, data: event.candidate });
        }
    }

    private handleIceConnectionStateChangeEvent = (event: Event) => {
        switch (this.peerConnection.iceConnectionState) {
            case "closed":
            case "failed":
            case "disconnected":
                this.closeCall();
                break;
        }
    }

    private handleSignallingStateChangeEvent = (event: Event) => {
        switch (this.peerConnection.signalingState) {
            case "closed":
                this.closeCall();
                break;
        }
    }

    private handleTrackEvent = (event: RTCTrackEvent) => {
        console.log("track event", event, event.streams, this.userService.currentUser.userId);
        const remoteAudioElement = (document.getElementById("audioPlaybackElement") as HTMLAudioElement);
        remoteAudioElement.srcObject = event.streams[0];
    }

    public async addIncomingMessageHandler() {
        this.wsService.getVoiceChatMessage().subscribe(async msg => {
            console.log(msg);
            switch (msg.type) {
                case 'offer':
                    await this.handleOfferMessage(msg.data);
                    break;
                case 'answer':
                    await this.handleAnswerMessage(msg.data);
                    break;
                case 'hangup':
                    this.handleHangupMessage();
                    break;
                case 'icecandidate':
                    await this.handleIceCandidateMessage(msg.data);
                    break;
                default:
                    console.log('unknown message of type ' + msg.type);
            }
        });
    }

    private async handleOfferMessage(desc: RTCSessionDescriptionInit) {
        console.log("PEER CONNECTION in handleOfferMessage()", this.peerConnection);
        if (!this.peerConnection) {
            console.log("offer received, creating peer connection")
            await this.createPeerConnection();
        }

        // this.peerConnection.setRemoteDescription(new RTCSessionDescription(desc)).then(() => {
        // }).then(() => {
        //     return this.peerConnection.createAnswer();
        // }).then((answer) => {
        //     return this.peerConnection.setLocalDescription(answer);
        // }).then(() => {
        //     this.wsService.sendVoiceChatMessage({ type: "answer", chatroomId: this.chatroomId, userId: this.userService.currentUser.userId, data: this.peerConnection.localDescription });
        // });

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(desc));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.wsService.sendVoiceChatMessage({ type: "answer", chatroomId: this.chatroomId, userId: this.userService.currentUser.userId, data: this.peerConnection.localDescription });
    }

    private async handleAnswerMessage(desc: RTCSessionDescriptionInit) {
        console.log("answer received", desc);
        await this.peerConnection.setRemoteDescription(desc);
    }

    private handleHangupMessage() {
        this.closeCall();
    }

    private async handleIceCandidateMessage(data: RTCIceCandidate) {
        const candidate = new RTCIceCandidate(data);
        if (this.peerConnection.remoteDescription) {
            await this.peerConnection.addIceCandidate(candidate);
        }
    }

    public async getSelectedAudioMediaDevice() {
        console.log("fetching user media 2");
        // get the selected audio device from the select element
        const selectedDeviceId = (document.getElementById("audioDeviceSelectElement") as HTMLSelectElement).value;
        // get audio element via constraints
        const constraints = {
            audio: { deviceId: selectedDeviceId },
            video: false
        }

        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        }
        catch (e) {
            return e;
        }
        console.log("done fetching user media 3");
    }
}
