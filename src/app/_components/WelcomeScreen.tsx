
"use client";

import { useCharacter } from "@/context/CharacterContext";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Sparkles } from "lucide-react";

export default function WelcomeScreen() {
    const { dispatch } = useCharacter();
    const welcomeImage = PlaceHolderImages.find(img => img.id === 'welcome-soul');

    const handleNewCharacter = () => {
        dispatch({ type: 'SET_VIEW', payload: 'creating' });
    };

    return (
        <div className="relative flex flex-col items-center justify-center h-full text-center p-8">
            <div className="relative z-10 flex flex-col items-center p-8 rounded-lg bg-card/80 backdrop-blur-sm max-w-4xl">
                {welcomeImage && (
                    <Image
                        src={welcomeImage.imageUrl}
                        alt={welcomeImage.description}
                        width={200}
                        height={200}
                        data-ai-hint={welcomeImage.imageHint}
                        className="mb-6 rounded-full border-4 border-primary/50 shadow-lg"
                        unoptimized
                    />
                )}
                <h1 className="text-5xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
                    Welcome to <span className="text-primary">Persona AI</span>
                </h1>
                <p className="text-xl md:text-2xl max-w-3xl mb-8 text-muted-foreground leading-relaxed">
                    You have no characters yet. Create one to get started.
                </p>
                <Button onClick={handleNewCharacter} className="text-xl h-14 px-8 rounded-full font-bold" size="lg">
                    <Sparkles className="mr-3 h-6 w-6" />
                    Create Your First Character
                </Button>
            </div>
        </div>
    )
}
