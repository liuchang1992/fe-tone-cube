const PRIVACY_DICTIONARY_KEY = 'toneCubePrivacyDictionaryV1';
const MAX_DICTIONARY_ITEMS = 100;
const MAX_TERM_LENGTH = 100;

const normalizeTerms = (values: unknown) => {
  if (!Array.isArray(values)) return [];
  const terms = values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length >= 2 && value.length <= MAX_TERM_LENGTH);
  return [...new Set(terms)].slice(0, MAX_DICTIONARY_ITEMS);
};

export const loadPrivacyDictionary = (): string[] => {
  try {
    const stored = window.localStorage.getItem(PRIVACY_DICTIONARY_KEY);
    return stored ? normalizeTerms(JSON.parse(stored)) : [];
  } catch {
    return [];
  }
};

export const savePrivacyDictionary = (terms: string[]): string[] => {
  const normalized = normalizeTerms(terms);
  try {
    window.localStorage.setItem(PRIVACY_DICTIONARY_KEY, JSON.stringify(normalized));
  } catch {
    // Private browsing or storage policies may disable persistence; current review still works.
  }
  return normalized;
};

export const addPrivacyDictionaryTerm = (terms: string[], value: string) => (
  savePrivacyDictionary([...terms, value])
);

export const removePrivacyDictionaryTerm = (terms: string[], value: string) => (
  savePrivacyDictionary(terms.filter((term) => term !== value))
);
