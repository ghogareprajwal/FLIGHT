import { Injectable } from '@angular/core';
import { HttpClient,HttpErrorResponse } from '@angular/common/http';
import * as L from 'leaflet';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class MapService {
  //baseUrl: string="https://opensky-network.org/api/states/all";
  
  baseUrl: string="http://localhost:5000/api/india-flights";
   private cache: any = null;
   private cacheTimestamp: number = 0;
   private cacheDuration: number = 60000;


  constructor(private http:HttpClient) { }

  getFlights(): Observable<any> {
    return this.http.get<any>(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

   private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
  
}
