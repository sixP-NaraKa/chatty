import { AfterViewInit, Component, EventEmitter, Output } from '@angular/core';
import { User } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-user-search',
    templateUrl: './user-search.component.html',
    styleUrls: ['./user-search.component.scss']
})
export class UserSearchComponent implements AfterViewInit {

    @Output()
    userSelectionEvent = new EventEmitter<User>();

    searchResultSetDivElementId: string = "searchResultSetDivElementId" + Math.random().toString().substring(2, 8);
    userSearchInputElementId: string = "userSearchInputElementId" + Math.random().toString().substring(2, 8);;
    searchResultSetULElementId: string = "searchResultSetULElementId" + Math.random().toString().substring(2, 8);;

    registeredUsers!: User[];
    filteredUsers = new Array<User>();

    // workaround for closing the searchbar resultset box upon clicking outside of it
    searchResultsetDivElement!: HTMLDivElement; // contains the below element
    searchResultsetULElement!: HTMLUListElement;

    constructor(private userService: UserService) { }

    ngAfterViewInit(): void {
        this.searchResultsetDivElement = (document.getElementById(this.searchResultSetDivElementId) as HTMLDivElement);

        this.userService.getRegisteredUsers(this.userService.currentUser.userId).subscribe(users => {
            this.registeredUsers = users;
            (document.getElementById(this.userSearchInputElementId) as any).onkeyup = () => this.filterUsers();
        });

        document.addEventListener("click", (event: any) => {
            if (this.searchResultsetDivElement && event.target !== this.searchResultsetDivElement) {
                if (event.target !== this.searchResultsetULElement) {
                    this.searchResultsetDivElement.style.display = "none";
                }
            }
        });
    }

    filterUsers() {
        let input = (document.getElementById(this.userSearchInputElementId)! as HTMLInputElement).value as string;
        this.filteredUsers = this.registeredUsers.filter((user: User) => user.display_name.includes(input) && user.user_id !== this.userService.currentUser.userId);
        this.searchResultsetDivElement.style.display = "flex";
        // get the <ul> element if we don't already got it
        setTimeout(() => {
            if (!this.searchResultsetULElement) {
                this.searchResultsetULElement = (document.getElementById(this.searchResultSetULElementId) as HTMLUListElement);
            }
        }, 1);
    }

    userSelect(user: User) {
        (document.getElementById(this.userSearchInputElementId)! as HTMLInputElement).value = "";
        this.userSelectionEvent.emit(user);
    }

}
