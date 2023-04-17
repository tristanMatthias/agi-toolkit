import fs from "fs";
import { Knex } from "knex";
import path from "path";


const modelPath = path.join(process.cwd(), "models");

interface Model {
  [key: string]: string | ModelField;
}

interface ModelField {
  type: string;
  primary?: boolean;
  nullable?: boolean;
  unique?: boolean;
  ref?: string;
}

export default async (db: Knex) => {

  // Loop over all files in the models directory and import them
  const models = fs.readdirSync(modelPath).reduce<Record<string, Model>>((models, file) => {
    if (file.endsWith(".json")) {
      models[file.replace(".json", "")] = require(path.join(modelPath, file));
    }
    return models;
  }, {});


  // Loop over all models and create a table for each one
  const creations = Object.keys(models).map(async (model) => {
    if (await db.schema.hasTable(model)) return Promise.resolve();

    await db.schema.createTable(model, (table) => {
      const uniqueFields: string[] = [];
      const createField = (field: string, fieldData: ModelField) => {
        const type = fieldData.type as keyof typeof table;

        const f: Knex.ColumnBuilder = (table[type] as any)(field);

        if (fieldData.primary) f.primary();
        if (fieldData.nullable) f.nullable();
        if (fieldData.unique) uniqueFields.push(field);
        if (fieldData.ref) table.foreign(field).references(fieldData.ref);
      }

      Object.keys(models[model]).forEach((field) => {
        const fieldData = models[model][field];
        // If the field is a string, it's a type
        if (typeof fieldData == "string") createField(field, { type: fieldData });
        // Otherwise, it's an object with more data
        else createField(field, fieldData);
      });
    });
  });

  await Promise.all(creations);
}
