import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChatTabsComponent } from './chat-tabs/chat-tabs.component';
import { HttpClientModule } from '@angular/common/http';
import { LoginFormComponent } from './login-form/login-form.component';
import { ChatComponent } from './chat/chat.component';
import { jwtInterceptorProvider } from './auth/interceptor/jwt.interceptor';
import { RegistrationFormComponent } from './registration-form/registration-form.component';
import { WebsocketService } from './services/websocket.service';
import { UnauthorizedErroHandler } from './401-errorhandler';
import { HeaderComponent } from './header/header.component';
import { UserSearchComponent } from './user-search/user-search.component';
import { ChatPageComponent } from './chat-page/chat-page.component';
import { SettingsMenuComponent } from './settings-menu/settings-menu.component';
import { GroupChatWindowComponent } from './group-chat-window/group-chat-window.component';
import { GroupChatUsersComponent } from './group-chat-users/group-chat-users.component';
import { EmoteSelectComponent } from './emote-select/emote-select.component';
import config from 'src/environments/config';
import { VoiceChatComponent } from './voice-chat/voice-chat.component';
import { SliderComponent } from './slider/slider.component';
import { NotificationSummaryComponent } from './notification-summary/notification-summary.component';
import { UrlifyPipe } from './pipes/urlify.pipe';
import { GetImagePipe } from './pipes/getimage.pipe';
import { ImageifyPipe } from './pipes/imageify.pipe';
import { ScrollintoviewPipe } from './pipes/scrollintoview.pipe';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { DragAndDropFileDirective } from './directives/drag-and-drop-file.directive';
import { FilehrefPipe } from './pipes/filehref.pipe';
import { ToastrModule, ToastNoAnimationModule } from 'ngx-toastr';

const socketconfig: SocketIoConfig = { url: config.BACKEND_HOST, options: { autoConnect: false } }

@NgModule({
    declarations: [
        AppComponent,
        ChatTabsComponent,
        LoginFormComponent,
        ChatComponent,
        RegistrationFormComponent,
        HeaderComponent,
        UserSearchComponent,
        ChatPageComponent,
        SettingsMenuComponent,
        GroupChatWindowComponent,
        GroupChatUsersComponent,
        EmoteSelectComponent,
        VoiceChatComponent,
        SliderComponent,
        NotificationSummaryComponent,
        UrlifyPipe,
        GetImagePipe,
        ImageifyPipe,
        ScrollintoviewPipe,
        DragAndDropFileDirective,
        FilehrefPipe,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        ReactiveFormsModule,
        SocketIoModule.forRoot(socketconfig),
        InfiniteScrollModule,
        ToastrModule,
        ToastNoAnimationModule.forRoot({
            timeOut: 7500,
            extendedTimeOut: 2500,
            closeButton: true,
            tapToDismiss: true,
            progressBar: true,
            positionClass: "toast-top-right",
            onActivateTick: true
        }),
    ],
    providers: [
        jwtInterceptorProvider,
        WebsocketService,
        { provide: ErrorHandler, useClass: UnauthorizedErroHandler }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
