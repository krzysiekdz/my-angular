/* jshint globalstrict: true*/
/* global setupModuleLoader: false, createInjector:false, angular: false*/
'use strict';

describe('injector', function() {

	beforeEach(function() {
		delete window.angular;
		setupModuleLoader(window);
	});

	it('can be created', function() {
		var injector = createInjector([]);
		expect(injector).toBeDefined();
	});

	it('has a constant that has been registered to a module', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 13);
		var injector = createInjector(['mod1']);
		expect(injector.has('a')).toBe(true);
	});

	it('does not have a non-registered constant', function() {
		var module = angular.module('mod1', []);
		var injector = createInjector(['mod1']);
		expect(injector.has('a')).toBe(false);
	});

	it('does not allow a constant called hasOwnProperty', function() {
		var module = angular.module('mod1', []);
		module.constant('hasOwnProperty', function(){return false});
		//this returns false, but should be true
		// module.constant('a', 13);
		// var injector = createInjector(['mod1']);
		// expect(injector.has('a')).toBe(true);
		expect(function() {
			createInjector(['mod1']);
		}).toThrow();
	});

	it('can return a registered constant', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 13);
		var injector = createInjector(['mod1']);
		expect(injector.get('a')).toBe(13);
	});

	it('loads the required modules of a module', function() {
		var module1 = angular.module('mod1', []);
		var module2 = angular.module('mod2', ['mod1']);
		module1.constant('a', 13);
		module2.constant('b', 14);
		var injector = createInjector(['mod2']);
		expect(injector.get('a')).toBe(13);
		expect(injector.get('b')).toBe(14);
	});

	it('loads the required modules of a module in any deep', function() {
		var module1 = angular.module('mod1', []);
		var module2 = angular.module('mod2', ['mod1']);
		var module3 = angular.module('mod3', ['mod2']);
		module1.constant('a', 13);
		module2.constant('b', 14);
		module2.constant('c', 15);
		var injector = createInjector(['mod3']);
		expect(injector.get('a')).toBe(13);
		expect(injector.get('b')).toBe(14);
		expect(injector.get('c')).toBe(15);
	});

	it('loads each module only once', function() {
		angular.module('mod1', ['mod2']);
		angular.module('mod2', ['mod1']);

		createInjector(['mod2']);
	});

	it('invokes an annotated function with dependency injection', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 10);
		module.constant('b', 11);
		var injector = createInjector(['mod1']);

		var fn = function(one, two){return one+two;}
		fn.$inject = ['a', 'b'];

		expect(injector.invoke(fn)).toBe(21);
	});

	it('does not accept non-strings as injection tokens', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 10);
		module.constant('b', 11);
		var injector = createInjector(['mod1']);

		var fn = function(one, two){return one+two;}
		fn.$inject = ['a', Object({a:1, b:2})];

		
		expect(function() {injector.invoke(fn);}).toThrow();
	});

	it('binding this in DI', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 10);
		var injector = createInjector(['mod1']);

		var obj = {
			b: 11,
			fn : function(one){return one+this.b;}
		};
		obj.fn.$inject = ['a'];
		
		expect(injector.invoke(obj.fn, obj)).toBe(21);
	});

	it('override dependencies with locals when invoking', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 10);
		module.constant('b', 20);
		var injector = createInjector(['mod1']);

		var fn = function(one, two){ return one + two; }
		fn.$inject = ['a', 'b'];
		
		expect(injector.invoke(fn, {}, {b:4})).toBe(14);
	});

	it('throws when using non-annotated in strict mode', function() {
		var injector = createInjector([], true);
		var fn = function(a,b,c){};

		expect(function() {
			injector.annotate(fn);
		}).toThrow();
	});

	it('invokes a non-annotated function with DI', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 10);
		module.constant('b', 11);
		var injector = createInjector(['mod1']);

		var fn = function(a, b){return a+b;}

		expect(injector.invoke(fn)).toEqual(21);
	});

	it('invokes an array annotated function with DI', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 10);
		module.constant('b', 11);
		var injector = createInjector(['mod1']);

		var fn = ['a', 'b',  function(a, b){return a+b;}];

		expect(injector.invoke(fn)).toEqual(21);
	});

	it('instantiates an annotated constructor function', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 10);
		module.constant('b', 11);
		var injector = createInjector(['mod1']);

		var Type = function(a, b) {
			this.result = a + b;
		};
		var obj = injector.instantiate(Type);
		expect(obj.result).toEqual(21);
	});

	it('uses the prototype of construcotor when instantiating', function() {
		var injector = createInjector([]);
		var Type = function() {};
		Type.prototype.getValue = 32;

		var Type2 = function(){
			this.value = this.getValue;
		};
		Type2.prototype = Type.prototype;

		var obj = injector.instantiate(Type2);
		expect(obj.value).toEqual(32);
	});

	it('support locals when instantiating', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 10);
		module.constant('b', 11);
		var injector = createInjector(['mod1']);

		var Type = function(a, b) {
			this.result = a + b;
		};
		var obj = injector.instantiate(Type, {b:1});
		expect(obj.result).toEqual(11);
	});

	
});


