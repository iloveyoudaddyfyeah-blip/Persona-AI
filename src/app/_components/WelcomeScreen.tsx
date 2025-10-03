
"use client";

import { useCharacter } from "@/context/CharacterContext";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { HeartPulse } from "lucide-react";

export default function WelcomeScreen() {
    const { dispatch } = useCharacter();
    const welcomeImage = PlaceHolderImages.find(img => img.id === 'welcome-soul');

    const handleNewCharacter = () => {
        dispatch({ type: 'SET_VIEW', payload: 'creating' });
        dispatch({ type: 'SELECT_CHARACTER', payload: null });
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            {welcomeImage && (
                <Image
                    src={welcomeImage.imageUrl}
                    alt={welcomeImage.description}
                    width={200}
                    height={200}
                    data-ai-hint={welcomeImage.imageHint}
                    className="pixel-art mb-8"
                />
            )}
            <h2 className="text-5xl font-headline mb-4">Welcome to PersonaCraft AI</h2>
            <p className="text-2xl max-w-2xl mb-8 text-muted-foreground">
                Breathe life into a new persona. Upload a photo and let our AI craft a unique character, complete with a personality, backstory, and voice.
            </p>
            <Button onClick={handleNewCharacter} className="text-2xl h-14 px-8" size="lg">
                <HeartPulse className="mr-3 h-7 w-7" />
                Create Your First Character
            </Button>
        </div>
    )
}
