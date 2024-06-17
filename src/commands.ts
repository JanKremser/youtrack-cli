import helper from "./helper";
import terminal from "./terminal";
import youtrack, { Issue } from "./youtrack";
import cli, { CommandArgs } from "./cli";

async function listIssues() {
    let issues = await youtrack.listAllIssues();
    if (issues == null) return;

    for (let issue of issues) {
        if (!issue.assignees.find((x) => x == process.env.YOUTRACK_USER))
            continue;

        _printIssue(issue);
    }
}

function _printIssue(issue: Issue) {
    terminal.stdoutLn(``);

    terminal.stdout(`[${issue.id}] `, terminal.colors.fgBlue);
    terminal.stdoutLn(issue.summary);

    terminal.stdout(`State: `, terminal.colors.fgMagenta);
    terminal.stdoutLn(helper.getOrDefault(issue.state, "-"));

    terminal.stdout(`Sizing: `, terminal.colors.fgMagenta);
    terminal.stdoutLn(helper.getOrDefault(issue.sizing, "-"));

    terminal.stdout(`Spent time: `, terminal.colors.fgMagenta);
    terminal.stdoutLn(helper.getOrDefault(issue.spent_time?.presentation, "-"));

    terminal.stdoutLn(``);
    terminal.stdoutLn(`=`.repeat(50));
}

async function getIssue(args: CommandArgs) {
    let issueId = args["issue"] as string;

    let issue: null | Issue = await youtrack.getIssue(issueId);
    if (issue == null) {
        terminal.stdoutLn("-> Issue not found", terminal.colors.fgRed);
        return;
    }
    _printIssue(issue);

    if (cli.checkCliArgs(args, cli.CLI_CONFIG.issue?.chileds?.timestop)) {
        let durationInSec = await _timestop();
        terminal.stdoutLn(`${durationInSec} sec`, terminal.colors.fgGreen);

        await _createTimeTrackingItem(issueId, durationInSec);
    }
}

async function _timestop(): Promise<number> {
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

        await helper.sleep(389);

        terminal.clearLastLine();
    }

    terminal.removeDataEventListener(keydownEventFn);

    return timeInSec;
}

async function _createTimeTrackingItem(issueId: string, durationInSec: number) {
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

export default {
    listIssues,
    getIssue,
};
