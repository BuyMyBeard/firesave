import { command, string } from "cmd-ts";
import { extendType } from "cmd-ts";
import chalk from "chalk";
import { positional } from "cmd-ts";
import * as path from "@std/path";
import { configOption, ExtendedConfig } from "../args/config-option.ts";
import { create, Infer, mask, StructError } from "superstruct";
import { SaveMetadataStruct } from "../structs.ts";
import { option, optional } from "cmd-ts";

function findInvalidCharacters(name: string): string[] {
  const matches = name.match(/[^a-zA-Z0-9 _.-]|\.$/g);
  return matches ? matches : [];
}

// deno-lint-ignore require-await
export const legalFileName = extendType(string, async (value) => {
  const illegalCharacters = findInvalidCharacters(value);
  if (illegalCharacters.length > 0) {
    throw new Error(
      chalk.red(
        `Illegal characters used: ${
          illegalCharacters.map((val) => `'${val}'`).join(",")
        }`,
      ),
    );
  }
  return value;
});

export const saveCmd = command({
  name: "Save",
  description: "TODO",
  args: {
    name: positional({
      displayName: "Save name",
      description: "The name of the save",
      type: legalFileName,
    }),
    description: option({
      long: "description",
      short: "d",
      type: optional(string),
    }),
    config: configOption,
  },
  handler: ({ name, description, config }) => {
    save({ name, config, description });
  },
});

interface SaveParams {
  name: string;
  config: ExtendedConfig;
  description?: string;
  isAutoSave?: boolean;
}

async function save(
  { name, config, description, isAutoSave = false }: SaveParams,
) {
  const savePath = path.join(config.resolvedSaveLocation, name);
  try {
    Deno.mkdirSync(savePath);
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      throw err;
    }
  }
  const exportCmd = new Deno.Command("firebase emulators:export", {
    args: [savePath],
    stdout: "inherit",
  });
  const process = exportCmd.spawn();
  const prevMetadata = await getMetadata(savePath);
  await process.output();
  const now = new Date(Date.now()).toISOString();

  const newMetadata: Infer<typeof SaveMetadataStruct> = {
    name,
    description: description ?? prevMetadata?.description,
    saveTime: now,
    isAutosave: isAutoSave,
  };

  Deno.writeTextFileSync(
    path.join(savePath, "firesave-metadata.json"),
    JSON.stringify(newMetadata),
    { create: true },
  );
}

async function getMetadata(savePath: string) {
  try {
    return await Deno.readTextFile(
      path.join(savePath, "firesave-metadata.json"),
    ).then((raw) => mask(JSON.parse(raw), SaveMetadataStruct));
  } catch (e) {
    if (e instanceof StructError) {
      logErrorAndExit(
        `There was an error reading the save metadata: ${
          (e as StructError).message
        }`,
      );
    } else if (e instanceof Deno.errors.NotFound) {
      return undefined;
    }
    throw e;
  }
}

function logErrorAndExit(message: string): never {
  console.log(chalk.red(message));
  Deno.exit(1);
}
