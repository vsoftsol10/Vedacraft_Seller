import { Translate } from "@google-cloud/translate/build/src/v2/index.js";

const hasCredentials = () => Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_TRANSLATE_API_KEY);
let warned = false;
export const automaticTranslationAvailable = () => hasCredentials();
export const warnIfTranslationDisabled = () => { if (!hasCredentials() && !warned) { warned = true; console.warn("Automatic product translation is disabled: configure Google Translation credentials."); } };
const decodeEntities = (text) => String(text).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
export const translateTexts = async ({ texts, sourceLang, targetLang }) => {
  if (!hasCredentials()) { const error = new Error("Automatic translation is not set up"); error.code = "TRANSLATION_DISABLED"; throw error; }
  const translate = new Translate(process.env.GOOGLE_TRANSLATE_API_KEY ? { key: process.env.GOOGLE_TRANSLATE_API_KEY } : undefined);
  const [translated] = await translate.translate(texts, { from: sourceLang, to: targetLang, format: "text" });
  return (Array.isArray(translated) ? translated : [translated]).map(decodeEntities);
};
