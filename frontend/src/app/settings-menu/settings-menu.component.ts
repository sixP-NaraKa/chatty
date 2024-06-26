import { Component, OnDestroy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Settings } from '../../../../shared/types/db-dtos';
import { UserSettingsService } from '../services/user-settings.service';
import { UserService } from '../services/user.services';

@Component({
    selector: 'app-settings-menu',
    templateUrl: './settings-menu.component.html',
    styleUrls: ['./settings-menu.component.scss'],
})
export class SettingsMenuComponent implements OnDestroy {
    userSettings!: Settings;

    shouldShowMenu: boolean = false;

    settingsMenuFormGroup: UntypedFormGroup = new UntypedFormGroup({
        filterRadio: new UntypedFormControl(this.userSettings?.filter, Validators.required),
        fontSize: new UntypedFormControl(this.userSettings?.font_size, Validators.required),
        embedYouTubeVideos: new UntypedFormControl(this.userSettings?.embed_yt_videos, Validators.required),
    });

    availableFontSizes = [
        { value: 'default', text: 'default' },
        { value: 'text-sm', text: 'text-sm (14px)' },
        { value: 'text-base', text: 'text-base (16px)' },
        { value: 'text-lg', text: 'text-lg (18px)' },
        { value: 'text-xl', text: 'text-xl (20px)' },
        { value: 'text-2xl', text: 'text-2xl (22px)' },
    ];

    currentUserSettingsSubscription: Subscription;

    constructor(private userService: UserService, private settingsService: UserSettingsService) {
        this.currentUserSettingsSubscription = this.settingsService.currentUserSettingsSubject$.subscribe((stts) => {
            if (stts == null) return;
            this.userSettings = stts;
            this.settingsMenuFormGroup.setValue({
                filterRadio: this.userSettings.filter,
                fontSize: this.userSettings.font_size,
                embedYouTubeVideos: this.userSettings.embed_yt_videos,
            });
        });
    }

    ngOnDestroy(): void {
        this.currentUserSettingsSubscription.unsubscribe();
    }

    /**
     * Submit form with (new) user settings to save.
     */
    onSubmit() {
        this.shouldShowMenu = false;
        this.userSettings.filter = this.settingsMenuFormGroup.value.filterRadio as string;
        this.userSettings.font_size = this.settingsMenuFormGroup.value.fontSize as string;
        this.userSettings.embed_yt_videos = this.settingsMenuFormGroup.value.embedYouTubeVideos as boolean;
        // save the new settings in the db
        this.userService.updateUserSettings(this.userSettings);
        this.settingsService.currentUserSettingsSubject$.next(this.userSettings);
    }
}
