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
		} else if (_.isString(filterExpr) || 
			_.isNumber(filterExpr) || 
			_.isBoolean(filterExpr) || 
			_.isNull(filterExpr) || 
			_.isObject(filterExpr)) {
			predicateFn = createPredicateFn(filterExpr);
		} else {
			return arr;
		}
		return _.filter(arr, predicateFn);
	};
}

function createPredicateFn(expr) {

	function deepCompare(actual, expected, compare, matchAnyProp) {
		if(_.isString(expected) && _.startsWith(expected, '!')) {
			return !deepCompare(actual, expected.substring(1), comparator, matchAnyProp);
		} else if (_.isArray(actual)) {
			return _.some(actual, function(actualItem) {
				return deepCompare(actualItem, expected, compare, matchAnyProp);
			});
		} else if (_.isObject(actual)) {
			if(_.isObject(expected)) {//both are objects
				return _.every(_.toPlainObject(expected), function(expVal, expKey) {
					if(_.isUndefined(expVal)) {
						return true;
					}
					return deepCompare(actual[expKey], expVal, comparator, false);
				});
			} else if (matchAnyProp) {
				return _.some(actual, function(actualVal, actualProp) {
					return deepCompare(actualVal, expected, comparator, matchAnyProp);
				});
			} else {
				return comparator(actual, expected);
			}
			
		} else {
			return comparator(actual, expected);
		}
	}

	function comparator(actual, expected) {
		if(_.isNull(actual) || _.isNull(expected)) {//that means null never will be converted into string
			return actual === expected;
		} else if (_.isUndefined(actual) || _.isUndefined(expected)) {
			return false;
		} else if(_.isObject(expected)) { //this situation may happen
			return false;
		}
		else {
			expected = ('' + expected).toLowerCase();
			actual = ('' + actual).toLowerCase();
			return actual.indexOf(expected) !== -1;	
		}	
	}

	return function(item) {
		return deepCompare(item, expr, comparator, true);
	};
}

//needed to be invoked first in the test case if predefined filters needed
function bootFilters() {
	register('filter', filterFilter);
}
