import { mkdir, access } from "fs/promises";
import { createInterface } from "node:readline/promises";
import { generateSchemaFile } from "@json-schema-generator-monorepo/core";

const main = async () => {
    const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    try {
        const outputFolder = "./generated_schemas";

        try {
            await access(outputFolder);
        } catch {
            await mkdir(outputFolder, { recursive: true });
        }

        const fileName = await readline.question("Enter the YAML file name: ");
        const schemaName = await readline.question("Please enter the schema name: ");

        await generateSchemaFile({
            schemaName,
            outputFolder,
            filePath: fileName,
        });

        console.log(`✅ Schema "${schemaName}" generated successfully in "${outputFolder}"`);
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        readline.close();
    }
};

main();