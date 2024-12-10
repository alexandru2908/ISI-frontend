import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  OnDestroy
} from "@angular/core";

import esri = __esri; // Esri TypeScript Types

import Config from '@arcgis/core/config';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import Bookmarks from '@arcgis/core/widgets/Bookmarks';
import Expand from '@arcgis/core/widgets/Expand';

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';

import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
import RouteParameters from '@arcgis/core/rest/support/RouteParameters';
import * as route from "@arcgis/core/rest/route.js";

import Polygon from "@arcgis/core/geometry/Polygon";
import * as locator from "@arcgis/core/rest/locator";

import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import { FirebaseService, IDatabaseItem } from "src/app/services/firebase";

@Component({
  selector: "app-esri-map",
  templateUrl: "./esri-map.component.html",
  styleUrls: ["./esri-map.component.scss"]
})
export class EsriMapComponent implements OnInit, OnDestroy {
  @Output() mapLoadedEvent = new EventEmitter<boolean>();

  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;

  map!: esri.WebMap;
  view!: esri.MapView;
  graphicsLayer!: esri.GraphicsLayer;
  graphicsLayerUserPoints!: esri.GraphicsLayer;
  graphicsLayerRoutes!: esri.GraphicsLayer;
  trailheadsLayer!: esri.FeatureLayer;

  zoom = 10;
  center: Array<number> = [-118.73682450024377, 34.07817583063242];
  basemap = "streets-vector";
  loaded = false;
  directionsElement: any;

  selectedCategory = "Choose a place type...";
  categories = ["Choose a place type...", "Parks and Outdoors", "Coffee shop", "Gas station", "Food", "Hotel"];
  locatorUrl = "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";
  routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

  isConnected = false;
  constructor(
    private fbs: FirebaseService,
  ) { 
    if (this.isConnected) {
      return;
    }
    this.isConnected = true;
    this.fbs.connectToDatabase();
    this.fbs.getChangeFeedList().subscribe((data: IDatabaseItem[]) => {
      
      for (const item of data) {
        const point = item.val.split(' ');
        console.log("Point:", point);
        this.addPoint(parseFloat(point[0]), parseFloat(point[1]));
  }});

  }

