import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { UnreadNotification } from 'src/services/notification/types/unread-notification';


@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private unreadNotificationSource = new Subject<UnreadNotification>();

    public unreadNotification$ = this.unreadNotificationSource.asObservable();

    newUnread(notif: UnreadNotification) {
        this.unreadNotificationSource.next(notif);
    }

}