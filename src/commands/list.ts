import { command } from "cmd-ts";
import { configOption } from "../args/config-option.ts";

export const listCmd = command({
  name: "List",
  description: "TODO",
  args: {
    config: configOption,
  },
  handler: ({ config }) => {
  },
});
