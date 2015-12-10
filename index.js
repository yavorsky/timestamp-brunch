var path = require('path');
var fs = require('fs');
var recursive = require('recursive-readdir');
var glob = require('glob');
var Promise = require('promise');

function TimestampBrunch(brunchCfg){

    var cfg = brunchCfg.plugins.timestampbrunch;

    var publicFolder = brunchCfg.paths.public;

    this.onCompile = function(generatedFiles){

        if(brunchCfg.server.run){
            console.log('TimestampBrunch can\'t run with brunch watch');
            return;
        }

        if(cfg.environments.indexOf(brunchCfg.env[0])!=-1){

            this.cleanOld(publicFolder).then(function(){

                this.renameFile( generatedFiles).then(function(files, currentfile){

                    this.replaceContent(files);

                }.bind(this));

            }.bind(this));

        }else{
            console.log('TimestampBrunch Error');
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

                    var newName = base+'-'+new Date().getTime()+(cfg.suffix ? cfg.suffix : '')+ext;

                    fs.rename(currentfile, dir+'/'+newName, function(err){

                        if(err)  return reject(err);

                        var o = {
                            "newName" : newName,
                            "oldName" : currentfile
                        }

                        return resolve(o);

                    }.bind(this));

                }else{
                    if(err)   reject('File not found  ', currentfile);
                    throw console.warn('File not found  ', currentfile);
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

        glob(publicFolder +'/' + cfg.referenceFiles, {}, function (er, files) {

            for(var file in files){

                if(fs.existsSync(files[file])){

                    for(var fileInfo in filesInfos){

                        var ext   = path.extname(filesInfos[fileInfo].oldName);
                        var base  = path.basename(filesInfos[fileInfo].oldName, ext);

                        var content = fs.readFileSync(files[file], 'UTF-8');

                        var regExp = new RegExp(base+ext);

                        if(regExp.test(content)){

                            content = content.replace(regExp,filesInfos[fileInfo].newName);

                            fs.writeFileSync(files[file], content);
                        }
                    }
                }
            }

        });

    };

    this.cleanOld = function(base, ext){

        return new Promise(function(resolve, reject){

            recursive(publicFolder, function (err, files) {
                // Files is an array of filename
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