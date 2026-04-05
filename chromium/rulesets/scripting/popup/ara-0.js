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

    const details = {"id":"ara-0","block":{"hostnames":["aflam.io","zlps.xyz","aflam.info","eonads.com","arabiawin.com","elmassar-ar.com","protect-web.com","adv.videomega.tv","arabnewscom.ipage.com","forexxzx.blogspot.com.eg","add-friendso.blogspot.com"],"regexes":["i.cash/?","\\.cash\\/\\?clickid=","i&publis","\\.do\\?offer=.*?&publisher_id=","i/afstra","\\/afstrack\\..*?\\?affid=","iclicks","clicks.*\\/afs","i/cpm/ad","\\/cpm\\/ad\\.","i/get/ia","\\/get\\/iad\\/","i?sconte","\\/imp\\/.*?\\?scontext_b=","ibahai-f","^[^:]+:\\/\\/([^:/]+\\.)?bahai-forum\\.com\\/go\\/","ideals.s","^[^:]+:\\/\\/([^:/]+\\.)?deals\\.souq\\.com[^%.0-9a-z_-].*?&pubref=","idropvid","^[^:]+:\\/\\/([^:/]+\\.)?dropvideo\\.com\\/adorika\\/","i/?utm_s","^[^:]+:\\/\\/([^:/]+\\.)?dubizzle\\.com[^%.0-9a-z_-].*?\\/\\?utm_source=","ishein.c","^[^:]+:\\/\\/([^:/]+\\.)?shein\\.com\\/\\?aff_id=","iactionz","^[^:]+:\\/\\/([^:/]+\\.)?actionz\\.net:","i/photos","^[^:]+:\\/\\/([^:/]+\\.)?arabseed\\..*?\\/photos\\/shares\\/","i/wp-con","^[^:]+:\\/\\/([^:/]+\\.)?cima4u1\\..*?\\/wp-content\\/|^[^:]+:\\/\\/([^:/]+\\.)?egydead\\..*?\\/wp-content\\/|^[^:]+:\\/\\/([^:/]+\\.)?lodynet\\..*?\\/wp-content\\/|^[^:]+:\\/\\/([^:/]+\\.)?shahidforu\\..*?\\/wp-content\\/","iegybest","^[^:]+:\\/\\/([^:/]+\\.)?egybest\\..*?\\/click\\.|^[^:]+:\\/\\/([^:/]+\\.)?egybest\\..*?\\/cv\\.","iesheeq.","^[^:]+:\\/\\/([^:/]+\\.)?esheeq\\.co\\/ex\\/","igamezon","^[^:]+:\\/\\/([^:/]+\\.)?gamezon\\.top\\/redirect\\.php","iiranpro","^[^:]+:\\/\\/([^:/]+\\.)?iranproud\\.com\\/ad","imovs4u.","^[^:]+:\\/\\/([^:/]+\\.)?movs4u\\..*?\\/d\\/","imyegy.","^[^:]+:\\/\\/([^:/]+\\.)?myegy\\..*?\\/ad\\/","ishahidm","^[^:]+:\\/\\/([^:/]+\\.)?shahidmosalsalat\\..*?\\/shahid\\.php","istardim","^[^:]+:\\/\\/([^:/]+\\.)?stardima\\.com\\/redirect\\.php\\?"]},"allow":{"hostnames":[],"regexes":[]}};

    self.preventPopupDetails = self.preventPopupDetails || [];
    self.preventPopupDetails.push(details);

})();
