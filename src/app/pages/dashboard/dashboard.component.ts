import { Component } from "@angular/core";

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

    constructor() {

    }

    async login(user : string, pass : string) {

        let username = await fetch ('http://localhost:3000/login-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "username": user,
                "password": pass
            }) })

        let res = await username.text();
        console.log(res);

        if (res === "User logged in successfully") {
            window.location.href = "/dashboard";
        }
    }



}