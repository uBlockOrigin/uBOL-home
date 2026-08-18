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

    const details = {"id":"chn-0","block":{"hostnames":["e5yx.com","pv4b.com","2481e.com","88p2p.com","a1714.com","h6295.com","sa669.com","693836.com","hsvtdj.top","kuheju.com","lady177.com","xdh0808.com","22588888.com","baidu-jxf.co","aiwanma99.com","magnetdog.net","yunsennet.com","c.admaster.com.cn"],"regexes":["/tt/ttf","[{\"re\":\"\\\\/tt\\\\/ttfc\\\\.html\\\\?sc=\",\"f\":\"i\"}]","/ts/ttf","[{\"re\":\"\\\\/ts\\\\/ttfc\\\\.html\\\\?sc=\",\"f\":\"i\"}]",".com/st","[{\"re\":\"\\\\.com\\\\/stat-qq\\\\.html\\\\?.*?&click_url_final=\",\"f\":\"i\"}]","https:/","[{\"re\":\"^https:\\\\/\\\\/[a-z0-9]+\\\\.[a-z0-9]+\\\\.[a-z]{2,3}:\\\\d{1,6}\\\\/[a-z]{1,3}\\\\/\\\\d+\\\\?is_not=\",\"f\":\"i\"}]","/htmm/2","[{\"re\":\"\\\\/htmm\\\\/20.*?\\\\.php\",\"f\":\"i\"}]","/portal","[{\"re\":\"\\\\/portalwlanad\\\\/pages\\\\/\",\"f\":\"i\"}]",":701/gd","[{\"re\":\":701\\\\/gd_xueersi\\\\/\",\"f\":\"i\"}]","76fengy","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?76fengyun\\\\.com\\\\/vip\\\\.php\",\"f\":\"i\"}]","baidu.c","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?baidu\\\\.com\\\\/adrc\\\\.\",\"f\":\"i\"},{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?baidu\\\\.com\\\\/baidu\\\\.php\\\\?url=\",\"f\":\"i\"}]","ctfile.","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?ctfile\\\\.com\\\\/popjump\\\\.php\\\\?\",\"f\":\"i\"}]","duoyi.c","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?duoyi\\\\.com\\\\/welcome\\\\/\",\"f\":\"i\"}]","flash.c","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?flash\\\\.cn\\\\/success\\\\/\",\"f\":\"i\"}]","gd.189.","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?gd\\\\.189\\\\.cn.*?\\\\/push\\\\/\",\"f\":\"i\"}]","greenet","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?greenet\\\\.cn[^%.0-9a-z_-].*?_popu_\",\"f\":\"i\"}]","hinet.n","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?hinet\\\\.net\\\\/product\\\\/promotion\\\\/\",\"f\":\"i\"}]","huancai","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?huancaicp\\\\.com\\\\/\\\\?pid=\",\"f\":\"i\"}]","iqiyi.c","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?iqiyi\\\\.com\\\\/track\",\"f\":\"i\"}]","jjwxc.n","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?jjwxc\\\\.net\\\\/jjad.*?\\\\.html\",\"f\":\"i\"}]","sohu.co","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?sohu\\\\.com\\\\/i\\\\/\\\\?pvid=\",\"f\":\"i\"}]","yy18.in","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?yy18\\\\.info[^%.0-9a-z_-].*?thanks\",\"f\":\"i\"}]","dlkoo.c","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?dlkoo\\\\.cc\\\\/down\\\\/.*?\\\\.htm\",\"f\":\"i\"}]"]},"allow":{"hostnames":[],"regexes":["dlkoo.c","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?dlkoo\\\\.cc\\\\/down\\\\/.*?\\\\/.*?\\\\.htm\",\"f\":\"i\"}]"]}};

    self.preventPopupDetails = self.preventPopupDetails || [];
    self.preventPopupDetails.push(details);

})();
