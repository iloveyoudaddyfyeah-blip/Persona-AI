
"use client";

import type { Character, ChatMessage } from '@/lib/types';
import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';

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
  settings: Settings;
};

type Action =
  | { type: 'ADD_CHARACTER'; payload: Character }
  | { type: 'UPDATE_CHARACTER'; payload: Character }
  | { type: 'DELETE_CHARACTER'; payload: string }
  | { type: 'SELECT_CHARACTER'; payload: string | null }
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'ADD_MESSAGE'; payload: { characterId: string; message: ChatMessage } }
  | { type: 'SET_IS_GENERATING', payload: boolean }
  | { type: 'LOAD_STATE', payload: Partial<State> }
  | { type: 'SET_THEME', payload: Settings['theme'] }
  | { type: 'SET_AI_TONE', payload: Tone }
  | { type: 'SET_AI_CHAR_LIMIT', payload: number };

const initialState: State = {
  characters: [],
  selectedCharacterId: null,
  view: 'welcome',
  isGenerating: false,
  settings: {
    theme: 'dark',
    aiTone: 'default',
    aiCharLimit: 3000,
  }
};

const CharacterContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

function characterReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_STATE':
        const characters = action.payload.characters || [];
        // When loading, default to dark if theme is system
        const loadedSettings = action.payload.settings;
        if (loadedSettings && (loadedSettings.theme as any) === 'system') {
            loadedSettings.theme = 'dark';
        }
        
        const newState: State = { ...state, ...action.payload, settings: { ...state.settings, ...loadedSettings } };

        if (characters.length > 0 && !newState.selectedCharacterId) {
            const firstId = characters[0].id;
            newState.selectedCharacterId = firstId;
            newState.view = 'viewing';
        } else if (characters.length === 0) {
            newState.view = 'welcome';
        }
        return newState;
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
        let newSelectedId = state.selectedCharacterId;
        let newView = state.view;

        if (state.selectedCharacterId === action.payload) {
            if (remainingCharacters.length > 0) {
                newSelectedId = remainingCharacters[0].id;
                newView = 'viewing';
            } else {
                newSelectedId = null;
                newView = 'welcome';
            }
        }
      return {
        ...state,
        characters: remainingCharacters,
        selectedCharacterId: newSelectedId,
        view: newView,
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
            ? { ...c, chatHistory: [...c.chatHistory, action.payload.message] }
            : c
        ),
      };
    case 'SET_IS_GENERATING':
      return { ...state, isGenerating: action.payload };
    case 'SET_THEME':
        return { ...state, settings: { ...state.settings, theme: action.payload }};
    case 'SET_AI_TONE':
        return { ...state, settings: { ...state.settings, aiTone: action.payload }};
    case 'SET_AI_CHAR_LIMIT':
        return { ...state, settings: { ...state.settings, aiCharLimit: action.payload }};
    default:
      return state;
  }
}

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(characterReducer, initialState);

  useEffect(() => {
    try {
      const storedState = localStorage.getItem('personaCraftState');
      if (storedState) {
        const loadedState = JSON.parse(storedState);
        // Add migration for old data structure
        if (Array.isArray(loadedState)) {
             dispatch({ type: 'LOAD_STATE', payload: { characters: loadedState } });
        } else {
             dispatch({ type: 'LOAD_STATE', payload: loadedState });
        }
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
        const stateToSave = {
            characters: state.characters,
            settings: state.settings,
            selectedCharacterId: state.selectedCharacterId,
        };
      localStorage.setItem('personaCraftState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [state.characters, state.settings, state.selectedCharacterId]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(state.settings.theme);
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
