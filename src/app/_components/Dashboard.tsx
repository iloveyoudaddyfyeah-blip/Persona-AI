
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CharacterGrid from "@/components/characters/CharacterGrid";
import UserPersonaManager from "@/components/user/UserPersonaManager";
import { useCharacter } from "@/context/CharacterContext";

export type DashboardTab = 'characters' | 'personas';

interface DashboardProps {
    activeTab: DashboardTab;
}

export default function Dashboard({ activeTab }: DashboardProps) {
    const { dispatch } = useCharacter();

    const onTabChange = (value: string) => {
        dispatch({ type: 'SET_ACTIVE_TAB', payload: value as DashboardTab });
    }

    return (
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="characters">Characters</TabsTrigger>
                <TabsTrigger value="personas">Personas</TabsTrigger>
            </TabsList>
            <TabsContent value="characters" className="mt-4">
                <CharacterGrid />
            </TabsContent>
            <TabsContent value="personas" className="mt-4">
                <UserPersonaManager />
            </TabsContent>
        </Tabs>
    );
}
