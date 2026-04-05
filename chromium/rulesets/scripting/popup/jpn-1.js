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

    const details = {"id":"jpn-1","block":{"hostnames":["av-mov.com","freeadd.me","line-e.com","linoee.com","twitob.com","askfollow.us","line-jp.live","unddeliv.com","bra.almado.jp","hydrangeao.com","ranmaotome.com","yariman.online","moro-douga.link","thepsusiwho.com","click-count.info","googleailesi.com","paradise1972.com","assessoriagmv.com","japans-offers.com","lucky-website.com","amazonlogistics.jp","infohimatalk77.net","more-followers.com","enmusubimail000.com","twitterfollowers.site","sb-hip-happy.ourservice.jp"],"regexes":["ijavcup.","^[^:]+:\\/\\/([^:/]+\\.)?javcup\\.com\\/pop\\/"]},"allow":{"hostnames":[],"regexes":[]}};

    self.preventPopupDetails = self.preventPopupDetails || [];
    self.preventPopupDetails.push(details);

})();
