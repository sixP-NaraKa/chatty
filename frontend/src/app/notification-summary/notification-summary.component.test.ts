import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent } from 'ng-mocks';
import { Subject, of } from 'rxjs';
import { DeepPartial } from 'utils/test';
import { Notification } from '../../../../shared/types/db-dtos';
import { NotificationService } from '../services/notification.service';
import { SliderComponent } from '../slider/slider.component';
import { NotificationSummaryComponent } from './notification-summary.component';

describe('NotificationSummaryComponent', () => {
    let component: NotificationSummaryComponent;
    let fixture: ComponentFixture<NotificationSummaryComponent>;

    const fakeNotifications: DeepPartial<Notification[]> = [
        // or DeepPartial<Notification>[]
        {
            chatrooms: {
                isgroup: true,
                name: 'Group Name',
            },
            originated_from_user: {
                display_name: 'From User Name',
            },
            type: 'message',
            content: 'Content',
            date: new Date(),
        },
    ];

    const subject = new Subject<Notification>();
    const notificationServiceMock: Partial<NotificationService> = {
        getAllNotificationsForUser: jest.fn().mockReturnValue(of(fakeNotifications)),
        unreadNotification$: subject.asObservable(),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [NotificationSummaryComponent, MockComponent(SliderComponent)],
            providers: [{ provide: NotificationService, useValue: notificationServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(NotificationSummaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(async () => {
        jest.clearAllMocks();
    });

    test('should be created', () => {
        expect(component).toBeTruthy();
    });

    test('should be getting all notifications for user', () => {
        expect(component.unreadNotifications).toHaveLength(fakeNotifications.length);
        expect(component.notificationCounter).toBe(fakeNotifications.length);
    });

    test('should be showing notifications', () => {
        fixture.detectChanges();

        expect(fixture.debugElement.queryAll(By.css('.contentToSlide > div'))).toHaveLength(1);
        expect(fixture.debugElement.query(By.css('.contentToSlide > div > p')).nativeElement.innerHTML).toBe(
            ' Group Name (message) '
        );
        expect(fixture.debugElement.query(By.css('.contentToSlide > div > p + p')).nativeElement.innerHTML).toBe(
            'From User Name:'
        );
        expect(fixture.debugElement.query(By.css('.contentToSlide span')).nativeElement.innerHTML).toContain('Content');

        expect(component.unreadNotifications).toHaveLength(fakeNotifications.length);
        expect(component.notificationCounter).toBe(fakeNotifications.length);
    });

    test('should be receiving new unread notification(s)', () => {
        const fakeNotif: DeepPartial<Notification> = {};
        subject.next(fakeNotif as Notification);

        expect(component.unreadNotifications).toHaveLength(fakeNotifications.length + 1);
        expect(component.notificationCounter).toBe(fakeNotifications.length + 1);
    });

    test('should be unsubscribing on destroy', () => {
        component.ngOnDestroy();

        expect(component.unreadSubscription.closed).toBeTruthy();
    });

    test('should be deleting notification', () => {
        notificationServiceMock.deleteNotification = jest.fn().mockReturnValue(of(() => {}));

        component.onNotificationDelete(fakeNotifications[0] as Notification);

        expect(notificationServiceMock.deleteNotification).toHaveBeenCalledWith(fakeNotifications[0]?.notification_id);
        expect(component.unreadNotifications).toHaveLength(0);
        expect(component.notificationCounter).toBe(0);
    });

    test('should fire onNotificationDelete on click', () => {
        const spy = jest.spyOn(component, 'onNotificationDelete').mockImplementation();

        fixture.debugElement
            .query(By.css('.contentToSlide > div > div > button'))
            .triggerEventHandler('click', fakeNotifications[0] as Notification);
        expect(spy).toHaveBeenCalledWith(fakeNotifications[0] as Notification);
    });

    test('should populate notification content', () => {
        const value = component.populateNotificationContent(fakeNotifications[0] as Notification);
        expect(value).toContain(`<span>${fakeNotifications[0]?.content}`);
    });
});
