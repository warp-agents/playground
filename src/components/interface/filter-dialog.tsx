"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { 
  Sparkles, 
  Sparkle, 
  Wand,
  Save,
  Check,
  Shapes,
  Plus,
  ChevronDown,
  ChevronRight,
  EllipsisVertical,
  DiamondPlus,
  Trash,
  DiamondMinus,
  Search,
} from "lucide-react"; 
import { LuFilter } from "react-icons/lu";
import { TbWand } from "react-icons/tb";
import { BiFilter } from "react-icons/bi";
import { Input } from "@/components/ui/input";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger } 
from "@/components/ui/dropdown-menu";
import { 
  AdvancedSettings, 
  FilterState, 
  Tag, 
  ContractTypeSectionProps, 
  IndustrySelectorProps, 
  JurisdictionSectionProps, 
  RegionSelectorProps, 
  CountrySelectorProps, 
  CountryCheckboxProps, 
  StateSelectorProps, 
  FederalFilterProps, 
  ApprovedSitesSectionProps 
} from "@/lib/types";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { GPTInputPopover } from "./gpt-input-popover";
import { cn } from "@/lib/utils";
import { set } from "react-hook-form";

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
  'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
  'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

export const EUROPEAN_COUNTRIES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 
  'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France',
  'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 
  'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
  'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia',
  'Spain', 'Sweden', 'United Kingdom', 'Norway', 'Switzerland'
];

export const ASIAN_COUNTRIES = [
  'Japan', 'China', 'South Korea', 'Singapore', 'Taiwan',
  'Malaysia', 'Thailand', 'Vietnam', 'Indonesia', 'Philippines',
  'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal'
];

export const MIDDLE_EAST_COUNTRIES = [
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain',
  'Oman', 'Israel', 'Jordan', 'Lebanon', 'Egypt', 'Turkey'
];

export const OTHER_REGIONS = [
  'Australia', 'New Zealand', 'Canada', 'Mexico', 'Brazil',
  'Argentina', 'Chile', 'Colombia', 'South Africa', 'Nigeria',
  'Kenya', 'Morocco', 'Ghana'
];

export const INDUSTRY_SECTORS = [
  'Information Technology', 'Healthcare', 'Finance & Banking', 
  'Manufacturing', 'Energy', 'Telecommunications', 'Construction',
  'Retail', 'Transportation & Logistics', 'Aerospace & Defense',
  'Education', 'Agriculture', 'Hospitality & Tourism', 'Media & Entertainment'
];

export const SET_ASIDE_TYPES = [
  'Small Business',
  'Service-Disabled Veteran-Owned Small Business (SDVOSB)',
  'Women-Owned Small Business (WOSB)',
  'HUBZone',
  '8(a) Program'
];

export const OPPORTUNITY_TYPES = [
  'Request for Information (RFI)',
  'Sources Sought',
  'Request for Quotation (RFQ)',
  'Request for Proposal (RFP)'
];

export const REGIONS_MAP = {
  'Europe': EUROPEAN_COUNTRIES,
  'Asia': ASIAN_COUNTRIES,
  'Middle East': MIDDLE_EAST_COUNTRIES,
  'Other Regions': OTHER_REGIONS
};

