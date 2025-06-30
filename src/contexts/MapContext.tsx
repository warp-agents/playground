"use client"

import { createContext, useContext, Dispatch, SetStateAction, useState, ReactNode } from "react"

type Mode = "pin" | "move" | "line" | "rectangle" | "polygon" | "detect" | "measure";

interface ContextProps {
    activeMode: Mode;
    setActiveMode: Dispatch<SetStateAction<Mode>>;
    isClearingAll: boolean;
    setIsClearingAll: Dispatch<SetStateAction<boolean>>;
}

const MapControlsContext = createContext<ContextProps>({
    activeMode: "move",
    setActiveMode: () => {},
    isClearingAll: false,
    setIsClearingAll: () => {}
});

export const MapControlsContextProvider = ({ children }: { children: ReactNode }) => {
    const [activeMode, setActiveMode] = useState<Mode>("move");
    const [isClearingAll, setIsClearingAll] = useState(false);

    return (
        <MapControlsContext.Provider value={{ activeMode, setActiveMode, isClearingAll, setIsClearingAll }}>    
            {children}
        </MapControlsContext.Provider>
    );
};

export const useMapControlsContext = () => useContext(MapControlsContext);
