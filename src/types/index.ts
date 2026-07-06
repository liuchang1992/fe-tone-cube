export interface AppState {
  inputText: string;
  outputText: string;
  selectedStyle: string;
  isLoading: boolean;
  error: string | null;
  remainingQuota: number;
}