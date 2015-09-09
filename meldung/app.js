"use strict";
angular.module('lakmeldung', [])
    .controller('appController', function($scope) {
        var that = this;
        this.burgen = [];

        var createBurg = function() {
            return { name: 'Neue Burg', link: '',
                     datum: new Date(), zeit: new Date(),
                     brueckenLink: '', angreifer: '' };
        };

        var ladeBurgen = function() {
            try {
                var burgSettings = JSON.parse(localStorage['e4z9.lak.burgen']);
                if (burgSettings !== undefined && burgSettings['burgen'] !== undefined)
                    that.burgen = burgSettings.burgen;
            } catch(e) {
            }
            if (that.burgen.length <= 0)
                that.burgen = [createBurg()];
        };
        var speicherBurgen = function() {
            var burgSettings = { version: 1,
                                 burgen: that.burgen };
            localStorage['e4z9.lak.burgen'] = JSON.stringify(burgSettings);
        };

        this.spielerName = localStorage['e4z9.lak.spielerName'];
        if (this.spielerName === undefined)
            this.spielerName = '';

        ladeBurgen();
        this.burg = this.burgen[0];

        var sortiere = function() {
            that.burgen.sort(function(a, b) {
                return a.name.localeCompare(b.name);
            });
        };

        this.neueBurg = function() {
            that.burgen.push(createBurg());
            that.burg = that.burgen[that.burgen.length-1];
            sortiere();
        };

        this.burgEntfernen = function() {
            if (that.burgen.length <= 1)
                return;
            var index = that.burgen.indexOf(that.burg);
            if (index >= 0) {
                that.burgen.splice(index, 1);
                that.burg = that.burgen[Math.min(that.burgen.length-1, index)];
            }
        };

        this.angriffsInfoLoeschen = function() {
            that.burgen.forEach(function(burg) {
                burg.datum = new Date();
                burg.zeit = new Date();
                burg.brueckenLink = '';
                burg.angreifer = '';
            });
        };

        $scope.$watch(function() { return that.spielerName; }, function(newValue) {
            localStorage['e4z9.lak.spielerName'] = newValue;
        });
        $scope.$watch(function() { return that.burgen; }, function(newValue) {
            sortiere();
            speicherBurgen();
        }, true /*object equality*/);
    });
