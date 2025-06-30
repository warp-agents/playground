"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback, use } from "react";
import { FaOilWell, FaBuilding, FaTents } from "react-icons/fa6";
import { MdWindPower, MdWarehouse } from "react-icons/md";
import { Undo2, Trash2, Check, Square, Circle } from "lucide-react";
import { BiWater, BiSolidFactory, BiSolidPlaneAlt } from "react-icons/bi";
import { RiShipFill, RiPlaneFill, RiTruckFill } from "react-icons/ri";
import { PiTruckTrailerFill } from "react-icons/pi";
import { CgOrganisation } from "react-icons/cg";
import Icon from '@mdi/react';
import { mdiDumpTruck, mdiHomeSilo, mdiPierCrane } from '@mdi/js';
import { toast } from "sonner"
import { MapContainer, TileLayer, Marker, Rectangle, Polygon, useMap, GeoJSON, WMSTileLayer, useMapEvents } from "react-leaflet";
import { WmsLayer } from '@sentinel-hub/sentinelhub-js';
import type { Polygon as GeoJSONPolygon, GeoJsonObject, MultiPolygon as GeoJSONMultiPolygon, Feature } from 'geojson';
import L, { noConflict, LatLngBoundsExpression, latLngBounds, DrawMap, FeatureGroup } from "leaflet";
import { Button } from "../ui/button";
import 'leaflet-draw'; 
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-curve";
import "leaflet-ant-path";
import "leaflet-defaulticon-compatibility";
import 'leaflet-draw/dist/leaflet.draw.css';
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet.markercluster/dist/leaflet.markercluster.js";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { renderToString } from 'react-dom/server';
import { useGlobalContext } from "@/contexts/GlobalContext";
import { set, setQuarter } from "date-fns";
import html2canvas from 'html2canvas';
import * as tf from '@tensorflow/tfjs';
import { useMapControlsContext } from "@/contexts/MapContext";
import { generateTilesFromPolygon, getGeoJsonBounds, isTileInRegion, latLngToTile, getTileCenter, getTileBounds } from "@/lib/tile-utils";
import { TileData, ObjectDetectionBBoxLayerProps } from "@/lib/types";
import { sleep, cn } from "@/lib/utils";

type Route = {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
};

type Landmark = {
  type: string;
  position: { lat: number; lng: number };
};

function StraightLinePath({ connections }: { connections: Route[] }) {
  const map = useMap();
  const antPathsRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    antPathsRef.current.forEach(path => {
      map.removeLayer(path);
    });
    antPathsRef.current = [];

    connections.forEach((connection) => {
      const { origin, destination } = connection;
      const latlng1: [number, number] = [origin.lat, origin.lng];
      const latlng2: [number, number] = [destination.lat, destination.lng];

      const antPath = (L.polyline as any).antPath(
        [latlng1, latlng2],
        {
          color: "transparent",      
          pulseColor: "#FFFFFF", 
          delay: 2000,        
          dashArray: [10, 10],    
          weight: 2,             
          hardwareAccelerated: true, 
          opacity: 0.2         
        }
      ).addTo(map);

      antPathsRef.current.push(antPath);
    });

    return () => {
      antPathsRef.current.forEach(path => {
        map.removeLayer(path);
      });
      antPathsRef.current = [];
    };
  }, [map, connections]);

  return null;
}

