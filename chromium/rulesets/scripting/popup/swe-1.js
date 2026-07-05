/*******************************************************************************

    uBlock Origin Lite - a comprehensive, MV3-compliant content blocker
    Copyright (C) 2026-present Raymond Hill

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

// Important!
// Isolate from global scope
(function uBOL_preventPopup() {

    const details = {"id":"swe-1","block":{"hostnames":[],"regexes":["i/aftonb","\\/aftonbladet\\/crypt\\/\\?lpkey","i/expres","\\/expressen\\/crypt\\/\\?lpkey","i/offer?","\\/offer\\?prod","i/prylgu","\\/prylguiden-expressen","i/www.sw","\\/www\\.swedbank-.*?\\/telegram","ibest-pr","^[^:]+:\\/\\/([^:/]+\\.)?best-prizes-now\\.","ionline.","^[^:]+:\\/\\/([^:/]+\\.)?online\\.swedbank\\.se\\.swedd\\.","is.arclk","^[^:]+:\\/\\/([^:/]+\\.)?s\\.arclk\\.net\\/tr\\?"]},"allow":{"hostnames":[],"regexes":[]}};

    self.preventPopupDetails = self.preventPopupDetails || [];
    self.preventPopupDetails.push(details);

})();
