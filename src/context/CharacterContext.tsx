
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
      const characters = action.payload;
      const newState = { ...state, characters };
      if (characters.length > 0 && !state.selectedCharacterId) {
        // Find the first character that might not have profileData and fix it
        const selectedId = characters[0].id;
        const selectedChar = characters.find(c => c.id === selectedId);
        if (selectedChar && !selectedChar.profileData) {
            console.warn(`Character ${selectedId} is missing profileData. This might cause issues with regeneration.`);
        }

        newState.selectedCharacterId = selectedId;
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
