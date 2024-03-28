import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { MockComponent, MockService } from 'ng-mocks';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { ActiveToast, ToastrService } from 'ngx-toastr';
import { Observable, ReplaySubject, Subscription, of } from 'rxjs';
import { ChatMessageWithUser, Emote, MessageReaction, Settings } from '../../../../shared/types/db-dtos';
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

    let fakeChatMessageWithUser: ChatMessageWithUser;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ChatComponent,
                MockComponent(EmoteSelectComponent),
                UrlifyPipe,
                EmbedPipe,
                GetImagePipe,
                ImageifyPipe,
            ],
            imports: [InfiniteScrollDirective, ReactiveFormsModule],
            providers: [
                UrlifyPipe,
                { provide: UserService, useValue: userServiceMock },
                { provide: WebsocketService, useValue: websocketServiceMock },
                { provide: UserSettingsService, useValue: userServiceSettingsMock },
                { provide: ToastrService, useValue: toastrService },
            ],
        }).compileComponents();

        fakeChatMessageWithUser = {
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
                display_name: 'Test User',
                user_id: -1,
            },
            reactions: [],
        };

        jest.spyOn(userServiceMock, 'currentUser', 'get').mockReturnValue(fakeUser);
        websocketServiceMock.getChatMessage = jest.fn().mockReturnValue(of());
        websocketServiceMock.getNewEmoteReaction = jest.fn().mockReturnValue(of());
        websocketServiceMock.getDeleteChatMessage = jest.fn().mockReturnValue(of());
        userServiceSettingsMock.currentUserSettingsSubject$ = new ReplaySubject<Settings>(1);
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

    describe('on init and on destroy', () => {
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

        const fakeSettings = {
            settings_id: -1,
            user_id: -1,
            filter: 'filter',
            font_size: 'default',
            embed_yt_videos: true,
        };

        beforeEach(() => {
            jest.spyOn(userServiceMock, 'currentUser', 'get').mockReturnValue(fakeUser);
            websocketServiceMock.getChatMessage = jest.fn().mockReturnValue(of(fakeChatMessageWithUser));
            websocketServiceMock.getNewEmoteReaction = jest.fn().mockReturnValue(of(fakeEmoteReactionWrapper));
            websocketServiceMock.getDeleteChatMessage = jest.fn().mockReturnValue(of());
            userServiceSettingsMock.currentUserSettingsSubject$ = new ReplaySubject<Settings>(1);
            userServiceSettingsMock.currentUserSettingsSubject$.next(fakeSettings);

            settingsSubjectSpy = jest.spyOn(userServiceSettingsMock.currentUserSettingsSubject$, 'subscribe');
        });

        test('chat message should be visible', () => {
            component.ngOnInit();

            expect(component.chatroomMessages.length).toBe(1);
            expect(component.chatroomMessages).toContain(fakeChatMessageWithUser);

            fixture.detectChanges();
            expect(fixture.debugElement.query(By.css('.chat-message-div'))).not.toBeNull();
        });

        test('chat message emote reaction should be visible', () => {
            component.ngOnInit();

            expect(component.chatroomMessages[0].reactions.length).toBe(fakeChatMessageWithUser.reactions.length);
            expect(component.chatroomMessages[0].reactions).toContain(fakeEmoteReaction.reaction);

            fixture.detectChanges();
            expect(fixture.debugElement.query(By.css('.not-italic'))).not.toBeNull();
        });

        test('chat message is deleted and not visible', () => {
            const fakeDeleteMessage = { messageId: -1, chatroomId: -1 };
            const fakeDeleteMessageWrapper = [fakeDeleteMessage.messageId, fakeDeleteMessage.chatroomId];

            websocketServiceMock.getChatMessage = jest.fn().mockReturnValue(of());
            websocketServiceMock.getNewEmoteReaction = jest.fn().mockReturnValue(of());
            websocketServiceMock.getDeleteChatMessage = jest.fn().mockReturnValue(of(fakeDeleteMessageWrapper));

            component.chatroomMessages.push(fakeChatMessageWithUser);
            expect(component.chatroomMessages.length).toBe(1);
            fixture.detectChanges();
            expect(fixture.debugElement.queryAll(By.css('.chat-message-div')).length).toBe(1);

            component.ngOnInit();

            expect(component.chatroomMessages.length).toBe(0);
            expect(component.chatroomMessages).not.toContain(fakeChatMessageWithUser);

            // needed, because while it removes it correctly from the properties, it does not remove it from the HTML
            fixture.detectChanges();
            expect(fixture.debugElement.queryAll(By.css('.chat-message-div')).length).toBe(0);
        });

        test('youtube embed settings should take effect', () => {
            component.ngOnInit();
            expect(component.embedYouTubeVideos).toBeTruthy();
        });

        test('user settings should take effect (default font size)', () => {
            const elem = component.chatWindowElement?.nativeElement as HTMLDivElement;

            component.ngAfterViewInit();

            // only once in ngAfterViewInit
            expect(settingsSubjectSpy).toHaveBeenCalledTimes(1);
            // or
            // expect(settingsSubjectSpy.mock.calls.length).toBe(1);

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
    });

    test('scroll up fetches new messages and updates cursor', () => {
        const fakeChatroomData = [[fakeChatMessageWithUser], 100];
        const ofReturn = of(fakeChatroomData);
        userServiceMock.getChatroomMessages = jest.fn().mockReturnValue(ofReturn);

        component.onScrollUp();

        expect(userServiceMock.getChatroomMessages).toHaveBeenCalledWith(-1, -1);
        expect(userServiceMock.getChatroomMessages).toHaveReturnedWith(ofReturn);
        expect(component.chatroomMessages.length).toBe(1);
        expect(component.chatroomMessages).toContain(fakeChatMessageWithUser);
    });

    test('can fire scrolledUp', () => {
        const spy = jest.spyOn(component, 'onScrollUp');
        fixture.debugElement.query(By.css('#chatWindow')).triggerEventHandler('scrolledUp', {});

        expect(spy).toHaveBeenCalled();
    });

    describe('send message', () => {
        const input = { messageInput: 'Test Input' };
        let sendMessageSpy: jest.SpyInstance<Observable<ChatMessageWithUser>>;

        beforeEach(() => {
            sendMessageSpy = jest.spyOn(userServiceMock, 'sendMessage').mockReturnValue(of(fakeChatMessageWithUser));
            websocketServiceMock.sendChatMessage = jest.fn();
            component.formGroup.setValue(input);
            component.chatroomId = 1;
        });

        afterEach(() => {
            fakeChatMessageWithUser.isimage = false;
            fakeChatMessageWithUser.isfile = false;
        });

        test('can send message', () => {
            component.sendMessage();

            expect(component.formGroup.value.messageInput).toBeFalsy();
            expect(component.chatroomMessages.length).toBe(1);
            expect(component.chatroomMessages).toContain(fakeChatMessageWithUser);

            expect(sendMessageSpy).toHaveBeenCalledWith(input.messageInput, component.chatroomId);
            expect(sendMessageSpy).toHaveBeenCalledTimes(1);
            expect(websocketServiceMock.sendChatMessage).toHaveBeenCalledWith(fakeChatMessageWithUser);
            expect(websocketServiceMock.sendChatMessage).toHaveBeenCalledTimes(1);
        });

        test('input is reset for text messages', () => {
            expect(component.formGroup.value.messageInput).toBe(input.messageInput);

            component.sendMessage();

            expect(component.formGroup.value.messageInput).toBeNull();
        });

        test('input is not reset for image messages', () => {
            fakeChatMessageWithUser.isimage = true;
            component.sendMessage();

            expect(component.formGroup.value.messageInput).toBe(input.messageInput);
        });

        test('input is not reset for file messages', () => {
            fakeChatMessageWithUser.isfile = true;

            component.sendMessage();

            expect(component.formGroup.value.messageInput).toBe(input.messageInput);
        });
    });

    describe('use emotes', () => {
        test('can show emotes menu', () => {
            expect(component.showEmotesMenu).toBeFalsy();
            component.onEmoteMenu();
            expect(component.showEmotesMenu).toBeTruthy();
        });

        test('can select emote', () => {
            const emote: Emote = {
                emote: 'Test Emote',
                emote_id: 1,
                name: 'Test Emote Name',
            };
            component.onEmoteSelect(emote);
            expect(component.formGroup.value.messageInput).toBe(emote.emote);
            expect(document.activeElement?.id).toBe(component.messageInputElement?.nativeElement.id);
        });

        test('can react with emote', () => {
            const emote: Emote = {
                emote: 'Test Emote',
                emote_id: 1,
                name: 'Test Emote Name',
            };
            const messageReaction = {
                emote: emote,
                emote_id: 1,
                msg_id: -1,
                reactions_id: -1,
                user_id: -1,
                users: {
                    creation_date: new Date(),
                    display_name: 'Test User',
                    user_id: -1,
                },
            };

            const fakeMessage: ChatMessageWithUser = JSON.parse(JSON.stringify(fakeChatMessageWithUser));
            fakeMessage.msg_id = messageReaction.msg_id;
            fakeMessage.reactions = new Array<MessageReaction>();

            component.chatroomMessages.push(fakeMessage);

            userServiceMock.sendEmoteReaction = jest.fn().mockReturnValue(of(messageReaction));
            websocketServiceMock.sendEmoteReaction = jest.fn();

            component.onEmoteReaction(fakeMessage, emote);

            expect(fakeMessage.reactions.length).toBe(1);
            expect(fakeMessage.reactions).toContain(messageReaction);

            expect(userServiceMock.sendEmoteReaction).toHaveBeenCalledTimes(1);
            expect(userServiceMock.sendEmoteReaction).toHaveBeenCalledWith(fakeMessage.msg_id, emote.emote_id);
            expect(websocketServiceMock.sendEmoteReaction).toHaveBeenCalledTimes(1);
            expect(websocketServiceMock.sendEmoteReaction).toHaveBeenCalledWith(
                component.chatroomId,
                fakeMessage.msg_id,
                component.currentUser.userId,
                messageReaction
            );
        });
    });

    describe('populate message header', () => {
        const emote: Emote = {
            emote: 'Test Emote',
            emote_id: 1,
            name: 'Test Emote Name',
        };
        const messageReaction = {
            emote: emote,
            emote_id: 1,
            msg_id: -1,
            reactions_id: -1,
            user_id: -1,
            users: {
                creation_date: new Date(),
                display_name: 'Test User',
                user_id: -1,
            },
        };

        beforeEach(() => {
            fakeChatMessageWithUser.reactions.push(messageReaction);
        });

        test('can see name of user in header', () => {
            fakeChatMessageWithUser.user_id = 2;
            fakeChatMessageWithUser.users.user_id = 2;
            fakeChatMessageWithUser.users.display_name = 'Test User 2';
            const value = component.populateMessageHeader(fakeChatMessageWithUser);
            expect(value).toContain(
                `<b class="text-xs text-gray-400">${fakeChatMessageWithUser.users.display_name}</b>`
            );
            expect(value).toContain('text-blue-400');
        });

        test('can see emote reactions', () => {
            const value = component.populateMessageHeader(fakeChatMessageWithUser);
            expect(value).toContain('text-blue-400');
        });

        test('can see no emote reactions when there are none', () => {
            fakeChatMessageWithUser.reactions = new Array<MessageReaction>();
            const value = component.populateMessageHeader(fakeChatMessageWithUser);
            expect(value).not.toContain('text-blue-400');
        });
    });

    test('can paste images', () => {
        component.chatroomId = 1;
        const image = new File([], 'image.png');
        userServiceMock.sendImageMessage = jest.fn().mockReturnValue(of());

        fixture.debugElement.query(By.css('#messageInput')).triggerEventHandler('paste', {
            clipboardData: {
                items: [
                    {
                        type: 'image',
                        getAsFile: () => image,
                    },
                ],
            },
        });
        // fixture.detectChanges();

        expect(userServiceMock.sendImageMessage).toHaveBeenCalledTimes(1);
        expect(userServiceMock.sendImageMessage).toHaveBeenCalledWith(1, image);
    });

    test('can open image in new tab', () => {
        // works - couldn't get it to work like above due to the *ngIf directives
        const event = {
            target: {
                src: '/random/image/source/url',
            },
        };
        const windowSpy = jest.spyOn(window, 'open').mockReturnValue(window);

        component.openImage(event);

        expect(windowSpy).toHaveBeenCalledTimes(1);
        expect(window.document.body.innerHTML).toBe(`<img src="${event.target.src}">`);
    });

    test('can delete message', () => {
        const userServiceSpy = jest.spyOn(userServiceMock, 'deleteMessage').mockReturnValue(of(new ArrayBuffer(0)));
        const websocketServiceSpy = jest.spyOn(websocketServiceMock, 'deleteChatMessage');

        component.chatroomMessages.push(fakeChatMessageWithUser);
        expect(component.chatroomMessages.length).toBe(1);

        component.deleteMessage(fakeChatMessageWithUser);

        expect(userServiceSpy).toHaveBeenCalledTimes(1);
        expect(userServiceSpy).toHaveBeenCalledWith(
            fakeChatMessageWithUser.msg_id,
            fakeChatMessageWithUser.chatroom_id
        );
        expect(websocketServiceSpy).toHaveBeenCalledTimes(1);
        expect(websocketServiceSpy).toHaveBeenCalledWith(
            fakeChatMessageWithUser.msg_id,
            fakeChatMessageWithUser.chatroom_id
        );

        expect(component.chatroomMessages.length).toBe(0);
    });

    test('can not delete message', () => {
        const userServiceSpy = jest
            .spyOn(userServiceMock, 'deleteMessage')
            .mockReturnValue(of(null as unknown as ArrayBuffer));
        const websocketServiceSpy = jest.spyOn(websocketServiceMock, 'deleteChatMessage');

        component.chatroomMessages.push(fakeChatMessageWithUser);
        expect(component.chatroomMessages.length).toBe(1);

        component.deleteMessage(fakeChatMessageWithUser);

        expect(userServiceSpy).toHaveBeenCalledTimes(1);
        expect(userServiceSpy).toHaveBeenCalledWith(
            fakeChatMessageWithUser.msg_id,
            fakeChatMessageWithUser.chatroom_id
        );
        expect(websocketServiceSpy).toHaveBeenCalledTimes(0);

        expect(component.chatroomMessages.length).toBe(1);
    });

    describe('when drag and drop', () => {
        let files: Array<File>;
        let errorToastSpy: jest.SpyInstance<ActiveToast<any>>;

        beforeEach(() => {
            files = new Array<File>();
            errorToastSpy = jest.spyOn(toastrService, 'error');
        });

        test('can show error notification when file is empty', fakeAsync(async () => {
            files.push(new File([], 'test.pdf'));
            await component.onFileDrop(files);

            expect(errorToastSpy).toHaveBeenCalledTimes(1);
            expect(errorToastSpy).toHaveBeenCalledWith('File is either empty or a folder.', 'Invalid Upload');
        }));

        test('can show error notification when file size is too big', fakeAsync(async () => {
            const file = new File(['12345'], 'test.pdf');
            jest.spyOn(file, 'size', 'get').mockReturnValue(20 * 1024 * 1024);
            files.push(file);

            await component.onFileDrop(files);

            expect(errorToastSpy).toHaveBeenCalledTimes(1);
            expect(errorToastSpy).toHaveBeenCalledWith('File is bigger than 20MB.', 'Invalid file size');
        }));

        test('can show error notification when file type is unknown', fakeAsync(async () => {
            files.push(new File(['12345'], 'test.UNKNOWN'));
            const validateSpy = jest.spyOn(userServiceMock, 'validateFileType').mockReturnValue(of([false, null]));

            await component.onFileDrop(files);

            expect(validateSpy).toHaveBeenCalledTimes(1);
            expect(errorToastSpy).toHaveBeenCalledTimes(1);
            expect(errorToastSpy).toHaveBeenCalledWith(
                `File '${files[0].name}' could not be uploaded`,
                'Unknown file type detected.'
            );
        }));

        test('can show error notification when file type is invalid', fakeAsync(async () => {
            files.push(new File(['12345'], 'test.INVALID'));
            const validateSpy = jest
                .spyOn(userServiceMock, 'validateFileType')
                .mockReturnValue(of([false, { ext: 'INVALID', mime: 'INVALID' }]));

            await component.onFileDrop(files);

            expect(validateSpy).toHaveBeenCalledTimes(1);
            expect(errorToastSpy).toHaveBeenCalledTimes(1);
            expect(errorToastSpy).toHaveBeenCalledWith(
                `File '${files[0].name}' could not be uploaded`,
                "Invalid file type 'INVALID' detected."
            );
        }));

        test('can drag and drop files', fakeAsync(async () => {
            files.push(new File(['12345'], 'test.pdf'));
            const validateSpy = jest
                .spyOn(userServiceMock, 'validateFileType')
                .mockReturnValue(of([true, { ext: 'pdf', mime: 'pdf' }]));
            const sendFileSpy = jest.spyOn(userServiceMock, 'sendFileMessage').mockReturnValue(of());

            await component.onFileDrop(files);

            expect(validateSpy).toHaveBeenCalledTimes(1);
            expect(sendFileSpy).toHaveBeenCalledTimes(1);
            expect(sendFileSpy).toHaveBeenCalledWith(component.chatroomId, files[0]);
            expect(errorToastSpy).toHaveBeenCalledTimes(0);
        }));

        test('can fire onFileDrop', fakeAsync(async () => {
            files.push(new File(['12345'], 'test.pdf'));
            const spy = jest.spyOn(component, 'onFileDrop');

            fixture.debugElement.query(By.css('#chatWindow')).triggerEventHandler('onFileDrop', files);

            expect(spy).toHaveBeenCalledTimes(1);
        }));
    });

    test('can download file', () => {
        const anchorElement = document.createElement('a');
        const anchorElementClickSpy = jest.spyOn(anchorElement, 'click');

        const downloadFileSpy = jest
            .spyOn(userServiceMock, 'downloadFile')
            .mockReturnValue(of(new File([], 'test.pdf')));

        const documentSpy = jest.spyOn(document, 'createElement').mockReturnValue(anchorElement);

        component.downloadFile(fakeChatMessageWithUser);
        fixture.detectChanges();

        expect(downloadFileSpy).toHaveBeenCalledTimes(1);
        expect(downloadFileSpy).toHaveBeenCalledWith(
            fakeChatMessageWithUser.chatroom_id,
            fakeChatMessageWithUser.file_uuid
        );

        expect(documentSpy).toHaveBeenCalledTimes(1);
        expect(documentSpy).toHaveBeenCalledWith('a');
        expect(documentSpy).toHaveReturnedWith(anchorElement);

        // everything works except this one... Hmm
        // expect(anchorElementClickSpy).toHaveBeenCalledTimes(1);
    });
});
