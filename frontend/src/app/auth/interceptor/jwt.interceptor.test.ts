import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { UserService } from 'src/app/services/user.services';
import { ApplicationUser } from '../auth.service';
import { JwtInterceptor, jwtInterceptorProvider } from './jwt.interceptor';

describe('JwtInterceptor', () => {
    let jwtInterceptor: JwtInterceptor;
    let httpClient: HttpClient;
    let httpController: HttpTestingController;
    let userServiceStub = {
        currentUser: {
            access_token: 'access token',
            userId: 1,
            username: 'User Name',
        },
    };

    const next: any = {
        handle: () => {
            return Observable.create((subscriber: any) => {
                subscriber.complete();
            });
        },
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [{ provide: UserService, useValue: userServiceStub }, jwtInterceptorProvider],
        });
        jwtInterceptor = TestBed.inject(JwtInterceptor);
        httpClient = TestBed.inject(HttpClient);
        httpController = TestBed.inject(HttpTestingController);
    });

    afterEach(async () => {
        httpController.verify();
        jest.clearAllMocks();
    });

    test('should be created', () => {
        expect(jwtInterceptor).toBeTruthy();
    });

    test('should intercept and add auth headers', (done) => {
        httpClient.get('/testendpoint').subscribe(); // call to done() needed when .subscribe(...) has a body or its defined like above

        const request = httpController.expectOne(`/testendpoint?userId=${userServiceStub.currentUser.userId}`);

        expect(request.request.headers.get('Authorization')).toEqual(
            `Bearer ${userServiceStub.currentUser.access_token}`
        );
        done();
    });

    test('should intercept and add userId param', () => {
        httpClient.get('/testendpoint').subscribe();

        const request = httpController.expectOne(`/testendpoint?userId=${userServiceStub.currentUser.userId}`);

        expect(request.request.params.get('userId')).toEqual(userServiceStub.currentUser.userId.toString());
    });

    test('should not intercept when user is not valid', () => {
        userServiceStub.currentUser = undefined as unknown as ApplicationUser;
        httpClient.get('/testendpoint').subscribe();

        const request = httpController.expectOne('/testendpoint');

        expect(request.request.params.get('userId')).toBeNull();
    });

    test('should not intercept when user is valid but access token is not', () => {
        userServiceStub.currentUser = {
            access_token: '',
            userId: 1,
            username: 'User Name',
        };
        httpClient.get('/testendpoint').subscribe();

        const request = httpController.expectOne('/testendpoint');

        expect(request.request.params.get('userId')).toBeNull();
    });
});
