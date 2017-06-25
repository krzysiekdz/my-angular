my-angular
=============

Własna implementacja fragmentu frameworka angularjs, na podstawie książki [Build Your Own AngularJS](https://teropa.info/build-your-own-angular/build_your_own_angularjs_sample.pdf) napisanej przez [Tero Parviainen](https://github.com/teropa). <br>

### Architektura
Architekturę AngularJS można podzielić na kilka głównych komponentów:
- Scope's - zakresy, dziedziczenie zakresów, reagowanie na zmiany, mechanizm zdarzeń
- Expressions and Filters - wyrażenia angularjs, filtry
- Modules and Dependency Injection - moduły i zarządzanie zależnościami
- Directives - kompilacja DOM, kontrolery
- Utilities - obietnice, usluga http

Aktualnie moja implementacja obejmuje pierwsze trzy komponenty.

### Motywacja
Jestem w trakcie pisania [pracy magisterskiej](https://github.com/krzysiekdz/mgr-main) na temat wydajności frameworków javascript. Jednym z frameworków jakie będę testował jest angularjs. 

Chciałem lepiej rozumieć 



old description
=========


Implementing angularjs library from beginning with [Build Your Own AngularJS](https://teropa.info/build-your-own-angular/build_your_own_angularjs_sample.pdf) book by [Tero Parviainen](https://github.com/teropa)

I am writing a [Master's Thesis](https://github.com/krzysiekdz/mgr-main), about performance of JavaScript's frameworks. One of which I will be testing is angularjs. I wanted to know how angularjs is working "under the hood" for better understanding all of this stuff. So I decided to write my own implementation. Although it is hard task to do. Firstly I was trying to do it on my own and I implemented "something". But in the meantime I found book by Tero Parviainen how to build AngularJS profesionally. I was fascinated! :-) So I left my own tiny project, and started to do this once again "armed to the teeth" in this project.

I stared writing it about 2 months ago (September 2016), work goes slowly, becaues I have some other things to do. It's a pity that I wroted scope's implementation and tests without using git, so there is no history for them. 

Now, next job to do, is to implement AngularJS expressions. That will need parser, lexer and AST tree. It's going to be very interesting :-)


