import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent } from 'ng-mocks';
import { ReplaySubject, of } from 'rxjs';
import { ChatRoomWithParticipantsExceptSelf, Settings } from '../../../../shared/types/db-dtos';
import { ChatTabsComponent } from '../chat-tabs/chat-tabs.component';
import { ChatComponent } from '../chat/chat.component';
import { GroupChatUsersComponent } from '../group-chat-users/group-chat-users.component';
import { HeaderComponent } from '../header/header.component';
import { NotificationSummaryComponent } from '../notification-summary/notification-summary.component';
import { UserSettingsService } from '../services/user-settings.service';
import { UserService } from '../services/user.services';
import { WebsocketService } from '../services/websocket.service';
import { SettingsMenuComponent } from '../settings-menu/settings-menu.component';
import { SliderComponent } from '../slider/slider.component';
import { VoiceChatComponent } from '../voice-chat/voice-chat.component';
import { ChatPageComponent } from './chat-page.component';

describe('ChatPageComponent', () => {
    let component: ChatPageComponent;
    let fixture: ComponentFixture<ChatPageComponent>;
    let userServiceMock: Partial<UserService>;
    let websocketServiceMock: Partial<WebsocketService>;
    let userSettingsServiceMock: Partial<UserSettingsService> = {
        loadUserSettings: jest.fn(),
    };

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

    beforeEach(async () => {
        userServiceMock = {};
        websocketServiceMock = {
            connect: jest.fn(),
        };
        userSettingsServiceMock.currentUserSettingsSubject$ = new ReplaySubject(1);
        userSettingsServiceMock.clearUserSettings = jest.fn();

        // https://stackoverflow.com/a/77572311
        const windowRef: any = window;
        delete windowRef.location;
        windowRef.location = { ...window.location, reload: jest.fn() };

        await TestBed.configureTestingModule({
            declarations: [
                ChatPageComponent,
                MockComponent(ChatComponent),
                MockComponent(GroupChatUsersComponent),
                MockComponent(HeaderComponent),
                MockComponent(SliderComponent),
                MockComponent(NotificationSummaryComponent),
                MockComponent(VoiceChatComponent),
                MockComponent(ChatTabsComponent),
                MockComponent(SettingsMenuComponent),
            ],
            providers: [
                { provide: UserService, useValue: userServiceMock },
                { provide: WebsocketService, useValue: websocketServiceMock },
                { provide: UserSettingsService, useValue: userSettingsServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(async () => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test('should be created', () => {
        expect(component).toBeTruthy();
    });

    test('should be constructed', () => {
        expect(component).toBeTruthy();
        expect(websocketServiceMock.connect).toHaveBeenCalledTimes(1);
        expect(userSettingsServiceMock.loadUserSettings).toHaveBeenCalledTimes(1);
    });

    test('should be applying settings (no reload)', () => {
        const fakeSettings: Settings = {
            embed_yt_videos: true,
            filter: 'filter',
            font_size: 'text-xs',
            settings_id: 1,
            user_id: 1,
        };
        userSettingsServiceMock.currentUserSettingsSubject$?.next(fakeSettings);

        expect(alertSpy).not.toHaveBeenCalled();
        expect(window.location.reload).not.toHaveBeenCalled();
    });

    test('should be applying settings (with reload)', () => {
        const fakeSettings: Settings = {
            embed_yt_videos: true,
            filter: 'filter',
            font_size: 'text-xs',
            settings_id: 1,
            user_id: 1,
        };
        component.userSettings = {
            embed_yt_videos: true,
            filter: '',
            font_size: 'text-xs',
            settings_id: 1,
            user_id: 1,
        };
        userSettingsServiceMock.currentUserSettingsSubject$?.next(fakeSettings);

        expect(alertSpy).toHaveBeenCalledTimes(1);
        expect(window.location.reload).toHaveBeenCalledTimes(1);
    });

    test('should unsubscribe and clear user settings', () => {
        expect(component.currentUserSettingsSubscription.closed).toBeFalsy();
        component.ngOnDestroy();
        expect(component.currentUserSettingsSubscription.closed).toBeTruthy();
        expect(userSettingsServiceMock.clearUserSettings).toHaveBeenCalledTimes(1);
    });

    test('should remove all click listeners', () => {
        document.addEventListener('click', () => '');
        expect(document.eventListeners!('click').length).toBe(1);
        component.logout();
        expect(document.eventListeners!('click').length).toBe(0);
    });

    describe('display chat', () => {
        test('should display', () => {
            const chat: Partial<ChatRoomWithParticipantsExceptSelf> = {
                chatroom_id: 1,
            };
            websocketServiceMock.joinChatroom = jest.fn();

            component.displayChat(chat as ChatRoomWithParticipantsExceptSelf);

            expect(websocketServiceMock.joinChatroom).toHaveBeenCalledTimes(1);
            expect(websocketServiceMock.joinChatroom).toHaveBeenCalledWith(chat.chatroom_id);
            expect(component.chatroom).toBe(chat as ChatRoomWithParticipantsExceptSelf);
        });

        test('should fire loadChat', () => {
            const chat: Partial<ChatRoomWithParticipantsExceptSelf> = {
                chatroom_id: 1,
            };
            const spy = jest.spyOn(component, 'displayChat').mockImplementation(() => {});

            fixture.debugElement.query(By.css('app-chat-tabs')).triggerEventHandler('loadChat', chat);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(chat as ChatRoomWithParticipantsExceptSelf);
        });
    });

    describe('group chat', () => {
        test('should remove user from group chat', () => {
            const userToRemove = {
                user_id: 2,
                display_name: 'Test User 2',
                creation_date: new Date(),
            };
            const chat: Partial<ChatRoomWithParticipantsExceptSelf> = {
                chatroom_id: 1,
                chatrooms: {
                    chatroom_id: 1,
                    created_at: new Date(),
                    created_by: 1,
                    isgroup: true,
                    name: 'Test Group',
                    participants: [
                        {
                            users: {
                                user_id: 1,
                                display_name: 'Test User',
                                creation_date: new Date(),
                            },
                        },
                        { users: userToRemove },
                    ],
                },
            };
            component.chatroom = chat as ChatRoomWithParticipantsExceptSelf;

            websocketServiceMock.removeUserFromChatroom = jest.fn();
            const usRemoveReturn = of(1);
            userServiceMock.removeUserFromGroupChat = jest.fn().mockImplementation(() => usRemoveReturn);

            expect(component.chatroom.chatrooms.participants).toContainEqual({ users: userToRemove });

            component.onRemoveParticipantFromGroupChat(userToRemove);

            expect(websocketServiceMock.removeUserFromChatroom).toHaveBeenCalledWith(
                userToRemove.user_id,
                chat.chatroom_id
            );
            expect(userServiceMock.removeUserFromGroupChat).toHaveBeenCalledWith(
                userToRemove.user_id,
                chat.chatroom_id
            );
            expect(userServiceMock.removeUserFromGroupChat).toHaveReturnedWith(usRemoveReturn);

            expect(component.chatroom.chatrooms.participants).not.toContainEqual({ users: userToRemove });
        });

        test('should remove user when fired via event', () => {
            const chat: Partial<ChatRoomWithParticipantsExceptSelf> = {
                chatroom_id: 1,
                chatrooms: {
                    chatroom_id: 1,
                    created_at: new Date(),
                    created_by: 1,
                    isgroup: true,
                    name: 'Test Group',
                    participants: [
                        {
                            users: {
                                user_id: 1,
                                display_name: 'Test User',
                                creation_date: new Date(),
                            },
                        },
                    ],
                },
            };
            component.chatroom = chat as ChatRoomWithParticipantsExceptSelf;
            // detect changes so the *ngIf directives are correctly applied
            fixture.detectChanges();

            const spy = jest.spyOn(component, 'onRemoveParticipantFromGroupChat').mockImplementation(() => {});

            fixture.debugElement
                .query(By.css('app-group-chat-users'))
                .triggerEventHandler('removeUserFromGroupChat', {});

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('should add user to group chat', () => {
            const userToAdd = {
                user_id: 2,
                display_name: 'Test User 2',
                creation_date: new Date(),
            };
            const chat: Partial<ChatRoomWithParticipantsExceptSelf> = {
                chatroom_id: 1,
                chatrooms: {
                    chatroom_id: 1,
                    created_at: new Date(),
                    created_by: 1,
                    isgroup: true,
                    name: 'Test Group',
                    participants: [
                        {
                            users: {
                                user_id: 1,
                                display_name: 'Test User',
                                creation_date: new Date(),
                            },
                        },
                    ],
                },
            };
            component.chatroom = chat as ChatRoomWithParticipantsExceptSelf;

            userServiceMock.addUsersToGroupChat = jest.fn().mockImplementation((_) => of(_));
            websocketServiceMock.addUserToChatroom = jest.fn();

            component.onAddParticipantToGroupChat(userToAdd);

            expect(userServiceMock.addUsersToGroupChat).toHaveBeenCalledWith(userToAdd.user_id, chat.chatroom_id);
            expect(websocketServiceMock.addUserToChatroom).toHaveBeenCalledWith(chat, userToAdd.user_id);

            expect(component.chatroom.chatrooms.participants).toContainEqual({ users: userToAdd });
        });

        test('should add user when fired via event', () => {
            const chat: Partial<ChatRoomWithParticipantsExceptSelf> = {
                chatroom_id: 1,
                chatrooms: {
                    chatroom_id: 1,
                    created_at: new Date(),
                    created_by: 1,
                    isgroup: true,
                    name: 'Test Group',
                    participants: [
                        {
                            users: {
                                user_id: 1,
                                display_name: 'Test User',
                                creation_date: new Date(),
                            },
                        },
                    ],
                },
            };
            component.chatroom = chat as ChatRoomWithParticipantsExceptSelf;
            // detect changes so the *ngIf directives are correctly applied
            fixture.detectChanges();

            const spy = jest.spyOn(component, 'onAddParticipantToGroupChat').mockImplementation(() => {});

            fixture.debugElement
                .query(By.css('app-group-chat-users'))
                .triggerEventHandler('addUserToGroupChatEvent', {});

            expect(spy).toHaveBeenCalledTimes(1);
        });
    });
});
