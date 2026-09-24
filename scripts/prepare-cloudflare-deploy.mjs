import { readFile, writeFile } from "node:fs/promises";

const deploymentConfigUrl = new URL("../wrangler.jsonc", import.meta.url);
const builtConfigUrl = new URL("../dist/server/wrangler.json", import.meta.url);
const deploymentConfig = JSON.parse(await readFile(deploymentConfigUrl, "utf8"));

if (deploymentConfig.d1_databases?.some(({ database_id }) => !database_id || database_id === "00000000-0000-4000-8000-000000000000")) {
  throw new Error("Create the papertrail-shared D1 database and save its database_id in wrangler.jsonc before deploying.");
}

const builtConfig = JSON.parse(await readFile(builtConfigUrl, "utf8"));
builtConfig.name = deploymentConfig.name;
builtConfig.compatibility_date = deploymentConfig.compatibility_date;
builtConfig.compatibility_flags = deploymentConfig.compatibility_flags;
builtConfig.vars = deploymentConfig.vars;
builtConfig.d1_databases = deploymentConfig.d1_databases;
await writeFile(builtConfigUrl, `${JSON.stringify(builtConfig, null, 2)}\n`);
