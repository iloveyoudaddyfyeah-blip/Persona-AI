
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Slider } from "../ui/slider";
import { useCharacter, Tone } from "@/context/CharacterContext";
import { Settings } from 'lucide-react';

export default function SettingsDialog() {
  const { state, dispatch } = useCharacter();
  const { settings } = state;

  const handleToneChange = (value: string) => {
    dispatch({ type: 'SET_AI_TONE', payload: value as Tone });
  };

  const handleCharLimitChange = (value: number[]) => {
    dispatch({ type: 'SET_AI_CHAR_LIMIT', payload: value[0] });
  };
  
  const handleThemeChange = (value: "light" | "dark" | "system") => {
    dispatch({ type: 'SET_THEME', payload: value });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-6 w-6" />
          <span className="sr-only">Open Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage application and AI generation settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="space-y-2">
                <Label htmlFor="theme" className="text-base">Theme</Label>
                <Select value={settings.theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="text-base">
                        <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="tone" className="text-base">Default AI Tone</Label>
                <Select value={settings.aiTone} onValueChange={handleToneChange}>
                    <SelectTrigger className="text-base">
                        <SelectValue placeholder="Select a tone" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="witty">Witty</SelectItem>
                        <SelectItem value="serious">Serious</SelectItem>
                        <SelectItem value="whimsical">Whimsical</SelectItem>
                        <SelectItem value="poetic">Poetic</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="char-limit" className="text-base">Default Biography Length</Label>
                <div className='flex items-center gap-4'>
                    <Slider
                        id="char-limit"
                        min={500}
                        max={5000}
                        step={100}
                        value={[settings.aiCharLimit]}
                        onValueChange={handleCharLimitChange}
                    />
                    <span className='text-base font-mono w-20 text-center'>{settings.aiCharLimit}</span>
                </div>
              </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
