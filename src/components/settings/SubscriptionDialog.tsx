"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Sparkles, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SubscriptionDialogProps {
  children: React.ReactNode;
  onUpgrade: () => void;
}

export function SubscriptionDialog({ children, onUpgrade }: SubscriptionDialogProps) {
  const { toast } = useToast();

  const handleUpgrade = () => {
    onUpgrade();
    toast({
      title: "Upgrade Successful!",
      description: "You now have access to all premium features.",
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center justify-center gap-2 text-3xl font-headline">
            <Crown className="text-primary h-8 w-8" />
            Upgrade to PersonaCraft Premium
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg pt-2">
            Choose a plan to unlock the full potential of AI character creation.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            <Card>
                <CardHeader>
                    <CardTitle>Free</CardTitle>
                    <CardDescription>Our basic plan for getting started.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                     <p className="text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Basic AI Tone</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Biographies up to 1000 chars</li>
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button disabled variant="outline" className="w-full">Your Current Plan</Button>
                </CardFooter>
            </Card>
             <Card className="border-primary border-2 relative">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-full">
                        POPULAR
                    </div>
                 </div>
                <CardHeader>
                    <CardTitle>Premium</CardTitle>
                    <CardDescription>Unlock all advanced AI features.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                     <p className="text-3xl font-bold">$10<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Custom AI Tones</li>
                        <li className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" /> Biographies up to 5000 chars</li>
                        <li className="flex items-center gap-2"><Crown className="h-4 w-4 text-primary" /> AI Profile Refinement</li>
                    </ul>
                </CardContent>
                <CardFooter>
                    <AlertDialogAction asChild className="w-full">
                         <Button onClick={handleUpgrade}>
                            Upgrade Now
                        </Button>
                    </AlertDialogAction>
                </CardFooter>
            </Card>
        </div>
        
        <AlertDialogFooter className="pt-4">
          <AlertDialogCancel>Maybe Later</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
