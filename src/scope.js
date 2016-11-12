/* jshint globalstrict: true */
/* global forEach:false */
'use strict'; 

//--------------scope's core

function Scope() {
	//scope's core
	this.$$watchers = [];
	this.$$lastDirtyWatch = null;
	this.$$asyncQueue = [];//taski wykonywane dopiero podczas wywolania digest
	this.$$applyAsyncQueue = [];//taski wywolywane w momencie gdy przegladrka nie mu juz nic do roboty; 
	this.$$applyAsyncId = null;
	this.$$phase = null;
	this.$$postDigestQueue = [];

	//scope's inheritance
	this.$$children = [];
	this.$root = this;
	this.$parent = null;

	//scope's events
	this.$$listeners = {};//
}

function initWatchVal(){}

//valueEq - jesli true, to sprawdzamy w przypadku obiektow i tablic, całe obiekty, a nie tylko zgodnosc referencji
//watchFn wykonuje sie zawsze przy kazdym digest chociaz raz, listenerFn tylko w wypadku zmiany wartosci
Scope.prototype.$watch = function(watchFn, listenerFn, valueEq) {
	this.$root.$$lastDirtyWatch = null;//kazde wywolanie watch zeruje watchery, tak, ze trzeba je sprawdzic wszystkie od nowa
	var watcher = {
		watchFn: watchFn,
		listenerFn: listenerFn || function(){},
		last: initWatchVal,
		valueEq: !!valueEq,
	};
	this.$$watchers.unshift(watcher);
	//usuwanie watcher'a
	var self = this;
	return function() {
		var i = self.$$watchers.indexOf(watcher);//indeks mzoe sie zmienic w trakcie dzialania, dlatego pobieram indeks dopiero w momencie usuwania
		if(i >= 0) { //tylko jesli znalezlismy obiekt
			self.$$watchers.splice(i, 1);
		} 
		self.$root.$$lastDirtyWatch = null;//w oryginalne ta instrukcja jest w if wyzej, ale tak mi nie działa
		
	};
};

Scope.prototype.$digest = function() {
	this.$beginPhase('digest');

	var dirty = false;
	var ttl = 10;
	this.$root.$$lastDirtyWatch = null;
	

	//flush applyAsync queue
	if(this.$$applyAsyncQueue.length) {
		clearTimeout(this.$root.$$applyAsyncId);
		this.$$flushApplyAsyncQueue();
	}
	
	//do digest cycles
	do {
		while(this.$$asyncQueue.length) {
			var task = this.$$asyncQueue.shift();
			try {
				task.scope.$eval(task.expr, task.args);
			} catch (e) {
				console.log('exception in evalAsync: ', e);
			}
		}
		dirty = this.$digestOnce();
		ttl--;
		if(!ttl && (dirty || this.$$asyncQueue.length)) {
			this.$clearPhase();
			throw 'digest reached 10 iterations!';
		}
	} while(dirty || this.$$asyncQueue.length);

	//flush postDigest queue
	while(this.$$postDigestQueue.length) {
		try{
			this.$$postDigestQueue.shift()();
		} catch(e) {
			console.log('exception in postDigest: ', e);
		}
	}

	this.$clearPhase();
};

//wyobrazac sobie model angulara z kuleczkami :)
Scope.prototype.$digestOnce = function() {
	var dirty = false;//dirty odnosi sie do całego cyklu digestOnce
	var continueLoop = true;//tylko po to, aby zoptymalizowac przeszukiwanie calego zbioru - to samo co lastDirtyWatch tylko ze dla przeszukiwania rekurencynego
	this.$everyScope( function(scope) {
		var newVal, oldVal;
		_.forEachRight(scope.$$watchers, function(watcher) {//przejscie od prawej stosowane po to, ze wtedy nie patrzymy na dlugosc kolekcji, tylko kiedy indeks osiagnie numer 0
			try {
				if(watcher) {
					newVal = watcher.watchFn(scope);
					oldVal = watcher.last;
					if(!scope.$areEqual(newVal, oldVal, watcher.valueEq)) {
						scope.$root.$$lastDirtyWatch = watcher;
						watcher.last = (watcher.valueEq ? _.cloneDeep(newVal) : newVal);
						watcher.listenerFn(newVal, 
							((oldVal===initWatchVal)? newVal:oldVal), scope);	
						dirty = true;
					} else if(scope.$root.$$lastDirtyWatch === watcher) {
						continueLoop = false;
						return false;
					}
				}
			} catch(e) {
				console.log('exception in digest cycle:' , e);
			}
		});
		return continueLoop;
	});
	
	return dirty;
};

