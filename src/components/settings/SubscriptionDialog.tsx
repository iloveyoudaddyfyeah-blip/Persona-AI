
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
import { Crown, Sparkles, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="text-primary h-7 w-7" />
            Upgrade to PersonaCraft Premium
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base pt-4 text-left">
            Unlock the full potential of AI character creation with these exclusive features:
             <ul className="list-disc pl-5 mt-4 space-y-2">
                <li className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span><span className="font-bold">Custom AI Tones:</span> Shape your character's voice with a wide range of tones like witty, noir, or epic.</span>
                </li>
                <li className="flex items-start gap-2">
                    <Wand2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span><span className="font-bold">Longer Biographies:</span> Generate incredibly detailed backstories up to 5,000 characters long.</span>
                </li>
             </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Maybe Later</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpgrade}>
            Upgrade Now (Simulated)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
