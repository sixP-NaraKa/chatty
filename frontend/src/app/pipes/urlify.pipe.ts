import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'urlify',
})
export class UrlifyPipe implements PipeTransform {
    transform(value: string, ...args: unknown[]): string {
        return this.urlify(value);
    }

    // https://urlregex.com/
    urlRegex = /(https:\/\/|http:\/\/)\S+/;
    /**
     * Helper method to highlight URLs in a given message. Returns the new replaced message with, if available, highlighted URLs.
     * Also checks if the matched message is a "valid" image URL and constructs an <img> tag out of it.
     *
     * @param msg message to highlight URLs in
     * @returns
     */
    urlify(msg: string): string {
        return this.replaceWhenMatched(msg, (match) => {
            const isImageUrl = this.isImageUrl(match);
            const html = `<a href="${match}" target="_blank" rel="noreferrer noopener" class="text-blue-500">${match}</a>
            ${isImageUrl ? `<img src="${match}" alt="Loading image..." class="max-h-80">` : ''}`;
            return html;
        });
    }

    private replaceWhenMatched(msg: string, callbackWhenMatched: (match: string) => string): string {
        return msg.replace(new RegExp(this.urlRegex, 'g'), (match) => callbackWhenMatched(match));
    }

    // https://stackoverflow.com/a/19395606 - slightly modified
    private isImageUrl(url: string): boolean {
        //make sure we remove any nasty GET params
        url = url.split('?')[0];
        //moving on, split the uri into parts that had dots before them
        var parts = url.split('.');
        //get the last part ( should be the extension )
        var extension = parts[parts.length - 1];
        //define some image types to test against
        var imageTypes = ['jpg', 'jpeg', 'tiff', 'png', 'gif', 'bmp'];
        //check if the extension matches anything in the list.
        return imageTypes.indexOf(extension) !== -1;
    }
}
