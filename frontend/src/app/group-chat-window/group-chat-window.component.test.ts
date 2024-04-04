import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { ChatRoomWithParticipantsExceptSelf, User } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';
import { WebsocketService } from '../services/websocket.service';
import { UserSearchComponent } from '../user-search/user-search.component';
import { GroupChatWindowComponent } from './group-chat-window.component';

describe('GroupChatWindowComponent', () => {
    let component: GroupChatWindowComponent;
    let fixture: ComponentFixture<GroupChatWindowComponent>;
    let userServiceMock: Partial<UserService> = {
        createChatroom: jest.fn(),
    };
    let websocketServiceMock: Partial<WebsocketService> = {
        createChatroom: jest.fn(),
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
            declarations: [GroupChatWindowComponent, MockComponent(UserSearchComponent)],
            providers: [
                { provide: UserService, useValue: userServiceMock },
                { provide: WebsocketService, useValue: websocketServiceMock },
            ],
            imports: [ReactiveFormsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(GroupChatWindowComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(async () => {
        jest.clearAllMocks();
    });

    test('should be created', () => {
        expect(component).toBeTruthy();
    });

    test('should close menu', () => {
        component.selectedUsers.push(...fakeUsers);
        component.formGroup.controls['groupChatName'].setValue('Test Group Name');
        component.formGroup.markAsTouched();
        component.shouldShowWindow = true;

        component.closeMenu();

        expect(component.selectedUsers).toHaveLength(0);
        expect(component.formGroup.value.groupChatName).toBeNull();
        expect(component.formGroup.touched).toBeFalsy();
        expect(component.shouldShowWindow).toBeFalsy();
    });

    test('should add selected user', () => {
        component.shouldShowWindow = true;
        component.userSelection(fakeUsers[0]);
        expect(component.selectedUsers).toHaveLength(1);

        fixture.detectChanges();
        expect(fixture.debugElement.queryAll(By.css('#selectedUsersDivListContainer > div'))).toHaveLength(1);
        expect(fixture.debugElement.query(By.css('#selectedUsersDivListContainer > p'))).toBeNull();
    });

    test('should fire userSelectionEvent', () => {
        component.shouldShowWindow = true;
        const spy = jest.spyOn(component, 'userSelection').mockImplementation();

        fixture.detectChanges();
        fixture.debugElement.query(By.css('app-user-search')).triggerEventHandler('userSelectionEvent', fakeUsers[0]);

        expect(spy).toHaveBeenCalledWith(fakeUsers[0]);
        spy.mockRestore();
    });

    test('should remove user', () => {
        component.shouldShowWindow = true;
        component.selectedUsers.push(fakeUsers[0]);
        component.removeUser(fakeUsers[0]);
        expect(component.selectedUsers).toHaveLength(0);

        fixture.detectChanges();
        expect(fixture.debugElement.queryAll(By.css('#selectedUsersDivListContainer > div'))).toHaveLength(0);
        expect(fixture.debugElement.query(By.css('#selectedUsersDivListContainer > p'))).not.toBeNull();
    });

    test('should fire removeUser on click', () => {
        component.shouldShowWindow = true;
        const spy = jest.spyOn(component, 'removeUser').mockImplementation();
        component.selectedUsers.push(fakeUsers[0]);

        fixture.detectChanges();
        fixture.debugElement
            .query(By.css('#selectedUsersDivListContainer > div > button'))
            .triggerEventHandler('click', fakeUsers[0]);

        expect(spy).toHaveBeenCalledWith(fakeUsers[0]);
        spy.mockRestore();
    });

    test('should submit', () => {
        const chat: Partial<ChatRoomWithParticipantsExceptSelf> = {};
        userServiceMock.createChatroom = jest.fn().mockReturnValue(of(chat));
        component.selectedUsers.push(fakeUsers[0]);
        component.formGroup.controls['groupChatName'].setValue('Test Group Name');
        component.formGroup.markAsDirty();
        const emitSpy = jest.spyOn(component.groupChatCreatedEvent, 'emit').mockImplementation();

        component.onSubmit();

        expect(component.formGroup.pristine).toBeTruthy();
        expect(component.formGroup.value.groupChatName).toBeNull();
        expect(userServiceMock.createChatroom).toHaveBeenCalledTimes(1);
        expect(userServiceMock.createChatroom).toHaveBeenCalledWith([1], true, 'Test Group Name');
        expect(websocketServiceMock.createChatroom).toHaveBeenCalledWith(chat, [1]);
        expect(emitSpy).toHaveBeenCalledWith(chat);
    });

    test('should fire onSubmit', () => {
        component.shouldShowWindow = true;
        const spy = jest.spyOn(component, 'onSubmit').mockImplementation();

        fixture.detectChanges();
        fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', {});

        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });

    test('should disable submit button when no users selected, group name is empty or form is not valid', () => {
        component.shouldShowWindow = true;
        fixture.detectChanges();

        const button = fixture.debugElement.query(By.css('form > button')).nativeElement;
        expect(button.disabled).toBeTruthy();
    });

    test('should disable submit button when users selected, but group name is empty or form is not valid', () => {
        component.shouldShowWindow = true;
        component.selectedUsers.push(fakeUsers[0]);
        fixture.detectChanges();

        const button = fixture.debugElement.query(By.css('form > button')).nativeElement;
        expect(button.disabled).toBeTruthy();
    });

    test('should enable submit button when users selected, group name is not empty and form is valid', () => {
        component.shouldShowWindow = true;
        component.selectedUsers.push(fakeUsers[0]);
        component.formGroup.controls['groupChatName'].setValue('Test Group Name');
        fixture.detectChanges();

        const button = fixture.debugElement.query(By.css('form > button')).nativeElement;
        expect(button.disabled).toBeFalsy();
    });
});
