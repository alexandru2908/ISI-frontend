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


@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard-admin.component.html',
    styleUrls: ['./dashboard-admin.component.scss']
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
    user_details: any = {};
    agency_details: any = {};

    current_cars: any = [];

    @Output() mapLoadedEvent = new EventEmitter<boolean>();

    @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;

    map!: esri.WebMap;
    view!: esri.MapView;
    graphicsLayer!: esri.GraphicsLayer;
    graphicsLayerUserPoints!: esri.GraphicsLayer;
    graphicsLayerRoutes!: esri.GraphicsLayer;
    trailheadsLayer!: esri.FeatureLayer;

    zoom = 10;
    center: Array<number> = [26.0546116950914, 44.44556870449671];
    basemap = "streets-vector";
    loaded = false;
    directionsElement: any;

    selectedCategory = "Choose a place type...";
    categories = ["Choose a place type...", "Parks and Outdoors", "Coffee shop", "Gas station", "Food", "Hotel"];
    locatorUrl = "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";
    routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

    isConnected = false;
    constructor() {
    }
    async ngOnInit(): Promise<void> {
        try {
            await this.initializeMap();
            this.loaded = this.view.ready;
            this.mapLoadedEvent.emit(true);
        } catch (error) {
            console.error("Error initializing map:", error);
        }
        this.user_details = JSON.parse(localStorage.getItem('id'));
        console.log('User Details:', this.user_details); // Debugging line
        await this.loadAgencyDetails();

        console.log('current_cars:', this.current_cars);

        this.current_cars.forEach((car) => {
            this.addPoint(car.location_x, car.location_y);
            console.log('am adaugat', car.location_x, car.location_y);
        });

    }

    async loadAgencyDetails() {
        try {
            this.agency_details = await this.get_Agency();
            this.current_cars = await this.get_cars();
            console.log('Agency Details:', this.agency_details); // Debugging line
            console.log('Cars:', this.current_cars);
        } catch (error) {
            console.error('Error fetching agency details:', error);
        }
    }

    async get_Agency() {
        let res = await fetch('http://localhost:3000/get-agencies');

        let data = await res.json();

        let current_agency = {}
        data.forEach((agency) => {
            if (agency.agency_name === this.user_details.agency) {
                current_agency = agency;
            }
        });
        console.log('Agency:', current_agency);
        return current_agency;
    }

    async get_cars() {
        let res = await fetch('http://localhost:3000/get-cars');
        let data = await res.json();
        console.log('Cars_data:', data); // Debugging line
        let current_car = []
        data.forEach((car) => {
            console.log('Compar', car.car_agency, this.user_details.agency);
            if (car.car_agency == this.user_details.agency) {
                current_car.push(car);
            }
        })
        console.log('Cars:', current_car);
        return current_car;
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

                    // if (this.graphicsLayerUserPoints.graphics.length === 0) {
                    //     this.addPoint(point.latitude, point.longitude);
                    // } else if (this.graphicsLayerUserPoints.graphics.length === 1) {
                    //     this.addPoint(point.latitude, point.longitude);
                    //     await this.calculateRoute();
                    // } else {
                    //     this.removePoints();
                    // }
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


}
