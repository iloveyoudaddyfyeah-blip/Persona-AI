
"use client";

import React from 'react';
import PersonaForm from './PersonaForm';
import { useCharacter } from '@/context/CharacterContext';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { UserPersona } from '@/lib/types';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface EditPersonaProps {
    persona: UserPersona;
}

export default function EditPersona({ persona }: EditPersonaProps) {
    const { dispatch } = useCharacter();
    const { user, firestore } = useUser();
    const { toast } = useToast();

    const handleSave = async (formData: Omit<UserPersona, 'id' | 'isActive'>) => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Not logged in' });
            return;
        };

        const personaRef = doc(firestore, `users/${user.uid}/personas/${persona.id}`);
        
        const updatedPersona: Partial<Omit<UserPersona, 'id' | 'isActive'>> = {
            name: formData.name,
            description: formData.description,
            photoDataUri: formData.photoDataUri
        };

        updateDocumentNonBlocking(personaRef, updatedPersona);
        
        toast({ title: 'Persona updated!', description: `${formData.name} has been saved.` });
        dispatch({ type: 'SET_VIEW', payload: 'persona_manager' });
    };

    return (
        <PersonaForm 
            onSave={handleSave}
            onCancel={() => dispatch({ type: 'SET_VIEW', payload: 'persona_manager' })}
            formType="edit"
            initialData={persona}
        />
    );
}
