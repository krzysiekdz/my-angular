/* jshint globalstrict: true */
/* global angular: false */
'use strict';

var FN_EXPR = /^\s*function\s*[a-zA-Z_$]*\s*\(([^\)]*)\)/m;
var STRIP_COMMENTS = /(\/\*.*?\*\/)|(\/\/.*)/g;
var STRIP_USCORE = /_([a-zA-Z$_]+)_/;
var INSTANTIATING = {};

function createInjector(modulesToLoad, strictDi) {

	var loadedModules = new HashMap();
	strictDi = (strictDi === true);

	var instanceCache = {};
	var providerCache = {};
	var providerInjector = createInternalInjector(providerCache, function() { throw 'wrong provider name!';});
	var instanceInjector = createInternalInjector(instanceCache, function(key) {
		if(providerCache.hasOwnProperty(key + 'Provider')) {//'Provider' string is necessary, because otherwise we could get provider
			return providerCache[key + 'Provider'];
		} else {
			throw 'no provider for depenedency: ' + key + ' !';
		}
	});

	instanceCache.$injector = instanceInjector;	 
	providerCache.$injector = providerInjector;	 

	function enforceReturnValue(fn) {
		return function() {
			var ret = instanceInjector.invoke(fn); //invoking fn in instanceCache context manually, because we want to check return value
			if(_.isUndefined(ret)) {
				throw 'factory must return a value!';
			}
			return ret;
		};
	}

	var $provide = {
		constant: function(key, value) {
			if(key === 'hasOwnProperty') {
				throw 'hasOwnProperty is not valid constant name!';
			}
			instanceCache[key] = value;
			providerCache[key] = value;
		},
		provider: function(key, provider) {
			if(_.isFunction(provider)) {
				provider = providerInjector.instantiate(provider);
			}
			providerCache[key + 'Provider'] = provider;
		},
		config: function(configFn) {
			providerInjector.invoke(configFn, $provide);
		}, 
		run: function(runFn) {
			instanceInjector.invoke(runFn, $provide);
		},
		factory: function(key, factoryFn, enforce) { //factory is a ready to use simple provider object with $get method only
			this.provider(key, {$get:  enforce === false ? factoryFn : enforceReturnValue(factoryFn)});
		},
		value: function(key, value) { //value is also ready to use provider object which returns a value
			this.factory(key, function() { return value;}, false)
		}, 
		service: function(key, serviceConstructor) {
			// this.provider(key, {$get: function() {
			// 	return instanceInjector.instantiate(serviceConstructor);
			// }});

			this.factory(key, function() {
				return instanceInjector.instantiate(serviceConstructor); //constructing object which $get will return
			});
		},
		decorator: function(key, decoratorFn) {
			var provider = providerInjector.get(key + 'Provider');
			if(provider.$$delegates === undefined) {
				provider.$$delegates = [];
			}
			provider.$$delegates.push(decoratorFn);
		}
	};

	providerCache.$provide = $provide;

	function runInvokeQueue(queue) {
		_.forEach(queue, function(invokeArgs) {
			var method = invokeArgs[0];
			var args = invokeArgs[1];
			$provide[method].apply($provide, args);
		});
	}

	var runBlocks = [];
	_.forEach(modulesToLoad, function loadModules(moduleName) {

		if(!loadedModules.get(moduleName)) {
			loadedModules.put(moduleName, true);

			if(_.isString(moduleName)) {
				var module = angular.module(moduleName);
				if(module.requires.length > 0) {
					_.forEach(module.requires, loadModules);
				}
				runInvokeQueue(module._invokeQueue);
				runInvokeQueue(module._configBlocks);
				runBlocks = runBlocks.concat(module._runBlocks);
			}
			else if (_.isArray(moduleName) || _.isFunction(moduleName)) {
				var runFn = providerInjector.invoke(moduleName) ;
				if(_.isFunction(runFn)) {
					runBlocks.push(['run', [runFn]]);
				}
			}
		}
	});

	runInvokeQueue(runBlocks);
	

	
	function createInternalInjector(cache, factoryFn) {
		var path = [];

		function getService(key) {
			if(cache.hasOwnProperty(key)) {
				if(cache[key] === INSTANTIATING) {
					throw new Error('Circular dependency found: ' + key + ' <- '+ path.join(' <- '));
				}
				return cache[key];
			} else {
				try {
					cache[key] = INSTANTIATING;
					path.unshift(key);
					var provider = factoryFn(key);
					var instance = cache[key] = invoke(provider.$get, provider);
					decorate(instance, provider.$$delegates);
					return instance;
				} finally {
					path.shift();
					if(cache[key] === INSTANTIATING) {
						delete cache[key];
					}	
				}
			}
		}

		function invoke (fn, thisObj, locals) {
			var toInject = annotate(fn);
			var args = _.map(toInject, function(key) {
				if(_.isString(key)) {
					if(locals && locals.hasOwnProperty(key))
						return locals[key];
					return getService(key);
				} else {
					throw 'Incorrect injection token! Expected a string, got: (value=' + key + ', type=' + (typeof key) + ')' ;
				}
			});
			if(_.isArray(fn)) {
				fn = fn[fn.length-1];
			}
			return fn.apply(thisObj, args);
		}

		function instantiate(fn, locals) {
			var unwrapped = _.isArray(fn) ? fn[fn.length-1] : fn;
			var obj = Object.create(unwrapped.prototype);
			invoke(fn, obj, locals);
			return obj;
		}

		function decorate(instance, delegates) {
			if(delegates) {
				_.forEach(delegates, function(delegate) {
					invoke(delegate, undefined, {$delegate: instance});
				});
			}
		}

		return {
			has: function(key) {
				try {
					return ( cache.hasOwnProperty(key) || ( factoryFn(key) !== undefined ) );
				} catch(e) {
					return false;
				}
			},
			get: function(key) {
				return getService(key);
			},
			invoke: invoke,
			annotate: annotate,
			instantiate: instantiate,
		};

	}

	function annotate(fn) {
		if(fn.$inject) {
			return fn.$inject;
		} else if (_.isArray(fn)) {
			return fn.slice(0, fn.length-1);
		} else if (fn.length > 0) {
			if(strictDi) {
				throw 'function is not using an explicit annotation and cannot be invoked in strict mode';
			}
			var fn_str = fn.toString().replace(STRIP_COMMENTS, '');
			var r = FN_EXPR.exec(fn_str);
			return splitArgs(r[1]);
		} else {
			return [];
		}
	}

	function splitArgs(args) {
		args = args.split(',');
		var ret = [];
		for(var i = 0; i < args.length; i++) {
			var arg = args[i].trim();
			var arg2 = STRIP_USCORE.exec(arg);
			if(arg2 !== null) {
				arg = arg2[1];
			}
			ret.push(arg);
		}
		return ret;
	}

	
	

	return instanceInjector;
	
}