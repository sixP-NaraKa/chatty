import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { User } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';
import { UserSearchComponent } from './user-search.component';

describe('UserSearchComponent', () => {
    let component: UserSearchComponent;
    let fixture: ComponentFixture<UserSearchComponent>;
    const fakeUsers: User[] = [
        {
            creation_date: new Date(),
            display_name: 'Test Name',
            user_id: 2,
        },
    ];
    const userServiceMock: Partial<UserService> = {
        currentUser: {
            access_token: 'access token',
            userId: 1,
            username: 'Test User Name',
        },
        getRegisteredUsers: jest.fn().mockReturnValue(of(fakeUsers)),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [UserSearchComponent],
            providers: [{ provide: UserService, useValue: userServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(UserSearchComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(async () => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        document.removeAllListeners!('click');
    });

    test('should be created', () => {
        expect(component).toBeTruthy();
    });

    test('should have registered users', () => {
        expect(component.registeredUsers).toBe(fakeUsers);
    });

    test('should register click event listener', () => {
        expect(document.eventListeners!('click')).toHaveLength(1);
    });

    test('should filter users', () => {
        fixture.debugElement.query(By.css('input')).triggerEventHandler('input', 'Test Name');
        fixture.detectChanges();

        expect(component.filteredUsers).toHaveLength(1);
        expect(component.searchResultsetDivElement?.nativeElement.style.display).toBe('flex');
        expect(fixture.debugElement.queryAll(By.css('li'))).toHaveLength(1);
    });

    test('should emit user selection', () => {
        const spy = jest.spyOn(component.userSelectionEvent, 'emit').mockImplementation();
        fixture.debugElement.query(By.css('input')).triggerEventHandler('input', 'Test Name');
        fixture.detectChanges();

        fixture.debugElement.query(By.css('li')).triggerEventHandler('click', fakeUsers[0]);
        expect(component.userSearchInputElement?.nativeElement.value).toBeFalsy();
        expect(spy).toHaveBeenCalledWith(fakeUsers[0]);
    });
});
