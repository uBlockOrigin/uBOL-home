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

// ruleset: annoyances-cookies

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_scriptlets($SECRET_ID$) {

/******************************************************************************/

const scriptletGlobals = self[$SECRET_ID$];

if ( scriptletGlobals.origins.length === 0 ) { return; }

/******************************************************************************/

const $hasHostnames$ = true;
const $hasEntities$ = false;
const $hasAncestors$ = false;
const $hasRegexes$ = false;

/******************************************************************************/

const todo = new Set();

if ( $hasHostnames$ ) {
    const scriptletHostnames = /* 615 */ ["do.de","al.com","dw.com","sss.fi","vzm.de","yle.fi","anna.fi","asga.ch","blhv.de","ccn.com","ciss.de","devm.io","engl.it","fild.de","gcol.de","grid.de","host.pl","igvm.de","ijr.com","itv4.de","ivfp.de","iway.ch","kmsw.de","naku.at","noaf.de","ojas.de","osmc.de","popp.eu","bbfun.de","beeze.de","betec.de","dg-pw.de","ekiwi.de","gosch.de","htvb.org","m-m-m.de","m38a1.de","melty.fr","nmmn.com","pdfa.org","pi3g.com","pinel.de","pulpe.eu","tieku.fi","tvn24.pl","yplay.de","accace.cz","accace.hu","accace.ro","accace.sk","artkon.de","asfour.ch","aspies.de","b757.info","baycix.de","carbon.ag","cargoe.at","dacsa.com","devowl.io","ejwleo.de","erp-up.de","farmer.pl","freep.com","gooloo.de","jadent.de","kjr-pi.de","klsys.com","kohlkg.de","ksp.co.il","maniac.de","medit.com","mlive.com","online.ch","stewes.de","ubisys.de","vg247.com","xv-ru.com","zipfer.at","4kfilme.de","accace.com","adzurro.de","aeotec.com","bestwig.de","boston.com","c-parts.de","epages.com","evroopt.by","fobizz.com","foodker.hu","gamepro.de","goesser.at","hookahx.de","hypnose.ac","jofogas.hu","jpgames.de","legacy.com","maxkoch.de","olmatic.de","ousuca.com","patria.net","podimo.com","prodopa.de","profiel.de","qastack.fr","ridee.bike","schools.by","softedu.pl","stilweb.it","suitapp.de","tecsafe.de","tiesse.com","toplink.de","upreply.de","vivoil.com","wp-loft.de","24hessen.de","afi-ipl.org","allkpop.com","bierspot.de","claritin.ca","compari.net","crazeuk.com","europace.de","fahrstil.cc","fakturia.de","gamenite.de","gamepur.com","getaawp.com","gigantti.fi","hs-soft.com","ilyabiz.com","imprints.de","krefindo.de","lang-ag.com","lemarit.com","ltmemory.de","luegeten.ch","mikanews.de","myclim8.com","oculyze.net","ontuscia.it","pgatour.com","proofing.de","saos.org.pl","smiley.blue","subitec.com","theoblog.de","titantv.com","topblogs.de","tuhlteim.de","tutonaut.de","tv-sport.de","wildbits.de","winlocal.de","xvideos.com","yurishop.it","actrento.com","arsdigita.de","base-chat.de","basta.berlin","berberin.net","brancaia.com","brill-art.de","bs-achern.de","cornhub.army","cranimax.com","desser.co.uk","drhorvath.de","duft-werk.de","ellasblog.de","esderaiz.com","eurogamer.es","eurogamer.pl","eurogamer.pt","everbloom.eu","frohreich.de","hopfner.info","ilonpolku.fi","inquirer.net","jankarres.de","knoblauch.de","komm-mit.com","lightcon.com","manyanet.org","move-ment.at","mummelito.de","narrwalla.de","newatlas.com","patchbox.com","photofloh.de","radiox.co.uk","roschmann.de","rosgovas.com","salzerkfz.de","saunahuus.de","savvista.com","spherity.com","spytunes.com","thingybob.de","tulipize.com","tweakers.net","uncrossy.com","vapecoco.com","webtapete.de","wichmann.biz","winfuture.de","wp-ninjas.de","yenivatan.at","abcteile24.de","ac-grimmen.de","antik-shop.de","bklm-ahaus.de","blindbild.com","canvascga.com","cleveland.com","cloudiway.com","dasmagazin.de","efg-passau.de","ekiwi-blog.de","elgiganten.dk","elgiganten.se","eurogamer.net","euromaster.de","express.co.uk","feuerhexen.de","ffzblossin.de","forwardis.com","freegossip.gr","frixtender.de","fuckyeah.shop","gaming-pc.net","hof-droste.de","horizonte.com","hundewelpe.de","infobroker.de","inicionet.com","iqskitchen.de","keengamer.com","linzerbier.at","ls-service.at","mandatory.com","mario-kaps.de","mmo-sankar.de","picockpit.com","plzenoviny.cz","puntigamer.at","rossoft.co.uk","savvytime.com","signisalc.org","skiweltcup.tv","symposium.org","vectorsoft.de","visitmedia.de","vitalplus.com","wallygusto.de","weber-senf.at","webtimiser.de","wind-craft.eu","wunderpen.com","zouboulis.com","audiovision.de","balsamico.shop","bitreporter.de","bricksforge.io","britannica.com","brodbeck-dd.de","brunozimmer.de","cleverpush.com","comicsands.com","dayspamainz.de","duffelblog.com","elisazunder.de","euranetplus.de","farbenherz.com","fasteninfos.de","fimfiction.net","financeads.com","flughafen.tips","frickeldave.de","goldpreis24.de","grupo-loma.com","historianet.fi","ilsecoloxix.it","istdasvegan.eu","it-koehler.com","josefbergs.com","kiyoua-news.de","kwerfeldein.de","levne-sauny.cz","linsenplatz.de","mannschaft.com","meinstream.net","milestone66.hu","odw-journal.de","paplanvilag.hu","playcentral.de","randombrick.de","roemermann.com","rotlichtaus.de","schwechater.at","senckenberg.de","sportsnaut.com","supereight.net","udo-lermann.de","vcfrankfurt.de","wzl-zwickau.de","youngimages.de","zabel-group.de","zertificon.com","zumkutscher.de","zur-glocke.com","aachen50plus.de","angelmagazin.de","babiceurican.cz","burzaucebnic.sk","cinemablend.com","createchange.me","derklassiker.de","domaintools.com","drive4brands.de","eventhotels.com","exitroom.berlin","flow-in-yoga.de","gadgethacks.com","goessential.com","hans-engelke.de","hauspanorama.de","hundgemacht.net","ilgazzettino.it","ilmessaggero.it","imprimare3d.com","istaf-indoor.de","kaiser-mania.de","karlhoeffkes.de","kasteninblau.de","kbmv-matting.de","kd-slovenija.de","lenovocampus.de","linternaute.com","locandazita.com","mack-design.com","music-on-net.de","neuneinhalb.org","nordlicht-ev.de","openforests.com","order-order.com","philips-hue.com","railwebcams.net","reformsziget.hu","salzstreuner.de","sevenforums.com","snippet.finance","sourceforge.net","swg-chemnitz.de","t-challenge.com","tango-flores.de","tc-equipment.de","tecalliance.net","techlicious.com","technicpack.net","techniknews.net","terra-natur.com","testefiorite.it","toledoblade.com","totalbeauty.com","windowspower.de","wrestlezone.com","zaunbau-koch.de","zimmerwetter.de","autobrinkmann.de","barracred.com.br","baumarkt-vogl.at","bildung-ab-50.de","danielederosa.de","denk-doch-mal.de","draisinenbahn.de","edr-software.com","englishradar.com","estudio-nous.com","foto-shooting.ch","gerdes-reisen.de","hotelkristall.it","insidetrading.de","klicks-kaufen.de","kuechenboerse.de","lameerooftop.com","lavanguardia.com","lazyinvestors.de","lichttraeumer.de","lobetalarbeit.de","louisreynier.com","miriamkreativ.de","missinfogeek.net","neumarkt-egna.it","nofilmschool.com","oakbeardcare.com","octopusenergy.de","pinel-medizin.de","pureselfmade.com","reise-zikaden.de","reisekontakte.at","running-green.de","schreiners-it.de","seifriz-preis.de","sonderversum.com","stadtreporter.de","stonk-market.com","strefabiznesu.pl","sv-langenfeld.de","thegeekfreaks.de","timo-bernhard.de","torinostoria.com","webfactory-i4.de","animalwebcams.net","blogyourthing.com","boeser-chinese.de","bsk-consulting.de","campingbuddies.de","compact-online.de","donostiroller.com","frigge-dinstak.de","gaming-grounds.de","goerlach-gmbh.com","guiademayores.com","knauer-galabau.de","laptophardware.hu","leben-mit-ohne.de","locafrique-sf.com","mixingmonster.com","musicfeeds.com.au","nachbelichtet.com","phpconference.com","pndracingteam.net","rolandgermany.com","schuetzendepot.de","schulebruetten.ch","stw-langenfeld.de","superherohype.com","tuhlteim-pedia.de","verstehepferde.de","viel-unterwegs.de","visconti.partners","airportwebcams.net","akzent-magazin.com","arabesque-essen.de","ausfraukesfeder.de","brauerei-strate.de","classic-emaille.de","cocktailsworld.net","derhoerbuchblog.de","egon-w-kreutzer.de","elconfidencial.com","evkirche-eilsen.de","floristasgarcia.es","forum-koepenick.de","gamerevolution.com","gefahrgutjaeger.de","hannover-living.de","hardware-helden.de","industriemedien.at","juwelier-dringo.de","karver-systems.com","lb-consultores.com","listenonrepeat.com","mfu-pilotenclub.at","motivationstipp.de","nationalreview.com","notebook-doktor.de","pentadoc-radar.com","readlightnovel.org","stadt-schoeneck.de","suedafrika-wein.de","thefashionspot.com","therapiewerk-io.de","tsg6209weinheim.de","weingut-knipser.de","welte-glasuren.com","westernjournal.com","wrestling-point.de","yogainspires.co.uk","zahnarzt-kuboth.de","blueoceangaming.com","boheme-schwabing.de","calendarpedia.co.uk","feuerwehr-oberau.de","foxvalleyfoodie.com","herrlichergarten.de","immobilien-skiba.de","katzenbaumdesign.de","kieruneknorwegia.pl","madame-lenormand.de","media-consulting.ch","merriam-webster.com","pizzeria-algusto.de","readyforboarding.pl","reinhardstrempel.de","samenbank-berlin.de","stefan-froescher.eu","stefke-heilbronn.de","stricken-online.com","supertipp-online.de","tanzschulebogner.de","thedraftnetwork.com","thinkingwithyou.com","thomasschlechter.de","vienna-interiors.at","von-zinsen-leben.de","199-euro-computer.de","automatiksysteme.com","bewusstes-zentrum.de","blog.ipc-computer.de","der-windows-papst.de","die-werbeschmiede.de","erbsenprinzessin.com","flaviamelissa.com.br","holzkisten-fabrik.de","lichtempfindlich.org","piazzadeimestieri.it","rockpapershotgun.com","spieltraum-berlin.de","splendid-internet.de","teilzeitreisender.de","theodysseyonline.com","tkm-systemtechnik.de","trettin-apotheken.de","windows101tricks.com","wt-onlineakademie.de","brachmannofficial.com","compagniefruitiere.fr","coworkingrepublic.com","download.mokeedev.com","egro-direktwerbung.de","feucht-obsttechnik.de","gymnasium-hochdahl.de","haarausfall-stopp.com","janamaenz.photography","klangmassage-moser.de","mhmscreenprinting.com","philosophenlexikon.de","pocket-pirates-prt.de","schneelaeuferzunft.de","stefaniegoldmarie.com","technik-hauptstadt.de","tonispizza-rastatt.de","vadhander.kramfors.se","wildpark-ortenburg.de","wolfgangallgaeuer.com","zahnarzt-dr-henkel.de","1000-haushaltstipps.de","akademie-management.de","autoverwertung-berk.de","flugschule-hochries.de","fschemie-goettingen.de","goeltzschtal-reisen.de","interestingengineering","naturseifen-moosmed.de","nebenwerte-magazin.com","prodottidellapiazza.it","tourismus-uckermark.de","trirhena-consulting.de","volksfest-nuernberg.de","alquilerordenadores.com","annabeauty-stuttgart.de","blu-ray-rezensionen.net","caucasus-naturefund.org","frauzuckerbroetchen.com","gasthaus-schmidmayer.de","lacasadavantialsole.org","marketing-strategen.com","music-service-geiger.de","pandore-gendarmerie.org","rissland-kunststoffe.de","smorfianapoletanaweb.it","steinway-park-seesen.de","weiterbildungsfinder.de","accademiainformatica.com","continentale-hannover.de","crossculture-academy.com","dollenberg-isolierung.de","fitnesscenter-schardt.de","lattinepersonalizzate.it","mallorca-unternehmen.com","pferde-hunde-therapie.de","philosophia-perennis.com","playstationlifestyle.net","rechtsanwalt-nierfeld.de","vadhander.hogakusten.com","elektrotechnik-schabus.de","fabian-heinz-webdesign.de","hallesches-fotoatelier.de","kunstmuseum-heidenheim.de","lepetitmarchedauvergne.fr","presto-personaldienste.de","restaurantsbrighton.co.uk","von-neindorff-stiftung.de","worldpopulationreview.com","gesundheitsladen-online.de","manneskraft-gesteigert.com","schnittmuster-datenbank.de","tiermasseur-mannsberger.at","energiemetropole-leipzig.de","erlebnispark-ziegenhagen.de","grafische-visualisierung.de","schiffe-und-kreuzfahrten.de","sl-landschaftsgestaltung.de","erfurt-touristinformation.de","gutshaus-neuendorf-usedom.de","weimar-touristinformation.de","wohnmobilcenter-drechsler.de","china-central-consultants.com","nahrungsmittel-intoleranz.com","transport-versicherungen.info","bilderberg-bellevue-dresden.de","ichbindochnichthierumbeliebtzusein.com","versicherungsmakler-leistenschneider.de"];
    const collectArglistRefIndices = (out, hn, r) => {
        let l = 0, i = 0, d = 0;
        let candidate = '';
        while ( l < r ) {
            i = l + r >>> 1;
            candidate = scriptletHostnames[i];
            d = hn.length - candidate.length;
            if ( d === 0 ) {
                if ( hn === candidate ) {
                    out.add(i); break;
                }
                d = hn < candidate ? -1 : 1;
            }
            if ( d < 0 ) {
                r = i;
            } else {
                l = i + 1;
            }
        }
        return i + 1;
    };
    const indicesFromHostname = (out, hnDetails, suffix = '') => {
        if ( hnDetails.hns.length === 0 ) { return; }
        let r = scriptletHostnames.length;
        for ( const hn of hnDetails.hns ) {
            r = collectArglistRefIndices(out, `${hn}${suffix}`, r);
        }
        if ( $hasEntities$ ) {
            let r = scriptletHostnames.length;
            for ( const en of hnDetails.ens ) {
                r = collectArglistRefIndices(out, `${en}${suffix}`, r);
            }
        }
    };
    const todoIndices = new Set();
    indicesFromHostname(todoIndices, scriptletGlobals.origins[0]);
    if ( $hasAncestors$ ) {
        for ( const entry of scriptletGlobals.origins ) {
            if ( entry.i === 0 ) { continue; }
            indicesFromHostname(todoIndices, entry, '>>');
        }
    }
    // Collect arglist references
    if ( todoIndices.size ) {
        const arglistRefs = /* 615 */ ["27","2","53,54","1","27","39,40","29","27","27","2","27","27","27","27","27","27","27","27","8","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","25","27","26","27","27","27","5,30,31","50","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","17","8","27","27","27","27","27","43,44","27","27","2","27","19","27","14,15","24","27","27","27","27","27","27","8","27","27","16","27","7","25","27","27","27","25","27","8","27","27","27","27","42","27","27","23","27","3","27","27","27","27","27","27","27","27","27","27","27","2","27","4","27","27","27","27","27","27","2","26,27","5","27","27","27","27","27","27","27","27","27","27","27","27","2","27","21,22","27","27","27","8","27","26,27","27","27","27","27","12,24","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","14,15","14,15","14,15","27","27","27","27","8","27","27","27","27","27","27","27","27","2","27","27","47","27","27","27","27","27","27","27","27","27","32,33,34,35,36,37,38","9,10,11","27","27","27","53,54,55","27","27","27","27","27","27","27","27","2","27","27","27","27","5","5","14,15","25","45","27","27","27","27","27","27","27","27","27","27","27","27","27","2","27","27","2","27","27","27","27","27","27","8","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","8","27","27","27","2","27","2","27","27","27","27","6","27","27","27","27","27","5,30,31","48,49","27","27","27","27","27","27","46","27","27","7","27","7","27","27","27","27","27","27","2","27","27","27","27","27","27","27","27","27","27","27","27","27","2","27","27","27","27","27","27","27","20","27","27","27","27","48,49","48,49","27","27","27","27","27","27","27","27","52","27","27","27","27","27","27","8","41","27","7","27","2","13","28","27","26","27","27","27","8","8","27","27","27","2","2","27","8","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","25","27","27","27","27","27","27","27","8","27","51","27","27","27","27","27","27","27","27","26","27","25","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","7","27","27","27","2,8","27","27","27","27","27","27","27","2","27","27","27","27","27","27","27","27","27","27","27","27","27","25","27","27","27","2","27","27","27","27","27","27","27","2","27","27","8","27","27","2","27","27","2","27","27","27","27","2","27","27","27","27","27","2","27","2","27","27","27","27","27","27","2","27","27","27","27","27","27","27","27","27","8","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","14,15","27","27","27","2","27","27","2","27","27","27","27","8","27","27","27","27","27","27","26","27","27","27","27","27","27","18","27","27","27","27","27","27","27","27","27","2","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","2","27","18","27","27","27","27","27","27","27","27","8","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27","27"];
        for ( const i of todoIndices ) {
            for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

if ( $hasRegexes$ ) {
    const scriptletFromRegexes = /* 0 */ [];
    const { hns } = scriptletGlobals.origins[0];
    for ( let i = 0, n = scriptletFromRegexes.length; i < n; i += 3 ) {
        const needle = scriptletFromRegexes[i+0];
        let regex;
        for ( const hn of hns ) {
            if ( hn.includes(needle) === false ) { continue; }
            if ( regex === undefined ) {
                regex = new RegExp(scriptletFromRegexes[i+1]);
            }
            if ( regex.test(hn) === false ) { continue; }
            for ( const ref of JSON.parse(`[${scriptletFromRegexes[i+2]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

// Execute scriptlets
if ( todo.size && todo.has(0) === false ) {
    const arglists = /* 56 */ ["","22,0,1","19,2","19,3","19,4","11,5,6","11,7,8","11,9,10","12,11,12","11,13,14","11,15,10","11,16,17","11,18,10","11,19,14","11,20,6","11,21,6","22,22,23","31,24","11,25,6","11,26,10","11,27,28","11,29,14","11,30,10","11,31,8","11,32,10","11,33,10","35,34","11,19,35","11,36,10","11,37,6","11,38,6","11,39,6","11,40,6","11,41,6","11,42,6","11,43,6","11,44,6","11,45,6","11,46,6","11,47,6","11,48,10","11,49,10","11,50,10","11,51,52","11,53,10","11,54,6","22,55,56","28,51,57","11,58,10","11,59,10","11,60,6","28,61,62","11,63,8","11,64,28","11,65,6","14,66"];
    const args = /* 67 */ ["load","function(){if(s.readyState==XMLHttpRequest.DONE","__cmpGdprAppliesGlobally","all_delere_cookie","cookieconsent.Popup","cicc.cookie_cat_statistic","true","config.requireCookieConsent","false","cookie_alert_overlay","noopFunc","document.createElement","admiral","cookieManager","{}","cookieManager.initialize","cookieManager.needsConsentBanner","falseFunc","xv.disclaimer.displayNewCookiePopup","realCookieBanner","BrockmanAllowedCookies.functional","BrockmanAllowedCookies.targeting","/^(?:click|scroll|keydown|touchstart|mouseenter)$/","cookie.get","FrodoPV","settings.consent","HB.CookieSettings.init","WHT.ShowConsentForm","trueFunc","CookiePolicy","CookiePolicy.init","useGDPR","xv.disclaimer.displayCookiePopup","Didomi","catch","undefined","window.cmpmngr.setConsentViaBtn","tcfAllowUseCookies","cicc.cookie_cat_functional","cicc.cookie_cat_marketing","tweakersConfig.userConfiguredConsent.googlemaps.approved","tweakersConfig.userConfiguredConsent.knightlab.approved","tweakersConfig.userConfiguredConsent.omny.approved","tweakersConfig.userConfiguredConsent.pcnltelecom.approved","tweakersConfig.userConfiguredConsent.soundcloud.approved","tweakersConfig.userConfiguredConsent.streamable.approved","tweakersConfig.userConfiguredConsent.youtube.approved","yleConsentSdk._consentSdk._embedded_social_media","yleConsentSdk.show","cockieConsentManagement","window.scrollTo","dataLayer","[]","gtag","flagTcfLoaded","DOMContentLoaded","cookieConsent","{\"value\":[{\"signals\":[\"remixd\"]},{\"event\":\"remixd_gtm_fire\"}]}","_iub.cs.options.callback.onConsentRejected","_iub.cs.options.callback.onConsentFirstRejected","__tcfapi_user_acctepted","cmp_importvendors","{\"value\": [\"s23\",\"s2564\"]}","_gtm.consent.cm.strategy.options.cmpay.enabled","Object.prototype.hasConsent","cmp_autoreject","checkPURLayerMustBeShown"];
    const { functionRefs } = scriptletGlobals;
    for ( const ref of todo ) {
        if ( ref < 0 ) { continue; }
        if ( todo.has(~ref) ) { continue; }
        const arglist = JSON.parse(`[${arglists[ref]}]`);
        const fn = functionRefs[arglist[0]];
        try { fn(...arglist.slice(1).map(a => args[a])); }
        catch { }
    }
}

/******************************************************************************/

// End of local scope
})("18a6405d-4634-4b3a-ae38-e2d275e6b586");

void 0;
