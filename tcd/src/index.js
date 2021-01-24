import React from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { CircleMode, DragCircleMode, DirectMode, SimpleSelectMode } from 'mapbox-gl-draw-circle';
import * as turf from "@turf/turf";

/*global fetch*/
//constants
mapboxgl.accessToken = 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg';
const PYTHON_REST_SERVER_ENDPOINT = 'https://andrewcottam.com:8081/python-rest-server/restor/services/';
class Application extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lng: 5,
      lat: 34,
      zoom: 2
    };
  }

  componentDidMount() {
    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [this.state.lng, this.state.lat],
      zoom: this.state.zoom
    });

    map.on('move', () => {
      this.setState({
        lng: map.getCenter().lng.toFixed(4),
        lat: map.getCenter().lat.toFixed(4),
        zoom: map.getZoom().toFixed(2)
      });
    });
    map.on('load', () => {
      let _center = turf.point([0, 40]);
      let _radius = 25;
      let _options = {
        steps: 80,
        units: 'kilometers' // or "mile"
      };
      let _circle = turf.circle(_center, _radius, _options);
      map.addSource("circleData", {
        type: "geojson",
        data: _circle,
      });
      map.addLayer({
        id: "circle-fill",
        type: "fill",
        source: "circleData",
        paint: {
          "fill-color": "red",
          "fill-opacity": 1,
        },
      });
      var draw = new MapboxDraw({
        defaultMode: "draw_circle",
        displayControlsDefault: false,
        userProperties: true,
        modes: {
          ...MapboxDraw.modes,
          draw_circle: CircleMode,
          drag_circle: DragCircleMode,
          direct_select: DirectMode,
          simple_select: SimpleSelectMode
        }
      });
      map.addControl(draw);
      draw.changeMode('drag_circle');
      map.on('draw.create', (e) => {

      });
      map.on('draw.selectionchange', (e) => {
        draw.changeMode('drag_circle');
      });
    });
  }
  _get(params) {
    return new Promise((resolve, reject) => {
      fetch(PYTHON_REST_SERVER_ENDPOINT + params).then(response => {
        response.json().then(_json => {
          console.log(_json);
        });
      });
    });
  }

  //writes the records to postgis
  postFeatures() {
    this._get("set_tcd_feature?_id=" + "wibble4" + "&_longitude=" + "0" + "&_latitude=" + "40" + "&_radius=" + "80" + "&_gee_imageid=" + "gee1234" + "&_entered_by=" + "andrew");
  }
  nextImage() {
    this.postFeatures();
  }
  render() {
    return (
      <div>
        <div className='sidebarStyle'>
          <div>Longitude: {this.state.lng} | Latitude: {this.state.lat} | Zoom: {this.state.zoom}</div>
        </div>
        <div ref={el => this.mapContainer = el} className='mapContainer' />
        <div onClick={this.nextImage.bind(this)} className={'next'}>Next</div>
      </div>
    );
  }
}

ReactDOM.render(<Application />, document.getElementById('app'));