  async ngOnInit(): Promise<void> {
    try {
      await this.initializeMap();
      this.loaded = this.view.ready;
      this.mapLoadedEvent.emit(true);

      this.drawSamplePolygon();
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }

  private async initializeMap(): Promise<esri.MapView> {
    try {
      Config.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurJclWwVEGK3URwttgvYZzbA58epmipY56vluj4unS9d5p_0B9DklgvOVRiDB6rcH3rOaBrDk4fA-WMdp1Kl2eg_e1A3DwGgyQF71w21_wSMUlKr6JJwhThpNeT67KavSLh6vOuD_TXqZjyFOQStdxphQZb49R48VkfBYdc3wurajkH4qcA61PR4N2UX22mh9zo8O5fB2Lp5eqriM6pQORUM.AT1_YAzWMDJ1";

      // Initialize map
      this.map = new WebMap({
        basemap: this.basemap
      });

      // Add layers
      await this.addFeatureLayers();
      this.addGraphicsLayer();

      // Initialize map view
      this.view = new MapView({
        container: this.mapViewEl.nativeElement,
        center: this.center,
        zoom: this.zoom,
        map: this.map
      });

      // Add event listeners
      this.view.on('pointer-move', ["Shift"], (event) => {
        const point = this.view.toMap({ x: event.x, y: event.y });
        console.log("Map pointer moved:", point.longitude, point.latitude);
      });

      await this.view.when();
      console.log("ArcGIS map loaded");
      
      this.addRouting();
      this.getPoint();
      this.addCategoryDropdown();
      this.addPolyLine();
      
      return this.view;
    } catch (error) {
      console.error("Error loading the map:", error);
      throw error;
    }
  }

  private async addFeatureLayers(): Promise<void> {
    this.trailheadsLayer = new FeatureLayer({
      url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0",
      outFields: ['*']
    });

    const trailsLayer = new FeatureLayer({
      url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/0"
    });

    const parksLayer = new FeatureLayer({
      url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Parks_and_Open_Space/FeatureServer/0"
    });

    this.map.addMany([parksLayer, trailsLayer, this.trailheadsLayer]);
  }

  private addGraphicsLayer(): void {
    this.graphicsLayer = new GraphicsLayer();
    this.graphicsLayerUserPoints = new GraphicsLayer();
    this.graphicsLayerRoutes = new GraphicsLayer();
    this.map.addMany([this.graphicsLayer, this.graphicsLayerUserPoints, this.graphicsLayerRoutes]);
  }

  private addRouting(): void {
    if (!this.view) return;

    this.view.on("click", async (event) => {
      try {
        const response = await this.view.hitTest(event);
        const result = response.results.find(r => r.layer === this.trailheadsLayer);
        
        if (result?.mapPoint) {
          const point = result.mapPoint;
          console.log("Selected point:", point);

          if (this.graphicsLayerUserPoints.graphics.length === 0) {
            this.addPoint(point.latitude, point.longitude);
          } else if (this.graphicsLayerUserPoints.graphics.length === 1) {
            this.addPoint(point.latitude, point.longitude);
            await this.calculateRoute();
          } else {
            this.removePoints();
          }
        }
      } catch (error) {
        console.error("Error in click handler:", error);
      }
    });
  }

  private getPoint(): void {
    if (!this.view) return;

    this.view.on("click", async (event) => {
      const point = this.view.toMap(event);
      console.log("Map clicked:", point.longitude, point.latitude);

      this.addPoint(point.latitude, point.longitude); 
      
      this.fbs.addListObject(
        point.latitude + ' ' + point.longitude);
    });
  }

  private addPoint(lat: number, lng: number): void {
    const point = new Point({
      longitude: lng,
      latitude: lat
    });

    const markerSymbol = new SimpleMarkerSymbol({
      style: "circle",
      color: [226, 119, 40],  // Orange
      outline: {
        color: [255, 255, 255], // White
        width: 1
      },
      size: 8
    });

    const pointGraphic = new Graphic({
      geometry: point,
      symbol: markerSymbol
    });

    this.graphicsLayerUserPoints.add(pointGraphic);
  }

  private addPolygon(coordinates: Array<[number, number]>): void {
    const ring = coordinates.map(([lng, lat]) => [lng, lat]);
    
    const polygon = new Polygon({
      rings: [ring],
      spatialReference: { wkid: 4326 } // WGS84
    });

    const polygonSymbol = {
      type: "simple-fill",  // autocasts as new SimpleFillSymbol()
      color: [227, 139, 79, 0.8], // Fill color with some transparency
      outline: {  // autocasts as new SimpleLineSymbol()
        color: [255, 255, 255],
        width: 1
      }
    };

    const polygonGraphic = new Graphic({
      geometry: polygon,
      symbol: polygonSymbol
    });

    this.graphicsLayer.add(polygonGraphic); // Add polygon to the graphics layer
  }

  private displayRoute(data: any): void {
    if (!data.routeResults?.length) {
      console.warn("No route results found");
      return;
    }

    data.routeResults.forEach((result: any) => {
      const routeSymbol = new SimpleLineSymbol({
        style: "solid",
        color: [5, 150, 255],
        width: 3
      });

      const routeGraphic = new Graphic({
        geometry: result.route.geometry,
        symbol: routeSymbol
      });
      this.graphicsLayerRoutes.add(routeGraphic);
    });

    if (data.routeResults[0].directions?.features) {
      this.showDirections(data.routeResults[0].directions.features);
    }
  }

  private drawSamplePolygon(): void {
    const sampleCoordinates: Array<[number, number]> = [
      [-118.818984489994, 34.0137559967283], //Longitude, latitude
      [-118.806796597377, 34.0215816298725], //Longitude, latitude
      [-118.791432890735, 34.0163883241613], //Longitude, latitude
      [-118.79596686535, 34.008564864635],   //Longitude, latitude
      [-118.808558110679, 34.0035027131376] 
    ];
    this.addPolygon(sampleCoordinates);
  }

  private async findPlaces(category: string): Promise<void> {
    if (!this.view || category === "Choose a place type...") return;

    try {
      const results = await locator.addressToLocations(this.locatorUrl, {
              address: "",
              location: this.view.center,
              categories: [category],
              maxLocations: 10,
              outFields: ["Place_addr", "PlaceName"]
            });

      this.view.graphics.removeAll();

      results.forEach(result => {
        const placeSymbol = new SimpleMarkerSymbol({
          style: "circle",
          color: "red",
          size: 9,
          outline: {
            color: "blue",
            width: 1
          }
        });

        const graphic = new Graphic({
          geometry: result.location,
          symbol: placeSymbol,
          popupTemplate: {
            title: result.attributes.PlaceName,
            content: result.attributes.Place_addr
          }
        });
        this.view.graphics.add(graphic);
      });
    } catch (error) {
      console.error("Error finding places:", error);
    }
  }

  private async calculateRoute(): Promise<void> {
    if (!this.graphicsLayerUserPoints.graphics.length) return;

    const routeParams = new RouteParameters({
      stops: new FeatureSet({
        features: this.graphicsLayerUserPoints.graphics.toArray()
      }),
      returnDirections: true
    });

    try {
      const data = await route.solve(this.routeUrl, routeParams);
      this.displayRoute(data);
    } catch (error) {
      console.error("Error calculating route:", error);
      throw error;
    }
  }

  private showDirections(features: any[]): void {
    if (!this.view) return;

    const directionsElement = document.createElement("div");
    directionsElement.className = "esri-widget esri-widget--panel esri-directions__scroller";
    directionsElement.style.margin = "0";
    directionsElement.style.padding = "15px 15px 15px 30px";

    const directionsList = document.createElement("ol");
    features.forEach(result => {
      const direction = document.createElement("li");
      direction.textContent = `${result.attributes.text} (${result.attributes.length.toFixed(2)} miles)`;
      directionsList.appendChild(direction);
    });

    directionsElement.appendChild(directionsList);
    this.view.ui.empty("top-right");
    this.view.ui.add(directionsElement, "top-right");
    this.directionsElement = directionsElement;
  }

  public clearRouter(): void {
    if (this.view) {
      this.removeRoutes();
      this.removePoints();
      if (this.directionsElement) {
        this.view.ui.remove(this.directionsElement);
        this.directionsElement = null;
      }
      this.view.ui.empty("top-right");
      this.addCategoryDropdown();
    }
  }

  private removePoints(): void {
    this.graphicsLayerUserPoints?.removeAll();
  }

  private removeRoutes(): void {
    this.graphicsLayerRoutes?.removeAll();
  }

  private addCategoryDropdown(): void {
    if (!this.view) return;

    const select = document.createElement("select");
    select.className = "esri-widget esri-select";
    select.style.width = "200px";
    select.style.fontSize = "14px";
    select.style.padding = "6px";

    this.categories.forEach(category => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      select.appendChild(option);
    });

    select.addEventListener("change", (event) => {
      const target = event.target as HTMLSelectElement;
      this.selectedCategory = target.value;
      this.findPlaces(this.selectedCategory);
    });

    this.view.ui.add(select, "top-right");
  }

  ngOnDestroy(): void {
    if (this.view) {
      this.view.destroy();
    }
  }

  addPolyLine() {
    const polyline = {
      type: "polyline",
      paths: [
          [-118.821527826096, 34.0139576938577], //Longitude, latitude
          [-118.814893761649, 34.0080602407843], //Longitude, latitude
          [-118.808878330345, 34.0016642996246]  //Longitude, latitude
      ]
   };
   const simpleLineSymbol = {
      type: "simple-line",
      color: [226, 119, 40], // Orange
      width: 2
   };
  
   const polylineGraphic = new Graphic({
      geometry: polyline as any,
      symbol: simpleLineSymbol
   });
   this.graphicsLayer.add(polylineGraphic);
  }
}
