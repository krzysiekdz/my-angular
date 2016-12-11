/* jshint globalstrict: true */
/* global filter: false, register: false */
'use strict';

describe("filter", function() {

	it('can be registered and obtained', function() {
		var myFilter = function(){};
		var factory = function() {
			return myFilter;
		};
		register('my', factory);
		expect(filter('my')).toBe(myFilter);
	});

	it('allows registering multiple filters with an object', function() {
		var myFilter = function(){};
		var myFilter2 = function(){};
		register({
			'my': function() {
				return myFilter;
			},
			'my2': function() {
				return myFilter2;
			},
		});
		expect(filter('my')).toBe(myFilter);
		expect(filter('my2')).toBe(myFilter2);
	});

	it('can parse filter expressions', function() {
		register('upcase', function() {
			return String.toUpperCase;
		});
		expect(parse('a | upcase')({a: 'ala ma kota'})).toEqual('ALA MA KOTA');
		// try {
		// 	console.log(parse('a | upcase')({a: 'ala ma kota'}));
		// } catch(e) {
		// 	console.log(e);
		// }
	});

	it('can parse multiple filter expressions', function() {
		register('upcase', function() {
			return String.toUpperCase;
		});
		register('lowcase', function() {
			return String.toLowerCase;
		});
		expect(parse('a | upcase | lowcase | upcase | lowcase')({a: 'Ala Ma Kota'})).toEqual('ala ma kota');
	});

	it('can pass additional arguments to filter', function() {
		register('repeat', function() {
			return function(s, n) {
				return _.repeat(s, n);
			}
		});
		
		expect(parse('a | repeat:3')({a: 'abc'})).toEqual('abcabcabc');
	});

	it('can pass several additional arguments to filter', function() {
		register('add', function() {
			return function(s, n1,n2,n3) {
				return s+n1+n2+n3;
			}
		});
		
		expect(parse('a | add:1:b:3')({a: 10, b:5})).toEqual(19);
	});

});
