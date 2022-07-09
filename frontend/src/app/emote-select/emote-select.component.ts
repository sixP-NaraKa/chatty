import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { emote } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-emote-select',
    templateUrl: './emote-select.component.html',
    styleUrls: ['./emote-select.component.scss']
})
export class EmoteSelectComponent implements AfterViewInit {

    @Input()
    showEmotesMenu: boolean = false;

    @Output()
    emoteSelectedEvent = new EventEmitter<emote>();

    // emotes
    availableEmotes!: emote[];

    constructor(private userService: UserService) { }

    ngAfterViewInit(): void {
        // fetch emotes
        this.userService.getAvailableEmotes(this.userService.currentUser.userId).subscribe(emotes => this.availableEmotes = emotes);
    }

    emoteSelect(emote: emote) {
        console.log(emote);
        this.emoteSelectedEvent.emit(emote);
    }

}
