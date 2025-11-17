/* eslint-disable prettier/prettier */
import path from "path";
import fs from "fs/promises";
import { load } from "js-yaml";
import pointer from "json-pointer";
import type { OpenAPIV3 } from "openapi-types";
import { GenerateSchemaFileCommand } from "../types";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const OpenAPISchemaValidator = require("openapi-schema-validator").default;

const validateOpenAPISpecification = async (
  filePath: string,
): Promise<boolean> => {
  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const openAPISpecification = (await load(
      fileContent,
    )) as OpenAPIV3.Document;

    const validator = new OpenAPISchemaValidator({ version: 3 });
    const result = validator.validate(openAPISpecification);

    if (result.errors.length > 0) return false;

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const generateSchemaFile = async ({
  schemaName,
  outputFolder,
  filePath,
}: GenerateSchemaFileCommand): Promise<void> => {
  const fileContent = await fs.readFile(filePath, "utf8");
  const openAPISpecification = (await load(fileContent)) as OpenAPIV3.Document;

  const definition = openAPISpecification!.components!.schemas![schemaName];
  const schema = {
    $schema: "http://json-schema.org/draft-04/schema#",
    $ref: `#/components/schemas/${schemaName}`,
    components: {
      schemas: {
        [schemaName]: definition,
      },
    },
  };

  const refsCollection = getAllNestedRef(definition);
  const expandedResults: string[] = expandRefs(
    refsCollection,
    openAPISpecification,
    getAllNestedRef,
  );

  expandedResults.forEach((refs) => {
    const key = refs.split("/").pop();
    if (key) {
      schema.components.schemas[key] = getSchemaByRefs(
        openAPISpecification,
        refs,
      );
    }
  });

  fs.writeFile(
    path.join(outputFolder, `${schemaName}.json`),
    JSON.stringify(schema, null, 2),
  );
};

const getAllNestedRef = (
  object: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
  path = "",
): string[] => {
  let refs: string[] = [];

  if (Array.isArray(object)) {
    object.forEach((item, index) => {
      refs = refs.concat(getAllNestedRef(item, `${path}[${index}]`));
    });
  } else if (object !== null && typeof object === "object") {
    Object.keys(object).forEach((key) => {
      const newPath = path ? `${path}.${key}` : key;

      if (key === "$ref") {
        refs.push(object[key]);
      }

      refs = refs.concat(getAllNestedRef(object[key], newPath));
    });
  }

  return refs;
};

const expandRefs = (
  refsCollection: string[],
  apiSpec: OpenAPIV3.Document,
  getAllNestedRef: (
    object: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
    path?: string,
  ) => string[],
): string[] => {
  const visitedPaths = new Set(refsCollection);
  const queue = [...refsCollection];

  while (queue.length > 0) {
    const currentSchema = getSchemaByRefs(apiSpec, queue.shift() ?? "");
    const childPaths = getAllNestedRef(currentSchema);
    childPaths.forEach((path) => {
      if (!visitedPaths.has(path)) {
        visitedPaths.add(path);
        queue.push(path);
      }
    });
  }

  return Array.from(visitedPaths);
};

const getSchemaByRefs = (
  jsonObject: OpenAPIV3.SchemaObject,
  refs: string,
): OpenAPIV3.SchemaObject => pointer.get(jsonObject, refs.slice(1));

const getSchemasByFilePath = async (filePath: string): Promise<string[]> => {
  const fileContent = await fs.readFile(filePath, "utf8");
  const openAPISpecification = (await load(fileContent)) as OpenAPIV3.Document;
  const result: string[] = [];

  for (const property in openAPISpecification?.components?.schemas)
    result.push(property);

  return result;
};

export {
  validateOpenAPISpecification,
  generateSchemaFile,
  getSchemasByFilePath,
};
