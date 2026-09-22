/**
 * Tipos de datos para el inventario de equipos All in One y periféricos
 */

export type EstadoEquipo = 'Operativo' | 'En mantenimiento' | 'Dañado' | 'En bodega / Desuso';

export type TipoPeriferico = 'Mouse' | 'Teclado' | 'Diadema';

export interface Periferico {
  id?: number;
  equipo_id?: number;
  tipo: TipoPeriferico;
  numero_activo: string;
  estado_actual: EstadoEquipo;
}

export interface EquipoAllInOne {
  id?: number;
  numero_activo: string;
  marca: string;
  numero_serie: string;
  estado_actual: EstadoEquipo;
  responsable: string;
  departamento: string;
  imagen_url?: string;
  notas?: string;
  created_at?: string;
  updated_at?: string;
  perifericos?: Periferico[];
}

export interface InventoryStats {
  totalEquipos: number;
  operativos: number;
  enMantenimiento: number;
  danados: number;
  enBodega: number;
  totalPerifericos: number;
  departamentosCount: Record<string, number>;
  marcasCount: Record<string, number>;
}

export interface DatabaseStatus {
  engine: 'sqlite' | 'mysql';
  status: 'active' | 'connected' | 'error';
  isCloud: boolean;
  message: string;
  details?: {
    connected: boolean;
    version?: string;
    database?: string;
    current_user?: string;
    host?: string;
  };
  error?: string;
}
