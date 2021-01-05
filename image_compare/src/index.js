/*global URLSearchParams*/
/*global fetch*/
import React from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';
import CONSTANTS from './constants';
import jsonp from 'jsonp-promise';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

mapboxgl.accessToken = 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg';
var apiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI2NzlmNzEyOS1mNTRkLTRjZTgtYmRkZi1lZDEyZTliYjFmZmQiLCJhdWQiOiJodHRwczovL29uZWF0bGFzLmRhdGFkb29ycy5uZXQvaWQvcmVzb3VyY2VzIiwiaWRwIjoiVUNBX0FERlMiLCJhdXRoX3RpbWUiOjE2MDc1MjgzMjMsImFtciI6ImV4dGVybmFsIiwic2NvcGUiOlsib3BlbmlkIiwicHJvZmlsZSIsImVtYWlsIiwicm9sZXMiLCJyZWFkIiwid3JpdGUiXSwiaXNzIjoiaHR0cHM6Ly9vbmVhdGxhcy5kYXRhZG9vcnMubmV0L2lkIiwiZXhwIjoxNjM5MDY0MzI0LCJjbGllbnRfaWQiOiJwdGVzdF9leGFtcGxlXzEifQ.GS1zw_RZ_tKHBzevO7bHa7aJLCzYMin5Cnll6UvT2NaSG_f8PayQ45h-VahC0HlYPA67avklEadzMbb_FyNqhctCJxHRUnY0wCrAlJWFFViHPXLO12fVRsSM0SYTstavnWhE39WmL0uE7kOCiNzPiDAKcZFlCMWGeqFLaoIMCp7dY-zV7LIkVgj2jxlZUwfJnwWpF6LHw542Yrc_XKbuB7BAlhwrAtLFtX8OxO0F1QlQ42IUzPMdmKuj462Zlzs_ahyyExiBKL8zranCBYu2HC8mJRQQj0jdi9RbU1KkMw7wBfWEnVJo9JkQEKYa4EjpvVJzaQ7RfKQ7e0WnstulKg';
var users = [
  { name: '' },
  { name: 'Andrew' },
  { name: 'Niamh' },
  { name: 'Olga' },
  { name: 'Steve' },
  { name: 'Tom C' },
  { name: 'Tom E' },
];
class Application extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lng: 5,
      lat: 34,
      zoom: 2,
      loading: false,
      loggingIn: true,
      currentSite: {},
      evaluation: {},
      user: '',
      histogram: [],
      showHistogram: false,
      source_imagery: [
        //the 14342 in the esri url relates to the release number of the wayback imagery that is used - in this case - these come from:
        //https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json
        // 10     = 20/02/2014
        // 1052   = 19/04/2017
        // 18691  = 03/04/2019
        // 15045  = 29/04/2020
        { index: 0, key: '1', name: 'Maxar', resolution: '50cm', description: 'Latest version', endpoint: 'https://wayback-usw2.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/14342/{z}/{y}/{x}', date: "Unknown" }, //reversed x/y
        { index: 1, key: '2', name: 'Airbus OneAtlas', resolution: '1.5m', description: 'Airbus OneAtlas and Basemap', endpoint: 'https://view.geoapi-airbusds.com/api/v1/map/imagery.wms?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256', date: "22/11/2020" },
        { index: 2, key: '3', name: 'Planet Dove', resolution: '4.77m', description: 'Planet imagery from the Norwegian Government grant', endpoint: 'https://tiles0.planet.com/basemaps/v1/planet-tiles/planet_medres_normalized_analytic_2020-10_mosaic/gmap/{z}/{x}/{y}.png?api_key=361954dfdb954107a761d96cfcf8bab3&proc=rgb&color=auto', date: "October 2020" },
        { index: 3, key: '4', name: 'Sentinel', resolution: '10m', description: 'Crowther Lab Sentinel 2 RGB imagery', endpoint: 'https://storage.googleapis.com/niamh_bucket_31415927/restor_monitoring/visuals_examples/RBG_spring_2020/{z}/{x}/{y}.png', date: "Spring 2020" },
        // { index: 4, key: '5', name: 'SentinelHub', resolution: '10m', description: 'SentinelHub natural color', endpoint: 'https://services.sentinel-hub.com/ogc/wmts/0d18fa04-1a32-45f1-987f-30020b37cba4?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=TRUE_COLOR&STYLE=RGB&FORMAT=image/png&TILEMATRIXSET=PopularWebMercator256&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}' },
      ],
      mode: 'review', //set the mode - review - simply look at images, assess shows login and image select numbers and posts results to a database
    };
    //instantiate an array of map containers - these are HTML elements
    this.mapContainers = [];
    //instantiate an array of maps
    this.maps = [];
  }

  _get(params, timeout = CONSTANTS.TIMEOUT) {
    return new Promise((resolve, reject) => {
      //set the global loading flag
      this.setState({ loading: true });
      jsonp(CONSTANTS.PYTHON_REST_SERVER_ENDPOINT + params, { timeout: timeout }).promise.then((response) => {
        this.setState({ loading: false });
        resolve(response);
      }, (err) => {
        this.setState({ loading: false });
        reject(err);
      });
    });
  }

  changeUser(e) {
    this.setState({ loggingIn: false, user: e.target.value });
  }

  _handleKeyDown(evt) {
    if (this.state.mode === 'review') {
      if (evt.key === 'ArrowLeft' || evt.key === 'ArrowRight') this.setEvaluation(evt.key);
    }
    else {
      //get the valid keys 
      var validKeys = this.state.source_imagery.map(source => source.key);
      //get the key that was pressed and see if it valid
      if (validKeys.includes(evt.key)) this.setEvaluation(evt.key);
    }
  }

  //when the user clicks a key in the UI
  clickKeyboard(key) {
    this.setEvaluation(key);
  }

  //saves the evaluation to state
  setEvaluation(key) {
    if (this.state.mode === 'review') {
      if (key === 'ArrowLeft') {
        this.moveToPreviousSite();
      }
      else {
        this.moveToNextSite();
      }
    }
    else {
      //get the image object that was selected
      var source = this.state.source_imagery.find(source => (source.key === key));
      this.setState({ evaluation: source });
      //save the record
      this.saveEvaluation(source);
      //move to the next site
      this.moveToNextSite();
    }
  }

  //writes the data to the server
  saveEvaluation(source) {
    setTimeout(() => this.setState({ evaluation: {} }), 300);
  }

  //moves to the next site in the list
  moveToNextSite() {
    this.currentSiteIndex = this.currentSiteIndex + 1;
    this.changeSite(this.state.sites[this.currentSiteIndex]);
  }

  //moves to the previous site in the list
  moveToPreviousSite() {
    if (this.currentSiteIndex > 0) {
      this.currentSiteIndex = this.currentSiteIndex - 1;
      this.changeSite(this.state.sites[this.currentSiteIndex]);
    }
  }

  //in response to one map moving all the others will move
  zoomAllMaps(evt, centre, zoom) {
    // console.log(evt);
    // this.maps.forEach(map => {
    //   map.setCenter(centre);
    //   map.setZoom(zoom);
    // });
  }
  //updates an item in the state.source_imagery by matching on name and then sets the state again
  updateSourceImagery(updateItem){
    const newSourceImagery = this.state.source_imagery.map(item =>{
      if (item.name===updateItem.name){
        return updateItem;
      }else{
        return item;
      }
    });
    this.setState({source_imagery: newSourceImagery});
  }
  unixTimestampToDate(unix_timestamp) {
    //convert to a readable date
    const dateObject = new Date(unix_timestamp);
    const humanDateFormat = dateObject.toLocaleString();
    return humanDateFormat;
  }
  //iterates through the maps and gets the dates of the imagery based on the site centroid
  getDatesForImagery(latLng) {
    //see if the wayback imagery layer is loaded
    this.state.source_imagery.forEach((source) => {
      switch (source.name) {
        case 'Maxar':
          this.getWaybackDate(latLng);
          break;
        default:
          // code
      }
    });
  }
  //gets the date for the esri wayback imagery
  getWaybackDate(latLng) {
    //using lat/long and wgs84
    fetch("https://metadata.maptiles.arcgis.com/arcgis/rest/services/World_Imagery_Metadata_2017_r07/MapServer/6/query/query?f=json&where=1%3D1&outFields=SRC_DATE2%2CNICE_DESC%2CSRC_DESC%2CSRC_RES%2CSRC_ACC&geometry=%7B%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%2C%22x%22%3A" + latLng[0] + "%2C%22y%22%3A" + latLng[1] + "%7D&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnGeometry=false").then((response) => {
      response.json().then((_json) => {
        //get the date
        const d = this.unixTimestampToDate(_json.features[0].attributes.SRC_DATE2);
        //get the wayback item from the source_imagery array
        let wayback = this.state.source_imagery.filter(item => item.name==="Maxar")[0];
        //update the date
        wayback = Object.assign(wayback, {date: d.substr(0,10)});
        //update the state
        this.updateSourceImagery(wayback);
      });
    });
  }
  //initialisation
  componentDidMount() {
    //get the wayback configuration
    fetch("https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json").then(response => {
      response.json().then(_json => {
        this.wayback_conf = _json;
        console.log(_json);
      });
    });
    //create the context map
    //instantiate the map
    this.contextMap = new mapboxgl.Map({
      container: this.contextMapContainer,
      style: 'mapbox://styles/mapbox/streets-v11',
      attributionControl: false,
      zoom: 2
    });
    //iterate through the source imagery and create a map for each one
    this.state.source_imagery.forEach((source) => {
      //instantiate the map
      var map = new mapboxgl.Map({
        container: this.mapContainers[source.index],
        style: 'mapbox://styles/mapbox/streets-v11',
        attributionControl: false,
        transformRequest: (url, resourceType) => {
          if (resourceType === 'Tile' && url.startsWith('https://view.geoapi-airbusds.com')) {
            return {
              url: url,
              headers: { 'Authorization': 'Bearer ' + apiKey }
            };
          }
        }
      });
      //add the map to the maps array
      this.maps.push(map);
      //on style load event
      map.on('style.load', (evt) => {
        //once the map has loaded its style, add the WMTS
        this.maps[source.index].addLayer({
          'id': source.name,
          'type': 'raster',
          'source': {
            type: 'raster',
            tiles: [source.endpoint],
            tileSize: 256
          }
        });
        //add map event handlers
        map.on("moveend", (evt) => {
          this.zoomAllMaps(evt, map.getCenter(), map.getZoom());
        });
      });
    });

    //get the sites
    this._get("/services/get_sites?startfrom=1&buffersize=10000").then((response) => {
      var siteData = response.records;
      //see if the url has a specific site
      var searchParams = new URLSearchParams(window.location.search);
      //if the oid is passed as a query parameter, get the index in the siteData array otherwise use the offset
      this.currentSiteIndex = (searchParams.has("oid")) ? siteData.findIndex(site => (site.oid === Number(searchParams.get("oid")))) : CONSTANTS.SITE_OFFSET;
      this.setState({ sites: siteData }, _ => {
        this.changeSite(this.state.sites[this.currentSiteIndex]);
      });
    });
    //get the sites histogram
    this._get("/services/get_sites_histogram?b1=" + CONSTANTS.HISTOGRAM_MIN + "&b2=" + CONSTANTS.HISTOGRAM_MAX + "&bucket_count=" + CONSTANTS.HISTOGRAM_BUCKETS).then((response) => {
      //get the bucket size in hectares
      var bucket_size = (CONSTANTS.HISTOGRAM_MAX - CONSTANTS.HISTOGRAM_MIN) / CONSTANTS.HISTOGRAM_BUCKETS;
      response.records.forEach((item, index) => {
        if (index === CONSTANTS.HISTOGRAM_BUCKETS.length - 1) {
          return Object.assign(item, { bucket_label: ">" + ((item.bucket - 1) * bucket_size) + " Ha" });
        }
        else {
          return Object.assign(item, { bucket_label: (item.bucket * bucket_size) + " Ha" });
        }
      });
      this.setState({ histogram: response.records });
    });
    document.addEventListener("keydown", this._handleKeyDown.bind(this));
  }

  //programatically moves to the next site
  changeSite(site) {
    //set the url
    window.history.replaceState(null, document.title, "/?oid=" + site.oid);
    //if the site has no name then set one
    if (!site.identifier) site.identifier = "<unnamed site>";
    this.setState({ currentSite: site });
    //get the bounding box
    var bbox = site.bbox.substr(4, site.bbox.length - 5).replace(/ /g, ",").split(",");
    //fit the site to each of the maps
    this.maps.forEach(map => {
      map.fitBounds(bbox, { padding: { top: 10, bottom: 10, left: 10, right: 10 }, easing: (num) => { return 1; } });
    });
    //move the context map
    this.contextMap.jumpTo({ center: [site.lng, site.lat], zoom: 2 });
    //add a point to the context map
    this.addGeometryToMap(this.contextMap, { "type": "Point", "coordinates": [site.lng, site.lat] }, CONSTANTS.CENTROID_SOURCE_NAME, CONSTANTS.CENTROID_LAYER_NAME);
    //get the geometry for the site boundary
    this._get("/services/get_site_geojson?oid=" + site.oid).then((response) => {
      //add the site boundary to the maps
      this.addSiteBoundaries(JSON.parse(response.records[0].geojson));
    });
    //get the dates for the imagery (where available)
    this.getDatesForImagery([site.lng, site.lat]);
  }

  //adds the site boundaries to each of the maps
  addSiteBoundaries(geomety) {
    this.maps.forEach(map => {
      this.addGeometryToMap(map, geomety, CONSTANTS.GEOJSON_SOURCE_NAME, CONSTANTS.GEOJSON_LAYER_NAME);
    });
    //add it to the context map
    this.addGeometryToMap(this.contextMap, geomety, CONSTANTS.GEOJSON_SOURCE_NAME, CONSTANTS.GEOJSON_LAYER_NAME);
  }

  //adds a geometry to the map and renders it depending on whether it is a point or polygon
  addGeometryToMap(map, geometry, sourceName, layerName) {
    //remove the geojson layer
    if (map.getLayer(layerName)) map.removeLayer(layerName);
    //remove the geojson source
    if (map.getSource(sourceName) !== undefined) map.removeSource(sourceName);
    //add the geojson source
    map.addSource(sourceName, {
      "type": "geojson",
      "data": {
        "type": "Feature",
        "geometry": geometry,
      }
    });
    //get the paint property
    var paintProperty = (geometry.type === 'Polygon') ? { 'line-color': CONSTANTS.GEOJSON_LINE_COLOR, 'line-width': CONSTANTS.GEOJSON_LINE_WIDTH, } : { 'circle-color': CONSTANTS.CENTROID_COLOR, 'circle-opacity': CONSTANTS.CENTROID_OPACITY, 'circle-stroke-color': CONSTANTS.CENTROID_STROKE_COLOR, 'circle-radius': CONSTANTS.CENTROID_RADIUS };
    //get the type property
    var _type = (geometry.type === 'Polygon') ? "line" : "circle";
    //add the geojson layer
    map.addLayer({
      'id': layerName,
      'type': _type,
      'source': sourceName,
      'paint': paintProperty
    });
  }

  render() {
    const renderLineChart = (
      <BarChart width={200} height={110} data={this.state.histogram}>
        <Bar dataKey="_count" stroke="#8884d8" fill='#8884d8'/>
        <XAxis dataKey="bucket_label" label={{ value: "Site area", fontSize:'14px', position: 'insideBottom', offset:0}} tick={{fontSize:'10px'}}/>
        <YAxis type="number" label={{ value: "Count", fontSize:'14px', angle: -90, position: 'insideLeft', offset:10}} tick={{fontSize:'10px'}}/>
        <Tooltip />
      </BarChart>
    );
    //create an array of the source headers
    var sourceHeaders = this.state.source_imagery.map((source) => {
      return <td key={source.index} className='sourceHeader'>{source.name}</td>;
    });
    //create the array of map container divs
    var mapcontainers = this.state.source_imagery.map((source) => {
      return <td key={source.index}><div ref={el => this.mapContainers.push(el)} className='mapContainer' key={source.index}/></td>;
    });
    //create the image metadaa
    var imageMetadata = this.state.source_imagery.map((source) => {
      return <td key={source.index} className={'imageMetadata'}><span style={{paddingRight:'40px'}}>{source.date}</span><span>{source.resolution}</span></td>;
    });
    //create the login options
    let login_options = users.map(user => {
      return <option value={user.name} key={user.name}>{user.name}</option>;
    });
    //create the keyboard shortcuts
    var controls, keyboardText;
    if (this.state.mode === 'review') {
      controls = <span>
        <span className={'keyboard'} onClick={this.clickKeyboard.bind(this, 'ArrowLeft')} key={'ArrowLeft'}>{'<'}</span>
        <span className={'keyboard'} onClick={this.clickKeyboard.bind(this, 'ArrowRight')} key={'ArrowRight'}>{'>'}</span>
      </span>;
      keyboardText = "Press to move back/forward";
    }
    else {
      controls = this.state.source_imagery.map((source) => {
        return <div className={(source.key === this.state.evaluation.key) ? 'keyboardSelected' : 'keyboard'} onClick={this.clickKeyboard.bind(this, source.key)} key={source.index}>{source.index + 1}</div>;
      });
      keyboardText = "Press to select the best image:";
    }
    var keyboardItems = <td colSpan={this.state.source_imagery.length} className='controls'><span className='controlsText'>{keyboardText}</span><span>{controls}</span></td>;
    var table = <table className={'mapsTable'}>
      <tbody>
        <tr>{sourceHeaders}</tr>
        <tr>{mapcontainers}</tr>
        <tr>{imageMetadata}</tr>
        <tr>{keyboardItems}</tr>
      </tbody>
    </table>;
    return (
      <div>
        <div style={{"opacity": (this.state.mode === 'assess' && this.state.loggingIn) ? 0.1 : 1}}>
          <div className='banner'>
            <div ref={el => this.contextMapContainer = el} className='contextMapContainer'/>
            <div className="title">
              <div className={'siteText'}>{this.state.currentSite && this.state.currentSite.oid}</div>
              <div className={'siteText'}>{this.state.currentSite && this.state.currentSite.filename}</div>
              <div className={'siteText2'}>{this.state.currentSite && this.state.currentSite.identifier}</div>
              <div className={'siteText'}>{this.state.currentSite && this.state.currentSite.area}</div>
              <div className={'siteText3'}>{this.state.currentSite && this.state.currentSite.lat},{this.state.currentSite&& this.state.currentSite.lng}</div>
            </div>
            <span className="user">{this.state.user}</span>
            <span style={{"display": (this.state.showHistogram) ? "block" : "none"}}>{renderLineChart}</span>
          </div>
        {table}
        </div>
        <div className="dialog" style={{"display": (this.state.mode === 'assess' && this.state.loggingIn) ? "block" : "none"}}>
  		    <div>Log in as:</div>
  		    <select onChange={this.changeUser.bind(this)} value={''}>{login_options}</select>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Application />, document.getElementById('app'));
