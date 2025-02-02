import { command } from "cmd-ts";
import { configOption } from "../args/config-option.ts";

export const deleteCmd = command({
  name: "Delete",
  description: "TODO",
  args: {
    config: configOption,
  },
  handler: ({ config }) => {
  },
});