export function FilterDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { isFilterDialogOpen, setIsFilterDialogOpen } = useGlobalContext()
  const [open, setOpen] = useState(isOpen);
  const [inputValue, setInputValue] = useState('');
  const [gptPopoverOpen, setGptPopoverOpen] = useState(false);
  const [inputPadding, setInputPadding] = useState(155);
  const inputRef = useRef<HTMLInputElement>(null);
  const [tags, setTags] = useState<Tag[]>([{id: '0', text: 'FAR 52.219-14', excluded: true}]);
  const [filters, setFilters] = useState<FilterState>({
    jurisdiction: {
      federal: true,
      stateLocal: false,
      international: false,
      selectedStates: new Set<string>(),
      selectedCountries: new Set<string>(),
      selectedRegions: new Set<string>(),
    },
    contractTypes: {
      government: true,
      commercial: false,
      selectedIndustries: new Set<string>(),
    },
    setAsides: {
      smallBusiness: true,
      sdvosb: false,
      wosb: false,
      hubZone: true,
      eight_a: false,
    },
    approvedSites: {
      government: {
        sam: false,
        dla: true,
        fed_connect: false,
        unison_marketplace: false,
      },
      commercial: {},
    },
    opportunityTypes: new Set<string>(),
  });
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange(newOpen);
  };

  const tabExcludeToggle = (index: number) => {
    tags[index].excluded = !tags[index].excluded
  }

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          setIsFilterDialogOpen((isFilterDialogOpen) => !isFilterDialogOpen);
        }
      };
      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
  }, []);
    
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " && inputValue === "") {
      e.preventDefault();
      setGptPopoverOpen(true);
    } else if (e.key === 'Tab' && inputValue.trim()) {
      e.preventDefault();
      const newTag: Tag = {
        id: Math.random().toString(36).substr(2, 9),
        text: inputValue.trim(),
        excluded: false,
      };
      setTags([...tags, newTag]);
      setInputValue('');
    }
  };

  const updateJurisdiction = (key: keyof typeof filters.jurisdiction, value: boolean | Set<string>) => {
    setFilters((prev) => ({
      ...prev,
      jurisdiction: {
        ...prev.jurisdiction,
        [key]: value,
      },
    }));
  };

  const updateContractTypes = (key: keyof typeof filters.contractTypes, value: boolean | Set<string>) => {
    setFilters((prev) => ({
      ...prev,
      contractTypes: {
        ...prev.contractTypes,
        [key]: value,
      },
    }));
  };

  const updateSetAside = (key: keyof typeof filters.setAsides, value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      setAsides: {
        ...prev.setAsides,
        [key]: value,
      },
    }));
  };

  const updateApprovedSites = (key: string, value: boolean, context: "government" | "commercial") => {
    setFilters((prev) => ({
      ...prev,
      approvedSites: {
        ...prev.approvedSites,
        [context]: {
          ...prev.approvedSites[context],
          [key]: value,
        },
      },
    }));
  };

  const handleOpportunityTypeChange = (type: string, checked: boolean) => {
    setFilters((prev) => {
      const newTypes = new Set(prev.opportunityTypes);
      if (checked) {
        newTypes.add(type);
      } else {
        newTypes.delete(type);
      }
      return {
        ...prev,
        opportunityTypes: newTypes,
      };
    });
  };

  const handleStateChange = (state: string, checked: boolean) => {
    const newStates = new Set(filters.jurisdiction.selectedStates);
    if (checked) {
      newStates.add(state);
    } else {
      newStates.delete(state);
    }
    updateJurisdiction('selectedStates', newStates);
  };

  const handleCountryChange = (country: string, checked: boolean) => {
    const newCountries = new Set(filters.jurisdiction.selectedCountries);
    if (checked) {
      newCountries.add(country);
    } else {
      newCountries.delete(country);
    }
    updateJurisdiction('selectedCountries', newCountries);
  };

  const handleRegionChange = (region: string, checked: boolean) => {
    const newRegions = new Set(filters.jurisdiction.selectedRegions);
    if (checked) {
      newRegions.add(region);
    } else {
      newRegions.delete(region);
    }
    updateJurisdiction('selectedRegions', newRegions);
  };

  const handleIndustryChange = (industry: string, checked: boolean) => {
    const newIndustries = new Set(filters.contractTypes.selectedIndustries);
    if (checked) {
      newIndustries.add(industry);
    } else {
      newIndustries.delete(industry);
    }
    updateContractTypes('selectedIndustries', newIndustries);
  };

  const handlePopoverClose = () => {
      setGptPopoverOpen(false);
  }

  const onPopoverResponse = (value: string) => {
    setInputValue(value);
  };

  const handleInputChange = (event: any) => {
    setInputValue(event.target.value);
  };

  const handleSaveFilters = () => {
    // Save filters logic here
    handleOpenChange(false);
  };

  const removeTag = (tagId: string) => {
    setTags(tags.filter(tag => tag.id !== tagId));
  };

  useLayoutEffect(() => {
    if (tabsRef.current) {
      if(tabsRef.current.clientWidth >= 230){
        setInputPadding(245);
      }else{
        setInputPadding(tabsRef.current.clientWidth + 15)
      }
    } else {
      // setInputPadding(15)
    }
  }, [tags])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={false}>
      <DialogContent 
      className="sm:max-w-[700px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden bg-popover"
      // className="sm:max-w-[700px] h-[600px] p-0 bg-popover"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg pl-4 pt-4">
            Filter options
          </DialogTitle>
        </DialogHeader>
        <div className="relative px-4 py-2">
          <div className="absolute left-[21px] top-0 flex items-center h-full w-fit max-w-[45%]">
            <ScrollArea className="h-fit whitespace-nowrap">
              <div ref={tabsRef} className="flex w-max space-x-1 p-0 gap-1 overflow-hidden">
                {tags.map((tag, index) => (
                  <div key={tag.id} className="inline-flex">
                    <Badge
                      variant="secondary"
                      className={`flex items-center gap-1 px-2 py-1 text-sm cursor-default rounded-sm ${
                        tag.excluded ? 'bg-red-500 hover:bg-red-500/80 text-white' : 'bg-background'
                      }`}
                    >
                      {tag.text}
                      <Separator className={`h-4 w-px ${tag.excluded ? "bg-white" : "bg-muted-foreground"}`} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <EllipsisVertical className={`h-4 w-4 p-0 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground ${tag.excluded && "text-white"}`} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="w-30"
                          side="bottom"
                          align="end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {tag.excluded ? (
                            <DropdownMenuItem
                              onClick={() => tabExcludeToggle(index)}
                              className="bg-transparent focus:bg-green-400 focus:bg-opacity-20"
                            >
                              <DiamondPlus className="mr-2 h-4 w-4 text-green-400" />
                              <span className="text-green-400">Include</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => tabExcludeToggle(index)}
                              className="bg-transparent focus:bg-red-400 focus:bg-opacity-20"
                            >
                              <DiamondMinus className="mr-2 h-4 w-4 text-red-400" />
                              <span className="text-red-400">Exclude</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="bg-transparent"
                            onClick={() => removeTag(tag.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Remove</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Badge>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          <GPTInputPopover 
            open={gptPopoverOpen} 
            placeholder={"Ask for keywords..."}
            onResponse={onPopoverResponse}
            onClose={handlePopoverClose}
            systemPrompt={`You are a helpful assistant. Generate relevant keywords for the following text. Only return the keywords in this format: [keyword1, keyword2, keyword3]. Do not include any explanation, labels, or extra text: \n\n`}
            className="bg-popover"
            border
            >
            <div className="w-full h-fit">
            <Input
              ref={inputRef}
              style={{ paddingLeft: `${inputPadding}px` }}
              placeholder="Write keyword and press 'tab', or press 'space' for AI..."
              className="bg-popover"
              value={inputValue}
              onInput={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            </div>
          </GPTInputPopover>
      </div>
      <ScrollArea className="h-full w-full">
        <div className="p-4 pt-0 space-y-4">
          <ContractTypeSection
            contractTypes={filters.contractTypes}
            jurisdiction={filters.jurisdiction}
            setAsides={filters.setAsides}
            approvedSites={filters.approvedSites}
            opportunityTypes={filters.opportunityTypes}
            onContractTypeChange={updateContractTypes}
            onIndustryChange={handleIndustryChange}
            onJurisdictionChange={updateJurisdiction}
            onStateChange={handleStateChange}
            onCountryChange={handleCountryChange}
            onRegionChange={handleRegionChange}
            onSetAsideChange={updateSetAside}
            onOpportunityTypeChange={handleOpportunityTypeChange}
            onApprovedSiteChange={updateApprovedSites}
          />
        </div>
      </ScrollArea> 
  
    <DialogFooter className="flex-none p-4 border-t bg-muted/10">
    <div className="flex flex-row justify-end gap-2">
      <DialogClose asChild>
        <Button variant="outline">
          Cancel
        </Button>
      </DialogClose>
        <Button onClick={handleSaveFilters}>
          Apply filters
        </Button>
    </div>
  </DialogFooter>
  </DialogContent>
</Dialog>
  );
}

export function ContractTypeSection({
  contractTypes,
  jurisdiction,
  setAsides,
  approvedSites,
  opportunityTypes,
  onContractTypeChange,
  onIndustryChange,
  onJurisdictionChange,
  onStateChange,
  onCountryChange,
  onRegionChange,
  onSetAsideChange,
  onOpportunityTypeChange,
  onApprovedSiteChange,
}: ContractTypeSectionProps) {
  const [governmentExpanded, setGovernmentExpanded] = useState(true);
  const [commercialExpanded, setCommercialExpanded] = useState(false);

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-medium mb-4">Contract Types</h3>
    
      <div className="space-y-4">
        <Collapsible
          open={governmentExpanded && contractTypes.government}
          onOpenChange={setGovernmentExpanded}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <Checkbox
              id="government"
              checked={contractTypes.government}
              onCheckedChange={(checked) => {
                onContractTypeChange('government', checked as boolean);
                if (checked) setGovernmentExpanded(true);
              }}
              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label
              htmlFor="government"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Government
            </label>
            {contractTypes.government && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-5 w-5">
                  {governmentExpanded ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
            )}
          </div>

          <CollapsibleContent className="space-y-4 pl-6">
            <JurisdictionSection
              jurisdiction={jurisdiction}
              setAsides={setAsides}
              opportunityTypes={opportunityTypes}
              onJurisdictionChange={onJurisdictionChange}
              onStateChange={onStateChange}
              onCountryChange={onCountryChange}
              onRegionChange={onRegionChange}
              onSetAsideChange={onSetAsideChange}
              onOpportunityTypeChange={onOpportunityTypeChange}
            />

            <ApprovedSitesSection
              approvedSites={approvedSites}
              onApprovedSiteChange={onApprovedSiteChange}
              context="government"
            />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={commercialExpanded && contractTypes.commercial}
          onOpenChange={setCommercialExpanded}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <Checkbox
              id="commercial"
              checked={contractTypes.commercial}
              onCheckedChange={(checked) => {
                onContractTypeChange('commercial', checked as boolean);
                if (checked) setCommercialExpanded(true);
              }}
              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label
              htmlFor="commercial"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Commercial
            </label>
            {contractTypes.commercial && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-5 w-5">
                  {commercialExpanded ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
            )}
          </div>

          <CollapsibleContent className="space-y-4 pl-6">
            <IndustrySelector
              selectedIndustries={contractTypes.selectedIndustries}
              onIndustryChange={onIndustryChange}
            />
            
            <ApprovedSitesSection
              approvedSites={approvedSites}
              onApprovedSiteChange={onApprovedSiteChange}
              context="commercial"
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

export function IndustrySelector({ 
  selectedIndustries, 
  onIndustryChange 
}: IndustrySelectorProps) {
  const { isFilterDialogOpen, setIsFilterDialogOpen } = useGlobalContext()
  const allIndustriesSelected = INDUSTRY_SECTORS.length === selectedIndustries.size;
  const selectedCount = selectedIndustries.size;

  const handleSelectAllIndustries = (checked: boolean) => {
    const newIndustries = new Set<string>();
    if (checked) {
      INDUSTRY_SECTORS.forEach(industry => newIndustries.add(industry));
    }
    // Call the parent handler with all industries
    INDUSTRY_SECTORS.forEach(industry => {
      onIndustryChange(industry, checked);
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="truncate">
            {selectedCount === 0 ? "Select industries..." :
             selectedCount === INDUSTRY_SECTORS.length ? "All industries selected" :
             `${selectedCount} ${selectedCount === 1 ? 'industry' : 'industries'} selected`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={
        cn(`p-0 `,
        isFilterDialogOpen && "w-[var(--radix-popover-trigger-width)]"
        )}
        align="start">
        <div className="p-2 border-b">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all-industries"
              checked={allIndustriesSelected}
              onCheckedChange={handleSelectAllIndustries}
              className="data-[state=checked]:bg-primary"
            />
            <label
              htmlFor="select-all-industries"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Select All Industries
            </label>
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2 space-y-1">
            {INDUSTRY_SECTORS.map((industry) => (
              <div key={industry} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`industry-${industry}`}
                  checked={selectedIndustries.has(industry)}
                  onCheckedChange={(checked) => onIndustryChange(industry, checked as boolean)}
                  className="data-[state=checked]:bg-primary"
                />
                <label
                  htmlFor={`industry-${industry}`}
                  className="text-sm leading-none cursor-pointer"
                >
                  {industry}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function JurisdictionSection({
  jurisdiction,
  setAsides,
  opportunityTypes,
  onJurisdictionChange,
  onStateChange,
  onCountryChange,
  onRegionChange,
  onSetAsideChange,
  onOpportunityTypeChange,
}: JurisdictionSectionProps) {
  const [federalExpanded, setFederalExpanded] = useState(true);
  const [stateLocalExpanded, setStateLocalExpanded] = useState(false);
  const [internationalExpanded, setInternationalExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <Collapsible
        open={federalExpanded && jurisdiction.federal}
        onOpenChange={setFederalExpanded}
        className="space-y-2"
      >
        <div className="flex items-center space-x-2">
          <Checkbox
            id="federal"
            checked={jurisdiction.federal}
            onCheckedChange={(checked) => {
              onJurisdictionChange('federal', checked as boolean);
              if (checked) setFederalExpanded(true);
            }}
            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
          <label
            htmlFor="federal"
            className="text-sm font-medium leading-none cursor-pointer"
          >
            Federal
          </label>
          {jurisdiction.federal && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-5 w-5">
                {federalExpanded ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </CollapsibleTrigger>
          )}
        </div>

        <CollapsibleContent className="space-y-4 pl-6">
          <FederalFilterSection
            setAsides={setAsides}
            opportunityTypes={opportunityTypes}
            onSetAsideChange={onSetAsideChange}
            onOpportunityTypeChange={onOpportunityTypeChange}
          />
        </CollapsibleContent>
      </Collapsible>

      <Collapsible
        open={stateLocalExpanded && jurisdiction.stateLocal}
        onOpenChange={setStateLocalExpanded}
        className="space-y-2"
      >
        <div className="flex items-center space-x-2">
          <Checkbox
            id="state-local"
            checked={jurisdiction.stateLocal}
            onCheckedChange={(checked) => {
              onJurisdictionChange('stateLocal', checked as boolean);
              if (checked) setStateLocalExpanded(true);
            }}
            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
          <label
            htmlFor="state-local"
            className="text-sm font-medium leading-none cursor-pointer"
          >
            State/Local
          </label>
          {jurisdiction.stateLocal && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-5 w-5">
                {stateLocalExpanded ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </CollapsibleTrigger>
          )}
        </div>

        <CollapsibleContent className="space-y-2 pl-6">
          <StateSelector
            selectedStates={jurisdiction.selectedStates}
            onStateChange={onStateChange}
            onSelectAllStates={(checked) => {
              const newStates = new Set<string>();
              if (checked) {
                US_STATES.forEach(state => newStates.add(state));
              }
              onJurisdictionChange('selectedStates', newStates);
            }}
          />
        </CollapsibleContent>
      </Collapsible>

      <Collapsible
        open={internationalExpanded && jurisdiction.international}
        onOpenChange={setInternationalExpanded}
        className="space-y-2"
      >
        <div className="flex items-center space-x-2">
          <Checkbox
            id="international"
            checked={jurisdiction.international}
            onCheckedChange={(checked) => {
              onJurisdictionChange('international', checked as boolean);
              if (checked) setInternationalExpanded(true);
            }}
            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
          <label
            htmlFor="international"
            className="text-sm font-medium leading-none cursor-pointer"
          >
            International
          </label>
          {jurisdiction.international && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-5 w-5">
                {internationalExpanded ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </CollapsibleTrigger>
          )}
        </div>

        <CollapsibleContent className="space-y-4 pl-6">
          <RegionSelector
            selectedRegions={jurisdiction.selectedRegions}
            onRegionChange={onRegionChange}
          />
          
          <div className="mt-4">
            <CountrySelector 
              selectedCountries={jurisdiction.selectedCountries}
              onCountryChange={onCountryChange}
              onSelectAllCountries={(checked) => {
                const newCountries = new Set<string>();
                if (checked) {
                  Object.values(REGIONS_MAP).flat().forEach(country => newCountries.add(country));
                }
                onJurisdictionChange('selectedCountries', newCountries);
              }}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function RegionSelector({ 
  selectedRegions, 
  onRegionChange 
}: RegionSelectorProps) {
  const regions = ["Europe", "Asia", "Middle East", "Other Regions"];

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium mb-2">Regions</h4>
      <div className="grid grid-cols-2 gap-2">
        {regions.map((region) => (
          <div key={region} className="flex items-center space-x-2">
            <Checkbox
              id={`region-${region}`}
              checked={selectedRegions.has(region)}
              onCheckedChange={(checked) => onRegionChange(region, checked as boolean)}
              className="data-[state=checked]:bg-primary"
            />
            <label
              htmlFor={`region-${region}`}
              className="text-sm leading-none cursor-pointer"
            >
              {region}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CountrySelector({ 
  selectedCountries, 
  onCountryChange, 
  onSelectAllCountries 
}: CountrySelectorProps) {
  const { isFilterDialogOpen, setIsFilterDialogOpen } = useGlobalContext()
  const allCountries = [
    ...EUROPEAN_COUNTRIES,
    ...ASIAN_COUNTRIES,
    ...MIDDLE_EAST_COUNTRIES,
    ...OTHER_REGIONS
  ];
  
  const allSelected = allCountries.length === selectedCountries.size;
  const selectedCount = selectedCountries.size;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="truncate">
            {selectedCount === 0 ? "Select countries..." :
             selectedCount === allCountries.length ? "All countries selected" :
             `${selectedCount} ${selectedCount === 1 ? 'country' : 'countries'} selected`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
      className={
        cn(`p-0 `,
        isFilterDialogOpen && "w-[var(--radix-popover-trigger-width)]"
        )}
      align="start">
        <div className="p-2 border-b">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all-countries"
              checked={allSelected}
              onCheckedChange={onSelectAllCountries}
              className="data-[state=checked]:bg-primary"
            />
            <label
              htmlFor="select-all-countries"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Select All Countries
            </label>
          </div>
        </div>
        
        <Tabs defaultValue="europe" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-transparent">
            <TabsTrigger value="europe">Europe</TabsTrigger>
            <TabsTrigger value="asia">Asia</TabsTrigger>
            <TabsTrigger value="middle-east">Middle East</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
          
          <TabsContent value="europe">
            <ScrollArea className="h-[250px]">
              <div className="grid grid-cols-2 p-2 gap-1">
                {EUROPEAN_COUNTRIES.map((country) => (
                  <CountryCheckbox
                    key={country}
                    country={country}
                    checked={selectedCountries.has(country)}
                    onChange={onCountryChange}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="asia">
            <ScrollArea className="h-[250px]">
              <div className="grid grid-cols-2 p-2 gap-1">
                {ASIAN_COUNTRIES.map((country) => (
                  <CountryCheckbox
                    key={country}
                    country={country}
                    checked={selectedCountries.has(country)}
                    onChange={onCountryChange}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="middle-east">
            <ScrollArea className="h-[250px]">
              <div className="grid grid-cols-2 p-2 gap-1">
                {MIDDLE_EAST_COUNTRIES.map((country) => (
                  <CountryCheckbox
                    key={country}
                    country={country}
                    checked={selectedCountries.has(country)}
                    onChange={onCountryChange}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="other">
            <ScrollArea className="h-[250px]">
              <div className="grid grid-cols-2 p-2 gap-1">
                {OTHER_REGIONS.map((country) => (
                  <CountryCheckbox
                    key={country}
                    country={country}
                    checked={selectedCountries.has(country)}
                    onChange={onCountryChange}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

function CountryCheckbox({ country, checked, onChange }: CountryCheckboxProps) {
  return (
    <div className="flex items-center space-x-2 py-1">
      <Checkbox
        id={`country-${country}`}
        checked={checked}
        onCheckedChange={(checked) => onChange(country, checked as boolean)}
        className="data-[state=checked]:bg-primary"
      />
      <label
        htmlFor={`country-${country}`}
        className="text-sm leading-none cursor-pointer truncate"
      >
        {country}
      </label>
    </div>
  );
}

export function StateSelector({ 
  selectedStates, 
  onStateChange, 
  onSelectAllStates 
}: StateSelectorProps) {
  const { isFilterDialogOpen, setIsFilterDialogOpen } = useGlobalContext()
  const allStatesSelected = US_STATES.length === selectedStates.size;
  const selectedCount = selectedStates.size;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="truncate">
            {selectedCount === 0 ? "Select states..." :
             selectedCount === US_STATES.length ? "All states selected" :
             `${selectedCount} state${selectedCount === 1 ? '' : 's'} selected`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
      className={
        cn(`p-0 `,
        isFilterDialogOpen && "w-[var(--radix-popover-trigger-width)]"
        )}
      align="start">
        <div className="p-2 border-b">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all-states"
              checked={allStatesSelected}
              onCheckedChange={onSelectAllStates}
              className="data-[state=checked]:bg-primary"
            />
            <label
              htmlFor="select-all-states"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Select All States
            </label>
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="grid grid-cols-2 p-2 gap-1">
            {US_STATES.map((state) => (
              <div key={state} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`state-${state}`}
                  checked={selectedStates.has(state)}
                  onCheckedChange={(checked) => onStateChange(state, checked as boolean)}
                  className="data-[state=checked]:bg-primary"
                />
                <label
                  htmlFor={`state-${state}`}
                  className="text-sm leading-none cursor-pointer truncate"
                >
                  {state}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function FederalFilterSection({ 
  setAsides, 
  opportunityTypes,
  onSetAsideChange,
  onOpportunityTypeChange
}: FederalFilterProps) {
  const { isFilterDialogOpen, setIsFilterDialogOpen } = useGlobalContext()
  const setAsideKeys: Record<string, keyof FilterState['setAsides']> = {
    'Small Business': 'smallBusiness',
    'Service-Disabled Veteran-Owned Small Business (SDVOSB)': 'sdvosb',
    'Women-Owned Small Business (WOSB)': 'wosb',
    'HUBZone': 'hubZone',
    '8(a) Program': 'eight_a'
  };

  const selectedSetAsideCount = Object.values(setAsides).filter(Boolean).length;
  const selectedOpportunityCount = opportunityTypes.size;

  return (
    <div className="space-y-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="truncate">
                {selectedSetAsideCount === 0 ? "Select set-asides..." :
                 selectedSetAsideCount === SET_ASIDE_TYPES.length ? "All set-asides selected" :
                 `${selectedSetAsideCount} set-aside${selectedSetAsideCount === 1 ? '' : 's'} selected`}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
        className={
          cn(`p-0 `,
          isFilterDialogOpen && "w-[var(--radix-popover-trigger-width)]"
          )}
          align="start">
            <ScrollArea className="h-fit">
              <div className="p-2 space-y-2">
                {SET_ASIDE_TYPES.map((setAside) => (
                  <div key={setAside} className="flex items-center space-x-2 space-y-1">
                    <Checkbox
                      id={`setaside-${setAside}`}
                      checked={setAsides[setAsideKeys[setAside as keyof typeof setAsideKeys]]}
                      onCheckedChange={(checked) => 
                        onSetAsideChange(setAsideKeys[setAside as keyof typeof setAsideKeys], checked as boolean)
                      }
                      className="data-[state=checked]:bg-primary"
                    />
                    <label
                      htmlFor={`setaside-${setAside}`}
                      className="text-sm leading-none cursor-pointer"
                    >
                      {setAside}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="truncate">
                {selectedOpportunityCount === 0 ? "Select opportunity types..." :
                 selectedOpportunityCount === OPPORTUNITY_TYPES.length ? "All types selected" :
                 `${selectedOpportunityCount} type${selectedOpportunityCount === 1 ? '' : 's'} selected`}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
          className={
            cn(`p-0 `,
            isFilterDialogOpen && "w-[var(--radix-popover-trigger-width)]"
          )}
           align="start">
            <ScrollArea className="h-fit">
              <div className="p-2 space-y-2">
                {OPPORTUNITY_TYPES.map((type) => (
                  <div key={type} className="flex items-center space-x-2 space-y-1">
                    <Checkbox
                      id={`opportunity-${type}`}
                      checked={opportunityTypes.has(type)}
                      onCheckedChange={(checked) => 
                        onOpportunityTypeChange(type, checked as boolean)
                      }
                      className="data-[state=checked]:bg-primary"
                    />
                    <label
                      htmlFor={`opportunity-${type}`}
                      className="text-sm leading-none cursor-pointer"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
    </div>
  );
}

export function ApprovedSitesSection({ 
  approvedSites, 
  onApprovedSiteChange,
  context
}: ApprovedSitesSectionProps) {
  const { isFilterDialogOpen, setIsFilterDialogOpen } = useGlobalContext()
  const [showAddSite, setShowAddSite] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [siteLabels, setSiteLabels] = useState<Record<ApprovedSitesSectionProps["context"], Record<string, { label: string, url: string }>>>({
    government: {
      sam: { label: "SAM.gov", url: "https://www.sam.gov" },
      dla: { label: "DLA Internet Bid Board", url: "https://www.dla.gov/dla/technology-solutions/internet-bidding/internet-bidding-boards" },
      fed_connect: { label: "FedConnect", url: "https://www.fedconnect.gov" },
      unison_marketplace: { label: "Unison Marketplace", url: "https://www.unison.com/marketplace" },
    },
    commercial:{}
  });

  const handleAddSite = () => {
    const siteName = newSiteName.trim();
    const siteUrl = newSiteUrl.trim();
    if (siteName.trim() && siteUrl.trim()) {
      const key = siteName.toLowerCase().replace(/\s+/g, '_');
      onApprovedSiteChange(key, true, context);
      setNewSiteName("");
      setNewSiteUrl("");
      setSiteLabels(prev => ({
        ...prev,
        [context]: {
          ...prev[context],
          [key]: { label: siteName, url: siteUrl },
        }
      }));
      setShowAddSite(false);
    }
  };
  const siteEntries = Object.entries(approvedSites[context]);
  const mainSites = siteEntries.slice(0, 3);
  const additionalSites = siteEntries.slice(3)
  const filteredSites = additionalSites.filter(([key]) =>
    !inputValue.trim() || key.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Approved Sites</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowAddSite(!showAddSite)}
        >
          <Plus className="h-4 w-4" />
          Add Site
        </Button>
      </div>

      {showAddSite && (
        <div className="flex gap-2 mb-4 items-stretch">
          <div className="flex gap-2 flex-1">
          <Input
            placeholder="Enter site name"
            value={newSiteName}
            onChange={(e) => setNewSiteName(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Enter site URL"
            value={newSiteUrl}
            onChange={(e) => setNewSiteUrl(e.target.value)}
            className="flex-1"
          />
          </div>
          <Button 
            size="sm" 
            onClick={handleAddSite}
            className="h-10 w-fit"
            disabled={!newSiteName.trim() || !newSiteUrl.trim()}
          >
            Add
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {mainSites.map(([key, value]) => (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              id={`${context}-${key}`}
              checked={value}
              onCheckedChange={(checked) => onApprovedSiteChange(key, checked as boolean, context)}
              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label
              htmlFor={`${context}-${key}`}
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {siteLabels[context][key as keyof typeof siteLabels].label || key.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </label>
          </div>
        ))}

      <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <PopoverTrigger asChild>
        {additionalSites.length > 0 && (
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setIsDropdownOpen(true)}
            >
              Show {additionalSites.length} more sites...
            </Button>
          )}
      </PopoverTrigger>

      <PopoverContent 
      className={
        cn(`p-0 bg-popover h-fit `,
        isFilterDialogOpen && "w-[var(--radix-popover-trigger-width)]"
        )}
      >
        <div className="text-lg font-semibold mb-4 p-4 pb-1">Additional Approved Sites</div>

        <div className="flex gap-2 mb-4">
          <div className="flex gap-2 flex-1 relative">
          <Input
            placeholder="Search site..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 pl-9 bg-transparent border-0 border-y border-border rounded-none"
          />
          <Search 
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rounded-none",
            inputValue.trim() && "text-primary"
            )} aria-hidden="true" 
          />
          </div>
        </div>

        <ScrollArea className="h-fit max-h-[300px] pr-2 p-4 pt-1">
          <div className="space-y-3">
            {filteredSites.map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`${context}-dropdown-${key}`}
                  checked={value}
                  onCheckedChange={(checked) => onApprovedSiteChange(key, checked as boolean, context)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <label
                  htmlFor={`${context}-dropdown-${key}`}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {siteLabels[context][key as keyof typeof siteLabels].label || 
                    key.split('_').map(word =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')
                  }
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
      </div>
    </div>
  );
}