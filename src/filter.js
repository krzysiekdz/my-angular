var filters = {};

function register(name, factory) {
	if(_.isObject(name)) {
		var arr = [];
		for(var key in name) {
			filters[key] = name[key]();
			arr.push(filters[key]);
		}
		return arr;
	} else {
		var filter = factory();//some work with initing filter
		filters[name] = filter;
		return filter;	
	}
}

function filter(name) {
	return filters[name];
}