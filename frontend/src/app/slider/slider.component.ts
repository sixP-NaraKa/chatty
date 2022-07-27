import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-slider',
    templateUrl: './slider.component.html',
    styleUrls: ['./slider.component.scss']
})
export class SliderComponent implements OnInit {

    generatedSliderId: string = "slider" + Math.random().toString().substring(2, 8);

    @Input()
    slideFromRight: boolean = false;

    @Input()
    slideFromLeft: boolean = false;

    @Input()
    shouldFadeSliderButton: boolean = false;
    @Input()
    showArrowIcons: boolean = true;

    sliderContentClass: string = "";
    selectedClass: string = "";
    dismissedClass: string = "";

    slideContentInButtonClass: string = "";
    slideContentOutButtonClass: string = "";
    slideContentInButtonArrowPositionIconClass: string = "";
    slideContentOutButtonArrowPositionIconClass: string = "";

    constructor() { }

    ngOnInit(): void {
        // define usages of HTML classes to use in template
        if (this.slideFromRight) {
            this.sliderContentClass = "sliderContentFromRight";
            this.selectedClass = "selected-right";
            this.dismissedClass = "dismiss-right";
            this.slideContentInButtonClass = "right-0";
            this.slideContentOutButtonClass = "left-0";
            this.slideContentInButtonArrowPositionIconClass = "fa-arrow-left";
            this.slideContentOutButtonArrowPositionIconClass = "fa-arrow-right";
        }
        else {
            this.sliderContentClass = "sliderContentFromLeft";
            this.selectedClass = "selected-left";
            this.dismissedClass = "dismiss-left";
            this.slideContentInButtonClass = "left-0";
            this.slideContentOutButtonClass = "right-0";
            this.slideContentInButtonArrowPositionIconClass = "fa-arrow-right";
            this.slideContentOutButtonArrowPositionIconClass = "fa-arrow-left";
        }
    }

    /**
       * On click method for the slide-in / slide-out functionality.
       */
    onSliderClick() {
        const element = (document.getElementById(this.generatedSliderId) as HTMLDivElement);
        if (element.classList.contains(this.dismissedClass)) {
            element.classList.remove(this.dismissedClass);
            element.classList.add(this.selectedClass);
            element.style.display = "block";
        }
        else if (element.classList.contains(this.selectedClass)) {
            element.classList.remove(this.selectedClass);
            element.classList.add(this.dismissedClass);
        }
    }


}
