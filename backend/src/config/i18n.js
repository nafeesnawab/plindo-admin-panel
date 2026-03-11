import i18next from "i18next";
import Backend from "i18next-fs-backend";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const i18nReady = i18next.use(Backend).init({
	fallbackLng: "en",
	supportedLngs: ["en", "el", "ar", "ro", "ru"],
	nonExplicitSupportedLngs: true,
	preload: ["en", "el", "ar", "ro", "ru"],
	ns: ["translation"],
	defaultNS: "translation",
	backend: {
		loadPath: path.join(__dirname, "../../locales/{{lng}}/{{ns}}.json"),
	},
	interpolation: {
		escapeValue: false,
	},
	saveMissing: false,
	updateMissing: false,
	load: "languageOnly",
	cleanCode: true,
	ignoreJSONStructure: true,
});

export default i18next;
