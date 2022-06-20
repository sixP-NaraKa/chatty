import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { ChatComponent } from './chat/chat.component';
import { LoginGuard } from './guard/login.guard';
import { LoginFormComponent } from './login-form/login-form.component';

const routes: Routes = [
    {
        path: "login", component: LoginFormComponent,
        canActivate: [LoginGuard]
    },
    {
        path: "", component: ChatComponent,
        canActivate: [AuthGuard],
        children: [
            ...["chat", "chats"].map(path => ({
                path,
                component: ChatComponent
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
