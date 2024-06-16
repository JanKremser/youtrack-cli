import * as dotenv from "dotenv";
dotenv.config();

import terminal from "./terminal";
import youtrack, { Issue } from "./youtrack";

type CLiItem = {
    short?: string;
    long: string;
    valueType?: string;
    discription?: string;
};

type Cli = {
    [key: string]: CLiItem;
};

const CLI_CONFIG: Cli = {
    help: {
        short: "h",
        long: "help",
        discription: "",
    },
    list: {
        short: "l",
        long: "list",
    },
    issue: {
        long: "issue",
        valueType: "string",
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

function checkCliArgs(args: CommandArgs, cli_item: CLiItem): Boolean {
    if (args[cli_item.long] || (cli_item.short && args[cli_item.short])) {
        return true;
    }

    return false;
}

type CommandArgs = {
    [key: string]: string | boolean;
};

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getOrDefault<T>(value: any, _default: T): T {
    if (value == null || value == undefined) {
        return _default;
    }

    return value as T;
}

async function listIssues() {
    let issues = await youtrack.listAllIssues();
    if (issues == null) return;

    for (let issue of issues) {
        if (!issue.assignees.find((x) => x == process.env.YOUTRACK_USER))
            continue;

        printIssue(issue);
    }
}

function printIssue(issue: Issue) {
    terminal.stdoutLn(``);

    terminal.stdout(`[${issue.id}] `, terminal.colors.fgBlue);
    terminal.stdoutLn(issue.summary);

    terminal.stdout(`State: `, terminal.colors.fgMagenta);
    terminal.stdoutLn(getOrDefault(issue.state, "-"));

    terminal.stdout(`Sizing: `, terminal.colors.fgMagenta);
    terminal.stdoutLn(getOrDefault(issue.sizing, "-"));

    terminal.stdout(`Spent time: `, terminal.colors.fgMagenta);
    terminal.stdoutLn(getOrDefault(issue.spent_time?.presentation, "-"));

    terminal.stdoutLn(``);
    terminal.stdoutLn(`=`.repeat(50));
}

async function timestop(): Promise<number> {
    let strgC = false;
    let keydownEventFn = (key: Buffer) => {
        if (key.toString() === "\u0003") {
            strgC = true;
        }
    };
    terminal.createDataEventListener(keydownEventFn);

    let timer = new Date().getTime();
    const start = timer;

    let timeInSec = 0;
    let dotSymbol = "[ ]";
    while (!strgC) {
        dotSymbol = dotSymbol == "[ ]" ? "[•]" : "[ ]";

        timer = new Date().getTime();
        timeInSec = parseInt(((timer - start) / 1000).toFixed(0));
        terminal.stdout(`${dotSymbol}`, terminal.colors.bgRed);
        terminal.stdoutLn(` ${timeInSec} sec`, terminal.colors.fgRed);

        await sleep(389);

        terminal.clearLastLine();
    }

    terminal.removeDataEventListener(keydownEventFn);

    return timeInSec;
}

async function createTimeTrackingItem(issueId: string, durationInSec: number) {
    const minDurationInSec = 900;
    if (durationInSec < minDurationInSec) {
        durationInSec = minDurationInSec;
    }
    const durationInMin = (durationInSec / 60).toFixed(0);
    terminal.stdoutLn(`Duration: `, terminal.colors.fgMagenta);
    terminal.stdoutLn(`${durationInMin} min`);

    let description = await terminal.question("\nDescription: ");

    let isOk = await terminal.question("\nCan I save this? (y/n):");
    isOk = isOk.trim().toLowerCase();
    if (isOk != "y") {
        terminal.stdoutLn("-> Canceled", terminal.colors.fgRed);
        process.exit();
    }

    await youtrack.postTimeTrackingItem(issueId, durationInSec, description);
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

async function main() {
    const args = getArgs();
    terminal.log("args", args);
    terminal.log("env", process.env);

    if (checkCliArgs(args, CLI_CONFIG.help)) {
        renderCliInfo();
        return;
    }

    if (checkCliArgs(args, CLI_CONFIG.list)) {
        await listIssues();
    }
    if (checkCliArgs(args, CLI_CONFIG.issue)) {
        let issueId = args["issue"] as string;

        let issue: null | Issue = await youtrack.getIssue(issueId);
        if (issue == null) {
            terminal.stdoutLn("-> Issue not found", terminal.colors.fgRed);
            return;
        }
        printIssue(issue);

        if (args["timestop"]) {
            let durationInSec = await timestop();
            terminal.stdoutLn(`${durationInSec} sec`, terminal.colors.fgGreen);

            await createTimeTrackingItem(issueId, durationInSec);
        }
    }

    process.exit();
}

main();
