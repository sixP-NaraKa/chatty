import { AfterViewInit, Component, Input } from '@angular/core';

@Component({
    selector: 'app-group-chat-users',
    templateUrl: './group-chat-users.component.html',
    styleUrls: ['./group-chat-users.component.scss']
})
export class GroupChatUsersComponent implements AfterViewInit {

    users = new Array<string>();
    @Input() set groupChatUsers(users: Array<string>) {
        this.users = users;
    }

    constructor() { }

    ngAfterViewInit(): void {
    }

}
