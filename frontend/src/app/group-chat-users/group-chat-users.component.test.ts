import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent } from 'ng-mocks';
import { User } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';
import { UserSearchComponent } from '../user-search/user-search.component';
import { GroupChatUsersComponent } from './group-chat-users.component';

describe('GroupChatUsersComponent', () => {
    let component: GroupChatUsersComponent;
    let fixture: ComponentFixture<GroupChatUsersComponent>;
    let userServiceMock: Partial<UserService> = {
        currentUser: {
            access_token: 'access token',
            userId: 1,
            username: 'Test User Name',
        },
    };

    let fakeUsers: { users: User }[];

    beforeEach(async () => {
        fakeUsers = [
            {
                users: {
                    creation_date: new Date(),
                    display_name: 'Test Display Name',
                    user_id: 1,
                },
            },
            {
                users: {
                    creation_date: new Date(),
                    display_name: 'Test Display Name 2',
                    user_id: 2,
                },
            },
        ];

        await TestBed.configureTestingModule({
            declarations: [GroupChatUsersComponent, MockComponent(UserSearchComponent)],
            providers: [{ provide: UserService, useValue: userServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(GroupChatUsersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        component.groupChatUsers = fakeUsers;
        component.groupChatCreatedBy = fakeUsers[0].users.user_id;
        component.hideDropdown = true;
    });

    afterEach(async () => {
        jest.clearAllMocks();
    });

    test('should be created', () => {
        expect(component).toBeTruthy();
    });

    test('should show dropdown', () => {
        const button = fixture.debugElement.query(By.css('button'));
        button.triggerEventHandler('click', {});
        fixture.detectChanges();

        expect(component.hideDropdown).toBeFalsy();
        expect(button.nativeElement.innerHTML.trim()).toBe('Hide Users');
    });

    test('should hide dropdown', () => {
        const button = fixture.debugElement.query(By.css('button'));
        button.triggerEventHandler('click', {});
        fixture.detectChanges();

        expect(component.hideDropdown).toBeFalsy();
        expect(button.nativeElement.innerHTML.trim()).toBe('Hide Users');

        // do the same again to hide the dropdown
        button.triggerEventHandler('click', {});
        fixture.detectChanges();

        expect(component.hideDropdown).toBeTruthy();
        expect(button.nativeElement.innerHTML.trim()).toBe('Show Users');
    });

    test('should emit removal of participant', () => {
        const spy = jest.spyOn(component.removeUserFromGroupChat, 'emit').mockImplementation();
        const user = fakeUsers[1];
        component.onRemoveParticipant(user);

        expect(spy).toHaveBeenCalledWith(user.users);
    });

    test('should fire onRemoveParticipant on click', () => {
        component.hideDropdown = false;
        const spy = jest.spyOn(component, 'onRemoveParticipant').mockImplementation();
        const user = fakeUsers[1];

        fixture.detectChanges();
        fixture.debugElement.queryAll(By.css('.group-chat-hr button'))[1].triggerEventHandler('click', user);

        expect(spy).toHaveBeenCalledWith(user);
    });

    test('should not emit new user on selection when user was already added', () => {
        const user: User = {
            creation_date: new Date(),
            display_name: 'Test Display Name 2',
            user_id: 2,
        };
        component.onUserSelection(user);

        expect(component.users).toHaveLength(2);
    });

    test('should emit new user on selection', () => {
        const spy = jest.spyOn(component.addUserToGroupChatEvent, 'emit').mockImplementation();
        const user: User = {
            creation_date: new Date(),
            display_name: 'Test Display Name 3',
            user_id: 3,
        };
        component.onUserSelection(user);

        expect(spy).toHaveBeenCalledWith(user);
    });

    test('should fire onUserSelection on selection event', () => {
        component.hideDropdown = false;
        const spy = jest.spyOn(component, 'onUserSelection').mockImplementation();
        const user: User = {
            creation_date: new Date(),
            display_name: 'Test Display Name 3',
            user_id: 3,
        };

        fixture.detectChanges();
        fixture.debugElement.query(By.css('app-user-search')).triggerEventHandler('userSelectionEvent', user);

        expect(spy).toHaveBeenCalledWith(user);
    });

    test('should highlight creator', () => {
        component.hideDropdown = false;
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('.fa-star.text-yellow-300'))).not.toBeUndefined();
    });

    test('should show all users', () => {
        component.hideDropdown = false;
        fixture.detectChanges();
        expect(fixture.debugElement.queryAll(By.css('div.group-chat-hr'))).toHaveLength(2);
    });
});
