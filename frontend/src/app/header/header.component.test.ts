import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent } from 'ng-mocks';
import { ApplicationUser } from '../auth/auth.service';
import { UserService } from '../services/user.services';
import { SettingsMenuComponent } from '../settings-menu/settings-menu.component';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;

    const user: ApplicationUser = {
        access_token: 'access token',
        userId: 1,
        username: 'Test User Name',
    };
    let userServiceMock: Partial<UserService> = {
        currentUser: user,
        logout: jest.fn(),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HeaderComponent, MockComponent(SettingsMenuComponent)],
            providers: [{ provide: UserService, useValue: userServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(async () => {
        jest.clearAllMocks();
    });

    test('should be created', () => {
        expect(component).toBeTruthy();
    });

    test('should logout', () => {
        const spy = jest.spyOn(component.logOutEvent, 'emit').mockImplementation();

        component.logout();

        expect(spy).toHaveBeenCalledWith(true);
        expect(userServiceMock.logout).toHaveBeenCalledTimes(1);
    });

    test('should fire logout on click', () => {
        const spy = jest.spyOn(component, 'logout').mockImplementation();

        fixture.debugElement.query(By.css('app-settings-menu + button')).triggerEventHandler('click', {});

        expect(spy).toHaveBeenCalledTimes(1);
    });

    test('should show name of logged in user', () => {
        const element = fixture.debugElement.query(By.css('b')).nativeElement;

        expect(element.innerHTML).toBe(user.username);
    });
});
