import { Component, OnInit, OnDestroy } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import { MapService } from '../service/map.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { interval, Subscription } from 'rxjs';
import { switchMap, throttleTime } from 'rxjs/operators';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [LeafletModule, CommonModule, MatFormFieldModule, MatSelectModule, MatListModule, MatIconModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  providers: [MapService]
})
export class MapComponent implements OnInit, OnDestroy {
  private map!: L.Map;
  private flightMarkers: { [key: string]: L.Marker } = {};
  private flightsSubscription: Subscription | null = null;
  private isFlightsActive = false;

  constructor(private mapService: MapService) { }

  ngOnInit(): void {
    this.initMap();
    this.showFlights();
    
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

  

  showFlights(): void {
    if (this.isFlightsActive) {
      this.stopFlights();
    } else {
      this.startFlights();
    }
  }

 
  private startFlights(): void {
    this.isFlightsActive = true;
    this.flightsSubscription = interval(500).pipe(
      throttleTime(3000),  // Adjust based on your needs
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

  private updateFlightMarkers(data: any): void {
    if (!Array.isArray(data.states)) {
      console.error('Expected array in data.states but got:', data);
      return; // Prevent further processing if data.states is not an array
    }
  
    const filteredData = data.states.filter((flight: string[]) => flight[2] === 'India');
  
    filteredData.forEach((flight: any) => {
      const flightId = flight[0];
      const flightNumber = flight[1];
      const country = flight[2];
      const lng = flight[5];
      const lat = flight[6];
      const trueTrack = flight[10];
  
      // Check if lat and lng are valid
      if (lat === null || lat === undefined || lng === null || lng === undefined) {
        console.warn(`Skipping flight ${flightId} due to invalid coordinates.`);
        return; // Skip this flight if coordinates are invalid
      }
  
      const flightSVG = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform-origin: center; transform: rotate(${trueTrack}deg);">
          <image href="https://icons.veryicon.com/png/o/leisure/vajra-district_-tourism/flight-18.png" width="20" height="20"/>
        </svg>
      `;
      const flightIcon = L.divIcon({
        html: flightSVG,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: 'custom-flight-icon'
      });
  
      if (this.flightMarkers[flightId]) {
        const marker = this.flightMarkers[flightId];
        marker.setLatLng([lat, lng]);
        marker.setIcon(flightIcon);
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