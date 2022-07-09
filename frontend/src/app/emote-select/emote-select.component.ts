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
    closeEmotesMenuEvent = new EventEmitter();

    @Output()
    emoteSelectedEvent = new EventEmitter<emote>();

    // workaround for closing the searchbar resultset box upon clicking outside of it
    searchResultsetDivElement!: HTMLDivElement; // contains the below element
    searchResultsetULElement!: HTMLUListElement;

    // emotes
    availableEmotes!: emote[];

    constructor(private userService: UserService) { }

    ngAfterViewInit(): void {
        // this.searchResultsetDivElement = (document.getElementById("emotesContainerId") as HTMLDivElement);
        // this.searchResultsetULElement = (document.getElementById("emotesULListId") as HTMLUListElement);

        // fetch emotes
        this.userService.getAvailableEmotes(this.userService.currentUser.userId).subscribe(emotes => this.availableEmotes = emotes);

        // document.addEventListener("click", (event: any) => {
        //     if (this.searchResultsetDivElement && event.target !== this.searchResultsetDivElement) {
        //         if (event.target !== this.searchResultsetULElement && event.target.id === "emote") {
        //             this.searchResultsetDivElement.style.visibility = "hidden";
        //             this.closeEmotesMenuEvent.emit();
        //         }
        //     }
        // });
    }

    emoteSelect(emote: emote) {
        console.log(emote);
        this.emoteSelectedEvent.emit(emote);
    }

}
