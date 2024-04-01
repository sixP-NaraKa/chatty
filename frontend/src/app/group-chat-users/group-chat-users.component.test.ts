import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent } from 'ng-mocks';
import { User } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';
import { UserSearchComponent } from '../user-search/user-search.component';
import { GroupChatUsersComponent } from './group-chat-users.component';

describe('EmoteSelectComponent', () => {
    let component: GroupChatUsersComponent;
    let fixture: ComponentFixture<GroupChatUsersComponent>;
    let userServiceMock: Partial<UserService> = {
        currentUser: {
            access_token: 'access token',
            userId: 1,
            username: 'Test User Name',
        },
    };

    let fakeUsers: User[];

    beforeEach(async () => {
        fakeUsers = [
            {
                creation_date: new Date(),
                display_name: 'Test Display Name',
                user_id: 1,
            },
            {
                creation_date: new Date(),
                display_name: 'Test Display Name 2',
                user_id: 2,
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
        component.groupChatCreatedBy = fakeUsers[0].user_id;
    });

    afterEach(async () => {
        jest.clearAllMocks();
    });

    test('should be created', () => {
        expect(component).toBeTruthy();
    });

    test('should remove participant', () => {
        const spy = jest.spyOn(component.removeUserFromGroupChat, 'emit').mockImplementation();
        const user = fakeUsers[1];
        component.onRemoveParticipant(user);

        expect(component.users).toHaveLength(1);
        expect(spy).toBeCalledWith(user);
    });

    test('should fire onRemoveParticipant on click', () => {
        const spy = jest.spyOn(component, 'onRemoveParticipant').mockImplementation();
        const user = fakeUsers[1];

        fixture.detectChanges();
        fixture.debugElement.queryAll(By.css('.group-chat-hr button'))[1].triggerEventHandler('click', user);

        expect(spy).toBeCalledWith(user);
    });

    test('should not add/emit new user on selection when user was already added', () => {
        const user: User = {
            creation_date: new Date(),
            display_name: 'Test Display Name 2',
            user_id: 2,
        };
        component.onUserSelection(user);

        expect(component.users).toHaveLength(2);
    });

    test('should add/emit new user on selection', () => {
        const spy = jest.spyOn(component.addUserToGroupChatEvent, 'emit').mockImplementation();
        const user: User = {
            creation_date: new Date(),
            display_name: 'Test Display Name 3',
            user_id: 3,
        };
        component.onUserSelection(user);

        expect(spy).toBeCalledWith(user);
    });

    test('should fire onUserSelection on selection event', () => {
        const spy = jest.spyOn(component, 'onUserSelection').mockImplementation();
        const user: User = {
            creation_date: new Date(),
            display_name: 'Test Display Name 3',
            user_id: 3,
        };

        fixture.detectChanges();
        fixture.debugElement.query(By.css('app-user-search')).triggerEventHandler('userSelectionEvent', user);

        expect(spy).toBeCalledWith(user);
    });

    test('should highlight creator', () => {
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('.fa-star.text-yellow-300'))).not.toBeUndefined();
    });

    test('should show all users', () => {
        fixture.detectChanges();
        expect(fixture.debugElement.queryAll(By.css('div.group-chat-hr'))).toHaveLength(2);
    });
});
