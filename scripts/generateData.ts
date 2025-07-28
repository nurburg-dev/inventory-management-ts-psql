import { faker } from "@faker-js/faker";
import { createWriteStream, readFileSync } from "fs";
import { join } from "path";
import { Command } from "commander";

interface FieldConfig {
  name: string;
  type: string;
  generator: string;
  options?: any;
  transform?: string;
}

interface SchemaConfig {
  tableName: string;
  fields: FieldConfig[];
}

function generateValue(field: FieldConfig): any {
  const [category, method] = field.generator.split(".");
  const fakerCategory = (faker as any)[category];

  if (!fakerCategory || !fakerCategory[method]) {
    throw new Error(`Unknown faker method: ${field.generator}`);
  }

  let value = field.options
    ? fakerCategory[method](field.options)
    : fakerCategory[method]();

  if (field.transform === "parseFloat") {
    value = parseFloat(value);
  }

  if (field.type === "string") {
    value = value.toString().replace(/'/g, "''");
  }

  return value;
}

function generateRow(schema: SchemaConfig): Record<string, any> {
  const row: Record<string, any> = {};

  for (const field of schema.fields) {
    row[field.name] = generateValue(field);
  }

  return row;
}

function generateData(options: {
  rows: number;
  format: "sql" | "csv" | "both";
  schema: string;
  output: string;
}) {
  const schemaPath = join(__dirname, `${options.schema}.json`);
  const schemaContent = JSON.parse(readFileSync(schemaPath, "utf8"));
  const schemaKey = Object.keys(schemaContent)[0];
  const schema: SchemaConfig = schemaContent[schemaKey];

  const BATCH_SIZE = 10000;
  const outputDir = join(__dirname, "../.nurburgdev");

  console.log(
    `Generating ${options.rows.toLocaleString()} rows for ${
      schema.tableName
    }...`
  );

  let sqlFile: any = null;
  let csvFile: any = null;

  if (options.format === "sql" || options.format === "both") {
    sqlFile = createWriteStream(join(outputDir, `${options.output}.sql`));
    sqlFile.write(`-- Generated ${schema.tableName} data\n`);

    const fieldNames = schema.fields.map((f) => f.name).join(", ");
    sqlFile.write(`INSERT INTO ${schema.tableName} (${fieldNames}) VALUES\n`);
  }

  if (options.format === "csv" || options.format === "both") {
    csvFile = createWriteStream(join(outputDir, `${options.output}.csv`));
    const headers = schema.fields.map((f) => f.name).join(",");
    csvFile.write(headers + "\n");
  }

  const startTime = Date.now();

  for (let i = 0; i < options.rows; i++) {
    const row = generateRow(schema);

    if (sqlFile) {
      const values = schema.fields
        .map((field) => {
          const value = row[field.name];
          return field.type === "string" ? `'${value}'` : value;
        })
        .join(", ");

      const sqlLine =
        i === options.rows - 1 ? `(${values});\n` : `(${values}),\n`;
      sqlFile.write(sqlLine);
    }

    if (csvFile) {
      const values = schema.fields
        .map((field) => {
          const value = row[field.name];
          return field.type === "string"
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(",");

      csvFile.write(values + "\n");
    }

    if ((i + 1) % BATCH_SIZE === 0) {
      const progress = (((i + 1) / options.rows) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `Progress: ${progress}% - ${(
          i + 1
        ).toLocaleString()} rows - Elapsed: ${elapsed}s`
      );
    }
  }

  if (sqlFile) sqlFile.end();
  if (csvFile) csvFile.end();

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `\n✅ Successfully generated ${options.rows.toLocaleString()} rows in ${totalTime} seconds!`
  );
  console.log(`📁 Files created:`);

  if (options.format === "sql" || options.format === "both") {
    console.log(`   - .nurburgdev/${options.output}.sql`);
  }
  if (options.format === "csv" || options.format === "both") {
    console.log(`   - .nurburgdev/${options.output}.csv`);
  }
}

if (require.main === module) {
  const program = new Command();

  program
    .name("generate-data")
    .description("Generate fake data using configurable schemas")
    .option("-r, --rows <number>", "Number of rows to generate", "1000000")
    .option("-f, --format <type>", "Output format: sql, csv, or both", "both")
    .option("-s, --schema <name>", "Schema file name (without .json)", "schema")
    .option(
      "-o, --output <name>",
      "Output file name (without extension)",
      "items_data"
    )
    .parse();

  const options = program.opts();

  generateData({
    rows: parseInt(options.rows),
    format: options.format as "sql" | "csv" | "both",
    schema: options.schema,
    output: options.output,
  });
}
