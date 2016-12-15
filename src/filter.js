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
	return function(arr, filterExpr, comparator) {
		var predicateFn;
		if(_.isFunction(filterExpr)){
			predicateFn = filterExpr;
		} else if (_.isString(filterExpr) || 
			_.isNumber(filterExpr) || 
			_.isBoolean(filterExpr) || 
			_.isNull(filterExpr) || 
			_.isObject(filterExpr)) {
			predicateFn = createPredicateFn(filterExpr, comparator);
		} else {
			return arr;
		}
		return _.filter(arr, predicateFn);
	};
}

function createPredicateFn(expr, userComparator) {
	var wildcard = false;
	if(_.isObject(expr) && ('$' in expr))
		wildcard = true;

	function deepCompare(actual, expected, compare, matchAnyProp, inWildcard) {
		if(_.isString(expected) && _.startsWith(expected, '!')) {
			return !deepCompare(actual, expected.substring(1), comparator, matchAnyProp, inWildcard);
		} else if (_.isArray(actual)) {
			return _.some(actual, function(actualItem) {
				return deepCompare(actualItem, expected, compare, matchAnyProp, inWildcard);
			});
		} else if (_.isObject(actual)) {
			if(_.isObject(expected) && !inWildcard) {//both are objects
				return _.every(_.toPlainObject(expected), function(expVal, expKey) {
					if(_.isUndefined(expVal)) {
						return true;
					}
					else if(expKey === '$') { //if wildcard, we treat it, like matchAnyPorp case, so we are taking expVal , for ex. "o" and pass it with actual object; it calls matchAnyProp if
						return deepCompare(actual, expVal, comparator, true, true);//inWildcard === true
					} else {
						return deepCompare(actual[expKey], expVal, comparator, false, inWildcard);	
					}
				});
			} else if (matchAnyProp) {//matchAnyProp if
				return _.some(actual, function(actualVal, actualProp) {
					return deepCompare(actualVal, expected, comparator, matchAnyProp, inWildcard);
				});
			} else {
				return comparator(actual, expected);
			}
			
		} else {
			if(wildcard)
				return comparator(actual, expr.$);
			return comparator(actual, expected);
		}
	}

	function comparator(actual, expected) {
		if(_.isNull(actual) || _.isNull(expected)) {//that means null never will be converted into string
			return actual === expected;
		} else if (_.isUndefined(actual) || _.isUndefined(expected)) {
			return false;	
		} else if(_.isObject(expected) || _.isObject(actual)) { //this situation may happen
			return false;
		}
		else {
			expected = ('' + expected).toLowerCase();
			actual = ('' + actual).toLowerCase();
			return actual.indexOf(expected) !== -1;	
		}	
	}

	return function(item) {
		if(userComparator === true) {
			userComparator = _.isEqual;
		}
		comparator = _.isFunction(userComparator)? userComparator: comparator;
		return deepCompare(item, expr, comparator, true, false);
	};
}

//needed to be invoked first in the test case if predefined filters needed
function bootFilters() {
	register('filter', filterFilter);
}
