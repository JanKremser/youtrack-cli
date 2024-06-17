import * as dotenv from "dotenv";
dotenv.config();

import terminal from "./terminal";
import cli, { CommandArgs } from "./cli";

async function main() {
    const args = cli.getArgs();
    terminal.log("args", args);
    terminal.log("env", process.env);

    for (const c in cli.CLI_CONFIG) {
        if (cli.checkCliArgs(args, cli.CLI_CONFIG[c])) {
            if (cli.CLI_CONFIG[c] && cli.CLI_CONFIG[c].callback) {
                await (
                    cli.CLI_CONFIG[c].callback as (
                        args: CommandArgs
                    ) => Promise<void>
                )(args);
                break;
            }
        }
    }

    process.exit();
}

main();
