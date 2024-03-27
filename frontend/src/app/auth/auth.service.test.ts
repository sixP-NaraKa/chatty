import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import config from 'src/environments/config';
import { LoginFormComponent } from '../login-form/login-form.component';
import { WebsocketService } from '../services/websocket.service';
import { ApplicationUser, AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;
    let httpClient: HttpClient;
    let httpController: HttpTestingController;

    const websocketServiceSpy = {
        disconnect: jest.fn(),
    };

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
            providers: [{ provide: WebsocketService, useValue: websocketServiceSpy }],
        });
        service = TestBed.inject(AuthService);
        httpClient = TestBed.inject(HttpClient);
        httpController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should be created', () => {
        expect(service).toBeTruthy();
    });

    test('can login', (done) => {
        const fakeUser: ApplicationUser = {
            access_token: 'access token',
            userId: 1,
            username: 'User Name',
        };

        service.login('test', 'test').subscribe((user) => {
            expect(user).not.toBeNull();
            expect(user.username).toBe(fakeUser.username);
            expect(localStorage.getItem('chatty-current-user')).not.toBeNull();
            expect(service.currentUserValue).not.toBeNull();
            done();
        });

        const mockReq = httpController.expectOne(`${config.BACKEND_HOST}/auth/login`);
        expect(mockReq.cancelled).toBeFalsy();
        mockReq.flush(fakeUser);

        httpController.verify();
    });

    test('can logout', () => {
        service.logout();
        expect(localStorage.getItem('chatty-current-user')).toBeNull();
        expect(service.currentUserValue).toBeNull();
    });

    test('user is logged in', () => {
        const fakeUser: ApplicationUser = {
            access_token: 'access token',
            userId: 1,
            username: 'User Name',
        };

        let currentUserValueSpy = jest.spyOn(service, 'currentUserValue', 'get').mockReturnValue(fakeUser);
        let value = service.isLoggedIn();
        expect(value).toBeTruthy();
        expect(currentUserValueSpy).toHaveReturnedWith(fakeUser);
    });

    test('user is not logged in with falsey value', () => {
        let currentUserValueSpy = jest
            .spyOn(service, 'currentUserValue', 'get')
            .mockReturnValue(null as unknown as ApplicationUser);
        let value = service.isLoggedIn();
        expect(value).toBeFalsy();
        expect(currentUserValueSpy).toHaveReturnedWith(null);
    });

    test('user is not logged in with truthy value but empty access token', () => {
        const fakeUser: ApplicationUser = {
            access_token: '',
            userId: 1,
            username: 'User Name',
        };

        let currentUserValueSpy = jest.spyOn(service, 'currentUserValue', 'get').mockReturnValue(fakeUser);
        let value = service.isLoggedIn();
        expect(value).toBeFalsy();
        expect(currentUserValueSpy).toHaveReturnedWith(fakeUser);
    });
});
