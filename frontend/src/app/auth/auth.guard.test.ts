import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MockService, ngMocks } from 'ng-mocks';
import { LoginFormComponent } from '../login-form/login-form.component';
import { UserService } from '../services/user.services';
import { AuthGuard } from './auth.guard';
import { ApplicationUser } from './auth.service';

describe('AuthGuard', () => {
    let authGuard: AuthGuard;
    let userService = MockService(UserService);

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                RouterTestingModule.withRoutes([
                    {
                        path: 'login',
                        component: LoginFormComponent,
                    },
                ]),
            ],
            providers: [{ provide: UserService, useValue: userService }],
        });
        authGuard = TestBed.inject(AuthGuard);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should be created', () => {
        expect(authGuard).toBeTruthy();
    });

    test('should activate route when user is valid', () => {
        ngMocks.stubMember(userService, 'currentUser', {} as unknown as ApplicationUser);
        let value = authGuard.canActivate({} as ActivatedRouteSnapshot, fakeRouterState('/test'));
        expect(value).toBeTruthy();
    });

    test('should not activate route when is is invalid', () => {
        ngMocks.stubMember(userService, 'currentUser', undefined as unknown as ApplicationUser);
        let value = authGuard.canActivate({} as ActivatedRouteSnapshot, fakeRouterState('/test'));
        expect(value).toBeFalsy();
    });

    function fakeRouterState(url: string): RouterStateSnapshot {
        return {
            url,
        } as RouterStateSnapshot;
    }
});
