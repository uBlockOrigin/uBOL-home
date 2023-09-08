/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
    Copyright (C) 2014-present Raymond Hill

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/gorhill/uBlock
*/

/* jshint esversion:11 */

'use strict';

// ruleset: nld-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssDeclarativeImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\".hz-Page-content\",\"action\":[\"style\",\"max-width: 1300px!important;\"]}"],["{\"selector\":\"#masthead\",\"action\":[\"style\",\"height:90px!important;\"]}"],["{\"selector\":\"aside[class^=\\\"Ad_\\\"]\",\"action\":[\"style\",\"position: absolute !important; left: -3000px !important;\"]}"],["{\"selector\":\"#b_re\",\"action\":[\"style\",\"visibility: collapse !important; min-height: 1.5px !important;\"]}","{\"selector\":\".widebnr\",\"action\":[\"style\",\"visibility: collapse !important; min-height: 1.5px !important;\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"margin-top:-20px!important\"]}"],["{\"selector\":\".top-banner\",\"action\":[\"style\",\"min-height: 0px !important\"]}"],["{\"selector\":\"[class*=\\\"footer-section\\\"] > *\",\"action\":[\"style\",\"display: none !important;\"]}"],["{\"selector\":\"td[background=\\\"http://www.oops.nl/sexverhalen/oopslogo.jpg\\\"]\",\"action\":[\"style\",\"height:50px !important;\"]}"],["{\"selector\":\".adsbygoogle\",\"action\":[\"style\",\"visibility: collapse !important;\"]}","{\"selector\":\".klokken\",\"action\":[\"style\",\"transform: translateX(-180px ) !important;\"]}"]];

const hostnamesMap = new Map([["2dehands.be",0],["marktplaats.nl",0],["nuus.be",1],["gpblog.com",2],["tweakers.net",3],["dekrantvantoen.nl",4],["ensie.nl",5],["meerdangewenst.nl",6],["oops.nl",7],["wereldklokken.nl",8]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.declarativeImports = self.declarativeImports || [];
self.declarativeImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
