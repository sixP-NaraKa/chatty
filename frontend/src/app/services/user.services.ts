import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ChatMessageWithUser, ChatroomWithMessages, ChatRoomWithParticipantsExceptSelf, User } from "../../../../shared/types/db-dtos";
import { ApplicationUser, AuthService } from "../auth/auth.service";

@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(private authService: AuthService, private http: HttpClient) { }

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
        return this.http.post<User>("http://192.168.178.33:3100/auth/create", { username: username, password: password });
    }

    /* FETCHING OF DATA */

    getRegisteredUsers(userId: number) {
        return this.http.get<User[]>(`http://192.168.178.33:3100/api/user/users?user_id=${userId}`);
    }

    getChatroomsForUserWithParticipantsExceptSelf(userId: number): Observable<ChatRoomWithParticipantsExceptSelf[]> {
        return this.http.get<ChatRoomWithParticipantsExceptSelf[]>(`http://192.168.178.33:3100/api/user/chatrooms?user_id=${userId}`);
    }

    getSingleChatroomForUserWithUserIdAndParticipantUserId(userId: number, participantUserId: number): Observable<ChatRoomWithParticipantsExceptSelf> {
        return this.http.get<ChatRoomWithParticipantsExceptSelf>(`http://192.168.178.33:3100/api/user/chatroom/1on1?user_id=${userId}&participant_user_id=${participantUserId}`)
    }

    getSingleChatroomForUserWithParticipantsExceptSelf(userId: number, chatroomId: number) {
        return this.http.get<ChatRoomWithParticipantsExceptSelf>(`http://192.168.178.33:3100/api/user/chatroom?user_id=${userId}&chatroom_id=${chatroomId}`);
    }

    create1on1Chatroom(userId: number, participantUserId: number) {
        return this.http.get<ChatRoomWithParticipantsExceptSelf>(`http://192.168.178.33:3100/api/user/chatrooms/create?user_id=${userId}&participant_user_id=${participantUserId}`);
    }

    getChatroomMessages(chatroomId: number, userId: number): Observable<ChatroomWithMessages> {
        return this.http.get<ChatroomWithMessages>(`http://192.168.178.33:3100/api/chat/chatmessages?chatroom_id=${chatroomId}&user_id=${userId}`);
    }

    getChatroomMessagesCount(chatroomId: number, userId: number): Observable<number> {
        return this.http.get<number>(`http://192.168.178.33:3100/api/chat/chatmessages/count?chatroom_id=${chatroomId}&user_id=${userId}`);
    }

    /* INSERTING OF DATA */
    
    sendMessage(message: string, userId: number, chatroomId: number): Observable<ChatMessageWithUser> {
        return this.http.post<ChatMessageWithUser>(`http://192.168.178.33:3100/api/chat/create/chatmessage?user_id=${userId}`, { message: message, userId: userId, chatroomId: chatroomId });
    }

}