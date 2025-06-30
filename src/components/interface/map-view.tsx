"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TextShimmer } from '@/components/core/text-shimmer';
import { Input } from "@/components/ui/input";
import { 
    X,
    Activity, 
    Building2, 
    Trophy, 
    Newspaper, 
    AlignCenterVertical as Certificate, 
    Send, 
    ChevronDown, 
    ChevronUp,
    Search, 
} from "lucide-react";
import Icon from '@mdi/react';
import { mdiDumpTruck, mdiHomeSilo, mdiPierCrane } from '@mdi/js';
import { CgArrowsExpandDownRight } from "react-icons/cg";
import { IoIosMore } from "react-icons/io";
import { TbObjectScan, TbPin, TbRuler2, TbArrowsMove, TbTrash, TbMap } from "react-icons/tb";
import { TfiHandDrag } from "react-icons/tfi";
import { FaOilWell, FaBuilding, FaRegStar, FaTents, FaRegHand } from "react-icons/fa6";
import { BsBoundingBoxCircles } from "react-icons/bs";
import { FaStar, FaStarHalfAlt } from "react-icons/fa";
import { MdWindPower, MdWarehouse } from "react-icons/md";
import { BiWater, BiSolidFactory, BiSolidPlaneAlt } from "react-icons/bi";
import { RiShipFill } from "react-icons/ri";
import { PiLineSegment, PiPolygon, PiTruckTrailerFill } from "react-icons/pi";
import { HiBuildingStorefront } from "react-icons/hi2"; 
import { CgOrganisation } from "react-icons/cg";
import { useMapControlsContext } from "@/contexts/MapContext"
import { useTheme } from "next-themes";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatUrl } from "@/lib/utils"
import { Loader2 } from "lucide-react";
import { Separator } from "@radix-ui/react-separator";
import dynamic from "next/dynamic";

interface LandmarkData {
  id: string;
  type: string;
  name: string;
  position: { lat: number; lng: number };
  company: {
    name: string;
    founded: string;
    employees: number;
    revenue: string;
    marketCap: string;
    keyProducts: string[];
    warpScore: number;
    recentNews: {
      title: string;
      source: {
        name: string;
        url: string;
      };
    }[];
  };
}

type Route = {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
};

const Map = dynamic(() => import('./map'), {
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
  ssr: false
})