Scope.prototype.$areEqual = function(newVal, oldVal, valueEq) {
	if(valueEq) {
		return _.isEqual(newVal, oldVal);
	} else {
		return (newVal === oldVal) || (typeof newVal == 'number' && 
			typeof oldVal == 'number' && isNaN(newVal) && isNaN(oldVal));
	}
};

Scope.prototype.$eval = function(fn, args) {
	return fn(this, args);
};

Scope.prototype.$apply = function(fn, args) {
	try {
		this.$beginPhase('apply');
		return this.$eval(fn, args);
	} finally {
		this.$clearPhase();
		this.$root.$digest();
	}
};

//czy nie powinno zerowac lastDirtyWatch?
Scope.prototype.$evalAsync = function(fn, args) {
	var self = this;
	if(!this.$$phase && !this.$$asyncQueue.length) {
		setTimeout(function() {
			if(self.$$asyncQueue.length) {
				self.$root.$digest();//tutaj nie moze byc przypadkowy scope ktory wywołał digest, bo nie wiemy kto pozniej doda eval, i byc moze zmiany go nie dotkną
			}
		}, 0);
	}
	this.$$asyncQueue.push({
		scope: this,
		expr: fn,
		args: args,
	});
	this.$root.$$lastDirtyWatch = null;//moze zajsc sytuacja ze modyfikuje wartosc, ktora jest po lastDirtyWatch, i wtedy dochodzac tylko do lastDirtyWatch w funkcji digestOnce, nie przejde dalej aby poznac ze watcher dalej zostal zmodyfikowany
};

//applyAsync wywolane dopiero w wolnej chwili przegladarki
//wywolane wszyskie raz, a potem wywolany digest; jesli w digest beda kolejne wywolania
//to bedzie to juz na koleny moment w wolnej chwili przegladarki
Scope.prototype.$applyAsync = function(fn, args) {
	var self = this;
	this.$$applyAsyncQueue.push(
		function() {
			self.$eval(fn, args);
		}
	);

	//w jednym apply nastepuje wywolanie funkcji iterujacej po wszystkich taskach, a na koniec
	//bedzie wywolane digest porzez mechanizm apply - digest wykona sie raz
	if(self.$root.$$applyAsyncId === null) {
		self.$root.$$applyAsyncId = setTimeout(function() {
			self.$apply(function() {
				self.$$flushApplyAsyncQueue();
			});

		}, 0);
	}
};

Scope.prototype.$beginPhase = function(phase) {
	if(this.$root.$$phase) {
		throw this.$root.$$phase + ' already in progress.';
	}
	this.$root.$$phase = phase;
};

Scope.prototype.$clearPhase = function() {
	this.$root.$$phase = null;
};

Scope.prototype.$$flushApplyAsyncQueue = function() {
	while(this.$$applyAsyncQueue.length) {
		try {
			this.$$applyAsyncQueue.shift()();
		} catch (e) {
			console.log('exception in applyAsync: ',e);
		}
	}
	this.$root.$$applyAsyncId = null;
};

Scope.prototype.$$postDigest = function(fn) {
	this.$$postDigestQueue.push(fn);
};

//watchGroup napisany przy uzyciu dzialajcych juz funkcji, bez modyfikowania ich kodu
Scope.prototype.$watchGroup = function(watchFns, listenerFn, valueEq) {
	var len = watchFns.length;
	var self = this;
	var newValues = new Array(len);
	var oldValues = new Array(len);
	var listenerFnScheduled = false;

	//wykonanie listenera raz, dla pustej tablicy (trzeba tez zadbac o to, aby mozna usunac taki listner)
	if(len === 0) {
		var canEval = true;
		this.$evalAsync(function() {
			if(canEval) {
				listenerFn([],[],self);
			}
		});
		//funkcja musi byc destruktorem , ale nie da sie usunac tasku z kolejki, wiec trzeba wbudowac w funkcje taska mechanizm umozliwijacy odwolnie wykoania
		return function(){canEval = false;};
	}

	function scheduleListenerFn() {
		listenerFnScheduled = true;
		self.$evalAsync(function() {
			listenerFn(newValues, oldValues, self);
			listenerFnScheduled = false;
		});
	}

	var destroy = _.map(watchFns, function(watchFn, i) {
		return self.$watch(watchFn, function(newv, oldv, scope) {
			newValues[i] = newv;
			oldValues[i] = oldv;
			if(!listenerFnScheduled) {
				scheduleListenerFn();
			}
		}, valueEq);
	});

	return function() {
		_.forEach(destroy, function(dest) {
			dest();
		});
	};
};

