var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
System.register("git", ["@actions/exec", "@actions/github"], function (exports_1, context_1) {
    "use strict";
    var exec_1, github, context;
    var __moduleName = context_1 && context_1.id;
    function getTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const output = yield exec_1.getExecOutput("git", ["tag", "-l"]);
            if (!output.stdout) {
                throw new Error("No tags found, ${output.stderr}");
            }
            const tags = output.stdout.split("\n");
            return tags;
        });
    }
    exports_1("getTags", getTags);
    function getCurrentPR() {
        if (context.eventName !== "pull_request") {
            throw new Error("This action only works on pull requests");
        }
        const pr = context.payload;
        return pr.pull_request;
    }
    function getBranchName() {
        const pr = getCurrentPR();
        return pr.head.ref;
    }
    exports_1("getBranchName", getBranchName);
    function getLabels() {
        const pr = getCurrentPR();
        return pr.labels.map(label => label.name);
    }
    exports_1("getLabels", getLabels);
    function tagNewVersion(version) {
        return __awaiter(this, void 0, void 0, function* () {
            const { GITHUB_TOKEN, GITHUB_SHA } = process.env;
            if (!GITHUB_TOKEN) {
                throw new Error("GITHUB_TOKEN is not set");
            }
            if (!GITHUB_SHA) {
                throw new Error("GITHUB_SHA is not set");
            }
            const octokit = github.getOctokit(GITHUB_TOKEN);
            const pr = context.payload;
            const owner = pr.repository.owner;
            const repo = pr.repository.name;
            pr.pull_request.head.sha;
            const tagCreateResponse = yield octokit.rest.git.createTag(Object.assign(Object.assign({}, context.repo), { tag: version, message: pr.pull_request.title, object: GITHUB_SHA, type: "commit" }));
            yield octokit.rest.git.createRef(Object.assign(Object.assign({}, context.repo), { ref: `refs/tags/${version}`, sha: tagCreateResponse.data.sha }));
        });
    }
    exports_1("tagNewVersion", tagNewVersion);
    return {
        setters: [
            function (exec_1_1) {
                exec_1 = exec_1_1;
            },
            function (github_1) {
                github = github_1;
            }
        ],
        execute: function () {
            context = github.context;
        }
    };
});
System.register("versioner", [], function (exports_2, context_2) {
    "use strict";
    var Versioner;
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [],
        execute: function () {
            // Versioner wraps the logic for calculating the next version
            Versioner = class Versioner {
                constructor(tags, settings) {
                    this.tags = tags;
                    this.settings = settings;
                }
                buildTag(version) {
                    // Add a prefix to the version
                    version = `${this.settings.prefix}${version}`;
                    // Add a suffix to the version
                    if (this.settings.suffix) {
                        version = `${version}-${this.settings.suffix}`;
                    }
                    return version;
                }
                getLatestTag() {
                    if (!this.tags || this.tags.length === 0) {
                        console.log('No tags found, using 0.0.0');
                        return '0.0.0';
                    }
                    else {
                        // Filter out all the prerelease tags and sort them
                        var filteredTags = this.tags.filter(tag => !tag.includes('-'));
                        filteredTags.sort();
                        return filteredTags[filteredTags.length - 1];
                    }
                }
                incrementVersion(latestTag) {
                    // Split the latest tag into its parts
                    const parts = latestTag.split('.');
                    const major = parseInt(parts[0]);
                    const minor = parseInt(parts[1]);
                    const patch = parseInt(parts[2]);
                    // Increment the version
                    if (this.settings.major) {
                        return `${major + 1}.${minor}.${patch}`;
                    }
                    else if (this.settings.minor) {
                        return `${major}.${minor + 1}.${patch}`;
                    }
                    else {
                        return `${major}.${minor}.${patch + 1}`;
                    }
                }
                calculateNextVersion() {
                    return __awaiter(this, void 0, void 0, function* () {
                        // Get the latest tag
                        const latestTag = this.getLatestTag();
                        // Calculate the new version
                        const newVersion = yield this.incrementVersion(latestTag);
                        return this.buildTag(newVersion);
                    });
                }
            };
            exports_2("Versioner", Versioner);
        }
    };
});
System.register("index", ["@actions/core", "versioner", "git"], function (exports_3, context_3) {
    "use strict";
    var core_1, versioner_1, git_1;
    var __moduleName = context_3 && context_3.id;
    function buildSettings(labels, prefix, branch) {
        const settings = {};
        if (labels.includes('major')) {
            settings.major = true;
        }
        else if (labels.includes('minor')) {
            settings.minor = true;
        }
        if (labels.includes('pre-release')) {
            settings.suffix = branch;
        }
        settings.prefix = prefix || 'v';
        return settings;
    }
    // most @actions toolkit packages have async methods
    function run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get the tags from the git history
                const tags = yield git_1.getTags();
                const prefix = core_1.default.getInput('prefix');
                const branch = git_1.getBranchName();
                const settings = buildSettings(git_1.getLabels(), prefix, branch);
                const versioner = new versioner_1.Versioner(tags, settings);
                const newVersion = yield versioner.calculateNextVersion();
                // Tag the new version
                yield git_1.tagNewVersion(newVersion);
            }
            catch (err) {
                core_1.default.setFailed(err.message);
            }
        });
    }
    return {
        setters: [
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (versioner_1_1) {
                versioner_1 = versioner_1_1;
            },
            function (git_1_1) {
                git_1 = git_1_1;
            }
        ],
        execute: function () {
            run();
        }
    };
});
