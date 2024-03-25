import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MockComponent, MockService } from 'ng-mocks';
import { of } from 'rxjs';
import { GroupChatWindowComponent } from '../group-chat-window/group-chat-window.component';
import { NotificationService } from '../services/notification.service';
import { UserService } from '../services/user.services';
import { WebsocketService } from '../services/websocket.service';
import { UserSearchComponent } from '../user-search/user-search.component';
import { ChatTabsComponent } from './chat-tabs.component';

describe('ChatTabsComponent', () => {
    let component: ChatTabsComponent;
    let fixture: ComponentFixture<ChatTabsComponent>;
    let userServiceSpy = MockService(UserService);
    let notificationServiceSpy = MockService(NotificationService);

    // const userServiceSpy = {
    //     currentUser: jest.fn().mockReturnValue({
    //         access_token: 'access token',
    //         username: 'Test Name',
    //         userId: 1,
    //     }),
    //     getChatroomsForUserWithParticipantsExceptSelf: jest.fn().mockReturnValue(of()),
    //     getRegisteredUsers: jest.fn().mockReturnValue(of()),
    // };

    // via "normal" mocking
    let websocketServiceSpy = {
        getNewChatroom: jest.fn().mockReturnValue(of()),
        getChatMessage: jest.fn().mockReturnValue(of()),
        listenForRemoveChatroom: jest.fn().mockReturnValue(of()),
        getNewEmoteReaction: jest.fn().mockReturnValue(of()),
        getChangedAvailabilities: jest.fn().mockReturnValue(of()),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ChatTabsComponent,
                MockComponent(GroupChatWindowComponent),
                MockComponent(UserSearchComponent),
            ],
            imports: [HttpClientTestingModule, RouterTestingModule],
            providers: [
                { provide: UserService, useValue: userServiceSpy },
                { provide: WebsocketService, useValue: websocketServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
            ],
        }).compileComponents();

        // or mock like this with MockService(...)
        // if methods are called at startup (e.g. constructor, ng*Init), then this needs to be setup BEFORE "fixture.detectChanges()"" is called
        userServiceSpy.getChatroomsForUserWithParticipantsExceptSelf = jest.fn().mockReturnValue(of());

        fixture = TestBed.createComponent(ChatTabsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(async () => {
        jest.clearAllMocks();
    });

    test('should create', () => {
        expect(component).toBeTruthy();
    });
});
