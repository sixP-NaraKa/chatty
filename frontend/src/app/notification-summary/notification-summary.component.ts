import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { Notification } from '../../../../shared/types/db-dtos';
import { NotificationService } from '../services/notification.service';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-notification-summary',
    templateUrl: './notification-summary.component.html',
    styleUrls: ['./notification-summary.component.scss']
})
export class NotificationSummaryComponent implements OnInit {

    unreadSubscription: Subscription;

    @Output()
    notificationCounterEvent = new EventEmitter<number>();

    notificationCounter = 0;

    unreadNotifications = new Array<Notification>();

    constructor(private userService: UserService, private notificationService: NotificationService) {
        // get all notifications which were previously saved upon start
        this.notificationService.getAllNotificationsForUser(this.userService.currentUser.userId).subscribe(notifs => {
            this.unreadNotifications = this.unreadNotifications.concat(notifs);
            this.notificationCounter = this.unreadNotifications.length;
            this.notificationCounterEvent.emit(this.notificationCounter);
        });

        // subscribe to the Observable to get new notifications during runtime
        this.unreadSubscription = this.notificationService.unreadNotification$.subscribe(unreadNotif => {
            this.notificationCounter++;
            this.notificationCounterEvent.emit(this.notificationCounter);
            this.unreadNotifications.push(unreadNotif);
        });
    }

    ngOnInit(): void {
    }

    ngOnDestroy() {
        this.unreadSubscription.unsubscribe();
    }

}
