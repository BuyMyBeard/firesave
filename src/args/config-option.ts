import { option } from "cmd-ts";
import { Type } from "cmd-ts";
import {
  boolean,
  defaulted,
  Infer,
  mask,
  number,
  object,
  optional,
  string,
  validate,
} from "superstruct";
import * as path from "@std/path";
import chalk from "chalk";

const ConfigStruct = object({
  autoSaveFrequency: optional(number()),
  saveLocation: defaulted(string(), "firesave"),
  autoSaveName: defaulted(string(), "autosave"),
  exportOnExit: defaulted(boolean(), false),
  defaultLoadedSave: defaulted(string(), "autosave"),
  firebaseCmd: defaulted(string(), "firebase"),
});

export type Config = Infer<typeof ConfigStruct>;

export interface ExtendedConfig extends Config {
  resolvedConfigLocation: string;
  resolvedSaveLocation: string;
}

const ConfigType: Type<string, ExtendedConfig> = {
  async from(relPath: string) {
    return await new Promise(() => loadConfig(relPath));
  },
};

function loadConfig(relPath: string) {
  const cwd = Deno.cwd();
  const resolvedConfigLocation = path.resolve(cwd, relPath);

  const decoder = new TextDecoder("utf-8");
  const config = (() => {
    try {
      const configBytes = Deno.readFileSync(resolvedConfigLocation);
      const rawConfig = JSON.parse(decoder.decode(configBytes));
      const [err, value] = validate(rawConfig, ConfigStruct, {
        mask: true,
        coerce: true,
      });
      if (err) {
        console.error(chalk.red("Error parsing config: " + err.message));
        Deno.exit(1);
      }
      return value;
    } catch (_) {
      return mask({}, ConfigStruct);
    }
  })();

  const resolvedSaveLocation = path.resolve(
    resolvedConfigLocation,
    config.saveLocation,
  );

  return {
    ...config,
    resolvedConfigLocation,
    resolvedSaveLocation,
  };
}

export const configOption = option({
  long: "config",
  short: "c",
  type: ConfigType,
  defaultValue: () => loadConfig("."),
});
