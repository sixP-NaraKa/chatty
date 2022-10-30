import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'urlify'
})
export class UrlifyPipe implements PipeTransform {

    transform(value: string, ...args: unknown[]): string {
        return this.urlify(value);
    }

    // https://urlregex.com/
    urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
    /**
     * Helper method to highlight URLs in a given message. Returns the new replaced message with, if available, highlighted URLs.
     * 
     * @param msg message to highlight URLs in
     * @returns 
     */
    urlify(msg: string): string {
        return msg.replace(new RegExp(this.urlRegex), match => {
            return `<a href="${match}" target="_blank" rel="noreferrer noopener" class="text-blue-500">${match}</a>`
        });
    }

}
