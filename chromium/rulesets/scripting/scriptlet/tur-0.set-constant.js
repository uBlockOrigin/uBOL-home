/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
    Copyright (C) 2014-present Raymond Hill

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

/* jshint esversion:11 */
/* global cloneInto */

'use strict';

// ruleset: tur-0

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_setConstant = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["adblock.check","noopFunc"],["eyeOfErstream.detectedBloke","falseFunc"],["ads","falseFunc"],["xv_ad_block","0"],["tie.ad_blocker_disallow_images_placeholder","undefined"],["eazy_ad_unblocker_msg_var",""],["adbEnableForPage","false"],["detector_active","true"],["adblock_active","false"],["adBlockRunning","false"],["adb","false"],["adBlockEnabled","false"],["kan_vars.adblock","undefined"],["hasAdblock","false"],["AdblockDetector","undefined"],["adblockCheckUrl",""],["canRunAds","true"],["window.google_jobrunner","true"],["jQuery.adblock","false"],["$tieE3","true"],["koddostu_com_adblock_yok","null"],["google_jobrunner","noopFunc"],["adsbygoogle.loaded","true"],["adblock","false"],["puShown","true"],["isShow","true"],["AdmostClient","noopFunc"],["config.adv","{}"],["S_Popup","2"],["loadPlayerAds","trueFunc"],["reklamsayisi","0"],["player.vroll","noopFunc"],["config.adv.enabled","0"],["volumeClearInterval","0"],["rek_kontrol","noopFunc"],["clicked","true"],["adSearchTitle","undefined"],["Object.prototype.ads","noopFunc"],["HBiddings.vastUrl",""],["wpsaData","undefined"],["AdvPlayer","undefined"],["_popByHours","undefined"],["_pop","undefined"],["initOpen","undefined"],["initNewAd","noopFunc"],["rg","noopFunc"],["Object.prototype.ads_enable","false"],["td_ad_background_click_link",""],["start","1"],["popup","noopFunc"]];

