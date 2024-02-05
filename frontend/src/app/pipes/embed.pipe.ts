import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UrlifyPipe } from './urlify.pipe';

@Pipe({
    name: 'embed',
})
export class EmbedPipe implements PipeTransform {
    constructor(private urlifyPipe: UrlifyPipe, private domSanitizer: DomSanitizer) {}

    transform(value: string, ...args: unknown[]): Array<SafeResourceUrl> {
        return this.embed(value);
    }

    private embed(msg: string): Array<SafeResourceUrl> {
        const matches = Array.from(msg.matchAll(new RegExp(this.urlifyPipe.urlRegex, 'g')));
        if (matches === null) return [];

        const urls = new Array<SafeResourceUrl>();
        for (const [match] of matches) {
            if (match.includes('youtube.com/watch?v=')) {
                const embedUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(
                    match.replace('youtube.com/watch?v=', 'youtube.com/embed/')
                );
                urls.push(embedUrl);
            }
        }
        return urls;
    }
}
