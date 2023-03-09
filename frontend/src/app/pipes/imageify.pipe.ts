import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
    name: 'imageify'
})
export class ImageifyPipe implements PipeTransform {

    constructor(private domSanitizer: DomSanitizer) { }

    async transform(value: Blob | null, ...args: unknown[]): Promise<any> {
        if (value === null) return;
        return await this.imageify(value);
    }

    private async imageify(image: Blob): Promise<any> {
        // const img: Blob = image ?? new File([], "image.png");
        const url: any = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = function (e) {
                resolve(e.target?.result);
            }
            reader.readAsDataURL(image);
        });
        return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
    }

}