describe('annotate', function() {

	it('returns the $inject annotation of a function when it has one', function() {
		var injector = createInjector([]);
		var fn = function(){};
		fn.$inject=['a','b'];

		expect(injector.annotate(fn)).toEqual(['a', 'b']);
	});

	it('returns the array-style annotations of a function', function() {
		var injector = createInjector([]);
		var fn = ['a', 'b', function(){}];

		expect(injector.annotate(fn)).toEqual(['a', 'b']);
	});

	it('returns an empty array for a non-annotated 0-arg function', function() {
		var injector = createInjector([]);
		var fn = function(){};

		expect(injector.annotate(fn)).toEqual([]);
	});

	it('returns annotations parsed from function args when non annotated', function() {
		var injector = createInjector([]);
		var fn = function(a,b,c){};

		expect(injector.annotate(fn)).toEqual(['a', 'b', 'c']);
	});

	it('strips comments from arguments list', function() {
		var injector = createInjector([]);
		var fn = function(a,b /*ala*/ ,c){};

		expect(injector.annotate(fn)).toEqual(['a', 'b', 'c']);
	});

	it('strips several comments from arguments list', function() {
		var injector = createInjector([]);
		var fn = function(a,b /*ala*/ ,c /*ola*/){};

		expect(injector.annotate(fn)).toEqual(['a', 'b', 'c']);
	});

	it('strips // comments from arguments list', function() {
		var injector = createInjector([]);
		var fn = function(a,b //ala
			,c){};

		expect(injector.annotate(fn)).toEqual(['a', 'b', 'c']);
	});

	it('strips surrounding underscores from arguments names', function() {
		var injector = createInjector([]);
		var fn = function(a, _b_, _c, d_){};

		expect(injector.annotate(fn)).toEqual(['a', 'b', '_c', 'd_']);
	});

});

