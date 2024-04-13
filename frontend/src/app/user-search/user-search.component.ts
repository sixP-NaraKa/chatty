import { AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { User } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-user-search',
    templateUrl: './user-search.component.html',
    styleUrls: ['./user-search.component.scss'],
})
export class UserSearchComponent implements AfterViewInit {
    @Output()
    userSelectionEvent = new EventEmitter<User>();

    @ViewChild('userSearchInput', { read: ElementRef }) userSearchInputElement?: ElementRef;
    @ViewChild('searchResultsetDiv', { read: ElementRef }) searchResultsetDivElement?: ElementRef;
    @ViewChild('searchResultsetUL', { read: ElementRef }) searchResultsetULElement?: ElementRef;

    registeredUsers!: User[];
    filteredUsers = new Array<User>();

    constructor(private userService: UserService) {}

    ngAfterViewInit(): void {
        this.userService.getRegisteredUsers().subscribe((users) => {
            this.registeredUsers = users;
        });

        document.addEventListener('click', (event: any) => {
            if (
                this.searchResultsetDivElement?.nativeElement &&
                event.target !== this.searchResultsetDivElement.nativeElement
            ) {
                if (event.target !== this.searchResultsetULElement?.nativeElement) {
                    this.searchResultsetDivElement.nativeElement.style.display = 'none';
                }
            }
        });
    }

    filterUsers() {
        let input = this.userSearchInputElement?.nativeElement.value as string;
        this.filteredUsers = this.registeredUsers.filter(
            (user: User) => user.display_name.includes(input) && user.user_id !== this.userService.currentUser.userId
        );
        this.searchResultsetDivElement!.nativeElement.style.display = 'flex';
    }

    userSelect(user: User) {
        this.userSearchInputElement!.nativeElement.value = '';
        this.userSelectionEvent.emit(user);
    }
}
