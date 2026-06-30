export type UserRole = 'ADMIN' | 'PROMOTER'

export interface User {
  id: number
  nombre: string
  email: string
  rol: UserRole
  sectores?: string[]
}

export interface Citizen {
  id: number
  nombreCompleto: string
  cedula: string
  telefono: string
  edad?: number
  sexo?: string
  sector?: string
  votaEnSanCristobal: boolean
  whatsappUpdates: boolean
  voluntario: boolean
  nivelApoyo: NivelApoyo
  prioridades: string
  problemaComunidad?: string
  scorePolit: number
  registradoPorId?: number
  registradoPor?: { id: number; nombre: string }
  referidoPorId?: number
  createdAt: string
  updatedAt: string
}

export type NivelApoyo = 'NEUTRAL' | 'SIMPATIZANTE' | 'APOYA' | 'MUY_COMPROMETIDO' | 'LIDER_COMUNITARIO'

export const NIVEL_APOYO_LABELS: Record<NivelApoyo, string> = {
  NEUTRAL: 'Neutral',
  SIMPATIZANTE: 'Simpatizante',
  APOYA: 'Apoya',
  MUY_COMPROMETIDO: 'Muy Comprometido',
  LIDER_COMUNITARIO: 'Líder Comunitario',
}

export const NIVEL_APOYO_COLORS: Record<NivelApoyo, string> = {
  NEUTRAL: 'badge-blue',
  SIMPATIZANTE: 'badge-yellow',
  APOYA: 'badge-green',
  MUY_COMPROMETIDO: 'badge-purple',
  LIDER_COMUNITARIO: 'badge-red',
}

export const PRIORIDADES_OPCIONES = [
  'Empleo',
  'Limpieza de la ciudad',
  'Seguridad ciudadana',
  'Agua potable',
  'Arreglo de calles',
  'Juventud',
  'Deportes',
  'Cultura',
  'Transporte',
  'Desarrollo urbano',
  'Otra',
]

export interface PublicStats {
  total: number
  meta: number
  slogan: string
  registroPublicoActivo: boolean
  prioridades: { nombre: string; count: number }[]
  sectoresTop: { sector: string; count: number }[]
  comentariosRecientes: { nombreCompleto: string; sector: string; problemaComunidad: string; createdAt: string }[]
}

export interface AdminStats {
  total: number
  hoy: number
  semana: number
  mes: number
  voluntarios: number
  promotores: number
  meta: number
  porcentajeMeta: number
  dailyGrowth: { date: string; count: number }[]
  porSector: { sector: string; count: number }[]
  porNivel: { nivelApoyo: string; count: number }[]
  topPromotores: { id: number; nombre: string; count: number }[]
  prioridades: { nombre: string; count: number }[]
}

export interface Sector {
  id: number
  nombre: string
  ciudadanos: number
}
