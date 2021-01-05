//application level global constants
module.exports = Object.freeze({
    PYTHON_REST_SERVER_ENDPOINT: "https://61c92e42cb1042699911c485c38d52ae.vfs.cloud9.eu-west-1.amazonaws.com:8081/python-rest-server/restor",
    SEND_CREDENTIALS: true, //if true all post requests will send credentials
    TIMEOUT: 0, //disable timeout setting
    SITE_OFFSET: 10, //offset when retrieving sites
    GEOJSON_LAYER_NAME: "geojson_layer",
    GEOJSON_SOURCE_NAME: "geojson_source",
    CENTROID_LAYER_NAME: "centroid_layer",
    CENTROID_SOURCE_NAME: "centroid_source",
    GEOJSON_LINE_COLOR: "rgba(255, 255, 255, 0.4)",
    GEOJSON_LINE_WIDTH: 1,
    CENTROID_COLOR: 'red',
    CENTROID_OPACITY: 0.8,
    CENTROID_STROKE_COLOR : "rgba(0, 0, 0, 0.7)",
    CENTROID_RADIUS: 3,
    HISTOGRAM_MIN: 0,
    HISTOGRAM_MAX: 20,
    HISTOGRAM_BUCKETS: 10,
});
