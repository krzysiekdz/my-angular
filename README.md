my-angular
=============

Własna implementacja fragmentu frameworka angularjs, na podstawie książki [Build Your Own AngularJS](https://teropa.info/build-your-own-angular/build_your_own_angularjs_sample.pdf) napisanej przez [Tero Parviainen](https://github.com/teropa). <br>

### Motywacja
Jestem w trakcie pisania [pracy magisterskiej](https://github.com/krzysiekdz/mgr-main) na temat wydajności frameworków javascript. Jednym z frameworków jakie testuję jest angularjs. Kierowany ciekawością jak "maszyna" AngularJS działa "pod maską" postanowiłem że napiszę własną implementację. Okazało się to nie łatwym zadaniem. W pewnym momencie napotkałem problemy których nie umiałem sam rozwiązać. Zacząłem jescze bardziej zgłebiać temat, w końcu trafiłem na książke [Build Your Own AngularJS](https://teropa.info/build-your-own-angular/build_your_own_angularjs_sample.pdf) która, jak mówi tytuł, pokazuje jak napisać samemu bibliotekę angularjs. Byłem zafascynowany ! :) Porzuciłem mój mały projekt i jescze raz krok po kroku, "uzbrojony" tym razem "po zęby" (w książkę) rozpocząłem pracę nad projektem "my-angular". 

Pracę rozpocząłem we wrześniu 2016 (ale dokumentowanie w git dopiero od listopada 2016). Traktuję to jako zajęcie hobbystyczne, gdyż normalnie głównym zadaniem do zrobienia jest napisanie pracy magisterskiej.


### Architektura AngularJS
Architekturę AngularJS można podzielić na kilka głównych komponentów:
- Scope's - zakresy, dziedziczenie zakresów, reagowanie na zmiany, mechanizm zdarzeń
- Expressions and Filters - wyrażenia angularjs, filtry
- Modules and Dependency Injection - moduły i zarządzanie zależnościami
- Directives - kompilacja DOM, kontrolery, dyrektywy
- Utilities - obietnice, usluga http

Aktualnie moja implementacja obejmuje pierwsze trzy komponenty.


### Struktura projektu
Projekt m .in. składa się z dwóch folderów: src oraz test. Folder src zawiera kod projektu, folder test - testy jednostkowe. Każda nowo dodawana funkcjonalność do frameworka, jest opatrzona odpowiednim testem. Jego spełnienie oznacza, że dana funkcjonalność działa prawidłowo we frameworku. Do testów jednostkowych wykorzystywany jest framework [Jasmine](https://jasmine.github.io/) wraz z narzędziem [Testem](https://github.com/testem/testem)


### English description

Implementing angularjs library from beginning with [Build Your Own AngularJS](https://teropa.info/build-your-own-angular/build_your_own_angularjs_sample.pdf) book by [Tero Parviainen](https://github.com/teropa)

I am writing a [Master's Thesis](https://github.com/krzysiekdz/mgr-main), about performance of JavaScript's frameworks. One of which I will be testing is angularjs. I wanted to know how angularjs is working "under the hood" for better understanding all of this stuff. So I decided to write my own implementation. Although it is hard task to do. Firstly I was trying to do it on my own and I implemented "something". But in the meantime I found book by Tero Parviainen how to build AngularJS profesionally. I was fascinated! :-) So I left my own tiny project, and started to do this once again "armed to the teeth" in this project.

I stared writing it about 2 months ago (September 2016), work goes slowly, becaues I have some other things to do. It's a pity that I wroted scope's implementation and tests without using git, so there is no history for them. 



