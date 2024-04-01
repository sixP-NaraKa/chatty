import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EMPTY, of } from 'rxjs';
import { Emote } from '../../../../shared/types/db-dtos';
import { UserService } from '../services/user.services';
import { EmoteSelectComponent } from './emote-select.component';

describe('EmoteSelectComponent', () => {
    let component: EmoteSelectComponent;
    let fixture: ComponentFixture<EmoteSelectComponent>;
    let userServiceMock: Partial<UserService>;

    beforeEach(async () => {
        userServiceMock = {
            getAvailableEmotes: jest.fn().mockImplementation((_) => EMPTY),
        };

        await TestBed.configureTestingModule({
            declarations: [EmoteSelectComponent],
            providers: [{ provide: UserService, useValue: userServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(EmoteSelectComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(async () => {
        jest.clearAllMocks();
    });

    test('should be created', () => {
        expect(component).toBeTruthy();
    });

    describe('ngAfterViewInit', () => {
        test('should show available emotes', () => {
            component.showEmotesMenu = true;
            const emotes: Emote[] = [
                {
                    emote: 'Test Emote',
                    emote_id: 1,
                    name: 'Test Emote Name',
                },
                {
                    emote: 'Test Emote 2',
                    emote_id: 2,
                    name: 'Test Emote Name 2',
                },
                {
                    emote: 'Test Emote 3',
                    emote_id: 3,
                    name: 'Test Emote Name 3',
                },
            ];

            userServiceMock.getAvailableEmotes = jest.fn().mockReturnValue(of(emotes));

            component.ngAfterViewInit();
            // trigger [hidden] check and *ngFor directive
            fixture.detectChanges();

            expect(userServiceMock.getAvailableEmotes).toHaveBeenCalledTimes(1);
            expect(component.availableEmotes).toBe(emotes);
            expect(component.filteredEmotes).toBe(emotes);

            expect(component.emoteSearchInputElement).not.toBeNull();
            expect(component.emoteSearchInputElement.onkeyup).not.toBeNull();

            expect(fixture.debugElement.query(By.css('#emotesContainerId')).nativeElement.hidden).toBeFalsy();
            expect(fixture.debugElement.queryAll(By.css('ul li'))).toHaveLength(3);
        });
    });

    test('should select emote', () => {
        const emote: Emote = {
            emote: 'Test Emote',
            emote_id: 1,
            name: 'Test Emote Name',
        };
        const spy = jest.spyOn(component.emoteSelectedEvent, 'emit').mockImplementation();
        component.emoteSelect(emote);

        expect(spy).toHaveBeenCalledWith(emote);
    });

    test('should fire emoteSelect', () => {
        const emote: Emote = {
            emote: 'Test Emote',
            emote_id: 1,
            name: 'Test Emote Name',
        };
        component.filteredEmotes.push(emote);
        const spy = jest.spyOn(component, 'emoteSelect').mockImplementation();

        fixture.detectChanges();
        fixture.debugElement.query(By.css('li')).triggerEventHandler('click', emote);

        expect(spy).toHaveBeenCalledWith(emote);
    });

    test('should filter emotes', () => {
        const emotes: Emote[] = [
            {
                emote: 'Test Emote',
                emote_id: 1,
                name: 'Test Emote Name',
            },
            {
                emote: 'Test Emote 2',
                emote_id: 2,
                name: 'Test Emote Name 2',
            },
            {
                emote: 'Test Emote 3',
                emote_id: 3,
                name: 'Test Emote Name 3',
            },
        ];
        component.availableEmotes = emotes;
        component.filteredEmotes = emotes;

        (fixture.debugElement.query(By.css('#emoteSearchInput')).nativeElement as HTMLInputElement).value =
            'Test Emote Name 3';

        component.filterEmotes();

        expect(component.filteredEmotes).toHaveLength(1);
        expect(component.filteredEmotes).toContain(emotes[2]);

        fixture.detectChanges();
        expect(fixture.debugElement.queryAll(By.css('ul li'))).toHaveLength(1);
    });
});
