"use client"

import { createContext, useContext, Dispatch, SetStateAction, useState, useEffect, ReactNode } from "react"
import { ActionHandlerProps } from "@/lib/types"

interface ContextProps {
    files: File[];
    setFiles: Dispatch<SetStateAction<File[]>>;
    isSearchDialogOpen: boolean;
    setIsSearchDialogOpen: Dispatch<SetStateAction<boolean>>;
    isFilterDialogOpen: boolean;
    setIsFilterDialogOpen: Dispatch<SetStateAction<boolean>>;
    isSidebarOpen: boolean;
    setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
    actionHandler: ActionHandlerProps | null;
    setActionHandler: Dispatch<SetStateAction<ActionHandlerProps | null>>;
}

const GlobalContext = createContext<ContextProps>({
    files:[],
    setFiles: () => {},
    isSearchDialogOpen: false,
    setIsSearchDialogOpen: () => {},
    isFilterDialogOpen: false,
    setIsFilterDialogOpen: () => {},
    isSidebarOpen: true,
    setIsSidebarOpen: () => {},
    actionHandler: null,
    setActionHandler: () => {},
})

export const GlobalContextProvider = ({ children }: { children: ReactNode }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
    const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)  
    const [actionHandler, setActionHandler] = useState<ActionHandlerProps | null>(null);

    return(
        <GlobalContext.Provider value={{ files, setFiles, isSearchDialogOpen, setIsSearchDialogOpen, isFilterDialogOpen, setIsFilterDialogOpen, isSidebarOpen, setIsSidebarOpen, actionHandler, setActionHandler }}>
        {children}
        </GlobalContext.Provider>
    )
}

export const useGlobalContext = () => useContext(GlobalContext)