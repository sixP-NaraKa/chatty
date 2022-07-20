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

    public async call(chatroomId: number, isCaller: boolean) {
        console.log("PEER CONNECTION in call()", this.peerConnection, isCaller);
        this.chatroomId = chatroomId;
        await this.createPeerConnection();

        // only audio offer option
        if (isCaller) {
            console.log("creating offer");
            const offer = await this.peerConnection.createOffer(offerOptions);
            await this.peerConnection.setLocalDescription(offer);

            this.wsService.sendVoiceChatMessage({ type: "offer", chatroomId: chatroomId, userId: this.userService.currentUser.userId, data: offer });
        }
    }

    public hangup(chatroomId: number) {
        this.wsService.sendVoiceChatMessage({ type: "hangup", chatroomId: chatroomId, userId: this.userService.currentUser.userId, data: "" });
        this.closeCall();
    }

    private closeCall() {
        if (this.peerConnection) {
            this.wsService.sendVoiceChatRequest({ type: "hangup", chatroomId: this.chatroomId, userId: this.userService.currentUser.userId });

            this.peerConnection.removeEventListener("track", this.handleTrackEvent);
            this.peerConnection.removeEventListener("icecandidate", this.handleIceCandidateEvent);
            this.peerConnection.removeEventListener("iceconnectionstatechange", this.handleIceConnectionStateChangeEvent);
            this.peerConnection.removeEventListener("signalingstatechange", this.handleSignallingStateChangeEvent);

            // Stop all transceivers on the connection
            this.peerConnection.getTransceivers().forEach(transceiver => {
                transceiver.stop();
            });
            // Stop all tracks
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null!;

            // Close the peer connection
            this.peerConnection.close();
            this.peerConnection = null!; // satisfying typescript :)
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

        if (!this.localStream) {
            console.log("getting user media");
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
                    await this.handleOfferMessage(msg);
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

    private async handleOfferMessage(msg: any) {
        console.log("PEER CONNECTION in handleOfferMessage()", this.peerConnection);
        if (!this.peerConnection) {
            console.log("offer received, creating peer connection")
            // await this.createPeerConnection();
            await this.call(msg.chatroomId, false);
        }

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.data));
        const answer = await this.peerConnection.createAnswer();
        answer.sdp = answer.sdp?.replace('useinbandfec=1', 'useinbandfec=1; stereo=1; maxaveragebitrate=510000');
        await this.peerConnection.setLocalDescription(answer);
        this.wsService.sendVoiceChatMessage({ type: "answer", chatroomId: msg.chatroomId, userId: this.userService.currentUser.userId, data: this.peerConnection.localDescription });
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
        let constraints;
        const element = (document.getElementById("audioDeviceSelectElement") as HTMLSelectElement);
        if (element) {
            const selectedDeviceId = element.value;
            // get audio element via constraints
            constraints = {
                audio: {
                    deviceId: selectedDeviceId,
                    autoGainControl: false,
                    channelCount: 2,
                    echoCancellation: true,
                    latency: 0,
                    noiseSuppression: true,
                    sampleRate: 48000,
                    sampleSize: 16,
                },
                video: false
            }
        }

        try {
            this.localStream =
                element ?
                    await navigator.mediaDevices.getUserMedia(constraints) :
                    await navigator.mediaDevices.getUserMedia({
                        audio: {
                            autoGainControl: false,
                            channelCount: 2,
                            echoCancellation: true,
                            latency: 0,
                            noiseSuppression: true,
                            sampleRate: 48000,
                            sampleSize: 16,
                        },
                        video: false
                    });
        }
        catch (e) {
            return e;
        }
        console.log("done fetching user media 3");
    }
}
