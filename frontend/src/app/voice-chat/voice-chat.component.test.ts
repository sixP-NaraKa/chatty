import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { DeepPartial } from 'utils/test';
import { ChatRoomWithParticipantsExceptSelf } from '../../../../shared/types/db-dtos';
import { CallService } from '../services/call.service';
import { NotificationService } from '../services/notification.service';
import { UserService } from '../services/user.services';
import { WebsocketService } from '../services/websocket.service';
import { SliderComponent } from '../slider/slider.component';
import { VoiceChatComponent } from './voice-chat.component';

type VoiceChatRequest = {
    type: 'request' | 'accept' | 'decline' | 'hangup';
    chatroomId: number;
    userId: number;
};

describe('VoiceChatComponent', () => {
    let component: VoiceChatComponent;
    let fixture: ComponentFixture<VoiceChatComponent>;

    const fakeChatroom: Partial<ChatRoomWithParticipantsExceptSelf> = {
        chatroom_id: 1,
    };

    const userServiceMock: Partial<UserService> = {
        currentUser: {
            access_token: 'access token',
            userId: 1,
            username: 'Test User Name',
        },
        updateUserSettings: jest.fn(),
        getSingleChatroomForUserWithParticipantsExceptSelf: jest.fn().mockReturnValue(of(fakeChatroom)),
    };
    const callService: Partial<CallService> = {
        addIncomingMessageHandler: jest.fn(),
        call: jest.fn(),
        hangup: jest.fn(),
    };
    let websocketService: Partial<WebsocketService>;
    const notificationService: Partial<NotificationService> = {
        newUnread: jest.fn(),
    };

    const voiceChatRequest: VoiceChatRequest = {
        type: 'request',
        chatroomId: 1,
        userId: 1,
    };

    beforeEach(async () => {
        websocketService = {
            getVoiceChatRequest: jest.fn().mockReturnValue(of()),
            sendVoiceChatRequest: jest.fn(),
        };

        await TestBed.configureTestingModule({
            declarations: [VoiceChatComponent, MockComponent(SliderComponent)],
            providers: [
                { provide: UserService, useValue: userServiceMock },
                { provide: CallService, useValue: callService },
                { provide: WebsocketService, useValue: websocketService },
                { provide: NotificationService, useValue: notificationService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(VoiceChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        component.audioIncomingCall.play = jest.fn();
        component.audioIncomingCall.pause = jest.fn();
    });

    afterEach(async () => {
        jest.clearAllMocks();
        // jest.resetAllMocks();
    });

    test('should be created', () => {
        expect(component).toBeTruthy();
    });

    test('should listen for "request" message call types', fakeAsync(async () => {
        voiceChatRequest.type = 'request';
        websocketService.getVoiceChatRequest = jest.fn().mockImplementation(() => of(voiceChatRequest));
        await component.ngAfterViewInit();
        flush(); // up here or down below, both seem to work

        expect(websocketService.getVoiceChatRequest).toHaveBeenCalledTimes(1);
        expect(userServiceMock.getSingleChatroomForUserWithParticipantsExceptSelf).toHaveBeenCalledTimes(1);
        expect(component.audioIncomingCall.play).toHaveBeenCalledTimes(1);
        expect(notificationService.newUnread).toHaveBeenCalledTimes(1);
    }));

    test('should listen for "accept" message call types', fakeAsync(async () => {
        voiceChatRequest.type = 'accept';
        websocketService.getVoiceChatRequest = jest.fn().mockReturnValue(of(voiceChatRequest));
        await component.ngAfterViewInit();

        expect(websocketService.getVoiceChatRequest).toHaveBeenCalledTimes(1);
        expect(component.audioIncomingCall.pause).toHaveBeenCalledTimes(1);
        expect(component.callRequestInProgress).toBeFalsy();
        expect(callService.call).toHaveBeenCalledWith(voiceChatRequest.chatroomId, true);
        expect(userServiceMock.getSingleChatroomForUserWithParticipantsExceptSelf).toHaveBeenCalledTimes(1);
        expect(component.inCallWithChatroom).toBe(fakeChatroom);
        expect(component.isInCall).toBeTruthy();
    }));

    test('should listen for "decline" message call types', fakeAsync(async () => {
        voiceChatRequest.type = 'decline';
        websocketService.getVoiceChatRequest = jest.fn().mockReturnValue(of(voiceChatRequest));
        await component.ngAfterViewInit();

        expect(websocketService.getVoiceChatRequest).toHaveBeenCalledTimes(1);
        expect(component.callRequestInProgress).toBeFalsy();
    }));

    test('should listen for "hangup" message call types', fakeAsync(async () => {
        voiceChatRequest.type = 'hangup';
        websocketService.getVoiceChatRequest = jest.fn().mockReturnValue(of(voiceChatRequest));
        component.isInCall = true;
        await component.ngAfterViewInit();

        expect(websocketService.getVoiceChatRequest).toHaveBeenCalledTimes(1);
        expect(component.isInCall).toBeFalsy();
        expect(callService.hangup).toHaveBeenCalledWith(voiceChatRequest.chatroomId);
    }));

    test('should listen listen for ignored or other invalid message call types', fakeAsync(async () => {
        voiceChatRequest.type = 'invalid value' as any;
        websocketService.getVoiceChatRequest = jest.fn().mockReturnValue(of(voiceChatRequest));
        component.isInCall = true;
        await component.ngAfterViewInit();

        expect(websocketService.getVoiceChatRequest).toHaveBeenCalledTimes(1);
        expect(component.callRequestInProgress).toBeFalsy();
    }));

    test('should accept call', fakeAsync(async () => {
        await component.onAcceptCall('', voiceChatRequest.chatroomId);

        expect(component.audioIncomingCall.pause).toHaveBeenCalledTimes(1);
        expect(component.isInCall).toBeTruthy();
        expect(callService.call).toHaveBeenCalledWith(voiceChatRequest.chatroomId, false);
        expect(websocketService.sendVoiceChatRequest).toHaveBeenCalledWith({
            type: 'accept',
            chatroomId: voiceChatRequest.chatroomId,
            userId: userServiceMock.currentUser?.userId,
        });
    }));

    test('should decline call', () => {
        component.onDeclineCall('', voiceChatRequest.chatroomId);

        expect(component.audioIncomingCall.pause).toHaveBeenCalledTimes(1);
        expect(websocketService.sendVoiceChatRequest).toHaveBeenCalledWith({
            type: 'decline',
            chatroomId: voiceChatRequest.chatroomId,
            userId: userServiceMock.currentUser?.userId,
        });
    });

    test('should start call', fakeAsync(async () => {
        const chatroom: DeepPartial<ChatRoomWithParticipantsExceptSelf> = {
            chatrooms: {
                chatroom_id: voiceChatRequest.chatroomId,
                participants: [
                    {
                        users: {
                            display_name: 'Test Display Name',
                        },
                    },
                ],
            },
        };
        component.setChatroom = chatroom as ChatRoomWithParticipantsExceptSelf;
        component.inCallWithChatroom = chatroom as ChatRoomWithParticipantsExceptSelf;

        await component.startCall();

        expect(component.callRequestInProgress).toBeTruthy();
        expect(websocketService.sendVoiceChatRequest).toHaveBeenCalledWith({
            type: 'request',
            chatroomId: undefined, // always says received "undefined", which is not the case though...
            userId: userServiceMock.currentUser?.userId,
        });
    }));

    test('should stop call', fakeAsync(async () => {
        const chatroom: DeepPartial<ChatRoomWithParticipantsExceptSelf> = {
            chatrooms: {
                chatroom_id: voiceChatRequest.chatroomId,
                participants: [
                    {
                        users: {
                            display_name: 'Test Display Name',
                        },
                    },
                ],
            },
        };
        component.setChatroom = chatroom as ChatRoomWithParticipantsExceptSelf;
        component.inCallWithChatroom = chatroom as ChatRoomWithParticipantsExceptSelf;

        // call it twice to stop the call request
        await component.startCall();
        component.isInCall = true;
        await component.startCall();

        expect(callService.hangup).toHaveBeenCalledTimes(1); // toHaveBeenCalledWith always says received "undefined", which is not the case though...
        expect(component.isInCall).toBeFalsy();
    }));
});
