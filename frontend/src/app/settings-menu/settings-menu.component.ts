import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserSettings } from '../../../../shared/types/user-settings';

@Component({
    selector: 'app-settings-menu',
    templateUrl: './settings-menu.component.html',
    styleUrls: ['./settings-menu.component.scss']
})
export class SettingsMenuComponent implements OnInit {

    // TODO: these settings will be fetched later from the db,
    // and supplied to the respective FormControl
    userSettings: UserSettings = {
        filter: "nofilter",
        fontSize: "12px",
    }

    @Input()
    shouldShowMenu: boolean = false;

    @Output()
    settingsMenuClosedEvent = new EventEmitter<boolean>();

    @Output()
    applySettingsEvent = new EventEmitter<UserSettings>();

    settingsMenuFormGroup = new FormGroup({
        filterRadio: new FormControl(this.userSettings.filter, Validators.required),
    });

    constructor() { }

    ngOnInit(): void {
    }

    closeMenu() {
        this.shouldShowMenu = false;
        this.settingsMenuClosedEvent.emit(false);
    }

    /**
     * Submit form with (new) user settings to save.
     */
    onSubmit() {
        console.log(this.settingsMenuFormGroup.value);
        this.applySettingsEvent.emit(this.userSettings);
    }

}