export default function MapView() {
  const { actionHandler, setActionHandler } = useGlobalContext()
  const { theme } = useTheme();
  const { activeMode, setActiveMode, setIsClearingAll } = useMapControlsContext();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchToggle, setSearchToggle] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [isSatelliteMode, setIsSatelliteMode] = useState(false);
  const [geoJsonKey, setGeoJsonKey] = useState(0);
  const [radius, setRadius] = useState<number | null>(null);
  const defaultPosition = { lat: 35.5494, lng: 139.7798 } //{ lat: 31.2304, lng: 121.4910 } //{ lat: 30.70500, lng: 32.34417 } //{ lat: 47.633301,  lng: -122.379654 } //{ lat: 40.34611, lng: -107.06056 } //{ lat: 51.505, lng: -0.09 };
  const [focalPoint, setFocalPoint] = useState(defaultPosition);
  const [routes, setRoutes] = useState< Route[]| null>(
    [
      { origin: { lat: 51.501, lng: -0.071 }, destination: { lat: 51.505, lng: -0.09 } },
      { origin: { lat: 51.5092, lng: -0.0837 }, destination: { lat: 51.505, lng: -0.09 } },
    ]
  );
  const [connections, setConnections] = useState< Route[]| null>(
    [
      { origin: { lat: 51.5092, lng: -0.0837 }, destination: { lat: 51.506, lng: -0.092 } },
      { origin: { lat: 51.5092, lng: -0.0837 }, destination: { lat: 51.5165, lng: -0.0702 } }, 
      { origin: { lat: 51.5092, lng: -0.0837 }, destination: { lat: 51.501, lng: -0.071 } }, 
      { origin: { lat: 51.5092, lng: -0.0837 }, destination: { lat: 51.502, lng: -0.085 } }, 
      { origin: { lat: 51.5092, lng: -0.0837 }, destination: { lat: 51.5065, lng: -0.093 } }, 
      { origin: { lat: 51.5092, lng: -0.0837 }, destination: { lat: 51.515, lng: -0.0998 } }, 
      { origin: { lat: 51.5092, lng: -0.0837 }, destination: { lat: 51.5005, lng: -0.1025 } } 
    ]
  );
  const [isLocating, setIsLocating] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkData | null>(null);
  const [landmarks, setLandmarks] = useState<LandmarkData[]>([
    {
      id: "wp1",
      type: "renewable",
      name: "EcoWind Solutions",
      position: { lat: 51.508, lng: -0.087 },
      company: {
        name: "EcoWind Solutions Ltd",
        founded: "2015",
        employees: 450,
        revenue: "$890M",
        marketCap: "$2.3B",
        keyProducts: [
          "Offshore Wind Generation",
          "Smart Grid Solutions",
          "Energy Storage Systems",
          "Wind Farm Management Software",
          "Predictive Maintenance AI",
          "Grid Integration Systems",
          "Power Quality Solutions"
        ],
        warpScore: 4,
        recentNews: [
          { title: "Achieved 1GW total capacity milestone", source: { name: "Bloomberg", url: "bloomberg.com" } },
          { title: "Launched new AI-powered turbine optimization", source: { name: "TechCrunch", url: "techcrunch.com" } },
          { title: "Secured $500M green energy contract", source: { name: "Reuters", url: "reuters.com" } },
          { title: "Partnership with leading tech firms announced", source: { name: "CNBC", url: "cnbc.com" } },
          { title: "New R&D center opening in Singapore", source: { name: "The Straits Times", url: "straitstimes.com" } },
          { title: "Quarterly earnings exceed expectations", source: { name: "Financial Times", url: "ft.com" } }
        ]
      }
    },
    {
      id: "ec1",
      type: "nonrenewable",
      name: "FutureGen Energy",
      position: { lat: 51.504, lng: -0.095 },
      company: {
        name: "FutureGen Energy Corp",
        founded: "1998",
        employees: 2800,
        revenue: "$3.2B",
        marketCap: "$8.5B",
        keyProducts: [
          "Clean Energy Solutions",
          "Hydrogen Production",
          "Carbon Capture",
          "Renewable Integration",
          "Energy Trading Platform",
          "Grid Management Solutions"
        ],
        warpScore: 4.5,
        recentNews: [
          { title: "Breakthrough in hydrogen storage efficiency", source: { name: "Forbes", url: "forbes.com" } },
          { title: "Partnership with tech giants for grid modernization", source: { name: "Wired", url: "wired.com" } },
          { title: "Expanded renewable portfolio by 40%", source: { name: "Bloomberg", url: "bloomberg.com" } }
        ]
      }
    },
    {
      id: "wp2",
      type: "waterPlant",
      name: "AquaPure Technologies",
      position: { lat: 51.507, lng: -0.1 },
      company: {
        name: "AquaPure Technologies Inc",
        founded: "2008",
        employees: 1200,
        revenue: "$650M",
        marketCap: "$1.8B",
        keyProducts: [
          "Smart Water Treatment",
          "Desalination Solutions",
          "Water Recycling Systems",
          "IoT Water Monitoring",
          "Advanced Filtration Tech",
          "Water Quality Analytics"
        ],
        warpScore: 2.5,
        recentNews: [
          { title: "Innovative membrane technology patent", source: { name: "TechCrunch", url: "techcrunch.com" } },
          { title: "Expanded operations to 3 new countries", source: { name: "Reuters", url: "reuters.com" } },
          { title: "Award for water conservation excellence", source: { name: "WaterTech Today", url: "watertechtoday.com" } }
        ]
      }
    },
    {
      id: "d1",
      type: "distributor",
      name: "GreenFlow Distributors",
      position: { lat: 51.502, lng: -0.085 },
      company: {
        name: "GreenFlow Logistics Ltd",
        founded: "2010",
        employees: 300,
        revenue: "$120M",
        marketCap: "$500M",
        keyProducts: [
          "Energy Equipment Distribution",
          "Smart Delivery Routing",
          "Sustainable Packaging",
          "Real-Time Tracking Systems"
        ],
        warpScore: 5,
        recentNews: [
          { title: "New EV fleet integration", source: { name: "Logistics Today", url: "logisticstoday.com" } },
          { title: "Opened new green warehouse", source: { name: "Business Green", url: "businessgreen.com" } }
        ]
      }
    },
    {
      id: "s1",
      type: "supplier",
      name: "TerraSource Suppliers",
      position: { lat: 51.506, lng: -0.092 },
      company: {
        name: "TerraSource Global",
        founded: "2003",
        employees: 750,
        revenue: "$300M",
        marketCap: "$900M",
        keyProducts: [
          "Sustainable Raw Materials",
          "Eco-Friendly Components",
          "Supply Chain Optimization",
          "Vendor Risk Solutions"
        ],
        warpScore: 4.5,
        recentNews: [
          { title: "Partnership with renewable factories", source: { name: "GreenBiz", url: "greenbiz.com" } }
        ]
      }
    },
    {
      id: "m1",
      type: "manufacturer",
      name: "VoltCraft Manufacturing",
      position: { lat: 51.509, lng: -0.089 },
      company: {
        name: "VoltCraft Industries",
        founded: "1992",
        employees: 4000,
        revenue: "$5B",
        marketCap: "$12B",
        keyProducts: [
          "Turbine Parts",
          "Energy Conversion Hardware",
          "Industrial Automation Systems"
        ],
        warpScore: 4,
        recentNews: [
          { title: "Opened smart factory in Berlin", source: { name: "Manufacturing Weekly", url: "mfgweekly.com" } }
        ]
      }
    },
    {
      id: "a1",
      type: "airport",
      name: "EcoFly Airport",
      position: { lat: 51.500, lng: -0.094 },
      company: {
        name: "EcoFly Transport Authority",
        founded: "1985",
        employees: 6200,
        revenue: "$7.1B",
        marketCap: "$20B",
        keyProducts: ["Passenger Transit", "Cargo Logistics", "Airport Operations"],
        warpScore: 4.5,
        recentNews: [
          { title: "Became first carbon neutral airport in Europe", source: { name: "Airport World", url: "airport-world.com" } }
        ]
      }
    },
    {
      id: "sp1",
      type: "port",
      name: "Port of Seattle",
      position: { lat: 47.633301,  lng: -122.379654 } ,
      company: {
        name: "Seattle Port Authority",
        founded: "1970",
        employees: 3100,
        revenue: "$2.4B",
        marketCap: "$5.6B",
        keyProducts: [
          "Container Logistics",
          "Energy Export Terminals",
          "Smart Port Infrastructure"
        ],
        warpScore: 4,
        recentNews: [
          { title: "Introduced smart shipping lanes", source: { name: "Port News", url: "portnews.com" } }
        ]
      }
    },
    {
      id: "t1",
      type: "trucking",
      name: "GreenHaul Logistics",
      position: { lat: 51.501, lng: -0.088 },
      company: {
        name: "GreenHaul Freight Ltd",
        founded: "2001",
        employees: 900,
        revenue: "$350M",
        marketCap: "$1.1B",
        keyProducts: [
          "Last-Mile Delivery",
          "Heavy Goods EV Trucks",
          "Route Optimization Software"
        ],
        warpScore: 5,
        recentNews: [
          { title: "100% transition to electric fleet", source: { name: "Freight Journal", url: "freightjournal.com" } }
        ]
      }
    },  
    {
      id: "ec2",
      type: "nonrenewable",
      name: "NovaGrid Energy",
      position: { lat: 51.5075, lng: -0.097 },
      company: {
        name: "NovaGrid Energy Ltd",
        founded: "2005",
        employees: 1600,
        revenue: "$1.6B",
        marketCap: "$4.2B",
        keyProducts: [
          "Smart Grid Solutions",
          "Battery Storage Systems",
          "Renewable Energy Forecasting",
          "Energy Management Software"
        ],
        warpScore: 1.5,
        recentNews: [
          { title: "Deployed 50MW battery farm", source: { name: "Greentech Media", url: "greentechmedia.com" } },
          { title: "AI-based energy forecasting tool launch", source: { name: "TechRadar", url: "techradar.com" } }
        ]
      }
    },
    {
      id: "wp3",
      type: "waterPlant",
      name: "PureFlow Water Systems",
      position: { lat: 51.5045, lng: -0.084 },
      company: {
        name: "PureFlow Systems Inc",
        founded: "2012",
        employees: 850,
        revenue: "$420M",
        marketCap: "$1.1B",
        keyProducts: [
          "Compact Water Treatment Units",
          "Portable Desalination",
          "Urban Water Recycling",
          "Water Sensor Networks"
        ],
        warpScore: 4.5,
        recentNews: [
          { title: "Introduced solar-powered filtration units", source: { name: "CleanTech News", url: "cleantechnews.com" } }
        ]
      }
    },
    {
      id: "d2",
      type: "distributor",
      name: "EcoNet Distribution",
      position: { lat: 51.5065, lng: -0.093 },
      company: {
        name: "EcoNet Supply Chain Ltd",
        founded: "2006",
        employees: 420,
        revenue: "$150M",
        marketCap: "$600M",
        keyProducts: [
          "Energy Equipment Logistics",
          "Automated Inventory Management",
          "Green Delivery Scheduling"
        ],
        warpScore: 4,
        recentNews: [
          { title: "Expanded fleet with electric vans", source: { name: "Fleet Manager", url: "fleetmanager.com" } }
        ]
      }
    },
    {
      id: "pp2",
      type: "renewable",
      name: "SolarNova Plant",
      position: { lat: 51.5035, lng: -0.091 },
      company: {
        name: "SolarNova Power Ltd",
        founded: "2011",
        employees: 980,
        revenue: "$780M",
        marketCap: "$2.1B",
        keyProducts: [
          "Photovoltaic Panels",
          "Solar Tracking Systems",
          "Hybrid Solar Grids",
          "Solar Plant Monitoring"
        ],
        warpScore: 3,
        recentNews: [
          { title: "Completed solar farm in Spain", source: { name: "Renewables Now", url: "renewablesnow.com" } }
        ]
      }
    },
    {
      id: "m2",
      type: "manufacturer",
      name: "BrightForge Energy Components",
      position: { lat: 51.5085, lng: -0.086 },
      company: {
        name: "BrightForge Ltd",
        founded: "1995",
        employees: 2100,
        revenue: "$2.3B",
        marketCap: "$6.7B",
        keyProducts: [
          "High-Efficiency Turbines",
          "Control Panels",
          "Renewable Assembly Units"
        ],
        warpScore: 4,
        recentNews: [
          { title: "Announced closed-loop component recycling", source: { name: "Engineering Today", url: "engineeringtoday.com" } }
        ]
      }
    },
    {
      id: "t2",
      type: "trucking",
      name: "EcoRoad Transport",
      position: { lat: 51.5025, lng: -0.089 },
      company: {
        name: "EcoRoad Logistics Ltd",
        founded: "2000",
        employees: 650,
        revenue: "$280M",
        marketCap: "$820M",
        keyProducts: [
          "Zero-Emission Freight",
          "Hybrid Long-Haul Vehicles",
          "Optimized Logistics Software"
        ],
        warpScore: 4,
        recentNews: [
          { title: "Launched electric truck route to major hubs", source: { name: "Transport Weekly", url: "transportweekly.com" } }
        ]
      }
    },
    {
      id: "c1",
      type: "company",
      name: "HelioCore Solutions",
      position: { lat: 51.5028, lng: -0.1 },
      company: {
        name: "HelioCore Group",
        founded: "1990",
        employees: 5000,
        revenue: "$6B",
        marketCap: "$15B",
        keyProducts: [
          "Energy Software Platforms",
          "Smart Metering Infrastructure",
          "AI Grid Optimization"
        ],
        warpScore: 4,
        recentNews: [
          { title: "Recognized in Global ESG Index", source: { name: "Sustainable Investor", url: "sustainableinvestor.com" } }
        ]
      }
    },
    {
      id: "c2",
      type: "company",
      name: "BlueNova Corp",
      position: { lat: 51.5001, lng: -0.08 },
      company: {
        name: "BlueNova Corporation",
        founded: "1988",
        employees: 7200,
        revenue: "$8.9B",
        marketCap: "$22B",
        keyProducts: [
          "Grid Infrastructure",
          "Renewable Power Systems",
          "Smart City Solutions"
        ],
        warpScore: 2,
        recentNews: [
          { title: "Won contract for Smart City London project", source: { name: "CityTech News", url: "citytechnews.com" } }
        ]
      }
    },
    {
      id: "m3",
      type: "manufacturer",
      name: "CoreVolt Dynamics",
      position: { lat: 51.5092, lng: -0.0837 },
      company: {
        name: "CoreVolt Dynamics Ltd",
        founded: "2007",
        employees: 3200,
        revenue: "$4.1B",
        marketCap: "$9.7B",
        keyProducts: [
          "Advanced Power Modules",
          "Turbine Control Units",
          "Modular Battery Systems",
          "Industrial Grade Inverters"
        ],
        warpScore: 4.2,
        recentNews: [
          { title: "Breakthrough in thermal energy regulation", source: { name: "Energy Today", url: "energytoday.com" } },
          { title: "Opened R&D lab in Amsterdam", source: { name: "TechEurope", url: "techeurope.com" } }
        ]
      }
    },
    {
      id: "s2",
      type: "supplier",
      name: "Elementra Supplies",
      position: { lat: 51.5165, lng: -0.0702 }, 
      company: {
        name: "Elementra Global",
        founded: "2012",
        employees: 670,
        revenue: "$240M",
        marketCap: "$780M",
        keyProducts: [
          "Energy Grade Alloys",
          "Precision Machined Parts",
          "Component Logistics"
        ],
        warpScore: 4,
        recentNews: [
          { title: "Signed exclusive supply deal with CoreVolt", source: { name: "Business Wire", url: "businesswire.com" } }
        ]
      }
    },
    {
      id: "d3",
      type: "distributor",
      name: "FluxNet Distribution",
      position: { lat: 51.515, lng: -0.0998 },
      company: {
        name: "FluxNet Distribution Ltd",
        founded: "2010",
        employees: 390,
        revenue: "$180M",
        marketCap: "$490M",
        keyProducts: [
          "Energy System Components",
          "Smart Inventory Routing",
          "Just-In-Time Logistics"
        ],
        warpScore: 4.3,
        recentNews: [
          { title: "Deployed AI-based logistics optimization", source: { name: "SupplyChain Weekly", url: "scweekly.com" } }
        ]
      }
    },
    {
      id: "s3",
      type: "supplier",
      name: "VerdiSource Materials",
      position: { lat: 51.501, lng: -0.071 }, 
      company: {
        name: "VerdiSource Ltd",
        founded: "2004",
        employees: 840,
        revenue: "$310M",
        marketCap: "$920M",
        keyProducts: [
          "Eco-Sourced Metals",
          "Engineered Plastics",
          "Sustainable Fabrication Kits"
        ],
        warpScore: 3.8,
        recentNews: [
          { title: "Won green supplier award in UK", source: { name: "EcoTech News", url: "ecotechnews.com" } }
        ]
      }
    },
    {
      id: "d4",
      type: "distributor",
      name: "GridPulse Logistics",
      position: { lat: 51.5005, lng: -0.1025 }, 
      company: {
        name: "GridPulse Ltd",
        founded: "2015",
        employees: 270,
        revenue: "$90M",
        marketCap: "$300M",
        keyProducts: [
          "Smart Grid Parts Distribution",
          "Warehouse Robotics",
          "Dynamic Delivery Scheduling"
        ],
        warpScore: 4.7,
        recentNews: [
          { title: "Integrated blockchain for parts tracking", source: { name: "LogiTech News", url: "logitechnews.com" } }
        ]
      }
    },
    {
      id: "m4",
      type: "mining",
      name: "DeepEarth Extracts",
      position: { lat: 51.5105, lng: -0.10835 },
      company: {
        name: "DeepEarth Extracts PLC",
        founded: "1998",
        employees: 5800,
        revenue: "$6.7B",
        marketCap: "$12.3B",
        keyProducts: [
          "Rare Earth Metals",
          "Lithium Concentrates",
          "Nickel Ores"
        ],
        warpScore: 4.0,
        recentNews: [
          { title: "Secured drilling rights in the North Sea", source: { name: "Mining Journal", url: "miningjournal.com" } }
        ]
      }
    },
    {
      id: "m5",
      type: "mining",
      name: "IronCrest Resources",
      position: { lat: 51.5111, lng: -0.0742 },
      company: {
        name: "IronCrest Resources Ltd",
        founded: "2003",
        employees: 4100,
        revenue: "$3.5B",
        marketCap: "$8.0B",
        keyProducts: [
          "Hematite",
          "Magnetite",
          "Iron Pellets"
        ],
        warpScore: 3.8,
        recentNews: [
          { title: "Expanded operations in Western Australia", source: { name: "Resource Weekly", url: "resourceweekly.com" } }
        ]
      }
    },
    {
      id: "m6",
      type: "mining",
      name: "Aether Mining Consortium",
      position: { lat: 40.34611, lng: -107.06056 },
      company: {
        name: "Aether Mining Consortium",
        founded: "2012",
        employees: 2900,
        revenue: "$2.9B",
        marketCap: "$6.2B",
        keyProducts: [
          "Platinum Group Metals",
          "Synthetic Quartz",
          "Cobalt Alloys"
        ],
        warpScore: 4.4,
        recentNews: [
          { title: "Pioneering AI-driven mineral detection", source: { name: "TechMining Daily", url: "techminingdaily.com" } }
        ]
      }
    }    
  ]);

  const handleLandmarkClick = (landmark: LandmarkData) => {
    setSelectedLandmark(landmark);
  };

  const handleCloseInfo = () => {
    setSelectedLandmark(null);
  };

  useEffect(() => {
    console.log(actionHandler)
    if(!actionHandler) return
    if(actionHandler?.satellite){
      setIsSatelliteMode(actionHandler?.satellite)
    }
    if(actionHandler?.coordinates){
      const { lat, lng } = actionHandler?.coordinates
      setFocalPoint({ lat, lng })
    }
    if(actionHandler?.radius){
      setRadius(actionHandler?.radius)
    }
  }, [actionHandler])

  useEffect(() => {
    const handleSearch = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();

        if (data && Array.isArray(data) && data.length > 0 && data[0].boundingbox) {
          const geoJsonResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&polygon_geojson=1&format=json`
          );
          const geoJsonData = await geoJsonResponse.json();

          if (geoJsonData && Array.isArray(geoJsonData) && geoJsonData[0] && geoJsonData[0].geojson) {
            setSelectedRegion(geoJsonData[0].geojson);
            setGeoJsonKey(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error("Error searching region:", error);
      }
    };

    handleSearch();
  }, [searchToggle])

  useEffect(() => {
  },[selectedLandmark])
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-screen relative">
      <Map 
        focalPoint={focalPoint}
        routes={routes}
        connections={connections}
        landmarks={landmarks}
        isSatelliteMode={isSatelliteMode}
        onLandmarkClick={handleLandmarkClick}
        circleRadius={radius && radius * 1609.344}
        selectedRegion={selectedRegion}
        geoJsonKey={geoJsonKey}
      />  
      <div className="flex flex-col gap-2 absolute top-4 left-4 z-[10] w-[380px] max-w-[calc(100%-2rem)]">
      
      {selectedLandmark && (
        <LandmarkInfoCard 
          landmark={selectedLandmark}
          onClose={handleCloseInfo}
        />
      )}
      </div>
      <div className="flex flex-col absolute gap-1 top-4 right-4 z-[10] w-[380px] max-w-[calc(100%-2rem)]">
        <div className="flex relative">
          <Input
            type="text"
            placeholder="Search region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background rounded-r-none"
            onKeyDown={(e) => e.key === "Enter" && setSearchToggle(!searchToggle)}
          />
          {searchQuery && <Button onClick={() => setSearchQuery("")} size="icon" variant="ghost" className="h-6 w-6 rounded-full absolute top-1/2 -translate-y-1/2 right-[45px]"> 
            <X className="h-4 w-4" />
          </Button>}
          <Button onClick={() => setSearchToggle(!searchToggle)} size="icon" variant="secondary" className="h-10 w-12 rounded-l-none hover:bg-sidebar"> 
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          <div className="flex">
            <Button size="icon" variant="secondary" 
            className={cn("hover:bg-sidebar disabled:sidebar/80 rounded-none border border-border border-r-0", activeMode === "move" && "bg-sidebar")} 
            onClick={() => setActiveMode("move")}>
              <TbArrowsMove className="h-4 w-4" />
            </Button>
            <Button 
            disabled
            size="icon" variant="secondary" 
            className={cn("hover:bg-sidebar disabled:sidebar/80 rounded-none border border-border border-r-0", activeMode === "pin" && "bg-sidebar")} 
            onClick={() => setActiveMode("pin")}> 
              <TbPin className="h-4 w-4" />
            </Button>
            <Button 
            disabled
            size="icon" variant="secondary" 
            className={cn("hover:bg-sidebar disabled:sidebar/80 rounded-none border border-border border-r-0", activeMode === "line" && "bg-sidebar")}
            onClick={() => setActiveMode("line")}
            > 
              <PiLineSegment className="h-4 w-4" />
            </Button>
            {isSatelliteMode &&
            <>
            <Button 
            size="icon" variant="secondary" 
            className={cn("hover:bg-sidebar disabled:sidebar/80 rounded-none border border-border border-r-0", activeMode === "rectangle" && "bg-sidebar")}
            onClick={() => {setActiveMode("rectangle")}}
            > 
              <BsBoundingBoxCircles className="h-4 w-4" />
            </Button>
            <Button 
            size="icon" variant="secondary" 
            className={cn("hover:bg-sidebar disabled:sidebar/80 rounded-none border border-border", activeMode === "polygon" && "bg-sidebar")}
            onClick={() => {setActiveMode("polygon")}}
            > 
              <PiPolygon className="h-4 w-4" />
            </Button>
            </>}
          </div>
          {isSatelliteMode && <div className="flex">
            <Button 
            size="icon" variant="secondary" 
            className={cn("hover:bg-sidebar disabled:sidebar/80 border border-border rounded-none", activeMode === "detect" && "bg-sidebar")}
            onClick={() => setActiveMode("detect")}> 
              <TbObjectScan className="h-4 w-4" />
            </Button>
          </div>}
          <div className="flex">
            <Button disabled size="icon" variant="secondary"
             className={cn("hover:bg-sidebar disabled:sidebar/80 border border-border rounded-none", activeMode === "measure" && "bg-sidebar")}
             onClick={() => setActiveMode("measure")}> 
              <TbRuler2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex">
            <Button size="icon" variant="secondary"
             className={cn("hover:bg-sidebar disabled:sidebar/80 border border-border rounded-none", activeMode === "measure" && "bg-sidebar", isSatelliteMode && "text-muted-foreground")}
             onClick={() => setIsSatelliteMode(!isSatelliteMode)}> 
              <TbMap className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex">
            <Button size="icon" variant="secondary"
             className={cn("hover:bg-sidebar disabled:sidebar/80 border border-border rounded-none", activeMode === "measure" && "bg-sidebar")}
             onClick={() => setIsClearingAll(true)}> 
              <TbTrash className="h-4 w-4" />
            </Button>
          </div>
          {/* */}
        </div>
      </div>
    </div>
  );
}

interface LandmarkInfoCardProps {
    landmark: {
        id: string;
        type: string;
        name: string;
        company: {
        name: string;
        founded: string;
        employees: number;
        revenue: string;
        marketCap: string;
        keyProducts: string[];
        warpScore: number;
        recentNews: {
            title: string;
            source: {
                name: string;
                url: string;
            };
        }[];
        };
    };
    onClose: () => void;
}

const getIcon = (type: string) => {
  const icons = {
      renewable: MdWindPower,
      nonrenewable: FaOilWell,
      waterPlant: BiWater,
      distributor: MdWarehouse,
      supplier: MdWarehouse,
      manufacturer: BiSolidFactory,
      airport: BiSolidPlaneAlt,
      trucking: PiTruckTrailerFill,
      company: CgOrganisation,
      base: FaTents,
  };
  return icons[type as keyof typeof icons] || CgOrganisation;
};

const getIconColor = (type: string) => {
  const colors = {
    renewable: "text-[#16A34A]",
    nonrenewable: "text-[#D97706]",
    waterPlant: "text-[#1D4ED8]",
    distributor: "text-[#4C1D95]",
    supplier: "text-[#059669]",
    manufacturer: "text-[#BE185D]",
    airport: "text-[#0D9488]",
    port: "text-[#0891B2]",
    trucking: "text-[#C2410C]",
    company: "text-[#4C1D95]",
    mining: "text-[#A16207]",
    base: "text-[#14532D]",
    farmland: "text-[#78350F]",
};
return colors[type as keyof typeof colors] || "#475569";
};

const StarRating = ({ rating }: { rating: number }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<FaStar key={i} className="text-primary w-4 h-4" />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<FaStarHalfAlt key={i} className="text-primary w-4 h-4" />);
    } else {
      stars.push(<FaRegStar key={i} className="text-primary w-4 h-4" />);
    }
  }

  return (<div className="flex gap-0.5">{stars}</div>);
};
  
export function LandmarkInfoCard({ landmark, onClose }: LandmarkInfoCardProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'news'>('overview');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showAllProducts, setShowAllProducts] = useState(false);
    const [showAllNews, setShowAllNews] = useState(false);
    const I = getIcon(landmark.type);

    const displayedProducts = showAllProducts
      ? landmark.company.keyProducts 
      : landmark.company.keyProducts.slice(0, 5);
  
    const displayedNews = showAllNews
      ? landmark.company.recentNews
      : landmark.company.recentNews.slice(0, 5);
    
    return (
      <div className="w-full">
        <Card className="bg-card">
          <div className="p-1 border-b border-input w-full flex items-center justify-between">
            <div className="text-input text-sm ml-2 font-bold">Infrastructure</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {}}>
                <IoIosMore className="h-4 w-4"/>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4"/>
              </Button>
            </div>
          </div>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {landmark.type === "mining" ?
                <Icon path={mdiDumpTruck} className={cn("h-5 w-5", getIconColor(landmark.type))} /> :
                landmark.type === "farmland" ?
                <Icon path={mdiHomeSilo} className={cn("h-5 w-5", getIconColor(landmark.type))} /> :
                landmark.type === "port" ?
                <Icon path={mdiPierCrane} className={cn("h-5 w-5", getIconColor(landmark.type))} /> :
                <I className={cn("h-5 w-5", getIconColor(landmark.type))} />}
              {landmark?.company?.name || "N/A"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-4">
            <div className="flex gap-2">
              {(['overview', 'products', 'news'] as const).map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 capitalize"
                >
                  {tab}
                </Button>
              ))}
            </div>
  
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Founded</p>
                    <p className="text-sm font-medium">{landmark?.company?.founded || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Employees</p>
                    <p className="text-sm font-medium">{landmark?.company?.employees?.toLocaleString() || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-sm font-medium">{landmark?.company?.revenue || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Market Cap</p>
                    <p className="text-sm font-medium">{landmark?.company?.marketCap || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Warp Trust Score</span>
                    {landmark?.company?.warpScore &&
                    <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                       <StarRating rating={landmark?.company?.warpScore} />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{landmark?.company?.warpScore}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  }
                  </div>
                </div>
              </div>
            )}
  
            {activeTab === 'products' && (
              <div className="space-y-3">
                {displayedProducts.map((product, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-muted/50 space-y-1"
                  >
                    <h3 className="text-sm font-medium">{product}</h3>
                  </div>
                ))}
                {landmark.company.keyProducts.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowAllProducts(!showAllProducts)}
                  >
                    {showAllProducts ? (
                      <><ChevronUp className="h-4 w-4 mr-2" /> Show Less</>
                    ) : (
                      <><ChevronDown className="h-4 w-4 mr-2" /> Show More ({landmark.company.keyProducts.length - 5} items)</>
                    )}
                  </Button>
                )}
              </div>
            )}
  
            {activeTab === 'news' && (
              <div className="space-y-3">
                {displayedNews.map((news, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-muted/50 space-y-2"
                  >
                    <p className="text-sm">{news?.title || "N/A"}</p>
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${formatUrl(news?.source?.url)}&size=64` as string}
                        alt={news?.source?.name}
                        className="w-4 h-4"
                      />
                      <span className="text-xs text-muted-foreground">{news?.source?.name || "N/A"}</span>
                    </div>
                  </div>
                ))}
                {landmark.company.recentNews.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowAllNews(!showAllNews)}
                  >
                    {showAllNews ? (
                      <><ChevronUp className="h-4 w-4 mr-2" /> Show Less</>
                    ) : (
                      <><ChevronDown className="h-4 w-4 mr-2" /> Show More ({landmark.company.recentNews.length - 5} items)</>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }