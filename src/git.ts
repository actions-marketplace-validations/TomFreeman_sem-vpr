import { getExecOutput } from "@actions/exec";
import * as github from "@actions/github";
import * as core from "@actions/core";
import { PullRequestEvent, WebhookEvent } from "@octokit/webhooks-types";

const context = github.context;

export async function getTags() {
  const output = await getExecOutput("git", ["tag", "-l"])

  if (output.exitCode != 0) {
    console.log("Fetch tags failed, ${output.stderr}");
    throw new Error("No tags found, ${output.stderr}");
  }


  const tags = output.stdout.split("\n");
  return tags;
}

function getCurrentPR() {
  if (context.eventName !== "pull_request") {
    throw new Error("This action only works on pull requests");
  }

  const pr = context.payload as PullRequestEvent

  return pr.pull_request
}

export function getBranchName() {
  const pr = getCurrentPR()
  return pr.head.ref
}

export function getLabels() {
  const pr = getCurrentPR()
  return pr.labels.map(label => label.name)
}

export async function tagNewVersion(version: string) {
  const { GITHUB_TOKEN, GITHUB_SHA } = process.env;
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not set");
  }

  if (!GITHUB_SHA) {
    throw new Error("GITHUB_SHA is not set");
  }

  const octokit = github.getOctokit(GITHUB_TOKEN);

  const pr = context.payload as PullRequestEvent
  const owner = pr.repository.owner
  const repo = pr.repository.name

  pr.pull_request.head.sha

  const tagCreateResponse = await octokit.rest.git.createTag({
    ...context.repo,
    tag: version,
    message: pr.pull_request.title,
    object: GITHUB_SHA,
    type: "commit",
  });

  await octokit.rest.git.createRef({
    ...context.repo,
    ref: `refs/tags/${version}`,
    sha: tagCreateResponse.data.sha,
  });
}
