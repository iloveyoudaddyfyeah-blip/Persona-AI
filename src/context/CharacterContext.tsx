
"use client";

import type { Character, ChatMessage } from '@/lib/types';
import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';

type View = 'welcome' | 'creating' | 'viewing';

type State = {
  characters: Character[];
  selectedCharacterId: string | null;
  view: View;
  isGenerating: boolean;
};

type Action =
  | { type: 'ADD_CHARACTER'; payload: Character }
  | { type: 'UPDATE_CHARACTER'; payload: Character }
  | { type: 'DELETE_CHARACTER'; payload: string }
  | { type: 'SELECT_CHARACTER'; payload: string | null }
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'ADD_MESSAGE'; payload: { characterId: string; message: ChatMessage } }
  | { type: 'SET_IS_GENERATING', payload: boolean }
  | { type: 'LOAD_CHARACTERS', payload: Character[] };

const initialState: State = {
  characters: [],
  selectedCharacterId: null,
  view: 'welcome',
  isGenerating: false,
};

const CharacterContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

function characterReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_CHARACTERS':
      return { ...state, characters: action.payload };
    case 'ADD_CHARACTER':
      return { ...state, characters: [...state.characters, action.payload] };
    case 'UPDATE_CHARACTER':
      return {
        ...state,
        characters: state.characters.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CHARACTER':
      return {
        ...state,
        characters: state.characters.filter(c => c.id !== action.payload),
        selectedCharacterId: state.selectedCharacterId === action.payload ? null : state.selectedCharacterId,
        view: state.selectedCharacterId === action.payload ? 'welcome' : state.view,
      };
    case 'SELECT_CHARACTER':
      return {
        ...state,
        selectedCharacterId: action.payload,
        view: action.payload ? 'viewing' : 'welcome',
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
    default:
      return state;
  }
}

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(characterReducer, initialState);

  useEffect(() => {
    try {
      const storedCharacters = localStorage.getItem('personaCraftCharacters');
      if (storedCharacters) {
        const characters: Character[] = JSON.parse(storedCharacters);
        dispatch({ type: 'LOAD_CHARACTERS', payload: characters });
        if (characters.length > 0 && !state.selectedCharacterId) {
            dispatch({ type: 'SELECT_CHARACTER', payload: characters[0].id });
        }
      }
    } catch (error) {
      console.error("Failed to load characters from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      if (state.characters.length > 0) {
        localStorage.setItem('personaCraftCharacters', JSON.stringify(state.characters));
      } else {
        localStorage.removeItem('personaCraftCharacters');
      }
    } catch (error) {
      console.error("Failed to save characters to localStorage", error);
    }
  }, [state.characters]);


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