describe('provider', function() {

	beforeEach(function() {
		delete window.angular;
		setupModuleLoader(window);
	});

	it('allows registering provider', function() {
		var module = angular.module('mod1', []);
		module.provider('a', {$get: function() {return 34;}});
		var injector = createInjector(['mod1']);
		expect(injector.has('a')).toBe(true);
		expect(injector.get('a')).toEqual(34);
	});

	it('inject to the $get method of provider', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 3);
		module.provider('b', {$get: function(a) {return 2*a;}});
		var injector = createInjector(['mod1']);
		expect(injector.get('b')).toEqual(6);
	});

	it('lazy instantiation of dependencies', function() {
		var module = angular.module('mod1', []);
		module.provider('b', {$get: function(a) {return 2*a;}});
		module.constant('a', 4);
		var injector = createInjector(['mod1']);
		expect(injector.get('b')).toEqual(8);
	});

	it('instantiantes dependency only once', function() {
		var module = angular.module('mod1', []);
		module.provider('b', {$get: function(a) {return  {a:a}; }});
		module.constant('a', 4);
		var injector = createInjector(['mod1']);
		expect(injector.get('b')).toBe(injector.get('b'));
	});

	it('notifies the user about circular dependency', function() {
		var module = angular.module('mod1', []);
		module.provider('a', {$get: function(b) {}});
		module.provider('b', {$get: function(c) {}});
		module.provider('c', {$get: function(a) {}});
		var injector = createInjector(['mod1']);

		expect(function() {injector.get('a');}).toThrowError("Circular dependency found: a <- c <- b <- a");
	});

	it('cleans up the circular marker', function() {
		var module = angular.module('mod1', []);
		module.provider('a', {$get: function() {throw 'Failing instantiation!'}});
		
		var injector = createInjector(['mod1']);

		expect(function() {injector.get('a');}).toThrow('Failing instantiation!');
		expect(function() {injector.get('a');}).toThrow('Failing instantiation!');
	});

	it('instantiantes a provider if given a constructor function', function() {
		var module = angular.module('mod1', []);
		module.provider('b', function() {
			this.$get = function() {return 12;};
		});
		
		var injector = createInjector(['mod1']);
		expect(injector.get('b')).toEqual(12);
	});

	it('instantiantes a provider if given a constructor function', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 5);
		module.provider('b', function(a) { //provider is instantiated when the incjector is created, so dependencies must exists! 
			this.$get = function() {return 2*a;};//if used dependencies here, lazy initialization will work, upper will not work
		});
		var injector = createInjector(['mod1']);
		expect(injector.get('b')).toEqual(10);
	});

	it('injects another provider to a provider constructor', function() {
		var module = angular.module('mod1', []);
		module.provider('a', function() {
			var value = 0;
			this.setValue = function(v) {value = v;};
			this.$get = function() {return value;};
		});
		module.provider('b', function(aProvider) {
			aProvider.setValue(8);
			this.$get = function(){};
		});
		
		var injector = createInjector(['mod1']);
		expect(injector.get('a')).toEqual(8);
	});

	it('does not inject an instance to a provider construction function', function() {
		var module = angular.module('mod1', []);
		module.provider('a', function() {
			this.$get = function() {return 13;};
		});
		module.provider('b', function(a) {
			this.$get = function(){return a;};
		});
		
		expect(function() {
			createInjector(['mod1'])
		}).toThrow();
		
	});

	it('does not inject a provider to $get function', function() {
		var module = angular.module('mod1', []);
		module.provider('a', function() {
			this.$get = function() {return 13;};
		});
		module.provider('b', function() {
			this.$get = function(aProvider){return aProvider.$get();};
		});
		
		var injector = createInjector(['mod1']);		

		expect(function() {
			injector.get('b');
		}).toThrow();
		
	});

	it('does not inject a provider to invoke function', function() {
		var module = angular.module('mod1', []);
		module.provider('a', function() {
			this.$get = function() {return 13;};
		});
		
		var injector = createInjector(['mod1']);

		expect(function() {
			injector.invoke(function(aProvider) {});
		}).toThrow();
		
	});

	it('does not give access to provider through get', function() {
		var module = angular.module('mod1', []);
		module.provider('a', function() {
			this.$get = function() {return 13;};
		});
		
		var injector = createInjector(['mod1']);

		expect(function() {
			injector.get('aProvider');
		}).toThrow();
		
	});

	it('unshifts constants before providers', function() {
		var module = angular.module('mod1', []);
		module.provider('a', function(b) {
			this.$get = function() {return b+1;};
		});
		module.constant('b', 18);
		
		var injector = createInjector(['mod1']);

		expect(injector.get('a')).toEqual(19);
		
	});

});

