import { Component } from "@angular/core";


@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})

export class RegisterComponent {

    someNumber: number = 5; // Initialize someNumber
    agencies: string[] = [];

    constructor() {
        this.initializeAgencies();

    }
    selectedOption: string = 'admin';
    selectedAgency: string;
    dropdownOpenAgency: boolean = false;
    dropdownOpen: boolean = false;

    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
    }

    toggleDropdownAgency() {
        this.dropdownOpenAgency = !this.dropdownOpenAgency;
    }

    selectOption(option: string) {
        this.selectedOption = option;
        this.dropdownOpen = false;
    }

    selectAgency(option: string) {
        this.selectedAgency = option;
        this.dropdownOpenAgency = false;
    }

    

    async initializeAgencies() {
        let data = await this.getAgencies();
        console.log('Agencies:', data); // Debugging line
        
        for (let i = 0; i < data.length; i++) {
            this.agencies.push(data[i].agency_name); // Correct property name
        }
    }

    async getAgencies() {
        let res = await fetch('http://localhost:3000/get-agencies');
        let data = await res.json();

        return data;
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
                "role": this.selectedOption,
                "agency": this.selectedAgency
            }) })
        

        // console.log(res.status);
        
 
        if (res.status == 201) {
            window.location.href = "/home";
        }
    }

    


}