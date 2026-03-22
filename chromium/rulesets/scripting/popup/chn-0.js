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

    const details = {"id":"chn-0","block":{"hostnames":["e5yx.com","pv4b.com","2481e.com","88p2p.com","a1714.com","h6295.com","sa669.com","693836.com","hsvtdj.top","kuheju.com","lady177.com","xdh0808.com","22588888.com","baidu-jxf.co","aiwanma99.com","magnetdog.net","yunsennet.com","c.admaster.com.cn"],"regexes":["i/tt/ttf","\\/tt\\/ttfc\\.html\\?sc=","i/ts/ttf","\\/ts\\/ttfc\\.html\\?sc=","i/htmm/2","\\/htmm\\/20.*?\\.php","i/portal","\\/portalwlanad\\/pages\\/","i:701/gd",":701\\/gd_xueersi\\/","i76fengy","^[^:]+:\\/\\/([^:/]+\\.)?76fengyun\\.com\\/vip\\.php","ibaidu.c","^[^:]+:\\/\\/([^:/]+\\.)?baidu\\.com\\/adrc\\.|^[^:]+:\\/\\/([^:/]+\\.)?baidu\\.com\\/baidu\\.php\\?url=","ictfile.","^[^:]+:\\/\\/([^:/]+\\.)?ctfile\\.com\\/popjump\\.php\\?","iduoyi.c","^[^:]+:\\/\\/([^:/]+\\.)?duoyi\\.com\\/welcome\\/","iflash.c","^[^:]+:\\/\\/([^:/]+\\.)?flash\\.cn\\/success\\/","igd.189.","^[^:]+:\\/\\/([^:/]+\\.)?gd\\.189\\.cn.*?\\/push\\/","igreenet","^[^:]+:\\/\\/([^:/]+\\.)?greenet\\.cn[^%.0-9a-z_-].*?_popu_","ihinet.n","^[^:]+:\\/\\/([^:/]+\\.)?hinet\\.net\\/product\\/promotion\\/","ihuancai","^[^:]+:\\/\\/([^:/]+\\.)?huancaicp\\.com\\/\\?pid=","iiqiyi.c","^[^:]+:\\/\\/([^:/]+\\.)?iqiyi\\.com\\/track","ijjwxc.n","^[^:]+:\\/\\/([^:/]+\\.)?jjwxc\\.net\\/jjad.*?\\.html","isohu.co","^[^:]+:\\/\\/([^:/]+\\.)?sohu\\.com\\/i\\/\\?pvid=","iyy18.in","^[^:]+:\\/\\/([^:/]+\\.)?yy18\\.info[^%.0-9a-z_-].*?thanks","idlkoo.c","^[^:]+:\\/\\/([^:/]+\\.)?dlkoo\\.cc\\/down\\/.*?\\.htm"]},"allow":{"hostnames":[],"regexes":["idlkoo.c","^[^:]+:\\/\\/([^:/]+\\.)?dlkoo\\.cc\\/down\\/.*?\\/.*?\\.htm"]}};

    self.preventPopupDetails = self.preventPopupDetails || [];
    self.preventPopupDetails.push(details);

})();
