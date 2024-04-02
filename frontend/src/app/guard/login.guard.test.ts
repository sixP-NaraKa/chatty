import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MockService } from 'ng-mocks';
import { ChatPageComponent } from '../chat-page/chat-page.component';
import { UserService } from '../services/user.services';
import { LoginGuard } from './login.guard';

describe('LoginGuard', () => {
    let loginGuard: LoginGuard;
    let userServiceMock = MockService(UserService);

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                RouterTestingModule.withRoutes([
                    {
                        path: 'chat',
                        component: ChatPageComponent,
                    },
                ]),
            ],
            providers: [{ provide: UserService, useValue: userServiceMock }],
        });
        loginGuard = TestBed.inject(LoginGuard);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should be created', () => {
        expect(loginGuard).toBeTruthy();
    });

    test('should not activate route when user is logged in', () => {
        userServiceMock.isLoggedIn = jest.fn().mockReturnValue(true);
        let value = loginGuard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
        expect(value).toBeFalsy();
    });

    test('should activate route when not user is logged out', () => {
        userServiceMock.isLoggedIn = jest.fn().mockReturnValue(false);
        let value = loginGuard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
        expect(value).toBeTruthy();
    });
});
