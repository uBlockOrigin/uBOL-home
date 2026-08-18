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

    const details = {"id":"deu-0","block":{"hostnames":["cgames.de","gg-bet.de","wixnm.com","smsdate.com","delmovip.com","xtreff69.com","vulkanbet.pro","ggbetcasino.de","putenbrust.net","pre.xlust24.com","probefahrt.gratis","vulkanbetting.biz","vulkanvegas-de.com","landing.sexkiste.com","vulkanvegascasino.at","start.sexpartnercommunity.com"],"regexes":["allroun","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?allround-pc\\\\.com[^%.0-9a-z_-].*?\\\\.php\\\\?.*?=\",\"f\":\"i\"}]","escaria","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?escaria\\\\.com\\\\/public\\\\/static\\\\/teaser\\\\/\\\\?\",\"f\":\"i\"}]","/landin","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?ilove\\\\.de[^%.0-9a-z_-].*?\\\\/landing_pages\\\\/\",\"f\":\"i\"}]","ishelmi","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?ishelminger\\\\.de\\\\/ad\\\\/\",\"f\":\"i\"}]","o2-frei","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?o2-freikarte\\\\.de\\\\/affiliate\\\\/\",\"f\":\"i\"}]","pre.xko","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?pre\\\\.xkontakt18\\\\.com\\\\/campaign\\\\?\",\"f\":\"i\"}]","sunmake","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?sunmaker\\\\.com\\\\/\\\\?a_aid=\",\"f\":\"i\"}]","/sms?__","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?taps\\\\.io[^%.0-9a-z_-].*?\\\\/sms\\\\?__ref=\",\"f\":\"i\"}]","tuneclu","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?tuneclub\\\\.de[^%.0-9a-z_-].*?\\\\/lp\\\\.pl\\\\?\",\"f\":\"i\"}]","data-lo","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?data-load\\\\.me\\\\/partner\\\\/\",\"f\":\"i\"}]","delamar","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?delamar\\\\.de\\\\/out\\\\/\",\"f\":\"i\"}]","sexei.n","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?sexei\\\\.net\\\\/go\\\\.html\",\"f\":\"i\"}]"]},"allow":{"hostnames":[],"regexes":[]}};

    self.preventPopupDetails = self.preventPopupDetails || [];
    self.preventPopupDetails.push(details);

})();
