import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { settings } from '../../../../shared/types/db-dtos';
import { UserService } from './user.services';

@Injectable({
    providedIn: 'root'
})
export class UserSettingsService {

    public currentUserSettingsSubject$: ReplaySubject<settings> = new ReplaySubject<settings>(1);

    constructor(private userService: UserService) {
        this.userService.getUserSettings(this.userService.currentUser.userId).subscribe(settings => {
            this.currentUserSettingsSubject$.next(settings);
        });

        // let settings: settings;
        // (async () => {
        //     settings = await new Promise(resolve => {
        //         this.userService.getUserSettings(this.userService.currentUser.userId).subscribe(settings => {
        //             // this.currentUserSettingsSubject$.next(settings);
        //             resolve(settings);
        //         });
        //     });
        //     // this.currentUserSettingsSubject$.next(settings);
        // })();
        // // @ts-ignore
        // this.currentUserSettingsSubject$ = new BehaviorSubject<settings | null>(settings)
    }
}
