import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { settings } from '../../../../shared/types/db-dtos';
import { UserSettingsService } from '../services/user-settings.service';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-settings-menu',
    templateUrl: './settings-menu.component.html',
    styleUrls: ['./settings-menu.component.scss']
})
export class SettingsMenuComponent implements OnInit {

    userSettings!: settings;

    @Input()
    shouldShowMenu: boolean = false;

    @Output()
    settingsMenuClosedEvent = new EventEmitter<boolean>();

    /**
     * @deprecated
    */
    @Output()
    applySettingsEvent = new EventEmitter<settings>();

    settingsMenuFormGroup: FormGroup = new FormGroup({
        filterRadio: new FormControl(this.userSettings?.filter, Validators.required),
        fontSize: new FormControl(this.userSettings?.font_size, Validators.required)
    });

    availableFontSizes = [
        { value: "default", text: "default" },
        { value: "text-sm", text: "text-sm (14px)" },
        { value: "text-base", text: "text-base (16px)" },
        { value: "text-lg", text: "text-lg (18px)" },
        { value: "text-xl", text: "text-xl (20px)" },
        { value: "text-2xl", text: "text-2xl (22px)" },
    ];

    constructor(private userService: UserService, private settingsService: UserSettingsService) {
        this.settingsService.currentUserSettingsSubject$.subscribe(stts => {
            if (stts == null) return;
            this.userSettings = stts;
            // for now, as a workaround, simply overwrite the existing FormGroup to the correct one
            this.settingsMenuFormGroup = new FormGroup({
                filterRadio: new FormControl(this.userSettings.filter, Validators.required),
                fontSize: new FormControl(this.userSettings.font_size, Validators.required)
            });
        });
    }

    ngOnInit(): void {
    }

    /**
     * Close the settings menu window.
     */
    closeMenu() {
        this.shouldShowMenu = false;
        this.settingsMenuClosedEvent.emit(false);
    }

    /**
     * Submit form with (new) user settings to save.
     */
    onSubmit() {
        this.closeMenu();
        this.userSettings.filter = this.settingsMenuFormGroup.value.filterRadio as string;
        this.userSettings.font_size = this.settingsMenuFormGroup.value.fontSize as string;
        // save the new settings in the db
        this.userService.updateUserSettings(this.userSettings);
        // emit the user settings
        this.applySettingsEvent.emit(this.userSettings);
        this.settingsService.currentUserSettingsSubject$.next(this.userSettings);
    }

}
