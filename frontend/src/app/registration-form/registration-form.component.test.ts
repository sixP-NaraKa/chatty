import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { User } from '../../../../shared/types/db-dtos';
import { LoginFormComponent } from '../login-form/login-form.component';
import { UserService } from '../services/user.services';
import { RegistrationFormComponent } from './registration-form.component';

describe('RegistrationFormComponent', () => {
    let component: RegistrationFormComponent;
    let fixture: ComponentFixture<RegistrationFormComponent>;
    const userServiceMock: Partial<UserService> = {
        register: jest.fn(),
    };

    const fakeUser: User = {
        creation_date: new Date(),
        user_id: 1,
        display_name: 'Test',
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RegistrationFormComponent],
            providers: [{ provide: UserService, useValue: userServiceMock }],
            imports: [
                ReactiveFormsModule,
                RouterTestingModule.withRoutes([
                    {
                        path: 'login',
                        component: LoginFormComponent,
                    },
                ]),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RegistrationFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        jest.spyOn(window, 'alert').mockImplementation();
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

    test('should register', () => {
        component.registrationFormGroup.setValue({
            usernameInput: 'Test',
            passwordInput: 'password',
            repeatPasswordInput: 'password',
        });
        userServiceMock.register = jest.fn().mockReturnValue(of(fakeUser));

        component.onRegistrationSubmit();

        expect(userServiceMock.register).toHaveBeenCalledWith('Test', 'password');
        expect(component.registrationErrorMessage).toBeFalsy();
    });

    test('should fire onLoginSubmit on form submit', () => {
        const spy = jest.spyOn(component, 'onRegistrationSubmit').mockImplementation();

        // can use either "submit" or "ngSubmit"
        fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', {});

        expect(spy).toHaveBeenCalledTimes(1);
    });

    test('should not register when passwords do not match', () => {
        component.registrationFormGroup.setValue({
            usernameInput: 'Test',
            passwordInput: 'password',
            repeatPasswordInput: 'different password',
        });

        component.onRegistrationSubmit();
        fixture.detectChanges();

        const errorMessage = 'Passwords do not match.';
        expect(component.registrationErrorMessage).toBe(errorMessage);
        expect(fixture.debugElement.query(By.css('form + p')).nativeElement.innerHTML).toBe(errorMessage);
    });

    test('should not register and show detailed error message', () => {
        component.registrationFormGroup.setValue({
            usernameInput: 'Test',
            passwordInput: 'password',
            repeatPasswordInput: 'password',
        });
        const errorMessage = 'Username is already taken.';
        const error$ = throwError(() => new HttpErrorResponse({ error: new Error(errorMessage) }));
        userServiceMock.register = jest.fn().mockReturnValue(error$);

        component.onRegistrationSubmit();
        fixture.detectChanges();

        expect(userServiceMock.register).toHaveBeenCalledWith('Test', 'password');
        expect(component.registrationErrorMessage).toBe(errorMessage);
        expect(fixture.debugElement.query(By.css('form + p')).nativeElement.innerHTML).toBe(errorMessage);
    });

    test('should not register and show generic error message', () => {
        component.registrationFormGroup.setValue({
            usernameInput: 'Test',
            passwordInput: 'password',
            repeatPasswordInput: 'password',
        });
        const error$ = throwError(() => {});
        userServiceMock.register = jest.fn().mockReturnValue(error$);

        component.onRegistrationSubmit();
        fixture.detectChanges();

        expect(userServiceMock.register).toHaveBeenCalledWith('Test', 'password');
        const errorMessage = 'Unknown problem. Try again later.';
        expect(component.registrationErrorMessage).toBe(errorMessage);
        expect(fixture.debugElement.query(By.css('form + p')).nativeElement.innerHTML).toBe(errorMessage);
    });

    test('should disable form submit button when passwords do not match', () => {
        component.registrationFormGroup.setValue({
            usernameInput: 'Test',
            passwordInput: 'password',
            repeatPasswordInput: 'different password',
        });
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('form > button')).nativeElement.disabled).toBeTruthy();
    });
});
