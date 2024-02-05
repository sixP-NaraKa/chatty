import { Pipe, PipeTransform } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { ChatMessageWithUser } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';

@Pipe({
    name: 'getimage',
})
export class GetImagePipe implements PipeTransform {
    constructor(private readonly userService: UserService) {}

    transform(value: ChatMessageWithUser, ...args: unknown[]): Observable<Blob> {
        if (!value.isimage) return EMPTY;
        return this.getimage(value);
    }

    /**
     * Fetches the image for the given chat message based on the UUID of the image.
     * Returns the innerHTML as an <img> tag to show the image.
     *
     * @param message the message
     */
    private getimage(message: ChatMessageWithUser): Observable<Blob> {
        return this.userService.getChatroomImageMessage(message.chatroom_id, message.msg_content);
    }
}
