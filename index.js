var path = require('path');
var fs = require('fs');
var glob = require('glob');
var Promise = require('promise');

function TimestampBrunch(brunchCfg){
	
	var cfg = brunchCfg.plugins.timestampbrunch

	var publicFolder = brunchCfg.paths.public;

	this.onCompile = function(generatedFiles){

        if(cfg.environments.indexOf(brunchCfg.env[0])==1){

          this.cleanOld(publicFolder).then(function(){

              for (var file in  generatedFiles){

                  this.renameFile( generatedFiles[file].path);
              }

          }.bind(this));

        }else{
            console.log('TimestampBrunch Error');
        }

	}

    this.renameFile = function(filePath){

        var dir   = path.dirname(filePath);
        var ext   = path.extname(filePath);
        var base  = path.basename(filePath, ext);

        var currentfile = dir+'/'+base+ext;

        if(fs.existsSync(currentfile)){

            var newName = base+'-'+new Date().getTime()+ext;

            fs.rename(currentfile, dir+'/'+newName, function(err){

                if(err) throw console.warn('Erreur ',err);

                this.replaceContent(filePath, newName);

            }.bind(this));

        }else{

            throw console.warn('File not found  ', currentfile);
        }

    }

    this.replaceContent = function(filePath, newName){

        var filepath = publicFolder+'/'+cfg.referenceFiles;

        if(fs.existsSync(filepath)){

            var ext   = path.extname(filePath);
            var base  = path.basename(filePath, ext);

            var content = fs.readFileSync(filepath, 'UTF-8');

            var reg = new RegExp(base+ext);

            content = content.replace(reg, newName);

            fs.writeFileSync(filepath, content);

        }

    }

    this.cleanOld = function(base, ext){

        return new Promise(function(resolve, reject){

            var path = publicFolder+'/**/*[0-9].*';

            // console.log(path)
           return glob(path, {}, function (er, files) {

                if(er){
                   return  reject(false);
                }
                for(var file in files){
                    fs.unlink(files[file]);
                }

                return resolve(true);
            });

        });

    }
}

TimestampBrunch.prototype.brunchPlugin = true;
TimestampBrunch.prototype.type = 'javascript';
TimestampBrunch.prototype.extension = 'js';

module.exports = TimestampBrunch;