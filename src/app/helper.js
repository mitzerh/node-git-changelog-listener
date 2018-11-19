/*eslint-env es6, node */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CLI_Helper = require('cli-helper').constructor;

class Helper extends CLI_Helper {

    constructor() {
        super();

    }

    /**
     * valid code changes:
     *
     * A - Added
     * D - Deleted
     * M - Updated
     * ? - New file
     * R - Renamed
     * C - Copied
     * @param  {String} code status code
     * @return {[type]}      [description]
     */
    allowStatusCode(code) {
        return (/^(A|D|M|\?|R|C)/.test(code)) ? true : false;
    }

    // encrypt file
    encrypt(file) {
        let hash = crypto.createHash('sha256');
        hash.update(this.readFile(file));
        return hash.digest('hex');
    }

    // recursive list dir
    listDir(dir) {
        const self = this;
        let files = [];
        trigger(dir);

        function trigger(val) {
            fs.readdirSync(val).forEach((file) => {
                let full = path.join(val, file);
                if (fs.lstatSync(full).isDirectory()) {
                    trigger(full);
                } else {
                    files.push(full);
                }
            });
        }
        return files;
    }

    isDir(dir) {
        return fs.lstatSync(dir).isDirectory();
    }

}

module.exports = new Helper;
