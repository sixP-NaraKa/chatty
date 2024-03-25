import { UrlifyPipe } from './urlify.pipe';

describe('UrlifyPipe', () => {
    test('create an instance', () => {
        const pipe = new UrlifyPipe();
        expect(pipe).toBeTruthy();
    });

    test('return highlighted URL', () => {
        const pipe = new UrlifyPipe();

        expect(pipe.transform('https://github.com/sixp-naraka/chatty')).toContain('target="_blank"');
    });

    test('return input value when URL has not been highlighted', () => {
        const pipe = new UrlifyPipe();
        const value = 'test value';
        expect(pipe.transform(value)).toBe(value);
    });

    test('return highlighted URL and image tag', () => {
        const pipe = new UrlifyPipe();
        expect(pipe.transform('https://github.com/sixp-naraka/chatty/docs/screenshots/testimage.png')).toContain(
            'alt="Loading image..."'
        );
    });
});
