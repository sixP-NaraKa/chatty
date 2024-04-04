import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ApplicationUser } from '../auth/auth.service';
import { ChatPageComponent } from '../chat-page/chat-page.component';
import { UserService } from '../services/user.services';
import { LoginFormComponent } from './login-form.component';

describe('LoginFormComponent', () => {
    let component: LoginFormComponent;
    let fixture: ComponentFixture<LoginFormComponent>;
    const userServiceMock: Partial<UserService> = {
        login: jest.fn(),
    };

    const fakeUser: ApplicationUser = {
        access_token: 'access token',
        userId: 1,
        username: 'Test',
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [LoginFormComponent],
            providers: [{ provide: UserService, useValue: userServiceMock }],
            imports: [
                ReactiveFormsModule,
                RouterTestingModule.withRoutes([
                    {
                        path: 'chat',
                        component: ChatPageComponent,
                    },
                ]),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(LoginFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(async () => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    test('should be created', () => {
        expect(component).toBeTruthy();
    });

    test('should focus username input field on page load', () => {
        const element = fixture.debugElement.query(By.css('#username')).nativeElement;

        expect(document.activeElement?.id).toBe(element.id);
    });

    test('should login', fakeAsync(async () => {
        component.loginFormGroup.setValue({
            usernameInput: 'Test',
            passwordInput: 'password',
        });
        userServiceMock.login = jest.fn().mockReturnValue(of(fakeUser));

        await component.onLoginSubmit();

        expect(userServiceMock.login).toHaveBeenCalledWith('Test', 'password');
        expect(component.loginErrorMessage).toBeFalsy();
    }));

    test('should fire onLoginSubmit on form submit', () => {
        const spy = jest.spyOn(component, 'onLoginSubmit').mockImplementation();

        // can use either "submit" or "ngSubmit"
        fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', {});

        expect(spy).toHaveBeenCalledTimes(1);
    });

    test('should not login', fakeAsync(async () => {
        component.loginFormGroup.setValue({
            usernameInput: 'Test',
            passwordInput: 'password',
        });
        const error$ = throwError(() => {});
        userServiceMock.login = jest.fn().mockReturnValue(error$);

        await component.onLoginSubmit();
        fixture.detectChanges();

        expect(userServiceMock.login).toHaveBeenCalledWith('Test', 'password');
        const errorMessage = 'Wrong username/password.';
        expect(component.loginErrorMessage).toBe(errorMessage);
        expect(fixture.debugElement.query(By.css('form + p')).nativeElement.innerHTML).toBe(errorMessage);
    }));
});
