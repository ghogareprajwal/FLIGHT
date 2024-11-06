import { Component, OnInit, OnDestroy  } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import { MapService } from '../service/map.service';
import { CommonModule } from '@angular/common';
import {  MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';


@Component({
  selector: 'app-map',
  standalone: true,
  imports: [LeafletModule, CommonModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatListModule,MatIconModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  providers: [MapService]

})
export class MapComponent implements OnInit, OnDestroy  {
  private map !: L.Map;
  private marker!: L.Marker;
  stateForm!: FormGroup;
  private polyline!: L.Polyline;
  private currentLocationMarker!: L.Marker;
  private currentLocation!: L.LatLng;
  private flightMarkers: { [key: string]: L.Marker } = {};
 
  private flightsSubscription: Subscription | null = null;
  private isFlightsActive = false;
  
  
  constructor( private mapService: MapService) { }

  ngOnInit(): void {
    this.initMap();
    this. showFlights();
    //  this.startPolling(); 
  }
 
  ngOnDestroy(): void {
    this.stopFlights();
  }
  
  private initMap(): void {
    this.map = L.map('map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);


    
  }
  
 

 
   

   currentPosition(): void {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.currentLocation = L.latLng(lat, lng);

        if (this.currentLocationMarker) {
          this.map.removeLayer(this.currentLocationMarker);
        }
        const customIcon = L.icon({
          iconUrl: 'https://freesvg.org/img/ts-map-pin.png',
          iconSize: [38, 50],
          iconAnchor: [19, 50],
          popupAnchor: [-0, -50]
        });

        this.currentLocationMarker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
        this.currentLocationMarker.bindPopup("I am here").openPopup();
        this.map.setView(this.currentLocation, 13);
        // L.circle([lat,lng], {radius: 1000}).addTo(this.map);
      }
      );
    }
  }

   showCurrentLocation(): void {
    this.currentPosition();
    if (this.currentLocation) {
      this.map.setView(this.currentLocation, 13);
    }
  }
  showFlights(): void {
    if (this.isFlightsActive) {
      this.stopFlights();
    } else {
      this.startFlights();
    }
  }

  private startFlights(): void {
    this.isFlightsActive = true;
    this.flightsSubscription = interval(10000).pipe(
      switchMap(() => this.mapService.getFlights())
    ).subscribe({
      next: (data) => {
        this.updateFlightMarkers(data);
      },
      error: (err) => {
        console.error('Error fetching flight data:', err);
        this.stopFlights(); 
      }
    });
  }

  private stopFlights(): void {
    if (this.flightsSubscription) {
      this.flightsSubscription.unsubscribe();
      this.flightsSubscription = null;
    }
    this.isFlightsActive = false;
    
  }
  
  private updateFlightMarkers(data: any[]): void { 
    data.forEach((flight: any) => {
      const flightId = flight[0];
      const flightNumber = flight[1];
      const country = flight[2];
      const lng = flight[5];
      const lat = flight[6];
      const trueTrack = flight[10]
      const flightSVG = 
      `
     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform-origin: center; transform: rotate(${trueTrack}deg);">
        <image href="https://icons.veryicon.com/png/o/leisure/vajra-district_-tourism/flight-18.png" width="20" height="20"/>
      </svg>
    `;
      const flightIcon = L.divIcon({
        html:  flightSVG,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: 'custom-flight-icon'
      });
     
      if (this.flightMarkers[flightId]) {
        const marker = this.flightMarkers[flightId]
        marker.setLatLng([lat, lng]);
        marker.setIcon( flightIcon);
        marker.bindPopup(`Flight ${flightNumber}<br>Country: ${country}<br>Lat: ${lat}, Lng: ${lng}`);
      } else {
        const marker = L.marker([lat, lng], { icon: flightIcon });
          marker.bindPopup(`Flight ${flightNumber}<br>Country: ${country}<br>Lat: ${lat}, Lng: ${lng}`)
          .addTo(this.map);

     
        this.flightMarkers[flightId] = marker;
      }
    });
  }

 
}

  

  
  

