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
    // let userServiceStub: Partial<UserService> = {};

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
            // providers: [{ provide: UserService, useValue: userServiceStub }],
            providers: [{ provide: UserService, useValue: userService }],
        });

        // // authGuard = new AuthGuard(routerSpy, userServiceStub as UserService);
        // // userService = TestBed.inject(UserService);
        authGuard = TestBed.inject(AuthGuard);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should be created', () => {
        expect(authGuard).toBeTruthy();
    });

    test('can activate route', () => {
        ngMocks.stubMember(userService, 'currentUser', {} as unknown as ApplicationUser);
        // jest.spyOn(userService, 'currentUser', 'get').mockReturnValue({} as ApplicationUser);
        let value = authGuard.canActivate({} as ActivatedRouteSnapshot, fakeRouterState('/test'));
        expect(value).toBeTruthy();
    });

    test('can not activate route', () => {
        ngMocks.stubMember(userService, 'currentUser', undefined as unknown as ApplicationUser);
        // jest.spyOn(userService, 'currentUser', 'get').mockReturnValue(null as unknown as ApplicationUser);
        let value = authGuard.canActivate({} as ActivatedRouteSnapshot, fakeRouterState('/test'));
        expect(value).toBeFalsy();
    });

    function fakeRouterState(url: string): RouterStateSnapshot {
        return {
            url,
        } as RouterStateSnapshot;
    }
});
