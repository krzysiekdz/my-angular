
/* jshint globalstrict: true */
/* global Scope: false */
'use strict';

describe('Scope', function(){

	describe('$watchCollection', function() {
		var scope;
		beforeEach(function() {
			scope = new Scope();
			scope.ctr = 0;
		});

		it('works like normal watch for non collections', function() {
			scope.a = 1;
			scope.ctr = 0;
			var old;
			scope.$watchCollection(
				function(s){return s.a;},
				function(n,o,s){
					s.ctr++;
					old = o;
				}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);
			expect(old).toBe(1);

			scope.a = 2;
			scope.$digest();
			expect(scope.ctr).toBe(2);
			expect(old).toBe(1);

			scope.$digest();
			expect(scope.ctr).toBe(2);
			expect(old).toBe(1);
		});

		it('works like normal watch for NaNs', function() {
			scope.a = 0/0;
			scope.ctr = 0;
			scope.$watchCollection(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.$digest();
			expect(scope.ctr).toBe(1);
		});

		it('notices when value becomes an array', function() {
			scope.a = 1;
			scope.ctr = 0;
			scope.$watchCollection(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.a = [1,2,3];
			scope.$digest();
			expect(scope.ctr).toBe(2);

			scope.$digest();
			expect(scope.ctr).toBe(2);
		});

		it('notices item added to an array', function() {
			scope.a = [1,2,3];
			scope.ctr = 0;
			scope.$watchCollection(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.a.push(4);
			scope.$digest();
			expect(scope.ctr).toBe(2);

			scope.$digest();
			expect(scope.ctr).toBe(2);
		});

		it('notices item removed from an array', function() {
			scope.a = [1,2,3];
			scope.ctr = 0;
			scope.$watchCollection(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.a.shift();
			scope.$digest();
			expect(scope.ctr).toBe(2);

			scope.$digest();
			expect(scope.ctr).toBe(2);
		});

		it('notices an item replaced in an array', function() {
			scope.a = [1,2,3];
			scope.ctr = 0;
			scope.$watchCollection(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.a[1] = 20;
			scope.$digest();
			expect(scope.ctr).toBe(2);

			scope.$digest();
			expect(scope.ctr).toBe(2);
		});

		it('notices reordered items in array', function() {
			scope.a = [5,2,3,1,4];
			scope.ctr = 0;
			scope.$watchCollection(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.a.sort();
			scope.$digest();
			expect(scope.ctr).toBe(2);

			scope.$digest();
			expect(scope.ctr).toBe(2);
		});

		it('can operate on last value', function(done) {
			scope.a = [1,2,3];
			var ctr = 0;

			scope.$watchCollection(
				function(s){return s.a;},
				function(n,o,s){
					if(ctr == 0) {
						expect(o[0]).toBe(1);	
						expect(o[1]).toBe(2);	
						expect(o[2]).toBe(3);	
					}
					if(ctr == 1) {
						expect(o[0]).toBe(1);	
						expect(o[1]).toBe(2);	
						expect(o[2]).toBe(3);	
					}
					if(ctr == 2) {
						expect(o[0]).toBe(10);	
						expect(o[1]).toBe(20);	
						expect(o[2]).toBe(3);	
						done();
					}

					ctr++;
				}
			);

			scope.$digest();

			scope.a[0] = 10;
			scope.a[1] = 20;
			scope.$digest();

			scope.$digest();

			scope.a.push(4);
			scope.$digest();
			
		});

		it('does not fail on NaNs', function() {
			scope.a = [1, 0/0, 3];
			scope.ctr = 0;
			scope.$watchCollection(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.$digest();
			expect(scope.ctr).toBe(1);
		});

		it('notices an item replaced in an arguments object', function() {
			(function(){
				scope.arrayLike = arguments;
			})(1,2,3);
			scope.$watchCollection(
				function(s){return s.arrayLike;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.arrayLike[1] = 20;
			scope.$digest();
			expect(scope.ctr).toBe(2);

			scope.$digest();
			expect(scope.ctr).toBe(2);


		});

		it('notices an item replaced in a NodeList object', function() {
			document.body.appendChild(document.createElement('div'));
			scope.arrayLike = document.getElementsByTagName('div');
			
			scope.$watchCollection(
				function(s){return s.arrayLike;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			document.body.appendChild(document.createElement('div'));
			scope.$digest();
			expect(scope.ctr).toBe(2);

			scope.$digest();
			expect(scope.ctr).toBe(2);

		});

		it('notices when value becomes an object', function() {
			scope.a = 1;
			scope.ctr = 0;
			scope.$watchCollection(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.a = {a:1, b:2};
			scope.$digest();
			expect(scope.ctr).toBe(2);

			scope.$digest();
			expect(scope.ctr).toBe(2);
		});

		it('notices when an attribute is added to an object', function() {
			scope.obj = {a:1};
			scope.$watchCollection(
				function(s){return s.obj;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.obj.b = 2;
			scope.$digest();
			expect(scope.ctr).toBe(2);

			scope.$digest();
			expect(scope.ctr).toBe(2);
		});

		it('notices when an attribute is replaced in an object', function() {
			scope.obj = {a:1};
			scope.$watchCollection(
				function(s){return s.obj;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.obj.a = 2;
			scope.$digest();
			expect(scope.ctr).toBe(2);

			scope.$digest();
			expect(scope.ctr).toBe(2);
		});

		it('does not fail on NaNs in object', function() {
			scope.obj = {a: 1/0};
			scope.$watchCollection(
				function(s){return s.obj;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.$digest();
			expect(scope.ctr).toBe(1);
		});

		it('notices when an attribute is removed from an object', function() {
			scope.obj = {a:1, b:2};
			scope.$watchCollection(
				function(s){return s.obj;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			delete scope.obj.b;
			scope.$digest();
			expect(scope.ctr).toBe(2);
			console.log(scope.ctr)

			scope.$digest();
			expect(scope.ctr).toBe(2);
		});


	});

	
});