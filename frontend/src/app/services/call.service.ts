import { Injectable } from '@angular/core';
import { UserService } from './user.services';
import { WebsocketService } from './websocket.service';

const offerOptions = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: false,
};

@Injectable({
    providedIn: 'root',
})
export class CallService {
    private peerConnection!: RTCPeerConnection;

    private localStream!: MediaStream;

    chatroomId: number = -1;

    constructor(private wsService: WebsocketService, private userService: UserService) {}

    public async call(chatroomId: number, isCaller: boolean) {
        this.chatroomId = chatroomId;
        await this.createPeerConnection();

        // only audio offer option
        if (isCaller) {
            const offer = await this.peerConnection.createOffer(offerOptions);
            await this.peerConnection.setLocalDescription(offer);

            this.wsService.sendVoiceChatMessage({
                type: 'offer',
                chatroomId: chatroomId,
                userId: this.userService.currentUser.userId,
                data: offer,
            });
        }
    }

    public hangup(chatroomId: number) {
        this.wsService.sendVoiceChatMessage({
            type: 'hangup',
            chatroomId: chatroomId,
            userId: this.userService.currentUser.userId,
            data: '',
        });
        this.closeCall();
    }

    private closeCall() {
        if (this.peerConnection) {
            this.wsService.sendVoiceChatRequest({
                type: 'hangup',
                chatroomId: this.chatroomId,
                userId: this.userService.currentUser.userId,
            });

            this.peerConnection.removeEventListener('track', this.handleTrackEvent);
            this.peerConnection.removeEventListener('icecandidate', this.handleIceCandidateEvent);
            this.peerConnection.removeEventListener(
                'iceconnectionstatechange',
                this.handleIceConnectionStateChangeEvent
            );
            this.peerConnection.removeEventListener('signalingstatechange', this.handleSignallingStateChangeEvent);

            // Stop all transceivers on the connection
            this.peerConnection.getTransceivers().forEach((transceiver) => {
                transceiver.stop();
            });
            // Stop all tracks
            this.localStream.getTracks().forEach((track) => track.stop());
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

        this.peerConnection = new RTCPeerConnection();

        if (!this.localStream) {
            await this.getSelectedAudioMediaDevice();
        }
        this.localStream.getTracks().forEach((track) => this.peerConnection.addTrack(track, this.localStream));

        this.peerConnection.addEventListener('icecandidate', this.handleIceCandidateEvent);
        this.peerConnection.addEventListener('iceconnectionstatechange', this.handleIceConnectionStateChangeEvent);
        this.peerConnection.addEventListener('signalingstatechange', this.handleSignallingStateChangeEvent);
        this.peerConnection.addEventListener('track', this.handleTrackEvent);
    }

    private handleIceCandidateEvent = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
            this.wsService.sendVoiceChatMessage({
                type: 'icecandidate',
                chatroomId: this.chatroomId,
                userId: this.userService.currentUser.userId,
                data: event.candidate,
            });
        }
    };

    private handleIceConnectionStateChangeEvent = (event: Event) => {
        switch (this.peerConnection.iceConnectionState) {
            case 'closed':
            case 'failed':
            case 'disconnected':
                this.closeCall();
                break;
        }
    };

    private handleSignallingStateChangeEvent = (event: Event) => {
        switch (this.peerConnection.signalingState) {
            case 'closed':
                this.closeCall();
                break;
        }
    };

    private handleTrackEvent = (event: RTCTrackEvent) => {
        const remoteAudioElement = document.getElementById('audioPlaybackElement') as HTMLAudioElement;
        remoteAudioElement.srcObject = event.streams[0];
    };

    public async addIncomingMessageHandler() {
        this.wsService.getVoiceChatMessage().subscribe(async (msg) => {
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
        if (!this.peerConnection) {
            // await this.createPeerConnection();
            await this.call(msg.chatroomId, false);
        }

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.data));
        const answer = await this.peerConnection.createAnswer();
        answer.sdp = answer.sdp?.replace('useinbandfec=1', 'useinbandfec=1; stereo=1; maxaveragebitrate=510000');
        await this.peerConnection.setLocalDescription(answer);
        this.wsService.sendVoiceChatMessage({
            type: 'answer',
            chatroomId: msg.chatroomId,
            userId: this.userService.currentUser.userId,
            data: this.peerConnection.localDescription,
        });
    }

    private async handleAnswerMessage(desc: RTCSessionDescriptionInit) {
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
        // get the selected audio device from the select element
        let constraints;
        const element = document.getElementById('audioDeviceSelectElement') as HTMLSelectElement;
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
                video: false,
            };
        }

        try {
            this.localStream = element
                ? await navigator.mediaDevices.getUserMedia(constraints)
                : await navigator.mediaDevices.getUserMedia({
                      audio: {
                          autoGainControl: false,
                          channelCount: 2,
                          echoCancellation: true,
                          latency: 0,
                          noiseSuppression: true,
                          sampleRate: 48000,
                          sampleSize: 16,
                      },
                      video: false,
                  });
        } catch (e) {
            return e;
        }
    }
}
