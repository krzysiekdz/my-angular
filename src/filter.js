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


//---------------------------- filter: filter 

function filterFilter() {
	return function(arr, filterExpr) {
		var predicateFn;
		if(_.isFunction(filterExpr)){
			predicateFn = filterExpr;
		} else if (_.isString(filterExpr) || _.isNumber(filterExpr) || 
			_.isBoolean(filterExpr) || _.isNull(filterExpr)) {
			predicateFn = createPredicateFn(filterExpr);
		} else {
			return arr;
		}
		return _.filter(arr, predicateFn);
	};
}

function createPredicateFn(expr) {

	function comparator(item) {
		if (_.isObject(item)) {
			for(var key in item) {
				if(comparator(item[key])) {
					return true;
				}
			}
			return false;
		} else {
			if(_.isNull(item) || _.isNull(expr)) {//that means null never will be converted into string
				return item === expr;
			} else if (_.isUndefined(item)) {
				return false;
			} else {
				expr = ('' + expr).toLowerCase();
				item = ('' + item).toLowerCase();
				return item.indexOf(expr) !== -1;	
			}	
		}
	}

	return comparator;
}

//needed to be invoked first in the test case if predefined filters needed
function bootFilters() {
	register('filter', filterFilter);
}
