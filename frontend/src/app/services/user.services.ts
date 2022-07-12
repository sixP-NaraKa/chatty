import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import config from "src/environments/config";
import { settings, ChatMessageWithUser, ChatroomWithMessages, ChatRoomWithParticipantsExceptSelf, User, emote } from "../../../../shared/types/db-dtos";
import { ApplicationUser, AuthService } from "../auth/auth.service";

@Injectable({
    providedIn: 'root'
})
export class UserService {

    backendHost: string;
    constructor(private authService: AuthService, private http: HttpClient) {
        this.backendHost = config.BACKEND_HOST;
    }

    public get currentUser() : ApplicationUser {
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

    getUserSettings(userId: number): Observable<settings> {
        return this.http.get<settings>(`${this.backendHost}/api/user/settings?user_id=${userId}`);
    }

    getRegisteredUsers(userId: number) {
        return this.http.get<User[]>(`${this.backendHost}/api/user/users?user_id=${userId}`);
    }

    getChatroomsForUserWithParticipantsExceptSelf(userId: number): Observable<ChatRoomWithParticipantsExceptSelf[]> {
        return this.http.get<ChatRoomWithParticipantsExceptSelf[]>(`${this.backendHost}/api/user/chatrooms?user_id=${userId}`);
    }

    getSingleChatroomForUserWithUserIdAndParticipantUserId(userId: number, participantUserId: number): Observable<ChatRoomWithParticipantsExceptSelf> {
        return this.http.get<ChatRoomWithParticipantsExceptSelf>(`${this.backendHost}/api/user/chatroom/1on1?user_id=${userId}&participant_user_id=${participantUserId}`)
    }

    getSingleChatroomForUserWithParticipantsExceptSelf(userId: number, chatroomId: number) {
        return this.http.get<ChatRoomWithParticipantsExceptSelf>(`${this.backendHost}/api/user/chatroom?user_id=${userId}&chatroom_id=${chatroomId}`);
    }

    createChatroom(userId: number, participantUserIds: number | number[], is_group: boolean = false, groupName?: string | null) {
        return this.http.get<ChatRoomWithParticipantsExceptSelf>(`${this.backendHost}/api/user/chatrooms/create?user_id=${userId}&participant_user_id=${participantUserIds}&is_group=${is_group}&group_name=${groupName}`);
    }

    getChatroomMessages(chatroomId: number, userId: number): Observable<ChatroomWithMessages> {
        return this.http.get<ChatroomWithMessages>(`${this.backendHost}/api/chat/chatmessages?chatroom_id=${chatroomId}&user_id=${userId}`);
    }

    getChatroomMessagesCount(chatroomId: number, userId: number): Observable<number> {
        return this.http.get<number>(`${this.backendHost}/api/chat/chatmessages/count?chatroom_id=${chatroomId}&user_id=${userId}`);
    }

    getAvailableEmotes(userId: number): Observable<emote[]> {
        return this.http.get<emote[]>(`${this.backendHost}/api/emotes?user_id=${userId}`);
    }

    /* INSERTING / EDITING OF DATA */
    
    updateUserSettings(userSettings: settings) {
        this.http.post<any>(`${this.backendHost}/api/user/update/settings?user_id=${userSettings.user_id}`, userSettings).subscribe(); // no-op
    }

    sendMessage(message: string, userId: number, chatroomId: number): Observable<ChatMessageWithUser> {
        return this.http.post<ChatMessageWithUser>(`${this.backendHost}/api/chat/create/chatmessage?user_id=${userId}`, { message: message, userId: userId, chatroomId: chatroomId });
    }

    removeUserFromGroupChat(userId: number, userIdToRemove: number, chatroomId: number): Observable<number> {
        return this.http.post<number>(`${this.backendHost}/api/user/chatrooms/groups/remove?user_id=${userId}`, { userId: userIdToRemove, chatroomId: chatroomId });
    }

    addUsersToGroupChat(userId: number, userIdsToAdd: number | number[], chatroomId: number): Observable<void> {
        return this.http.get<void>(`${this.backendHost}/api/user/chatrooms/groups/add?user_id=${userId}&userIdsToAdd=${userIdsToAdd}&chatroomId=${chatroomId}`);
    }

}