import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import config from 'src/environments/config';
import { Notification, notifications } from '../../../../shared/types/db-dtos';


@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private unreadNotificationSource = new Subject<notifications>();

    public unreadNotification$ = this.unreadNotificationSource.asObservable();

    backendHost: string;
    constructor(private http: HttpClient) {
        this.backendHost = config.BACKEND_HOST;
    }

    newUnread(notif: notifications) {
        this.unreadNotificationSource.next(notif);
    }

    getAllNotificationsForUser(userId: number) {
        return this.http.get<Notification[]>(`${this.backendHost}/api/user/notifications?user_id=${userId}`);
    }

    insertNewNotification(userId: number, originatedFrom: number, chatroomId: number, type: string, content: string) {
        return this.http.post<Notification>(`${this.backendHost}/api/user/notifications/new?user_id=${userId}`, { userId: userId, originatedFrom: originatedFrom, chatroomId: chatroomId, type: type, content: content });
    }

}