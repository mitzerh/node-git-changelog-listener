/*eslint-env es6, node */
'use strict';

const GitCommands = require('./cmd');
const Helper = require('./helper');
const log = console.log;

// private
const PRIVATE_DATA = Symbol('DATA_MODEL');
const PRIVATE_METHODS = Symbol('PRIVATE_METHODS');


class Listener extends GitCommands {

    constructor(props) {
        super();

        this[PRIVATE_DATA] = {
            // bool to check if it's initialized
            INITIALIZED: false,
            // bool to set ready state for next interval to execute
            IS_READY: true,
            // setInterval variable
            INTERVAL_INSTANCE: null,
            // callback functions stack
            EXECUTE_STACK: [],
            // bool to check if allowed to run
            ALLOW: true
        };

        // default properties
        this.PROPERTIES = ((d) => {
            return {
                basePath: d.basePath || process.cwd(),
                interval: d.interval || 1000
            };
        })(props || {});

        this.INSTANCE = {
            currentBranch: this.gitCmd('current-branch')
        };

        // check if path is a repository
        if (!Helper.isPathExists(`${this.PROPERTIES.basePath}/.git`)) {
            this[PRIVATE_DATA].ALLOW = false;
        }

    }

    //
    stop() {
        clearInterval(this[PRIVATE_DATA].INTERVAL_INSTANCE);
    }

    onChange(callback) {
        const self = this;
        if (typeof callback !== 'function') { return; }

        self[PRIVATE_DATA].EXECUTE_STACK.push(callback);

        if (!self[PRIVATE_DATA].ALLOW) {
            return broadcast({
                type: 'error',
                message: 'path is not a valid github repository!',
                change: false
            });
        }

        if (!self[PRIVATE_DATA].INITIALIZED) {
            self[PRIVATE_DATA].INITIALIZED = true;
            self[PRIVATE_DATA].INTERVAL_INSTANCE = setInterval(() => {
                trigger(true);
            }, self.PROPERTIES.interval || 1000);
        }

        function trigger(first) {
            if (!self[PRIVATE_DATA].IS_READY) { return; }
            self[PRIVATE_DATA].IS_READY = false;

            if (first) {
                self.getChangelog();
                return broadcast({
                    type: 'initialize',
                    change: false
                });
            }

            // check if it is a branch change
            let currBranch = self.gitCmd('current-branch');
            if (currBranch !== self.INSTANCE.currentBranch) {
                self.INSTANCE.currentBranch = currBranch;
                broadcast({
                    type: 'branch',
                    change: true,
                    prevBranch: self.INSTANCE.currentBranch,
                    currBranch: currBranch
                });
            } else {
                let files = self.getChangelog();
                broadcast((files.length > 0) ? {
                    type: 'files',
                    change: true,
                    files: files,
                    currBranch: currBranch
                } : {
                    type: 'none',
                    change: false,
                    currBranch: currBranch
                });
            }
            self[PRIVATE_DATA].IS_READY = true;
        }

        function broadcast(info) {

            self[PRIVATE_DATA].EXECUTE_STACK.forEach((fn) => {
                fn(info);
            });
        }

    }


}

module.exports = Listener;
