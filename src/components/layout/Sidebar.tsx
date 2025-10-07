
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CharacterList from "../characters/CharacterList";
import PersonaList from "../user/PersonaList";

export default function Sidebar() {
  return (
    <div className="bg-card h-full flex flex-col p-4 rounded-lg border">
      <Tabs defaultValue="characters" className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="characters">Characters</TabsTrigger>
          <TabsTrigger value="personas">Personas</TabsTrigger>
        </TabsList>
        <TabsContent value="characters" className="flex-grow overflow-y-auto mt-4 pr-2">
          <CharacterList />
        </TabsContent>
        <TabsContent value="personas" className="flex-grow overflow-y-auto mt-4 pr-2">
          <PersonaList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
