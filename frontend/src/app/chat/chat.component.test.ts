import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent, MockService, ngMocks } from 'ng-mocks';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { ToastrService } from 'ngx-toastr';
import { ReplaySubject, Subscription, of } from 'rxjs';
import { ChatMessageWithUser, Settings } from '../../../../shared/types/db-dtos';
import { ApplicationUser } from '../auth/auth.service';
import { EmoteSelectComponent } from '../emote-select/emote-select.component';
import { EmbedPipe } from '../pipes/embed.pipe';
import { GetImagePipe } from '../pipes/getimage.pipe';
import { ImageifyPipe } from '../pipes/imageify.pipe';
import { UrlifyPipe } from '../pipes/urlify.pipe';
import { UserSettingsService } from '../services/user-settings.service';
import { UserService } from '../services/user.services';
import { WebsocketService } from '../services/websocket.service';
import { ChatComponent } from './chat.component';

describe('ChatTabsComponent', () => {
    let component: ChatComponent;
    let fixture: ComponentFixture<ChatComponent>;
    let userServiceMock = MockService(UserService);
    let userServiceSettingsMock = MockService(UserSettingsService);
    let settingsSubjectSpy: jest.SpyInstance<Subscription>;
    let websocketServiceMock = MockService(WebsocketService);
    let toastrService = MockService(ToastrService);

    const fakeUser: ApplicationUser = {
        access_token: 'access token',
        userId: -1,
        username: 'User Name',
    };

    const fakeChatMessageWithUser: ChatMessageWithUser = {
        chatroom_id: -1,
        isfile: false,
        isimage: false,
        file_uuid: '',
        msg_content: '',
        msg_id: -1,
        user_id: -1,
        posted_at: new Date(),
        users: {
            creation_date: new Date(),
            display_name: 'Test',
            user_id: -1,
        },
        reactions: [],
    };

    const fakeEmoteReaction = {
        chatroomId: -1,
        messageId: -1,
        userId: -1,
        reaction: {
            reactions_id: -1,
            msg_id: -1,
            emote_id: -1,
            user_id: -2,
            emote: {
                emote_id: -1,
                emote: 'Test Emote',
                name: 'Test Emote Name',
            },
            user: {
                user_id: -1,
                display_name: 'Test User',
                creation_date: new Date(),
            },
        },
    };
    const fakeEmoteReactionWrapper = [
        fakeEmoteReaction.chatroomId,
        fakeEmoteReaction.messageId,
        fakeEmoteReaction.userId,
        fakeEmoteReaction.reaction,
    ];

    const fakeDeleteMessage = { messageId: -1, chatroomId: -1 };
    const fakeDeleteMessageWrapper = [fakeDeleteMessage.messageId, fakeDeleteMessage.chatroomId];

    const fakeSettings = {
        settings_id: -1,
        user_id: -1,
        filter: 'filter',
        font_size: 'default',
        embed_yt_videos: true,
    };

    beforeEach(async () => {
        ngMocks.flushTestBed();
        await TestBed.configureTestingModule({
            declarations: [
                ChatComponent,
                MockComponent(EmoteSelectComponent),
                UrlifyPipe,
                EmbedPipe,
                GetImagePipe,
                ImageifyPipe,
            ],
            imports: [InfiniteScrollDirective],
            providers: [
                UrlifyPipe,
                { provide: UserService, useValue: userServiceMock },
                { provide: WebsocketService, useValue: websocketServiceMock },
                { provide: UserSettingsService, useValue: userServiceSettingsMock },
                { provide: ToastrService, useValue: toastrService },
            ],
        }).compileComponents();

        jest.spyOn(userServiceMock, 'currentUser', 'get').mockReturnValue(fakeUser);
        websocketServiceMock.getChatMessage = jest.fn().mockReturnValue(of(fakeChatMessageWithUser));
        websocketServiceMock.getNewEmoteReaction = jest.fn().mockReturnValue(of(fakeEmoteReactionWrapper));
        websocketServiceMock.getDeleteChatMessage = jest.fn().mockReturnValue(of());
        userServiceSettingsMock.currentUserSettingsSubject$ = new ReplaySubject<Settings>(1);
        userServiceSettingsMock.currentUserSettingsSubject$.next(fakeSettings);

        settingsSubjectSpy = jest.spyOn(userServiceSettingsMock.currentUserSettingsSubject$, 'subscribe');

        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(async () => {
        jest.clearAllMocks();
    });

    test('should be created', () => {
        expect(component).toBeTruthy();
    });

    test('chat message should be visible', () => {
        expect(component.chatroomMessages.length).toBe(1);
        expect(component.chatroomMessages).toContain(fakeChatMessageWithUser);

        expect(fixture.debugElement.query(By.css('.chat-message-div'))).not.toBeNull();
    });

    test('chat message emote reaction should be visible', () => {
        expect(component.chatroomMessages[0].reactions.length).toBe(fakeChatMessageWithUser.reactions.length);
        expect(component.chatroomMessages[0].reactions).toContain(fakeEmoteReaction.reaction);

        expect(fixture.debugElement.query(By.css('.not-italic'))).not.toBeNull();
    });

    test('chat message is deleted and not visible', () => {
        websocketServiceMock.getChatMessage = jest.fn().mockReturnValue(of());
        websocketServiceMock.getNewEmoteReaction = jest.fn().mockReturnValue(of());
        websocketServiceMock.getDeleteChatMessage = jest.fn().mockReturnValue(of(fakeDeleteMessageWrapper));
        component.ngOnInit();
        expect(component.chatroomMessages.length).toBe(0);
        expect(component.chatroomMessages).not.toContain(fakeChatMessageWithUser);

        // needed, because while it removes it correctly from the properties, it does not remove it from the HTML
        fixture.detectChanges();
        expect(fixture.debugElement.queryAll(By.css('.chat-message-div')).length).toBe(0);
    });

    test('user settings should take effect (default font size)', () => {
        const elem = component.chatWindowElement?.nativeElement as HTMLDivElement;

        // twice, once in ngOnInit and once in ngAfterViewInit
        expect(settingsSubjectSpy).toHaveBeenCalledTimes(2);
        // or
        // expect(settingsSubjectSpy.mock.calls.length).toBe(2);

        expect(component.embedYouTubeVideos).toBeTruthy();
        expect(elem.classList.contains('text-xs')).toBeTruthy();
        expect(elem.classList.contains('md:text-base')).toBeTruthy();
        // only check one of them, because all get removed anyway
        expect(elem.classList.contains('text-sm')).toBeFalsy();
    });

    test('user settings should take effect (not default font size)', () => {
        const settings = {
            settings_id: -1,
            user_id: -1,
            filter: 'filter',
            font_size: 'text-2xl',
            embed_yt_videos: true,
        };
        settingsSubjectSpy.mockClear();
        userServiceSettingsMock.currentUserSettingsSubject$.next(settings);

        const elem = component.chatWindowElement?.nativeElement as HTMLDivElement;

        component.ngAfterViewInit();

        // only once in ngAfterViewInit
        expect(settingsSubjectSpy).toHaveBeenCalledTimes(1);

        expect(elem.classList.contains(settings.font_size)).toBeTruthy();
        // only check one of them, because all get removed anyway
        expect(elem.classList.contains('text-xs')).toBeFalsy();
    });

    test('user settings subscriptions are unsubscribed', () => {
        component.ngOnDestroy();
        expect(component.currentUserSettingsSubscription?.closed).toBeTruthy();
        expect(component.currentUserSettingsSubscriptionEmbedFilter?.closed).toBeTruthy();
    });

    test('scrolls up fetches new messages and updates cursor', () => {});
});
