
"use client";

import type { Character, ChatMessage, UserData, UserPersona } from '@/lib/types';
import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase';
import { collection, onSnapshot, Query, doc } from 'firebase/firestore';

type View = 'welcome' | 'creating' | 'viewing';

export type Tone = "default" | "witty" | "serious" | "whimsical" | "poetic" | "epic" | "noir" | "comedic" | "dramatic" | "sarcastic" | "inspirational";

export type Settings = {
  theme: "light" | "dark";
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
};

type Action =
  | { type: 'ADD_CHARACTER'; payload: Character }
  | { type: 'UPDATE_CHARACTER'; payload: Partial<Character> & { id: string } }
  | { type: 'DELETE_CHARACTER'; payload: string }
  | { type: 'SELECT_CHARACTER'; payload: string | null }
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'ADD_MESSAGE'; payload: { characterId: string; message: ChatMessage } }
  | { type: 'SET_IS_GENERATING', payload: boolean }
  | { type: 'SET_IS_LOADING', payload: boolean }
  | { type: 'LOAD_SETTINGS', payload: Partial<Settings> }
  | { type: 'SET_THEME', payload: Settings['theme'] }
  | { type: 'SET_AI_TONE', payload: Tone }
  | { type: 'SET_AI_CHAR_LIMIT', payload: number }
  | { type: 'SET_USER_PERSONAS', payload: UserPersona[] }
  | { type: 'SET_ACTIVE_PERSONA', payload: string | null }
  | { type: 'SET_CHARACTERS', payload: Character[] }
  | { type: 'RESET_STATE' };


const initialState: State = {
  characters: [],
  selectedCharacterId: null,
  view: 'welcome',
  isGenerating: false,
  isLoading: true,
  settings: {
    theme: 'dark',
    aiTone: 'default',
    aiCharLimit: 3000,
  },
  userPersonas: [],
  activePersonaId: null,
};

const CharacterContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

function characterReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_SETTINGS':
        const loadedSettings = action.payload;
        // When loading, default to dark if theme is system
        if (loadedSettings && (loadedSettings.theme as any) === 'system') {
            loadedSettings.theme = 'dark';
        }
        return { ...state, settings: { ...state.settings, ...loadedSettings }};
    case 'SET_CHARACTERS':
        const characters = action.payload;
        let newView = state.view;

        // If the current view is 'welcome' and characters are loaded, switch to 'viewing'
        if (state.view === 'welcome' && characters.length > 0) {
          newView = 'viewing';
          if (!state.selectedCharacterId) {
            return {
                ...state,
                characters,
                selectedCharacterId: characters[0].id,
                view: 'viewing',
                isLoading: false,
            };
          }
        } else if (characters.length === 0) {
          // If all characters are deleted, go back to welcome
          return {
            ...state,
            characters: [],
            selectedCharacterId: null,
            view: 'welcome',
            isLoading: false,
          }
        }
        
        return { ...state, characters, view: newView, isLoading: false };
    case 'ADD_CHARACTER':
      const existing = state.characters.find(c => c.id === action.payload.id);
      if (existing) return state; // Prevent duplicates from snapshot listeners
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
            if (remainingCharacters.length > 0) {
                deletedSelectedId = remainingCharacters[0].id;
                deletedView = 'viewing';
            } else {
                deletedSelectedId = null;
                deletedView = 'welcome';
            }
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
        view: action.payload ? 'viewing' : state.view,
      };
    case 'SET_VIEW':
        if (action.payload === 'creating') {
            return { ...state, view: 'creating', selectedCharacterId: null };
        }
        return {
            ...state,
            view: action.payload,
        };
    case 'ADD_MESSAGE':
      return {
        ...state,
        characters: state.characters.map(c =>
          c.id === action.payload.characterId
            ? { ...c, chatHistory: [...(c.chatHistory || []), action.payload.message] }
            : c
        ),
      };
    case 'SET_IS_GENERATING':
      return { ...state, isGenerating: action.payload };
    case 'SET_IS_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_THEME':
        return { ...state, settings: { ...state.settings, theme: action.payload }};
    case 'SET_AI_TONE':
        return { ...state, settings: { ...state.settings, aiTone: action.payload }};
    case 'SET_AI_CHAR_LIMIT':
        return { ...state, settings: { ...state.settings, aiCharLimit: action.payload }};
    case 'SET_USER_PERSONAS':
        const personas = action.payload;
        let activeId = state.activePersonaId;
        if (!activeId && personas.length > 0) {
            activeId = personas.find(p => p.isActive)?.id || personas[0].id;
        } else if (personas.length === 0) {
            activeId = null;
        }
        return { ...state, userPersonas: personas, activePersonaId: activeId };
    case 'SET_ACTIVE_PERSONA':
        return { ...state, activePersonaId: action.payload };
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
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userData } = useDoc<UserData>(userDocRef);

  const charactersColRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'characters');
  }, [user, firestore]);

  const personasColRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'personas');
  }, [user, firestore]);


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
    if (user && firestore) {
      dispatch({ type: 'SET_IS_LOADING', payload: true });
      
      const charactersUnsub = charactersColRef ? onSnapshot(charactersColRef as Query, (snapshot) => {
        const characters: Character[] = [];
        snapshot.forEach(doc => {
            characters.push(doc.data() as Character);
        });

        characters.sort((a, b) => a.name.localeCompare(b.name));
        
        dispatch({ type: 'SET_CHARACTERS', payload: characters });
      }, (error) => {
        console.error("Error listening to characters collection:", error);
        dispatch({ type: 'SET_IS_LOADING', payload: false });
      }) : () => {};

      return () => {
        charactersUnsub();
      };
    } else if (!isUserLoading) {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [user, isUserLoading, firestore, charactersColRef]);

  // Subscribe to personas collection
  useEffect(() => {
    if (user && firestore && personasColRef) {
      const personasUnsub = onSnapshot(personasColRef, (snapshot) => {
        const personas: UserPersona[] = [];
        snapshot.forEach(doc => {
          personas.push(doc.data() as UserPersona);
        });
        personas.sort((a, b) => a.name.localeCompare(b.name));
        dispatch({ type: 'SET_USER_PERSONAS', payload: personas });
      }, (error) => {
        console.error("Error listening to personas collection:", error);
      });
      return () => personasUnsub();
    }
  }, [user, firestore, personasColRef]);


  // Apply theme to HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (state.settings.theme !== 'system') {
        root.classList.add(state.settings.theme);
    } else {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
    }
  }, [state.settings.theme]);


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
