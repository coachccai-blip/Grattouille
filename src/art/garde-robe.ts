// Toute la garde-robe : les 24 articles du brief et les 28 suivants.

import { WARDROBE, type WardrobeArt } from "./wardrobe";
import { WARDROBE_2 } from "./wardrobe-2";
import { WARDROBE_3 } from "./wardrobe-3";

export const GARDE_ROBE: Record<string, WardrobeArt> = { ...WARDROBE, ...WARDROBE_2, ...WARDROBE_3 };
