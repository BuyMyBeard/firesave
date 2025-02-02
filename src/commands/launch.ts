import { command } from "cmd-ts";
import { configOption } from "../args/config-option.ts";

export const launchCmd = command({
  name: "Launch",
  args: {
    config: configOption,
  },
  handler: ({ config }) => {
  },
});
