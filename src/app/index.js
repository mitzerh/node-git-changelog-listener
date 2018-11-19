/*eslint-env es6, node */
'use strict';

const GitCommands = require('./cmd');
const log = console.log;

// private
const PRIVATE_DATA = Symbol('DATA_MODEL');
const PRIVATE_METHODS = Symbol('PRIVATE_METHODS');


class Listener extends GitCommands {

    constructor(props) {
        super();

        this[PRIVATE_DATA] = {
            INITIALIZED: false,
            IS_READY: true,
            INTERVAL_INSTANCE: null,
            EXECUTE_STACK: []
        };

        this.PROPERTIES = props;

        this.INSTANCE = {
            currentBranch: this.gitCmd('current-branch')
        };

    }

    //
    stop() {
        clearInterval(this[PRIVATE_DATA].INTERVAL_INSTANCE);
    }

    onChange(callback) {
        const self = this;
        if (typeof callback !== 'function') { return; }

        self[PRIVATE_DATA].EXECUTE_STACK.push(callback);

        if (!self[PRIVATE_DATA].INITIALIZED) {
            self[PRIVATE_DATA].INTERVAL_INSTANCE = setInterval(() => {
                trigger();
            }, 1000);
        }

        function trigger() {
            if (!self[PRIVATE_DATA].IS_READY) { return; }
            self[PRIVATE_DATA].IS_READY = false;

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
