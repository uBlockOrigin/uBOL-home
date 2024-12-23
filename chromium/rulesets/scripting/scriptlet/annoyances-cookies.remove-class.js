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

/* eslint-disable indent */

// ruleset: annoyances-cookies

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_removeClass = function() {

const scriptletGlobals = {}; // eslint-disable-line

const argsList = [["cookie-consent-active","body","stay"],["cookie-overlay-active","body","stay"],["cookiebanner-body","body","stay"],["cookie-open","body","stay"],["cookie-notice-active","body","stay"],["cookie-overlay","body","stay"],["eu-cookie-compliance-popup-open","body","stay"],["bf-fixed","body","stay"],["cookies-not-set","body","stay"],["js-cookie-consent-popup","","stay"],["ivass-no-cookie","body","stay"],["cookie-popup-visible","body","stay"],["idgcp__layer--active","html","stay"],["cc-scrolling-disabled","body","stay"],["modal-open","body","stay"],["hasPopup","body","stay"],["darker","body","stay"],["scommerce-gdpr-disabled","div","stay"],["no-scroll","html","stay"],["compensate-for-scrollbar","body","stay"],["gdpr-shown","body","stay"],["cookie-consent__wrapper","div","stay"],["cookies-request","body","stay"],["cx-modal-open","html","stay"],["cx-no-scroll","html","stay"],["e-cookie-bar-open","body","stay"],["no-consent","html","stay"],["is-blurred-cookiebox","html","stay"],["ccpaCookieBanner-acceptedAll","body","stay"],["cookies-show",".cookies-show","stay"],["disable-background","body","stay"],["cookie--not-set","body","stay"],["_cookiebanner","body","stay"],["async-hide","html","stay"],["ntd-gdpr-no-scroll","body","stay"],["modal-background","div","stay"],["pef-no-cookie","body","stay"],["cookie-not-accepted","body","stay"],["c-body--locked-always","body","stay"],["global-cookie","div","stay"],["disable-scroll","","stay"],["bg-gray","div","stay"],["cookie-active","body","stay"],["ccm-blocked","html","stay"],["ccm-blocked","body","stay"],["is-modal-cookies-visible","body","stay"],["layerActive","","stay"],["cookiebar-open","body","stay"],["blur","body","stay"],["cookie","","stay"],["cookieconsent-active","body","stay"],["cookieMsg","","stay"],["cookie_consent__alert","","stay"],["gdpr-cookie-notice-center-loaded","","stay"],["has-open-cookie","","stay"],["om_cookie_active","","stay"],["tvp-cookie-scroll-lock","","stay"],["cookie-overlay","","stay"],["disable","div","stay"],["prevent-scroll","","stay"],["fog","","stay"],["cookie-hint","","stay"],["dp--cookie-consent","body","stay"],["body-overlay-scrollable","","stay"],["modal-open","","stay"],["no-scroll","body","stay"],["show-cookie-consent","","stay"],["is-active-cookiebar","","stay"],["has-banner","body.has-banner","stay"],["pointerevents","","stay"],["cookie-accept-required","","stay"],["cookie-open","","stay"],["cookiePopupVisible","","stay"],["unreadable-display","","stay"],["mandatory_cookie_modal","","stay"],["wwzoverlay--open","","stay"],["gdpr-infobar-visible","","stay"],["cookie-enabled","","stay"],["cookie-overlay--open","","stay"],["cookie-banner-open","","stay"],["cookie-banner-active","body","stay"],["overlay-content","body","stay"],["is-active-cookiebar","body","stay"],["didomi-popup-open","body"],["idxrcookies-block-user-nav","body","stay"],["ccpa-banner","","stay"],["modal-cacsp-open","","stay"],["modal-cacsp-box","","stay"],["brd_cookies_bar_popup_shown","html","stay"],["js-modalUnclosable","","stay"],["js-cookiesModal|is-open",".js-cookiesModal,.is-open"],["remodal-bg","","stay"],["cookie-warning-open","","stay"],["with-featherlight","","stay"],["cookies-shown","body","stay"],["no-cookie","","stay"],["wcc-popup-overflow","body","stay"],["dimmeractive","body","stay"],["snoop-modal-open","body","stay"],["is-blurred-cookiebox","","stay"],["consent-manager--popup","body","stay"],["consent-manager-open","body","stay"],["zp-gtm-scripts--blur","","stay"],["dots","","stay"],["cookies-modal-open","","stay"],["overlay","body","stay"],["with-dark","","stay"],["show--consent","body","stay"],["messages-active","","stay"],["cdk-overlay-container","","stay"],["b-dialog","","stay"],["disabled","body","stay"],["lock-scroll","","stay"],["disabled","header","stay"],["cookie-not-accepted-overlay","","stay"],["blurred-page","","stay"],["cookie-consent--present","","stay"],["header-gdrp-cookies-visible","","stay"],["fixed","","stay"],["noScroll","","stay"],["cookie_notification","","stay"],["blocked-body","body","stay"],["popup","div","stay"],["has-no-scroll","","stay"],["_31e","div","stay"],["hasCookieBanner","body","stay"],["blured","","stay"],["noscroll","body","stay"],["has-overlay","","stay"],["cookie-consent-is-active","body","stay"],["cookiesgdpr__scroll","","stay"],["modal-show","","stay"],["gdpr","","stay"],["cookieopened","body","stay"],["cookiewall-active","body","stay"],["is-cookie-notice","body","stay"],["cookie-consent-banner-open","html","stay"],["modal-overlay","","stay"],["blur","","stay"],["cookielaw-blur-background","","stay"],["sp-message-open","html","stay"],["modalOpen___gZykv","body"],["cookie-bar","","stay"]];

const hostnamesMap = new Map([["winparts.be",0],["winparts.eu",0],["winparts.fr",0],["winparts.ie",0],["winparts.nl",0],["winparts.se",0],["sportano.sk",1],["sportano.de",1],["sportano.bg",1],["sportano.hu",1],["sportano.ro",1],["sportano.cz",1],["klinik-am-ring.de",2],["seswater.co.uk",3],["ooekultur.at",4],["igmetall.de",5],["universalgeneve.com",6],["hostfly.by",7],["quantamagazine.org",[8,37]],["rappjmed.ch",8],["osprey.com",9],["ivass.it",10],["onelottery.co.uk",11],["yourschoollottery.co.uk",11],["rainbowlottery.co.uk",11],["idg.se",12],["gearaid.com",13],["buildex.cz",14],["gruenderservice.at",15],["caiacosmetics.com",16],["pdc-big.nl",17],["pdc-big.it",17],["pdc-big.ie",17],["pdc-big.fr",17],["pdc-big.es",17],["pdc-big.be",17],["pdc-big.at",17],["pdc-big.co.uk",17],["pdc-big.de",17],["pdc-big.com",17],["elio-systems.io",[18,25]],["sanha.com",[18,25]],["recettesetcabas.com",19],["flinders.edu.au",20],["opera.com",21],["groningenairport.nl",22],["crocs.co.uk",[23,24]],["crocs.eu",[23,24]],["crocs.nl",[23,24]],["crocs.fi",[23,24]],["crocs.fr",[23,24]],["crocs.de",[23,24]],["stilord.fr",26],["stilord.it",26],["stilord.de",26],["stilord.es",26],["dasfutterhaus.at",27],["developer.paypal.com",28],["cpc2r.ch",29],["zen.com",30],["tecsafe.de",31],["foxracingshox.de",31],["stromnetz.berlin",32],["websummit.com",33],["thehustle.co",33],["epochtimes.fr",34],["ajbell.co.uk",35],["economiapertutti.bancaditalia.it",36],["tradersunion.com",37],["phsgreenleaf.co.uk",38],["phswashrooms.ie",38],["mccolls.co.uk",[39,40]],["crt.hr",41],["yourstorebox.com",42],["clickskeks.at",[43,44]],["housell.com",45],["lactostop.de",46],["mibe.de",46],["spilger.de",47],["dbs.si",48],["abcya.com",49],["umicore.be",50],["umicore.fi",50],["umicore.ca",50],["jongcdenv.be",50],["umicore.jp",50],["umicore.cn",50],["umicore.pl",50],["umicore.kr",50],["umicore.co.th",50],["umicore.fr",50],["umicore.de",50],["donneurdecellulessouches.be",50],["stammzellenspender.be",50],["stemcelldonor.be",50],["umicore.com",50],["umicore.com.br",50],["koenvandenheuvel.be",50],["stamceldonor.be",50],["nahima.be",50],["catused.com",51],["eujuicers.cz",52],["graziellawicki.com",53],["funnelcockpit.com",53],["dnk.nl",54],["eam.de",55],["eam-netz.de",55],["tvp.pl",56],["cellardoor.co",57],["ampire.de",58],["verpackungsstadl.ch",58],["imkershoperzgebirge.de",58],["modellbahndealer.de",58],["tillit-bikes.shop",58],["bike-onlineshop.de",58],["futspo.de",58],["compravo.de",58],["perpedale.de",58],["modellbau-jung.de",58],["verpackungsstadl.at",58],["modellbau-vordermaier.de",58],["bike-supply.de",58],["wroc.pl",59],["basenio.de",60],["fm-systeme.de",61],["gartenhotel-crystal.at",62],["swffm.de",62],["studentenwerkfrankfurt.de",62],["dmsg.de",62],["bgk.pl",62],["pflegezeit-berlin.de",62],["gpd-nordost-onlineberatung.de",62],["proabschluss-beratung.de",62],["hilfe-telefon-missbrauch.online",62],["dww-suchtberatung.de",62],["cyberforum.de",62],["gutscheine.eurothermen.at",62],["wolff-mueller.de",62],["ras.bz.it",62],["technoalpin.com",62],["wifiwien.at",[63,64]],["wifikaernten.at",[63,64]],["wifi.at",[63,64]],["pdf-archive.com",64],["5asec.pt",65],["tui.dk",65],["tui.fi",65],["tui.no",65],["tui.se",65],["istore.co.za",65],["salvagny.org",65],["leslipfrancais.fr",65],["rb-os.de",[65,129]],["volksbank-mittweida.de",[65,129]],["wvb.de",[65,129]],["bremischevb.de",[65,129]],["meinebank.de",[65,129]],["vb-rb.de",[65,129]],["gladbacher-bank.de",[65,129]],["vrbank-in-thueringen.de",[65,129]],["bodenseebank.de",[65,129]],["rb-oberaudorf.de",[65,129]],["volksbank-trossingen.de",[65,129]],["owl-immobilien.de",[65,129]],["volksbank-backnang.de",[65,129]],["volksbank-international.de",[65,129]],["raiba-westhausen.de",[65,129]],["vr-nopf.cz",[65,129]],["vrbankimmobilien.de",[65,129]],["cvw-privatbank-ag.de",[65,129]],["rb-denzlingen-sexau.de",[65,129]],["rv-banken.de",[65,129]],["volksbank-remseck.de",[65,129]],["raiba-gr.de",[65,129]],["vrb-spangenberg.de",[65,129]],["rb-berghuelen.de",[65,129]],["vb-lauterecken.de",[65,129]],["rb-sondelfingen.de",[65,129]],["voba-deisslingen.de",[65,129]],["rb-hardt-bruhrain.de",[65,129]],["volksbank-daaden.de",[65,129]],["dervolksbanker.de",[65,129]],["vb-kirnau-krautheim.de",[65,129]],["skbwitten.de",[65,129]],["raiba-ndwa.de",[65,129]],["volksbank-mittleres-erzgebirge.de",[65,129]],["rb-eching.de",[65,129]],["volksbank-aktiv.de",[65,129]],["vbsuedemsland.de",[65,129]],["voba-moeckmuehl.de",[65,129]],["volksbank-freiburg.de",[65,129]],["vbleos.de",[65,129]],["meine-rvb.de",[65,129]],["aachener-bank.de",[65,129]],["muenchner-bank.de",[65,129]],["volksbank-dh.de",[65,129]],["volksbankeg.de",[65,129]],["sparda-bank-hamburg.de",[65,129]],["sparda-sw.de",[65,129]],["volksbank-thueringen-mitte.de",[65,129]],["vrbankeg.de",[65,129]],["bernhauser-bank.de",[65,129]],["vvrbank-krp.de",[65,129]],["vvr-bank.de",[65,129]],["vb-mittelhessen.de",[65,129]],["vr-bayernmitte.de",[65,129]],["vobadhk.de",[65,129]],["rheingauer-volksbank.de",[65,129]],["dovoba.de",[65,129]],["vr-dachau.de",[65,129]],["kd-bank.de",[65,129]],["volksbank-hochrhein.de",[65,129]],["pollfish.com",66],["werkenbijtrekpleister.nl",67],["werkenbijkruidvat.be",67],["rassenlijst.info",67],["werkenbijiciparisxl.nl",67],["flightradar24.com",68],["apk-vk.at",69],["vietnamairlines.com",70],["incotec.com",71],["croda.com",71],["exaktafoto.se",72],["campingdusoleil.com",73],["hotel-la-chaumiere.com",73],["les-anges-gardiens.fr",73],["croco-kid.com",73],["cambridge-centre.fr",73],["equisud.com",73],["allokebab-pau.fr",73],["etre-visible.local.fr",73],["mas-montebello66.com",73],["camping-residentiel-les-marronniers-jura.fr",73],["dj4events.fr",73],["saintjoursexpertmaritime.com",73],["az-renovation.fr",73],["presquilemultiservices.com",73],["hotel-aigoual.com",73],["hotel-restaurant-pau.com",73],["desrayaud-paysagistes.com",73],["hotelsaintcharles.fr",73],["agvillagecamarguais.com",73],["joyella.com",73],["gabriel-godard.com",73],["artech-sellerie.com",73],["motoclubernee.com",73],["ledauphinhotel.com",73],["cuisin-studio.com",73],["biomeo-environnement.com",73],["leman-instruments.com",73],["esthetique-meyerbeer.com",73],["institut-bio-naturel-nice.fr",73],["nature-et-bois.fr",73],["transmissions-bordeaux.com",73],["kinechartreuse.com",73],["corsegourmande.com",73],["cotedecor.com",73],["restaurant-la-badiane.fr",73],["systelia.fr",73],["lesjardinsinterieurs.com",73],["helenevue.com",73],["saubusse-thermes.com",73],["dehn.es",74],["dehn.fr",74],["dehn.it",74],["dehn.hu",74],["desitek.dk",74],["dehn.at",74],["dehn.de",74],["wwz.ch",75],["inyova.at",76],["inyova.ch",76],["inyova.de",76],["ccalbacenter.com",76],["wamu.org",76],["momentive.com",77],["kennedyslaw.com",78],["elekta.com",79],["ige.ch",80],["stratasysdirect.com",81],["stratasys.com",81],["werkenbijkruidvat.nl",82],["ghacks.net",83],["cutoff.es",84],["whyopencomputing.com",84],["mbanc.com",85],["dentalgalindo.com",[86,87]],["archeologia.com.pl",[86,87]],["letrayframe.com",[86,87]],["osteofisintegral.es",[86,87]],["uco.cat",[86,87]],["buecheler-kollegen.de",[86,87]],["seminariodeosma-soria.org",[86,87]],["kamensenica.sk",[86,87]],["movimentoofficinedelsud.it",[86,87]],["trident.se",[86,87]],["semanasantademalagaayeryhoy.com",[86,87]],["diazfloristasestrella.com",[86,87]],["cosechavida.com",[86,87]],["broncoillustration.com",[86,87]],["sumoingenio.com",[86,87]],["aligepro.es",[86,87]],["muevo.es",[86,87]],["azulejosacedo.com",[86,87]],["sana.cz",[86,87]],["aliapinto.com",[86,87]],["tsconline.es",[86,87]],["polifast.it",[86,87]],["napos.cz",[86,87]],["gutshaus-neuendorf-usedom.de",[86,87]],["kunterbunte-kinder.de",[86,87]],["desatando.org",[86,87]],["ledocom.cz",[86,87]],["aliciasuarez.net",[86,87]],["diabramar.com",[86,87]],["lamagnalonga.org",[86,87]],["benejamrefrigeracion.com",[86,87]],["micropigmentacioncapilarbcn.com",[86,87]],["arcusnet.se",[86,87]],["videogenic.es",[86,87]],["grundschule-remagen.de",[86,87]],["aceitessatunion.com",[86,87]],["servigraphic.com.ar",[86,87]],["textsteine.de",[86,87]],["campergarage.es",[86,87]],["administradorfincasblog.com",[86,87]],["balgal.es",[86,87]],["grafika-dtp-produkcia.sk",[86,87]],["unmardeconstelaciones.com",[86,87]],["salobella.com",[86,87]],["careon.se",[86,87]],["gymnosport.com",[86,87]],["easyhomes.com.es",[86,87]],["casavaledalama.pt",[86,87]],["dosc.es",[86,87]],["fcfoz.pt",[86,87]],["berevolk.com",[86,87]],["hvpropertyclearance.co.uk",[86,87]],["calamo.se",[86,87]],["elserratplanoles.com",[86,87]],["bubblessea.es",[86,87]],["disperator.se",[86,87]],["ecoparquets.com",[86,87]],["zlotaraczkalublin.pl",[86,87]],["congresoscostadelsol.com",[86,87]],["pneumaticiroma.it",[86,87]],["asprona.es",[86,87]],["virgendefatima.es",[86,87]],["patronatpremia.cat",[86,87]],["2points13.fr",[86,87]],["3d3.es",[86,87]],["abantos.es",[86,87]],["abastanimacio.org",[86,87]],["academiafrancesadebelleza.co",[86,87]],["acaluca.org",[86,87]],["acce.es",[86,87]],["ad-particles.com",[86,87]],["adea.sk",[86,87]],["afplr.fr",[86,87]],["agiletalon.fr",[86,87]],["agiratou.com",[86,87]],["aidaromero.com",[86,87]],["alkoholochnarkotika.se",[86,87]],["alligatorbioscience.se",[86,87]],["anea.es",[86,87]],["animala.es",[86,87]],["apimadrid.net",[86,87]],["aquatrend.sk",[86,87]],["arabesque-formation.org",[86,87]],["arrivamallorca.es",[86,87]],["asapservicios.net",[86,87]],["aspock.com",[86,87]],["atout-voyages.com",[86,87]],["autocareslazara.es",[86,87]],["autocaresmariano.com",[86,87]],["autoform.pl",[86,87]],["ayudatranspersonal.com",[86,87]],["bacabeton.cz",[86,87]],["begalvi.com",[86,87]],["bent-com.com",[86,87]],["berliner-haeuser.de",[86,87]],["bespokespain.com",[86,87]],["bevent-rasch.se",[86,87]],["bio-cord.es",[86,87]],["biotropica.fr",[86,87]],["bornes-eurorelais.fr",[86,87]],["braeu-stueble.de",[86,87]],["brendanoharamp.scot",[86,87]],["briau.com",[86,87]],["caleulalia.com",[86,87]],["cande-sur-beuvron.com",[86,87]],["carlhag.se",[86,87]],["carrier.se",[86,87]],["casadelaveiga.com",[86,87]],["caytas.com.tr",[86,87]],["cecjecuador.org.ec",[86,87]],["cegef.com",[86,87]],["centrediagonal.com",[86,87]],["centropolisportivomassari.it",[86,87]],["cerai.org",[86,87]],["cervosgrup.com",[86,87]],["chimeneasalicante.com",[86,87]],["cliatec.com",[86,87]],["clinicabadal.es",[86,87]],["cometh-consulting.com",[86,87]],["copysud.fr",[86,87]],["cortilar.com",[86,87]],["crystal-finance.com",[86,87]],["ctangana.com",[86,87]],["cugatresidencial.com",[86,87]],["dake.es",[86,87]],["datatal.se",[86,87]],["degom.com",[86,87]],["delfis.es",[86,87]],["delogica.com",[86,87]],["dentalcompany.es",[86,87]],["descarpack.com.br",[86,87]],["desfiladeroediciones.com",[86,87]],["desomer.be",[86,87]],["diarioandalucia.es",[86,87]],["dibujos-animados.net",[86,87]],["direkt-immobilie.de",[86,87]],["dovozautznemecka.cz",[86,87]],["drpuigdollers.com",[86,87]],["dunamys.inf.br",[86,87]],["easyimplantology.com",[86,87]],["eb2b.com.pl",[86,87]],["echo-mieszkania.pl",[86,87]],["eclinic.com.sg",[86,87]],["edgeict.com",[86,87]],["eiglaw.com",[86,87]],["elandexpediciones.es",[86,87]],["emalec.com",[86,87]],["enlighten.net",[86,87]],["equifab.es",[86,87]],["escuelanauticamarenostrum.com",[86,87]],["esgrima.cat",[86,87]],["espaisperconviure.es",[86,87]],["etbygg.com",[86,87]],["eurepieces.fr",[86,87]],["euroenvio.com",[86,87]],["eurotex.es",[86,87]],["expertetfinance.fr",[86,87]],["farmarsketrhyfuturum.cz",[86,87]],["fastvisa.fr",[86,87]],["fauxdiplomes.org",[86,87]],["fisiolistic.com",[86,87]],["fondazionealbertosordi.it",[86,87]],["foyersekcjapolska.eu",[86,87]],["fundacjaeds.pl",[86,87]],["galeriaxanadu.pl",[86,87]],["garcia-ibanez.com",[86,87]],["gestenaval.com",[86,87]],["glaskogen.se",[86,87]],["globalteam.es",[86,87]],["goia.org.pl",[86,87]],["granibier.com",[86,87]],["grundia.se",[86,87]],["grupoisn.com",[86,87]],["gruporhzaragoza.com",[86,87]],["hagagruppen.se",[86,87]],["halima-magazin.com",[86,87]],["handelskammaren.com",[86,87]],["helitecnics.com",[86,87]],["helux.se",[86,87]],["hermanosalcaraz.com",[86,87]],["hjarnkoll.se",[86,87]],["hmfoundation.com",[86,87]],["hormimpres.com",[86,87]],["hoteldeprony.fr",[86,87]],["hotelroyalcatania.it",[86,87]],["houjethai.nl",[86,87]],["hummer.cz",[86,87]],["icld.se",[86,87]],["ict-project.it",[86,87]],["imprentalaspalmas.com",[86,87]],["informamiele.it",[86,87]],["inission.com",[86,87]],["inmobiliariavolga.com",[86,87]],["international-terra-institute.com",[86,87]],["inwaspain.com",[86,87]],["izkigolf.eus",[86,87]],["jdmusic.se",[86,87]],["juveycamps.com",[86,87]],["kaunokapiniuprieziura.lt",[86,87]],["kcmkompresor.com",[86,87]],["kewaccountants.co.uk",[86,87]],["konkretplus.pl",[86,87]],["krajci.cz",[86,87]],["krisvagenut.se",[86,87]],["kyoceracapetown.co.za",[86,87]],["labaguette.pl",[86,87]],["labintegrados.com",[86,87]],["ladderupinc.com",[86,87]],["landskronafoto.org",[86,87]],["langarri.es",[86,87]],["lawa.es",[86,87]],["laxo.se",[86,87]],["layher.se",[86,87]],["lifetraveler.net",[86,87]],["lindrooshalsa.se",[86,87]],["lobolab.es",[86,87]],["maisqueromanicorutas.com",[86,87]],["mallandonoandroid.com",[86,87]],["masconcas.com",[86,87]],["mediabest.cz",[86,87]],["megustaelvino.es",[86,87]],["mensa.se",[86,87]],["mestiteslilis.com",[86,87]],["minutoprint.com",[86,87]],["mirano.cz",[86,87]],["mogador.cz",[86,87]],["morphestudio.es",[86,87]],["motoaxial.com",[86,87]],["multiversidad.es",[86,87]],["mundollaves.com",[86,87]],["musicotherapie-federationfrancaise.com",[86,87]],["nauticaravaning.com",[86,87]],["nestville.sk",[86,87]],["nestvillepark.sk",[86,87]],["netromsoftware.ro",[86,87]],["nojesfabriken.se",[86,87]],["oddoneout.se",[86,87]],["opako.pl",[86,87]],["oserlafrique.com",[86,87]],["paintballalcorcon.com",[86,87]],["pallejabcn.com",[86,87]],["penicilinafruits.com",[86,87]],["peregrinoslh.com",[86,87]],["permis-lausanne.ch",[86,87]],["pernillaandersson.se",[86,87]],["piazzadelgusto.it",[86,87]],["pipi-antik.dk",[86,87]],["plasticosgeca.com",[86,87]],["plastimyr.com",[86,87]],["portal.unimes.br",[86,87]],["pro-beruf.de",[86,87]],["prophecyinternational.com",[86,87]],["psicoterapeuta.org",[86,87]],["puertasprieto.com",[86,87]],["puntosdefantasia.es",[86,87]],["pzmk.org.pl",[86,87]],["rastromaquinas.com",[86,87]],["rectoraldecastillon.com",[86,87]],["reinomineral.com",[86,87]],["reklamefreunde.de",[86,87]],["restauranthispania.com",[86,87]],["rubinmedical.dk",[86,87]],["rubinmedical.no",[86,87]],["rubinmedical.se",[86,87]],["sak.se",[86,87]],["sammetais.com.br",[86,87]],["sebastiancurylo.pl",[86,87]],["serigrafiaiorgi.com",[86,87]],["seyart.com",[86,87]],["sgaim.com",[86,87]],["sicamemt.org",[86,87]],["siguealconejoblanco.es",[86,87]],["sinfimasa.com",[86,87]],["skp.se",[86,87]],["skrobczynski.pl",[86,87]],["slush.de",[86,87]],["solebike.it",[86,87]],["solu-watt.fr",[86,87]],["soluzionainmobiliaria.es",[86,87]],["somoparque.com",[86,87]],["sorgingaztemoda.com",[86,87]],["sroportal.sk",[86,87]],["ssmf.se",[86,87]],["stobrasil.com.br",[86,87]],["stoparmut2015.ch",[86,87]],["studiodimuro.com",[86,87]],["subkultur-hannover.de",[86,87]],["sustanciagris.com",[86,87]],["szkt.sk",[86,87]],["tagibergslagen.se",[86,87]],["tallergastronomico.es",[86,87]],["tarna.fhsk.se",[86,87]],["tassenyalitzacio.com",[86,87]],["tctech.se",[86,87]],["teknoduegroup.it",[86,87]],["teloliquido.com",[86,87]],["temasa.es",[86,87]],["textilprint.sk",[86,87]],["thehouseofautomata.com",[86,87]],["tmgernika.com",[86,87]],["toastetmoi.fr",[86,87]],["tollare.org",[86,87]],["triperavigatana.com",[86,87]],["tuckerfranklininsgrp.com",[86,87]],["tuftuf.net",[86,87]],["turuletras.com",[86,87]],["umfmb.fr",[86,87]],["upapsa.com",[86,87]],["valenciatoday.es",[86,87]],["vanghel-und-morawski.de",[86,87]],["vickycan.com",[86,87]],["ville-de-salles.com",[86,87]],["webbigt.se",[86,87]],["westlede.be",[86,87]],["wiemker.org",[86,87]],["woolink.co",[86,87]],["wp.fratgsa.org",[86,87]],["xatobaxestion.com",[86,87]],["xfactor-gmbh.de",[86,87]],["zigmoon.com",[86,87]],["brightdata.com",88],["canyon.com",[89,90]],["drimsim.com",91],["eteam-winkler.de",92],["kdn-elektro.de",92],["elektro-kotz.de",92],["elektro-service-rauh.de",92],["elektroanlagenbuettner.de",92],["be-connect.online",92],["bayergruppe.com",92],["bayer-wkt.de",92],["bayer-wind.de",92],["bayer-wd.de",92],["elektro-joa.de",92],["htechnik.de",92],["ehk-service.de",92],["bittner-tv.de",92],["elektro-suelzner.de",92],["elektro-leps.de",92],["elektromax-hausgeraete.de",92],["elektrotechnik-schedel.de",92],["elkugmbh.de",92],["ln-elektro-gmbh.de",92],["weiss-blau-gmbh.de",92],["sunbeam-energy.de",92],["prokauf.com",92],["lichtstudio-kerl.de",92],["liebing-beese.de",92],["hoeschel-baumann.de",92],["hausgeraete-kraemer.de",92],["gehlhaar-elektrotechnik.de",92],["ehs-elektrotechnik.de",92],["elektrojarschke.de",92],["elektrotechnik-fleischmann.de",92],["elektroseemueller.de",92],["schoerling-blitz.de",92],["ast-apolda.com",92],["elektro-klippel.de",92],["arntz-haustechnik.de",92],["elektro-bindel.de",92],["elektrotechnik-weiss.com",92],["brandschutz-hamburg.de",92],["wagnerelektrotechnik.de",92],["el-kramer.de",92],["mks-hof.de",92],["wernz-elektro.de",92],["e3-energy.de",92],["sg-solar.de",92],["elektrokrebs.de",92],["elektro-roehrl.de",92],["elektro-kreher.de",92],["giegling-vonsaal.de",92],["elektro-lehmann.com",92],["ems-wurzen.de",92],["scholpp.de",93],["scholpp.es",93],["scholpp.pl",93],["scholpp.it",93],["ptc.eu",93],["scholpp.com",93],["abo24.de",93],["overdrive.com",93],["wetu.com",93],["superwatchman.com",94],["bitburger-braugruppe.de",95],["alpen.co.uk",96],["alsina.com",96],["assosia.com",96],["bassicostruzioni.it",96],["bettenconcept.com",96],["blackpoolairport.com",96],["cateringvandenberg.nl",96],["ceratrends.com",96],["chestnut-tree-house.org.uk",96],["cirrusassessment.com",96],["clinicalondon.co.uk",96],["cmos.ie",96],["deniswilliams.ie",96],["efmdglobal.org",96],["emri.nl",96],["endlesspools.fr",96],["foleys.ie",96],["fryerndental.co.uk",96],["globalfocusmagazine.com",96],["guildhalldental.com",96],["hampshireimplantcentre.co.uk",96],["heikkala.com",96],["hermesit.net",96],["hotspring.be",96],["xn--inkomstfrskring-9kb71a.se",96],["innohome.com",96],["jakobwirt.at",96],["klinger.fi",96],["londonwomenscentre.co.uk",96],["memoreclame.nl",96],["mitarbeiter-app.de",96],["mobiltbredband.se",96],["newsbook.com.mt",96],["northeastspace.ie",96],["portea.fr",96],["precisiondentalstudio.co.uk",96],["ramotavla.se",96],["simkort.se",96],["stbarnabas-hospice.org.uk",96],["tundra.fi",96],["upitrek.com",96],["weetabix-arabia.com",96],["weetabix.co.uk",96],["weetabix.com",96],["weetabix.es",96],["weetabix.fr",96],["weetabix.it",96],["weetabix.nl",96],["weetabix.no",96],["weetabix.pt",96],["weetabixea.com",96],["weetabixfoodcompany.co.uk",96],["weetabixonthego.co.uk",96],["proteincompany.fi",97],["proteinbolaget.se",97],["snoopmedia.com",98],["myguide.de",98],["study-in-germany.de",98],["daad.de",98],["futterhaus.de",99],["scottsofstow.co.uk",[100,101]],["zawszepomorze.pl",102],["wasserkunst-hamburg.de",103],["lta.org.uk",104],["brico-travo.com",105],["panzerfux.de",106],["tvprato.it",107],["liftshare.com",107],["vesely-drak.cz",107],["consordini.com",107],["fitzmuseum.cam.ac.uk",107],["hotdk2023.kre.hu",107],["panwybierak.pl",107],["bomagasinet.dk",107],["miplantaweb.com",107],["electronics.semaf.at",107],["sfd.pl",107],["flota.es",107],["jobs.cz",107],["prace.cz",107],["eninternetgratis.com",107],["unavidadeviaje.com",107],["theateramrand.de",108],["jugend-praesentiert.de",108],["evium.de",109],["epayments.com",110],["riceundspice.de",111],["happysocks.com",[112,113]],["win2day.at",114],["porp.pl",115],["gesundheitsamt-2025.de",116],["coastfashion.com",117],["oasisfashion.com",117],["warehousefashion.com",117],["misspap.com",117],["karenmillen.com",117],["boohooman.com",117],["nebo.app",118],["groupeonepoint.com",119],["edpsciences.org",120],["bemmaisseguro.com",121],["johnmuirhealth.com",122],["scheidegger.nl",123],["transparency.fb.com",[124,125]],["faq.whatsapp.com",125],["blog.whatsapp.com",125],["www.whatsapp.com",125],["phoenix.de",126],["strato.se",127],["strato.de",127],["mishcon.com",128],["bbva.es",130],["bbvauk.com",130],["bbva.be",130],["bbva.fr",130],["bbva.it",130],["bbva.pt",130],["suntech.cz",131],["digikey.co.za",132],["digikey.cn",132],["digikey.ee",132],["digikey.at",132],["digikey.be",132],["digikey.bg",132],["digikey.cz",132],["digikey.dk",132],["digikey.fi",132],["digikey.fr",132],["digikey.de",132],["digikey.gr",132],["digikey.hu",132],["digikey.ie",132],["digikey.it",132],["digikey.lv",132],["digikey.lt",132],["digikey.lu",132],["digikey.nl",132],["digikey.no",132],["digikey.pl",132],["digikey.pt",132],["digikey.ro",132],["digikey.sk",132],["digikey.si",132],["digikey.es",132],["digikey.se",132],["digikey.ch",132],["digikey.co.uk",132],["digikey.co.il",132],["digikey.com.mx",132],["digikey.ca",132],["digikey.com.br",132],["digikey.co.nz",132],["digikey.com.au",132],["digikey.co.th",132],["digikey.tw",132],["digikey.kr",132],["digikey.sg",132],["digikey.ph",132],["digikey.my",132],["digikey.jp",132],["digikey.in",132],["digikey.hk",132],["digikey.com",132],["eurosupps.nl",133],["pathe.nl",134],["makelaarsland.nl",135],["nordania.dk",136],["365direkte.no",136],["danskebank.lv",136],["danskebank.lt",136],["danskebank.no",136],["danskebank.fi",136],["danskebank.dk",136],["danskebank.com",136],["danskebank.se",136],["danskebank.co.uk",136],["danskeci.com",136],["danicapension.dk",136],["gewerbegebiete.de",137],["visti.it",138],["balay.es",139],["constructa.com",139],["gaggenau.com",139],["talksport.com",140],["loudersound.com",140],["impulse.de",140],["pcgamer.com",140],["infoworld.com",140],["kiplinger.com",140],["omni.se",140],["it-times.de",140],["bitcoinmagazine.com",140],["deliciousmagazine.co.uk",140],["upday.com",140],["deutschlandcard.de",140],["szbz.de",140],["free-fonts.com",140],["lieferzeiten.info",140],["vice.com",140],["newsnow.co.uk",140],["out.com",140],["streampicker.de",140],["radiotimes.com",140],["nowtv.com",140],["kochbar.de",140],["toggo.de",140],["am-online.com",140],["n-tv.de",140],["newsandstar.co.uk",140],["tag24.de",140],["weltkunst.de",140],["noveauta.sk",140],["pnn.de",140],["economist.com",140],["crash.net",140],["norwaytoday.info",140],["insider.com",140],["preis.de",140],["ibroxnoise.co.uk",140],["celtsarehere.com",140],["nufcblog.co.uk",140],["sport1.de",140],["techconnect.com",140],["followfollow.com",140],["thespun.com",140],["mazdas247.com",140],["fastcar.co.uk",140],["vitalfootball.co.uk",140],["audi-sport.net",140],["bumble.com",140],["arcamax.com",140],["dilbert.com",140],["givemesport.com",140],["dartsnews.com",140],["gpfans.com",140],["justjared.com",140],["justjaredjr.com",140],["finanzen.at",140],["flights-idealo.co.uk",140],["idealo.com",140],["idealo.se",140],["idealo.nl",140],["idealo.pl",140],["idealo.pt",140],["idealo.fi",140],["idealo.dk",140],["idealo.no",140],["idealo.in",140],["idealo.at",140],["ladenzeile.at",140],["berliner-zeitung.de",140],["urbia.de",140],["essen-und-trinken.de",140],["wetter.de",140],["rtl-living.de",140],["vox.de",140],["ladenzeile.de",140],["advocate.com",140],["idealo.de",140],["wigantoday.net",140],["economistgroup.com",140],["transfermarkt.nl",140],["transfermarkt.es",140],["transfermarkt.pl",140],["transfermarkt.pt",140],["transfermarkt.at",140],["transfermarkt.it",140],["transfermarkt.fr",140],["transfermarkt.de",140],["transfermarkt.be",140],["transfermarkt.co.uk",140],["transfermarkt.us",140],["footballfancast.com",140],["cio.com",140],["jezebel.com",140],["splinternews.com",140],["denofgeek.com",140],["kinja.com",140],["theinventory.com",140],["rollingstone.de",140],["sueddeutsche.de",140],["csoonline.com",140],["tvmovie.de",140],["testberichte.de",140],["pcgameshardware.de",140],["4players.de",140],["guj.de",140],["bild.de",140],["wieistmeineip.de",140],["testbild.de",140],["stylebook.de",140],["skygroup.sky",140],["speisekarte.de",140],["haeuser.de",140],["cmo.com.au",140],["pcworld.co.nz",140],["idealo.it",140],["transfermarkt.jp",140],["transfermarkt.co.id",140],["autoexpress.co.uk",140],["transfermarkt.com",140],["webwinkel.tubantia.nl",140],["shopalike.nl",140],["autoweek.nl",140],["pcworld.es",140],["macworld.es",140],["idealo.es",140],["businessinsider.es",140],["motor.es",140],["autobild.es",140],["driving.co.uk",140],["stern.de",140],["pcgames.de",140],["sport.de",140],["idealo.fr",140],["tori.fi",140],["snow-forecast.com",140],["tidende.dk",140],["kraloyun.com",140],["arnnet.com.au",140],["bunte.de",140],["techbook.de",140],["metal-hammer.de",140],["macworld.co.uk",140],["maxisciences.com",140],["ohmymag.com",140],["voici.fr",140],["geo.de",140],["businessinsider.de",140],["meinestadt.de",140],["politico.eu",140],["spieletipps.de",140],["finanznachrichten.de",140],["vtwonen.nl",140],["stol.it",140],["waitrose.com",141],["storyhouseegmont.dk",142],["storyhouseegmont.no",142],["storyhouseegmont.se",142],["egmont.com",142],["nordiskfilm.com",142]]);

const entitiesMap = new Map([]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function removeClass(
    rawToken = '',
    rawSelector = '',
    behavior = ''
) {
    if ( typeof rawToken !== 'string' ) { return; }
    if ( rawToken === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('remove-class', rawToken, rawSelector, behavior);
    const tokens = safe.String_split.call(rawToken, /\s*\|\s*/);
    const selector = tokens
        .map(a => `${rawSelector}.${CSS.escape(a)}`)
        .join(',');
    if ( safe.logLevel > 1 ) {
        safe.uboLog(logPrefix, `Target selector:\n\t${selector}`);
    }
    const mustStay = /\bstay\b/.test(behavior);
    let timer;
    const rmclass = ( ) => {
        timer = undefined;
        try {
            const nodes = document.querySelectorAll(selector);
            for ( const node of nodes ) {
                node.classList.remove(...tokens);
                safe.uboLog(logPrefix, 'Removed class(es)');
            }
        } catch(ex) {
        }
        if ( mustStay ) { return; }
        if ( document.readyState !== 'complete' ) { return; }
        observer.disconnect();
    };
    const mutationHandler = mutations => {
        if ( timer !== undefined ) { return; }
        let skip = true;
        for ( let i = 0; i < mutations.length && skip; i++ ) {
            const { type, addedNodes, removedNodes } = mutations[i];
            if ( type === 'attributes' ) { skip = false; }
            for ( let j = 0; j < addedNodes.length && skip; j++ ) {
                if ( addedNodes[j].nodeType === 1 ) { skip = false; break; }
            }
            for ( let j = 0; j < removedNodes.length && skip; j++ ) {
                if ( removedNodes[j].nodeType === 1 ) { skip = false; break; }
            }
        }
        if ( skip ) { return; }
        timer = safe.onIdle(rmclass, { timeout: 67 });
    };
    const observer = new MutationObserver(mutationHandler);
    const start = ( ) => {
        rmclass();
        observer.observe(document, {
            attributes: true,
            attributeFilter: [ 'class' ],
            childList: true,
            subtree: true,
        });
    };
    runAt(( ) => {
        start();
    }, /\bcomplete\b/.test(behavior) ? 'idle' : 'loading');
}

function runAt(fn, when) {
    const intFromReadyState = state => {
        const targets = {
            'loading': 1, 'asap': 1,
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
    if ( scriptletGlobals.safeSelf ) {
        return scriptletGlobals.safeSelf;
    }
    const self = globalThis;
    const safe = {
        'Array_from': Array.from,
        'Error': self.Error,
        'Function_toStringFn': self.Function.prototype.toString,
        'Function_toString': thisArg => safe.Function_toStringFn.call(thisArg),
        'Math_floor': Math.floor,
        'Math_max': Math.max,
        'Math_min': Math.min,
        'Math_random': Math.random,
        'Object': Object,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'Object_defineProperties': Object.defineProperties.bind(Object),
        'Object_fromEntries': Object.fromEntries.bind(Object),
        'Object_getOwnPropertyDescriptor': Object.getOwnPropertyDescriptor.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
        'String_fromCharCode': String.fromCharCode,
        'String_split': String.prototype.split,
        'XMLHttpRequest': self.XMLHttpRequest,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'fetch': self.fetch,
        'JSON': self.JSON,
        'JSON_parseFn': self.JSON.parse,
        'JSON_stringifyFn': self.JSON.stringify,
        'JSON_parse': (...args) => safe.JSON_parseFn.call(safe.JSON, ...args),
        'JSON_stringify': (...args) => safe.JSON_stringifyFn.call(safe.JSON, ...args),
        'log': console.log.bind(console),
        // Properties
        logLevel: 0,
        // Methods
        makeLogPrefix(...args) {
            return this.sendToLogger && `[${args.join(' \u205D ')}]` || '';
        },
        uboLog(...args) {
            if ( this.sendToLogger === undefined ) { return; }
            if ( args === undefined || args[0] === '' ) { return; }
            return this.sendToLogger('info', ...args);
            
        },
        uboErr(...args) {
            if ( this.sendToLogger === undefined ) { return; }
            if ( args === undefined || args[0] === '' ) { return; }
            return this.sendToLogger('error', ...args);
        },
        escapeRegexChars(s) {
            return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true, expect: true };
            }
            const expect = (options.canNegate !== true || pattern.startsWith('!') === false);
            if ( expect === false ) {
                pattern = pattern.slice(1);
            }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match !== null ) {
                return {
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            if ( options.flags !== undefined ) {
                return {
                    re: new this.RegExp(this.escapeRegexChars(pattern),
                        options.flags
                    ),
                    expect,
                };
            }
            return { pattern, expect };
        },
        testPattern(details, haystack) {
            if ( details.matchAll ) { return true; }
            if ( details.re ) {
                return this.RegExp_test.call(details.re, haystack) === details.expect;
            }
            return haystack.includes(details.pattern) === details.expect;
        },
        patternToRegex(pattern, flags = undefined, verbatim = false) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                const reStr = this.escapeRegexChars(pattern);
                return new RegExp(verbatim ? `^${reStr}$` : reStr, flags);
            }
            try {
                return new RegExp(match[1], match[2] || undefined);
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
            return this.Object_fromEntries(entries);
        },
        onIdle(fn, options) {
            if ( self.requestIdleCallback ) {
                return self.requestIdleCallback(fn, options);
            }
            return self.requestAnimationFrame(fn);
        },
        offIdle(id) {
            if ( self.requestIdleCallback ) {
                return self.cancelIdleCallback(id);
            }
            return self.cancelAnimationFrame(id);
        }
    };
    scriptletGlobals.safeSelf = safe;
    if ( scriptletGlobals.bcSecret === undefined ) { return safe; }
    // This is executed only when the logger is opened
    safe.logLevel = scriptletGlobals.logLevel || 1;
    let lastLogType = '';
    let lastLogText = '';
    let lastLogTime = 0;
    safe.toLogText = (type, ...args) => {
        if ( args.length === 0 ) { return; }
        const text = `[${document.location.hostname || document.location.href}]${args.join(' ')}`;
        if ( text === lastLogText && type === lastLogType ) {
            if ( (Date.now() - lastLogTime) < 5000 ) { return; }
        }
        lastLogType = type;
        lastLogText = text;
        lastLogTime = Date.now();
        return text;
    };
    try {
        const bc = new self.BroadcastChannel(scriptletGlobals.bcSecret);
        let bcBuffer = [];
        safe.sendToLogger = (type, ...args) => {
            const text = safe.toLogText(type, ...args);
            if ( text === undefined ) { return; }
            if ( bcBuffer === undefined ) {
                return bc.postMessage({ what: 'messageToLogger', type, text });
            }
            bcBuffer.push({ type, text });
        };
        bc.onmessage = ev => {
            const msg = ev.data;
            switch ( msg ) {
            case 'iamready!':
                if ( bcBuffer === undefined ) { break; }
                bcBuffer.forEach(({ type, text }) =>
                    bc.postMessage({ what: 'messageToLogger', type, text })
                );
                bcBuffer = undefined;
                break;
            case 'setScriptletLogLevelToOne':
                safe.logLevel = 1;
                break;
            case 'setScriptletLogLevelToTwo':
                safe.logLevel = 2;
                break;
            }
        };
        bc.postMessage('areyouready?');
    } catch(_) {
        safe.sendToLogger = (type, ...args) => {
            const text = safe.toLogText(type, ...args);
            if ( text === undefined ) { return; }
            safe.log(`uBO ${text}`);
        };
    }
    return safe;
}

/******************************************************************************/

const hnParts = [];
try {
    let origin = document.location.origin;
    if ( origin === 'null' ) {
        const origins = document.location.ancestorOrigins;
        for ( let i = 0; i < origins.length; i++ ) {
            origin = origins[i];
            if ( origin !== 'null' ) { break; }
        }
    }
    const pos = origin.lastIndexOf('://');
    if ( pos === -1 ) { return; }
    hnParts.push(...origin.slice(pos+3).split('.'));
}
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
    try { removeClass(...argsList[i]); }
    catch(ex) {}
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

uBOL_removeClass();

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
