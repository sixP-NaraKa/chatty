import { Pipe, PipeTransform } from '@angular/core';

/**
 * A pipe to scroll the latest message into view.
 * Made for "lazy loaded" images which are separately fetched and loaded.
 * 
 * This pipe returns whatever it was given as the "value" parameter - it does not act on any given values.
 */
@Pipe({
    name: 'scrollintoview'
})
export class ScrollintoviewPipe implements PipeTransform {

    transform(value: any, ...args: unknown[]): any {
        this.scrollToLatestMessage();
        return value;
    }

    scrollToLatestMessage() {
        setTimeout(function () {
            const lastMessageDiv = Array.from(document.getElementsByClassName("chat-message-div")).pop();
            lastMessageDiv?.scrollIntoView({ behavior: 'smooth' });
        }, 1);
    }

}
