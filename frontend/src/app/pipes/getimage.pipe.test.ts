import { EMPTY, of } from 'rxjs';
import { UserService } from '../services/user.services';
import { GetImagePipe } from './getimage.pipe';
import { TestBed, fakeAsync } from '@angular/core/testing';
import { ChatMessageWithUser } from '../../../../shared/types/db-dtos';

describe('GetImagePipe', () => {
    let userService: UserService;

    const blob: Blob = new File([], 'image.png');
    const userServiceSpy = {
        getChatroomImageMessage: jest.fn().mockReturnValue(of(blob)),
    };

    const data: ChatMessageWithUser = {
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
        reactions: [
            {
                emote: {
                    emote: '',
                    emote_id: -1,
                    name: '',
                },
                emote_id: -1,
                msg_id: -1,
                reactions_id: -1,
                user_id: -1,
                users: {
                    creation_date: new Date(),
                    display_name: 'Test',
                    user_id: -1,
                },
            },
        ],
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: UserService, useValue: userServiceSpy }],
        });
        userService = TestBed.inject(UserService);
    });

    afterEach(async () => {
        jest.clearAllMocks();
    });

    test('create an instance', () => {
        const pipe = new GetImagePipe(userService);
        expect(pipe).toBeTruthy();
    });

    test('return EMPTY', () => {
        const pipe = new GetImagePipe(userService);
        data.isimage = false;
        expect(pipe.transform(data)).toBe(EMPTY);
    });

    test('return blob', () => {
        const pipe = new GetImagePipe(userService);
        data.isimage = true;
        pipe.transform(data).subscribe((value) => expect(value).toBe(blob));
        expect(userServiceSpy.getChatroomImageMessage).toBeCalledTimes(1);
    });
});