const hostnamesMap = new Map([["iyibeslenme.net",0],["teknop.net",0],["kirtkirtla.com",0],["buneymis.net",0],["ozgunbilgi.com",0],["exxen.com",1],["animeizletr.com",2],["exceldepo.com",3],["tgyama.com",4],["uzaymanga.com",5],["e-kitapstore.com",6],["wheel-size.com.tr",7],["karnaval.com",8],["mangaship.net",9],["mangaship.com",9],["miuitr.info",10],["puhutv.com",11],["coinotag.com",12],["cnnturk.com",[13,14]],["kanald.com.tr",[13,15]],["iddaaorantahmin.com",16],["forum.auraroleplay.com",17],["oyungibi.com",18],["veterinerhekimleri.com",18],["unisinav.com",19],["turkdenizcileri.com",20],["bilgalem.blogspot.com",20],["okulsoru.com",20],["tekniknot.com",21],["messletters.com",22],["klavyeanaliz.org",23],["siyahfilmizle.pro",24],["tafdi4.com",24],["tafdi5.com",24],["elzemfilm.org",24],["fullhdfilmizlesene4.org",24],["tafdi3.com",24],["anizle.com",24],["hdfilmseyircisi.org",24],["sinemol.vip",24],["dizirun2.com",24],["kozfilm.com",24],["siyahfilmizle.info",24],["hdfilmhit.org",24],["hdfilmizle.in",24],["dizipall.org",24],["diziyou.co",24],["filmizlew.net",24],["tafdi2.com",24],["fullfilmizle.net",24],["dizimag.eu",24],["erotikfilmler.live",24],["bumfilmizle1.com",24],["yabancidizilertv.com",24],["1080hdfilmizle.com",24],["vipfilmlerizle.me",24],["erotikizle123.com",24],["dipfilmizle.net",24],["erotikizlefilm.com",24],["turkerotikizle.com",24],["yabancidizibax.com",24],["sinemangoo.org",24],["sexfilmleriizle.com",24],["fullhdfilm.pro",[24,30]],["pembetv18.com",24],["geziforumu.com",24],["ddizipal.com",24],["efendim.xyz",24],["dizipaltv.net",24],["dizispeed.net",24],["filmjr1.com",24],["fluffcore.com",24],["filmpaf.com",24],["hdfilmfullizle.com",24],["hdfilmcehennemizle.com",24],["netfullfilmizle3.com",24],["filmmodu.info",24],["izlekolik.com",24],["dizipaltv.com",24],["dizifilm.pro",24],["dizivid.net",24],["arrowizle.com",24],["hdfilmifullizle.com",24],["erotik123.com",24],["jokerfilmizle.com",24],["720pfilmiizle.net",24],["seehdfilm.com",24],["dizirun1.com",24],["filmfiz.net",24],["filmcus.com",24],["hazirfilm.com",24],["filmizlew.org",24],["zoof1.xyz",24],["sinemakolik.net",24],["sinefilmizlesen.com",24],["zarize.com",24],["pornobuna.com",24],["zarizeporno.com",24],["burdenfly.com",24],["diziking.vip",24],["filmdelisi.org",24],["1080pfilmizle.me",24],["zzerotik.com",24],["filmgo.org",24],["filmiifullizlee.net",24],["sinemafilmizle.net",24],["fullhdfilmiizle.org",24],["hdfilmw.org",24],["buzfilmizle1.com",24],["filmkuzusu1.com",24],["hdfilmcix.net",24],["sinemadelisi.com",24],["yetiskinfilmizle.net",24],["hdsexfilmizle.com",24],["erotik-film.org",24],["erotikfilmtube.com",24],["erotik-filmler.net",24],["erotikfilms.net",24],["erotizmfilmleri.net",24],["filmbabasi.com",24],["pornoanne.com",24],["dizikorea.org",24],["diziyo.cx",24],["koredizileri.tv",24],["diziboxx.com",24],["turkaliz.com",24],["jetdiziizle.net",24],["vkfilmizle.net",24],["dizimom.live",24],["yerlidizi.pw",24],["fullhdfilmizleyin.com",24],["filmizlet.net",24],["baglanfilme.com",24],["filmgooo.com",24],["pornorips.com",24],["bumfilmizle.com",24],["bestdizi.com",24],["shirl.club",24],["evrenselfilmlerim.org",24],["turkcealtyazilipornom.com",24],["sinema.cc",24],["hdfilmizletv.net",24],["filmmom.pro",[24,25]],["shortz.club",24],["sinemaizle.co",24],["filmlane.com",24],["netfilmtvizle.com",24],["hdfilmcehennem.live",24],["xbox360torrent.com",24],["efullizle.com",24],["morfilmizle.com",24],["asyafanatiklerim.com",24],["guncelhdfilm.com",24],["dizilost.com",24],["fileru.net",24],["dizitube.net",24],["fullhdfilmdeposu.com",24],["volsex.com",24],["torba.info",24],["erotiksexizle.com",24],["divx720pfilmizle.org",24],["canlitribun40.com",24],["canlitribun41.com",24],["canlitribun42.com",24],["canlitribun43.com",24],["canlitribun44.com",24],["canlitribun45.com",24],["canlitribun46.com",24],["canlitribun47.com",24],["canlitribun48.com",24],["canlitribun49.com",24],["canlitribun50.com",24],["canlitribun51.com",24],["canlitribun52.com",24],["canlitribun53.com",24],["canlitribun54.com",24],["canlitribun55.com",24],["canlitribun56.com",24],["canlitribun57.com",24],["canlitribun58.com",24],["canlitribun59.com",24],["canlitribun60.com",24],["canlitribun61.com",24],["canlitribun62.com",24],["canlitribun63.com",24],["canlitribun64.com",24],["canlitribun65.com",24],["canlitribun66.com",24],["canlitribun67.com",24],["canlitribun68.com",24],["canlitribun69.com",24],["canlitribun70.com",24],["dizipal580.com",24],["dizipal581.com",24],["dizipal582.com",24],["dizipal583.com",24],["dizipal584.com",24],["dizipal585.com",24],["dizipal586.com",24],["dizipal587.com",24],["dizipal588.com",24],["dizipal589.com",24],["dizipal590.com",24],["dizipal591.com",24],["dizipal592.com",24],["dizipal593.com",24],["dizipal594.com",24],["dizipal595.com",24],["dizipal596.com",24],["dizipal597.com",24],["dizipal598.com",24],["dizipal599.com",24],["dizipal600.com",24],["dizipal607.com",24],["dizipal608.com",24],["dizipal609.com",24],["dizipal610.com",24],["dizipal611.com",24],["dizipal612.com",24],["dizipal613.com",24],["dizipal614.com",24],["dizipal615.com",24],["dizipal616.com",24],["dizipal617.com",24],["dizipal618.com",24],["dizipal619.com",24],["dizipal620.com",24],["dizipal621.com",24],["dizipal622.com",24],["dizipal623.com",24],["dizipal624.com",24],["dizipal625.com",24],["dizipal626.com",24],["dizipal627.com",24],["dizipal628.com",24],["dizipal629.com",24],["dizipal630.com",24],["dizipal631.com",24],["dizipal632.com",24],["dizipal633.com",24],["dizipal634.com",24],["dizipal635.com",24],["dizipal636.com",24],["dizipal637.com",24],["dizipal638.com",24],["dizipal639.com",24],["dizipal640.com",24],["dizipal641.com",24],["dizipal642.com",24],["dizipal643.com",24],["dizipal644.com",24],["dizipal645.com",24],["dizipal646.com",24],["dizipal647.com",24],["dizipal648.com",24],["dizipal649.com",24],["dizipal650.com",24],["dizipal651.com",24],["dizipal652.com",24],["dizipal653.com",24],["dizipal654.com",24],["dizipal655.com",24],["dizipal656.com",24],["dizipal657.com",24],["dizipal658.com",24],["dizipal659.com",24],["dizipal660.com",24],["dizipal661.com",24],["dizipal662.com",24],["dizipal663.com",24],["dizipal664.com",24],["dizipal665.com",24],["dizipal666.com",24],["dizipal667.com",24],["dizipal668.com",24],["dizipal669.com",24],["dizipal670.com",24],["dizipal671.com",24],["dizipal672.com",24],["dizipal673.com",24],["dizipal674.com",24],["dizipal675.com",24],["dizipal676.com",24],["dizipal677.com",24],["dizipal678.com",24],["dizipal679.com",24],["dizipal680.com",24],["dizipal681.com",24],["dizipal682.com",24],["dizipal683.com",24],["dizipal684.com",24],["dizipal685.com",24],["dizipal686.com",24],["dizipal687.com",24],["dizipal688.com",24],["dizipal689.com",24],["dizipal690.com",24],["dizipal691.com",24],["dizipal692.com",24],["dizipal693.com",24],["dizipal694.com",24],["dizipal695.com",24],["dizipal696.com",24],["dizipal697.com",24],["dizipal698.com",24],["dizipal699.com",24],["dizipal700.com",24],["dizimom1.com",25],["trgoalshosting.cf",[25,32]],["tekfullfilmizle5.com",25],["yovmiyelazim.com",25],["tekfullfilmizle3.com",25],["izleorg2.org",25],["trgoals351.xyz",25],["trgoals185.xyz",25],["trgoals186.xyz",25],["trgoals187.xyz",25],["trgoals188.xyz",25],["trgoals189.xyz",25],["trgoals190.xyz",25],["trgoals191.xyz",25],["trgoals192.xyz",25],["trgoals193.xyz",25],["trgoals194.xyz",25],["trgoals195.xyz",25],["trgoals196.xyz",25],["trgoals197.xyz",25],["trgoals198.xyz",25],["trgoals199.xyz",25],["trgoals200.xyz",25],["trgoals201.xyz",25],["trgoals202.xyz",25],["trgoals203.xyz",25],["trgoals204.xyz",25],["trgoals205.xyz",25],["trgoals206.xyz",25],["trgoals207.xyz",25],["trgoals208.xyz",25],["trgoals209.xyz",25],["trgoals210.xyz",25],["trgoals211.xyz",25],["trgoals212.xyz",25],["trgoals213.xyz",25],["trgoals214.xyz",25],["trgoals215.xyz",25],["trgoals216.xyz",25],["trgoals217.xyz",25],["trgoals218.xyz",25],["trgoals219.xyz",25],["trgoals220.xyz",25],["trgoals221.xyz",25],["trgoals222.xyz",25],["trgoals223.xyz",25],["trgoals224.xyz",25],["trgoals225.xyz",25],["trgoals226.xyz",25],["trgoals227.xyz",25],["trgoals228.xyz",25],["trgoals229.xyz",25],["trgoals230.xyz",25],["trgoals231.xyz",25],["trgoals232.xyz",25],["trgoals233.xyz",25],["trgoals234.xyz",25],["trgoals235.xyz",25],["trgoals236.xyz",25],["trgoals237.xyz",25],["trgoals238.xyz",25],["trgoals239.xyz",25],["trgoals240.xyz",25],["trgoals241.xyz",25],["trgoals242.xyz",25],["trgoals243.xyz",25],["trgoals244.xyz",25],["trgoals245.xyz",25],["trgoals246.xyz",25],["trgoals247.xyz",25],["trgoals248.xyz",25],["trgoals249.xyz",25],["trgoals250.xyz",25],["dizipal73.cloud",25],["dizipal70.cloud",25],["dizipal71.cloud",25],["dizipal72.cloud",25],["dizipal74.cloud",25],["dizipal75.cloud",25],["dizipal76.cloud",25],["dizipal77.cloud",25],["dizipal78.cloud",25],["dizipal79.cloud",25],["dizipal80.cloud",25],["dizipal81.cloud",25],["dizipal82.cloud",25],["dizipal83.cloud",25],["dizipal84.cloud",25],["dizipal85.cloud",25],["dizipal86.cloud",25],["dizipal87.cloud",25],["dizipal88.cloud",25],["dizipal89.cloud",25],["dizipal90.cloud",25],["dizipal91.cloud",25],["dizipal92.cloud",25],["dizipal93.cloud",25],["dizipal94.cloud",25],["dizipal95.cloud",25],["dizipal96.cloud",25],["dizipal97.cloud",25],["dizipal98.cloud",25],["dizipal99.cloud",25],["dizipal100.cloud",25],["dizipal101.cloud",25],["dizipal102.cloud",25],["dizipal103.cloud",25],["dizipal104.cloud",25],["dizipal105.cloud",25],["dizipal106.cloud",25],["dizipal107.cloud",25],["dizipal108.cloud",25],["dizipal109.cloud",25],["dizipal110.cloud",25],["dizipal111.cloud",25],["dizipal112.cloud",25],["dizipal113.cloud",25],["dizipal114.cloud",25],["dizipal115.cloud",25],["dizipal116.cloud",25],["dizipal117.cloud",25],["dizipal118.cloud",25],["dizipal119.cloud",25],["dizipal120.cloud",25],["dizipal121.cloud",25],["dizipal122.cloud",25],["dizipal123.cloud",25],["dizipal124.cloud",25],["dizipal125.cloud",25],["dizipal126.cloud",25],["dizipal127.cloud",25],["dizipal128.cloud",25],["dizipal129.cloud",25],["dizipal130.cloud",25],["dizipal131.cloud",25],["dizipal132.cloud",25],["dizipal133.cloud",25],["dizipal134.cloud",25],["dizipal135.cloud",25],["dizipal136.cloud",25],["dizipal137.cloud",25],["dizipal138.cloud",25],["dizipal139.cloud",25],["dizipal140.cloud",25],["dizipal141.cloud",25],["dizipal142.cloud",25],["dizipal143.cloud",25],["dizipal144.cloud",25],["dizipal145.cloud",25],["dizipal146.cloud",25],["dizipal147.cloud",25],["dizipal148.cloud",25],["dizipal149.cloud",25],["dizipal150.cloud",25],["dizipal151.cloud",25],["dizipal152.cloud",25],["dizipal153.cloud",25],["dizipal154.cloud",25],["dizipal155.cloud",25],["dizipal156.cloud",25],["dizipal157.cloud",25],["dizipal158.cloud",25],["dizipal159.cloud",25],["dizipal160.cloud",25],["dizipal161.cloud",25],["dizipal162.cloud",25],["dizipal163.cloud",25],["dizipal164.cloud",25],["dizipal165.cloud",25],["dizipal166.cloud",25],["dizipal167.cloud",25],["dizipal168.cloud",25],["dizipal169.cloud",25],["dizipal170.cloud",25],["dizipal171.cloud",25],["dizipal172.cloud",25],["dizipal173.cloud",25],["dizipal174.cloud",25],["dizipal175.cloud",25],["dizipal176.cloud",25],["dizipal177.cloud",25],["dizipal178.cloud",25],["dizipal179.cloud",25],["dizipal180.cloud",25],["dizipal181.cloud",25],["dizipal182.cloud",25],["dizipal183.cloud",25],["dizipal184.cloud",25],["dizipal185.cloud",25],["dizipal186.cloud",25],["dizipal187.cloud",25],["dizipal188.cloud",25],["dizipal189.cloud",25],["dizipal190.cloud",25],["dizipal191.cloud",25],["dizipal192.cloud",25],["dizipal193.cloud",25],["dizipal194.cloud",25],["dizipal195.cloud",25],["dizipal196.cloud",25],["dizipal197.cloud",25],["dizipal198.cloud",25],["dizipal199.cloud",25],["dizipal200.cloud",25],["arsiv.mackolik.com",26],["netsportv158.com",27],["nefisyemektarifleri.com",29],["izlesene.com",29],["play.diziyou.co",31],["tranimeci.com",33],["filmmakinesi1.com",34],["turkanime.co",35],["forum.donanimhaber.com",36],["filmmodu9.com",37],["filmmodu10.com",37],["filmmodu11.com",37],["filmmodu12.com",37],["filmmodu13.com",37],["filmmodu14.com",37],["filmmodu15.com",37],["filmmodu16.com",37],["filmmodu17.com",37],["filmmodu18.com",37],["filmmodu19.com",37],["filmmodu20.com",37],["atv.com.tr",38],["dizipal12.site",39],["dizipal13.site",39],["dizipal14.site",39],["dizipal15.site",39],["dizipal16.site",39],["dizipal17.site",39],["dizipal18.site",39],["dizipal19.site",39],["dizipal20.site",39],["dizipal21.site",39],["dizipal22.site",39],["dizipal23.site",39],["dizipal24.site",39],["dizipal25.site",39],["dizipal26.site",39],["dizipal27.site",39],["dizipal28.site",39],["dizipal29.site",39],["dizipal30.site",39],["turkturk.org",40],["turkturk.net",40],["narcovip.com",[41,42]],["contentx.me",43],["superfilmgeldi.com",44],["edebiyatdefteri.com",45],["belgeselizlesene.com",46],["technopat.net",47],["aydindenge.com.tr",48],["diziall.com",49]]);

