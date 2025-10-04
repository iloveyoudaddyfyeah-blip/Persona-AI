
"use client";

import type { Character, ChatMessage } from '@/lib/types';
import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { useAuth } from '@/firebase/auth';
import { collection, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

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
        let newSelectedId = state.selectedCharacterId;
        let newView = state.view;

        if (!characters.find(c => c.id === newSelectedId)) {
            newSelectedId = characters.length > 0 ? characters[0].id : null;
        }

        if (characters.length > 0) {
            newView = 'viewing';
        } else {
            newView = 'welcome';
        }

        return { ...state, characters, selectedCharacterId: newSelectedId, view: newView, isLoading: false };
    case 'ADD_CHARACTER':
      return { 
        ...state, 
        characters: [...state.characters, action.payload],
        view: 'viewing' 
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
        return initialState;
    default:
      return state;
  }
}

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(characterReducer, initialState);
  const { user, loading: authLoading } = useAuth();

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
    if (user) {
      dispatch({ type: 'SET_IS_LOADING', payload: true });

      const userDocRef = doc(db, 'users', user.uid);
      const userUnsub = onSnapshot(userDocRef, (doc) => {
        const userData = doc.data();
        if (userData?.persona) {
          dispatch({ type: 'SET_USER_PERSONA', payload: userData.persona });
        }
      });
      
      const charactersColRef = collection(db, 'users', user.uid, 'characters');
      const charactersUnsub = onSnapshot(charactersColRef, (snapshot) => {
        const characters = snapshot.docs.map(doc => doc.data() as Character);
        dispatch({ type: 'SET_CHARACTERS', payload: characters });
      });

      return () => {
        userUnsub();
        charactersUnsub();
      };
    } else if (!authLoading) {
      dispatch({ type: 'RESET_STATE' });
      dispatch({ type: 'SET_IS_LOADING', payload: false });
    }
  }, [user, authLoading]);

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
