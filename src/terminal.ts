import * as readline from "readline";

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",

    fgBlack: "\x1b[30m",
    fgRed: "\x1b[31m",
    fgGreen: "\x1b[32m",
    fgYellow: "\x1b[33m",
    fgBlue: "\x1b[34m",
    fgMagenta: "\x1b[35m",
    fgCyan: "\x1b[36m",
    fgWhite: "\x1b[37m",

    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m",
};

function clearLastLine() {
    process.stdout.write("\u001b[1A");
    process.stdout.write("\u001b[2K");
}

function stdoutLn(out: string, color: string = colors.reset) {
    stdout(`${out}\n`, color);
}
function stdout(out: string, color: string = colors.reset) {
    process.stdout.write(color + `${out}` + colors.reset);
}

function log(...out: any[]) {
    if (process.env.YOUTRACK_DEBUG == "false") return;
    let now = new Date().toISOString();
    stdout(`[ ${now} ] DEBUG: `);
    for (let o of out) {
        if (typeof o === "object") {
            o = JSON.stringify(o);
        }
        stdout(`${o} `, colors.fgRed);
    }
    stdoutLn("");
}

function createDataEventListener(on: (key: Buffer) => void) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", on);
}

function removeDataEventListener(on: (key: Buffer) => void) {
    process.stdin.removeListener("data", on);
}

async function question(question: string): Promise<string> {
    return new Promise((resolve, _) => {
        const inquirer = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        stdout(`${question}\n`, colors.fgMagenta);
        inquirer.question(``, (val) => {
            resolve(val);
            inquirer.close();
        });
    });
}

export default {
    clearLastLine,
    stdout,
    stdoutLn,
    log,
    colors,
    createDataEventListener,
    removeDataEventListener,
    question,
};
