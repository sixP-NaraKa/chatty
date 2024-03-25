import { inject } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { EmbedPipe } from './embed.pipe';
import { UrlifyPipe } from './urlify.pipe';

fdescribe('EmbedPipe', () => {
    let pipe: EmbedPipe;

    beforeEach(inject([DomSanitizer], (domSanitizer: DomSanitizer) => {
        domSanitizer.bypassSecurityTrustResourceUrl = jest.fn().mockReturnValue('');
        pipe = new EmbedPipe(new UrlifyPipe(), domSanitizer);
    }));

    afterEach(async () => {
        jest.clearAllMocks();
    });

    test('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    test('return empty array if value does not match', () => {
        expect(pipe.transform('test value')).toHaveLength(0);
    });

    test('return non-empty array if value does match', () => {
        expect(pipe.transform('https://youtube.com/watch?v=')).toHaveLength(1);
    });
});
