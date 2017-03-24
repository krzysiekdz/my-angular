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

});

