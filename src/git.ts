import { exec, ExecException } from "child_process";

function getCurrentBranch(): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(
            "git rev-parse --abbrev-ref HEAD",
            (error: ExecException | null, stdout: string, stderr: string) => {
                if (error) {
                    reject(`error: ${error.message}`);
                    return;
                }

                if (stderr) {
                    reject(`stderr: ${stderr}`);
                    return;
                }

                const currentBranch = stdout.trim();
                resolve(currentBranch);
            }
        );
    });
}

export default {
    getCurrentBranch,
};
