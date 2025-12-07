/*******************************************************************************

    uBlock Origin Lite - a comprehensive, MV3-compliant content blocker
    Copyright (C) 2019-present Raymond Hill

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

// ruleset: ublock-badware

// Important!
// Isolate from global scope
(function uBOL_cssSpecificImports() {

/******************************************************************************/

const selectors = /* 36 */ [".code-block",".appua-reimage-top",".info.box",".download_button_info_texts",".js-download_button_additional_links",".primary_download",".sidebar_download_inner","div.attention-button-box-green","b:has(a[target^=\"reimage\"])",".ui-content > .win",".sidebar_download_inner > :not(.voting-box):not(.colorbg-grey)",".js-download_button_offer",".automatic_removal_list",".quick-download-button-placeholder",".quick-download-button-text","div[style^=\"border:2px\"]","#solution_v2_de","#gray_de",".automatic_removal_list_w > .ar_block_description","center > [class*=\"buttonPress-\"]","div[class^=\"code-block code-block-\"]",".getox","center > a[target=\"_blank\"][rel=\"nofollow noreferrer noopener\"]","div[style=\"float: none; margin:10px 0 10px 0; text-align:center;\"]","[id^=\"haxno-\"]","a[rel=\"nofollow noreferrer noopener\"][target=\"_blank\"]",".cente-1","[class*=\"buttonPress-\"]","center > .button-container:has(> #directDownload)","center > a","div[style=\"\"] > center > center","center#yangchen > iframe#external-frame[src=\"https://im136.mom/\"]:not([class])","html.w-mod-js:not(.wf-active) > body:not([class]):not([id]) > a[class=\"w-inline-block\"][href^=\"http\"]","html[lang=\"ja\"] > body > .main-container > #landing.auth-container","html[lang=\"ja\"] > body.flex.items-center.min-h-screen > div.w-full.max-w-md.mx-auto > form#login-form","html:not([class]) > body.gradient-bg.min-h-screen.flex.items-center.justify-center > div.glass-card.max-w-md.w-full.text-center > form#loginForm.flex.flex-col"];
const selectorLists = /* 30 */ "0;1,2;3,4,5,6,7;10,11,12,13,14,18,5,9;8;15,16,17;19,20;19;19,21;19,29;19,22;19,20,22;20;20,21;20,22;21;21,29;21,27;22;22,28;23;24;25;26;27;29;30;31;32;33,34,35";
const selectorListRefs = /* 195 */ "27,17,3,18,15,15,12,29,3,7,3,3,3,7,3,12,22,7,3,3,12,28,12,1,6,18,12,12,3,12,7,12,12,21,3,3,12,2,18,2,3,12,2,7,3,3,3,2,9,12,25,18,12,3,12,6,12,12,12,18,12,12,2,3,3,18,18,3,18,25,7,7,7,6,15,12,7,6,26,7,7,12,12,12,19,14,18,3,12,12,7,11,3,25,12,7,7,12,7,7,8,12,10,7,12,12,15,12,4,7,18,7,18,7,6,12,18,7,12,3,7,18,12,12,12,12,12,6,7,24,12,12,6,7,13,12,14,7,18,13,18,12,12,10,12,10,16,6,7,7,12,12,10,12,7,7,7,18,3,18,7,12,7,7,12,5,6,12,6,3,6,18,3,25,0,23,7,7,10,18,10,18,10,7,20,12,12,7,10,9,12,12,18,12,12";
const hostnames = /* 195 */ ["app","onhax.in","avirus.hu","gvnvh.net","haxmac.cc","haxpc.net","kuyhaa.cc","pages.dev","uirusu.jp","up4pc.com","virusi.bg","virusi.hr","bedynet.ru","combpc.pro","novirus.uk","pcfull.net","romsdl.net","shanpc.com","virusai.lt","viruset.no","vlsoft.net","webflow.io","abbaspc.net","appuals.com","assadpc.com","crack11.com","crackdj.com","crackit.org","dieviren.de","excrack.com","fultech.org","get4pcs.com","goharpc.com","haxnode.net","lesvirus.fr","losvirus.es","nkcrack.com","pcseguro.es","pesktop.com","sauguspc.lt","semvirus.pt","sjcrack.com","ugetfix.com","upcrack.org","viirused.ee","virukset.fi","wubingdu.cn","wyleczpc.pl","ayeshapc.com","crackcan.com","crackmak.com","crackpro.org","cyberspc.com","faravirus.ro","filepuma.org","keystool.com","lewdgames.to","macfiles.org","mahcrack.com","sadeempc.com","scracked.com","seeratpc.com","sichernpc.de","udenvirus.dk","utanvirus.se","wazusoft.com","zgamespc.com","2-spyware.com","4howcrack.com","9to5crack.com","bypassapp.com","chcracked.com","corecrack.com","crackbros.com","crackkits.com","cracksdat.com","cracksmad.com","cracksmat.com","cracksmid.com","cracksoon.com","cracksray.com","cracktopc.com","cracktube.net","hdlicense.org","kalicrack.com","letcracks.com","ryuugames.com","senzavirus.it","softzspot.com","spaxmedia.net","startcrack.co","topkeygen.com","usunwirusa.pl","yasir-252.net","zscracked.com","aryancrack.com","boxcracked.com","crackedmac.com","crackedmod.com","crackedpcs.com","crackpropc.com","crackshere.com","crackswall.com","fileserial.com","getintomac.net","getpcsofts.net","karancrack.com","licensedkey.co","majorgeeks.com","maliksofts.com","pccrackbox.com","pcwarezbox.com","pcwarezbox.net","procrackkey.co","rootcracks.org","topcracked.com","torrentmac.net","usecracked.com","warezcrack.net","zondervirus.nl","crackedhere.com","crackedsoft.org","crackintopc.com","crackpcsoft.net","crackreview.com","freecrack4u.com","getprocrack.net","greencracks.com","idmcrackeys.com","igetintopc.info","keygenstore.com","mycrackfree.com","patchcracks.com","pc4download.com","pcfullcrack.org","pcsoftsfull.org","piratesfile.com","proapkcrack.com","proappcrack.com","procrackerz.com","productkeys.org","serialsofts.com","softwarance.com","thecrackbox.com","activatorwin.com","autocracking.com","cracka2zsoft.com","crackproduct.com","finalcracked.com","freeprocrack.org","freeprosoftz.com","game-repack.site","licensekeyup.com","licenselink.info","organiccrack.com","osproductkey.com","softscracked.com","thepiratecity.co","virusler.info.tr","activationkey.org","activatorpros.com","activatorskey.com","crackdownload.org","crackedsoftpc.com","hitproversion.com","howtoremove.guide","installcracks.com","latestcracked.com","newproductkey.com","odstranitvirus.cz","pcfullversion.com","softserialkey.com","tanpavirus.web.id","trycracksetup.com","windowsreport.com","zuketcreation.net","crackedversion.com","downloadpirate.com","freeappstorepc.com","productkeyfree.org","profullversion.com","serialkeypatch.org","serialkeysfree.org","crackproductkey.com","cracksoftwaress.net","downloadcracker.com","licensekeysfree.com","licensekeysfree.org","torrentfilefree.com","trycracksoftware.com","dodi-repacks.download","freecrackdownload.com","productkeyforfree.com","activators4windows.com","fullversionforever.com"];
const hasEntities = false;

self.specificImports = self.specificImports || [];
self.specificImports.push({ selectors, selectorLists, selectorListRefs, hostnames, hasEntities });

/******************************************************************************/

})();

/******************************************************************************/
