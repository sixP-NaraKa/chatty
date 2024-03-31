import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { MockComponent, MockService } from 'ng-mocks';
import { of } from 'rxjs';
import {
    ChatMessageWithUser,
    ChatRoomWithParticipantsExceptSelf,
    MessageReaction,
} from '../../../../shared/types/db-dtos';
import { ApplicationUser } from '../auth/auth.service';
import { GroupChatWindowComponent } from '../group-chat-window/group-chat-window.component';
import { NotificationService } from '../services/notification.service';
import { UserService } from '../services/user.services';
import { WebsocketService } from '../services/websocket.service';
import { UserSearchComponent } from '../user-search/user-search.component';
import { ChatTabsComponent } from './chat-tabs.component';

describe('ChatTabsComponent', () => {
    let component: ChatTabsComponent;
    let fixture: ComponentFixture<ChatTabsComponent>;
    let userServiceMock = MockService(UserService);
    let notificationServiceMock = MockService(NotificationService);

    // via "normal" mocking
    let websocketServiceMock: Partial<WebsocketService>;

    const fakeUser: ApplicationUser = {
        access_token: 'access token',
        userId: 1,
        username: 'Test User Name',
    };

    beforeEach(async () => {
        websocketServiceMock = {
            getNewChatroom: jest.fn().mockReturnValue(of()),
            getChatMessage: jest.fn().mockReturnValue(of()),
            listenForRemoveChatroom: jest.fn().mockReturnValue(of()),
            getNewEmoteReaction: jest.fn().mockReturnValue(of()),
            getChangedAvailabilities: jest.fn().mockReturnValue(of()),
        };

        await TestBed.configureTestingModule({
            declarations: [
                ChatTabsComponent,
                MockComponent(GroupChatWindowComponent),
                MockComponent(UserSearchComponent),
            ],
            imports: [HttpClientTestingModule, RouterTestingModule],
            providers: [
                { provide: UserService, useValue: userServiceMock },
                { provide: WebsocketService, useValue: websocketServiceMock },
                { provide: NotificationService, useValue: notificationServiceMock },
            ],
        }).compileComponents();

        // or mock like this with MockService(...)
        // if methods are called at startup (e.g. constructor, ng*Init), then this needs to be setup BEFORE "fixture.detectChanges()"" is called
        userServiceMock.getChatroomsForUserWithParticipantsExceptSelf = jest.fn().mockReturnValue(of());
        jest.spyOn(userServiceMock, 'currentUser', 'get').mockReturnValue(fakeUser);

        fixture = TestBed.createComponent(ChatTabsComponent);
        component = fixture.componentInstance;
        component.audioElementUnreadMessage.play = jest.fn();
        fixture.detectChanges();
    });

    afterEach(async () => {
        jest.clearAllMocks();
        // jest.resetAllMocks();
    });

    test('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngAfterContentInit', () => {
        let chats: Array<ChatRoomWithParticipantsExceptSelf>;

        beforeEach(() => {
            chats = [
                {
                    chatroom_id: 1,
                    chatrooms: {
                        chatroom_id: 1,
                        created_at: new Date(),
                        created_by: 1,
                        isgroup: false,
                        name: 'Test Chat',
                        participants: [],
                    },
                    p_id: 1,
                    user_id: 1,
                },
            ];
        });

        test('should join chatrooms', () => {
            userServiceMock.getChatroomsForUserWithParticipantsExceptSelf = jest.fn().mockReturnValue(of(chats));
            websocketServiceMock.joinChatroom = jest.fn();
            // userServiceMock.getChatroomMessagesCount = jest.fn().mockReturnValue(of());
            userServiceMock.getChatroomMessagesCount = jest.fn();

            component.ngAfterContentInit();

            expect(websocketServiceMock.joinChatroom).toHaveBeenCalledTimes(chats.length);
            expect(userServiceMock.getChatroomMessagesCount).toHaveBeenCalledTimes(chats.length);
            expect(userServiceMock.getChatroomMessagesCount).toHaveReturnedTimes(chats.length);

            expect(component.chatrooms.length).toBe(0);
        });

        test('should add chats that are groups always', () => {
            chats.push({
                chatroom_id: 2,
                chatrooms: {
                    chatroom_id: 2,
                    created_at: new Date(),
                    created_by: 1,
                    isgroup: true,
                    name: 'Test Group',
                    participants: [],
                },
                p_id: 2,
                user_id: 1,
            });
            userServiceMock.getChatroomsForUserWithParticipantsExceptSelf = jest.fn().mockReturnValue(of(chats));
            websocketServiceMock.joinChatroom = jest.fn();
            userServiceMock.getChatroomMessagesCount = jest.fn().mockReturnValue(of());

            component.ngAfterContentInit();

            expect(websocketServiceMock.joinChatroom).toHaveBeenCalledTimes(chats.length);
            expect(userServiceMock.getChatroomMessagesCount).toHaveBeenCalledTimes(1);
            expect(userServiceMock.getChatroomMessagesCount).toHaveReturnedTimes(1);

            expect(component.chatrooms.length).toBe(1);
            expect(component.chatrooms).toContain(chats[1]);
        });

        test('should get chat message counts when chat is not a group', () => {
            chats.push({
                chatroom_id: 2,
                chatrooms: {
                    chatroom_id: 2,
                    created_at: new Date(),
                    created_by: 1,
                    isgroup: true,
                    name: 'Test Group',
                    participants: [],
                },
                p_id: 2,
                user_id: 1,
            });
            userServiceMock.getChatroomsForUserWithParticipantsExceptSelf = jest.fn().mockReturnValue(of(chats));
            websocketServiceMock.joinChatroom = jest.fn();
            userServiceMock.getChatroomMessagesCount = jest.fn().mockReturnValue(of(1));

            component.ngAfterContentInit();

            expect(websocketServiceMock.joinChatroom).toHaveBeenCalledTimes(chats.length);
            expect(userServiceMock.getChatroomMessagesCount).toHaveBeenCalledTimes(1);
            expect(userServiceMock.getChatroomMessagesCount).toHaveReturnedTimes(1);

            expect(component.chatrooms.length).toBe(2);
            expect(component.chatrooms).toContain(chats[0]);
            expect(component.chatrooms).toContain(chats[1]);
        });

        test('should not show empty chat when filter is active', () => {
            userServiceMock.getChatroomsForUserWithParticipantsExceptSelf = jest.fn().mockReturnValue(of(chats));
            websocketServiceMock.joinChatroom = jest.fn();
            userServiceMock.getChatroomMessagesCount = jest.fn().mockReturnValue(of(0));

            component.ngAfterContentInit();

            expect(websocketServiceMock.joinChatroom).toHaveBeenCalledTimes(chats.length);
            expect(userServiceMock.getChatroomMessagesCount).toHaveBeenCalledTimes(chats.length);
            expect(userServiceMock.getChatroomMessagesCount).toHaveReturnedTimes(chats.length);

            expect(component.chatrooms.length).toBe(0);
        });

        test('should listen for new chatrooms and join them', () => {
            const chatroom: ChatRoomWithParticipantsExceptSelf = {
                chatroom_id: 2,
                chatrooms: {
                    chatroom_id: 2,
                    created_at: new Date(),
                    created_by: 1,
                    isgroup: true,
                    name: 'Test Group',
                    participants: [],
                },
                p_id: 2,
                user_id: 1,
            };
            websocketServiceMock.getNewChatroom = jest.fn().mockReturnValue(of(chatroom));
            websocketServiceMock.joinChatroom = jest.fn();
            userServiceMock.getSingleChatroomForUserWithParticipantsExceptSelf = jest
                .fn()
                .mockReturnValue(of(chatroom));

            component.ngAfterContentInit();

            expect(websocketServiceMock.getNewChatroom).toHaveBeenCalledTimes(1);
            expect(websocketServiceMock.joinChatroom).toHaveBeenCalledWith(chatroom.chatroom_id);
            expect(userServiceMock.getSingleChatroomForUserWithParticipantsExceptSelf).toHaveBeenCalledWith(
                chatroom.chatroom_id
            );

            expect(component.chatrooms.length).toBe(1);
            expect(component.chatrooms).toContain(chatroom);
        });

        test('should listen for new messages from not open chatrooms', () => {
            const chatroom: ChatRoomWithParticipantsExceptSelf = {
                chatroom_id: 2,
                chatrooms: {
                    chatroom_id: 2,
                    created_at: new Date(),
                    created_by: 1,
                    isgroup: true,
                    name: 'Test Group',
                    participants: [],
                },
                p_id: 2,
                user_id: 1,
            };
            const message: Partial<ChatMessageWithUser> = {
                chatroom_id: 2,
                users: {
                    user_id: 1,
                    creation_date: new Date(),
                    display_name: 'Test User Display Name',
                },
            };
            const ofMessage = of(message);

            websocketServiceMock.getChatMessage = jest.fn().mockReturnValue(ofMessage);
            userServiceMock.getSingleChatroomForUserWithParticipantsExceptSelf = jest
                .fn()
                .mockReturnValue(of(chatroom));
            notificationServiceMock.newUnread = jest.fn();

            component.ngAfterContentInit();

            expect(websocketServiceMock.getChatMessage).toHaveReturnedWith(ofMessage);
            expect(userServiceMock.getSingleChatroomForUserWithParticipantsExceptSelf).toHaveBeenCalledWith(
                message.chatroom_id
            );
            expect(userServiceMock.getSingleChatroomForUserWithParticipantsExceptSelf).toHaveBeenCalledTimes(1);

            expect(component.chatrooms.length).toBe(1);
            expect(component.chatrooms).toContain(chatroom);
            expect(notificationServiceMock.newUnread).toHaveBeenCalledTimes(1);
        });

        test('should listen for chat removals', () => {
            const chatroom: ChatRoomWithParticipantsExceptSelf = {
                chatroom_id: 2,
                chatrooms: {
                    chatroom_id: 2,
                    created_at: new Date(),
                    created_by: 1,
                    isgroup: true,
                    name: 'Test Group',
                    participants: [],
                },
                p_id: 2,
                user_id: 1,
            };
            component.chatrooms.push(chatroom);

            websocketServiceMock.listenForRemoveChatroom = jest.fn().mockReturnValue(of(2));

            component.ngAfterContentInit();

            expect(component.chatrooms.length).toBe(0);
        });

        test('should listen for new message reactions from not open chats', () => {
            const reaction: Partial<MessageReaction> = {
                emote: {
                    emote: 'Emote',
                    emote_id: 1,
                    name: 'Emote Name',
                },
            };
            const chatroom: ChatRoomWithParticipantsExceptSelf = {
                chatroom_id: 2,
                chatrooms: {
                    chatroom_id: 2,
                    created_at: new Date(),
                    created_by: 1,
                    isgroup: true,
                    name: 'Test Group',
                    participants: [],
                },
                p_id: 2,
                user_id: 1,
            };
            component.chatrooms.push(chatroom);
            websocketServiceMock.getNewEmoteReaction = jest.fn().mockReturnValue(of([2, 1, 1, reaction]));
            notificationServiceMock.newUnread = jest.fn();

            websocketServiceMock.listenForRemoveChatroom = jest.fn().mockReturnValue(of(2));

            component.ngAfterContentInit();

            expect(notificationServiceMock.newUnread).toHaveBeenCalledTimes(1);
        });

        test('should listen availability status changes', () => {
            websocketServiceMock.getChangedAvailabilities = jest.fn().mockReturnValue(of([1, 2, 3]));

            component.ngAfterContentInit();

            expect(websocketServiceMock.getChangedAvailabilities).toHaveBeenCalledTimes(1);
            expect(component.availabilityStatusUsers.length).toBe(3);
            expect(component.availabilityStatusUsers).toEqual([1, 2, 3]);
        });
    });

    test('should show group chat creation window + should fire on click', () => {
        component.onCreateGroupChatButtonClick();
        expect(component.showGroupChatCreateWindow).toBeTruthy();

        component.showGroupChatCreateWindow = false;
        const spy = jest.spyOn(component, 'onCreateGroupChatButtonClick');

        fixture.debugElement.query(By.css('.user-search-group-chat button')).triggerEventHandler('click', {});
        expect(spy).toHaveBeenCalledTimes(1);
        expect(component.showGroupChatCreateWindow).toBeTruthy();
    });

    test('should hide group chat creation window + should fire on click', () => {
        component.onCreateGroupChatClosed();
        expect(component.showGroupChatCreateWindow).toBeFalsy();

        component.showGroupChatCreateWindow = true;
        const spy = jest.spyOn(component, 'onCreateGroupChatClosed');

        fixture.debugElement.query(By.css('app-group-chat-window')).triggerEventHandler('groupChatClosedEvent', {});
        expect(spy).toHaveBeenCalledTimes(1);
        expect(component.showGroupChatCreateWindow).toBeFalsy();
    });

    test('should create group chat + should fire on click', () => {
        const chatroom: Partial<ChatRoomWithParticipantsExceptSelf> = {
            chatroom_id: 100,
        };
        component.onCreateGroupChatEvent(chatroom as ChatRoomWithParticipantsExceptSelf);
        expect(component.chatrooms.length).toBe(1);
        expect(component.chatrooms).toContain(chatroom as ChatRoomWithParticipantsExceptSelf);

        component.chatrooms.length = 0;
        const spy = jest.spyOn(component, 'onCreateGroupChatEvent');

        fixture.debugElement
            .query(By.css('app-group-chat-window'))
            .triggerEventHandler('groupChatCreatedEvent', chatroom);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(component.chatrooms.length).toBe(1);
        expect(component.chatrooms).toContain(chatroom as ChatRoomWithParticipantsExceptSelf);
    });
});
