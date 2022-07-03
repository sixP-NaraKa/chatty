import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from '../../../../shared/types/db-dtos';

@Component({
    selector: 'app-group-chat-window',
    templateUrl: './group-chat-window.component.html',
    styleUrls: ['./group-chat-window.component.scss']
})
export class GroupChatWindowComponent implements OnInit {

    @Input()
    shouldShowWindow: boolean = false;

    @Output()
    groupChatClosedEvent = new EventEmitter<boolean>();

    selectedUsers = new Array<User>();

    formGroup = new FormGroup({
        groupChatName: new FormControl("", Validators.required),
    });

    constructor() { }

    ngOnInit(): void {
    }

    /**
     * Close the group chat window.
     */
    closeMenu() {
        // clear locally stored list of selected users
        this.selectedUsers = new Array<User>();
        // clear the input of the name field
        this.formGroup.reset();

        this.shouldShowWindow = false;
        this.groupChatClosedEvent.emit(false);
    }

    userSelection(user: User) {
        console.log(user);
        if (!this.selectedUsers.some(u => user.user_id === u.user_id)) {
            this.selectedUsers.push(user);
        }
    }

    removeUser(user: User) {
        const idxOf = this.selectedUsers.indexOf(user);
        console.log(idxOf);
        this.selectedUsers.splice(idxOf, 1);
    }

    onSubmit() {

    }

}
