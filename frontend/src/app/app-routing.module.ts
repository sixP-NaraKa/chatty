import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { ChatComponent } from './chat/chat.component';
import { LoginFormComponent } from './login-form/login-form.component';

const routes: Routes = [
    {
        path: "", component: LoginFormComponent,
    },
    {
        path: "chat", component: ChatComponent,
        canActivate: [AuthGuard]
    },
    {
        path: "**", redirectTo: "chat", // either redirect to login (and then check if not logged in via cookies) or display notification on the chat component itself,
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
