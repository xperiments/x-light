var discoverBridges = require('./discovery');

discoverBridges({
	type: 'v6'
}).then(function(results) {
	console.log(results);
});
