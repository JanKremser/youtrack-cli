import commands from "./commands";
import terminal from "./terminal";

export type CommandArgs = {
    [key: string]: string | boolean;
};

export type CLiItem = {
    long: string;
    short?: string;
    valueType?: string;
    discription?: string;
    callback?: (args: CommandArgs) => Promise<void>;
    chileds?: Cli;
};

export type Cli = {
    [key: string]: CLiItem;
};

const CLI_CONFIG: Cli = {
    help: {
        short: "h",
        long: "help",
        discription: "",
        callback: async () => {
            renderCliInfo();
        },
    },
    list: {
        short: "l",
        long: "list",
        callback: async () => {
            await commands.listIssues();
        },
    },
    issue: {
        long: "issue",
        valueType: "string",
        callback: async (args: CommandArgs) => {
            await commands.getIssue(args);
        },
        chileds: {
            timestop: {
                long: "time",
                short: "t",
            },
        },
    },
};

function renderCliInfo() {
    const tebLength = 8;
    for (const c in CLI_CONFIG) {
        let tabSpaces = " ".repeat(tebLength - c.length);
        terminal.stdout(`--${c}${tabSpaces}`);
        if (CLI_CONFIG[c].short) {
            terminal.stdout(`-${CLI_CONFIG[c].short}${" ".repeat(3)}`);
        } else {
            terminal.stdout(`${" ".repeat(5)}`);
        }
        if (CLI_CONFIG[c].discription) {
            terminal.stdout(`${CLI_CONFIG[c].discription}`);
        }

        terminal.stdoutLn("");
    }
}

function checkCliArgs(
    args: CommandArgs,
    cli_item: CLiItem | undefined
): Boolean {
    if (cli_item == undefined) return false;

    if (args[cli_item.long] || (cli_item.short && args[cli_item.short])) {
        return true;
    }

    return false;
}

function getArgs(): CommandArgs {
    const args = process.argv.slice(2);
    const options = args.filter((arg) => arg.startsWith("-"));

    let argsObject: CommandArgs = {};

    for (let op of options) {
        const [key, value] = op.split("=");
        let _key = key.replaceAll("-", "");

        if (key.startsWith("--")) {
            let _value: string | boolean = value;
            if (_value == undefined) {
                _value = true;
            }
            argsObject[_key] = _value;
        } else if (!key.startsWith("--")) {
            let falgs = _key.split("");
            for (const flag of falgs) {
                argsObject[flag] = true;
            }
        }
    }

    return argsObject;
}

export default {
    getArgs,
    CLI_CONFIG,
    checkCliArgs,
};
