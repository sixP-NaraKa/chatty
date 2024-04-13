import { TestBed, inject } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { ImageifyPipe } from './imageify.pipe';

describe('ImageifyPipe', () => {
    let domSanitizer: DomSanitizer;

    const domSanitizerSpy = {
        bypassSecurityTrustResourceUrl: jest.fn().mockReturnValue({}),
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: DomSanitizer, useValue: domSanitizerSpy }],
        });
        domSanitizer = TestBed.inject(DomSanitizer);
    });

    afterEach(async () => {
        jest.clearAllMocks();
    });

    test('create an instance', inject([DomSanitizer], (domSanitizer: DomSanitizer) => {
        const pipe = new ImageifyPipe(domSanitizer);
        expect(pipe).toBeTruthy();
    }));

    test('return nothing', async () => {
        const pipe = new ImageifyPipe(domSanitizer);
        await expect(pipe.transform(null)).resolves.toBeUndefined();
    });

    test('return blob', async () => {
        const pipe = new ImageifyPipe(domSanitizer);
        await expect(pipe.transform(new File([], 'image.png'))).resolves.not.toBeNull();
        expect(domSanitizerSpy.bypassSecurityTrustResourceUrl).toBeCalledTimes(1);
    });
});
