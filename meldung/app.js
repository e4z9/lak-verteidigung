"use strict";
angular.module('lakmeldung', [])
    .controller('appController', function($scope) {
        var that = this;
        this.burgen = [];
        this.meldungen = [];

        this.sortierungen = [
            { name: 'Zeitpunkt',
              fun: function(a, b) {
                  function compareDates(d1, d2) {
                      if (d1 === d2) return 0;
                      if (d1 === undefined) return 1;
                      if (d2 === undefined) return -1;
                      return d1.getTime() - d2.getTime();
                  };
                  var dateComp = compareDates(a.datum, b.datum);
                  if (dateComp !== 0)
                      return dateComp;
                  return compareDates(a.zeit, b.zeit);
              }
            },
            { name: 'Name',
              fun: function(a, b) {
                  return a.name.localeCompare(b.name);
              }
            }
        ];

        var sortierungsIndex = 0;
        try {
            sortierungsIndex = JSON.parse(localStorage['e4z9.lak.meldungsSortierung']);
        } catch (e) {
        }
        if (typeof sortierungsIndex !== 'number' || sortierungsIndex < 0
                || sortierungsIndex > this.sortierungen.length)
            sortierungsIndex = 0;
        this.meldungsSortierung = this.sortierungen[sortierungsIndex];

        var sortiereMeldungen = function() {
            // meldungen kopieren
            var nextIndex = 0;
            that.burgen.forEach(function(burg) {
                if (burg.datum && burg.zeit) {
                    that.meldungen[nextIndex] = burg;
                    ++nextIndex;
                }
            });
            // rest abschneiden
            if (that.meldungen.length > nextIndex)
                that.meldungen.splice(nextIndex);
            // sortieren
            that.meldungen.sort(that.meldungsSortierung.fun);
        };

        var createBurg = function() {
            return { displayName: 'Neue Burg', name: 'Neue Burg', link: '',
                     datum: undefined, zeit: undefined,
                     brueckenLink: '', angreifer: '' };
        };

        var resetBurg = function(burg) {
            burg.displayName = burg.name;
            burg.datum = undefined;
            burg.zeit = undefined;
            burg.brueckenLink = '';
            burg.angreifer = '';
        };

        var markiere = function() {
            that.burgen.forEach(function(burg) {
                if (burg.datum && burg.zeit)
                    burg.displayName = '🔴' + burg.name;
                else
                    burg.displayName = burg.name;
            });
        };

        var ladeBurgen = function() {
            try {
                var burgSettings = JSON.parse(localStorage['e4z9.lak.burgen']);
                if (burgSettings !== undefined && burgSettings['burgen'] !== undefined)
                    that.burgen = burgSettings.burgen;
                // fix Date values which are converted to string and not parsed back as Date
                that.burgen.forEach(function(burg) {
                    if (typeof burg.datum === 'string')
                        burg.datum = new Date(burg.datum);
                    if (typeof burg.zeit === 'string')
                        burg.zeit = new Date(burg.zeit);
                });
            } catch(e) {
            }
            if (that.burgen.length <= 0)
                that.burgen = [createBurg()];
            markiere();
            sortiereMeldungen();
        };
        var speicherBurgen = function() {
            var burgSettings = { version: 1,
                                 burgen: that.burgen };
            localStorage['e4z9.lak.burgen'] = JSON.stringify(burgSettings);
        };

        this.spielerName = localStorage['e4z9.lak.spielerName'];
        if (typeof this.spielerName !== 'string')
            this.spielerName = '';

        ladeBurgen();
        this.burg = this.burgen[0];
        this.instructionsVisible = false;
        this.importVisible = true;

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
            that.burgen.forEach(resetBurg);
        };

        this.burgAngriffsInfoLoeschen = function() {
            resetBurg(that.burg);
        };

        this.hatAngriffe = function() {
            var hatAngriffe = false;
            that.burgen.forEach(function(burg) {
                if (burg.datum && burg.zeit)
                    hatAngriffe = true;
            });
            return hatAngriffe;
        };

        this.now = function() {
            return new Date();
        };

        $scope.$watch(function() { return that.spielerName; }, function(newValue) {
            localStorage['e4z9.lak.spielerName'] = newValue;
        });
        $scope.$watch(function() { return that.burgen; }, function(newValue) {
            markiere();
            sortiere();
            sortiereMeldungen();
            speicherBurgen();
        }, true /*object equality*/);
        $scope.$watch(function() { return that.meldungsSortierung; }, function(newValue) {
            sortiereMeldungen();
            localStorage['e4z9.lak.meldungsSortierung'] = JSON.stringify(that.sortierungen.indexOf(newValue));
        });
    })
    .directive('ezBurg', function() {
        return {
            restrict: 'E',
            scope: {
                burg: '='
            },
            templateUrl: 'burg-template.html'
        };
    })
    .config(['$compileProvider', function($compileProvider) {
        // allow l+k:// links
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|l\+k):/);
    }]);
