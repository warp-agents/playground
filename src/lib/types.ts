export interface Contract {
    id: number;
    name: string;
    country: string | string[];
    deadline: string;
    status?: string;
    agencies: {
      name: string;
      seal: string;
    }[];
}
  
export interface Chat {
    id: string;
    name: string;
    createdAt: string;
}

export interface EmbeddingData {
    url: string;
    alt?: string;
    caption?: string;
    embedding?: number[];
    similarity?: number;
    coords?: {
      lng: number;
      lat: number;
    };
}
  
export interface TileData extends EmbeddingData {
    x: number;
    y: number;
    zoom: number;
    center: { lat: number; lng: number };
    bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
}

export interface Polygon {
    type: "Polygon";
    coordinates: number[][][];
}

export interface ChatInterfaceData {
  id: string;
  name: string;
  createdAt: string;
}

export interface FilterState {
    jurisdiction: {
      federal: boolean;
      stateLocal: boolean;
      international: boolean;
      selectedStates: Set<string>;
      selectedCountries: Set<string>;
      selectedRegions: Set<string>;
    };
    contractTypes: {
      government: boolean;
      commercial: boolean;
      selectedIndustries: Set<string>;
    };
    setAsides: {
      smallBusiness: boolean;
      sdvosb: boolean;
      wosb: boolean;
      hubZone: boolean;
      eight_a: boolean;
    };
    approvedSites: {
      government: {
        sam: boolean;
        dla: boolean;
        fed_connect: boolean;
        unison_marketplace: boolean;
        [key: string]: boolean;
      },
      commercial: {
        [key: string]: boolean;
      }
    };
    opportunityTypes: Set<string>;
}
  
export interface Tag {
    id: string;
    text: string;
    excluded: boolean;
}

export interface ContractTypeSectionProps {
  contractTypes: {
    government: boolean;
    commercial: boolean;
    selectedIndustries: Set<string>;
  };
  jurisdiction: {
    federal: boolean;
    stateLocal: boolean;
    international: boolean;
    selectedStates: Set<string>;
    selectedCountries: Set<string>;
    selectedRegions: Set<string>;
  };
  setAsides: {
    smallBusiness: boolean;
    sdvosb: boolean;
    wosb: boolean;
    hubZone: boolean;
    eight_a: boolean;
  };
  approvedSites: {
    government: {
      sam: boolean;
      dla: boolean;
      fed_connect: boolean;
      unison_marketplace: boolean;
      [key: string]: boolean;
    },
    commercial: {
      [key: string]: boolean;
    }
  };
  opportunityTypes: Set<string>;
  onContractTypeChange: (key: keyof FilterState['contractTypes'], value: boolean | Set<string>) => void;
  onIndustryChange: (industry: string, checked: boolean) => void;
  onJurisdictionChange: (key: keyof FilterState['jurisdiction'], value: boolean | Set<string>) => void;
  onStateChange: (state: string, checked: boolean) => void;
  onCountryChange: (country: string, checked: boolean) => void;
  onRegionChange: (region: string, checked: boolean) => void;
  onSetAsideChange: (key: keyof FilterState['setAsides'], value: boolean) => void;
  onOpportunityTypeChange: (type: string, checked: boolean) => void;
  onApprovedSiteChange: (key: string, value: boolean, context: "government" | "commercial") => void;
}

export interface IndustrySelectorProps {
  selectedIndustries: Set<string>;
  onIndustryChange: (industry: string, checked: boolean) => void;
}

export interface JurisdictionSectionProps {
  jurisdiction: {
    federal: boolean;
    stateLocal: boolean;
    international: boolean;
    selectedStates: Set<string>;
    selectedCountries: Set<string>;
    selectedRegions: Set<string>;
  };
  setAsides: {
    smallBusiness: boolean;
    sdvosb: boolean;
    wosb: boolean;
    hubZone: boolean;
    eight_a: boolean;
  };
  opportunityTypes: Set<string>;
  onJurisdictionChange: (key: keyof FilterState['jurisdiction'], value: boolean | Set<string>) => void;
  onStateChange: (state: string, checked: boolean) => void;
  onCountryChange: (country: string, checked: boolean) => void;
  onRegionChange: (region: string, checked: boolean) => void;
  onSetAsideChange: (key: keyof FilterState['setAsides'], value: boolean) => void;
  onOpportunityTypeChange: (type: string, checked: boolean) => void;
}

export interface RegionSelectorProps {
  selectedRegions: Set<string>;
  onRegionChange: (region: string, checked: boolean) => void;
}

export interface CountrySelectorProps {
  selectedCountries: Set<string>;
  onCountryChange: (country: string, checked: boolean) => void;
  onSelectAllCountries: (checked: boolean) => void;
}

export interface CountryCheckboxProps {
    country: string;
    checked: boolean;
    onChange: (country: string, checked: boolean) => void;
}

export interface StateSelectorProps {
  selectedStates: Set<string>;
  onStateChange: (state: string, checked: boolean) => void;
  onSelectAllStates: (checked: boolean) => void;
}

export interface FederalFilterProps {
  setAsides: {
    smallBusiness: boolean;
    sdvosb: boolean;
    wosb: boolean;
    hubZone: boolean;
    eight_a: boolean;
  };
  opportunityTypes: Set<string>;
  onSetAsideChange: (key: keyof FilterState['setAsides'], value: boolean) => void;
  onOpportunityTypeChange: (type: string, checked: boolean) => void;
}

export interface ApprovedSitesSectionProps {
  approvedSites: {
    government: {
      sam: boolean;
      dla: boolean;
      fed_connect: boolean;
      unison_marketplace: boolean;
      [key: string]: boolean;
    },
    commercial: {
      [key: string]: boolean;
    }
  };
  onApprovedSiteChange: (key: string, value: boolean, context: "government" | "commercial") => void;
  context: "government" | "commercial";
}

export interface AdvancedSettings {
    model: string;
    agents: string[];
    systemPrompt: string;
    temperature: number;
    documents: string[];
    maxTokens: number;
}

export interface ObjectDetectionBBoxLayerProps {
    isSatelliteMode: boolean;
    baseLayers: Record<string, React.MutableRefObject<L.TileLayer | L.TileLayer.WMS | null>>;
    modelPath?: string;
}

export interface ActionHandlerProps {
  coordinates?: {
    lat: number;
    lng: number;
  };
  mode?: 'polygon' | 'rectangle';
  query?: string;
  radius?: number;
  satellite?: boolean;
}

export type ExpandedViewType = 'document' | 'spreadsheet' | 'map';