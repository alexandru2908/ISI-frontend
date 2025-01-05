import { Component } from "@angular/core";

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

    constructor() {

    }

    selectedOption: string = 'admin';
    dropdownOpen: boolean = false;

    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
    }

    selectOption(option: string) {
        this.selectedOption = option;
        this.dropdownOpen = false;
    }

    async register(user : string, pass : string) {

        let res = await fetch ('http://localhost:3000/add-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "username": user,
                "password": pass,
                "role": this.selectedOption
            }) })
        

        // console.log(res.status);
        
 
        if (res.status == 201) {
            window.location.href = "/home";
        }
    }

    


}