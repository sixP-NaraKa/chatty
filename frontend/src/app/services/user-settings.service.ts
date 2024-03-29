import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { Settings } from '../../../../shared/types/db-dtos';
import { UserService } from './user.services';

@Injectable({
    providedIn: 'root',
})
export class UserSettingsService {
    public currentUserSettingsSubject$: ReplaySubject<Settings> = new ReplaySubject<Settings>(1);

    constructor(private userService: UserService) {}

    public loadUserSettings(): void {
        this.userService.getUserSettings().subscribe((settings) => {
            this.currentUserSettingsSubject$.next(settings);
        });
    }

    public clearUserSettings() {
        this.currentUserSettingsSubject$.complete();
        this.currentUserSettingsSubject$ = new ReplaySubject<Settings>(1);
    }
}
