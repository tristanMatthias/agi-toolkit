import knex, { Knex } from "knex";
import { v4 as uuid } from "uuid";
import { Container } from "@agi-toolkit//Container";
import { Module } from "@agi-toolkit//Module/Module";
import {
  ModuleData,
  ModuleDataCreateOptions,
  ModuleDataDeleteOptions,
  ModuleDataFindByIdOptions,
  ModuleDataQueryOptions,
  ModuleDataQueryResult,
  ModuleDataSizeOptions,
  ModuleDataUpdateOptions
} from "@agi-toolkit//types";
import createModels from "./createModels";

export interface SQLiteDataModuleConfig {
  database: string;
}


export default class extends Module implements ModuleData {
  name = "data";
  db: Knex;

  constructor(container: Container, config: SQLiteDataModuleConfig) {
    super(container);
    this.db = knex({
      client: "sqlite3",
      connection: { filename: config.database },
      useNullAsDefault: true
    });
  }

  async initialize() {
    await super.initialize();
    await createModels(this.db);
    this.container.ui.debug("Data", "Database initialized");
  }

  async destroy() {
    await super.destroy();
    await this.db.destroy();
  }

  async findById(opts: ModuleDataFindByIdOptions): Promise<ModuleDataQueryResult> {
    const [res] = await this.db(opts.entity).where({ id: opts.id });
    return { data: res };
  }

  async query(opts: ModuleDataQueryOptions): Promise<ModuleDataQueryResult> {
    const res = await this.db(opts.entity).where(opts.query);
    return { data: res };
  }

  async create(opts: ModuleDataCreateOptions): Promise<any> {
    if (!opts.data.id) opts.data.id = uuid();
    const res = await this.db(opts.entity)
      .returning("*")
      .insert(opts.data);
    return res[0];
  }

  async update(opts: ModuleDataUpdateOptions): Promise<any> {
    await this.db(opts.entity)
      .where({ id: opts.data.id })
      .returning("*")
      .update(opts.data);
    const { data } = await this.findById({ entity: opts.entity, id: opts.data.id });
    return data
  }

  async delete(opts: ModuleDataDeleteOptions): Promise<any> {
    throw new Error("Not Implemented");
  }

  async size(opts: ModuleDataSizeOptions): Promise<number> {
    const res = await this.db(opts.entity).count("* as count");
    return parseInt(res[0].count as string);
  }
}
