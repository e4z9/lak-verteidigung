"use strict";
angular.module('lakmeldung', [])
    .controller('appController', function() {
        this.spielerName = '';
        this.burgName = '';
        this.burgLink = '';
        this.datum = new Date();
        this.zeit = new Date();
        this.brueckenLink = '';
        this.angreifer = '';
    });