const createTriangleIcon = (rotation: number, color?: string) => {
  return L.divIcon({
    html: `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${rotation}deg); transform-origin: center; position: absolute; top: 0; left: 0; z-index: 0;">
        <path d="M6 0L12 12H0L6 0Z" fill=${color || "#FFFFFF"} />
      </svg>
    `,
    className: "",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const getBezierPoint = (t: number, p0: number[], p1: number[], p2: number[]): number[] => {
  const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
  const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
  return [x, y];
};

const getBezierTangentAngle = (t: number, p0: number[], p1: number[], p2: number[]): number => {
  const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

function CurvedLinePath({ routes }: { routes: Route[] }) {
  const map = useMap();
  const animationRefs = useRef<{ marker: L.Marker; cancel: () => void }[]>([]);

  useEffect(() => {
    if (!L.curve) {
      return;
    }

    if (!map.getPane('curvedLine')) {
      map.createPane('curvedLine');
      map.getPane('curvedLine')!.style.zIndex = '900';
    }

    const pathLayers: L.Path[] = [];
    animationRefs.current = [];

    routes.forEach((route) => {
      const { origin, destination } = route;

      const latlng1 = [origin.lat, origin.lng];
      const latlng2 = [destination.lat, destination.lng];

      const offsetX = latlng2[1] - latlng1[1];
      const offsetY = latlng2[0] - latlng1[0];
      const r = Math.sqrt(Math.pow(offsetX, 2) + Math.pow(offsetY, 2));
      const theta = Math.atan2(offsetY, offsetX);
      const thetaOffset = 3.14 / 10;
      const r2 = r / 2 / Math.cos(thetaOffset);
      const theta2 = theta + thetaOffset;
      const midpointX = r2 * Math.cos(theta2) + latlng1[1];
      const midpointY = r2 * Math.sin(theta2) + latlng1[0];
      const midpointLatLng = [midpointY, midpointX];

      const pathOptions = {
        color: "#3388ff",
        weight: 2,
        opacity: 1,
        pane: 'curvedLine',
      };
      const curvedPath = L.curve(["M", latlng1, "Q", midpointLatLng, latlng2], pathOptions).addTo(map);
      pathLayers.push(curvedPath);

      const triangleMarker = L.marker(latlng1 as L.LatLngExpression, {
        icon: createTriangleIcon(0, "#3388ff"),
        zIndexOffset: 1000,
      }).addTo(map);

      let animationFrame: number;
      const animate = () => {
        let t = 0;
        const duration = 2000;
        let startTime: number | null = null;

        const step = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          t = Math.min(elapsed / duration, 1);

          const [lat, lng] = getBezierPoint(t, latlng1, midpointLatLng, latlng2);
          const angle = getBezierTangentAngle(t, latlng1, midpointLatLng, latlng2);

          triangleMarker.setLatLng([lat, lng]);
          triangleMarker.setIcon(createTriangleIcon(angle, "#3388ff"));

          if (t < 1) {
            animationFrame = requestAnimationFrame(step);
          } else {
            startTime = null;
            animationFrame = requestAnimationFrame(animate);
          }
        };

        animationFrame = requestAnimationFrame(step);
      };

      animate();

      animationRefs.current.push({
        marker: triangleMarker,
        cancel: () => cancelAnimationFrame(animationFrame),
      });
    });

    return () => {
      pathLayers.forEach((layer) => map.removeLayer(layer));
      animationRefs.current.forEach(({ marker, cancel }) => {
        map.removeLayer(marker);
        cancel();
      });
    };
  }, [map, routes]);

  return null;
}

type Detection = {
  x: number;
  y: number;
  w: number;
  h: number;
  geoCoords?: {
    topLeft: [number, number];    
    bottomRight: [number, number];
    center: [number, number];
  };
  class: string;
  score: number;
};

const COLOR_MAP: Record<string, string> = {
  aircraft: '#E91E63',
  vessel: '#3F51B5',
  vehicle: '#4CAF50',
  default: '#000000'
};

const MODEL_INPUT_SIZE = 640;

const CLASS_NAMES = [
  'aircraft',
  'vessel',
  'vehicle'
];

function ObjectDetectionBBoxLayer({
  isSatelliteMode,
  baseLayers,
  modelPath = '/warp-sat-yolov11m_web_model/model.json',
}: ObjectDetectionBBoxLayerProps) {
  const { activeMode, setActiveMode } = useMapControlsContext();  
  const [detections, setDetections] = useState<Detection[]>([]);
  const map = useMap();
  const detectionsRef = useRef<Detection[]>([]);
  const modelRef = useRef<tf.GraphModel | null>(null);
  const modelLoadingRef = useRef<boolean>(false);
  const modelReadyRef = useRef<boolean>(false);
  const [isRunningInference, setIsRunningInference] = useState(false);
  const [hoveredDetectionIndex, setHoveredDetectionIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadModel() {
      if (modelLoadingRef.current || modelReadyRef.current || modelRef.current) return;

      modelLoadingRef.current = true;

      try {
        toast("Loading TensorFlow.js model...", {
          description: "Please wait while the model is being loaded.",
        });

        await tf.ready(); 
        modelRef.current = await tf.loadGraphModel(modelPath);
        modelReadyRef.current = true;
        console.log("TensorFlow.js model loaded successfully.", modelRef.current);

        toast.success("TensorFlow.js model loaded successfully", {
          description: "Ready to run inference on satellite imagery.",
        });
      } catch (error) {
        toast.error("Failed to load model", {
          description: `Could not load the TensorFlow.js model. Please check the model path and network. Error: ${error instanceof Error ? error.message : String(error)}`,
        });
      } finally {
        modelLoadingRef.current = false;
      }
    }

    loadModel();

    return () => {
      if (modelRef.current) {
        try {
          modelRef.current.dispose();
          modelRef.current = null;
          // tf.disposeVariables(); // Generally not needed for GraphModel inference alone unless you create variables elsewhere
          // tf.engine().disposeVariables();
        } catch (e: any) {
          toast.error("Error disposing TensorFlow model", {
            description: e?.message,
          });
        }
      }
    };
  }, [modelPath]);

  useEffect(() => {
    if (isRunningInference) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.touchZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    } else {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.touchZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    }
  }, [map, isRunningInference]);

  useEffect(() => {
    (async () => {
    if(!modelRef.current) await sleep(3000);
    if (!isSatelliteMode || activeMode !== 'detect') return;

    async function captureMapAndRunInference() {
      if (!modelReadyRef.current) {
        toast.error("Model not ready", {
          description: "The TensorFlow.js model is not loaded yet. Please wait.",
        });
        setIsRunningInference(false);
        return;
      }
      if (isRunningInference) {
        toast.info("Inference in Progress", {
          description: "An inference task is already running.",
        });
        return;
      }

      setIsRunningInference(true);
      setDetections([]); 
      detectionsRef.current = [];

      let tilesLoading = false;
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer && (layer as any)._loading) {
          tilesLoading = true;
        }
      });

      const performCapture = () => {
        if (!baseLayers?.satelliteLayerRef.current && !baseLayers?.defaultLayerRef.current) {
            setIsRunningInference(false);
            return;
        }

        const layersToRemove: L.Layer[] = [];
        map.eachLayer(layer => {
          if (layer !== baseLayers?.satelliteLayerRef.current &&
              layer !== baseLayers?.defaultLayerRef.current &&
              (layer as any)._map 
             ) {
            if (map.hasLayer(layer)) {
                layersToRemove.push(layer);
            }
          }
        });

        layersToRemove.forEach(layer => map.removeLayer(layer));
        const mapElement = map.getContainer();

        toast("Capturing map and running inference...", {
          description: "Please wait while the model processes the image.",
        });

        html2canvas(mapElement, {
          useCORS: true,
          allowTaint: true,
          scale: window.devicePixelRatio || 1,
          logging: false, 
          imageTimeout: 15000,
          onclone: (documentClone, element) => { 
            const canvasContainer = element.querySelector('.leaflet-pane.leaflet-tile-pane'); 
            if (canvasContainer) {
              (canvasContainer as HTMLElement).style.transform = 'none';
            }
            const controlContainer = element.querySelector('.leaflet-control-container');
            if (controlContainer) {
              (controlContainer as HTMLElement).style.visibility = 'hidden';
            }
          }
        }).then(async (canvas) => {
          const controlContainer = mapElement.querySelector('.leaflet-control-container');
          if (controlContainer) {
            (controlContainer as HTMLElement).style.visibility = 'visible';
          }
          layersToRemove.forEach(layer => {
            if (!map.hasLayer(layer)) map.addLayer(layer);
          });

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = MODEL_INPUT_SIZE;
          tempCanvas.height = MODEL_INPUT_SIZE;
          const tempCtx = tempCanvas.getContext('2d');

          if (!tempCtx) {
            setIsRunningInference(false);
            return;
          }

          const originalWidth = canvas.width;
          const originalHeight = canvas.height;
          const aspectRatio = originalWidth / originalHeight;

          let targetWidth, targetHeight, offsetX = 0, offsetY = 0;
          if (aspectRatio > 1) {
            targetWidth = MODEL_INPUT_SIZE;
            targetHeight = MODEL_INPUT_SIZE / aspectRatio;
            offsetY = (MODEL_INPUT_SIZE - targetHeight) / 2;
          } else {
            targetHeight = MODEL_INPUT_SIZE;
            targetWidth = MODEL_INPUT_SIZE * aspectRatio;
            offsetX = (MODEL_INPUT_SIZE - targetWidth) / 2;
          }

          tempCtx.fillStyle = '#000000';
          tempCtx.fillRect(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
          tempCtx.drawImage(
            canvas,
            0, 0, originalWidth, originalHeight,
            offsetX, offsetY, targetWidth, targetHeight
          );

          const scaleFactorX = originalWidth / targetWidth;
          const scaleFactorY = originalHeight / targetHeight;

          let tensor: tf.Tensor | null = null;
          let normalizedTensor: tf.Tensor | null = null;
          let result: tf.Tensor | tf.Tensor[] | null = null;

          try {
            if (!modelRef.current) {
              setIsRunningInference(false);
              return;
            }

            tensor = tf.browser.fromPixels(tempCanvas).expandDims(0).toFloat();
            normalizedTensor = tensor.div(tf.scalar(255.0));

            result = await modelRef.current.predict(normalizedTensor) as tf.Tensor;

            const newDetections: Detection[] = [];
            console.log("Model result tensor:", result)
            if (result && !(Array.isArray(result))) { 
              const outputTensorData = await result.array() as number[][][]; 
              const detectionFeaturesMatrix = outputTensorData[0]; 

              const numPotentialDetections = result.shape[2]; 
              const confidenceThreshold = 0.05;

              if (!numPotentialDetections){
                console.log("No detections found");
                return
              }
              for (let i = 0; i < numPotentialDetections; i++) {
                const cx = detectionFeaturesMatrix[0][i];
                const cy = detectionFeaturesMatrix[1][i];
                const w_box = detectionFeaturesMatrix[2][i];
                const h_box = detectionFeaturesMatrix[3][i];

                const prob_class0 = detectionFeaturesMatrix[4][i];
                const prob_class1 = detectionFeaturesMatrix[5][i];
                const prob_class2 = detectionFeaturesMatrix[6][i]; 

                const classProbs = [prob_class0, prob_class1, prob_class2];
                let score = 0;
                let classId_from_model = -1;

                for (let j = 0; j < classProbs.length; j++) {
                  if (classProbs[j] > score) {
                    score = classProbs[j];
                    classId_from_model = j;
                  }
                }

                if (score >= confidenceThreshold) { 
                  const x1 = cx - w_box / 2;
                  const y1 = cy - h_box / 2;
                  const x2 = cx + w_box / 2;
                  const y2 = cy + h_box / 2;

                  const adjX1 = x1 - offsetX; 
                  const adjY1 = y1 - offsetY;
                  const adjX2 = x2 - offsetX;
                  const adjY2 = y2 - offsetY;

                  const validX1 = Math.max(0, adjX1);
                  const validY1 = Math.max(0, adjY1);
                  const validX2 = Math.min(targetWidth, adjX2); 
                  const validY2 = Math.min(targetHeight, adjY2);

                  const origX1 = validX1 * scaleFactorX;
                  const origY1 = validY1 * scaleFactorY;
                  const origX2 = validX2 * scaleFactorX;
                  const origY2 = validY2 * scaleFactorY;
                  
                  if (origX2 <= origX1 || origY2 <= origY1) {
                    console.warn(`Skipping detection with invalid original coordinates: [${origX1.toFixed(1)},${origY1.toFixed(1)},${origX2.toFixed(1)},${origY2.toFixed(1)}] from box [${x1.toFixed(1)},${y1.toFixed(1)},${x2.toFixed(1)},${y2.toFixed(1)}] and score ${score.toFixed(4)}`);
                    continue;
                  }

                  const mapSize = map.getSize();
                  const currentMapWidth = mapSize.x;
                  const currentMapHeight = mapSize.y;

                  const mapScaleX = originalWidth / currentMapWidth; 
                  const mapScaleY = originalHeight / currentMapHeight;

                  const containerX1 = origX1 / mapScaleX;
                  const containerY1 = origY1 / mapScaleY;
                  const containerX2 = origX2 / mapScaleX;
                  const containerY2 = origY2 / mapScaleY;
                  
                  const pointTopLeft = L.point(containerX1, containerY1);
                  const pointBottomRight = L.point(containerX2, containerY2);

                  const containerCenterX = pointTopLeft.x + (pointBottomRight.x - pointTopLeft.x) / 2;
                  const containerCenterY = pointTopLeft.y + (pointBottomRight.y - pointTopLeft.y) / 2;
                  const pointCenter = L.point(containerCenterX, containerCenterY);

                  const topLeftGeo = map.containerPointToLatLng(pointTopLeft);
                  const bottomRightGeo = map.containerPointToLatLng(pointBottomRight);
                  const centerGeo = map.containerPointToLatLng(pointCenter);

                  const className = classId_from_model >= 0 && classId_from_model < CLASS_NAMES.length
                    ? CLASS_NAMES[classId_from_model]
                    : 'unknown';

                  newDetections.push({
                    x: pointTopLeft.x,
                    y: pointTopLeft.y,
                    w: pointBottomRight.x - pointTopLeft.x,
                    h: pointBottomRight.y - pointTopLeft.y,
                    geoCoords: {
                      topLeft: [topLeftGeo.lat, topLeftGeo.lng],
                      bottomRight: [bottomRightGeo.lat, bottomRightGeo.lng],
                      center: [centerGeo.lat, centerGeo.lng]
                    },
                    class: className,
                    score: score
                  });
                }
              }
              detectionsRef.current = newDetections;
              setDetections(newDetections);
              toast.success(`Detected ${newDetections.length} objects`, {
                description: "Objects have been detected and geo-referenced.",
              });
            } else {
                console.error("Model prediction did not return a single tensor or was null:", result);
                toast.error("Prediction error", { description: "Model output was not in the expected format." });
            }

          } catch (error) {
            console.error("TensorFlow.js inference error:", error);
            toast.error("Object detection failed", {
              description: `There was an error running the model inference. ${error instanceof Error ? error.message : String(error)}`,
            });
          } finally {
            tf.dispose([tensor, normalizedTensor, result].filter(t => t !== null) as tf.Tensor[]); // Dispose all used tensors
          }
        }).catch(err => {
          console.error("Canvas capture error:", err);
          layersToRemove.forEach(layer => {
            if (!map.hasLayer(layer)) map.addLayer(layer);
          });
          toast.error("Failed to capture map", {
            description: `Could not create an image of the current map view. ${err instanceof Error ? err.message : String(err)}`,
          });
        })
        .finally(() => {
          setIsRunningInference(false);
          setActiveMode("move");
        });
      };

      if (tilesLoading) {
        toast.info("Waiting for map tiles to load...");
        let eventHandlersAttached = 0;
        const onTilesLoaded = () => {
            eventHandlersAttached--;
            if (eventHandlersAttached <= 0) {
                console.log("All relevant tiles loaded, proceeding with capture.");
                map.eachLayer((layer) => {
                    if (layer instanceof L.TileLayer) {
                        layer.off('load', onTilesLoaded);
                        layer.off('tileerror', onTilesLoaded);
                    }
                });
                setTimeout(performCapture, 500); 
            }
        };

        map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer && (layer as any)._loading) {
                eventHandlersAttached++;
                layer.once('load', onTilesLoaded);
                layer.once('tileerror', onTilesLoaded);
            }
        });
        if(eventHandlersAttached === 0 && tilesLoading){
             console.warn("Tiles were marked as loading, but no load event listeners were attached. Proceeding with capture after a delay.");
             setTimeout(performCapture, 1500); 
        } else if (eventHandlersAttached === 0 && !tilesLoading) { 
            performCapture(); 
        }

      } else {
        console.log("No tiles loading, proceeding with capture directly.");
        performCapture();
      }
    }

    if (map) {
        map.whenReady(() => {
            captureMapAndRunInference();
        });
    }
  })();
  }, [map, activeMode]);

  return (
    <>
      {detections.map((det, i) => {
        if (!det.geoCoords || !det.geoCoords.topLeft || !det.geoCoords.bottomRight) {
            console.warn("Skipping rendering detection due to missing geoCoords:", det);
            return null;
        }

        const w = parseFloat(String(det.w));
        const h = parseFloat(String(det.h));

        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
          console.warn("Skipping rendering detection due to invalid width/height:", det);
          return null;
        }

        if (isNaN(det.geoCoords.topLeft[0]) || isNaN(det.geoCoords.topLeft[1]) ||
            isNaN(det.geoCoords.bottomRight[0]) || isNaN(det.geoCoords.bottomRight[1])) {
            console.warn("Skipping rendering detection due to NaN geoCoords:", det);
            return null;
        }

        const bounds: L.LatLngBoundsExpression = [
          [det.geoCoords.topLeft[0], det.geoCoords.topLeft[1]],
          [det.geoCoords.bottomRight[0], det.geoCoords.bottomRight[1]]
        ];

        const color = COLOR_MAP[det.class] ?? COLOR_MAP.default;

        const markerText = hoveredDetectionIndex === i ? `${det.class} ${det.score.toFixed(2)}` : det.score.toFixed(2);

        const probabilityIcon = L.divIcon({
          html: `
            <div style="
              background-color: ${color};
              width: fit-content;
              color: white;
              padding: 2px 4px;
              font-size: 0.5rem; /* xs font size */
              font-weight: bold;
              border-bottom-right-radius: 4px; /* Creates the notch effect */
              white-space: nowrap; /* Prevent text wrapping */
              pointer-events: none; /* Allows clicks to pass through to the map */
              z-index: 1000; /* Ensure it's above the rectangle */
            ">
              ${markerText}
            </div>
          `,
          className: 'custom-probability-icon',
          iconAnchor: [1, 16],
          iconSize: [0, 0],
        });

        const eventHandlers = {
          mouseover: () => setHoveredDetectionIndex(i),
          mouseout: () => setHoveredDetectionIndex(null),
        };

        return (
          <React.Fragment 
          key={`${det.class}-${det.score}-${i}`}
          >
            <Rectangle
              bounds={bounds}
              pathOptions={{ color, weight: 1, fill: false }}
              eventHandlers={eventHandlers} 
            />
            <Marker
              position={det.geoCoords.topLeft}
              icon={probabilityIcon}
              eventHandlers={eventHandlers} 
            />
          </React.Fragment>
        );
      })}
    </>
  );
}

