
var path = require('path');
var fs = require('fs');
var recursive = require('recursive-readdir');
var glob = require('glob');
var Promise = require('promise');
var debug = require('debug')('brunch:timestamp');

function TimestampBrunch(brunchCfg){

    var cfg =  brunchCfg.plugins.timestampbrunch;

    var publicFolder = brunchCfg.paths.public;

    var timestamp = Math.floor(new Date().getTime()/1000 / 60);

    this.onCompile = function(generatedFiles){



        if(brunchCfg.server.run){
            debug('Can\'t run with brunch watch');
            return;
        }

        if(brunchCfg.env.length==0){
            debug('Specify env');
            return;
        }

        if(cfg.environments.indexOf(brunchCfg.env[0])!=-1){

            debug('Start ');

            this.cleanOld(publicFolder).then(function(f){

                debug('Deleted files :: ', f);

                this.renameFile(generatedFiles).then(
                    function(files){

                        this.replaceContent(files);

                    }.bind(this),

                    function(err){
                        throw new Error('Rename file error ', err);
                    }
                );

            }.bind(this));

        }else{
            debug('Env :: '+cfg.environments+' not found in' , brunchCfg.env);
        }

    };

    this.renameFile = function(generatedFiles){



        function looping(filePath){

            return new Promise(function(resolve, reject){

                var dir   = path.dirname(filePath);
                var ext   = path.extname(filePath);
                var base  = path.basename(filePath, ext);

                var currentfile = dir+'/'+base+ext;

                if(fs.existsSync(currentfile)){

                    var newName = base+'-'+timestamp+(cfg.suffix ? '.'+cfg.suffix : '')+ext;

                    fs.rename(currentfile, dir+'/'+newName, function(err){

                        if(err) {
                            throw new Error('rename error ', currentfile, err);
                        }


                        debug('File renamed  ' +currentfile, ' to ', newName);

                        return resolve({
                            "newName" : newName,
                            "oldName" : currentfile
                        });

                    }.bind(this));

                }else{
                    debug('File not found ' +files[file]);
                    throw new Error('rename File not found ', currentfile);
                }


            }.bind(this));

        }

        var promises = [];

        for (var file in  generatedFiles) {
            promises.push(looping(generatedFiles[file].path));
        }

        return Promise.all(promises);

    };

    this.replaceContent = function(filesInfos){

        //parse ref files ex :index.html
        glob(publicFolder +'/' + cfg.referenceFiles, {}, function (er, files) {

            if(er){
                throw new Error('Error with referenceFiles param ', er);
                return;
            }

            for(var file in files){

                if(fs.existsSync(files[file])){

                    var content = fs.readFileSync(files[file], 'UTF-8');

                    //parse timestamped files
                    for(var fileInfo in filesInfos){

                        var ext   = path.extname(filesInfos[fileInfo].oldName);
                        var base  = path.basename(filesInfos[fileInfo].oldName, ext);

                        var regExp = new RegExp(base+ext);

                        if(regExp.test(content)){

                            content = content.replace(regExp,filesInfos[fileInfo].newName);

                            debug('Replace in ' + files[file] +' '+ filesInfos[fileInfo].oldName +' by '+ filesInfos[fileInfo].newName);

                        }

                    }

                    fs.writeFileSync(files[file], content);

                }else{
                    throw new Error('File not found ', files[file]);
                }
            }

        })

    };

    this.cleanOld = function(base, ext){

        var p = new Promise(function(resolve, reject){

            return recursive(publicFolder, function (err, files) {

                return resolve(files);

            })
        });

        return p.then(function(files){


            function unlinkFiles(f){

                return new Promise(function(resolve, reject){

                    return fs.unlink(f, function(err){

                        if(err) return reject(err);

                        else return resolve(f);

                    });

                })
            }

            var promises = [];

            for(var file in files){

                if(/-\d+(\.[^\d]+)?\.[^\d]+$/.test(files[file])) {

                    promises.push(unlinkFiles(files[file]));

                }

            }

            return Promise.all(promises);

        })

    };
}

TimestampBrunch.prototype.brunchPlugin = true;
TimestampBrunch.prototype.type = 'javascript';
TimestampBrunch.prototype.extension = 'js';

module.exports = TimestampBrunch;