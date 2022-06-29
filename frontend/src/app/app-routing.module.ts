import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { ChatPageComponent } from './chat-page/chat-page.component';
import { ChatComponent } from './chat/chat.component';
import { LoginGuard } from './guard/login.guard';
import { LoginFormComponent } from './login-form/login-form.component';
import { RegistrationFormComponent } from './registration-form/registration-form.component';

const routes: Routes = [
    {
        path: "login", component: LoginFormComponent,
        canActivate: [LoginGuard]
    },
    {
        path: "register", component: RegistrationFormComponent,
        canActivate: [LoginGuard]
    },
    {
        path: "", component: ChatPageComponent,
        canActivate: [AuthGuard],
        children: [
            ...["chat", "chats"].map(path => ({
                path,
                component: ChatPageComponent
            }))
        ]
    },
    {
        path: "**", redirectTo: "chat",
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