interface DrawingComponentProps {
  onShapeDrawn: (shapeGeoJSON: Feature<GeoJSONPolygon | GeoJSONMultiPolygon> | null) => void; // Change to GeoJSON
  onDrawingStateChange: (isDrawing: boolean) => void;
  onUndoStateChange: (canUndo: boolean) => void;
  onHasShapeChange: (hasShape: boolean) => void;
  onTilesCollected: (tiles: TileData[]) => void;
  zoomLevel: number;
  clearSignal: number;
  finishSignal: number;
  activeGeoJSON: GeoJSONPolygon | GeoJSONMultiPolygon | null;
}

const DrawingComponent: React.FC<DrawingComponentProps> = ({
  onShapeDrawn,
  onDrawingStateChange,
  onUndoStateChange,
  onHasShapeChange,
  onTilesCollected,
  zoomLevel,
  clearSignal,
  finishSignal,
  activeGeoJSON,
}) => {
  const map = useMap();
  const { activeMode, setActiveMode } = useMapControlsContext();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef<FeatureGroup>(new L.FeatureGroup());
  const activeDrawHandlerRef = useRef<L.Draw.Feature | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  const polygonDrawOptions = useMemo(() => ({
    allowIntersection: false, showArea: true,
    drawError: { color: '#e1e100', message: '<strong>Error:</strong> Polygon edges cannot intersect!' },
    shapeOptions: { color: '#3b82f6', fillOpacity: 0.2 },
  }), []);

  const rectangleDrawOptions = useMemo(() => ({
    shapeOptions: { color: '#f06eaa', fillOpacity: 0.2 }, showArea: true,
  }), []);

  const collectTilesFromPolygon = useCallback(async (feature: Feature<GeoJSONPolygon | GeoJSONMultiPolygon>) => {
    setIsCollecting(true);

    try {
      if (!feature.geometry || (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon')) {
        console.warn("Drawn shape is not a polygon or multi-polygon");
        return;
      }

      const bounds = getGeoJsonBounds(feature);

      const southWest = latLngToTile(bounds.minLat, bounds.minLng, zoomLevel);
      const northEast = latLngToTile(bounds.maxLat, bounds.maxLng, zoomLevel);

      const tiles: TileData[] = [];
      const uniqueTiles = new Set<string>();

      for (let x = southWest.x; x <= northEast.x; x++) {
        for (let y = northEast.y; y <= southWest.y; y++) {
          const tileKey = `${x}-${y}-${zoomLevel}`;

          if (uniqueTiles.has(tileKey)) continue;
          uniqueTiles.add(tileKey);

          if (isTileInRegion(x, y, zoomLevel, feature)) {
            const center = getTileCenter(x, y, zoomLevel);
            const tileBounds = getTileBounds(x, y, zoomLevel);

            const tileUrl = `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/${zoomLevel}/${y}/${x}`;

            tiles.push({
              url: tileUrl,
              x: x,
              y: y,
              zoom: zoomLevel,
              center: {lat: center.lat, lng: center.lng},
              bounds: tileBounds,
              alt: `Satellite tile at ${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`,
              caption: `ESRI satellite imagery tile (${x}, ${y}) at zoom ${zoomLevel}, center: ${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`
            });
          }
        }
      }

      onTilesCollected(tiles);

    } catch (error) {
      toast.error("Error collecting tiles from polygon", {
        description: "Please try again.",
        action: {
          label: "Ok",
          onClick: () => ("") // add a callback function to handle the click event
        },
      });
    } finally {
      setIsCollecting(false);
    }
  }, [onTilesCollected, zoomLevel]);

  useEffect(() => {
    if(!['polygon', 'rectangle'].includes(activeMode)) return
    console.log(activeMode)
    enableDraw(activeMode as 'polygon' | 'rectangle')
  }, [activeMode])

  const enableDraw = useCallback((type: 'polygon' | 'rectangle') => {
    console.log(type)
    if (!map || !drawControlRef.current) return;

    drawnItemsRef.current.clearLayers();
    onShapeDrawn(null); 
    onHasShapeChange(false);

    if (activeDrawHandlerRef.current) activeDrawHandlerRef.current.disable();

    const drawOptions = (drawControlRef.current.options as any).draw;
    const handlerOptions = type === 'polygon' ? drawOptions.polygon : drawOptions.rectangle;
    const DrawFeatureClass = type === 'polygon' ? (L.Draw as any).Polygon : (L.Draw as any).Rectangle;

    if (!handlerOptions || typeof handlerOptions === 'boolean') {
      onDrawingStateChange(false);
      return;
    }

    try {
      activeDrawHandlerRef.current = new DrawFeatureClass(map, handlerOptions);
      requestAnimationFrame(() => activeDrawHandlerRef.current?.enable());
    } catch (error) {
      onDrawingStateChange(false);
    }
  }, [map, onShapeDrawn, onHasShapeChange, onDrawingStateChange]);

  useEffect(() => {
    map.addLayer(drawnItemsRef.current);

    const control = new L.Control.Draw({
      draw: {
        polyline: false, circle: false, circlemarker: false, marker: false,
        polygon: polygonDrawOptions,
        rectangle: rectangleDrawOptions
      },
      edit: {
        featureGroup: drawnItemsRef.current,
        remove: false,
      },
    });

    drawControlRef.current = control; 

    const handleDrawCreated = (e: any) => {
      const layer = e.layer;
      drawnItemsRef.current.addLayer(layer); 

      const feature = layer.toGeoJSON() as Feature<GeoJSONPolygon | GeoJSONMultiPolygon>;
      onShapeDrawn(feature); 
      onHasShapeChange(true);
      onDrawingStateChange(false);
      onUndoStateChange(false);
      activeDrawHandlerRef.current = null;

      if (layer instanceof L.Polygon || layer instanceof L.Rectangle) { 
        collectTilesFromPolygon(feature);
      }
    };

    const handleDrawStart = () => {
      drawnItemsRef.current.clearLayers();
      onShapeDrawn(null);
      onDrawingStateChange(true);
      onUndoStateChange(false);
    };

    const handleDrawVertex = () => onUndoStateChange(true);
    const handleDrawStop = () => {
      onDrawingStateChange(false);
      activeDrawHandlerRef.current = null;
    };

    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    map.on(L.Draw.Event.DRAWSTART, handleDrawStart);
    map.on(L.Draw.Event.DRAWVERTEX, handleDrawVertex);
    map.on(L.Draw.Event.DRAWSTOP, handleDrawStop);

    return () => {
      if (drawControlRef.current) map.removeControl(drawControlRef.current);
      map.removeLayer(drawnItemsRef.current); // Remove the feature group
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
      map.off(L.Draw.Event.DRAWSTART, handleDrawStart);
      map.off(L.Draw.Event.DRAWVERTEX, handleDrawVertex);
      map.off(L.Draw.Event.DRAWSTOP, handleDrawStop);
      activeDrawHandlerRef.current?.disable();
    };
  }, [map, polygonDrawOptions, rectangleDrawOptions, onShapeDrawn, onDrawingStateChange, onUndoStateChange, onHasShapeChange, collectTilesFromPolygon]);

  useEffect(() => {
    if (activeGeoJSON) {
      const tempFeature = { type: 'Feature', geometry: activeGeoJSON } as Feature<GeoJSONPolygon | GeoJSONMultiPolygon>;
      collectTilesFromPolygon(tempFeature);
    } else {
      onTilesCollected([]);
    }
  }, [zoomLevel, activeGeoJSON, collectTilesFromPolygon, onTilesCollected]);

  useEffect(() => {
    if (clearSignal > 0) {
      if (drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers(); 
      }
      onShapeDrawn(null); 
      onHasShapeChange(false);
      onDrawingStateChange(false);
      onUndoStateChange(false);
      activeDrawHandlerRef.current?.disable();
      activeDrawHandlerRef.current = null;
    }
  }, [clearSignal, onShapeDrawn, onHasShapeChange, onDrawingStateChange, onUndoStateChange]);

  useEffect(() => {
    if (finishSignal > 0 && map) {
      if (activeDrawHandlerRef.current && typeof (activeDrawHandlerRef.current as any)._finishShape === 'function') {
        try { (activeDrawHandlerRef.current as any)._finishShape(); }
        catch (e) { if (activeDrawHandlerRef.current instanceof (L.Draw as any).Polygon) map.fire('dblclick'); }
      } else if (activeDrawHandlerRef.current instanceof (L.Draw as any).Polygon) map.fire('dblclick');
    }
  }, [finishSignal, map]);

  return null; 
};

function ReverseImageSearch({
  zoomLevel,
  isClearing,
  onShapeDrawn,
  onDrawingStateChange,
  onCleared,
  onInferenceChanged, 
}: {
  zoomLevel: number;
  isClearing: boolean;
  onShapeDrawn: (shape: boolean) => void;
  onDrawingStateChange: (isDrawing: boolean) => void;
  onCleared: (isClearing: boolean) => void;
  onInferenceChanged: (isRunningInference: boolean) => void;
}){
  const map = useMap();
  const { files, setFiles, actionHandler, setActionHandler } = useGlobalContext()
  const { activeMode, setActiveMode } = useMapControlsContext();
  const [isDrawing, setIsDrawing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [hasShape, setHasShape] = useState(false);
  const [activeGeoJSON, setActiveGeoJSON] = useState<GeoJSONPolygon | GeoJSONMultiPolygon | null>(null);
  const [polygonDrawSignal, setPolygonDrawSignal] = useState(0);
  const [rectangleDrawSignal, setRectangleDrawSignal] = useState(0);
  const [clearSignal, setClearSignal] = useState(0);
  const [undoSignal, setUndoSignal] = useState(0);
  const [finishSignal, setFinishSignal] = useState(0);
  const [zoom, setZoom] = useState<number>(zoomLevel);
  const [collectedTiles, setCollectedTiles] = useState<TileData[]>([]);
  const [gridTiles, setGridTiles] = useState<TileData[]>([]); 
  const [isRunningInference, setIsRunningInference] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(false);
  const [embeddingsComputed, setEmbeddingsComputed] = useState(0)
  const [query, setQuery] = useState<string | null>(null)
  const [embeddingsId, setEmbeddingsId] = useState<string | null>(null)
  const [mapSnapshot, setMapSnapshot] = useState<{
    center: L.LatLngExpression;
    zoom: number;
    geoJSON: GeoJSONPolygon | GeoJSONMultiPolygon | null;
    gridTiles: TileData[];
  } | null>(null)

  const mapSnapshotRef = useRef<typeof mapSnapshot>(null);

  useEffect(() => {
    onInferenceChanged(isRunningInference)
    if (!isRunningInference) return;

    const interval = setInterval(() => {
      setPulsePhase(prev => !prev);
    }, 1500);

    return () => clearInterval(interval);
  }, [isRunningInference]);

  useEffect(() => {
    setZoom(zoomLevel);
  }, [zoomLevel]);

  useEffect(() => {
    const timer = setTimeout(() => setPolygonDrawSignal(prev => prev + 1), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    mapSnapshotRef.current = mapSnapshot;
  }, [mapSnapshot]);

  useEffect(() => {
    if(!actionHandler) return
    if(actionHandler?.query){
      setQuery(actionHandler?.query)
    }
  }, [actionHandler])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const snap = mapSnapshotRef.current;
        if (!snap) return;
        console.log("Restoring map snapshot...", snap)
        map.flyTo(snap.center, snap.zoom);
        setActiveGeoJSON(snap.geoJSON);
        setGridTiles(snap.gridTiles);
        console.log("Restored map snapshot...");
      }
    };
  
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleShapeDrawn = useCallback((shapeGeoJSON: Feature<GeoJSONPolygon | GeoJSONMultiPolygon> | null) => {
    onShapeDrawn(shapeGeoJSON !== null);
    if (shapeGeoJSON && (shapeGeoJSON.geometry.type === 'Polygon' || shapeGeoJSON.geometry.type === 'MultiPolygon')) {
      setActiveGeoJSON(shapeGeoJSON.geometry);
    } else {
      setActiveGeoJSON(null);
    }
  }, []);

  const handleTileZoom = (tile: TileData) => {
    if (!map) {
      return;
    }
    setMapSnapshot({
      center: { ...map.getCenter() },
      zoom: map.getZoom(),
      geoJSON: activeGeoJSON,
      gridTiles: [...gridTiles]
    })
    handleClear();
    const centerLatLng = L.latLng(tile.center.lat, tile.center.lng);
    map.flyTo(centerLatLng, zoom); 
  };

  const handleTilesCollected = useCallback(async (newTiles: TileData[]) => {
    if(!newTiles.length) return
    setCollectedTiles(newTiles);
    setIsRunningInference(true)
    
    try {
      const response = await fetch('/api/embeddings/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tiles: [...newTiles] })
      });
    
      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error, {
          description: error.details || 'Failed to compute batch embeddings'
        });
        return; 
      } 

      const result = await response.json();
      setEmbeddingsId(result.id)
      setEmbeddingsComputed(result.size)
    } catch (error) {
      toast.error('Network error', {
        description: 'Failed to connect to the server'
      });
      handleClear()
      setActiveMode("move")
    }
  }, []);

  useEffect(() => {
    if(!embeddingsId) return 
    const imageData = files.find(file => file.type.startsWith('image/')) || null
    const imageUrl = imageData ? URL.createObjectURL(new Blob([imageData], { type: imageData.type })) : null
    console.log(imageUrl)
    const handleSemanticSearch = async () => {
      try {
        const response = await fetch('/api/embeddings/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            text: query, 
            image: imageUrl, 
            id: embeddingsId, 
            size: embeddingsComputed 
          })
        });
      
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error:', errorData);
          throw new Error(errorData.error || 'Failed to query embeddings');
        }
      
        const result = await response.json();
        setCollectedTiles([]);
        setGridTiles(result.results);
      } catch (error) {
        toast.error("Failed searching embeddings", {
          description: 'Failed to compute embeddings search'
        });
        handleClear()
        setActiveMode("move")
      }
    };
    
    handleSemanticSearch().then(() => {
      setIsRunningInference(false)
    })
  }, [embeddingsId]);

  const handleIsDrawing = useCallback((isDrawing: boolean) => {
    onDrawingStateChange(isDrawing);
    setIsDrawing(isDrawing);
  }, []);

  const handleClear = () => {
    setClearSignal(prev => prev + 1);
    setGridTiles([]);
    setCollectedTiles([]);
    setActiveGeoJSON(null);
    onCleared(false)
    setEmbeddingsComputed(0) 
    setEmbeddingsId(null)
  }

  useEffect(() => {
    if(isClearing) {
      handleClear()
      setActiveMode("move")
    }
  }, [isClearing]);

  useEffect(() => {
    if (activeGeoJSON) {
      let polygonToProcess: GeoJSONPolygon | null = null;
      if (activeGeoJSON.type === 'Polygon') {
        polygonToProcess = activeGeoJSON;
      } else if (activeGeoJSON.type === 'MultiPolygon') {
        if (activeGeoJSON.coordinates.length > 0) {
          console.warn("MultiPolygon found. Processing its first polygon component for grid generation.");
          polygonToProcess = {
            type: "Polygon",
            coordinates: activeGeoJSON.coordinates[0],
          };
        } else {
          console.warn("MultiPolygon has no coordinate parts.");
        }
      }

      if (polygonToProcess) {
        const featureToProcess: Feature<GeoJSONPolygon | GeoJSONMultiPolygon> = {
          type: 'Feature',
          geometry: polygonToProcess,
          properties: {}
        };
        
        const generatedGridTiles = generateTilesFromPolygon(featureToProcess, zoom);
        setGridTiles(generatedGridTiles as TileData[]);
      } else {
        setGridTiles([]);
      }
    } else {
      setGridTiles([]);
    }
  }, [activeGeoJSON, zoom]);

  return (
    <>
      {activeGeoJSON && activeGeoJSON.type === 'Polygon' && (
        <Polygon
          positions={activeGeoJSON.coordinates[0].map(([lng, lat]) => [lat, lng])}
          pathOptions={{ color: '#3b82f6', fillOpacity: 0.2 }}
        />
      )}
      {activeGeoJSON && activeGeoJSON.type === 'MultiPolygon' && activeGeoJSON.coordinates.map((polygonCoords, index) => (
        <Polygon
          key={`multi-polygon-${index}`}
          positions={polygonCoords[0].map(([lng, lat]) => [lat, lng])}
          pathOptions={{ color: '#3b82f6', fillOpacity: 0.2 }}
        />
      ))}

      <DrawingComponent
        onShapeDrawn={handleShapeDrawn}
        onDrawingStateChange={handleIsDrawing}
        onUndoStateChange={setCanUndo}
        onHasShapeChange={setHasShape}
        onTilesCollected={handleTilesCollected}
        zoomLevel={zoom}
        clearSignal={clearSignal}
        finishSignal={finishSignal}
        activeGeoJSON={activeGeoJSON} 
      />

      {gridTiles.map((tile, index) => {
        const sims = gridTiles
        .map(tile => tile.similarity)
        .filter((s): s is number => typeof s === "number");
    
        if (sims.length === 0) {
          return [];
        }
      
        const minSim = Math.min(...sims);
        const maxSim = Math.max(...sims);
      
        function normalize(sim: number) {
          if (maxSim === minSim) {
            return 1;
          }
          return (sim - minSim) / (maxSim - minSim);
        }
      
        function blendHex(c1: string, c2: string, t: number) {
          const toRgb = (hex: string) => [
            parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16),
          ];
          const [r1, g1, b1] = toRgb(c1);
          const [r2, g2, b2] = toRgb(c2);
          const r = Math.round(r1 + (r2 - r1) * t);
          const g = Math.round(g1 + (g2 - g1) * t);
          const b = Math.round(b1 + (b2 - b1) * t);
          const toHex = (n: number) => n.toString(16).padStart(2, "0");
          return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        }

        const rawSim = typeof tile.similarity === "number" ? tile.similarity : minSim;
        const t = normalize(rawSim);
        const fillColor = blendHex("#e0d4ff", "#5500aa", t);

        const bounds = L.latLngBounds(
          [tile.bounds.south, tile.bounds.west],
          [tile.bounds.north, tile.bounds.east]
        );

        return (
          <Rectangle
            key={`grid-tile-${tile.x}-${tile.y}-${tile.zoom}-${index}`}
            bounds={bounds}
            pathOptions={{
              color: fillColor,   
              weight: 2,
              opacity: 0.8,
              fillColor,
              fillOpacity: 0.45, 
            }}
            eventHandlers={{
              click: () => handleTileZoom(tile)
            }}
          />
        );
      })}

      {collectedTiles.map((tile, index) => {
        const bounds = L.latLngBounds(
          [tile.bounds.south, tile.bounds.west],
          [tile.bounds.north, tile.bounds.east]
        );
        const key = `collected-tile-${tile.x}-${tile.y}-${tile.zoom}-${index}`;
        const pulseFillOpacity = pulsePhase ? 0.2 : 0.5;

        return (
          <Rectangle
            key={key}
            bounds={bounds}
            pathOptions={{
              color: "#9233ff",
              weight: 2,
              opacity: 0.8,
              fillColor: "#9233ff",
              fillOpacity: isRunningInference ? pulseFillOpacity : 0.2
            }}
          />
        );
      })}
    </>
  );
};

