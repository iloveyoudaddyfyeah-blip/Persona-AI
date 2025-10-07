
'use server';

import {
  generatePersonalityProfile,
  type GeneratePersonalityProfileInput,
  type GeneratePersonalityProfileOutput,
} from '@/ai/flows/generate-personality-profile';
import { modifyPersonalityProfile } from '@/ai/flows/modify-personality-profile';
import { interactiveChatWithCharacter } from '@/ai/flows/interactive-chat-with-character';
import { generateUserPersona } from '@/ai/flows/generate-user-persona';
import type { Character, ChatMessage, UserPersona } from '@/lib/types';
import { generateInitialChatMessage } from '@/ai_flows/generate-initial-chat-message';

function formatProfile(
  name: string,
  profileData: GeneratePersonalityProfileOutput
): string {
  const { 
    appearance,
    biography,
    significantRelationships,
    personality,
    motivations,
    fears,
    skillsAbilities,
    hobbiesInterests,
    likes,
    dislikes,
    dailyWear,
    backpackOrPockets,
    speechPatterns,
    age,
    height
   } = profileData;
   
  return `**Name:** ${name}
**Age:** ${age}
**Height:** ${height}
**Appearance:** ${appearance}

**Biography:**
- **Early Life:** ${biography.earlyLife}
- **Turning Points:** ${biography.turningPoints}
- **Education/Training:** ${biography.education}
- **Present Circumstances:** ${biography.presentCircumstances}

**Significant Relationships:**
${significantRelationships}

**Personality:**
- **Core Traits:** ${personality.coreTraits}
- **Flaws:** ${personality.flaws}
- **Quirks:** ${personality.quirks}
- **Values:** ${personality.values}

**Motivations:**
${motivations}

**Fears:**
${fears}

**Skills/Abilities:**
${skillsAbilities}

**Hobbies/Interests:**
${hobbiesInterests}

**Likes:**
- ${likes.join('\n- ')}

**Dislikes:**
- ${dislikes.join('\n- ')}

**Daily Wear:**
${dailyWear}

**Carried Items (Backpack/Pockets):**
${backpackOrPockets}

**Speech Patterns:**
${speechPatterns}
`;
}

export async function createCharacterFromPhoto(
  input: GeneratePersonalityProfileInput
): Promise<{ profileData: GeneratePersonalityProfileOutput; profile: string, initialMessage: string }> {
  const profileData = await generatePersonalityProfile(input);
  const profile = formatProfile(input.name, profileData);

  const { message: initialMessage } = await generateInitialChatMessage({
    characterName: input.name,
    characterProfile: profile,
  });

  return { profileData, profile, initialMessage };
}


export async function regenerateCharacterProfile(
  character: Character,
  prompt: string,
): Promise<Pick<Character, 'profile' | 'profileData'>> {
  if (!character.profileData) {
    throw new Error("Cannot regenerate a profile that doesn't have profileData.");
  }
  const newProfileData = await modifyPersonalityProfile({
    currentProfile: character.profileData,
    prompt,
  });
  const profile = formatProfile(character.name, newProfileData);
  
  return { profile, profileData: newProfileData };
}

export async function getChatResponse(
  character: Character,
  currentMessages: ChatMessage[],
  userPersona: UserPersona | null
): Promise<ChatMessage> {
  const personaDescription = userPersona?.description || 'A curious individual trying to get to know the characters.';
  
  const historyString = currentMessages
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Character'}: ${msg.content}`)
    .join('\n');
  
  const maxHistoryLength = 10000;
  const truncatedHistory = historyString.length > maxHistoryLength 
    ? historyString.slice(-maxHistoryLength) 
    : historyString;

  const lastMessage = currentMessages[currentMessages.length - 1];

  const { response } = await interactiveChatWithCharacter({
    characterProfile: character.profile,
    userMessage: lastMessage.role === 'user' ? lastMessage.content : 'Please continue your last thought.',
    chatHistory: truncatedHistory,
    userPersona: personaDescription,
  });

  // If the last user message was empty (a "continue" prompt), we append.
  if (lastMessage.role === 'user' && lastMessage.content === '') {
     return { role: 'character', content: response };
  }
  
  return { role: 'character', content: response };
}


export async function generatePersonaFromPrompt(prompt: string): Promise<string> {
  const { persona } = await generateUserPersona({ prompt });
  return persona;
}

    