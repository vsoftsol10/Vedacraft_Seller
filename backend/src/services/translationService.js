import { Translate } from "@google-cloud/translate/build/src/v2/index.js";

const hasCredentials = () => Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_TRANSLATE_API_KEY);
export const automaticTranslationAvailable = () => true;
export const warnIfTranslationDisabled = () => {};
const decodeEntities = (text) => String(text).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const translateViaFreeGoogle = async (text, sourceLang, targetLang) => {
  if (!text || !String(text).trim()) return text;
  const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang || "auto"}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
  if (!res.ok) throw new Error(`Translation request failed (${res.status})`);
  const data = await res.json();
  const translated = data?.[0]?.map((item) => item[0]).join("") || text;
  return decodeEntities(translated);
};

export const translateTexts = async ({ texts, sourceLang = "en", targetLang }) => {
  if (hasCredentials()) {
    try {
      const translate = new Translate(process.env.GOOGLE_TRANSLATE_API_KEY ? { key: process.env.GOOGLE_TRANSLATE_API_KEY } : undefined);
      const [translated] = await translate.translate(texts, { from: sourceLang, to: targetLang, format: "text" });
      return (Array.isArray(translated) ? translated : [translated]).map(decodeEntities);
    } catch (apiError) {
      console.warn("Official translation API failed, switching to fallback:", apiError.message);
    }
  }

  return Promise.all(texts.map((text) => translateViaFreeGoogle(text, sourceLang, targetLang)));
};
