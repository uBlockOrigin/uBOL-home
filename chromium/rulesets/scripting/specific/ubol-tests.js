/*******************************************************************************

    uBlock Origin Lite - a comprehensive, MV3-compliant content blocker
    Copyright (C) 2019-present Raymond Hill

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

// ruleset: ubol-tests

// Important!
// Isolate from global scope
(function uBOL_cssSpecificImports() {

/******************************************************************************/

const argsList = ["#ccf1 .fail,\n#ccf2 .fail:not(.a4),\n#ccf4 .fail-pseudo::before,\n#pcf1 .fail:has(b),\n#pcf16 .pass > a:has(b) + .fail,\n#pcf17 .pass > a:has(b) + .fail:has(b),\n#pcf19 .fail:has(+ a),\n#pcf2 .fail:has(> a > b),\n#pcf3 .fail:has(+ a > b),\n#pcf5 .fail:has(:is(.pass a > b)),\n#pcf6 .fail:not(:has(c))"];

const hostnamesMap = new Map([["ublockorigin.github.io",0],["localhost",0]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.specificImports = self.specificImports || [];
self.specificImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