//----------------------- scope's inheritance

Scope.prototype.$new = function(isolated, parent) {
	var child;
	parent = parent || this;
	if(isolated) {
		child = new Scope();
		child.$root = this.$root;
		child.$$asyncQueue = this.$$asyncQueue;
		child.$$postDigestQueue = this.$$postDigestQueue;
		child.$$applyAsyncQueue = this.$$applyAsyncQueue;
	} else {
		var ChildScope = function(){};
		ChildScope.prototype = this;
		child = new ChildScope();//child.__proto__ === this
		child.$$watchers = [];
		child.$$children = [];
		child.$$listeners = {};
	}
	
	parent.$$children.push(child);
	child.$parent = parent;
	return child;
};

// Scope.prototype.testThis = function() {
// 	console.log(this);
// };

//dla kazdego dziecka oraz dla samego siebie, wykonaj funkcję fn - dopoki zwraca ona true wykonuj
//jesli element nie ma dzieci, liczy sie to, co zwraca fn(this) - jesli true, to dla pustego zbioru dzieci every zwraca true; w jesli fn(this) == false, to zwraca false
//przejscie everyScope ma ten sam sens co iteracja po wszystkich watcherach wszyskich scope-ów w hierarchii
Scope.prototype.$everyScope = function(fn) {
	if(fn(this)){
		return this.$$children.every(function(child) {
			return child.$everyScope(fn);
		});
	} else {
		return false;
	}
};

Scope.prototype.$destroy = function() {

	this.$broadcast('$destroy');//event's system - informuje children o tym, ze ich rodzic-czyli ten scope, jest usuniety i one powinny zwolnic zajmowane zasoby, jesli moga to zrobic w sposob jawny

	if(this.$parent) { //$root nie ma parent'a
		var i = this.$parent.$$children.indexOf(this);
		if(i >= 0) {
			this.$parent.$$children.splice(i, 1);
		}
	}
	this.$$watchers = [];
	this.$$children = [];
	this.$$listeners = {};
};

//------------------------- watchCollection

