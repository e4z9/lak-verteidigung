"use strict";
angular.module('lakmeldung', [])
    .controller('appController', function($scope, $timeout) {
        var that = this;
        var Attack = PS["Data.Attack"];
        var Maybe = PS["Data.Maybe"];
        this.burgen = [];
        this.meldungen = [];

        function getJSDate(dateTime) {
            return new Date(dateTime.day.year, dateTime.day.month - 1, dateTime.day.day)
        }
        function getJSTime(dateTime) {
            var t = new Date(0); // initialized to 1.1.1970, 0:00
            t.setHours(dateTime.time.hour);
            t.setMinutes(dateTime.time.minute);
            return t;
        }

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
        this.importVisible = false;
        this.importSpielerLink = localStorage['e4z9.lak.importSpielerLink'];
        if (typeof this.importSpielerLink !== 'string')
          this.importSpielerLink = '';
        this.fromLinkVisible = false;
        this.extendedBridgeLink = '';

        var sortiere = function() {
            that.burgen.sort(function(a, b) {
                return a.name.localeCompare(b.name);
            });
        };

        this.neueBurg = function() {
            that.burg = createBurg();
            that.burgen.push(that.burg);
            sortiere();
            return that.burg;
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

        this.importLakkt = function() {
            var link = that.importSpielerLink.trim();
            if (!link)
                return;
            var url = "https://lakkt.de/de/function/downloadCSV.php?link="
                + encodeURIComponent(link) + "&type=castle";
            Papa.parse(url, {
                download: true,
                complete: function(results) {
                    $scope.$apply(function() {
                        if (results.errors.length > 0) {
                            alert("Fehler beim herunterladen!");
                            console.log(results);
                            return;
                        }
                        var burgen = []
                        results.data.forEach(function(row) {
                            if (row.length >= 2) {
                                var burg = createBurg();
                                burg.displayName = row[0];
                                burg.name = burg.displayName;
                                burg.link = row[1];
                                burgen.push(burg);
                            }
                        });
                        if (burgen.length <= 0) {
                            alert("Fehler beim herunterladen! Keine Burgen gefunden...");
                            console.log(results);
                            return;
                        }
                        var text = "Willst du " + burgen.length + " Burgen importieren? Das überschreibt alle existierenden Burgen.\n";
                        if (confirm(text)) {
                            that.burgen = burgen;
                            sortiere();
                            that.burg = that.burgen[0];
                        }
                    });
                }
            })
        };

        this.findCastleForLinkOr = function(link, defaultProd) {
            var castle = undefined;
            var trimmedLink = link.trim();
            that.burgen.forEach(function(b) {
                if (!castle && b.link.trim() === trimmedLink)
                    castle = b;
            });
            if (castle)
                return castle;
            return defaultProd();
        }

        this.reportFromBridgeLink = function() {
            var maybeAttack = Attack.fromString(that.extendedBridgeLink);
            if (Maybe.isJust(maybeAttack)) {
                var at = maybeAttack.value0;
                var castle = that.findCastleForLinkOr(at.castleLink, function() { return that.neueBurg() } );
                castle.displayName = at.castleName;
                castle.name = at.castleName;
                castle.link = at.castleLink;
                castle.datum = getJSDate(at.dateTime);
                castle.zeit = getJSTime(at.dateTime);
                castle.brueckenLink = at.bridgeLink;
                that.extendedBridgeLink = "";
                that.burg = castle;
            } else {
                alert("Fehler beim Lesen der Daten. Der Brückenlink muss in der Form\n\nBurg: <Name>\n<Burglink>\n<Brückenlink>\nNächste Schlacht: DD.MM.YYYY, HH:MM\n\nsein.")
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

        this.onBridgePaste = function(evt) {
            function z2(val) { return ("0" + val).slice(-2); } // fill with zero to 2 chars
            function askForConfirmation(oldDate, oldTime, newDate, newTime) {
              function formatDate(d) { return "" + z2(d.getJSDate()) + "." + z2(d.getMonth() + 1) + "." + d.getFullYear(); }
              function formatTime(d) { return "" + z2(d.getHours()) + ":" + z2(d.getMinutes()); }
              function formatDateTime(d, t) { return formatDate(d) + ", " + formatTime(t); }
              var text = "Willst du die aktuelle Zeit mit der neuen Zeit ersetzen? \n" +
                  formatDateTime(oldDate, oldTime) + "\n-> " + formatDateTime(newDate, newTime);
              return confirm(text);
            }
            function dateEqual(d1, d2) { return (!d1 && !d2) || (d1 && d2 && d1.getTime() == d2.getTime()); }
            var link = evt.clipboardData.getData('text/plain');
            var maybeAttack = Attack.fromString(link);
            if (Maybe.isJust(maybeAttack)) {
                var at = maybeAttack.value0;
                var newLink = at.bridgeLink;
                var atDate = getJSDate(at.dateTime);
                var atTime = getJSTime(at.dateTime);
                var emptyDateTime = !that.burg.datum && !that.burg.zeit;
                if (emptyDateTime
                        || (dateEqual(that.burg.datum, atDate) && dateEqual(that.burg.zeit, atTime))
                        || askForConfirmation(that.burg.datum, that.burg.zeit, atDate, atTime)) {
                    that.burg.datum = atDate;
                    that.burg.zeit = atTime;
                }
                $timeout(function(){ that.burg.brueckenLink = newLink; });
            }
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
        $scope.$watch(function() { return that.importSpielerLink; }, function(newValue) {
            localStorage['e4z9.lak.importSpielerLink'] = newValue;
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
