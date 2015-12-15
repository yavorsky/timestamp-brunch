# TimeStamp Brunch

Add timestamp to avoid the cache. JS/CSS

## Example 
This script tags will be compile
```json
"plugins": {
	"timestampbrunch" : {
		"environments" : ['dev', 'production'],
		"referenceFiles" : 'index.html',
		"suffix" : "min"
	}
}
```
```html
<script src="js/vendor.js"></script>
<script src="js/app.js"></script>
```
to 
```html
<script src="js/vendor-1450212245757.min.js"></script>
<script src="js/app-1450212245757.min.js"></script>
```
