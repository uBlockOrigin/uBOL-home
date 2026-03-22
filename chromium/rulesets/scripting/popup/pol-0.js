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

    const details = {"id":"pol-0","block":{"hostnames":["postlnk.com","spolecznosci.net","gasurvey.gemius.com","spolecznosci.mgr.consensu.org"],"regexes":["i/script","\\/scripts\\/click\\.php","iupvid.c","^[^:]+:\\/\\/([^:/]+\\.)?upvid\\.co\\/","ibenchma","^[^:]+:\\/\\/([^:/]+\\.)?benchmark\\.pl\\/screen-container-target\\.html","iczasdzi","^[^:]+:\\/\\/([^:/]+\\.)?czasdzieci\\.pl\\/adurl\\.php","ievertiq","^[^:]+:\\/\\/([^:/]+\\.)?evertiq\\.pl\\/go\\/","isource=","^[^:]+:\\/\\/([^:/]+\\.)?superfilm\\.pl\\/.*?source=admedia&model=pop","iweszlo.","^[^:]+:\\/\\/([^:/]+\\.)?weszlo\\.com\\/\\?bsa_pro_id","iZippysh","^http:\\/\\/p[0-9]{6,10}\\.[a-z]{5,10}\\.com\\/itab\\/[a-z?=A-Z_0-9&]{10,}Zippyshare\\.com[a-z0-9A-Z%.'-]{5,}"]},"allow":{"hostnames":[],"regexes":[]}};

    self.preventPopupDetails = self.preventPopupDetails || [];
    self.preventPopupDetails.push(details);

})();
