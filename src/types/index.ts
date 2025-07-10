// Tipos principais do sistema de gamificação

export interface User {
  id?: string;
  nome: string;
  senha: string;
  tipo: 'Usuário' | 'Administrador';
  pontos: number;
}

export interface Task {
  id: string;
  titulo: string;
  descricao: string;
  pontos: number;
  criador?: string;
}

export interface Reward {
  id: string;
  nome: string;
  descricao: string;
  custo: number;
}

export interface HistoryItem {
  usuario: string;
  data: string;
  tipo: 'Tarefa Concluída' | 'Prêmio Resgatado';
  descricao: string;
  pontos: string;
}

export interface RankingItem {
  nome: string;
  pontos: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pontos?: number;
  tipo?: string;
}

export interface AppState {
  user: User | null;
  userPoints: number;
  userType: 'Usuário' | 'Administrador' | null;
}

export type UserFormMode = 'create' | 'edit';

export interface ComponentProps {
  appState: AppState;
  onStateChange: (newState: Partial<AppState>) => void;
}
