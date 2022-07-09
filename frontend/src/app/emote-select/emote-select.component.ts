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

    emoteSearchInputElement!: HTMLInputElement;

    // emotes
    availableEmotes = new Array<emote>();
    filteredEmotes = new Array<emote>();

    constructor(private userService: UserService) { }

    ngAfterViewInit(): void {
        // fetch emotes
        this.userService.getAvailableEmotes(this.userService.currentUser.userId).subscribe(emotes => {
            this.availableEmotes = emotes;
            this.filteredEmotes = this.availableEmotes;
        });

        // get input element to add filter listener
        this.emoteSearchInputElement = (document.getElementById("emoteSearchInput") as HTMLInputElement);
        this.emoteSearchInputElement.onkeyup = () => this.filterEmotes();

    }

    emoteSelect(emote: emote) {
        this.emoteSelectedEvent.emit(emote);
    }

    filterEmotes() {
        const input = this.emoteSearchInputElement.value;
        this.filteredEmotes = this.availableEmotes.filter(emote => emote.name.includes(input));
    }

}
