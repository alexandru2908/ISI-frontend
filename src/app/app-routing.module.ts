import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { EsriMapComponent } from './pages/esri-map/esri-map.component';
import { HomeComponent } from './pages/home/home.component';

import { RegisterComponent } from './pages/register/register.component';
import { DashboardAdminComponent } from './pages/dashboard-admin/dashboard-admin.component';
import { ViewCarComponent } from './pages/view_car/view_car.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';


export const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'map',
    component: EsriMapComponent,
  },
  {
    path : 'dashboard',
    component : DashboardComponent
  },
  {
    path : 'register',
    component : RegisterComponent
  },
  {
    path : 'dashboard-admin',
    component : DashboardAdminComponent
  },
  {
    path: 'view_car',
    component: ViewCarComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  }
];

const config: ExtraOptions = {
  useHash: false,
};

@NgModule({
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
