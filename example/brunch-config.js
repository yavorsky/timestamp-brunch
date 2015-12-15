exports.config = {
    "modules": {
        "wrapper": false,
        "definition": false
    },
    "overrides" : {
    	"production" : {
    		"paths" : {
    			"public" : "dist"
    		},
    		"optimize": true,
            "sourceMaps": false,
    		"plugins" : {
	    		"timestampbrunch":{
	    			"suffix" : 'min'
	    		}
	    	}
    	},
    	"dev" : {
    		"paths" : {
    			"public" : "dev"
    		},
    		"optimize": true,
            "sourceMaps": false,
    		"plugins" : {
	    		"timestampbrunch":{
	    			"suffix" : 'dev'
	    		}
	    	}
    	}
    },
	"files" : {
		"javascripts" : {
			"joinTo" : {
				"js/app.js" : /^app/,
				"js/vendor.js" : /^bower_components/
			}
		}
	},
	"plugins": {
		"timestampbrunch" : {
			"environments" : ['dev', 'production'],
			"referenceFiles" : 'index.html'

		}
	}     
}