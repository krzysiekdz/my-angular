
/* jshint globalstrict: true */
/* global Scope: false */
'use strict';

describe('Scope', function(){

	//Scope to zwykly obiekt js; do scope mozna przpisywac wlasciwosci - tak sie robi w kontrolerach;
	//nie potrzeba do tego setterow
	it('can be constructed and used as an object', function() {
		var scope = new Scope();
		scope.a = 1;
		expect(scope.a).toBe(1);
	});

	//$watch i $digest sa do reagowania na zmiany w danych
	//$watch - funkcja ktora jest przypisana do scope i odpala sie gdy zaszly zmiany
	//$digest odpala kolejno wszystkie $watche
	describe('digest', function() {
		var scope;

		beforeEach(function() {
			scope = new Scope();
		});

		it('calls the listner function of a watch on first $digest', function() {
			var watchFn = function() {return 'wat';};
			var listenerFn = jasmine.createSpy();
			scope.$watch(watchFn, listenerFn);
			scope.$digest();
			expect(listenerFn).toHaveBeenCalled();
		});

		it('calls the watch function with the scope as the argument', function() {
			var watchFn = jasmine.createSpy();
			var listenerFn = function(){};
			scope.$watch(watchFn, listenerFn);
			scope.$digest();
			expect(watchFn).toHaveBeenCalledWith(scope);
		});

		it('calls the listener function when the watched value changes', function() {
			scope.someVal = 'a';
			scope.counter = 0;
			scope.$watch(
				function(scope) {return scope.someVal;},
				function(newVal, oldVal, scope) {scope.counter++;}
			);
			
			expect(scope.counter).toBe(0);

			scope.$digest();
			expect(scope.counter).toBe(1);

			scope.$digest();
			expect(scope.counter).toBe(1);

			scope.someVal = 'b';
			expect(scope.counter).toBe(1);

			scope.$digest();
			expect(scope.counter).toBe(2);
		});

		it('calls the listener when watch value is first undefined ', function() {
			scope.counter = 0;
			scope.$watch(
				function(scope) {return scope.someVal;},
				function(newVal, oldVal, scope) {scope.counter++;}
			);
			
			expect(scope.counter).toBe(0);

			//za pierwszym razem musi byc 1
			scope.$digest();
			expect(scope.counter).toBe(1);

			//za drugim razem tez musi byc 1, wiec zwykle porownanie ze zmienna i last sa undefined to za malo
			scope.$digest();
			expect(scope.counter).toBe(1);

			scope.someVal = 'b';
			expect(scope.counter).toBe(1);

			scope.$digest();
			expect(scope.counter).toBe(2);
		});

		//pierwsze wywolanie powinno przekzac jako oldValue, to co bylo w newValue
		it('calls the listener with new value as old value the first time', function() {
			scope.someVal = 123;
			var old;
			scope.$watch(
				function(scope) {return scope.someVal;},
				function(newVal, oldVal, scope) { old=oldVal;}
			);
			scope.$digest();
			expect(old).toBe(123);
		});

		it('may have watchers that omit the listener function', function() {
			var watchFn = jasmine.createSpy().and.returnValue('something');
			scope.$watch(watchFn);
			scope.$digest();
			expect(watchFn).toHaveBeenCalled();
		});

		it('triggers chained watchers in the same digest', function() {
			scope.name1 = 'krzys';
			scope.$watch(
				function(scope){return scope.name1},
				function(nv, ov, scope){
					if(nv)
						scope.name = nv.substring(0,1);
				}
			);
			scope.$watch(
				function(scope){return scope.name2},
				function(nv, ov, scope){
					if(nv)
						scope.name1 = nv.toUpperCase();
				}
			);
			scope.$watch(
				function(scope){return scope.name3},
				function(nv, ov, scope){
					if(nv)
						scope.name2 = nv + ' ma jaja';
				}
			);

			scope.$digest();
			expect(scope.name).toBe('k');
			scope.name3 = 'ania';
			scope.$digest();
			expect(scope.name).toBe('A');
		});

		it('gives up on the watches after 10 iterations', function() {
			scope.ctr = 0;
			scope.$watch(
				function(scope){return scope.ctr},
				function(n, o, s) {s.ctr++;}
			);
			expect(function(){scope.$digest()}).toThrow();
			//console.log(scope.ctr);//10
			//expect(scope.ctr).toBe(10);
		});

		//usprawnienie polega na tym, ze zapaietujemy ostatni watcher, ktory był dirty
		//np przy 100 watcherach, jesli ostatni dirty byl watcher pierwszy, to wykonany 101 iteracji
		//ale jesli ostatni dirty był watcher 100, to wykonany i tak 200 operacji
		//przyklad: watcher[0] zmienia w listener watcher[40] - wiec pierwsza iteracja sprawdzi
		//ze dirty jest watcher[0], wykona jego listener, potem przejdzie do watcher[40] i tez wykona jego listener
		//jesli listener watcher[40] zrobi na dirty watcher dalszy, to zapamietamy ten dalszy watcher
		//jesli zrobi na dirty watcher wczesniejszy np 20 to i tak wykonanmy jego listener dochdzadzc do 40
		//w sumie wykonamy 140 sprawdzen zamiast 200 - zawsze to jakas optymalizacja, niewielkim kosztem

		//podsumowujac: zapamietujemy ostatni watcher, ktory cos nabroil - jesli zrobimy cały cykl
		//i dojdziemy do tego watchera ponownie, to znaczy ze nic nie uległo zmianie, bo jesli ten
		//watcher zmienilby inny, to wtedy ten inny byłby pamietany jako ostatni

		//'ostatni watcher, ktory cos nabroil'
		it('ends the digest when the last watch is clean', function() {
			scope.array = _.range(100);
			var ctr = 0;
			_.times(100, function(i) {
				scope.$watch(
					function(scope){ctr++; return scope.array[i];},
					function(n,o,s){}
				)
			});
			scope.$digest();
			expect(ctr).toBe(200);
			
			scope.array[3] = 30;
			scope.$digest();
			// console.log(ctr);//304
			expect(ctr).toBe(304);

			//jesli nie bedziemy zerowac $$lastDirtyWatch, to teraz zamiast 410 pokazaloby 308, co bedzie bledem, bo zatrzyma sie na ostatnim watchu, ktory byl wczesniej zapamietany
			scope.array[5] = 50;
			scope.$digest();
			//console.log(ctr);//410
			expect(ctr).toBe(304 + 106);
		});

		//wywolanie watch w funkcji listener normlanie nie bedzie dzialac - trzeba dodac zerowania lastDirtyWatch w wywlolaniu $watch
		it('does not end digest so the new watches may run', function(){
			scope.a = 'a';
			scope.ctr = 0;
			var ctr = 1;
			scope.$watch(
				function(scope){return scope.a;},
				function(n,o,s){
					// console.log('watch');
					var i = ctr++;
					s.$watch(
						function(scope){return scope.a;},
						function(n,o,s){
							s.ctr++; 
							// console.log('watch number ', i);
						}
					);
				}
			);

			scope.$digest();
			// /console.log(scope.ctr);//1
			expect(scope.ctr).toBe(1);

			scope.$digest();
			// console.log(scope.ctr);//1
			expect(scope.ctr).toBe(1);

			scope.a = 'b';
			scope.$digest();
			expect(scope.ctr).toBe(3);
			//console.log(scope.ctr);//3

			scope.a = 'c';
			scope.$digest();
			expect(scope.ctr).toBe(6);
			// console.log(scope.ctr);//6

			scope.a = 'd';
			scope.$digest();
			expect(scope.ctr).toBe(10);
			// console.log(scope.ctr);//10
		});

		//do tej pory porownywalismy wartosci, typy proste, a co z obiektami i tablicami?
		it('compares based on value if enabled', function() {
			scope.a = [1,2,3];
			scope.ctr = 0;
			scope.$watch(
				function(scope){return scope.a;},
				function(n,o,s){s.ctr++;},
				true
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.a.push(4);
			scope.$digest();
			expect(scope.ctr).toBe(2);
		});

		it('correctly handles NaNs', function() {
			scope.a = 2/'a';
			scope.ctr = 0;
			scope.$watch(
				function(scope){return scope.a;},
				function(n,o,s){s.ctr++;},
				false
			);

			//try {scope.$digest();} catch(e){console.log(e);}//wyjatek: osiagnieto 10 iteracji digest
			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.a = 0/0;
			scope.$digest();
			expect(scope.ctr).toBe(1);
			
		});
	});

	describe('eval and apply', function() {
		var scope;

		beforeEach(function() {
			scope = new Scope();
		});

		it('executes $eval function', function() {
			scope.a = 13;
			var res = scope.$eval(function(scope) {
				return scope.a;
			});

			expect(res).toBe(13);
		});

		it('passes the second $eval argument straight through', function() {
			scope.a = 13;
			var res = scope.$eval(function(scope, a) {
				return scope.a + a;
			}, 5);

			expect(res).toBe(13 + 5);
		});

		//apply sluzy do implementacji mecchanizmu samoczynnego odswiezania Scope
		it('$apply function must call the digest cycle', function() {
			scope.a = 13;
			scope.ctr = 0;
			scope.$watch(
				function(scope){return scope.a;},
				function(n,o,s){s.ctr++;},
				false
			);
			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.$apply(function(scope, a) {
				scope.a = a;
			}, 5);

			expect(scope.a).toBe(5);//wartosc zmodyfikowana
			expect(scope.ctr).toBe(2);//scope odswiezony
		});

		//w digest najpierw wykona sie listener, a dpiero w kolejnym cyklu 
		//digest wykona sie kolejka async, bo dopiero po pierwszym cyklu digest
		//ta kolejka powstanie
		//$eval wykonuje sie odrazu w kodzie tam gdzie jest wywolany, $evalAsync wykonuje
		//sie dopiero przy pierwszym cyklu digest
		it('calls $evalAsync later in the same cycle', function() {
			scope.a = 1;
			scope.b = 0;
			scope.evalAsync = false;
			scope.evalImmediately = false;

			scope.$watch(
				function(scope){return scope.a;},
				function(n,o,s){
					s.$evalAsync(function(a, b) {
						a.evalAsync = true;
						a.b = b;
					}, 101);
					s.evalImmediately = s.evalAsync;
					s.b = 10;
				}
			);

			expect(scope.b).toBe(0);
			scope.$digest();
			expect(scope.evalAsync).toBe(true);
			expect(scope.evalImmediately).toBe(false);
			expect(scope.b).toBe(101);
		});
		
		//digest powinien wywolac evalAsync nawet jesli nie jest ustawione dirty
		//czyli wykonac dodatkowy cykl, bo wtedy evalAsync moze znowu zmienic scope
		it('calls $evalAsync function even if not dirty', function() {
			scope.a = 0;
			scope.ctr = 0;
			scope.$watch(
				function(scope){
					if(scope.ctr < 2) {
						scope.$evalAsync(function(s){
							s.ctr++;
						});
					}
					return scope.a;
				},
				function(n,o,s){}
			);

			scope.$digest();
			expect(scope.ctr).toBe(2);
		});

		it('eventually stops $evalAsync added by watches', function() {
			scope.a = 0;
			scope.ctr = 0;
			scope.$watch(
				function(scope){
					scope.$evalAsync(function(s){s.ctr++;});
					return scope.a;
				},
				function(n,o,s){}
			);

			expect(function(){scope.$digest();}).toThrow();
			expect(scope.ctr).toBe(9);
		});

		//wykonanie evalAsync powinno spowodowac ponowne przejscie po wszytkich watcherach
		//bo przeicez ktora wasrtosc Scope mogla zostac zmodyfikowana 
		it('it react when $evalAsync in watcher changes the scope', function() {
			scope.a = 0;
			scope.b = 0;
			scope.bb = 0;
			var ctr = 0;
			scope.$watch(
				function(scope){
					if(ctr < 3) {
						scope.$evalAsync(function(s){s.b++; ctr++;});
					}
					return scope.a;
				},
				function(n,o,s){}
			);
			scope.$watch(
				function(scope){
					return scope.b;
				},
				function(n,o,s){s.bb = s.b;}
			);

			scope.$digest();
			expect(scope.b === scope.bb).toBe(true);
			scope.$digest();
			expect(scope.b === scope.bb).toBe(true);
			ctr = 0;//od nowa mozna 3 razy zmodyfikowac scope.b
			scope.a = 1;//dirty bedzie scope.a, wiec normlanie digest zatrzyma sie na ponowym sprawdzaniu pola 'a', ale przeciez wlasnie pole b uleglo zmianie
			scope.$digest();
			expect(scope.b === scope.bb).toBe(true);
		});

		it('has a $$phase field', function() {
			scope.a = 1;
			scope.$watch(
				function(s){
					s.phase1 = s.$$phase;
					return s.a;
				},
				function(n,o,s){
					s.phase2 = s.$$phase;
				}
			);

			scope.$apply(function(s) {
				s.phase3 = s.$$phase;
			});

			expect(scope.phase1).toBe('digest');
			expect(scope.phase2).toBe('digest');
			expect(scope.phase3).toBe('apply');
			expect(scope.$$phase).toBe(null);
		});

		//funkcja done działa w ten sposob, ze jesli trzeba, jest wstrzykiwana
		//wtedy srodowisko spodziewa sie, ze bedzie wywolała i czeka na jej wywolanie
		//jesli sie jej nie wywola a przekaze w parametrze, to bedzie blad
		it('schedules a digest in $evalAsync', function(done) {
			scope.a = 'value';
			scope.c = 0;
			scope.$watch(
				function(s){return s.a;},
				function(n,o,s){s.c++;}
			);
			scope.$evalAsync(function(s) {});
			expect(scope.c).toBe(0);
			setTimeout(function() {
				expect(scope.c).toBe(1);
				done();
			}, 50);
		});

		it('test what happens with undefined props', function() {
			scope.ctr = 0;
			scope.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			scope.$digest();
			scope.$digest();
			expect(scope.ctr).toBe(1);
		});

		it('calls apply async in applyAsync', function(done) {
			scope.ctr = 0;
			scope.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);
			scope.$digest();
			expect(scope.ctr).toBe(1);
			scope.$applyAsync(function(s) {
				s.a = 1;
			});
			expect(scope.ctr).toBe(1);
			setTimeout(function() {
				expect(scope.ctr).toBe(2);
				done();
			}, 50);
		});

		it('never calls $applyAsync in the same digest cycle', function(done) {
			scope.ctr = 0;
			scope.$watch(
				function(s){return s.a;},
				function(n,o,s){
					s.$applyAsync(function() {
						s.ctr++;	
					})
				}
			);
			scope.$digest();
			expect(scope.ctr).toBe(0);
			setTimeout(function() {
				expect(scope.ctr).toBe(1);
				done();
			}, 50);
		});

		//wszystkie funkcje wewnatrz applyAysc poiwinny sie wywolac w ramach jednego apply
		//tak wiec powinino byc tylko 1 wywolanie digest
		it('coalesces $applyAsync calls into one $apply', function(done) {
			scope.ctr = 0;
			scope.$watch(
				function(s){s.ctr++; return s.a;},
				function(n,o,s){}
			);
			scope.$applyAsync(function(s) {
				s.a = 1;
			});
			scope.$applyAsync(function(s) {
				s.a = 2;
			});
			scope.$applyAsync(function(s) {
				s.a = 3;
			});
			scope.$applyAsync(function(s) {
				s.a = 4;
			});
			expect(scope.ctr).toBe(0);
			setTimeout(function() {
				expect(scope.ctr).toBe(2);//wartosc ktora sie zmienia, powinna podibjac licznik dwurkotnie 
				//- watchFn zawsze sie wykona aby pobrac wartsc, wiec wartosc trzeba pobrac 2 razy 
				//- raz gdy sie zmienia, a potem zeby sprawdzic ze juz sie nie zmienila
				done();
			}, 50);
		});

		it('cancels and flushes apply async tasks if digested first', function(done) {
			scope.ctr = 0;
			scope.$watch(
				function(s){s.ctr++; return s.a;},
				function(n,o,s){}
			);
			scope.$applyAsync(function(s) {
				s.a = 1;
			});
			scope.$applyAsync(function(s) {
				s.a = 2;
			});
			scope.$applyAsync(function(s) {
				s.a = 3;
			});
			scope.$applyAsync(function(s) {
				s.a = 4;
			});
			scope.$digest();
			expect(scope.ctr).toBe(2);
			expect(scope.a).toBe(4);
			setTimeout(function() {
				expect(scope.ctr).toBe(2);
				done();
			}, 50);
		});

	});

	describe('other functions', function() {
		var scope;
		beforeEach(function() {
			scope = new Scope();
		});

		it('calls functions once after digest in $postDigest', function() {
			var ctr = 0;
			scope.$$postDigest(function() {
				ctr++;
			});
			expect(ctr).toBe(0);

			scope.$digest();
			expect(ctr).toBe(1);

			scope.$digest();
			expect(ctr).toBe(1);
		});

		it('$postDigest changes on scope influences from next digest', function() {
			scope.a = 1;
			scope.$$postDigest(function() {
				scope.a = 2;
			});
			scope.$watch(function(s){return s.a;}, function(n,o,s){s.b = s.a;})
			scope.$digest();
			expect(scope.b).toBe(1);
			scope.$digest();
			expect(scope.b).toBe(2);

		});

		it('catches exceptions in watch functions and continues', function() {
			scope.a = 1;
			scope.ctr = 0;
			scope.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);
			scope.$watch(
				function(s){throw 'error watch fn';},
				function(n,o,s){}
			);
			scope.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(2);
		});

		it('catches exceptions in listener functions and continues', function() {
			scope.a = 1;
			scope.ctr = 0;
			scope.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);
			scope.$watch(
				function(s){return s.a;},
				function(n,o,s){throw 'error listener fn';}
			);
			scope.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(2);
		});

		it('catches exceptions in $evalAsync', function() {
			scope.a = 1;
			scope.ctr = 0;
			scope.$evalAsync(function(s) {
				s.ctr++;
			});
			scope.$evalAsync(function() {
				throw 'exception';
			});
			scope.$evalAsync(function() {
				scope.ctr++;
			});
			scope.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(3);
		});

		it('catches exceptions in $applyAsync', function(done) {
			scope.a = 1;
			scope.ctr = 0;
			scope.$applyAsync(function(s) {
				s.ctr++;
			});
			scope.$applyAsync(function(s) {
				throw 'error applyAsync';
			});
			scope.$applyAsync(function(s) {
				throw 'error applyAsync';
			});//2 wyrzucenia wyjatku, bo jedno co prawda przerwie zwykly flush, ale
			//apply złapie go w swoj try i wywola wtedy digest, a w digest pozostałe taski z kolejki applyAsync sie wykonaja, 
			//wiec musi byc conajmniej jeszce 1 wyjatek
			scope.$applyAsync(function(s) {
				s.ctr++;
			});
			scope.$applyAsync(function(s) {
				s.ctr++;
			});
			
			setTimeout(function() {
				expect(scope.ctr).toBe(3);	
				done();
			}, 50);
		});

		it('catches exceptions in $postDigest', function() {
			scope.ctr = 0;
			scope.$$postDigest(function() {
				scope.ctr++;
			});
			scope.$$postDigest(function() {
				throw 'error postDigest';
			});
			scope.$$postDigest(function() {
				scope.ctr++;
			});
			
			scope.$digest();
			expect(scope.ctr).toBe(2);	
		});

		it('can remove watchers', function() {
			scope.a = 1;
			var ctr = 0;

			var destroy = scope.$watch(
				function(s){return s.a;},
				function(n,o,s){ctr++;}
			);

			scope.$digest();
			expect(ctr).toBe(1);

			scope.a = 0;
			scope.$digest();
			expect(ctr).toBe(2);

			scope.a = 1;
			destroy();
			scope.$digest();
			expect(ctr).toBe(2);
		});

		//usuwanie w digest - samego siebie
		it('can remove watcher during digest', function() {
			scope.a = [];
			
			//w watch trzeci parametr to false, wiec zawartosc talbicy sie tak naprawde nie liczy, bo sprawdzana jest rownosc refenrecji
			scope.$watch(
				function(s){
					s.a.push(1);
					return s.a;
				},
				function(n,o,s){}
			);

			var destroy = scope.$watch(
				function(s){
					s.a.push(2);
					destroy();
				},
				function(n,o,s){}
			);

			scope.$watch(
				function(s){
					s.a.push(3)
					return s.a;
				},
				function(n,o,s){}
			);

			scope.$digest();
			expect(scope.a).toEqual([1,2,3,1,3]);
		});

		//np watcher: w3, w2, w1 - wykonywane od prawej - w1 usuwa w2 -> wejdzie wiec na miejsce w2 i wykona sie raz jeszcze
		it('can remove another watcher during digest', function() {
			scope.a = 1;
			scope.ctr = 0;

			scope.$watch(
				function(s){
					s.ctr += 100;
					destroy();
					return s.a;
				},
				function(n,o,s){}
			);

			var destroy = scope.$watch(
				function(s){
					s.ctr += 1;
					return s.a;
				},
				function(n,o,s){}
			);

			scope.$watch(
				function(s){
					s.ctr += 10;
					return s.a;
				},
				function(n,o,s){}
			);

			scope.$digest();
			// console.log(scope.ctr);
			expect(scope.ctr).toBe(320);
		});

		it('can remove several watches', function() {
			scope.a = 1;
			scope.ctr = 0;

			var destroy1 = scope.$watch(
				function(s){
					destroy1();
					destroy2();
					return s.a;
				},
				function(n,o,s){s.ctr++;}
			);

			var destroy2 = scope.$watch(
				function(s){
					return s.a;
				},
				function(n,o,s){s.ctr++;}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);
		});
	});

	
	//na razie robic tak, ze implmenetuje tylko podstaowe testy z akzdej
	//funkcjonalnisci, bo duzo przypadkow jest bardzo szczegolowych, ze rzadko
	//je napotkam a trace na nie duzo czasu - potem do nich wrocic, jak
	//zaimpelenetuje calosc ogolnie

	describe('watchgroup', function() {
		var scope;
		beforeEach(function() {
			scope = new Scope();
		});

		it('init correctly watchGroup function', function() {
			scope.a = 1;
			scope.b = 2;
			scope.c = 3;
			var oldv, newv;
			scope.$watchGroup(
				[
					function(s){return s.a;},
					function(s){return s.b;},
					function(s){return s.c;},
				],
				function(newValues, oldValues, scope) {
					oldv = oldValues;
					newv = newValues;
				}
			);

			scope.$digest();
			expect(oldv).toEqual([1,2,3]);
			expect(newv).toEqual([1,2,3]);
		});

		it('only calls listener once per digest', function() {
			scope.a = 1;
			scope.b = 2;
			scope.c = 3;
			scope.ctr = 0;

			scope.$watchGroup(
				[
					function(s){return s.a;},
					function(s){return s.b;},
					function(s){return s.c;},
				],
				function(newValues, oldValues, scope) {
					scope.ctr++;
				}
			);

			scope.$digest();
			expect(scope.ctr).toBe(1);
		});

		//chce sprawdzic czy listnerFn jest wywolywany dopiero na koncu, po przejrzeniu wszystkich zmian
		it('calls listenerFn after viewing all changes', function() {
			scope.a = 1;
			scope.b = 2;
			scope.c = 3;
			scope.ctr = 0;

			scope.$watchGroup(
				[
					function(s){return s.a;},
					function(s){return s.b;},
					function(s){return s.c;},
				],
				function(newValues, oldValues, scope) {
					expect(newValues).toEqual([1,2,3]);
				}
			);
			scope.$digest();
		});



		//opuszczam tutaj jedna sytuacje, gdy na poczatku oldv i newv powinny byc tymi samymi
		//tablicami - nie wiele to wnosi, poza drobnym dodatkiem elegancji

		it('uses diffrent arrays for old and new values', function() {
			scope.a = 1;
			scope.b = 2;
			scope.c = 3;
			var oldv, newv;

			scope.$watchGroup(
				[
					function(s){return s.a;},
					function(s){return s.b;},
					function(s){return s.c;},
				],
				function(newValues, oldValues, scope) {
					oldv = oldValues;
					newv = newValues;
				}
			);
			scope.$digest();

			scope.c = 30;
			scope.$digest();			

			expect(oldv).toEqual([1,2,3]);
			expect(newv).toEqual([1,2,30]);
		});

		//zachowanie angulara dla pustej tablicy watchow - wywlac raz listener
		it('calls the listener once when the watch array is empty', function() {
			var oldv, newv;

			scope.$watchGroup(
				[],
				function(newValues, oldValues, scope) {
					oldv = oldValues;
					newv = newValues;
				}
			);
			scope.$digest();		

			expect(oldv).toEqual([]);
			expect(newv).toEqual([]);
		});

		it('initialy uses references to compare', function() {
			scope.a = [10,20,30];
			scope.b = 2;
			scope.c = 3;
			scope.ctr = 0;

			scope.$watchGroup(
				[
					function(s){return s.a;},
					function(s){return s.b;},
					function(s){return s.c;},
				],
				function(newValues, oldValues, s) {
					s.ctr++;
				}
			);
			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.a.push(40);
			scope.$digest();			

			expect(scope.ctr).toBe(1);
		});

		it('can use value equality', function() {
			scope.a = [10,20,30];
			scope.b = 2;
			scope.c = 3;
			scope.ctr = 0;

			scope.$watchGroup(
				[
					function(s){return s.a;},
					function(s){return s.b;},
					function(s){return s.c;},
				],
				function(newValues, oldValues, s) {
					s.ctr++;
				},
				true
			);
			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.a.push(40);
			scope.$digest();			

			expect(scope.ctr).toBe(2);
		});

		it('calls the listener once', function() {
			scope.a = [10,20,30];
			scope.b = 2;
			scope.c = 3;
			scope.ctr = 0;

			scope.$watchGroup(
				[
					function(s){return s.a;},
					function(s){return s.b;},
					function(s){return s.c;},
				],
				function(newValues, oldValues, s) {
					s.ctr++;
				},
				true
			);
			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.a.push(40);
			scope.b = 20;
			scope.$digest();			
			expect(scope.ctr).toBe(2);

			scope.c = 30;
			scope.b = 200;
			scope.$digest();	
			expect(scope.ctr).toBe(3);		
		});

		it('can be deregistered', function() {
			scope.a = [10,20,30];
			scope.b = 2;
			scope.c = 3;
			scope.ctr = 0;

			var destroy = scope.$watchGroup(
				[
					function(s){return s.a;},
					function(s){return s.b;},
					function(s){return s.c;},
				],
				function(newValues, oldValues, s) {
					s.ctr++;
				},
				true
			);
			scope.$digest();
			expect(scope.ctr).toBe(1);

			scope.a.push(40);
			scope.b = 20;
			destroy();
			scope.$digest();			
			expect(scope.ctr).toBe(1);

		});

		it('can destroy zero-watch listner', function() {
			scope.ctr = 0;

			var destroy = scope.$watchGroup(
				[],
				function(newValues, oldValues, s) {
					s.ctr++;
				}
			);
			destroy();
			scope.$digest();
			expect(scope.ctr).toBe(0);
		});


	});

	describe('inheritance', function() {
		var scope;
		// beforeEach(function(){
		// 	scope = new Scope();
		// });

		it('shares the properties beetween childs scope', function() {
			var parent = new Scope();
			parent.a = 1;
			parent.b = [1,2,3];
			var child = parent.$new();
			expect(child.a).toBe(1);
			expect(child.b).toEqual([1,2,3]);
		});

		it('does not cause to inherit the childs props', function() {
			var parent = new Scope();
			var child = parent.$new();
			child.a = 1;
			expect(parent.a).toBeUndefined();
		});

		it('inherits the parents props whenerver they are defined', function() {
			var parent = new Scope();
			var child = parent.$new();
			parent.a = 1;
			expect(child.a).toBe(1);
		});

		it('can manipulate a parents scope props', function() {
			var parent = new Scope();
			var child = parent.$new();

			parent.a = [1,2,3];
			child.a.push(4);
			expect(parent.a).toEqual([1,2,3,4]);

			parent.b = 1;
			child.b = 10;
			expect(parent.b).toBe(1);
			expect(child.b).toBe(10);
		});

		it('can watch the parents props', function() {
			var parent = new Scope();
			var child = parent.$new();

			parent.a = [1,2,3];
			child.ctr = 0;

			child.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;},
				true
			);

			child.$digest();
			expect(child.ctr).toBe(1);

			child.a.push(4);
			child.$digest();
			expect(child.ctr).toBe(2);

		});

		it('can be nested in any depth', function() {
			var a = new Scope();
			var aa = a.$new();
			var ab = a.$new();
			var aaa = aa.$new();
			var aab = aa.$new();
			var aba = ab.$new();

			a.val = 1;
			expect(aa.val).toBe(1);
			expect(ab.val).toBe(1);
			expect(aaa.val).toBe(1);
			expect(aab.val).toBe(1);
			expect(aba.val).toBe(1);	

			aa.val2 = 2;		
			expect(aaa.val2).toBe(2);
			expect(aab.val2).toBe(2);
			expect(aba.val2).toBeUndefined();
		});

		// it('this is the current object', function() {
		// 	var a = new Scope();
		// 	var aa = a.$new();
		// 	var ab = a.$new();
		// 	var aaa = aa.$new();
		// 	var aab = aa.$new();
		// 	var aba = ab.$new();

		// 	a.a = 1;
		// 	aa.a = 2;
		// 	aaa.a = 3;
		// 	// console.log(a, aa, aaa);
		// 	// a.testThis();
		// 	// aa.testThis();
		// 	// aaa.testThis();
		// 	//this pokazuje obiekt, ktory wywołał tą funkcję

		// });

		it('does not digest its parent(s)', function() {
			var parent = new Scope();
			var child = parent.$new();
			parent.a = 1;
			parent.$watch(
				function(s){return s.a;},
				function(n,o,s){s.b = 10;}
			);
			child.$digest();
			expect(child.b).toBeUndefined();
		});

		it('shadows the parents prop with the same name', function() {
			var parent = new Scope();
			var child = parent.$new();
			parent.a = 1;
			child.a = 2;
			
			expect(parent.a).toBe(1);
			expect(child.a).toBe(2);
		});

		it('does not shadow the members of parents attributes', function() {
			var parent = new Scope();
			var child = parent.$new();
			parent.user = {a:1};
			child.user.a = 2;
			
			expect(parent.user.a).toBe(2);
			expect(child.user.a).toBe(2);
		});

		it('keeps the record of its children', function() {
			var parent = new Scope();
			var child1 = parent.$new();
			var child2 = parent.$new();
			var child11 = child1.$new();
			
			expect(parent.$$children.length).toBe(2);
			expect(parent.$$children[0]).toBe(child1);
			expect(parent.$$children[1]).toBe(child2);

			expect(child1.$$children.length).toBe(1);
			expect(child1.$$children[0]).toBe(child11);
		});

		it('digests its children', function() {
			var parent = new Scope();
			var child = parent.$new();

			parent.a = 1;
			child.$watch(
				function(s){return s.a;},
				function(n,o,s){s.b = 2;}
			);
			parent.$digest();
			expect(child.b).toBe(2);
		});

		it("digests, when $apply call, starting from $root", function() {
			var parent = new Scope();
			var child = parent.$new();
			var child2 = child.$new();

			parent.a = 1;
			parent.ctr = 0;
			parent.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			child2.$apply(function(scope){});
			expect(parent.ctr).toBe(1);

		});

		it('schedules a digest from root in $evalAsync', function(done) {
			var parent = new Scope();
			var child1 = parent.$new();
			var child2 = child1.$new();

			child1.a = 1;
			child1.ctr = 0;
			child1.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);
			child2.a = 10;
			child2.ctr = 0;
			child2.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);
			parent.$digest();

			//gdyby nie poprawka w kodzie, liczyła sie by sie kolejnosc wywolania evalAsync 
			//i w tym wypadku wywołałby sie cykl digest poczawszy od child2, pomijajac child1 
			//ogolnie to wywoływałby sie digest od tego scope, ktory jako pierwszy wywołał evalAsync
			child2.$evalAsync(function(s){s.a = 20;});
			child1.$evalAsync(function(s){s.a = 2;});

			setTimeout(function() {
				expect(child1.ctr).toBe(2);
				expect(child2.ctr).toBe(2);
				done();
			}, 50);
			
		});

		it('does not have access to parent attributes when isolated', function() {
			var parent = new Scope();
			var child = parent.$new(true);

			parent.a = 1;
			// console.log(child);
			expect(child.a).toBeUndefined();
		});

		it('digests its isolated children', function() {
			var parent = new Scope();
			var child = parent.$new(true);

			child.a = 1;
			child.ctr = 0;
			child.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			parent.$digest();
			expect(child.ctr).toBe(1);
		});

		it('digests from root on evalAsync', function(done) {
			var parent = new Scope();
			var child = parent.$new(true);
			var child2 = child.$new();

			parent.a = 1;
			parent.ctr = 0;
			parent.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			child2.$evalAsync(function(){});//ale to nie wszystko, bo child2 doda funkcję, do swojej tablicy, ktorej root nie ma - nalezy to poprawic w innym tescie
			setTimeout(function() {
				expect(parent.ctr).toBe(1);
				done();
			}, 50);
		});

		it('digests from root on apply', function() {
			var parent = new Scope();
			var child = parent.$new(true);
			var child2 = child.$new();

			parent.a = 1;
			parent.ctr = 0;
			parent.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			child2.$apply(function(){});
			expect(parent.ctr).toBe(1);
		});

		it('executes $evalAsync on isolated scopes', function(done) {
			var parent = new Scope();
			var child = parent.$new(true);
			var child2 = child.$new();

			parent.a = 1;
			parent.ctr = 0;
			parent.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;}
			);

			child2.$evalAsync(function(s){s.a = 2;});
			setTimeout(function() {
				expect(parent.ctr).toBe(1);
				expect(child2.a).toBe(2);
				done();
			}, 50);
		});

		it('executes $$postDigest on isolated scopes', function() {
			var parent = new Scope();
			var child = parent.$new(true);
			var child2 = child.$new();

			var ctr = 0;
			child2.$$postDigest(function() {
				ctr++;
			});
			parent.$digest();			
			expect(ctr).toBe(1);
		});

		it('executes $applyAsync on isolated scopes', function() {
			var parent = new Scope();
			var child = parent.$new(true);
			var child2 = child.$new();

			child2.ctr = 0;
			child2.$applyAsync(function(s) {
				s.ctr++;
			});
			parent.$digest();			
			expect(child2.ctr).toBe(1);
		});

		it('can take some other scope as a parent', function(){
			var parent = new Scope();
			var parent2 = new Scope();
			var child = parent.$new(false, parent2);

			parent.a = 100;
			expect(child.a).toBe(100);

			child.ctr = 0;
			child.$watch(function(s) {
				s.ctr++;
			});

			parent.$digest();
			expect(child.ctr).toBe(0);

			parent2.$digest();
			expect(child.ctr).toBe(2);
		});

		it('can destroy scope', function(){
			var parent = new Scope();
			var child = parent.$new();

			child.a = [1,2,3];
			child.ctr = 0;
			child.$watch(
				function(s){return s.a;},
				function(n,o,s){s.ctr++;},
				true
			);

			parent.$digest();
			expect(child.ctr).toBe(1);

			child.a.push(4);
			parent.$digest();
			expect(child.ctr).toBe(2);

			child.$destroy();
			child.a.push(5);
			parent.$digest();
			expect(child.ctr).toBe(2);
		});

	});

	
});