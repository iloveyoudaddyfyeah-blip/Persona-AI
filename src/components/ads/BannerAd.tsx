
"use client";

import { useUser } from "@/firebase";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Crown } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { SubscriptionDialog } from "../settings/SubscriptionDialog";

export function BannerAd() {
    const { isPremium, setIsPremium } = useUser();
    const adImage = PlaceHolderImages.find(img => img.id === 'ad-banner-castle');

    if (isPremium) {
        return null;
    }

    return (
        <SubscriptionDialog onUpgrade={() => setIsPremium(true)}>
            <Card className="mt-2 w-full cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-2">
                    <div className="flex items-center gap-3">
                         {adImage && (
                            <Image
                                src={adImage.imageUrl}
                                alt={adImage.description}
                                data-ai-hint={adImage.imageHint}
                                width={50}
                                height={50}
                                className="rounded-md object-cover aspect-square"
                                unoptimized
                            />
                        )}
                        <div className="flex-grow">
                            <p className="font-bold text-base">Unlock Premium!</p>
                            <p className="text-sm text-muted-foreground">Remove ads & get more features.</p>
                        </div>
                        <Button size="sm">
                            <Crown className="mr-2 h-4 w-4" />
                            Upgrade
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </SubscriptionDialog>
    )
}
