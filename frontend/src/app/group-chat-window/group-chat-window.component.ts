import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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

    constructor() { }

    ngOnInit(): void {
    }

    /**
     * Close the group chat window.
     */
    closeMenu() {
        this.shouldShowWindow = false;
        this.groupChatClosedEvent.emit(false);
    }

    userSelection(user: User) {
        console.log(user);
    }

}
