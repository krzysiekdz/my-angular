/* jshint globalstrict: true */
/* global filter: false, register: false , bootFilters:false*/
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

	describe("filter filter", function() {

		bootFilters();

		it('is available', function() {
			expect(filter('filter')).toBeDefined();
		});

		it('can filter an array with a predicate function', function() {
			var fn = parse('[1,2,3,4,5,6] | filter:isOdd');
			var scope = {
				isOdd: function(n) {
					return n % 2 !== 0;
				}
			};
			expect(fn(scope)).toEqual([1,3,5]);
		});

		it('can filter an array of string with a string', function() {
			var fn = parse('arr | filter:"a"');
			var scope = {arr: ["a", "b", "a" ]};
			expect(fn(scope)).toEqual(['a', 'a']);
		});

		it('can filter an array of string with a substring matching', function() {
			var fn = parse('arr | filter:"ala"');
			var scope = {arr: ["aga ala ma", "bala ma", "anna ma" ]};
			expect(fn(scope)).toEqual(['aga ala ma', 'bala ma']);
		});

		it('filters an array of string ignoring case', function() {
			var fn = parse('arr | filter:"O"');
			var scope = {arr: ["BOLO", "rollo", "anna" ]};
			expect(fn(scope)).toEqual(['BOLO', 'rollo']);
		});

		it('filters an array of object where any value matches', function() {
			var fn = parse('arr | filter:"O"');
			var scope = {arr: [
				{name: 'John', lname: 'Brown'},
				{name: 'Jahne', lname: 'Fox'},
				{name: 'Mary', lname: 'Black'},
				{name: {a: 'ala', b:'ola'}, lname: 'Black'},
				{name: ['a', 'b', 'c']},
				{name: ['a', 'b', 'o']},
			]};
			expect(fn(scope)).toEqual([
				{name: 'John', lname: 'Brown'},
				{name: 'Jahne', lname: 'Fox'},
				{name: {a: 'ala', b:'ola'}, lname: 'Black'},
				{name: ['a', 'b', 'o']},
			]);
		});

		it('filters with number', function() {
			var fn = parse('arr | filter:1');
			var scope = {arr: [
				{name: 'a', age: 1},
				{name: 'b', age: 2},
				{name: 'c', age: 1},
			]};
			expect(fn(scope)).toEqual([
				{name: 'a', age: 1},
				{name: 'c', age: 1},
			]);
		});

		it('filters with boolean', function() {
			var fn = parse('arr | filter:true');
			var scope = {arr: [
				{name: 'a', age: true},
				{name: 'b', age: true},
				{name: 'c', age: false},
			]};
			expect(fn(scope)).toEqual([
				{name: 'a', age: true},
				{name: 'b', age: true},
			]);
		});

		it('filters with a substring numeric value', function() {
			var fn = parse('arr | filter:12');
			var scope = {arr: [
				{name: 'a11', age: true},
				{name: 'b12', age: true},
				{name: 'c13', age: false},
			]};
			expect(fn(scope)).toEqual([
				{name: 'b12', age: true},
			]);
		});

		it('filters matching null', function() {
			var fn = parse('arr | filter:null');
			var scope = {arr: [
				null, 'not null'
			]};
			expect(fn(scope)).toEqual([
				null
			]);
		});

		it('does not match null value with the string null', function() {
			var fn = parse('arr | filter:"null"');
			var scope = {arr: [
				null, 'not null'
			]};
			expect(fn(scope)).toEqual([
				"not null"
			]);
		});

		it('does not match undefined value', function() {
			var fn = parse('arr | filter:"undefined"');
			var scope = {arr: [
				undefined, 'not undefined'
			]};
			expect(fn(scope)).toEqual([
				"not undefined"
			]);
		});

		it('allows negating string filter', function() {
			var fn = parse('arr | filter:"!o"');
			var scope = {arr: [
				'ala', 'ola', 'ela', 'bolo'
			]};
			expect(fn(scope)).toEqual([
				"ala", 'ela',
			]);
			// console.log(fn(scope));
			// console.log(new AST(new Lexer()).build('arr | filter:"!o"'));
		});

		it('negating string filter can filter objects', function() {
			var fn = parse('arr | filter:"!o"');
			var scope = {arr: [
				{a: 1, b:'ala'},
				{a: 2, b:'halo'},
				{a: 3, b:'ola'},
			]};
			expect(fn(scope)).toEqual([
				{a: 1, b:'ala'},
			]);
		});

		it('allows filter by criteria object', function() {
			var fn = parse('arr | filter:{salary:2000}');
			var scope = {arr: [
				{name:'John', salary:2000},
				{name:'Mike', salary:3000},
				{name:'Todd', salary:1000},
				{name:'Jerry', salary:2000},
			]};
			expect(fn(scope)).toEqual([
				{name:'John', salary:2000},
				{name:'Jerry', salary:2000},
			]);
		});

		it('filtering by criteria must match to all properties', function() {
			var fn = parse('arr | filter:{salary:2000, name:"Jer"}');
			var scope = {arr: [
				{name:'John', salary:2000},
				{name:'Mike', salary:3000},
				{name:'Todd', salary:1000},
				{name:'Jerry', salary:2000},
			]};
			expect(fn(scope)).toEqual([
				{name:'Jerry', salary:2000},
			]);
		});

		it('matches everythign when filtered an empty object', function() {
			var fn = parse('arr | filter:{}');
			var scope = {arr: [
				{name:'John', salary:2000},
				{name:'Mike', salary:3000},
				{name:'Todd', salary:1000},
				{name:'Jerry', salary:2000},
			]};
			expect(fn(scope)).toEqual([
				{name:'John', salary:2000},
				{name:'Mike', salary:3000},
				{name:'Todd', salary:1000},
				{name:'Jerry', salary:2000},
			]);
		});

		it('filtering by criteria must match to all properties', function() {
			var fn = parse('arr | filter:{name:{first:"o"}}');
			var scope = {arr: [
				{name:{first: 'John', last:'Rambo'}, salary:2000},
				{name:{first: 'Mike', last:'Tyson'}, salary:3000},
				{name:{first: 'Nick', last:'Jagger'}, salary:4000},
			]};
			expect(fn(scope)).toEqual([
				{name:{first: 'John', last:'Rambo'}, salary:2000},
			]);
		});

		it('allows negation when filtering with an object', function() {
			var fn = parse('arr | filter:{name:{first:"!o"}}');
			var scope = {arr: [
				{name:{first: 'John', last:'Rambo'}, salary:2000},
				{name:{first: 'Mike', last:'Tyson'}, salary:3000},
				{name:{first: 'Nick', last:'Jagger'}, salary:4000},
			]};
			expect(fn(scope)).toEqual([
				{name:{first: 'Mike', last:'Tyson'}, salary:3000},
				{name:{first: 'Nick', last:'Jagger'}, salary:4000},
			]);
		});

		it('can use a scope prop for filtering with object', function() {
			var fn = parse('arr | filter:{name:a}');
			var scope = {arr: [
				{name: 'ala'},
				{name: 'ola'},
			], 
				a: 'o'};
			expect(fn(scope)).toEqual([
				{name: 'ola'},
			]);
			
		});

		it('ignores undefined values in expectation object', function() {
			var fn = parse('arr | filter:{name:a}');
			var scope = {arr: [
				{name: 'ala'},
				{name: 'ola'},
			], 
				// a: 'o'
			};
			expect(fn(scope)).toEqual([
				{name: 'ala'},
				{name: 'ola'},
			]);
			
		});

		it('filters with a nested object in array', function() {
			var fn = parse('arr | filter:{users: {name: {first: "o"}}}');
			var scope = {arr: [
				{users: [{name:{first:"a"}},{name:{first:"o"}}]},
				{users: [{name:{first:"a"}},{name:{first:"e"}}]},
			]};
			expect(fn(scope)).toEqual([
				{users: [{name:{first:"a"}},{name:{first:"o"}}]},
			]);
		});

		it('filters with a nested object on the same level only', function() {
			var fn = parse('arr | filter:{user: {name: "Bob"}}');
			var scope = {arr: [
				{user: "Bob"},
				{user: {name: "Bob"}},
				{user: {name: {first: "Bob", last:"Fox"}}},
			]};
			expect(fn(scope)).toEqual([
				{user: {name: "Bob"}},
			]);
		});

		it('filters with a wildcard property', function() {
			var fn = parse('arr | filter:{$:"o"}');
			var scope = {arr: [
				{name: 'Hoe', role:"admin"},
				{name: 'Jane', role:"mod"},
				{name: 'Mary', role:"admin"},
			]};
			expect(fn(scope)).toEqual([
				{name: 'Hoe', role:"admin"},
				{name: 'Jane', role:"mod"},
			]);
		});

		it('filters with a wildcard property in nested object', function() {
			var fn = parse('arr | filter:{$:"o"}');
			var scope = {arr: [
				{name: {first: 'Hoe'}, role:"admin"},
				{name: {first: 'Mary'}, role:"admin"},
				{name: {first: 'Jane'}, role:"mod"},
			]};
			expect(fn(scope)).toEqual([
				{name: {first: 'Hoe'}, role:"admin"},
				{name: {first: 'Jane'}, role:"mod"},
			]);
		});

		it('filters with a wildcard property scoped to a parent', function() {
			var fn = parse('arr | filter:{name: {$:"o"}}');
			var scope = {arr: [
				{name: {first: 'Hoe', last: 'Jonse'}, role:"admin"},
				{name: {first: 'Mary', last: 'Jane'}, role:"mod"},
				{name: {first: 'Jane', last: 'Olk'}, role:"admin"},
			]};
			expect(fn(scope)).toEqual([
				{name: {first: 'Hoe', last: 'Jonse'}, role:"admin"},
				{name: {first: 'Jane', last: 'Olk'}, role:"admin"},
			]);
		});

		it('filters primitives with a wildcard property', function() {
			var fn = parse('arr | filter:{$:"o"}');
			var scope = {arr: [
				"Joe", "Mac", "Sue", "Ron"
			]};
			expect(fn(scope)).toEqual([
				"Joe", "Ron"
			]);
		});

		// it('filters with a nested wildcard property', function() {
		// 	var fn = parse('arr | filter:{$:{$:"o"}}');
		// 	var scope = {arr: [
		// 		{name: {first:"Joe"}, role:'admin'},
		// 		{name: {first:"Jane"}, role:'moderator'},
		// 		{name: {first:"Mary"}, role:'admin'},
		// 	]};
		// 	expect(fn(scope)).toEqual([
		// 		{name: {first:"Joe"}, role:'admin'},
		// 	]);
		// });

		it('allows using a custom comparator', function() {
			var fn = parse('arr | filter:{$:"o"}:myComparator');
			var scope = {
				arr: [
				"oo", "oa", "a", "o"
				], 
				myComparator: function(a,b) {
					return a === b;
				}, 
			};
			expect(fn(scope)).toEqual([
				"o"
			]);
		});

		it('allows using a custom comparator', function() {
			var fn = parse('arr | filter:{$:"o"}:true');
			var scope = {
				arr: [
				"oo", "oa", "a", "o"
				], 
			};
			expect(fn(scope)).toEqual([
				"o"
			]);
		});

	});

});
