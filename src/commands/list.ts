import { command } from "cmd-ts";
import { configOption } from "../args/config-option.ts";
import * as path from "@std/path";
import {
  boolean,
  defaulted,
  Infer,
  mask,
  nonempty,
  object,
  optional,
  string,
} from "superstruct";
import chalk from "chalk";

const SaveMetadataStruct = object({
  name: nonempty(string()),
  description: optional(string()),
  saveTime: string(),
  isAutosave: defaulted(boolean(), false),
});

function isFulfilled<T>(
  result: PromiseSettledResult<T>,
): result is PromiseFulfilledResult<T> {
  return result.status == "fulfilled";
}

export const listCmd = command({
  name: "List",
  description: "Lists existing saves",
  args: {
    config: configOption,
  },
  handler: async ({ config }) => {
    const dirEntries = (() => {
      try {
        return Deno.readDirSync(config.resolvedSaveLocation);
      } catch {
        console.log(
          chalk.red(
            `No save data found at path ${
              chalk.underline(config.resolvedSaveLocation)
            }`,
          ),
        );
        Deno.exit(0);
      }
    })();
    const saveDirs = dirEntries.filter((dirEntry) => dirEntry.isDirectory);
    const metadataFilePaths = saveDirs.map((saveDir) =>
      path.join(config.saveLocation, saveDir.name, "firesave-metadata.json")
    );
    const metadataPromises = metadataFilePaths.map((path) =>
      Deno.readTextFile(path).then((raw) =>
        mask(JSON.parse(raw), SaveMetadataStruct)
      )
    );
    const results = await Promise.allSettled(metadataPromises);
    const metadataArr = results.filter((result) => isFulfilled(result)).map((
      result,
    ) => result.value);
    if (metadataArr.length == 0) {
      console.log(
        chalk.red(
          `No save data found at path ${
            chalk.underline(config.resolvedSaveLocation)
          }`,
        ),
      );
      Deno.exit(0);
    }
    formatSaves(metadataArr, config.saveLocation);
  },
});

function formatISODate(isoString: string): string {
  const date = new Date(isoString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatSaves(
  metadataArr: Infer<typeof SaveMetadataStruct>[],
  saveLocation: string,
) {
  if (metadataArr.length == 0) {
    console.log(
      chalk.red(`No save data found at path ${chalk.underline(saveLocation)}`),
    );
    return;
  }
  const divider = chalk.grey("────────────────────────────────────────────");
  for (const metadata of metadataArr) {
    console.log(divider);
    console.log(
      `📂 [${
        chalk.bold(
          metadata.isAutosave ? chalk.cyan("Auto") : chalk.green("Manual"),
        )
      }] ${chalk.bold(chalk.whiteBright(metadata.name))}`,
    );
    if (metadata.description) {
      console.log(`   📝 ${chalk.grey(chalk.italic(metadata.description))}`);
    }
    console.log(`   📅 ${chalk.yellow(formatISODate(metadata.saveTime))}`);
  }
  console.log(divider);
}
