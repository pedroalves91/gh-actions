const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

const validateBranchName = ({ branchName }) => /^[a-zA-Z0-9_\-.\/]+$/.test(branchName);
const validateDirectoryName = ({ workingDir }) => /^[a-zA-Z0-9_\-\/]+$/.test(workingDir);

async function run() {
    const baseBranch = core.getInput('base-branch', { required: true });
    const targetBranch = core.getInput('target-branch', { required: true });
    const ghToken = core.getInput('gh-token', { required: true });
    const workingDir = core.getInput('working-directory', { required: true });
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
        await exec.exec('git config --global user.name "gh-automation"');
        await exec.exec('git config --global user.email "gh-automation@email.com"');
        await exec.exec(`git checkout -b ${targetBranch}`, [], { cwd: workingDir });
        await exec.exec(`git add package.json package-lock.json`, [], { cwd: workingDir });
        await exec.exec(`git commit -m "update deps"`, [], { cwd: workingDir });
        await exec.exec(`git push -u origin ${targetBranch} --force`, [], { cwd: workingDir });

        const octokit = github.getOctokit(ghToken);

        try {
            await octokit.rest.pulls.create({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                title: 'Update dependencies',
                head: targetBranch,
                base: baseBranch,
                body: 'This PR was automatically created by the GitHub Action `js-dependency-update`',
            });
        } catch (e) {
            core.error('Failed to create PR');
            core.setFailed(e.message);
            core.error(e);
        }
    } else {
        core.info('No updates available');
    }
}

run();