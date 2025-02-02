import { command } from "cmd-ts";
import { configOption } from "../args/config-option.ts";

export const copyCmd = command({
  name: "Copy",
  description: "TODO",
  args: {
    config: configOption,
  },
  handler: ({ config }) => {
  },
});
