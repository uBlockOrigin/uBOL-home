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

    const details = {"id":"ublock-filters","block":{"hostnames":["dwlv.xyz","bameb.com","bzzxq.com","declk.com","qty3e.pro","vjkyw.vip","1winpb.com","358g46.fun","droci.buzz","funuzai.ru","retdaz.fun","s0fast.net","sez88e.fun","padspms.com","zetadeo.com","affforce.com","batchzoo.com","bitupsss.com","blocksly.org","eagamerz.com","flyshare.cfd","gurusmac.org","holputy.shop","ripewing.com","sandhowl.com","shyvanas.top","adsession.com","doaipomer.com","genishury.pro","omegatoki.com","rapidsend.cfd","sharecube.pro","toptdspup.com","ublockpop.com","vrkonefd.buzz","35.238.205.163","buyvisblog.com","dlmonitize.com","msok-bayqa.icu","outebytech.com","qjvksieybn.vip","sa33491sxa.com","sgeiruehou.cfd","shareease.link","trapescook.com","bedsidetray.com","betzapdoson.com","drectsearch.com","generating.link","highmanapts.com","leewibaijoa.com","maddenwiped.com","pzcwk-sfend.top","track.bcvc.mobi","wbhwwnzptf.club","0x01n2ptpuz3.com","adblockultra.com","costly-storm.com","culinar9sync.com","datadropspot.pro","fbpbpmjjg-f.club","joyfullybarn.com","litaudrootsa.net","mywatchtones.com","qsiyfgazubcu.top","staletraffic.com","update-check.com","urxox-iqx.online","woofbeginner.com","x-ozwpiqlb.rocks","xdgeslibgbim.icu","zqvee2re50mr.com","dfuybl-bclxb.love","facesnotebook.com","fastfilehost.link","flusteredexam.com","macfilecloud.info","media.toxtren.com","polished-hook.com","wordsdelivery.com","xpobbwxzhe-l.site","amazingmeaning.com","boobausauhipsa.net","enigmaswhereas.com","eyewondermedia.com","highrevenuecpm.com","largeboyfriend.com","loadingfreerar.top","reminderasking.com","rochestertrend.com","enraptureminims.com","stookroocoudray.com","supertracker200.com","thankstoyou.website","wounofoarausooy.net","creeperplotgrove.com","efficientdescent.com","gajinifreedomain.fun","garnishdecoction.com","suburban-anxiety.com","timberfrittermud.com","ultimateaderaser.com","crmacd.livejasmin.com","restedpealimagine.com","suspicious-scheme.com","thankfuldirection.com","dogsprotectedfeed.info","fantasticcommunity.com","go.aff.7k-partners.com","grindsteeplesprung.com","h5xzcrigf541b0fzxj.fun","mowcoordinateegypt.com","rtouchingthewaterw.com","terribledeliberate.com","affluentarmyequator.com","loweststernhaunting.com","festivalcasketfrench.com","foundinggulfsaturate.com","planetwealthbuilders.net","cheaplyhumiliatedhunt.com","coleastrehabilitation.com","highperformanceformat.com","quarterbackchangeless.com","slavicprophetyontherm.com","curryfielddistribution.com","endlessenterprisebrawl.com","livedjeopardizeemotion.com","recessionspeaksanybody.com","antonellapouncedcrewels.com","buoydeparturediscontent.com","intrudeimpolitetortoise.com","flatrelentlessperspective.com","comfortablepossibilitycarlos.com","vulnerableimmigrateaboveaverage.com"],"regexes":["i.cfd/?a","\\.cfd\\/\\?ad.*?z1c2vypt","i.pro/?a","\\.pro\\/\\?ad.*?z1c2vypt","i.xyz/?a","\\.xyz\\/\\?ad.*?z1c2vypt","i/?param","^https:\\/\\/[a-z]{8}\\.(?:cfd|pro|xyz)\\/\\?params=aD[01][a-zA-Z0-9]{43}Z1c2VyPT[a-zA-Z0-9]{40}","ihttp","^https?:\\/\\/(?:ak\\.)?[a-z0-9]{5,15}\\.(?:com|net)\\/1\\/\\d{7}|^https?:\\/\\/(?:ak\\.)?[a-z0-9]{5,15}\\.(?:com|net)\\/4\\/\\d{7}|^https?:\\/\\/(?:ak\\.)?[a-z0-9]{5,15}\\.(?:com|net)\\/5\\/\\d{7}"," .com/b","^https?:\\/\\/[-a-z]{6,}\\.com\\/b[\\/A-Z_a-z]3[.A-Za-z]V[.\\/A-Z_a-z]0[.\\/A-Z_a-z]P[.A-Za-z]3[-\\/0-9A-Z_a-z]{59}$","ifree.we","^[^:]+:\\/\\/([^:/]+\\.)?free\\.webcompanion\\.com\\/.*?\\/.*?partner=.*?&campaign=|^[^:]+:\\/\\/([^:/]+\\.)?free\\.webcompanion\\.com\\/.*?\\/.*?campaign=.*?&partner=","ibdu.bit","^[^:]+:\\/\\/([^:/]+\\.)?bdu\\.bitdriverupdater\\.com\\/.*?&utm_source=","istartga","^[^:]+:\\/\\/([^:/]+\\.)?startgaming\\.net\\/.*?&utm_source","iaffil=t","^[^:]+:\\/\\/([^:/]+\\.)?startgaming\\.net\\/.*?affil=torrentgalaxy","idooods.","^[^:]+:\\/\\/([^:/]+\\.)?dooods\\.pro\\/download_popunder","ijaya9.a","^[^:]+:\\/\\/([^:/]+\\.)?jaya9\\.app\\/\\?af=","ijaya9.b","^[^:]+:\\/\\/([^:/]+\\.)?jaya9\\.best\\/\\?af="]},"allow":{"hostnames":[],"regexes":["iauth.co","^[^:]+:\\/\\/([^:/]+\\.)?awstrack\\.me\\/.*?auth\\.coindesk\\.com","icmd=ac-","^[^:]+:\\/\\/([^:/]+\\.)?awstrack\\.me\\/.*?cmd=ac-inactive-restore","iexoclic","^[^:]+:\\/\\/([^:/]+\\.)?exoclick\\.com\\/privacy-and-cookies-policy\\/","idisqus.","^[^:]+:\\/\\/([^:/]+\\.)?disqus\\.com\\/next\\/login\\/","isafecur","^[^:]+:\\/\\/([^:/]+\\.)?safecurr\\.g2afse\\.com\\/click\\?pid=.*?&offer_id","iuiz.io/","^[^:]+:\\/\\/([^:/]+\\.)?uiz\\.io\\/links\\/popad","igoogle.","^[^:]+:\\/\\/([^:/]+\\.)?google\\..*?\\/search","iitorren","^[^:]+:\\/\\/([^:/]+\\.)?itorrents\\.org\\/torrent\\/","itorrage","^[^:]+:\\/\\/([^:/]+\\.)?torrage\\.info\\/download","iurl=htt","^[^:]+:\\/\\/([^:/]+\\.)?track\\.adtraction\\.com\\/.*?[^%.0-9a-z_-]url=https:\\/\\/www\\.gog\\.com\\/|^[^:]+:\\/\\/([^:/]+\\.)?track\\.adtraction\\.com\\/.*?[^%.0-9a-z_-]url=http:\\/\\/www\\.gog\\.com\\/"]}};

    self.preventPopupDetails = self.preventPopupDetails || [];
    self.preventPopupDetails.push(details);

})();
