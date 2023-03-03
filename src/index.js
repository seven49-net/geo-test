import "./styles.css";
import "ol/ol.css";

import proj4 from "proj4";
import { Map, View } from "ol";
import { Tile as TileLayer } from "ol/layer";
import { XYZ } from "ol/source";
import { defaults as defaultControls, ScaleLine } from "ol/control";
import { register } from "ol/proj/proj4";
import { TileWMS } from "ol/source";
import TileGrid from "ol/tilegrid/TileGrid";
import { TILEGRID_ORIGIN, TILEGRID_RESOLUTIONS, WMS_TILE_SIZE } from "./config";
// added by bollinger@seven49.net
import Link from "ol/interaction/Link";
import Draw from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Style, Fill, Stroke} from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';

// adding Swiss projections to proj4 (proj string comming from https://epsg.io/)
proj4.defs(
  "EPSG:2056",
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs"
);
proj4.defs(
  "EPSG:21781",
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs"
);
register(proj4);

const backgroundLayer = new TileLayer({
  id: "background-layer",
  source: new XYZ({
    url: `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg`
  })
});

const view = new View({
  projection: "EPSG:2056",
  center: [2600000, 1150000],
  zoom: 8
});

const map = new Map({
  target: "map",
  controls: defaultControls().extend([
    new ScaleLine({
      units: "metric"
    })
  ]),
  layers: [backgroundLayer],
  view: view
});

// Adding a tiled WMS with gutter
const layerId = "ch.astra.wanderland-sperrungen_umleitungen";
const tiledWmsLayer = new TileLayer({
  opacity: 0.8,
  source: new TileWMS({
    url: `https://wms0.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=${layerId}&LANG=en`,
    gutter: 120,
    tileGrid: new TileGrid({
      projection: "EPSG:2056",
      tileSize: WMS_TILE_SIZE,
      origin: TILEGRID_ORIGIN,
      resolutions: TILEGRID_RESOLUTIONS
    })
  })
});
map.addLayer(tiledWmsLayer);

// added by bollinger@seven49.net
map.addInteraction(new Link());

const source = new VectorSource();
const layer = new VectorLayer({
  source: source,
  style: new Style({
    fill: new Fill({
      color: 'red',
    }),
    stroke: new Stroke({
      color: 'white',
    }),
  }),
});
map.addLayer(layer);

map.addInteraction(
  new Draw({
    type: 'Polygon',
    source: source,
  })
);

const clear = document.getElementById('clear');
clear.addEventListener('click', function () {
  source.clear();
});

const format = new GeoJSON({featureProjection: 'EPSG:3857'});
const download = document.getElementById('download');
source.on('change', function () {
  const features = source.getFeatures();
  const json = format.writeFeatures(features);
  download.href =
    'data:application/json;charset=utf-8,' + encodeURIComponent(json);
});
