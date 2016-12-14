

function any(arr, fn) {
	if(!_.isArray(arr)) {
		throw "expected array in function any, got: " + typeof arr;
	}
	for(var i = 0; i < arr.length; i++) {
		if(fn(arr[i])) {
			return true;
		}
	}
	return false;
}