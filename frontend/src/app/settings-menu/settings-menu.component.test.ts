import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ReplaySubject } from 'rxjs';
import { Settings } from '../../../../shared/types/db-dtos';
import { UserSettingsService } from '../services/user-settings.service';
import { UserService } from '../services/user.services';
import { SettingsMenuComponent } from './settings-menu.component';

describe('SettingsMenuComponent', () => {
    let component: SettingsMenuComponent;
    let fixture: ComponentFixture<SettingsMenuComponent>;
    const userServiceMock: Partial<UserService> = {
        updateUserSettings: jest.fn(),
    };
    const userSettingsService: Partial<UserSettingsService> = {};

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SettingsMenuComponent],
            providers: [
                { provide: UserService, useValue: userServiceMock },
                { provide: UserSettingsService, useValue: userSettingsService },
            ],
            imports: [ReactiveFormsModule],
        }).compileComponents();

        userSettingsService.currentUserSettingsSubject$ = new ReplaySubject<Settings>(1);

        fixture = TestBed.createComponent(SettingsMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(async () => {
        jest.clearAllMocks();
    });

    test('should be created', () => {
        expect(component).toBeTruthy();
    });

    test('should be destroyed', () => {
        expect(component.currentUserSettingsSubscription.closed).toBeFalsy();
        component.ngOnDestroy();
        expect(component.currentUserSettingsSubscription.closed).toBeTruthy();
    });

    test('should not set settings if null', () => {
        userSettingsService.currentUserSettingsSubject$?.next(null as unknown as Settings);
        expect(component.userSettings).toBeUndefined();
    });

    test('should set settings if not null', () => {
        const settings: Settings = {
            embed_yt_videos: true,
            filter: 'filter',
            font_size: 'default',
            settings_id: 1,
            user_id: 1,
        };
        userSettingsService.currentUserSettingsSubject$?.next(settings);
        expect(component.userSettings).toBe(settings);
        expect(component.settingsMenuFormGroup.value.filterRadio).toBe(settings.filter);
        expect(component.settingsMenuFormGroup.value.fontSize).toBe(settings.font_size);
        expect(component.settingsMenuFormGroup.value.embedYouTubeVideos).toBe(settings.embed_yt_videos);
    });

    test('should show menu', () => {
        fixture.debugElement.query(By.css('button')).triggerEventHandler('click', {});

        expect(component.shouldShowMenu).toBeTruthy();

        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('div.settings-menu-blur'))).not.toBeNull();
    });

    test('should close menu', () => {
        fixture.debugElement.query(By.css('button')).triggerEventHandler('click', {});

        fixture.detectChanges();
        fixture.debugElement
            .query(By.css('div.settings-menu-blur > div.settings-menu-window > button'))
            .triggerEventHandler('click', {});

        expect(component.shouldShowMenu).toBeFalsy();
        expect(fixture.debugElement.query(By.css('div.settings-menu-blur'))).not.toBeNull();

        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('div.settings-menu-blur'))).toBeNull();
    });

    test('should submit', () => {
        component.shouldShowMenu = true;
        const settings: Settings = {
            filter: 'filter',
            embed_yt_videos: true,
            font_size: 'default',
            settings_id: 1,
            user_id: 1,
        };
        userSettingsService.currentUserSettingsSubject$?.next(settings);
        const spy = jest.spyOn(userSettingsService.currentUserSettingsSubject$!, 'next').mockImplementation();

        fixture.detectChanges();
        fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', {});

        expect(component.shouldShowMenu).toBeFalsy();
        expect(userServiceMock.updateUserSettings).toHaveBeenCalledWith(settings);
        expect(spy).toHaveBeenCalledWith(settings);
        spy.mockRestore();
    });
});
