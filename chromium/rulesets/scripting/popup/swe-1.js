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

    const details = {"id":"swe-1","block":{"hostnames":[],"regexes":["/aftonb","[{\"re\":\"\\\\/aftonbladet\\\\/crypt\\\\/\\\\?lpkey\",\"f\":\"i\"}]","/expres","[{\"re\":\"\\\\/expressen\\\\/crypt\\\\/\\\\?lpkey\",\"f\":\"i\"}]","/offer?","[{\"re\":\"\\\\/offer\\\\?prod\",\"f\":\"i\"}]","/prylgu","[{\"re\":\"\\\\/prylguiden-expressen\",\"f\":\"i\"}]","/www.sw","[{\"re\":\"\\\\/www\\\\.swedbank-.*?\\\\/telegram\",\"f\":\"i\"}]","best-pr","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?best-prizes-now\\\\.\",\"f\":\"i\"}]","online.","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?online\\\\.swedbank\\\\.se\\\\.swedd\\\\.\",\"f\":\"i\"}]","s.arclk","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?s\\\\.arclk\\\\.net\\\\/tr\\\\?\",\"f\":\"i\"}]"]},"allow":{"hostnames":[],"regexes":[]}};

    self.preventPopupDetails = self.preventPopupDetails || [];
    self.preventPopupDetails.push(details);

})();
