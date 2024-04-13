import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SliderComponent } from './slider.component';

describe('SliderComponent', () => {
    let component: SliderComponent;
    let fixture: ComponentFixture<SliderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SliderComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SliderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(async () => {});

    test('should be created', () => {
        expect(component).toBeTruthy();
    });

    test('should be sliding in from left (default)', () => {
        expect(component.sliderContentClass).toBe('sliderContentFromLeft');

        const sliderContentElement = fixture.debugElement.query(By.css(`#${component.generatedSliderId}`))
            .nativeElement as HTMLDivElement;
        expect(sliderContentElement.style.display).toBeFalsy();

        fixture.debugElement.query(By.css('div > button')).triggerEventHandler('click', {});

        expect(sliderContentElement.style.display).toBe('block');
    });

    test('should be sliding in from right', () => {
        component.slideFromRight = true;
        component.ngOnInit();
        fixture.detectChanges();

        expect(component.sliderContentClass).toBe('sliderContentFromRight');

        const sliderContentElement = fixture.debugElement.query(By.css(`#${component.generatedSliderId}`))
            .nativeElement as HTMLDivElement;
        expect(sliderContentElement.style.display).toBeFalsy();

        fixture.debugElement.query(By.css('div > button')).triggerEventHandler('click', {});

        expect(sliderContentElement.style.display).toBe('block');
    });

    test('should be sliding back', () => {
        const sliderContentElement = fixture.debugElement.query(By.css(`#${component.generatedSliderId}`))
            .nativeElement as HTMLDivElement;
        expect(sliderContentElement.style.display).toBeFalsy();

        fixture.debugElement.query(By.css('div > button')).triggerEventHandler('click', {});
        expect(sliderContentElement.style.display).toBe('block');

        fixture.debugElement.query(By.css('div > div > button')).triggerEventHandler('click', {});
        expect(sliderContentElement.classList).toContain('dismiss-left');
        expect(sliderContentElement.classList.contains('selected-left')).toBeFalsy();
    });
});
