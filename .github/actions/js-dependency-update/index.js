const core = require('@actions/core');
const exec = require('@actions/exec');

const validateBranchName = ({ branchName }) => /^[a-zA-Z0-9_\-.\/]+$/.test(branchName);
const validateDirectoryName = ({ workingDir }) => /^[a-zA-Z0-9_\-\/]+$/.test(workingDir);

async function run() {
    const baseBranch = core.getInput('base-branch');
    const targetBranch = core.getInput('target-branch');
    const ghToken = core.getInput('gh-token');
    const workingDir = core.getInput('working-directory');
    const debug = core.getBooleanInput('debug');

    core.setSecret(ghToken);

    if (!validateBranchName({ branchName: baseBranch })) {
        core.setFailed(`Base branch name is invalid: ${baseBranch}`);
        return;
    }

    if (!validateBranchName({ branchName: targetBranch })) {
        core.setFailed(`Target branch name is invalid: ${targetBranch}`);
        return;
    }

    if (!validateDirectoryName({ workingDir })) {
        core.setFailed(`Working directory is invalid: ${workingDir}`);
        return;
    }

    core.info(`Base branch: ${baseBranch}`);
    core.info(`Target branch: ${targetBranch}`);
    core.info(`Working directory: ${workingDir}`);

    await exec.exec('npm update', [], { cwd: workingDir });

    const gitStatus = await exec.getExecOutput('git status -s package*.json', [], { cwd: workingDir });
    if (gitStatus.stdout.length > 0) {
        core.info('There are updates available');
    } else {
        core.info('No updates available');
    }
}

run();