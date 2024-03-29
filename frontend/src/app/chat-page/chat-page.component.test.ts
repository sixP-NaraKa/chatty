import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';
import { ReplaySubject } from 'rxjs';
import { ChatRoomWithParticipantsExceptSelf, Settings } from '../../../../shared/types/db-dtos';
import { ChatTabsComponent } from '../chat-tabs/chat-tabs.component';
import { HeaderComponent } from '../header/header.component';
import { NotificationSummaryComponent } from '../notification-summary/notification-summary.component';
import { UserSettingsService } from '../services/user-settings.service';
import { UserService } from '../services/user.services';
import { WebsocketService } from '../services/websocket.service';
import { SettingsMenuComponent } from '../settings-menu/settings-menu.component';
import { SliderComponent } from '../slider/slider.component';
import { VoiceChatComponent } from '../voice-chat/voice-chat.component';
import { ChatPageComponent } from './chat-page.component';

describe('ChatTabsComponent', () => {
    let component: ChatPageComponent;
    let fixture: ComponentFixture<ChatPageComponent>;
    let userServiceMock: Partial<UserService> = {};
    let websocketServiceMock: Partial<WebsocketService> = {
        connect: jest.fn(),
    };
    let userSettingsServiceMock: Partial<UserSettingsService> = {
        loadUserSettings: jest.fn(),
        currentUserSettingsSubject$: new ReplaySubject<Settings>(1),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ChatPageComponent,
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

        userSettingsServiceMock.clearUserSettings = jest.fn();

        fixture = TestBed.createComponent(ChatPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(async () => {
        jest.clearAllMocks();
    });

    test('should be created', () => {
        expect(component).toBeTruthy();
    });

    test('should be constructed', () => {
        expect(component).toBeTruthy();
        expect(websocketServiceMock.connect).toHaveBeenCalledTimes(1);
        expect(userSettingsServiceMock.loadUserSettings).toHaveBeenCalledTimes(1);
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

    test('should display the chat', () => {
        const chat: Partial<ChatRoomWithParticipantsExceptSelf> = {
            chatroom_id: 1,
        };
        websocketServiceMock.joinChatroom = jest.fn();
        component.groupChatParticipants.length = 1;
        component.hideDropdown = false;

        component.displayChat(chat as ChatRoomWithParticipantsExceptSelf);

        expect(websocketServiceMock.joinChatroom).toHaveBeenCalledTimes(1);
        expect(websocketServiceMock.joinChatroom).toHaveBeenCalledWith(chat.chatroom_id);
        expect(component.chatroom).toBe(chat as ChatRoomWithParticipantsExceptSelf);
        expect(component.groupChatParticipants.length).toBe(0);
        expect(component.hideDropdown).toBeTruthy();
    });
});
