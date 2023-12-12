import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';
import { AuthGuard } from '../auth.guard';
import { catchError, map } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { Location } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { LatLngTuple } from 'leaflet';


interface Passenger {
  passenger_id: string;
  // add any other properties that the passenger object has
}
@Component({
  selector: 'app-trip-modal',
  templateUrl: './trip-modal.component.html',
  styleUrls: ['./trip-modal.component.css']
})


export class TripModalComponent implements OnInit {

  trip: any;
  pending: any;
  isDriver: boolean = false;
  isPending: boolean = false;
  hasBookedSeat: boolean = false;
  departureCoords: number[] = [];
  arrivalCoords: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router,
    private authGuard: AuthGuard,
    private location: Location,
    private http: HttpClient
  ) { }

  goBack() {
    this.location.back(); // <-- go back to previous location on cancel
  }

  ngOnInit(): void {

    this.route.params.subscribe(params => {
      const tripId = params['id'];
      this.apiService.getTrip(tripId)
        .pipe(
          catchError((error) => {
            this.router.navigate(['/']);
            return throwError("Aucun voyage trouvé");
          })
        )
        .subscribe(data => {
          if (data[0] == null) {
            return this.router.navigate(['/']);
          }
          this.trip = data[0];
          this.departureCoords = [this.trip.departure_coords[0], this.trip.departure_coords[1]];
          this.arrivalCoords = [this.trip.arrival_coords[0], this.trip.arrival_coords[1]];


          if (this.trip.driver === this.authGuard.getId()) {
            this.isDriver = true;
            this.apiService.getPending(tripId)
              .subscribe(data2 => {
                if (data2[0] == null) {
                  this.pending = null;
                }
                else {
                  const passengersIDs: String[] = [];
                  data2[0].passengers.forEach((trip: any) => {
                    passengersIDs.push(trip.passenger_id);
                  });
                  this.getPassengersFromId(passengersIDs)
                    .subscribe((data: any[]) => {
                      this.pending = data;
                    });
                  this.isPending = true;
                }
              });
          }
          else {
            this.apiService.getPending(tripId)
              .subscribe(data2 => {
                if (data2[0] == null) {
                  this.pending = null;
                }
                else {
                  this.pending = data2[0];
                  if (this.pending.passengers.some((passenger: Passenger) => passenger.passenger_id === this.authGuard.getId())
                    || this.trip.passengers.some((passenger: Passenger) => passenger.passenger_id === this.authGuard.getId())) {
                    this.hasBookedSeat = true;
                  }

                }
              });
          }
          if (this.trip.passengers == null) {
            this.trip.passengers = [];
          }



          return;
        });
    });

  }

  acceptPassenger(passenger_id: string, trip_id: string) {
    this.apiService.acceptPending(trip_id, passenger_id)
      .subscribe(
        (data: any) => {
          // Remove the passenger from the pending list
          // this.pending.passengers = this.pending.passengers.filter((passenger: any) => passenger.passenger_id !== passenger_id);
          // Add the passenger to the trip list
          // this.trip.passengers.push({ passenger_id: passenger_id });
          // location.reload();
          window.location.reload()
        },
        (error: any) => {
          console.error(error);
        }
      );
  }

  rejectPassenger(passenger_id: string, trip_id: string) {
    this.apiService.rejectPending(trip_id, passenger_id)
      .subscribe(
        (data: any) => {
          // Remove the passenger from the pending list
          // console.log(this.pending);
          // this.pending.passengers = this.pending.passengers.filter((passenger: any) => passenger.passenger_id !== passenger_id);
          window.location.reload()
        },
        (error: any) => {
          console.error(error);
        }
      );
  }

  bookSeat(trip_id: string) {
    if (this.authGuard.getId() != '') {
      this.apiService.bookSeat(trip_id)
        .subscribe(
          (data: any) => {
            alert("Place réservée. Le conducteur sera averti.");
            location.reload();
          },
          (error: any) => {
            console.error(error);
          }
        );
    }
    else {
      this.router.navigate(['/login']);
    }
  }

  getPassengersFromId(passengers: String[]): Observable<any[]> {
    return this.apiService.getSimpleUser(passengers)
      .pipe(
        map((data: any) => {
          return data;
        }),
        catchError((error: any) => {
          console.error(error); // Log any errors
          return of([]); // Return an empty array if there is an error
        })
      );
  }




}
