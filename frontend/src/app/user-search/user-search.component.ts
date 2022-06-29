import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { User } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-user-search',
    templateUrl: './user-search.component.html',
    styleUrls: ['./user-search.component.scss']
})
export class UserSearchComponent implements OnInit {

    @Output()
    userSelectionEvent = new EventEmitter<User>();

    registeredUsers!: User[];
    filteredUsers = new Array<User>();

    // workaround for closing the searchbar resultset box upon clicking outside of it
    searchResultsetDivElement!: HTMLDivElement; // contains the below element
    searchResultsetULElement!: HTMLUListElement;

    constructor(private userService: UserService) { }

    ngOnInit(): void {
        this.searchResultsetDivElement = (document.getElementById("searchResultsetDiv") as HTMLDivElement);

        this.userService.getRegisteredUsers(this.userService.currentUser.userId).subscribe(users => {
            this.registeredUsers = users;
            (document.getElementById("userSearch") as any).onkeyup = () => this.filterUsers();
        });

        document.onclick = (event: any) => { // or "window.onclick"
            if (this.searchResultsetDivElement && event.target !== this.searchResultsetDivElement) {
                if (event.target !== this.searchResultsetULElement) {
                    this.searchResultsetDivElement.style.display = "none";
                }
            }
        }
    }

    filterUsers() {
        let input = (document.getElementById("userSearch")! as HTMLInputElement).value as string;
        this.filteredUsers = this.registeredUsers.filter((user: User) => user.display_name.includes(input) && user.user_id !== this.userService.currentUser.userId);
        this.searchResultsetDivElement.style.display = "flex";
        // get the <ul> element if we don't already got it
        setTimeout(() => {
            if (!this.searchResultsetULElement) {
                this.searchResultsetULElement = (document.getElementById("searchResultsetUL") as HTMLUListElement);
            }
        }, 1);
    }

    userSelect(user: User) {
        (document.getElementById("userSearch")! as HTMLInputElement).value = "";
        this.userSelectionEvent.emit(user);
    }

}
