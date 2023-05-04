export interface ModuleData {
  create(opts: ModuleDataCreateOptions): Promise<any>;
  findById(opts: ModuleDataFindByIdOptions): Promise<any>;
  query(opts: ModuleDataQueryOptions): Promise<ModuleDataQueryResult>;
  update(opts: ModuleDataUpdateOptions): Promise<any>;
  delete(opts: ModuleDataDeleteOptions): Promise<any>;
  size(opts: ModuleDataSizeOptions): Promise<number>;
}

export interface ModuleDataCreateOptions {
  entity: string;
  data: any;
}

export interface ModuleDataFindByIdOptions {
  entity: string;
  id: any;
}

export interface ModuleDataQueryOptions {
  entity: string;
  query: any;
  limit?: number;
  sort?: {
    [key: string]: "asc" | "desc";
  }
}

export interface ModuleDataQueryResult {
  data: any[];
  // total: number;
}

export interface ModuleDataUpdateOptions {
  entity: string;
  data: any;
}

export interface ModuleDataDeleteOptions {
  entity: string;
  id: any;
}

export interface ModuleDataSizeOptions {
  entity: string;
  query?: any;
}
