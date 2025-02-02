import { run, subcommands } from "cmd-ts";
import { saveCmd } from "./commands/save.ts";
import { launchCmd } from "./commands/launch.ts";
import { copyCmd } from "./commands/copy.ts";
import { listCmd } from "./commands/list.ts";
import { deleteCmd } from "./commands/delete.ts";

const app = subcommands({
  name: "firesave",
  cmds: {
    launch: launchCmd,
    save: saveCmd,
    list: listCmd,
    copy: copyCmd,
    delete: deleteCmd,
  },
});

run(app, Deno.args);
