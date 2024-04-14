import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { ToastNoAnimationModule, ToastrModule } from 'ngx-toastr';
import config from 'src/environments/config';
import { UnauthorizedErroHandler } from './401-errorhandler';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { jwtInterceptorProvider } from './auth/interceptor/jwt.interceptor';
import { ChatPageComponent } from './chat-page/chat-page.component';
import { ChatTabsComponent } from './chat-tabs/chat-tabs.component';
import { ChatComponent } from './chat/chat.component';
import { DragAndDropFileDirective } from './directives/drag-and-drop-file.directive';
import { EmoteSelectComponent } from './emote-select/emote-select.component';
import { GroupChatUsersComponent } from './group-chat-users/group-chat-users.component';
import { GroupChatWindowComponent } from './group-chat-window/group-chat-window.component';
import { HeaderComponent } from './header/header.component';
import { LoginFormComponent } from './login-form/login-form.component';
import { NotificationSummaryComponent } from './notification-summary/notification-summary.component';
import { EmbedPipe } from './pipes/embed.pipe';
import { GetImagePipe } from './pipes/getimage.pipe';
import { ImageifyPipe } from './pipes/imageify.pipe';
import { ScrollintoviewPipe } from './pipes/scrollintoview.pipe';
import { UrlifyPipe } from './pipes/urlify.pipe';
import { RegistrationFormComponent } from './registration-form/registration-form.component';
import { WebsocketService } from './services/websocket.service';
import { SettingsMenuComponent } from './settings-menu/settings-menu.component';
import { SliderComponent } from './slider/slider.component';
import { UserSearchComponent } from './user-search/user-search.component';
import { VoiceChatComponent } from './voice-chat/voice-chat.component';

const socketconfig: SocketIoConfig = { url: config.BACKEND_HOST, options: { autoConnect: false } };

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
        EmbedPipe,
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
            positionClass: 'toast-top-right',
            onActivateTick: true,
        }),
    ],
    providers: [
        jwtInterceptorProvider,
        WebsocketService,
        { provide: ErrorHandler, useClass: UnauthorizedErroHandler },
        UrlifyPipe,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
