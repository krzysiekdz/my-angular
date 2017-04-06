/* jshint globalstrict: true*/
/* global hashKey: false, HashMap:false*/
'use strict';

describe('apis', function() {

	describe('hashKey', function() {

		it('is undefined:undefined for undefined', function() {
			expect(hashKey(undefined)).toEqual('undefined:undefined');
		});

		it('is object:null for null', function() {
			expect(hashKey(null)).toEqual('object:null');
		});

		it('is boolean:true for true', function() {
			expect(hashKey(true)).toEqual('boolean:true');
		});

		it('is boolean:false for false', function() {
			expect(hashKey(false)).toEqual('boolean:false');
		});

		it('is number:13 for 13', function() {
			expect(hashKey(13)).toEqual('number:13');
		});

		it('is string:13 for "13"', function() {
			expect(hashKey("13")).toEqual('string:13');
		});

		it('is object:[unique id] for objects', function() {
			expect(hashKey({})).toMatch(/^object:\S+$/);
			// expect('object:23afd').toMatch(/^object:[0-9a-zA-Z]+$/);
			// expect('object:23#$%afd').toMatch(/^object:\S+$/);
		});

		it('is the same key for the same object', function() {
			var obj = {};
			expect(hashKey(obj)).toEqual(hashKey(obj));
		});

		it('is the same key for the same object', function() {
			var obj = {a:1};
			var hash1 = hashKey(obj);
			obj.a = 2;
			var hash2 = hashKey(obj);
			expect(hash1).toEqual(hash2);
		});

		it('is not the same key for diffrent objects', function() {
			var obj = {a:1};
			var obj2 = {a:1};
			var hash1 = hashKey(obj);
			var hash2 = hashKey(obj2);
			expect(hash1).not.toEqual(hash2);
		});

		it('is function:[unique id] for functions', function() {
			expect(hashKey(function() {})).toMatch(/^function:\S+$/);
		});

		it('is the same key for the same function', function() {
			var fn = function(){};
			expect(hashKey(fn)).toEqual(hashKey(fn));
		});

		it('is not the same key for diffrent functions', function() {
			var fn1 = function(){return 1;};
			var fn2 = function(){return 1;};
			var hash1 = hashKey(fn1);
			var hash2 = hashKey(fn2);
			expect(hash1).not.toEqual(hash2);
		});

		it('stores the hash key in the $$hashKey attribute', function() {
			var obj = {};
			var hash = hashKey(obj);
			expect(obj.$$hashKey).toEqual(hash.match(/^object:(\S+)$/)[1]);
			// console.log(hash.match(/^object:(\S+)$/)[1]);
		});

		it('uses preassigned $$hashKey', function() {
			expect(hashKey({$$hashKey: 23})).toEqual('object:23');
		});

		it('supports a function $$hashKey', function() {
			expect(hashKey({$$hashKey: function(){return 12;} })).toEqual('object:12');
		});

		it('supports this in a function $$hashKey', function() {
			expect(hashKey({
				key: 23,
				$$hashKey: function(){return this.key;} 
			})).toEqual('object:23');
		});

	});

	describe('HashMap', function() {

		var hashMap;

		beforeEach(function() {
			hashMap = new HashMap();
		});

		it('supports put ang get methods of primitives', function() {
			hashMap.put(11, 'eleven');
			expect(hashMap.get(11)).toEqual('eleven');
		});

		it('supports put ang get methods of objects', function() {
			var obj = {};
			hashMap.put(obj, 'obj');
			expect(hashMap.get(obj)).toEqual('obj');
			expect(hashMap.get({})).toBeUndefined();
		});

		it('supports remove', function() {
			var obj = {};
			hashMap.put(obj, 'obj');
			hashMap.remove(obj);
			expect(hashMap.get(obj)).toBeUndefined();
		});

		it('returns remove value', function() {
			var obj = {};
			hashMap.put(obj, 'obj');
			expect(hashMap.remove(obj)).toEqual('obj');
		});

	});

});

