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

    const details = {"id":"ara-0","block":{"hostnames":["aflam.io","zlps.xyz","aflam.info","eonads.com","arabiawin.com","elmassar-ar.com","protect-web.com","adv.videomega.tv","arabnewscom.ipage.com","forexxzx.blogspot.com.eg","add-friendso.blogspot.com"],"regexes":[".cash/?","[{\"re\":\"\\\\.cash\\\\/\\\\?clickid=\",\"f\":\"i\"}]","&publis","[{\"re\":\"\\\\.do\\\\?offer=.*?&publisher_id=\",\"f\":\"i\"}]","/adsph2","[{\"re\":\"\\\\/adsph2\\\\/\",\"f\":\"i\"}]","/afstra","[{\"re\":\"\\\\/afstrack\\\\..*?\\\\?affid=\",\"f\":\"i\"}]","clicks","[{\"re\":\"clicks.*\\\\/afs\",\"f\":\"i\"}]","/cpm/ad","[{\"re\":\"\\\\/cpm\\\\/ad\\\\.\",\"f\":\"i\"}]","/get/ia","[{\"re\":\"\\\\/get\\\\/iad\\\\/\",\"f\":\"i\"}]","?sconte","[{\"re\":\"\\\\/imp\\\\/.*?\\\\?scontext_b=\",\"f\":\"i\"}]","bahai-f","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?bahai-forum\\\\.com\\\\/go\\\\/\",\"f\":\"i\"}]","deals.s","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?deals\\\\.souq\\\\.com[^%.0-9a-z_-].*?&pubref=\",\"f\":\"i\"}]","dropvid","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?dropvideo\\\\.com\\\\/adorika\\\\/\",\"f\":\"i\"}]","/?utm_s","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?dubizzle\\\\.com[^%.0-9a-z_-].*?\\\\/\\\\?utm_source=\",\"f\":\"i\"}]","shein.c","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?shein\\\\.com\\\\/\\\\?aff_id=\",\"f\":\"i\"}]","actionz","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?actionz\\\\.net:\",\"f\":\"i\"}]","/photos","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?arabseed\\\\..*?\\\\/photos\\\\/shares\\\\/\",\"f\":\"i\"}]","/wp-con","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?cima4u1\\\\..*?\\\\/wp-content\\\\/\",\"f\":\"i\"},{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?egydead\\\\..*?\\\\/wp-content\\\\/\",\"f\":\"i\"},{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?lodynet\\\\..*?\\\\/wp-content\\\\/\",\"f\":\"i\"},{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?shahidforu\\\\..*?\\\\/wp-content\\\\/\",\"f\":\"i\"}]","egybest","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?egybest\\\\..*?\\\\/click\\\\.\",\"f\":\"i\"},{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?egybest\\\\..*?\\\\/cv\\\\.\",\"f\":\"i\"}]","esheeq.","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?esheeq\\\\.co\\\\/ex\\\\/\",\"f\":\"i\"}]","gamezon","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?gamezon\\\\.top\\\\/redirect\\\\.php\",\"f\":\"i\"}]","iranpro","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?iranproud\\\\.com\\\\/ad\",\"f\":\"i\"}]","movs4u.","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?movs4u\\\\..*?\\\\/d\\\\/\",\"f\":\"i\"}]","myegy.","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?myegy\\\\..*?\\\\/ad\\\\/\",\"f\":\"i\"}]","shahidm","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?shahidmosalsalat\\\\..*?\\\\/shahid\\\\.php\",\"f\":\"i\"}]","stardim","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?stardima\\\\.com\\\\/redirect\\\\.php\\\\?\",\"f\":\"i\"}]"]},"allow":{"hostnames":[],"regexes":[]}};

    self.preventPopupDetails = self.preventPopupDetails || [];
    self.preventPopupDetails.push(details);

})();
