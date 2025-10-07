
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Upload, Save, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { Textarea } from '../ui/textarea';
import type { UserPersona } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { generatePersonaFromPrompt } from '@/app/actions';

interface PersonaFormProps {
    initialData?: UserPersona;
    onSave: (formData: Omit<UserPersona, 'id' | 'isActive'>) => Promise<void>;
    onCancel: () => void;
    formType: 'create' | 'edit';
}

export default function PersonaForm({ onSave, onCancel, formType, initialData }: PersonaFormProps) {
  const { toast } = useToast();
  
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [photoDataUri, setPhotoDataUri] = useState(initialData?.photoDataUri || '');
  const [aiPrompt, setAiPrompt] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const personaPlaceholder = PlaceHolderImages.find(img => img.id === 'persona-placeholder');

  useEffect(() => {
    if (!photoDataUri && personaPlaceholder) {
        setPhotoDataUri(personaPlaceholder.imageUrl);
    }
  }, [photoDataUri, personaPlaceholder]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({ variant: "destructive", title: "File too large", description: "Image must be smaller than 4MB." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => setPhotoDataUri(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateDescription = async () => {
    if (!aiPrompt) {
        toast({ variant: 'destructive', title: 'Prompt is empty', description: 'Please enter a prompt to generate a description.' });
        return;
    }
    setIsGenerating(true);
    try {
        const generatedDescription = await generatePersonaFromPrompt(aiPrompt);
        setDescription(generatedDescription);
        toast({ title: 'Description generated!' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Generation failed', description: (error as Error).message });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please provide a name and description for your persona.",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name,
        description,
        photoDataUri: photoDataUri || personaPlaceholder?.imageUrl || '',
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Save Failed",
        description: (error as Error).message || "Could not save persona. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formSectionClass = "space-y-3";
  const labelClass = "text-xl font-bold font-headline";
  const descriptionClass = "text-sm text-muted-foreground";

  return (
    <div className="w-full h-full overflow-y-auto py-8 px-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <header>
              <Button type="button" variant="ghost" onClick={onCancel} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Personas
              </Button>
              <h1 className="text-4xl font-headline mb-2">{formType === 'create' ? 'Create New Persona' : `Edit ${initialData?.name}`}</h1>
              <p className={descriptionClass}>Define a persona for your interactions. Give it a name, a face, and a personality.</p>
            </header>

            <div className={formSectionClass}>
              <Label htmlFor="name" className={labelClass}>Persona Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., The Skeptic"
                required
                className="text-lg h-12 bg-secondary/30"
                autoComplete="off"
              />
            </div>

            <div className={formSectionClass}>
              <Label className={labelClass}>Persona Photo</Label>
              <div className="flex items-center gap-4 p-4 rounded-md border bg-secondary/30">
                <Image src={photoDataUri || ''} alt="Persona photo" width={80} height={80} className="rounded-md object-cover aspect-square" data-ai-hint={personaPlaceholder?.imageHint} unoptimized/>
                 <div className='flex-grow'>
                    <p className={descriptionClass}>Upload a custom image for your persona. If left blank, a default will be used.</p>
                    <Button type='button' variant="outline" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                        Choose File
                    </Button>
                    <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
                 </div>
              </div>
            </div>
            
            <div className={formSectionClass}>
                <Label htmlFor="description" className={labelClass}>Description</Label>
                <p className={descriptionClass}>Write a brief bio for your persona. This is how AI characters will perceive you.</p>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., A hardened detective who is skeptical of everyone..."
                    className="text-lg min-h-[150px] bg-secondary/30"
                    required
                    autoComplete="off"
                />
            </div>

            <div className="space-y-4 rounded-lg border p-4 bg-secondary/20">
                <Label className={labelClass}>...Or Generate with AI</Label>
                <p className={descriptionClass}>Don't want to write it yourself? Give the AI some keywords and let it create a description for you.</p>
                <div className="flex gap-2">
                    <Input
                        id="ai-prompt"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g., 'A friendly traveler who loves stories'"
                        className="text-lg h-12"
                        disabled={isGenerating}
                        autoComplete="off"
                    />
                    <Button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="h-12">
                        {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                        <span className="ml-2 hidden sm:inline">Generate</span>
                    </Button>
                </div>
            </div>
            

            <Button type="submit" disabled={isSaving} className="w-full text-xl h-14 font-bold tracking-wider" size="lg">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-6 w-6" />
                  {formType === 'create' ? 'Create Persona' : 'Save Changes'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
