
"use client";

import type { Character, UserData, UserPersona, ChatSession } from '@/lib/types';
import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { updateUser, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { v4 as uuidv4 } from 'uuid';
import type { DashboardTab } from '@/app/_components/Dashboard';

type View = 'dashboard' | 'creating' | 'viewing' | 'creating_persona' | 'editing_persona';

export type Tone = 
  | "default" | "joyful" | "anxious" | "angry" | "serene" | "passionate" 
  | "apathetic" | "fearful" | "hopeful" | "jaded" | "enthusiastic" 
  | "grumpy" | "curious" | "confident" | "shy" | "ambitious" | "content" 
  | "bitter" | "loving" | "resentful" | "brave" | "timid" | "arrogant" 
  | "humble" | "playful" | "reserved";

export type Settings = {
  aiTone: Tone;
  aiCharLimit: number;
}

type State = {
  characters: Character[];
  selectedCharacterId: string | null;
  view: View;
  isGenerating: boolean;
  isLoading: boolean;
  settings: Settings;
  userPersonas: UserPersona[];
  activePersonaId: string | null;
  selectedPersonaIdToEdit: string | null;
  activeTab: DashboardTab;
};

type Action =
  | { type: 'ADD_CHARACTER'; payload: Character }
  | { type: 'UPDATE_CHARACTER'; payload: Partial<Character> & { id: string } }
  | { type: 'DELETE_CHARACTER'; payload: string }
  | { type: 'SELECT_CHARACTER'; payload: string | null }
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'SET_IS_GENERATING', payload: boolean }
  | { type: 'SET_IS_LOADING', payload: boolean }
  | { type: 'LOAD_SETTINGS', payload: Partial<Settings> }
  | { type: 'SET_AI_TONE', payload: Tone }
  | { type: 'SET_AI_CHAR_LIMIT', payload: number }
  | { type: 'SET_USER_PERSONAS', payload: UserPersona[] }
  | { type: 'SET_ACTIVE_PERSONA', payload: string | null }
  | { type: 'SET_CHARACTERS', payload: Character[] }
  | { type: 'EDIT_PERSONA', payload: string | null }
  | { type: 'RESET_STATE' }
  | { type: 'SET_ACTIVE_TAB', payload: DashboardTab };


const initialState: State = {
  characters: [],
  selectedCharacterId: null,
  view: 'dashboard',
  isGenerating: false,
  isLoading: true,
  settings: {
    aiTone: 'default',
    aiCharLimit: 1000,
  },
  userPersonas: [],
  activePersonaId: null,
  selectedPersonaIdToEdit: null,
  activeTab: 'characters',
};

const CharacterContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

function characterReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
        return { ...state, activeTab: action.payload };
    case 'LOAD_SETTINGS':
        const loadedSettings = action.payload;
        return { ...state, settings: { ...state.settings, ...loadedSettings }};
    case 'SET_CHARACTERS':
        const characters = action.payload;
        let newView = state.view;
        let newSelectedId = state.selectedCharacterId;

        if (state.isLoading && characters.length > 0) {
          newView = 'dashboard';
          newSelectedId = null;
        } else if (characters.length === 0) {
          newView = 'dashboard';
          newSelectedId = null;
        } else if (!characters.some(c => c.id === state.selectedCharacterId)) {
          newSelectedId = null;
          newView = 'dashboard';
        }
        
        return { ...state, characters, view: newView, selectedCharacterId: newSelectedId, isLoading: false };
    case 'ADD_CHARACTER':
      const existing = state.characters.find(c => c.id === action.payload.id);
      if (existing) return state;
      return { 
        ...state, 
        characters: [...state.characters, action.payload],
      };
    case 'UPDATE_CHARACTER':
      return {
        ...state,
        characters: state.characters.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      };
    case 'DELETE_CHARACTER':
        const remainingCharacters = state.characters.filter(c => c.id !== action.payload);
        let deletedSelectedId = state.selectedCharacterId;
        let deletedView = state.view;

        if (state.selectedCharacterId === action.payload) {
            deletedSelectedId = null;
            deletedView = 'dashboard';
        }
      return {
        ...state,
        characters: remainingCharacters,
        selectedCharacterId: deletedSelectedId,
        view: deletedView,
      };
    case 'SELECT_CHARACTER':
      return {
        ...state,
        selectedCharacterId: action.payload,
        view: action.payload ? 'viewing' : 'dashboard',
      };
    case 'SET_VIEW':
        if (action.payload === 'creating') {
            return { ...state, view: 'creating', selectedCharacterId: null };
        }
        if (action.payload === 'dashboard') {
            return { ...state, view: 'dashboard', selectedCharacterId: null };
        }
        return {
            ...state,
            view: action.payload,
        };
    case 'SET_IS_GENERATING':
      return { ...state, isGenerating: action.payload };
    case 'SET_IS_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_AI_TONE':
        return { ...state, settings: { ...state.settings, aiTone: action.payload }};
    case 'SET_AI_CHAR_LIMIT':
        return { ...state, settings: { ...state.settings, aiCharLimit: action.payload }};
    case 'SET_USER_PERSONAS':
        return { ...state, userPersonas: action.payload };
    case 'SET_ACTIVE_PERSONA':
        return { ...state, activePersonaId: action.payload };
    case 'EDIT_PERSONA':
        return { 
            ...state, 
            selectedPersonaIdToEdit: action.payload,
            view: action.payload ? 'editing_persona' : 'dashboard'
        };
    case 'RESET_STATE':
        return {...initialState, isLoading: false };
    default:
      return state;
  }
}

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(characterReducer, initialState);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user?.uid, firestore]);

  const { data: userData } = useDoc<UserData>(userDocRef);

  const charactersColRef = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'characters');
  }, [user?.uid, firestore]);

  const personasColRef = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'personas');
  }, [user?.uid, firestore]);


  // Load user data (settings) from Firestore
  useEffect(() => {
    if (userData) {
      if (userData.settings) {
        dispatch({ type: 'LOAD_SETTINGS', payload: userData.settings });
      }
      if (userData.activePersonaId) {
        dispatch({ type: 'SET_ACTIVE_PERSONA', payload: userData.activePersonaId });
      }
    }
  }, [userData]);


  // Subscribe to characters collection
  useEffect(() => {
    if (!user || !firestore || !charactersColRef) {
      if (!isUserLoading) {
        dispatch({ type: 'RESET_STATE' });
      }
      return;
    };
    
    dispatch({ type: 'SET_IS_LOADING', payload: true });
    
    const charactersUnsub = onSnapshot(charactersColRef, (snapshot) => {
      const characters: Character[] = [];
      snapshot.forEach(docSnap => {
          const characterData = docSnap.data() as Character;
          characters.push(characterData);
      });

      characters.sort((a, b) => a.name.localeCompare(b.name));
      
      dispatch({ type: 'SET_CHARACTERS', payload: characters });
    }, (error) => {
      console.error("Error listening to characters collection:", (error as Error).message);
      dispatch({ type: 'SET_IS_LOADING', payload: false });
    });

    return () => {
      charactersUnsub();
    };
  }, [user, isUserLoading, firestore, charactersColRef]);

  // Subscribe to personas collection
  useEffect(() => {
    if (!user || !firestore || !personasColRef) {
      return;
    }

    const personasUnsub = onSnapshot(personasColRef, (snapshot) => {
      const personas: UserPersona[] = [];
      snapshot.forEach(docSnap => {
        personas.push(docSnap.data() as UserPersona);
      });
      personas.sort((a, b) => a.name.localeCompare(b.name));
      dispatch({ type: 'SET_USER_PERSONAS', payload: personas });

      if (snapshot.empty && user) {
        const personaPlaceholder = PlaceHolderImages.find(img => img.id === 'persona-placeholder');
        const defaultPersonaId = "default";
        const defaultPersona: UserPersona = {
          id: defaultPersonaId,
          name: "Default",
          description: "A curious individual exploring the world of AI personas.",
          photoDataUri: personaPlaceholder?.imageUrl || '',
          isActive: true,
        };
        const personaRef = doc(firestore, `users/${user.uid}/personas/${defaultPersonaId}`);
        setDocumentNonBlocking(personaRef, defaultPersona, { merge: false });
        updateUser(firestore, user.uid, { activePersonaId: defaultPersonaId });
      } else if (personas.length > 0) {
          const activePersona = personas.find(p => p.isActive);
          if (!activePersona) {
              if (userData?.activePersonaId && personas.some(p => p.id === userData.activePersonaId)) {
                  dispatch({ type: 'SET_ACTIVE_PERSONA', payload: userData.activePersonaId });
              } else {
                  dispatch({ type: 'SET_ACTIVE_PERSONA', payload: personas[0].id });
              }
          } else {
               dispatch({ type: 'SET_ACTIVE_PERSONA', payload: activePersona.id });
          }
      }

    }, (error) => {
      console.error("Error listening to personas collection:", (error as Error).message);
    });
    return () => personasUnsub();
  }, [user, firestore, personasColRef, userData]);


  return (
    <CharacterContext.Provider value={{ state, dispatch }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}