const entitiesMap = new Map([["dizicaps",24],["filmizletv1",24],["fullhdfilmizle5",[24,30]],["sinepal",24],["hdfilmcehennemi",24],["pifilmizle",24],["elzemfilmizle",24],["dizipal",24],["filmizletv",24],["tekparthdfilmizle",24],["dizisup",24],["dafflix",24],["yabancidizitv",24],["hddiziport",24],["dizimov",24],["torrentarsivi",24],["setfilmizle",24],["fullhdfilmmodu",24],["filmyani",24],["tranimeizle",24],["altyazilifilm",24],["webteizle",25],["jetfilmizle",28],["dizilla",39]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function setConstant(
    ...args
) {
    setConstantCore(false, ...args);
}

function setConstantCore(
    trusted = false,
    arg1 = '',
    arg2 = '',
    arg3 = ''
) {
    const details = typeof arg1 !== 'object'
        ? { prop: arg1, value: arg2 }
        : arg1;
    if ( arg3 !== '' ) {
        if ( /^\d$/.test(arg3) ) {
            details.options = [ arg3 ];
        } else {
            details.options = Array.from(arguments).slice(3);
        }
    }
    const { prop: chain = '', value: cValue = '' } = details;
    if ( typeof chain !== 'string' ) { return; }
    if ( chain === '' ) { return; }
    const options = details.options || [];
    const safe = safeSelf();
    function setConstant(chain, cValue) {
        const trappedProp = (( ) => {
            const pos = chain.lastIndexOf('.');
            if ( pos === -1 ) { return chain; }
            return chain.slice(pos+1);
        })();
        if ( trappedProp === '' ) { return; }
        const thisScript = document.currentScript;
        const cloakFunc = fn => {
            safe.Object_defineProperty(fn, 'name', { value: trappedProp });
            const proxy = new Proxy(fn, {
                defineProperty(target, prop) {
                    if ( prop !== 'toString' ) {
                        return Reflect.defineProperty(...arguments);
                    }
                    return true;
                },
                deleteProperty(target, prop) {
                    if ( prop !== 'toString' ) {
                        return Reflect.deleteProperty(...arguments);
                    }
                    return true;
                },
                get(target, prop) {
                    if ( prop === 'toString' ) {
                        return function() {
                            return `function ${trappedProp}() { [native code] }`;
                        }.bind(null);
                    }
                    return Reflect.get(...arguments);
                },
            });
            return proxy;
        };
        if ( cValue === 'undefined' ) {
            cValue = undefined;
        } else if ( cValue === 'false' ) {
            cValue = false;
        } else if ( cValue === 'true' ) {
            cValue = true;
        } else if ( cValue === 'null' ) {
            cValue = null;
        } else if ( cValue === "''" || cValue === '' ) {
            cValue = '';
        } else if ( cValue === '[]' ) {
            cValue = [];
        } else if ( cValue === '{}' ) {
            cValue = {};
        } else if ( cValue === 'noopFunc' ) {
            cValue = cloakFunc(function(){});
        } else if ( cValue === 'trueFunc' ) {
            cValue = cloakFunc(function(){ return true; });
        } else if ( cValue === 'falseFunc' ) {
            cValue = cloakFunc(function(){ return false; });
        } else if ( /^-?\d+$/.test(cValue) ) {
            cValue = parseInt(cValue);
            if ( isNaN(cValue) ) { return; }
            if ( Math.abs(cValue) > 0x7FFF ) { return; }
        } else if ( trusted ) {
            if ( cValue.startsWith('{') && cValue.endsWith('}') ) {
                try { cValue = safe.jsonParse(cValue).value; } catch(ex) { return; }
            }
        } else {
            return;
        }
        if ( options.includes('asFunction') ) {
            cValue = ( ) => cValue;
        } else if ( options.includes('asCallback') ) {
            cValue = ( ) => (( ) => cValue);
        } else if ( options.includes('asResolved') ) {
            cValue = Promise.resolve(cValue);
        } else if ( options.includes('asRejected') ) {
            cValue = Promise.reject(cValue);
        }
        let aborted = false;
        const mustAbort = function(v) {
            if ( trusted ) { return false; }
            if ( aborted ) { return true; }
            aborted =
                (v !== undefined && v !== null) &&
                (cValue !== undefined && cValue !== null) &&
                (typeof v !== typeof cValue);
            return aborted;
        };
        // https://github.com/uBlockOrigin/uBlock-issues/issues/156
        //   Support multiple trappers for the same property.
        const trapProp = function(owner, prop, configurable, handler) {
            if ( handler.init(configurable ? owner[prop] : cValue) === false ) { return; }
            const odesc = Object.getOwnPropertyDescriptor(owner, prop);
            let prevGetter, prevSetter;
            if ( odesc instanceof Object ) {
                owner[prop] = cValue;
                if ( odesc.get instanceof Function ) {
                    prevGetter = odesc.get;
                }
                if ( odesc.set instanceof Function ) {
                    prevSetter = odesc.set;
                }
            }
            try {
                safe.Object_defineProperty(owner, prop, {
                    configurable,
                    get() {
                        if ( prevGetter !== undefined ) {
                            prevGetter();
                        }
                        return handler.getter(); // cValue
                    },
                    set(a) {
                        if ( prevSetter !== undefined ) {
                            prevSetter(a);
                        }
                        handler.setter(a);
                    }
                });
            } catch(ex) {
            }
        };
        const trapChain = function(owner, chain) {
            const pos = chain.indexOf('.');
            if ( pos === -1 ) {
                trapProp(owner, chain, false, {
                    v: undefined,
                    init: function(v) {
                        if ( mustAbort(v) ) { return false; }
                        this.v = v;
                        return true;
                    },
                    getter: function() {
                        return document.currentScript === thisScript
                            ? this.v
                            : cValue;
                    },
                    setter: function(a) {
                        if ( mustAbort(a) === false ) { return; }
                        cValue = a;
                    }
                });
                return;
            }
            const prop = chain.slice(0, pos);
            const v = owner[prop];
            chain = chain.slice(pos + 1);
            if ( v instanceof Object || typeof v === 'object' && v !== null ) {
                trapChain(v, chain);
                return;
            }
            trapProp(owner, prop, true, {
                v: undefined,
                init: function(v) {
                    this.v = v;
                    return true;
                },
                getter: function() {
                    return this.v;
                },
                setter: function(a) {
                    this.v = a;
                    if ( a instanceof Object ) {
                        trapChain(a, chain);
                    }
                }
            });
        };
        trapChain(window, chain);
    }
    runAt(( ) => {
        setConstant(chain, cValue);
    }, options);
}

function runAt(fn, when) {
    const intFromReadyState = state => {
        const targets = {
            'loading': 1,
            'interactive': 2, 'end': 2, '2': 2,
            'complete': 3, 'idle': 3, '3': 3,
        };
        const tokens = Array.isArray(state) ? state : [ state ];
        for ( const token of tokens ) {
            const prop = `${token}`;
            if ( targets.hasOwnProperty(prop) === false ) { continue; }
            return targets[prop];
        }
        return 0;
    };
    const runAt = intFromReadyState(when);
    if ( intFromReadyState(document.readyState) >= runAt ) {
        fn(); return;
    }
    const onStateChange = ( ) => {
        if ( intFromReadyState(document.readyState) < runAt ) { return; }
        fn();
        safe.removeEventListener.apply(document, args);
    };
    const safe = safeSelf();
    const args = [ 'readystatechange', onStateChange, { capture: true } ];
    safe.addEventListener.apply(document, args);
}

function safeSelf() {
    if ( scriptletGlobals.has('safeSelf') ) {
        return scriptletGlobals.get('safeSelf');
    }
    const safe = {
        'Error': self.Error,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'fetch': self.fetch,
        'jsonParse': self.JSON.parse.bind(self.JSON),
        'jsonStringify': self.JSON.stringify.bind(self.JSON),
        'log': console.log.bind(console),
        uboLog(...args) {
            if ( args.length === 0 ) { return; }
            if ( `${args[0]}` === '' ) { return; }
            this.log('[uBO]', ...args);
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true };
            }
            const expect = (options.canNegate === true && pattern.startsWith('!') === false);
            if ( expect === false ) {
                pattern = pattern.slice(1);
            }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match !== null ) {
                return {
                    pattern,
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            return {
                pattern,
                re: new this.RegExp(pattern.replace(
                    /[.*+?^${}()|[\]\\]/g, '\\$&'),
                    options.flags
                ),
                expect,
            };
        },
        testPattern(details, haystack) {
            if ( details.matchAll ) { return true; }
            return this.RegExp_test.call(details.re, haystack) === details.expect;
        },
        patternToRegex(pattern, flags = undefined) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
            }
            try {
                return new RegExp(match[1], match[2] || flags);
            }
            catch(ex) {
            }
            return /^/;
        },
        getExtraArgs(args, offset = 0) {
            const entries = args.slice(offset).reduce((out, v, i, a) => {
                if ( (i & 1) === 0 ) {
                    const rawValue = a[i+1];
                    const value = /^\d+$/.test(rawValue)
                        ? parseInt(rawValue, 10)
                        : rawValue;
                    out.push([ a[i], value ]);
                }
                return out;
            }, []);
            return Object.fromEntries(entries);
        },
    };
    scriptletGlobals.set('safeSelf', safe);
    return safe;
}

