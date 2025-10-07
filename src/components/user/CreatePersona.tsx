
"use client";

import React from 'react';
import PersonaForm from './PersonaForm';
import { useCharacter } from '@/context/CharacterContext';
import { useUser, useFirestore } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { UserPersona } from '@/lib/types';
import { setDocumentNonBlocking, updateUser } from '@/firebase/non-blocking-updates';

export default function CreatePersona() {
    const { state, dispatch } = useCharacter();
    const { user, firestore } = useUser();
    const { toast } = useToast();

    const handleSave = async (formData: Omit<UserPersona, 'id' | 'isActive'>) => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Not logged in' });
            return;
        };

        const newPersonaId = doc(collection(firestore, `users/${user.uid}/personas`)).id;
        
        // The first persona created is automatically set to active.
        const isActive = state.userPersonas.length === 0;

        const newPersona: UserPersona = {
            ...formData,
            id: newPersonaId,
            isActive: isActive,
        };

        const personaRef = doc(firestore, 'users', user.uid, 'personas', newPersona.id);
        setDocumentNonBlocking(personaRef, newPersona);

        if (isActive) {
            updateUser(firestore, user.uid, { activePersonaId: newPersonaId });
        }
        
        toast({ title: 'Persona created!', description: `${newPersona.name} is now available.` });
        dispatch({ type: 'SET_VIEW', payload: 'persona_manager' });
    };

    return (
        <PersonaForm 
            onSave={handleSave}
            onCancel={() => dispatch({ type: 'SET_VIEW', payload: 'persona_manager' })}
            formType="create"
        />
    );
}
