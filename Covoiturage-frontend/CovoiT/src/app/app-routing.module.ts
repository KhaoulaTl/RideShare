import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { HomepageComponent } from './homepage/homepage.component';
import { LoginpageComponent } from './loginpage/loginpage.component';
import { NewAccountComponent } from './new-account/new-account.component';
import { SearchpageComponent } from './searchpage/searchpage.component';
import { ProfilepageComponent } from './profilepage/profilepage.component';
import { PublishPageComponent } from './publish-page/publish-page.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { MyTripsComponent } from './my-trips/my-trips.component';
import { TripModalComponent } from './trip-modal/trip-modal.component';
import { PasswordEditPageComponent } from './password-edit-page/password-edit-page.component';
import { EditPicComponent } from './edit-pic/edit-pic.component';
import { AuthGuard } from './auth.guard';

const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'login', component: LoginpageComponent },
  { path: 'register', component: NewAccountComponent },
  { path: 'search', component: SearchpageComponent },
  { path: 'profile', component: ProfilepageComponent, canActivate: [AuthGuard] },
  { path: 'publish', component: PublishPageComponent, canActivate: [AuthGuard] },
  { path: 'profile/edit', component: EditProfileComponent, canActivate: [AuthGuard] },
  { path: 'trips', component: MyTripsComponent, canActivate: [AuthGuard] },
  { path: 'trip/:id', component: TripModalComponent },
  { path: 'profile/edit/password', component: PasswordEditPageComponent, canActivate: [AuthGuard] },
  { path: 'profile/edit/picture', component: EditPicComponent, canActivate: [AuthGuard] }

];

@NgModule({
  imports: [RouterModule.forRoot(routes), MatTabsModule],
  exports: [RouterModule]
})
export class AppRoutingModule { }
