import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UnreadNotification } from 'src/services/notification/types/unread-notification';
import { NotificationService } from '../services/notification.service';

@Component({
    selector: 'app-notification-summary',
    templateUrl: './notification-summary.component.html',
    styleUrls: ['./notification-summary.component.scss']
})
export class NotificationSummaryComponent implements OnInit {

    unreadSubscription: Subscription;

    notificationCounter = 0;

    unreadNotifications = new Array<UnreadNotification>();

    constructor(private notificationService: NotificationService) {
        this.unreadSubscription = this.notificationService.unreadNotification$.subscribe(unreadNotif => {
            this.notificationCounter++;
            this.unreadNotifications.push(unreadNotif);
        });
    }

    ngOnInit(): void {
    }

    ngOnDestroy() {
        this.unreadSubscription.unsubscribe();
    }

}
