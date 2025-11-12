import fs, { mkdir, access } from "fs/promises";
import { load } from "js-yaml";
import { createInterface } from "node:readline/promises";
import pointer from "json-pointer";

const main = async () => {
    const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const findNestedRef = (object, path = "") => {
        let refs = [];

        if (Array.isArray(object)) {
            object.forEach((item, index) => {
                refs = refs.concat(findNestedRef(item, `${path}[${index}]`));
            });
        } else if (object !== null && typeof object === "object") {
            Object.keys(object).forEach(key => {
                const newPath = path ? `${path}.${key}` : key;

                if (key === "$ref") {
                    refs.push(object[key]);
                }

                refs = refs.concat(findNestedRef(object[key], newPath));
            });
        }

        return refs;
    };

    const getSchemaByRefs = (jsonObject, refs) => pointer.get(jsonObject, refs.slice(1));

    const expandRefs = (initialRefs, apiSpec, findNestedRef) => {
        const visitedPaths = new Set(initialRefs);
        const queue = [...initialRefs];

        while (queue.length > 0) {
            const currentSchema = getSchemaByRefs(apiSpec, queue.shift());
            const childPaths = findNestedRef(currentSchema);
            childPaths.forEach(path => {
                if (!visitedPaths.has(path)) {
                    visitedPaths.add(path);
                    queue.push(path);
                }
            });
        }

        return Array.from(visitedPaths);
    };

    try {
        const outputFolder = "generated_schemas";
        try {
            await access(outputFolder);
        } catch (error) {
            mkdir(outputFolder);
        }

        const fileName = await readline.question("Enter the YAML file name: ");

        const fileContent = await fs.readFile(fileName, "utf8");
        const openAPISpecification = load(fileContent);

        const schemaName = await readline.question("Please enter schema name:");

        const definition = openAPISpecification["components"]["schemas"][schemaName];
        const schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "$ref": `#/components/schemas/${schemaName}`,
            "components": {
                "schemas": {
                    [schemaName]: definition
                }
            }
        }

        const initialResults = findNestedRef(definition);
        const expandedResults = expandRefs(initialResults, openAPISpecification, findNestedRef);

        expandedResults.forEach(refs => {
            schema["components"]["schemas"][refs.split("/").pop()] = getSchemaByRefs(openAPISpecification, refs);
        });

        fs.writeFile(`./generated_schemas/${schemaName}.json`, JSON.stringify(schema, null, 2));
    } catch (parseError) {
        console.error("Error parsing YAML:", parseError);
    } finally {
        readline.close();
    }
};

main();