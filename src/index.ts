import core from '@actions/core';
import { Versioner, Settings } from './versioner';
import { getTags, getBranchName, getLabels, tagNewVersion } from './git';

function buildSettings(labels: string[], prefix: string, branch: string): Settings {
  const settings = {} as Settings;

  if (labels.includes('major')) {
    settings.major = true;
  } else if (labels.includes('minor')) {
    settings.minor = true;
  }

  if (labels.includes('pre-release')) {
    settings.suffix = branch;
  }

  settings.prefix = prefix || 'v';

  return settings;
}

// most @actions toolkit packages have async methods
async function run() {
  try {
    // Get the tags from the git history
    const tags = await getTags();
    const prefix = core.getInput('prefix');
    const branch = getBranchName();
    const settings = buildSettings(
      getLabels(),
      prefix,
      branch);

    const versioner = new Versioner(
      tags, settings);

    const newVersion = await versioner.calculateNextVersion();

    // Tag the new version
    await tagNewVersion(newVersion);
  } catch (err) {
    core.setFailed((err as Error).message);
  }
}

run();
