import { Directive, ElementRef, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

@Directive({
    selector: '[appDragAndDropFile]',
})
export class DragAndDropFileDirective {
    @Output() onFileDrop = new EventEmitter<Array<File>>();

    @HostBinding('class.dragAndDropArea') dragAndDropAreaEnabled = false;
    @HostBinding('class.blurDuringDragAndDrop') dragAndDropAreaBlur = false;

    chatWindow: HTMLDivElement;

    constructor(elRef: ElementRef) {
        this.chatWindow = elRef.nativeElement;
    }

    @HostListener('dragover', ['$event']) onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        // if (event.currentTarget === this.chatWindow) {
        this.dragAndDropAreaEnabled = true;
        this.dragAndDropAreaBlur = true;
        // }
    }

    @HostListener('dragleave', ['$event']) onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (event.target === this.chatWindow) {
            this.dragAndDropAreaEnabled = false;
            this.dragAndDropAreaBlur = false;
        }
    }

    @HostListener('drop', ['$event']) onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.dragAndDropAreaEnabled = false;
        this.dragAndDropAreaBlur = false;
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.onFileDrop.emit(Array.from(files));
        }
    }
}
