"use strict";
angular.module('lakmeldung', [])
    .controller('appController', function($scope) {
        this.spielerName = localStorage['e4z9.lak.spielerName'];
        if (this.spielerName === undefined)
            this.spielerName = '';

        try {
			this.burgen = JSON.parse(localStorage['e4z9.lak.burgen']);
	    } catch(e) {
			this.burgen = [{name: 'Neue Burg', link: ''}];
	    }
        this.burg = this.burgen[0];
        this.datum = new Date();
        this.zeit = new Date();
        this.brueckenLink = '';
        this.angreifer = '';

        var that = this;

        var sortiere = function() {
            that.burgen.sort(function(a, b) {
                return a.name.localeCompare(b.name);
            });
        }

        sortiere();

        this.neueBurg = function() {
            that.burgen.push({name: 'Neue Burg', link: ''});
            that.burg = that.burgen[that.burgen.length-1];
            sortiere();
        }

        this.burgEntfernen = function() {
            if (that.burgen.length <= 1)
                return;
            var index = that.burgen.indexOf(that.burg);
            if (index >= 0) {
                that.burgen.splice(index, 1);
                that.burg = that.burgen[Math.min(that.burgen.length-1, index)];
            }
        }

        $scope.$watch(function() { return that.spielerName; }, function(newValue) {
            localStorage['e4z9.lak.spielerName'] = newValue;
        });
        $scope.$watch(function() { return that.burgen; }, function(newValue) {
            sortiere();
            localStorage['e4z9.lak.burgen'] = JSON.stringify(newValue);
        }, true /*object equality*/);
    });
