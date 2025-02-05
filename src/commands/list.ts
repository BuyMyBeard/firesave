import { command } from "cmd-ts";
import { configOption } from "../args/config-option.ts";
import * as path from "@std/path";
import { Infer, mask } from "superstruct";
import chalk from "chalk";
import { SaveMetadataStruct } from "../structs.ts";
import { formatISODate, isFulfilled } from "../utils.ts";

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
