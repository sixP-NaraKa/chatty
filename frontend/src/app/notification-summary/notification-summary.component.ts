import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Notification } from '../../../../shared/types/db-dtos';
import { NotificationService } from '../services/notification.service';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-notification-summary',
    templateUrl: './notification-summary.component.html',
    styleUrls: ['./notification-summary.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class NotificationSummaryComponent implements OnDestroy {
    unreadSubscription: Subscription;

    notificationCounter = 0;

    unreadNotifications = new Array<Notification>();

    constructor(private userService: UserService, private notificationService: NotificationService) {
        // get all notifications which were previously saved upon start
        this.notificationService.getAllNotificationsForUser().subscribe((notifs) => {
            this.unreadNotifications = this.unreadNotifications.concat(notifs);
            this.notificationCounter = this.unreadNotifications.length;
        });

        // subscribe to the Observable to get new notifications during runtime
        this.unreadSubscription = this.notificationService.unreadNotification$.subscribe((unreadNotif) => {
            this.notificationCounter++;
            this.unreadNotifications.push(unreadNotif);
        });
    }

    ngOnDestroy() {
        this.unreadSubscription.unsubscribe();
    }

    onNotificationDelete(notif: Notification) {
        this.notificationService.deleteNotification(notif.notification_id).subscribe((_) => {
            const idxOf = this.unreadNotifications.indexOf(notif);
            this.unreadNotifications.splice(idxOf, 1);
            this.notificationCounter--;
        });
    }

    /**
     * Helper function to populate some of the notification content.
     *
     * @param notif the notification
     * @returns the innerHTML string
     */
    populateNotificationContent(notif: Notification) {
        const date = new Date(notif.date);
        const time = date.toISOString().substr(11, 5);
        return `
            <span>${notif.content} <i title="${date}">(on ${time})</i></span>
        `;
    }
}