//watchCollection rozni sie od areEqual(a,b,true) tym, ze sprawdza zmiany w kolekcji, tzn
//nie sprawdza modyfikacji konkretnych elementow, ale zmiany w samej kolekcji, tj dodawanie, usuwanie
//zmiany miejscami elementow (reorder) badz wstawienie innego zamiast jakiegos (replace)
Scope.prototype.$watchCollection = function(watchFn, listenerFn) {
	var self = this;
	var newValue;
	var oldValue = function(){};//init value
	var changeCount = 0;
	var firstCall = true;
	var isSimpleType = false;

	//ta funkcja ma za zadanie sledzic zmiany w kolekcji, zwraca natomiast licznik ktory jest podibjany jesli zmiana zaszla
	function internalWatchFn(scope) {
		newValue = watchFn(scope);

		if(_.isObject(newValue)) {
			isSimpleType = false;

			//arrayLike
			if(_.isArrayLike(newValue)) {
				if(!_.isArray(oldValue)) {
					changeCount++;
					oldValue = [];
				} 
				if(newValue.length !== oldValue.length) {
					changeCount++;
				}

				for(var i = 0; i < newValue.length; i++) {
					if(!self.$areEqual(newValue[i], oldValue[i], false)) {
						changeCount++;
						break;
					}
				}
			}
			else {//is object
				if(!_.isObject(oldValue) || _.isArrayLike(oldValue)) {
					changeCount++;
					oldValue = {};
				} 
				_.forOwn(newValue, function(val, key) {
					if(!self.$areEqual(val, oldValue[key], false)) {
						changeCount++;
						return false;
					}
				});
				// nastepnie nalezy sprawdzic 'stary' obiekt pod wzgledem czy nie usunieto z nowego pól
				for(var j in oldValue) {
					if(!newValue.hasOwnProperty(j)) {
						changeCount++;
						break;
					}
				}	
			}
		} else { //mamy doczynienia z typem prostym
			isSimpleType = true;
			if(!self.$areEqual(newValue, oldValue, false)) {//przekazuje false, bo to typ prosty
				changeCount++;
			}
		}

		return changeCount;//ta wartosc przez mechanizm digest bedzie sledzona, prawdziwe new i old values sa tutaj
		//jesli changeCount sie zmieni, wywola sie internalListenerFn
	}

	function copyArray() {
		_.forEach(newValue, function(item, i) {
			oldValue[i] = item;
		});
		oldValue.length = newValue.length;
	}

	function copyObject() {
		_.forOwn(newValue, function(val, key){
			oldValue[key] = val;
		});//trzeba jeszcze usunac pola, ktore byc moze usunieto w newValue
		_.forOwn(oldValue, function(val, key) {
			if(!newValue.hasOwnProperty(key)) {
				delete oldValue[key];
			}
		});
	}

	function internalListenerFn() {
		if(firstCall && isSimpleType) {
			oldValue = newValue;
		} else if(firstCall && _.isArrayLike(newValue)) {
			copyArray();
		} else if (firstCall) { //is object
			copyObject();
		}
		firstCall = false;

		listenerFn(newValue, oldValue, self);

		if(isSimpleType) {
			oldValue = newValue;
		} else {
			if(_.isArrayLike(newValue)) {
				copyArray();
			} else {//is object
				copyObject();
			}
		}
		
	}

	return this.$watch(internalWatchFn, internalListenerFn, false);//tutaj porownujemy zawsze changeCount, wiec niepotrzeba poprzez kopiowanie glebokie
};


//---------------------- scopes's events 

Scope.prototype.$on = function(evtName, listenerFn) {
	if(!this.$$listeners.hasOwnProperty(evtName)) {
		this.$$listeners[evtName] = [];
	}
	var listeners = this.$$listeners[evtName];
	listeners.push(listenerFn);

	return function() {
		var i = listeners.indexOf(listenerFn);
		if(i >= 0) {
			listeners[i] = null;
		}
	};
};

Scope.prototype.$emit = function(evtName) {
	var stopPropagation = false;
	var event = {
		name : evtName,
		targetScope: this,
		currentScope: this, 
		stopPropagation: function() {
			stopPropagation = true;
		},
		preventDefault: function() {
			event.defaultPrevented = true;
		},
		defaultPrevented: false,
	};
	var listOfArgs = [event];
	_.forEach(arguments, function(arg, i) {//iteruje tylko po polach liczbowych
		if(i > 0) {
			listOfArgs.push(arg);
		}
	});
	var scope = this;
	do {
		event.currentScope = scope;
		scope.$$fireEventOnScope(evtName, listOfArgs);
		scope = scope.$parent;
	} while (scope && !stopPropagation);

	event.currentScope = null;
	return event;
};

Scope.prototype.$broadcast = function(evtName) {
	var event = {
		name : evtName,
		targetScope: this,
		currentScope: this, 
		stopPropagation: function() {},
		preventDefault: function() {
			event.defaultPrevented = true;
		},
		defaultPrevented: false,
	};
	var listOfArgs = [event];
	_.forEach(arguments, function(arg, i) {//iteruje tylko po polach liczbowych
		if(i > 0) {
			listOfArgs.push(arg);
		}
	});
	this.$everyScope(function(scope) {
		event.currentScope = scope;
		scope.$$fireEventOnScope(evtName, listOfArgs);
		return true;
	});

	event.currentScope = null;
	return event;
};

Scope.prototype.$$fireEventOnScope = function(evtName, args) {
	var listeners = this.$$listeners[evtName] || [];
	var i = 0;
	while(i < listeners.length) {
		if(listeners[i] === null) {
			listeners.splice(i, 1);
		} else {
			try {
				listeners[i].apply(null, args);
			} catch (e) {
				console.log('exception in $$listeners: ', e);
			}
			i++;	
		}
	}
};