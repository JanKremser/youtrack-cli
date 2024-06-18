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
        terminal.stdoutLn(
            `${_formatTimer(durationInSec)}`,
            terminal.colors.fgGreen
        );

        await _createTimeTrackingItem(issueId, durationInSec);
    }
}

async function _timestop(): Promise<number> {
    let curlX = false;
    let keydownEventFn = (key: Buffer) => {
        if (key.toString() === "\u0003") {
            // ^C
            process.exit(0);
        }
        if (key.toString() === "\u0018") {
            // ^X
            curlX = true;
        }
    };
    terminal.createDataEventListener(keydownEventFn);

    let timer = new Date().getTime();
    const start = timer;

    let timeInSec = 0;
    let dotSymbol = "[ ]";
    while (!curlX) {
        dotSymbol = dotSymbol == "[ ]" ? "[•]" : "[ ]";

        timer = new Date().getTime();
        terminal.stdout(`${dotSymbol}`, terminal.colors.bgRed);

        timeInSec = parseInt(((timer - start) / 1000).toFixed(0));
        terminal.stdout(` ${_formatTimer(timeInSec)}`, terminal.colors.fgRed);

        terminal.stdout(`   `.repeat(5));
        terminal.stdout(`^X`, terminal.colors.bgWhite);
        terminal.stdout(` Stop`);
        terminal.stdout(`   `.repeat(2));
        terminal.stdout(`^C`, terminal.colors.bgWhite);
        terminal.stdout(` Cancel`);

        terminal.stdoutLn(``);

        await helper.sleep(500);

        terminal.clearLastLine();
    }

    terminal.removeDataEventListener(keydownEventFn);

    return timeInSec;
}

function _formatTimer(timeInSec: number): string {
    let showHours = Math.floor(timeInSec / 60 / 60);
    let sec = timeInSec - showHours * 60 * 60;
    let showMin = Math.floor(sec / 60);
    let showSec = sec % 60;

    return `${_formatNumber(showHours)}:${_formatNumber(
        showMin
    )}:${_formatNumber(showSec)}`;
}

function _formatNumber(num: number): string {
    return `${num <= 9 ? "0" : ""}${num}`;
}

async function _createTimeTrackingItem(issueId: string, durationInSec: number) {
    const minDurationInSec = parseInt(
        process.env.YOUTRACK_MIN_DURATION_IN_SEC
            ? process.env.YOUTRACK_MIN_DURATION_IN_SEC
            : "0"
    );
    if (durationInSec < minDurationInSec) {
        durationInSec = minDurationInSec;
    }
    terminal.stdoutLn(`Duration: `, terminal.colors.fgMagenta);
    terminal.stdoutLn(`${_formatTimer(durationInSec)}`);

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
