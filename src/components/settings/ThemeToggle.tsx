
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useCharacter } from "@/context/CharacterContext"
import { Button } from "@/components/ui/button"
import { useUser, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useToast } from "@/hooks/use-toast"

export function ThemeToggle() {
  const { state, dispatch } = useCharacter()
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const toggleTheme = () => {
    const newTheme = state.settings.theme === "dark" ? "light" : "dark";
    
    // Optimistically update local state
    dispatch({ type: 'SET_THEME', payload: newTheme });

    // Save to Firestore if user is logged in
    if (user && firestore) {
      const updatedSettings = { ...state.settings, theme: newTheme };
      const userRef = doc(firestore, `users/${user.uid}`);
      setDocumentNonBlocking(userRef, { settings: updatedSettings }, { merge: true });
    } else {
       toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You must be logged in to save theme settings.",
      });
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
