import { z } from "zod";
import { getSupportedLanguages as getLanguages } from "../languages/index.js";
import type { LanguageInfo } from "../analyzer/types.js";

export const getSupportedLanguagesSchema = z.object({});

export function getSupportedLanguages(): { languages: LanguageInfo[] } {
  return { languages: getLanguages() };
}
