#!/bin/bash
multimarkdown "`dirname "$0"`/HandbuchDerVerteidigung.md" | sed 's@<head>@<head>\
	<meta name="viewport" content="width = device-width"/><!-- scaling on iphone -->\
	<link rel="stylesheet" href="stylesheet.css" type="text/css">@'
