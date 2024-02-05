import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import config from 'src/environments/config';
import {
    Settings,
    ChatMessageWithUser,
    ChatRoomWithParticipantsExceptSelf,
    User,
    Emote,
    MessageReaction,
} from '../../../../shared/types/db-dtos';
import { ApplicationUser, AuthService } from '../auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    backendHost: string;
    constructor(private authService: AuthService, private http: HttpClient) {
        this.backendHost = config.BACKEND_HOST;
    }

    public get currentUser(): ApplicationUser {
        return this.authService.currentUserValue;
    }

    /* LOGIN */

    login(username: string, password: string): Observable<ApplicationUser> {
        return this.authService.login(username, password);
    }

    logout(): void {
        this.authService.logout();
    }

    isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }

    /* REGISTRATION */

    register(username: string, password: string): Observable<User> {
        return this.http.post<User>(`${this.backendHost}/auth/create`, { username: username, password: password });
    }

    /* FETCHING OF DATA */

    getUserSettings(): Observable<Settings> {
        return this.http.get<Settings>(`${this.backendHost}/api/user/settings`);
    }

    getRegisteredUsers() {
        return this.http.get<User[]>(`${this.backendHost}/api/user/users`);
    }

    getChatroomsForUserWithParticipantsExceptSelf(): Observable<ChatRoomWithParticipantsExceptSelf[]> {
        return this.http.get<ChatRoomWithParticipantsExceptSelf[]>(`${this.backendHost}/api/user/chatrooms`);
    }

    getSingleChatroomForUserWithUserIdAndParticipantUserId(
        participantUserId: number
    ): Observable<ChatRoomWithParticipantsExceptSelf> {
        return this.http.get<ChatRoomWithParticipantsExceptSelf>(
            `${this.backendHost}/api/user/chatroom/1on1?participant_user_id=${participantUserId}`
        );
    }

    getSingleChatroomForUserWithParticipantsExceptSelf(chatroomId: number) {
        return this.http.get<ChatRoomWithParticipantsExceptSelf>(
            `${this.backendHost}/api/user/chatroom?chatroomId=${chatroomId}`
        );
    }

    createChatroom(participantUserIds: number | number[], is_group: boolean = false, groupName?: string | null) {
        return this.http.get<ChatRoomWithParticipantsExceptSelf>(
            `${this.backendHost}/api/user/chatrooms/create?participant_user_id=${participantUserIds}&is_group=${is_group}&group_name=${groupName}`
        );
    }

    getChatroomMessages(
        chatroomId: number,
        oldCursor: number | undefined | null
    ): Observable<[ChatMessageWithUser[], number]> {
        return this.http.get<[ChatMessageWithUser[], number]>(
            `${this.backendHost}/api/chat/chatmessages?chatroomId=${chatroomId}&oldCursor=${oldCursor}`
        );
    }

    getChatroomImageMessage(chatroomId: number, imageId: string): Observable<Blob> {
        return this.http.get(`${this.backendHost}/api/chat/chatimage?chatroomId=${chatroomId}&imageId=${imageId}`, {
            responseType: 'blob',
        });
    }

    downloadFile(chatroomId: number, fileId: string): Observable<Blob> {
        return this.http.get(`${this.backendHost}/api/chat/chatfile?chatroomId=${chatroomId}&fileId=${fileId}`, {
            responseType: 'blob',
        });
    }

    getChatroomMessagesCount(chatroomId: number): Observable<number> {
        return this.http.get<number>(`${this.backendHost}/api/chat/chatmessages/count?chatroomId=${chatroomId}`);
    }

    getAvailableEmotes(): Observable<Emote[]> {
        return this.http.get<Emote[]>(`${this.backendHost}/api/emotes`);
    }

    /* INSERTING / EDITING OF DATA */

    updateUserSettings(userSettings: Settings) {
        this.http.post<any>(`${this.backendHost}/api/user/update/settings`, userSettings).subscribe(); // no-op
    }

    sendMessage(message: string, chatroomId: number): Observable<ChatMessageWithUser> {
        return this.http.post<ChatMessageWithUser>(`${this.backendHost}/api/chat/create/chatmessage`, {
            message: message,
            userId: this.currentUser.userId,
            chatroomId: chatroomId,
        });
    }

    sendImageMessage(chatroomId: number, image: File): Observable<ChatMessageWithUser> {
        const formData = new FormData();
        formData.append('image', image);
        return this.http.post<ChatMessageWithUser>(
            `${this.backendHost}/api/chat/create/chatimagemessage?chatroomId=${chatroomId}`,
            formData
        );
    }

    sendFileMessage(chatroomId: number, file: File): Observable<ChatMessageWithUser> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<ChatMessageWithUser>(
            `${this.backendHost}/api/chat/create/chatfilemessage?chatroomId=${chatroomId}`,
            formData
        );
    }

    sendEmoteReaction(messageId: number, emoteId: number) {
        return this.http.post<MessageReaction>(`${this.backendHost}/api/chat/create/chatmessage/reaction`, {
            messageId: messageId,
            userId: this.currentUser.userId,
            emoteId: emoteId,
        });
    }

    removeUserFromGroupChat(userIdToRemove: number, chatroomId: number): Observable<number> {
        return this.http.post<number>(`${this.backendHost}/api/user/chatrooms/groups/remove`, {
            userId: userIdToRemove,
            chatroomId: chatroomId,
        });
    }

    addUsersToGroupChat(userIdsToAdd: number | number[], chatroomId: number): Observable<void> {
        return this.http.get<void>(
            `${this.backendHost}/api/user/chatrooms/groups/add?userIdsToAdd=${userIdsToAdd}&chatroomId=${chatroomId}`
        );
    }

    /* DELETION OF DATA */

    deleteMessage(messageId: number, chatroomId: number): Observable<ArrayBuffer> {
        return this.http.delete<ArrayBuffer>(`${this.backendHost}/api/chat/delete/chatmessage`, {
            body: { messageId: messageId, userId: this.currentUser.userId, chatroomId: chatroomId },
        });
    }

    /* UTILS (FILE TYPE VALIDATION, ...) */

    validateFileType(blob: Blob): Observable<[boolean, { ext: any; mime: any } | null]> {
        const formData = new FormData();
        formData.append('file', blob);
        return this.http.post<[boolean, { ext: any; mime: any } | null]>(
            `${this.backendHost}/api/file/validate`,
            formData
        );
    }
}
