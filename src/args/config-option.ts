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
} from "superstruct";

const ConfigStruct = object({
  autoSaveFrequency: optional(number()),
  saveLocation: defaulted(string(), "firesave"),
  autoSaveName: defaulted(string(), "autosave"),
  exportOnExit: defaulted(boolean(), false),
  defaultLoadedSave: defaulted(string(), "autosave"),
});

export type Config = Infer<typeof ConfigStruct>;

const ConfigType: Type<string, Config> = {
  async from(relPath) {
    const decoder = new TextDecoder("utf-8");
    const bytes = await Deno.readFile(relPath);
    const rawConfig = JSON.parse(decoder.decode(bytes));

    return mask(rawConfig, ConfigStruct);
  },
};

export const configOption = option({
  long: "config",
  short: "c",
  type: ConfigType,
  defaultValue: () => ({
    saveLocation: "firesave",
    autoSaveName: "autosave",
    exportOnExit: false,
    defaultLoadedSave: "autosave",
  }),
});
