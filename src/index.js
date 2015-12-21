
var path = require('path');
var fs = require('fs');
var recursive = require('recursive-readdir');
var glob = require('glob');
var Promise = require('promise');
var debug = require('debug')('brunch:timestamp');

function TimestampBrunch(brunchCfg){

    var cfg =  brunchCfg.plugins.timestampbrunch;

    var publicFolder = brunchCfg.paths.public;

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

            this.cleanOld(publicFolder).then(function(){

                this.renameFile(generatedFiles).then(function(files){

                    this.replaceContent(files);

                }.bind(this));

            }.bind(this));

        }else{
            debug('Env :: '+cfg.environments+' not found in' , brunchCfg.env);
        }

    };

    this.renameFile = function(generatedFiles){

        var timestamp = new Date().getTime();

        function looping(filePath){

            return new Promise(function(resolve, reject){

                var dir   = path.dirname(filePath);
                var ext   = path.extname(filePath);
                var base  = path.basename(filePath, ext);

                var currentfile = dir+'/'+base+ext;

                if(fs.existsSync(currentfile)){

                    var newName = base+'-'+timestamp+(cfg.suffix ? '.'+cfg.suffix : '')+ext;

                    fs.rename(currentfile, dir+'/'+newName, function(err){

                        if(err)  return reject(err);

                        return resolve({
                            "newName" : newName,
                            "oldName" : currentfile
                        });

                    }.bind(this));

                }else{
                    if(err)   reject('File not found  ', currentfile);
                    debug('File not found ' +files[file]);
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
                debug('Error with referenceFiles param ' +er);
                return;
            }

            for(var file in files){

                if(fs.existsSync(files[file])){

                    //parse timestamped files
                    for(var fileInfo in filesInfos){

                        var ext   = path.extname(filesInfos[fileInfo].oldName);
                        var base  = path.basename(filesInfos[fileInfo].oldName, ext);

                        var content = fs.readFileSync(files[file], 'UTF-8');

                        var regExp = new RegExp(base+ext);

                        if(regExp.test(content)){

                            content = content.replace(regExp,filesInfos[fileInfo].newName);

                            debug('Replace in ' + files[file] +' '+ filesInfos[fileInfo].oldName +' by '+ filesInfos[fileInfo].newName);

                            fs.writeFileSync(files[file], content);
                        }

                    }
                }else{
                    debug('File not found ' +files[file]);
                }
            }

        })

    };

    this.cleanOld = function(base, ext){

        return new Promise(function(resolve, reject){

            recursive(publicFolder, function (err, files) {

                for(var file in files){

                    if(/-\d+(\.[^\d]+)?\.[^\d]+$/.test(files[file])){

                        fs.unlink(files[file]);

                    }
                }

                return resolve(true);

            });

        });

    };
}

TimestampBrunch.prototype.brunchPlugin = true;
TimestampBrunch.prototype.type = 'javascript';
TimestampBrunch.prototype.extension = 'js';

module.exports = TimestampBrunch;