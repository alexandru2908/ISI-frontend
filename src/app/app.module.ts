import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { EsriMapComponent } from "./pages/esri-map/esri-map.component";
import { AppRoutingModule } from "./app-routing.module";

import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';

import { FlexLayoutModule } from '@angular/flex-layout';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';

import { FirebaseService } from './services/firebase';
import { environment } from '../environments/environment';
import { CommonModule } from "@angular/common";

import { RegisterComponent } from './pages/register/register.component'; // Import RegisterComponent
import {DashboardAdminComponent} from './pages/dashboard-admin/dashboard-admin.component'; // Import DashboardAdminComponent
import { HomeComponent } from './pages/home/home.component'; // Import HomeComponent
import { ViewCarComponent } from './pages/view_car/view_car.component'; // Import ViewCarComponent
import { DashboardComponent } from './pages/dashboard/dashboard.component'; // Import DashboardComponent



@NgModule({
  declarations: [AppComponent, EsriMapComponent, RegisterComponent, DashboardAdminComponent, HomeComponent, ViewCarComponent, DashboardComponent], // Add RegisterComponent to declarations
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    FlexLayoutModule,
    AngularFireModule.initializeApp(environment.firebase, 'AngularDemoFirebase'),
    AngularFireDatabaseModule],
  providers: [FirebaseService],
  bootstrap: [AppComponent]
})
export class AppModule { }
