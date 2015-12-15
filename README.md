# TimeStamp Brunch

Add timestamp to avoid the cache. JS/CSS
```
npm i timestamp-brunch -save
```
## Example 
Config : 
```json
"plugins": {
	"timestampbrunch" : {
		"environments" : ["dev", "production"],
		"referenceFiles" : "index.html",
		"suffix" : "min"
	}
}
```
Brunch build 
```
brunch build -e dev
```
This script tags will be compile
```html
<script src="js/vendor.js"></script>
<script src="js/app.js"></script>
```
to 
```html
<script src="js/vendor-1450212245757.min.js"></script>
<script src="js/app-1450212245757.min.js"></script>
```
and the two new files will be created.
