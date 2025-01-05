import { Component } from "@angular/core";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {

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

        let res = await username.json();
        console.log(res);

        if (res.message === "User logged in successfully" ) {
            if (res.role === "admin") {
                window.location.href = "/dashboard-admin";
            } else {
                window.location.href = "/dashboard";
            }
        }
    }


    goToRegister() {
        window.location.href = "/register";
    }


    


}