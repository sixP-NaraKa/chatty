import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { Emote } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-emote-select',
    templateUrl: './emote-select.component.html',
    styleUrls: ['./emote-select.component.scss'],
})
export class EmoteSelectComponent implements AfterViewInit {
    @Input()
    showEmotesMenu: boolean = false;

    @Output()
    emoteSelectedEvent = new EventEmitter<Emote>();

    // emotes
    availableEmotes = new Array<Emote>();
    filteredEmotes = new Array<Emote>();

    constructor(private userService: UserService) {}

    ngAfterViewInit(): void {
        // fetch emotes
        this.userService.getAvailableEmotes().subscribe((emotes) => {
            this.availableEmotes = emotes;
            this.filteredEmotes = this.availableEmotes;
        });
    }

    emoteSelect(emote: Emote) {
        this.emoteSelectedEvent.emit(emote);
    }

    filterEmotes(event: Event) {
        const input = (event.target as HTMLInputElement).value;
        this.filteredEmotes = this.availableEmotes.filter((emote) => emote.name.includes(input));
    }
}
