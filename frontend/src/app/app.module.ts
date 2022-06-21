import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChatTabsComponent } from './chat-tabs/chat-tabs.component';
import { HttpClientModule } from '@angular/common/http';
import { LoginFormComponent } from './login-form/login-form.component';
import { ChatComponent } from './chat/chat.component';
import { jwtInterceptorProvider } from './auth/interceptor/jwt.interceptor';
import { RegistrationFormComponent } from './registration-form/registration-form.component';

@NgModule({
    declarations: [
        AppComponent,
        ChatTabsComponent,
        LoginFormComponent,
        ChatComponent,
        RegistrationFormComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        ReactiveFormsModule
    ],
    providers: [jwtInterceptorProvider],
    bootstrap: [AppComponent]
})
export class AppModule { }
