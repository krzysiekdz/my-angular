
/* jshint globalstrict: true */
/* global Scope: false */
'use strict';

describe('Scope', function(){

	describe('Events', function() {
		var parent, scope, child, isolatedChild;
		beforeEach(function() {
			parent = new Scope();
			scope = parent.$new();
			child = scope.$new();
			isolatedChild = scope.$new(true);
		});

		it('can register listeners', function() {
			var listener1 = function(){};
			var listener2 = function(){};
			var listener3 = function(){};

			scope.$on('evt1', listener1);
			scope.$on('evt1', listener2);
			scope.$on('evt2', listener3);

			expect(scope.$$listeners).toEqual({
				evt1: [listener1, listener2],
				evt2 : [listener3]
			});

		});

		it('register listeners for a proper scope', function() {
			var listener1 = function(){};
			var listener2 = function(){};
			var listener3 = function(){};

			scope.$on('evt1', listener1);
			child.$on('evt1', listener2);
			isolatedChild.$on('evt1', listener3);

			expect(scope.$$listeners).toEqual({evt1: [listener1]});
			expect(child.$$listeners).toEqual({evt1: [listener2]});
			expect(isolatedChild.$$listeners).toEqual({evt1: [listener3]});
		});

		_.forEach(['$emit', '$broadcast'], function(method) {
			it('calls the listeners of the matching event on ' + method, function() {
				var listener1 = jasmine.createSpy();
				var listener2 = jasmine.createSpy();

				scope.$on('evt1', listener1);
				scope.$on('evt2', listener2);

				scope[method]('evt1');

				expect(listener1).toHaveBeenCalled();
				expect(listener2).not.toHaveBeenCalled();
			});

			it('passes an Event object with a name to a listeners on ' + method, function() {
				var listener1 = jasmine.createSpy();

				scope.$on('evt1', listener1);

				scope[method]('evt1');

				expect(listener1).toHaveBeenCalled();
				expect(listener1.calls.mostRecent().args[0].name).toEqual('evt1');
			});

			it('passes the same Event object to a listeners on  ' + method, function() {
				var listener1 = jasmine.createSpy();
				var listener2 = jasmine.createSpy();

				scope.$on('evt1', listener1);
				scope.$on('evt1', listener2);

				scope[method]('evt1');

				var e1 = listener1.calls.mostRecent().args[0];
				var e2 = listener2.calls.mostRecent().args[0];

				expect(e1).toBe(e2);
			});

			it('passes additional arguments to a listeners on ' + method, function() {
				var listener1 = jasmine.createSpy();

				scope.$on('evt1', listener1);

				scope[method]('evt1', 1, 'two', [3,'four',5], '...');

				expect(listener1).toHaveBeenCalled();
				expect(listener1.calls.mostRecent().args[1]).toEqual(1);
				expect(listener1.calls.mostRecent().args[2]).toEqual('two');
				expect(listener1.calls.mostRecent().args[3]).toEqual([3, 'four', 5]);
				expect(listener1.calls.mostRecent().args[4]).toEqual('...');
			});

			it('returns an Event object on ' + method, function() {
				var listener1 = jasmine.createSpy();

				scope.$on('evt1', listener1);

				var evt = scope[method]('evt1');

				expect(evt).toBeDefined();
				expect(evt.name).toEqual('evt1');
			});

			it('can be deregistered on ' + method, function() {
				var listener1 = jasmine.createSpy();

				var deregister = scope.$on('evt1', listener1);

				deregister();
				scope[method]('evt1');

				expect(listener1).not.toHaveBeenCalled();
			});

			it('does not skip the next listener when removed on ' + method, function() {
				var listener1 = function() {
					deregister();
				};
				var listener2 = jasmine.createSpy();

				var deregister = scope.$on('evt1', listener1);
				scope.$on('evt1', listener2);

				scope[method]('evt1');

				expect(listener2).toHaveBeenCalled();
			});

		});

		it('propagates up the scope hierarchy on $emit', function() {
			var listener1 = jasmine.createSpy();
			var listener2 = jasmine.createSpy();
			var listener3 = jasmine.createSpy();

			scope.$on('evt1', listener1);
			parent.$on('evt1', listener2);
			child.$on('evt1', listener3);

			scope.$emit('evt1');

			expect(listener1).toHaveBeenCalled();
			expect(listener2).toHaveBeenCalled();
			expect(listener3).not.toHaveBeenCalled();

		});

		it('propagates up the scope hierarchy on $emit with arguments', function() {
			var listener1 = jasmine.createSpy();
			var listener2 = jasmine.createSpy();
			var listener3 = jasmine.createSpy();

			scope.$on('evt1', listener1);
			parent.$on('evt1', listener2);
			child.$on('evt1', listener3);

			scope.$emit('evt1', 10,11);

			expect(listener1.calls.mostRecent().args[1]).toEqual(10);
			expect(listener1.calls.mostRecent().args[2]).toEqual(11);
			
			expect(listener2.calls.mostRecent().args[1]).toEqual(10);
			expect(listener2.calls.mostRecent().args[2]).toEqual(11);

			expect(listener3).not.toHaveBeenCalled();

		});



	});

	
});