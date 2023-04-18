import knex from "knex";
import { v4 as uuid } from "uuid";
import { Module } from "../../../toolkit/typescript/Module";
import { registerPost } from '../../../toolkit/typescript/lib/registerPath';
import {
  ModuleMemory,
  ModuleMemoryCreateOptions,
  ModuleMemoryDeleteOptions,
  ModuleMemoryFindByIdOptions,
  ModuleMemoryQueryOptions,
  ModuleMemoryQueryResult,
  ModuleMemorySizeOptions,
  ModuleMemoryUpdateOptions
} from "../../../toolkit/typescript/types";
import createModels from "./createModels";

export default class extends Module implements ModuleMemory {
  name = "memory";

  db = knex({
    client: "sqlite3",
    connection: {
      filename: this.toolkit.config.modules.memory.database,
    },
    useNullAsDefault: true
  });

  async initialize() {
    await createModels(this.db);
    this.toolkit.ui.debug("Memory", "Database initialized");
  }

  @registerPost("/findById")
  async findById(opts: ModuleMemoryFindByIdOptions): Promise<ModuleMemoryQueryResult> {
    const [res] = await this.db(opts.entity).where({ id: opts.id });
    return { data: res };
  }

  @registerPost("/query")
  async query(opts: ModuleMemoryQueryOptions): Promise<ModuleMemoryQueryResult> {
    const res = await this.db(opts.entity).where(opts.query);
    return { data: res };
  }

  @registerPost("/create")
  async create(opts: ModuleMemoryCreateOptions): Promise<any> {
    if (!opts.data.id) opts.data.id = uuid();
    const res = await this.db(opts.entity)
      .returning("*")
      .insert(opts.data);
    return res[0];
  }

  @registerPost("/update")
  async update(opts: ModuleMemoryUpdateOptions): Promise<any> {
    await this.db(opts.entity)
      .where({ id: opts.data.id })
      .returning("*")
      .update(opts.data);
    const { data } = await this.findById({ entity: opts.entity, id: opts.data.id });
    return data
  }

  @registerPost("/delete")
  async delete(opts: ModuleMemoryDeleteOptions): Promise<any> {
    throw new Error("Not Implemented");
  }

  @registerPost("/size")
  async size(opts: ModuleMemorySizeOptions): Promise<number> {
    const res = await this.db(opts.entity).count("* as count");
    return parseInt(res[0].count as string);
  }
}