function MapController({
  focalPoint,
  routes,
  connections,
  landmarks,
  circleRadius,
  selectedRegion,
  isSatelliteMode,
  onSatelliteRefChange,
  baseLayers,
}: {
  focalPoint: { lat: number; lng: number };
  routes: Route[] | null;
  connections: Route[] | null;
  landmarks: {
    type: string;
    position: { lat: number, lng: number };
  }[] | null;
  circleRadius?: number | null;
  selectedRegion?: GeoJsonObject;
  isSatelliteMode: boolean;
  onSatelliteRefChange: (ref: React.MutableRefObject<L.TileLayer | L.TileLayer.WMS | null>) => void;
  baseLayers: Record<string, React.MutableRefObject<L.TileLayer | L.TileLayer.WMS | null>>;
}) {
  const map = useMap();
  const { activeMode, setActiveMode, isClearingAll, setIsClearingAll } = useMapControlsContext(); 
  const [satelliteType, setSatelliteType] = useState<"sentinel-2" | "usgs" | "esri" | "custom">("esri");
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  const satelliteLayerRef = React.useRef<L.TileLayer | L.TileLayer.WMS | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if(map){
      map.setView([focalPoint.lat, focalPoint.lng], 17);
    }
  }, [map, focalPoint]);

  useEffect(() => {
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }
    if(!['polygon', 'rectangle'].includes(activeMode)) return
  
    if (circleRadius && !selectedRegion) {
      const circleLayer = L.circle(focalPoint, {
        color: '#FFFFFF',
        dashArray: [4, 4],
        fillColor: '#3388ff',
        fillOpacity: 0.1,
        radius: circleRadius,     
        weight: 2,            
        pane: 'tilePane', 
      });
      
      circleLayer.addTo(map);
      circleRef.current = circleLayer;
    }
  }, [map, circleRadius, selectedRegion]);

  useEffect(() => {
    if(!['polygon', 'rectangle'].includes(activeMode)) return
    if (map && selectedRegion) {
      try {
        const geoJsonLayer = L.geoJSON(selectedRegion);
        const bounds = geoJsonLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds);
        }
      } catch (error) {
        toast("Error fitting to GeoJSON bounds.", {
          description: "Please try again.",
          action: {
            label: "Ok",
            onClick: () => ("")
          },
        });
      }
    }
  }, [map, selectedRegion]);

  useEffect(() => {
    if (!map) return;

    if (isSatelliteMode) {
      if (satelliteLayerRef.current) {
        satelliteLayerRef.current.remove();
        satelliteLayerRef.current = null;
      }

      let leafletLayer: L.TileLayer;

      switch (satelliteType) {
        case "sentinel-2":
          leafletLayer = L.tileLayer.wms(`https://services.sentinel-hub.com/ogc/wms/${process.env.SENTINEL_HUB_ID}`, {
            layers: "TRUE-COLOR",
            format: 'image/jpeg',
            transparent: false,
            noWrap: true,
            attribution: "Contains modified Copernicus Sentinel data processed by Sentinel Hub",
          });
          break;
        case "usgs":
          leafletLayer = L.tileLayer("https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}", {
              maxZoom: 16,
              attribution: '&copy; <a href="https://www.usgs.gov/">U.S. Geological Survey</a>',
              noWrap: true
            });
          break;
        case "esri":
          leafletLayer = L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`, {
            attribution: "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
            noWrap: true,
          });
          break;
        default:
          return;
      }

      leafletLayer.addTo(map);
      satelliteLayerRef.current = leafletLayer;
      onSatelliteRefChange(satelliteLayerRef);
    } else if (satelliteLayerRef.current) {
      satelliteLayerRef.current.remove();
      satelliteLayerRef.current = null;
    }

    return () => {
      if (satelliteLayerRef.current) {
        satelliteLayerRef.current.remove();
        satelliteLayerRef.current = null;
      }
    };
  }, [map, isSatelliteMode, satelliteType]);

  useEffect(() => {
    if (map && isClearingAll) {
      setActiveMode("move")
      const layersToRemove: L.Layer[] = [];
      map.eachLayer(layer => {
        if (layer !== baseLayers?.satelliteLayerRef.current && 
            layer !== baseLayers?.defaultLayerRef.current &&
            (layer as any)._map 
            ) {
          if (map.hasLayer(layer)) {
              layersToRemove.push(layer);
          }
        }
      });

      layersToRemove.forEach(layer => map.removeLayer(layer));
    }
    setIsClearingAll(false)
  }, [isClearingAll]) 

  return null;
}

interface MapProps {
  focalPoint: { lat: number; lng: number };
  routes: Route[] | null;
  connections: Route[] | null;
  landmarks: {
    type: string;
    position: { lat: number, lng: number };
  }[] | null;
  isSatelliteMode: boolean;
  onLandmarkClick?: (landmark: any) => void;
  circleRadius?: number | null;
  selectedRegion?: GeoJsonObject;
  geoJsonKey?: number,
}

const Map: React.FC<MapProps> = ({
  focalPoint,
  routes,
  connections,
  landmarks,
  isSatelliteMode,
  onLandmarkClick,
  circleRadius,
  selectedRegion,
  geoJsonKey,
}) => {
  const { actionHandler, setActionHandler } = useGlobalContext()
  const { activeMode, setActiveMode } = useMapControlsContext();
  const [currentFocalPoint, setCurrentFocalPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(16);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasShape, setHasShape] = useState(false);
  const [isClearingShape, setIsClearingShape] = useState(false);  
  const [isRunningInference, setIsRunningInference] = useState(false);
  const tileLayerUrl = "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
  const locationPinMarker = createLocationPinMarker();

  const defaultLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | L.TileLayer.WMS | null>(null);

  const handleSatelliteRefChange = (ref: React.MutableRefObject<L.TileLayer | L.TileLayer.WMS | null>) => {
    satelliteLayerRef.current = ref.current;
  }

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties && feature.properties.name) {
      layer.bindPopup(feature.properties.name);
    }
  };

  useEffect(() => {
    if(!actionHandler) return
    if(actionHandler?.mode){
      setActiveMode(actionHandler?.mode)
    }
  }, [actionHandler])

  useEffect(() => {
    if (!['polygon', 'rectangle'].includes(activeMode)) {  
      setIsDrawing(false)
    }
  }, [activeMode])  

  return (
    <div className="relative w-full h-full">
    <MapContainer
      center={[focalPoint.lat, focalPoint.lng]}
      zoom={13}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      minZoom={4}  
      maxBoundsViscosity={1.0}  
      maxBounds={[
        [-90, -180],  
        [90, 180]    
      ]}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url={tileLayerUrl}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        ref={defaultLayerRef}
      />
      
      {connections && !isSatelliteMode && <StraightLinePath connections={connections} />}
      {routes && !isSatelliteMode && <CurvedLinePath routes={routes} />}
      {routes && !isSatelliteMode && routes.map((route, index) => (
        <Marker 
          key={index} 
          position={[route.destination.lat, route.destination.lng]} 
          icon={locationPinMarker} 
        />
      ))}
      {landmarks && !isSatelliteMode && landmarks.map((landmark, index) => (
        <Marker 
          key={index}
          position={[landmark.position.lat, landmark.position.lng]} 
          icon={getMarkerIcon(landmark.type)}
          eventHandlers={{
            click: () => {
              onLandmarkClick?.(landmark)
              setCurrentFocalPoint(landmark.position)
            }
          }}
        />
      ))}
      {['polygon', 'rectangle'].includes(activeMode) && 
      <ReverseImageSearch 
        zoomLevel={zoomLevel} 
        onDrawingStateChange={setIsDrawing} 
        onShapeDrawn={setHasShape}
        isClearing={isClearingShape}
        onCleared={setIsClearingShape}
        onInferenceChanged={setIsRunningInference}
        />}
      {!['polygon', 'rectangle'].includes(activeMode) && 
      <ObjectDetectionBBoxLayer 
        isSatelliteMode={isSatelliteMode} 
        baseLayers={{ satelliteLayerRef, defaultLayerRef }}
      />}
      {currentFocalPoint && !isSatelliteMode && <Marker
        position={[currentFocalPoint.lat || focalPoint.lat, currentFocalPoint.lng]}
        icon={createFocalPointHighlightMarker()}
        zIndexOffset={-100}
      />}
      {selectedRegion && (
          <GeoJSON
            key={geoJsonKey}
            data={selectedRegion}
            style={{
              fillColor: "#3388ff",
              weight: 2,
              opacity: 1,
              color: "white",
              dashArray: "3",
              fillOpacity: 0.1
            }}
            onEachFeature={onEachFeature}
          />
        )}
      <MapController
        focalPoint={currentFocalPoint || focalPoint}
        routes={routes}
        connections={connections}
        landmarks={landmarks}
        circleRadius={circleRadius}
        selectedRegion={selectedRegion}
        isSatelliteMode={isSatelliteMode}
        onSatelliteRefChange={handleSatelliteRefChange}
        baseLayers={{ satelliteLayerRef, defaultLayerRef }}
      />
    </MapContainer>
    <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end space-y-2">

      {hasShape && !isDrawing && (
          <Button variant="outline" disabled={isRunningInference} size="icon" onClick={() => setIsClearingShape(true)} className="bg-background shadow-md hover:bg-red-50 hover:text-red-600" aria-label="Clear"><Trash2 size={20} /></Button>
      )}

      {hasShape && <div className="flex items-center space-x-2 bg-background shadow-md p-2 rounded-md">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setZoomLevel((z) => Math.max(z - 1, 1))}
          disabled={isRunningInference}
          >
          -
        </Button>
        <input
          type="number"
          min="14"
          max="19"
          value={zoomLevel}
          onChange={(e) => setZoomLevel(Number(e.target.value))}
          className="w-12 text-center bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <Button 
        variant="outline" 
        size="icon" 
        onClick={() => setZoomLevel((z) => z + 1)}
        disabled={isRunningInference}
        >
          +
        </Button>
      </div>}
      </div>

      {isDrawing && ( <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-background shadow-md px-3 py-2 rounded-md text-sm font-medium animate-pulse">Drawing...</div>)}
    </div>
  );
};

export default Map;

interface MapPreviewProps {
  focalPoint: { lat: number; lng: number };
  isSatelliteMode: boolean;
}

export const MapPreview: React.FC<MapPreviewProps> = ({ focalPoint, isSatelliteMode }) => {
  const tileURL = isSatelliteMode
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    : "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png";

  const attributionText = isSatelliteMode
    ? 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    : '© <a href="https://stadiamaps.com/">Stadia Maps</a>, © <a href="https://openmaptiles.org/">OpenMapTiles</a> © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

  return (
    <MapContainer
      center={[focalPoint.lat, focalPoint.lng]}
      zoom={18}
      style={{ height: "100%", width: "100%" }}
      className="z-0 pointer-events-none"
      dragging={false}
      doubleClickZoom={false}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      keyboard={false}
      touchZoom={false}
      boxZoom={false}
    >
      <TileLayer
        url={tileURL}
        attribution={attributionText}
      />
    </MapContainer>
  );
};

const createLocationPinMarker = () => {
  return L.divIcon({
    html: `
      <div style="position: relative; width: 22px; height: 22px;">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg style="position: absolute; top: 0; left: 0; z-index: 0;"">
          <path d="M11 22C17.0751 22 22 17.0751 22 11C22 4.92487 17.0751 0 11 0C4.92487 0 0 4.92487 0 11C0 17.0751 4.92487 22 11 22Z" fill="#3388ff" fill-opacity="0.2" />
          <path d="M11 16.28C13.9161 16.28 16.28 13.9161 16.28 11C16.28 8.08394 13.9161 5.72 11 5.72C8.08394 5.72 5.72 8.08394 5.72 11C5.72 13.9161 8.08394 16.28 11 16.28Z" fill="white" />
          <path d="M11 15.4C13.4301 15.4 15.4 13.4301 15.4 11C15.4 8.56995 13.4301 6.60001 11 6.60001C8.56995 6.60001 6.60001 8.56995 6.60001 11C6.60001 13.4301 8.56995 15.4 11 15.4Z" fill="#3388ff" />
        </svg>
      </div>
    `,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

const getMarkerIcon = (type: string) => {
  switch(type) {
    case 'renewable':
      return createInfrastructureLandmarkMarker(renderToString(<MdWindPower size={24} color="white" />), "#15803D"); 
    case 'nonrenewable':
      return createDefaultLandmarkMarker(renderToString(<FaOilWell size={24} color="white" />), "#B45309");
    case 'waterPlant':
      return createInfrastructureLandmarkMarker(renderToString(<BiWater size={24} color="white" />), "#1E40AF");
    case 'distributor':
      return createDefaultLandmarkMarker(renderToString(<MdWarehouse size={24} color="white" />), "#312E81");
    case 'supplier':
      return createDefaultLandmarkMarker(renderToString(<MdWarehouse size={24} color="white" />), "#047857");
    case 'manufacturer':
      return createDefaultLandmarkMarker(renderToString(<BiSolidFactory size={24} color="white" />), "#9D174D");
    case 'airport':
      return createInfrastructureLandmarkMarker(renderToString(<BiSolidPlaneAlt size={24} color="white" />), "#0F766E"); 
    case 'port':
      return createInfrastructureLandmarkMarker(renderToString(<Icon path={mdiPierCrane} size={24} color="white" />), "#0E7490");
    case 'trucking':
      return createDefaultLandmarkMarker(renderToString(<PiTruckTrailerFill size={24} color="white" />), "#9A3412"); 
    case 'company':
          return createDefaultLandmarkMarker(renderToString(<CgOrganisation size={24} color="white" />), "#4C1D95"); 
    case 'mining':
      return createDefaultLandmarkMarker(renderToString(<Icon path={mdiDumpTruck} size={24} color="white" />), "#A16207"); 
    case 'base':
      return createDefaultLandmarkMarker(renderToString(<FaTents size={24} color="white" />), "#14532D"); 
    case 'farmland':
      return createDefaultLandmarkMarker(renderToString(<Icon path={mdiHomeSilo} size={24} color="white" />), "#78350F");
    default:
      return createDefaultLandmarkMarker(renderToString(<CgOrganisation size={24} color="white" />), "#3D4452");
  }
  };
 
const createDefaultLandmarkMarker = (icon: string, color: string) => {
  return L.divIcon({
      html: `
      <div style="position: relative; width: 34px; height: 39px;">
          <svg width="34" height="39" style="position: absolute; top: 0; left: 0; z-index: 1;">
          <path d="
              M 6,0
              C 2.68629,0 0,2.68629 0,6
              V 28
              C 0,31.3137 2.68629,34 6,34
              H 11.6184
              L 15.6716,38.644
              C 15.7759,38.756 15.9036,38.8456 16.0463,38.907
              C 16.1891,38.9683 16.3436,39 16.5,39
              C 16.6563,39 16.8109,38.9683 16.9537,38.907
              C 17.0964,38.8456 17.2241,38.756 17.3284,38.644
              L 21.3816,34
              H 28
              C 31.3137,34 34,31.3137 34,28
              V 6
              C 34,2.68629 31.3137,0 28,0
              H 6
              Z
          " fill="white" />
          <path d="
              M 13.1252,33.0831
              C 12.7454,32.6423 12.196,32.3893 11.6184,32.3893
              H 6
              C 3.79086,32.3893 2,30.5752 2,28.3374
              V 6.05191
              C 2,3.8141 3.79086,2 6,2
              H 28
              C 30.2091,2 32,3.8141 32,6.05191
              V 28.3374
              C 32,30.5752 30.2091,32.3893 28,32.3893
              H 21.3816
              C 20.804,32.3893 20.2546,32.6423 19.8748,33.0831
              L 16.5,37
              L 13.1252,33.0831
              Z
          " fill="${color}" />
          </svg>
          <div style="position: absolute; top: 5px; left: 5px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; z-index: 2;">
          ${icon}
          </div>
      </div>
      `,
      className: "",
      iconSize: [34, 39],
      iconAnchor: [17, 39]
  });
};

const createInfrastructureLandmarkMarker = (icon: string, color: string) => {
  return L.divIcon({
      html: `
      <div style="position: relative; width: 34px; height: 34px;">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 34C26.3888 34 34 26.3888 34 17C34 7.61116 26.3888 0 17 0C7.61116 0 0 7.61116 0 17C0 26.3888 7.61116 34 17 34Z" fill="white" />
              <path d="M17 32C25.2843 32 32 25.2843 32 17C32 8.71573 25.2843 2 17 2C8.71573 2 2 8.71573 2 17C2 25.2843 8.71573 32 17 32Z" fill="${color}" />
          </svg>
          <div style="position: absolute; top: 5px; left: 5px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; z-index: 2;">
          ${icon}
          </div>
      </div>
      `,
      className: "",
      iconSize: [34, 34],
      iconAnchor: [17, 17]
  });
};

const createFocalPointHighlightMarker = () => {
  return L.divIcon({
    html: `
      <div style="position: relative; width: 50px; height: 50px;">
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Pulsing outer circle -->
          <circle cx="25" cy="25" r="25" fill="#FFFFFF" opacity="0.3">
            <animate attributeName="r" values="20;25;20" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <!-- Inner circle -->
          <circle cx="25" cy="25" r="15" fill="#FFFFFF" opacity="0.5" />
          <!-- Center dot -->
          <circle cx="25" cy="25" r="8" fill="#FFFFFF" />
        </svg>
      </div>
    `,
    className: "",
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });
};