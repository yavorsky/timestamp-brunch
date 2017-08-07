'use strict';

const path = require('path');
const fs = require('fs');
const recursive = require('recursive-readdir');
const glob = require('glob');
const debug = require('debug')('brunch:timestamp');

const scriptTarg = /<script>window\.appVersion = .+<\/script>/;

const TimestampBrunch = class TimestampBrunch {

    constructor(brunchCfg) {
        this.brunchCfg = brunchCfg;

        this.cfg = brunchCfg.plugins.timestampbrunch;

        this.publicFolder = brunchCfg.paths.public;

        this.timestamp = Math.floor(new Date().getTime() / 1000 / 60);
        this.separator = '-';
    }

    onCompile(generatedFiles) {
        if (this.brunchCfg.persistent) {
          this.timestamp = '';
          this.separator = '';
          this.renameFilePromised(generatedFiles).then(
            function (files) {

              this.replaceContent(files);

            }.bind(this),

            function (err) {
              throw new Error('Rename file error ', err);
            }
          );
          return;
        }
        if (this.brunchCfg.server.run) {
            debug('Can\'t run with brunch watch');
            return;
        }

        if (this.brunchCfg.env.length == 0) {
            debug('Specify env');
            return;
        }

        if (this.cfg.environments === '*' || this.cfg.environments.indexOf(this.brunchCfg.env[0]) != -1) {

            debug('Start ');

            this.cleanOld(this.publicFolder).then(function (f) {

                debug('Deleted files :: ', f);

                this.renameFilePromised(generatedFiles).then(
                    function (files) {

                        this.replaceContent(files);

                    }.bind(this),

                    function (err) {
                        throw new Error('Rename file error ', err);
                    }
                );

            }.bind(this));

        } else {
            debug('Env :: ' + this.cfg.environments + ' not found in', this.brunchCfg.env);
        }

    }

    /*
     * Get files list
     * */
    getReadFile() {

        let publicFolder = this.publicFolder;

        return new Promise(function (resolve, reject) {

            return recursive(publicFolder, function (err, files) {

                return resolve(files);

            });

        });

    }

    /*
     * Clean old generated files
     * */
    cleanOld() {

        let readFiles = this.getReadFile();

        return readFiles.then(function (files) {

            var promises = [];

            for (let file in files) {

                if (/-\d+(\.[^\d]+)?\.[^\d]+$/.test(files[file])) {

                    promises.push(
                        this.removeFiles(files[file])
                    );

                }
            }

            if (promises.length === 0) {
                return Promise.all(['true']);
            }

            return Promise.all(promises);

        }.bind(this));
    }

    /*
     * Unlink files
     * */
    removeFiles(file) {

        return new Promise(function (resolve, reject) {

            return fs.unlink(file, function (err) {

                if (err) return reject(err);

                else return resolve(file);

            });

        });

    }

    /*
     * Rename file promises
     * */
    renameFilePromised(generatedFiles) {

        let promises = [];

        let newNameFile = this.timestamp + (this.cfg.suffix ? '.' + this.cfg.suffix : '');

        for (let file in  generatedFiles) {

            promises.push(
                this.renameFiles(generatedFiles[file].path, newNameFile)
            );

        }

        return Promise.all(promises);

    }

    /*
     * Rename file with timestamp and suffix
     * */
    renameFiles(filePath, newNameFile) {

        return new Promise(function (resolve, reject) {

            let dir = path.dirname(filePath);
            let ext = path.extname(filePath);
            let base = path.basename(filePath, ext);

            let currentfile = dir + '/' + base + ext;

            if (fs.existsSync(currentfile)) {

                let newName = base + this.separator + newNameFile + ext;

                fs.rename(currentfile, dir + '/' + newName, function (err) {

                    if (err) {
                        throw new Error('rename error ', currentfile, err);
                    }

                    debug('File renamed  ' + currentfile, ' to ', newName);

                    return resolve({
                        "newName": newName,
                        "oldName": currentfile
                    });

                }.bind(this));

            } else {
                throw new Error('rename File not found ', currentfile);
            }

        }.bind(this));


    }

    /*
     * Replace sources in referenceFiles with new name
     *
     * */
    replaceContent(filesInfos) {

        //parse ref files ex :index.html
        const { timestamp } = this;
        glob(this.publicFolder + '/' + this.cfg.referenceFiles, {}, function (er, files) {

            if (er) {
                throw new Error('Error with referenceFiles param ', er);
                return;
            }

            for (let file in files) {

                if (fs.existsSync(files[file])) {

                    let content = fs.readFileSync(files[file], 'UTF-8');

                    //parse timestamped files
                    for (let fileInfo in filesInfos) {

                        let ext = path.extname(filesInfos[fileInfo].oldName);
                        let base = path.basename(filesInfos[fileInfo].oldName, ext);
                        let regExp = new RegExp(`(${base}(\\-\\d+)?(\\.min)?${ext})`);

                        // let regExp = new RegExp(base + '.*' + ext);

                        if (regExp.test(content)) {
                            const scriptString = `<script>window.appVersion = "${timestamp}";</script>`;

                            content = content
                                .replace(regExp, filesInfos[fileInfo].newName)
                                .replace(scriptTarg, scriptString);

                            debug('Replace in ' + files[file] + ' ' + filesInfos[fileInfo].oldName + ' by ' + filesInfos[fileInfo].newName);

                        }

                    }

                    fs.writeFileSync(files[file], content);

                } else {
                    throw new Error('File not found ', files[file]);
                }
            }

        })

    }
}
;


TimestampBrunch.prototype.brunchPlugin = true;

module.exports = TimestampBrunch;