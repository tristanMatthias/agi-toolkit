export interface ModuleMemory {
  create(opts: ModuleMemoryCreateOptions): Promise<any>;
  findById(opts: ModuleMemoryFindByIdOptions): Promise<any>;
  query(opts: ModuleMemoryQueryOptions): Promise<ModuleMemoryQueryResult>;
  update(opts: ModuleMemoryUpdateOptions): Promise<any>;
  delete(opts: ModuleMemoryDeleteOptions): Promise<any>;
  size(opts: ModuleMemorySizeOptions): Promise<number>;
}

export interface ModuleMemoryCreateOptions {
  entity: string;
  data: any;
}

export interface ModuleMemoryFindByIdOptions {
  entity: string;
  id: any;
}

export interface ModuleMemoryQueryOptions {
  entity: string;
  query: any;
  limit?: number;
  sort?: {
    [key: string]: "asc" | "desc";
  }
}

export interface ModuleMemoryQueryResult {
  data: any[];
  // total: number;
}

export interface ModuleMemoryUpdateOptions {
  entity: string;
  data: any;
}

export interface ModuleMemoryDeleteOptions {
  entity: string;
  id: any;
}

export interface ModuleMemorySizeOptions {
  entity: string;
}
