# Data Generation Scripts

This directory contains scripts to generate fake data for testing and development purposes.

## generateData.ts

A flexible data generation script that uses Faker.js to create realistic test data based on configurable schemas.

### Usage

```bash
# Basic usage (generates 1M rows in both SQL and CSV formats)
npm run generate-data

# Custom number of rows
npm run generate-data -- --rows 50000

# Generate only SQL file
npm run generate-data -- --format sql --rows 10000

# Generate only CSV file  
npm run generate-data -- --format csv --rows 10000

# Custom output filename
npm run generate-data -- --output my_test_data --rows 5000

# Use different schema
npm run generate-data -- --schema my_schema --rows 1000
```

### Command Line Options

- `-r, --rows <number>` - Number of rows to generate (default: 1000000)
- `-f, --format <type>` - Output format: `sql`, `csv`, or `both` (default: both)
- `-s, --schema <name>` - Schema file name without .json extension (default: schema)
- `-o, --output <name>` - Output file name without extension (default: items_data)

### Schema Configuration

Schemas are defined in JSON files that specify the table structure and data generation rules.

#### Default Schema (schema.json)

```json
{
  "items": {
    "tableName": "items",
    "fields": [
      {
        "name": "name",
        "type": "string",
        "generator": "commerce.productName"
      },
      {
        "name": "description",
        "type": "string", 
        "generator": "commerce.productDescription"
      },
      {
        "name": "quantity",
        "type": "number",
        "generator": "number.int",
        "options": { "min": 0, "max": 1000 }
      },
      {
        "name": "price",
        "type": "number",
        "generator": "commerce.price",
        "options": { "min": 1, "max": 5000, "dec": 2 },
        "transform": "parseFloat"
      },
      {
        "name": "category",
        "type": "string",
        "generator": "helpers.arrayElement",
        "options": ["Electronics", "Furniture", "Office Supplies", "Books", "Clothing"]
      }
    ]
  }
}
```

#### Creating Custom Schemas

1. Create a new JSON file in the `scripts/` directory
2. Define your table structure following the schema format
3. Use any Faker.js method as generators

**Field Properties:**
- `name` - Column name
- `type` - Data type (`string` or `number`)
- `generator` - Faker.js method (e.g., `person.firstName`, `date.past`)
- `options` - Parameters to pass to the Faker method (optional)
- `transform` - Post-processing function (`parseFloat` for numbers) (optional)

**Example Custom Schema (users.json):**
```json
{
  "users": {
    "tableName": "users",
    "fields": [
      {
        "name": "first_name",
        "type": "string",
        "generator": "person.firstName"
      },
      {
        "name": "email",
        "type": "string", 
        "generator": "internet.email"
      },
      {
        "name": "age",
        "type": "number",
        "generator": "number.int",
        "options": { "min": 18, "max": 80 }
      }
    ]
  }
}
```

### Output Files

Generated files are saved in the `.nurburgdev/` directory:

- **SQL files** - Contains INSERT statements ready for database import
- **CSV files** - Standard CSV format with headers for spreadsheet import

### Performance

- Processes data in batches of 10,000 rows for memory efficiency
- Shows progress updates during generation
- Optimized for large datasets (tested with 1M+ rows)

### Examples

```bash
# Generate 100K users in CSV format only
npm run generate-data -- --schema users --rows 100000 --format csv --output user_data

# Generate 50K items for testing  
npm run generate-data -- --rows 50000 --output test_items

# Quick 1K row sample
npm run generate-data -- --rows 1000 --output sample_data
```