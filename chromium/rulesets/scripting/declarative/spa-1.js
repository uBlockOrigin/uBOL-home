/*******************************************************************************

    uBlock Origin Lite - a comprehensive, MV3-compliant content blocker
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

'use strict';

// ruleset: spa-1

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssDeclarativeImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\".ad_block_non_shadowed\",\"action\":[\"style\",\"position: absolute!important; left: -3000px!important;\"]}","{\"selector\":\".ad_block_shadowed\",\"action\":[\"style\",\"position: absolute!important; left: -3000px!important;\"]}"],["{\"selector\":\"div[class^=\\\"block-ads-\\\"]\",\"action\":[\"style\",\"visibility: hidden !important;\"]}"],["{\"selector\":\".hided\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\".body\",\"action\":[\"style\",\"background-image: none!important;\"]}"],["{\"selector\":\"#colunas\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\".ads.ads-block.prebid\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\".containerMapAndBanner > .contentMap\",\"action\":[\"style\",\"height: 100% !important;\"]}"],["{\"selector\":\".play\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\".main__corpo\",\"action\":[\"style\",\"margin-top: 160px!important;\"]}"],["{\"selector\":\"div[class=\\\"vc_row wpb_row td-pb-row\\\"][style^=\\\"padding-top: 1\\\"]\",\"action\":[\"style\",\"padding-top: 0 !important;\"]}"],["{\"selector\":\"#fusion-app\",\"action\":[\"style\",\"margin-top: 0!important;\"]}","{\"selector\":\".navbar-container\",\"action\":[\"style\",\"margin-top: 0!important;\"]}"],["{\"selector\":\"main#site-main\",\"action\":[\"style\",\"margin-top: 0px !important;\"]}"],["{\"selector\":\".is_advertising .site-advertising\",\"action\":[\"style\",\"margin: 5px auto 0 !important;\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"overflow: auto !important; padding-right: 0 !important;\"]}"],["{\"selector\":\".block-wrapper[style*=\\\"url\\\"] > .container > .row\",\"action\":[\"style\",\"margin-top: 0 !important;\"]}","{\"selector\":\".block-wrapper[style*=\\\"url\\\"]\",\"action\":[\"style\",\"background: none !important;\"]}","{\"selector\":\"body[style*=\\\"url\\\"] .trending-light[style^=\\\"margin-top:\\\"]\",\"action\":[\"style\",\"margin-top: 20px !important;\"]}","{\"selector\":\"body[style*=\\\"url\\\"]\",\"action\":[\"style\",\"background-image: none !important;\"]}"],["{\"selector\":\"body div[id].ads.adsbox.doubleclick\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\".area-publi\",\"action\":[\"style\",\"height: 0 !important;\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"padding-top: 0 !important;\"]}"],["{\"selector\":\"body > header\",\"action\":[\"style\",\"top: 0 !important;\"]}"],["{\"selector\":\"#banner_b\",\"action\":[\"style\",\"display: block !important;\"]}","{\"selector\":\"iframe#google_ads_iframe_123_bait\",\"action\":[\"style\",\"display: block !important;\"]}","{\"selector\":\"iframe#google_ads_iframe_b\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\"#header-bar.header-bar\",\"action\":[\"style\",\"padding-top: 0 !important;\"]}"],["{\"selector\":\"#div-gpt-leaderboard ~ #page\",\"action\":[\"style\",\"margin-top: 30px !important;\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"overflow: auto !important;\"]}"],["{\"selector\":\".alert-message > #informacion\",\"action\":[\"style\",\"display: block!important;\"]}"],["{\"selector\":\".ad-lat2\",\"action\":[\"style\",\"height: 0 !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; visibility: collapse !important;\"]}"],["{\"selector\":\"#NEWS_RELATED\",\"action\":[\"style\",\"position: absolute !important; left: -3000px !important;\"]}"],["{\"selector\":\"#ROBAPAGINAS_INLINE_LEFT\",\"action\":[\"style\",\"position: absolute !important; left: -3000px !important;\"]}"],["{\"selector\":\"[id].adsbox.doubleclick.ad-placement\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\"body .adsbygoogle\",\"action\":[\"style\",\"display: block!important; position: absolute!important; left: -3000px!important;\"]}"],["{\"selector\":\".navBar\",\"action\":[\"style\",\"height: auto !important;\"]}"],["{\"selector\":\".banner\",\"action\":[\"style\",\"visibility: hidden !important;\"]}"],["{\"selector\":\".ads-300x300\",\"action\":[\"style\",\"position: absolute!important; left: -3000px!important;\"]}","{\"selector\":\"div#detect.adsbox.doubleclick\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\"#player\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\".content-box\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"background-image: none !important;\"]}"],["{\"selector\":\"header\",\"action\":[\"style\",\"top: 0 !important;\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"overflow: visible!important;\"]}"],["{\"selector\":\"#framed > #player\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\"#framed\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\"body > #box\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\"html.fancybox-lock > body\",\"action\":[\"style\",\"overflow: auto !important;\"]}","{\"selector\":\"html.fancybox-margin\",\"action\":[\"style\",\"margin-right: 0 !important;\"]}"],["{\"selector\":\".col-anu + div.col-cnt > div.columna\",\"action\":[\"style\",\"width: 34% !important;\"]}"],["{\"selector\":\".hasBgApb\",\"action\":[\"style\",\"margin-top: 0 !important;\"]}"],["{\"selector\":\"#ablockercheck\",\"action\":[\"style\",\"display: block!important;\"]}"],["{\"selector\":\".content_section > .top\",\"action\":[\"style\",\"margin-top: 100px !important;\"]}","{\"selector\":\".page-container.top\",\"action\":[\"style\",\"margin-top: 60px!important;\"]}","{\"selector\":\".top-home\",\"action\":[\"style\",\"margin-top: 60px!important;\"]}"],["{\"selector\":\"#article-header\",\"action\":[\"style\",\"min-height: 0 !important;\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"overflow: visible !important;\"]}"],["{\"selector\":\"#manga-title\",\"action\":[\"style\",\"height: unset !important;\"]}"],["{\"selector\":\".lv-publi-box\",\"action\":[\"style\",\"position: absolute!important; left: -3000px!important;\"]}","{\"selector\":\".megabanner-adv\",\"action\":[\"style\",\"position: absolute!important; left: -3000px!important;\"]}"],["{\"selector\":\".add990x90 div\",\"action\":[\"style\",\"height: 0 !important;\"]}","{\"selector\":\".add990x90\",\"action\":[\"style\",\"min-height: 0 !important;\"]}"],["{\"selector\":\"iframe.video\",\"action\":[\"style\",\"display: block!important;\"]}"],["{\"selector\":\"body > .textads.banner-ads\",\"action\":[\"style\",\"display: block !important;\"]}","{\"selector\":\"body > div[id^=\\\"div-gpt-ad-\\\"]\",\"action\":[\"style\",\"display: block !important;\"]}","{\"selector\":\"body > ins.adsbygoogle\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\"#Publi300600xaa\",\"action\":[\"style\",\"height: 1px!important;\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"background-image:none!important;\"]}"],["{\"selector\":\"#ad\",\"action\":[\"style\",\"position: absolute!important; left: -3000px!important;\"]}"],["{\"selector\":\"#adsdiv\",\"action\":[\"style\",\"position: absolute!important; left: -3000px!important;\"]}"],["{\"selector\":\".ads.ad.adsbox.ad-placement.carbon-ads\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\".container.have-brand\",\"action\":[\"style\",\"margin-top: 0!important;\"]}"],["{\"selector\":\"#plays\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\".publicite.text-ad.adsbox\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\"#neoni_mutiny\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\".sidebar > div.tile-top.tile\",\"action\":[\"style\",\"height: auto!important;\"]}"],["{\"selector\":\"body div.adsbox.doubleclick.ad-placement[id]:not(#style_important)\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\".iframeDiv > center > a[target=\\\"_blank\\\"]\",\"action\":[\"style\",\"position: absolute !important; left: -3000px !important;\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"background-image: none!important;\"]}"],["{\"selector\":\".banner_large\",\"action\":[\"style\",\"position: absolute !important; left: -3000px !important;\"]}"],["{\"selector\":\"#axds-Top\",\"action\":[\"style\",\"min-height: 0 !important;\"]}"],["{\"selector\":\".pub_728x90.text-ad.textAd.text_ad.text_ads.text-ads.text-ad-links\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\".dat-menu-container\",\"action\":[\"style\",\"cursor: auto !important;\"]}","{\"selector\":\"body[style^=\\\"background\\\"]\",\"action\":[\"style\",\"background: none !important;\"]}"],["{\"selector\":\".footer\",\"action\":[\"style\",\"padding-bottom: 0 !important;\"]}"],["{\"selector\":\".op-body\",\"action\":[\"style\",\"overflow: auto !important;\"]}"],["{\"selector\":\"aside > div > .goqpfsl\",\"action\":[\"style\",\"visibility: hidden !important; height: 1px !important;\"]}"],["{\"selector\":\"body .ads-box\",\"action\":[\"style\",\"display: block !importnat;\"]}"],["{\"selector\":\"#hide\",\"action\":[\"style\",\"display: block!important;\"]}"],["{\"selector\":\".content #src_iframe\",\"action\":[\"style\",\"display: block !important;\"]}","{\"selector\":\".content > div[id]:has(> center > #src_iframe)\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\"body #fullbanner-container\",\"action\":[\"style\",\"height: 1px !important;\"]}"],["{\"selector\":\"[style=\\\"text-align: center; display: none;\\\"]\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\".player\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"overflow: auto!important;\"]}","{\"selector\":\"html\",\"action\":[\"style\",\"overflow: auto!important;\"]}"],["{\"selector\":\"body .adblock_warning:not(#style_important)\",\"action\":[\"style\",\"position: absolute !important; left: -3000px !important;\"]}"],["{\"selector\":\".modal-open\",\"action\":[\"style\",\"overflow: auto !important;\"]}"],["{\"selector\":\".pie-pagina\",\"action\":[\"style\",\"margin-bottom: 0 !important;\"]}"],["{\"selector\":\"#bannerGames\",\"action\":[\"style\",\"height: 2px!important;\"]}","{\"selector\":\".adstopo\",\"action\":[\"style\",\"position: absolute!important; left: -3000px!important;\"]}"],["{\"selector\":\".pum-open-overlay\",\"action\":[\"style\",\"overflow: auto !important;\"]}"],["{\"selector\":\"div[id^=\\\"src_iframe_\\\"]\",\"action\":[\"style\",\"display: block !important;\"]}"],["{\"selector\":\"body > #content\",\"action\":[\"style\",\"padding-bottom: 0 !important;\"]}"]];

const hostnamesMap = new Map([["foros.3dgames.com.ar",0],["lavoz.com.ar",1],["vidasaudavel.bio",2],["receitastop.click",2],["financasdeouro.com",2],["receitasdodia.fun",2],["infoinvest.org",2],["investfacil.org",2],["criptoreal.site",2],["adrenaline.com.br",3],["adrianeboneck.com.br",4],["ldicas.com.br",4],["bolsadevalores.club",4],["androidapktop.com",4],["cheirinhobao.com",4],["dicasfinanceirasbr.com",[4,32]],["guiasaude.info",4],["receitasdochico.life",[4,32]],["futlances.net",4],["gastronomiabrasileira.net",4],["receitasdalu.net",4],["dicadesaude.online",4],["receitasdahora.online",4],["legacyfun.site",4],["oplanetatv.clickgratis.com.br",5],["ouniversodatv.com",5],["climaaovivo.com.br",6],["decorardicas.com.br",7],["loucasporcabelos.com.br",7],["diariodepernambuco.com.br",8],["diariodoiguacu.com.br",9],["estadao.com.br",10],["guiadasemana.com.br",11],["hardware.com.br",12],["inforchannel.com.br",13],["anroll.net",13],["mundoconectado.com.br",14],["oceans14.com.br",15],["tudosobrefinancas.com",15],["portugues.com.br",16],["tudogostoso.com.br",[17,18]],["lavozdegalicia.es",17],["uol.com.br",19],["jc.ne10.uol.com.br",20],["oantagonista.uol.com.br",21],["radioagricultura.cl",22],["gamesperu2021.blogspot.com",22],["mantrazscan.com",22],["gamesviatorrent.top",22],["buscalinks.xyz",22],["goovie.co",23],["3djuegos.com",24],["androidayuda.com",[25,26]],["hardzone.es",25],["softzone.es",25],["antoniomote.com",27],["asialiveaction.com",28],["cienradios.com",29],["clavejuegos.com",30],["depor.com",31],["dicasgostosas.com",32],["gastroponto.com",32],["receitasvegana.com",32],["dicasdefinancas.net",32],["dicasdevalor.net",32],["guianoticiario.net",[32,56,72]],["megacurioso.net",32],["megacurioso.online",32],["nossoprato.online",32],["receitasdaora.online",32],["receitasdocheff.online",32],["ricasdelicias.online",32],["dicasvalores.com",33],["elchapuzasinformatico.com",34],["elmueble.com",35],["elperiodico.com",36],["empregovaga.com",[37,38]],["resenhasglobais.com",[37,38,56]],["turismoeviagem.com",[37,38]],["vidadeatletas.com",[37,38]],["tecword.info",[37,38,56]],["blotz.me",[37,38]],["belezaedieta.net",[37,38]],["manualdamulher.net",[37,38]],["cardapiodavovo.online",[37,38]],["financashoje.online",[37,38]],["financasnow.online",[37,38]],["noticiastecnologica.online",[37,38]],["tudoemprego.online",[37,38]],["vivercomsaude.online",[37,38,56]],["smartdoing.tech",[37,38,56]],["manchetehoje.xyz",[37,38,56]],["grandnoticias.com",38],["muitasreceitas.site",38],["tecnologiaonline.site",38],["fazendorendaextra.xyz",38],["felizemforma.com",39],["folhadoslagos.com",40],["formulatv.com",41],["gamevicio.com",42],["hartico.com",43],["infobae.com",44],["infoescola.com",45],["journaldemontreal.com",46],["knightnoscanlation.com",47],["lavanguardia.com",48],["lecturas.com",49],["mastercuriosidadesbr.com",50],["novatecnology.com",51],["tipsdesalud.tips",51],["pcbolsa.com",52],["profesionalreview.com",53],["radiotormentamx.com",[54,55]],["televall.website",54],["seodiv.com",57],["seriesbanana.com",58],["metroseries.net",58],["homecine.to",58],["homecine.tv",58],["smartpelis.tv",58],["seriesretro.com",59],["tudonoticiasbr.com",60],["windowsblogitalia.com",61],["xerifetech.com",62],["zona-leros.com",63],["zonammorpg.com",64],["primicias.ec",65],["20minutos.es",66],["canarias7.es",67],["hoy.es",67],["lasprovincias.es",67],["geeknetic.es",68],["informacion.es",69],["netmentor.es",70],["todalamusica.es",71],["kshowes.net",73],["sejasaudavel.net",74],["tecnoblog.net",75],["comandotorrents.org",76],["mundotec.pro",77],["jornaleconomico.pt",78],["meocloud.pt",79],["visao.sapo.pt",80],["tempo.pt",81],["superanimes.site",82],["lapagina.com.sv",83],["clubinvest.top",84],["donghuas.top",85]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.declarativeImports = self.declarativeImports || [];
self.declarativeImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