describe('injector-chapter-12', function() {

	it('allows injecting the instance injector to $get', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 1);
		module.provider('b', function() {
			this.$get = function($injector) {
				return $injector.get('a');
			};
		});
		var injector = createInjector(['mod1']);
		expect(injector.get('b')).toEqual(1);
	});

	it('allows injecting the provider injector to provider', function() {
		var module = angular.module('mod1', []);
		module.provider('a', function() {
			this.value = 5;
			this.$get = function() {
				return this.value;
			}
		});
		module.provider('b', function($injector) {
			var apro = $injector.get('aProvider');
			this.$get = function() {
				return apro.value;
			};
		});
		var injector = createInjector(['mod1']);
		expect(injector.get('b')).toEqual(5);
	});

	it('allows injecting the $provide to provider', function() {
		var module = angular.module('mod1', []);
		module.provider('b', function($provide) {
			$provide.constant('a', 18);
			this.$get = function($injector) {
				return $injector.get('a');
			};
		});
		var injector = createInjector(['mod1']);
		expect(injector.get('b')).toEqual(18);
	});

	it('does not allow injecting the $provide to $get', function() {
		var module = angular.module('mod1', []);
		module.provider('b', function() {
			this.$get = function($provide) {
				return 25;
			};
		});
		var injector = createInjector(['mod1']);
		// try {
		// 	injector.get('b');
		// } catch(e) {
		// 	console.log(e);
		// } //no provider for dependency: $provide !
		expect(function() {
			injector.get('b');
		}).toThrow();

	});

	it('run config block when the injector is created', function() {
		var module = angular.module('mod1', []);
		var hasConfig = false;
		module.config(function() {
			hasConfig = true;
		});
		var injector = createInjector(['mod1']);
		expect(hasConfig).toEqual(true);
	});

	it('injects config block with provider', function() {
		var module = angular.module('mod1', []);
		
		module.config(function($provide) {
			$provide.constant('a', 13);
		});
		var injector = createInjector(['mod1']);
		expect(injector.get('a')).toEqual(13);
	});

	it('allows registering config blocks before providers', function() {
		var module = angular.module('mod1', []);
		
		module.config(function(aProvider) {
		});
		module.provider('a', function(){
			this.$get = function(){return 2;}
		})

		var injector = createInjector(['mod1']);
	});

	it('add config block added during module registration', function() {
		var module = angular.module('mod1', [], function($provide) {
			$provide.constant('a', 5);
		});
		
		var injector = createInjector(['mod1']);
		expect(injector.get('a')).toEqual(5);
	});

	it('runs run blocks when the injector is created', function() {
		var module = angular.module('mod1', []);
		var hasRun = false;
		module.run(function() {
			hasRun = true;
		});
		var injector = createInjector(['mod1']);
		expect(hasRun).toEqual(true);
	});


	it('injects run blocks with instance injector', function() {
		var module = angular.module('mod1', []);
		
		module.provider('a', function() {
			this.$get = function() {
				return 8;
			}
		});
		var aa = 0;
		module.run(function(a) {
			aa = a;
		});
		var injector = createInjector(['mod1']);
		expect(aa).toEqual(8);
	});

	it('runs a function module dependency as a config block', function() {
		function fnModule($provide) {	
			$provide.constant('a', 4);
		}
		var module = angular.module('mod1', [fnModule]);
		var injector = createInjector(['mod1']);
		expect(injector.get('a')).toEqual(4);
	});

	it('runs a function module with array injection as a config block', function() {
		var fnModule = ['$provide', function (p) {	
			p.constant('a', 4);
		}];
		var module = angular.module('mod1', [fnModule]);
		var injector = createInjector(['mod1']);
		expect(injector.get('a')).toEqual(4);
	});

	it('supports returning a run block from a function module', function() {
		var aa = 0;
		function fnModule($provide) {	
			$provide.constant('a', 6);
			return function(a) {
				aa = a;
			}
		}
		var module = angular.module('mod1', [fnModule]);
		var injector = createInjector(['mod1']);
		expect(aa).toEqual(6);
	});

	it('only loads function modules once', function() {
		var ctr = 0;
		function fnModule($provide) {	
			ctr++;
		}
		var module = angular.module('mod1', [fnModule, fnModule]);
		var injector = createInjector(['mod1']);
		expect(ctr).toEqual(1);
	});

	// ----------------- factories

	it('allows registering a factory', function() {
		var module = angular.module('mod1', []);
		module.factory('a', function() {return 2;});
		var injector = createInjector(['mod1']);
		expect(injector.get('a')).toEqual(2);
	});

	it('injects a factory functions with instances', function() {
		var module = angular.module('mod1', []);
		module.factory('a', function() {return 2;});
		module.factory('b', function(a) {return a + 1;});
		var injector = createInjector(['mod1']);
		expect(injector.get('b')).toEqual(3);
	});
	
	it('calls factory function only once', function() {
		var module = angular.module('mod1', []);
		module.factory('a', function() {return {};});
		var injector = createInjector(['mod1']);
		expect(injector.get('a')).toEqual(injector.get('a'));
	});

	it('enforces factory to return a value', function() {
		var module = angular.module('mod1', []);
		module.factory('a', function() {});
		module.factory('b', function() {return null;});
		var injector = createInjector(['mod1']);
		expect(function() {
			injector.get('a');
		}).toThrow();
		expect(injector.get('b')).toBeNull();
	});

	//---------- values

	it('allows registering a value', function() {
		var module = angular.module('mod1', []);
		module.value('a', 23);
		var injector = createInjector(['mod1']);
		expect(injector.get('a')).toEqual(23);
	});

	it('does not make values available to config blocks', function() {
		var module = angular.module('mod1', []);
		module.value('a', 24);
		module.config(function(a) {});
		expect(function() {
			createInjector(['mod1'])
		}).toThrow();
	});

	it('allows an undefined value', function() {
		var module = angular.module('mod1', []);
		module.value('a', undefined);
		var injector = createInjector(['mod1']);
		expect(injector.get('a')).toBeUndefined();
	});


	//---------- services

	it('allows registering a service', function() {
		var module = angular.module('mod1', []);
		module.service('aService', function(){
			this.getVal = function(){return 15;}
		});
		var injector = createInjector(['mod1']);
		expect(injector.get('aService').getVal()).toEqual(15);
	});

	it('injects service constructors with instances', function() {
		var module = angular.module('mod1', []);
		module.value('a', 5);
		module.service('aService', function(a){
			this.getVal = function(){return a;}
		});
		var injector = createInjector(['mod1']);
		expect(injector.get('aService').getVal()).toEqual(5);
	});

	it('calls service function only once', function() {
		var module = angular.module('mod1', []);
		module.service('a', function() {});
		var injector = createInjector(['mod1']);
		expect(injector.get('a')).toEqual(injector.get('a'));
	});

	//-------- decorators

	it('allows changing an instance using decorator', function() {
		var module = angular.module('mod1', []);
		module.factory('aValue', function() {
			return {aKey: 12};
		});
		module.decorator('aValue', function($delegate) {
			$delegate.bKey = 13;
		});
		var injector = createInjector(['mod1']);
		expect(injector.get('aValue').bKey).toEqual(13);
	});

	it('allows multiple decorators per service', function() {
		var module = angular.module('mod1', []);
		module.factory('aValue', function() {
			return {aKey: 12};
		});
		module.decorator('aValue', function($delegate) {
			$delegate.bKey = 13;
		});
		module.decorator('aValue', function($delegate) {
			$delegate.cKey = 14;
		});
		var injector = createInjector(['mod1']);
		expect(injector.get('aValue').bKey).toEqual(13);
		expect(injector.get('aValue').cKey).toEqual(14);
	});

	it('uses dependency injection with decorators', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 5);
		module.factory('aValue', function() {
			return {aKey: 12};
		});
		module.decorator('aValue', function($delegate, a) {
			$delegate.bKey = a;
		});
		var injector = createInjector(['mod1']);
		expect(injector.get('aValue').bKey).toEqual(5);
	});

});