/******************************************************************************/

const hnParts = [];
try { hnParts.push(...document.location.hostname.split('.')); }
catch(ex) { }
const hnpartslen = hnParts.length;
if ( hnpartslen === 0 ) { return; }

const todoIndices = new Set();
const tonotdoIndices = [];

// Exceptions
if ( exceptionsMap.size !== 0 ) {
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        const excepted = exceptionsMap.get(hn);
        if ( excepted ) { tonotdoIndices.push(...excepted); }
    }
    exceptionsMap.clear();
}

// Hostname-based
if ( hostnamesMap.size !== 0 ) {
    const collectArgIndices = hn => {
        let argsIndices = hostnamesMap.get(hn);
        if ( argsIndices === undefined ) { return; }
        if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
        for ( const argsIndex of argsIndices ) {
            if ( tonotdoIndices.includes(argsIndex) ) { continue; }
            todoIndices.add(argsIndex);
        }
    };
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        collectArgIndices(hn);
    }
    collectArgIndices('*');
    hostnamesMap.clear();
}

// Entity-based
if ( entitiesMap.size !== 0 ) {
    const n = hnpartslen - 1;
    for ( let i = 0; i < n; i++ ) {
        for ( let j = n; j > i; j-- ) {
            const en = hnParts.slice(i,j).join('.');
            let argsIndices = entitiesMap.get(en);
            if ( argsIndices === undefined ) { continue; }
            if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
            for ( const argsIndex of argsIndices ) {
                if ( tonotdoIndices.includes(argsIndex) ) { continue; }
                todoIndices.add(argsIndex);
            }
        }
    }
    entitiesMap.clear();
}

// Apply scriplets
for ( const i of todoIndices ) {
    try { setConstant(...argsList[i]); }
    catch(ex) {}
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

// Inject code

// https://bugzilla.mozilla.org/show_bug.cgi?id=1736575
//   `MAIN` world not yet supported in Firefox, so we inject the code into
//   'MAIN' ourself when enviroment in Firefox.

// Not Firefox
if ( typeof wrappedJSObject !== 'object' ) {
    return uBOL_setConstant();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_setConstant = cloneInto([
            [ '(', uBOL_setConstant.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_setConstant);
        url = page.URL.createObjectURL(blob);
        const doc = page.document;
        script = doc.createElement('script');
        script.async = false;
        script.src = url;
        (doc.head || doc.documentElement || doc).append(script);
    } catch (ex) {
        console.error(ex);
    }
    if ( url ) {
        if ( script ) { script.remove(); }
        page.URL.revokeObjectURL(url);
    }
    delete page.uBOL_setConstant;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
