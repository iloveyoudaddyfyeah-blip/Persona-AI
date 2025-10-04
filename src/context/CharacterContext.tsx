
"use client";

import type { Character, ChatMessage } from '@/lib/types';
import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase';
import { collection, onSnapshot, Query, doc } from 'firebase/firestore';

type View = 'welcome' | 'creating' | 'viewing';

export type Tone = "default" | "witty" | "serious" | "whimsical" | "poetic";

type Settings = {
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
  userPersona: string;
};

type Action =
  | { type: 'ADD_CHARACTER'; payload: Character }
  | { type: 'UPDATE_CHARACTER'; payload: Character }
  | { type: 'DELETE_CHARACTER'; payload: string }
  | { type: 'SELECT_CHARACTER'; payload: string | null }
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'ADD_MESSAGE'; payload: { characterId: string; message: ChatMessage } }
  | { type: 'SET_IS_GENERATING', payload: boolean }
  | { type: 'SET_IS_LOADING', payload: boolean }
  | { type: 'LOAD_STATE', payload: Partial<State> }
  | { type: 'SET_THEME', payload: Settings['theme'] }
  | { type: 'SET_AI_TONE', payload: Tone }
  | { type: 'SET_AI_CHAR_LIMIT', payload: number }
  | { type: 'SET_USER_PERSONA', payload: string }
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
  userPersona: 'A curious individual trying to get to know the characters.',
};

const CharacterContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

function characterReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_STATE':
        const loadedState = action.payload;
        // When loading, default to dark if theme is system
        const loadedSettings = loadedState.settings;
        if (loadedSettings && (loadedSettings.theme as any) === 'system') {
            loadedSettings.theme = 'dark';
        }
        return { ...state, ...loadedState, settings: { ...state.settings, ...loadedSettings }};
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
          c.id === action.payload.id ? action.payload : c
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
      return { ...state, view: action.payload };
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
    case 'SET_USER_PERSONA':
        return { ...state, userPersona: action.payload };
    case 'RESET_STATE':
        return {...initialState, isLoading: false, settings: state.settings};
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

  const { data: userData } = useDoc<{persona: string}>(userDocRef);

  const charactersColRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'characters');
  }, [user, firestore]);

  useEffect(() => {
    if (userData && userData.persona) {
      dispatch({ type: 'SET_USER_PERSONA', payload: userData.persona });
    }
  }, [userData]);


  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('personaCraftSettings');
      if (storedSettings) {
        const loadedSettings = JSON.parse(storedSettings);
         dispatch({ type: 'LOAD_STATE', payload: { settings: loadedSettings } });
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage", error);
    }
  }, []);
  
  useEffect(() => {
    if (user && firestore) {
      dispatch({ type: 'SET_IS_LOADING', payload: true });
      
      const charactersUnsub = charactersColRef ? onSnapshot(charactersColRef as Query, (snapshot) => {
        const characters: Character[] = [];
        snapshot.forEach(doc => {
            characters.push(doc.data() as Character);
        });

        // Sort characters by name, or any other property
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

  useEffect(() => {
    try {
      localStorage.setItem('personaCraftSettings', JSON.stringify(state.settings));
    } catch (error) {
      console.error("Failed to save settings to localStorage", error);
    }
  }, [state.settings]);

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
