/*eslint-env es6, node */
'use strict';

const Helper = require('./helper');
const path = require('path');

class GitCommands {

    constructor() {

        this.CHECKSUM_MAP = {};

    }

    gitCmd(type, opts, verbose) {
        const props = this.PROPERTIES;
        const instance = this.INSTANCE;
        let cmd = null;

        switch (type) {

            // curent branch
            case "current-branch":
                cmd = "git rev-parse --abbrev-ref HEAD";
                break;

            // HEAD commit sha
            case "head-sha":
                cmd = "git rev-parse --short HEAD";
                break;

            case "head-sha-origin":
                cmd = `git rev-parse --short origin/${instance.currentBranch}`;
                break;

            case "status":
                cmd = "git status -sb";
                break;

            case "diff-status":
                cmd = "git diff --name-status";
                break;

            case "diff-status-origin":
                cmd = `git diff --name-status ${instance.currentBranch} ^origin/${instance.currentBranch}`;
                break;

            case "diff-sha-changed-files":
                cmd = `git diff --name-only ${opts.shaBefore} ${opts.shaAfter}`;
                break;

            case 'origin-reset':
                cmd = `git reset --hard origin/${props.CURRENT_BRANCH}`;
                break;

            case 'fetch-all':
                cmd = `git fetch --all && git fetch --tags`;
                break;

        }

        let output = Helper.shellCmd(cmd, props.basePath, verbose);
        return output || '';

    }

    getShaFilesChange(shaBefore, shaAfter) {
        let files = this.gitCmd("diff-sha-changed-files", {
            shaBefore: shaBefore,
            shaAfter: shaAfter
        });
        files = files.trim().split("\n");
        return files;
    }

    checksumFile(file) {
        const props = this.PROPERTIES;
        const fullpath = [props.basePath, file].join('/');
        let ret = true;

        if (Helper.isFileExists(fullpath)) {
            let hash = Helper.encrypt(fullpath);
            if (!this.CHECKSUM_MAP[file]) {
                this.CHECKSUM_MAP[file] = hash;
            } else if (this.CHECKSUM_MAP[file]) {
                if (this.CHECKSUM_MAP[file] === hash) {
                    ret = false;
                } else {
                    this.CHECKSUM_MAP[file] = hash;
                }
            }
        } else {
            ret = false;
        }
        return ret;
    }

    getChangelog() {
        const self = this;
        const props = this.PROPERTIES;

        let files = [];
        let changedFiles = [];

        // local changes
        let local_diff = self.gitCmd("diff-status");
        // local file changes
        let local_file_change = self.gitCmd("status");
        // possible origin changes
        let origin_diff = self.gitCmd("diff-status-origin");

        let items = local_diff.split("\n");

        items = items.concat(origin_diff.split("\n"));

        (local_file_change.split("\n")).forEach((filepath) => {
            if (items.indexOf(filepath) === -1) {
                items.push(filepath);
            }
        });

        items.forEach((item, i) => {
            item = item || "";
            if (item.length > 1) {

                item = item.replace(/\s+|\t/g, ' ');

                let sp = item.split(' ');
                let code = (sp[0] || '').trim();
                let file = (sp[1] || '').trim();

                if (file.length > 1 && Helper.allowStatusCode(code)) {
                    // check if its an unchecked folder, add all contents inside it
                    if (/\/$/.test(file) && /^\?/.test(code)) {
                        files = files.concat(Helper.listDir(path.join(props.basePath, file)));
                    } else {
                        files.push(file);
                    }

                }

            }
        });

        // check if there's a checksum
        if (files.length > 0) {
            files.forEach((file) => {
                let changed = self.checksumFile(file);
                if (changed) {
                    changedFiles.push(file);
                }
            });
        } else {
            for (let id in self.CHECKSUM_MAP) {
                let currHash = self.CHECKSUM_MAP[id] || null;

                if (currHash) {
                    let path = [props.path, id].join("/");

                    if (Helper.isFileExists(path)) {
                        let hash = Helper.encrypt(path);
                        if (currHash !== hash) {
                            changedFiles.push(id);
                            try {
                                delete self.CHECKSUM_MAP[id];
                            } catch(err) {
                                self.CHECKSUM_MAP[id] = null;
                            }
                        }
                    } else {
                        try {
                            delete self.CHECKSUM_MAP[id];
                        } catch(err) {
                            self.CHECKSUM_MAP[id] = null;
                        }
                    }
                }
            }
        }

        return changedFiles;

    }

}

module.exports = GitCommands;
