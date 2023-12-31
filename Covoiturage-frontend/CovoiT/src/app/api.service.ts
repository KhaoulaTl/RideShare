import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip } from './models/carpool.model';
import { User } from './models/user.model';
import { environment } from '../environments/environment';



@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly baseUrl: string = environment.API_BASE_URL;

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Trip[]> {
    const url = `${this.baseUrl}/search`;
    return this.httpClient.get<Trip[]>(url);
  }

  searchTrips(departure: string, arrival: string, date: string, seats: number): Observable<Trip[]> {
    const url = `${this.baseUrl}/search/${departure}/${arrival}`;
    let params = new HttpParams();
    if (date) {
      params = params.append('date', date);
    }
    if (seats) {
      params = params.append('seat', seats.toString());
    }
    return this.httpClient.get<Trip[]>(url, { params });
  }

  registerUser(user: User): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/signup`, user, { withCredentials: true });
  }

  login(email: string, password: string): Observable<any> {
    const body = { email: email, password: password };
    return this.httpClient.post<any>(`${this.baseUrl}/login`, body, { withCredentials: true });
  }

  getUserInfo(): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/profile`, {
      withCredentials: true
    });
  }

  updateUserInfo(data: any): Observable<any> {
    const body = {
      firstname: data.firstname,
      name: data.name,
      email: data.email,
      phone: data.phone,
      birthdate: data.birthdate,
      pref_animals: data.pref_animals,
      pref_talk: data.pref_talk,
      pref_smoking: data.pref_smoking,
      brand: data.vehicleBrand,
      model: data.vehicleModel,
      color: data.vehicleColor,
      registration: data.vehicleRegistration,
      card_num: data.cardNumber,
      card_cvc: data.cardCode,
      card_exp: data.cardExpiration
    }
    return this.httpClient.post<any>(`${this.baseUrl}/profile/edit`, body, { withCredentials: true });
  }

  updatePassword(data: any): Observable<any> {
    const body = {
      password: data.currentPassword,
      new_password: data.password
    }
    return this.httpClient.post<any>(`${this.baseUrl}/profile/password`, body, { withCredentials: true });
  }

  publishTrip(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/publish`, data, { withCredentials: true });
  }

  getTrips(): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/trips`, { withCredentials: true });
  }

  getTrip(id: string): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/trip/${id}`, { withCredentials: true });
  }

  getPending(id: string): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/pending/${id}`, { withCredentials: true });
  }

  acceptPending(tripId: string, idPassenger: string): Observable<any> {
    const body = { trip_id: tripId, passenger_id: idPassenger };
    return this.httpClient.post<any>(`${this.baseUrl}/pending/accept`, body, { withCredentials: true });
  }

  rejectPending(tripId: string, idPassenger: string): Observable<any> {
    const body = { trip_id: tripId, passenger_id: idPassenger };
    return this.httpClient.post<any>(`${this.baseUrl}/pending/reject`, body, { withCredentials: true });
  }

  bookSeat(tripId: string): Observable<any> {
    const body = { trip_id: tripId };
    return this.httpClient.post<any>(`${this.baseUrl}/trip/` + tripId + `/book`, body, { withCredentials: true });
  }

  getSimpleUser(ids: String[]): Observable<any> {

    return this.httpClient.post<any>(`${this.baseUrl}/usersimple`, { ids }, { withCredentials: true });
  }

  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.httpClient.post<any>(`${this.baseUrl}/picture`, formData, { withCredentials: true });
  }



}

