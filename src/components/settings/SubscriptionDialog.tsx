
"use client";

import React, { useState } from 'react';
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
import { Check, Crown, Sparkles, Wand2, CreditCard, Calendar, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface SubscriptionDialogProps {
  children: React.ReactNode;
  onUpgrade: () => void;
}

export function SubscriptionDialog({ children, onUpgrade }: SubscriptionDialogProps) {
  const { toast } = useToast();
  const [view, setView] = useState<'plans' | 'payment'>('plans');
  const [isOpen, setIsOpen] = useState(false);

  const handleUpgrade = () => {
    onUpgrade();
    toast({
      title: "Upgrade Successful!",
      description: "You now have access to all premium features.",
    });
    setIsOpen(false); // Close the dialog on success
  };

  const openChangeWrapper = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset to plan view when dialog is closed
      setTimeout(() => setView('plans'), 200); 
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={openChangeWrapper}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center justify-center gap-2 text-3xl font-headline">
            <Crown className="text-primary h-8 w-8" />
            {view === 'plans' ? 'Upgrade to Premium' : 'Complete Your Purchase'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg pt-2">
            {view === 'plans' 
              ? 'Choose a plan to unlock the full potential of AI character creation.'
              : 'Enter your payment details below. This is a simulation.'
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        {view === 'plans' ? (
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
                      <Button onClick={() => setView('payment')} className="w-full">
                          Upgrade Now
                      </Button>
                  </CardFooter>
              </Card>
          </div>
        ) : (
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="card-name">Cardholder Name</Label>
              <Input id="card-name" placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="card-number" placeholder="•••• •••• •••• 4242" className="pl-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="expiry" placeholder="MM/YY" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="cvc" placeholder="•••" className="pl-10" />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <AlertDialogFooter className="pt-4">
          <AlertDialogCancel onClick={() => view === 'payment' ? setView('plans') : setIsOpen(false)}>
            {view === 'payment' ? 'Back' : 'Maybe Later'}
          </AlertDialogCancel>
          {view === 'payment' && (
            <AlertDialogAction onClick={handleUpgrade}>
                Confirm Payment
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
