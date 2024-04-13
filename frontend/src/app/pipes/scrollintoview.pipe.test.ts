import { ScrollintoviewPipe } from './scrollintoview.pipe';

describe('ScrollintoviewPipe', () => {
    test('create an instance', () => {
        const pipe = new ScrollintoviewPipe();
        expect(pipe).toBeTruthy();
    });

    test('return given value', () => {
        const pipe = new ScrollintoviewPipe();
        const value = 'test value';
        expect(pipe.transform(value)).toBe(value);
    });
});
