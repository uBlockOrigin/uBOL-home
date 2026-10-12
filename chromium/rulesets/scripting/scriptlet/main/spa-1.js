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

// ruleset: spa-1

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_scriptlets($SECRET_ID$) {

/******************************************************************************/

const scriptletGlobals = self[$SECRET_ID$];

if ( scriptletGlobals.origins.length === 0 ) { return; }

/******************************************************************************/

const $hasHostnames$ = true;
const $hasEntities$ = true;
const $hasAncestors$ = false;
const $hasRegexes$ = false;

/******************************************************************************/

const todo = new Set();

if ( $hasHostnames$ ) {
    const scriptletHostnames = /* 487 */ ["1i1.in","atv.pe","mdr.ar","r7.com","gnula.*","leak.pt","rde.lat","tn23.tv","vix.com","movidy.*","safez.es","anitube.*","arlx.site","cuevana.*","depor.com","goyabu.us","los40.com","netcine.*","payad.lat","redisex.*","tivify.tv","topflix.*","tt18.info","3xyaoi.com","acortaz.es","anitube.us","atomixhq.*","atomtt.com","c9n.com.py","cinetux.to","comando.to","csrevo.com","cuevana2.*","cuevana3.*","doceru.com","elmundo.es","escplus.es","fiuxy2.com","fotise.com","futemax.at","g37.com.br","gnula.club","gnulahd.nu","istigo.net","listas.pro","nartag.com","netcinez.*","pcworld.es","pirlotv.es","playdede.*","redirdx.in","rqp.com.bo","sbt.com.br","solopc.net","suaads.com","suaurl.com","subsbr.net","tulink.org","uol.com.br","vtv.com.hn","xataka.com","zpaste.net","animesbr.cc","anitube.vip","askflix.biz","atomohd.com","autotop.net","brazzpw.xyz","cinehax.com","embed69.org","eshentai.tv","espinof.com","fakings.com","fgtd.online","file4go.com","file4go.net","genbeta.com","hartico.com","hentaila.tv","htforum.net","kumanga.com","meocloud.pt","netcinetv.*","novizer.com","nptmedia.tv","nupload.top","okpeliz.com","pelispop.me","pornsub.org","satcesc.com","superhq.net","yyyx.online","zonaaps.com","20minutos.es","3djuegos.com","adclicker.io","anime-jl.net","anime-jl.top","animefire.io","animeflv.net","animeocs.com","anitube.news","aqualapp.com","casperhd.com","chapintv.com","darkmahou.io","deemixer.com","docer.com.ar","embedder.net","enlacito.com","fichajes.com","gashita.info","geeknetic.es","goanimes.vip","gourlpro.com","hentai-id.tv","hentaijl.com","illamadas.es","legendei.net","lineup11.net","luggames.com","manga-mx.com","megafire.net","miukt.com.br","netccine.lat","oliberal.com","otakustv.com","perisxxx.com","playertv.org","plplayer.com","pobreflix.do","redecanais.*","repretel.com","seireshd.com","sussytoons.*","terra.com.br","texto.kom.gt","tioeroge.com","veohentai.io","vernaruto.tv","viciados.net","videosad.net","vitonica.com","xupalace.org","acortados.com","acortalink.me","adslayuda.com","allfeeds.live","animeblix.com","animesup.info","animeyabu.net","animeyabu.org","anitube22.vip","app.prende.tv","bandab.com.br","barmonrey.com","bebesymas.com","cadenaser.com","canale-tv.net","cinemitas.org","cozinhabr.top","cuevana-3.wtf","culinaria.top","darkmahou.org","deemixweb.com","docero.com.br","drstonebr.com","elespanol.com","erosanime.com","firepaste.com","firesload.com","ggames.com.br","gourlcero.com","hentai-ia.com","hentaikai.com","latamtoon.com","lectulandia.*","luratoons.com","mangacrab.com","mangacrab.org","manhastro.net","minhatela.xyz","mundopolo.net","muyzorras.com","netcinebs.lat","nexustc18.com","niusdiario.es","pelismart.com","pkproject.net","playpaste.com","playpaste.net","pobreflix.foo","pridevana.com","redecanais.pk","repelisgt.net","servertwo.xyz","skynovels.net","softwarepc.es","southpark.lat","sub100.com.br","tiohentai.xyz","toonscrab.com","unlimplay.com","vidaextra.com","3djuegospc.com","allcalidad.pro","animefire.plus","animepelix.net","antena7.com.do","applesfera.com","arnolds.com.br","azuretoons.com","blizzpaste.com","botinnifit.com","canal12.com.sv","cine-calidad.*","cinecalidad2.*","cinelatino.net","compucalitv.tv","cuevanapro.org","cuitonline.com","devoracine.com","dicasgeeks.net","doramasmp4.com","ecartelera.com","elcomercio.com","expertplay.net","gadgetzona.net","gourlpaste.com","hinatasoul.com","informacion.es","isekaitube.cfd","laprovincia.es","lura-toons.com","lycantoons.com","meuwindows.com","multipaste.org","mundolucha.com","novelaplay.com","packsmega.info","peliplayhd.org","peliseries.xyz","player.gnula.*","portalyaoi.com","poseidonhd2.co","redecanaistv.*","ricoysuave.com","seriesflix.onl","seriesflixhd.*","seriesperu.com","short.7hd.club","sololatino.net","starckfilmes.*","streamx-hd.com","todo-anime.net","topmanhuas.org","tubeonline.net","uberxviral.com","veo-hentai.com","vertvcable.com","xatakafoto.com","xatakahome.com","xerifetech.com","yomucomics.com","zona-leros.com","animenew.com.br","animeonline.lat","animeshouse.net","atresplayer.com","cineplus123.org","comunidades.net","devilnovels.com","documaniatv.com","emperorscan.com","hentaiporno.xxx","hentaistube.com","hentaitokyo.net","infojobs.com.br","it-swarm-es.com","kitsuneyako.com","latinpornhd.com","levante-emv.com","luchaonline.com","megafilmeshd.si","meutimao.com.br","monoschino2.com","motorpasion.com","mundodevalor.me","mundoxiaomi.com","oceans14.com.br","otakufilmes.org","panelacheia.top","paste4free.site","peliculas8k.com","pelismarthd.com","pelispedia.life","pelisxporno.net","pepeliculas.org","pornolandia.xxx","readhunters.xyz","redecanaistv.pk","seriesmaxhd.com","seriesretro.com","smartdoing.tech","softwareany.net","trendencias.com","verpelis.gratis","warezstream.net","xatakamovil.com","anime-latino.com","aquariumgays.com","cursomecanet.com","dattebayo-br.com","dicasreceita.com","elblogsalmon.com","embedplayer2.xyz","guideautoweb.com","infomatricula.pt","isekaibrasil.com","latinohentai.com","latinohentai.vip","monumental.co.cr","mundodonghua.com","netmovies.com.br","notipostingt.com","otakuanimess.net","player.cuevana.*","playnewserie.xyz","remedioscase.xyz","sejasaudavel.net","seriesflixhd.win","seriesgratis.biz","superflixapi.fit","superflixapi.pro","teleculinaria.pt","todoandroid.live","todostartups.com","tribunaavila.com","tvplusgratis.com","twobluescans.com","xatakandroid.com","3djuegosguias.com","acortame-esto.com","animeonline.ninja","animesonlinecc.us","canal13mexico.com","cinemastervip.com","clickjogos.com.br","coempregos.com.br","compradiccion.com","cuevana2espanol.*","daemon-hentai.com","diaridegirona.cat","dicasgostosas.com","eldiario24hrs.com","futbolfantasy.com","genshinpro.com.br","googleapis.com.do","guiacripto.online","hostingunlock.com","irmaosdotados.net","jogoscompleto.xyz","lectorhub.j5z.xyz","manhwa-latino.com","modescanlator.com","modescanlator.net","mundoperfecto.net","myfirstdollar.org","neworldtravel.com","ouniversodatv.com","outerspace.com.br","paraveronline.org","player.cuevana2.*","player.cuevana3.*","playerflixapi.com","pornoenspanish.es","portecnologia.com","puromarketing.com","qwanturankpro.com","qwanturankpro.net","redeflixapi.store","seriesdonghua.com","superflixapi.buzz","url.firepaste.com","vejaideias.com.br","verfutbollibre.pe","xatakaciencia.com","xatakawindows.com","alarmadefraude.com","animesonliner4.com","baixedetudo.net.br","elcorreogallego.es","foodiesgallery.com","guianoticiario.net","guiavidaesaude.com","httpmangacrab2.com","link-descarga.site","maringapost.com.br","minhasdelicias.com","modsimuladores.com","mundodeportivo.com","sabornutritivo.com","sushianimes.com.br","todamateria.com.br","tuhentaionline.com","tunovelaligera.com","tvserieslatino.com","venevisionplay.com","brjogostorrents.com","chinesetubex.com.es","comandotorrents.org","constanteonline.com","dicasdereceitas.net","empregoestagios.com","financasdeouro.info","financialtrust.info","forodecostarica.com","hardwarepremium.com","hentailegendado.com","minhaconexao.com.br","motorpasionmoto.com","multicanaistt.space","player.pelisgod.com","pymesyautonomos.com","redbolivision.tv.bo","resenhasglobais.com","seriesemcena.com.br","torrentjogos.com.br","tudoesportes.online","aquiyahorajuegos.net","colegialasdeverdad.*","costumbresmexico.com","descargaseriestv.com","diariodegoias.com.br","diariodelviajero.com","directoalpaladar.com","inuyashadowns.com.br","laopiniondezamora.es","megaseriesonline.pro","nutricaohoje.website","play.mercadolibre.cl","player.seriesgod.com","receitascaseiras.xyz","receitasdaora.online","ricasdelicias.online","verdragonball.online","comicspornohentai.com","descargarhentaimf.xyz","dragonball.sullca.com","meuplayeronlinehd.com","negociosecommerce.com","olimpicastereo.com.co","player.malfollado.com","player.poseidonhd2.co","trendenciashombre.com","independentespanol.com","informetecnologico.com","mundohentaioficial.com","player.hentaistube.com","serieslatinoamerica.tv","verpeliculasonline.org","lawebdelprogramador.com","mrvideospornogratis.xxx","raulprietofernandez.net","southparkstudios.com.br","assistirfilmeshdgratis.*","descargaranimehentai.com","play.mercadolibre.com.ar","play.mercadolivre.com.br","player.cuevana2espanol.*","starckfilmestorrent.site","ver-peliculas-online.com","ver-peliculas-online.org","caroloportunidades.com.br","impactoespananoticias.com","receitasoncaseiras.online","cozinha.minhasdelicias.com","gamesperu2021.blogspot.com","jilliandescribecompany.com","infohojeonline.blogspot.com","jornaldacidadeonline.com.br","gamesteelstudio.blogspot.com","videos.mrvideospornogratis.xxx","xn--kcksk7a2bl5le7b6doc1h3f.com","descargas2024gratis.blogspot.com","gamesteelstudioplus.blogspot.com","canalnatelinhaonline.blogspot.com"];
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
        const arglistRefs = /* 487 */ ["174","115,116,117","118","40","197,231","51","197","115,116,117","204,205,206,207,208,209,210,211,212,213,214","261","238","187","31,197","197,230,231","99","85,86","40","132,133,197","238","197","80","254","2","4,201","238","92,167,168,169,170","251","251","115,116,117","72,275,276","155","140","197,231","197,231","179","226","147","240","113","197","224","225","25","40","40","23","60","142","278","330","282","115,116,117","19","238","40,135,136,137,138,139","40,135,136,137,138,139,233,234,235,236","285","67,113","202,203","115,116,117","12,98","222","219","92,167,168,169,170","61","251","69","328","28","338,339","197","98","280","63,64,65","166","84,188","98","182","315","10","83","119","60","49","131","197","197","252","354","176,177","228,229","60","45,46","152","98","238","44,197","293","85,86,197,337","319","197,216","317","103","40","115,116,117","8,9,42","31,197","179","197,216,217","67","122","170","197","85,86","40,238","277","197,216","159","197,302,303","15,16,17","38","175","197,221,340","11","60","134","197,263,264","39","90","197,319,320,321","72","6,72,73,74,75,292","115,116,117","273,274","80","200","154","354","354","197","36","18","98","232","67,113","234","184","257","197,270,272","85,86","85,86","85,86","170","255","157","307,308","178","153","298","72","88","197,253","58","40,43,197","31,197","179","85,86,170","101","197,328","77,340","40","40","40","197,327,328","229","47","269","95,96","106","342","52,53,54,55,56,57","6","238","197","60","26","126,227","197","34","197,222,223","222","351","287","292","197","197","118","40","19,112","220","249,250","106,352,353","29","98","98","354","85,86,337","197,313","115,116,117","98","243","21,22","318","118","97,115,116,117","259","258","38,72","333","338,339","67","296","89","186","180","115,116,117","40","67","40","92,124,125,167,168,169","36","309","36","95,96","13,14","181","237","81","33,305","93,94,198,199","332","345,346,347,348","232","5,286","197,231","6,72,73,74,75,292","192","197,341","197,291","349,350,355","40","197,295","59","197,295","359","342","360","238","326","288,289","98","98","127,128,129","76","120","37","332","189","79","72","310","48","148","40","268","260","331","156","151","24","78","36","118","72","40","197,311,312,313","178","104","98","48","8","68","27","107,108,349,350,356","197","197,231","197","72","266","322","292","354","163","145","114","98","72","197","98","357,358","279","82","170","58","98,178","297","172","40,41","87","72,197,361","72,197,361","115,116,117","40,190,191","160","55,113","85,86","232","197,244","1","245","197,291","242","297","197","1","67","40,123","162","161","342","98","98","67","362","85,86","115,116,117","66","195","92,167,168,169,170","98","197,231","91,314","36","40,88,164","238","130","151","197","110,111","50","267","284","70","299","40","40","304","238","67,113","158","173,185","72","232","232","297,316","32","248","40,123","67","113","197,294","190,191","197","197","284","301","98","98","40","170","30","71","164,165","143,144","62","106","40","157","118","284","193","40,88,109","1,35","306","283","149,150","344","19","194","197","183,271","238","89","176,177","58","67,113","218","7","300","118,146","178","20","197","178","115,116,117","145","100","262","58","105","197","141","92","173","178","98,178","30","71","197","256","323,324,325","197","58","164,165","88","262","265","246","334,335","20","40,123","290","197","232","98","117","40","336","239","72","343","40","329","103,241","19,112","72","281","323,324,325","323,324,325","232","3","343","343","164,165","118","40,247","171","90,196","197","102,215","40","102","197","197","40","102","121"];
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
    const arglists = /* 363 */ ["","15,0","22,1,2","23,3,2","12,4,5","23,6,7","15,8","14,9","22,1,10","23,11,12","17,13,14,15","22,1,16","14,17","15,18","14,19","22,20,21","14,21","24,21","12,6,22","50","15,23","14,19,24","15,25","23,26,27","22,28,29","12,30,31","15,32","11,33,34","14,35","11,36,37","12,26,10","12,38,2","14,39","22,1,40","14,10","14,41","15,42","14,40","11,43,34","22,1,44","15,45","14,46","23,6,47","22,1,48","12,26,27","31,49","12,38,50","22,28,45","12,38,10","14,29","36,51","11,52,34","15,53","15,54","15,55","15,56","15,57","35,58","12,38,0","22,59,60","36,61","12,38,62","22,1,63","1,64,65,66","26,67,65,66","15,68","19,69","15,70","23,6,71","19,71","36,72","11,73,74","17,75,76","14,77,78","11,79,80","11,81,74","23,82,83","31,84","11,85,86","15,87","15,88","14,89","14,90","24,91","13,92","14,93","15,94","13,95","14,96","1,97,65,66","12,26,98","23,26,77","11,99,34","14,100","15,101","19,102","12,103,104","22,105","11,106,37","22,28,107","35,108","19,109","12,38,98","13,45","19,110","19,111","19,112","14,113","15,114","1,115,65,66","14,116","1,117,65,66","15,118","11,119,120","22,28,121","11,122,123","11,124,86","15,125","11,126,86","11,127,34","14,128","12,129,130","11,131,74","15,132","19,133","12,134,98","11,135,37","14,77","22,136,77","11,137,34","11,138,34","15,139","23,140,141","23,142,141","12,143,144","15,145","14,146","24,147","11,148,80","12,149,150","12,143,151","15,152","19,153","14,154","12,155,156","14,157","13,125","14,158","14,16","31,159","19,160","14,0","19,161","11,162,37","11,163,86","19,10","11,164,86","11,165,34","11,166,80","12,167,168","15,48","19,169","11,167,170","19,171","13,68","14,172","12,103,77","1,173,65,66","14,174","15,175","13,176","19,177","22,2","19,178","19,179","31,10","22,28,180","11,181,74","11,182,80","11,183,86","12,143,184","31,185","14,186","11,10,86","11,187,86","11,188,37","11,189,86","11,190,191","11,192,191","12,149,193","14,194","11,195,86","11,196,136","1,197,65,66","19,198","11,199,34","12,149,200","10","19,201","12,202,203","1,204,65,66","11,205,34","11,206,123","11,207,123","7,65,208","7,209,210","7,211","7,212","7,213","7,214","7,215","7,216","7,217","47,218,219","46,220,136,221","26,222,65,66","12,38,200","19,223","14,224","31,225","7,65,226","11,227,191","12,143,200","12,228,229","22,1,229","17,75,230","11,231,136","11,232,123","31,233","31,234","22,28,77","19,235","26,236,65,66","11,237,34","14,238","12,143,239","12,240,6","12,149,241","11,242,80","11,243,34","19,244","31,245","14,246","1,247,65,248","11,249,34","26,250,65,248","22,59,251","1,252,65,248","1,253,65,248","11,195,74","12,149,254","10,255","19,256","26,257,136,248","26,258,136,248","7,259,209","1,173,260,248","19,261","19,262","19,263","19,264","12,134,265","10,266","11,59,191","11,267,191","36,268","11,269,74","22,28,270","11,271,136","1,272,65,248","7,273","22,1,274","10,275","19,276","12,277,278","19,279","19,280","12,143,281","19,282","19,283","11,284,34","19,285","10,286","19,287","1,288,65,66","1,289","22,59,136,290,291","22,1,292","19,293","10,294,191","11,295,86","11,296,86","22,59,77","23,240,297","22,59,298","22,59,299","22,1,300","10,294","10,136,191","31,301","31,205","22,1,302","12,38,303","22,136,303","22,59,304","22,59,305","11,306,307","12,149,308","22,59,309","7,310","12,167,311","11,312,74","22,1,312","22,59,313","19,314","7,315","22,59,316","23,317,318","12,38,319","19,320","23,26,321","17,75,322","12,38,323","11,324,74","7,325","46,326,136,221","19,327","11,328,34","22,59,329","14,330","11,331,86","22,1,332","22,59,321","26,333,65,66","31,334","31,335","22,136,198","12,336,337","11,338,34","11,339,34","22,136,340","12,38,341","12,342,343","1,344,65,66","12,345,346","11,347,80","11,348,80","11,349,80","17,75,350","22,59,351","12,11,294","17,75,352","23,353,354","12,149,354","22,59,200","11,355,86","11,356,34","1,357,65,66","17,75,358","12,149,359","12,103,360","12,38,361","19,362"];
    const args = /* 363 */ ["adsbygoogle","DOMContentLoaded","detectAdBlock","console.log","RegExp.prototype.test","/detect/i","document.getElementById","triggerBlock","mode:no-cors","adsenseCargo","adblock","setTimeout","start","onerror","script[src*=\"googlesyndication.com\"]","asap",".offsetHeight === 0","offsetHeight===0","/google-analytics\\.com|pubadx\\.one/","offsetHeight","visibilitychange","bs()","/pagead2\\.googlesyndication\\.com|adsbygoogle/","cloudfront.net","300","doubleclick","document.createElement","detect","load","innerHTML","Image","error","/ads/banner","popunders","noopFunc","/\\.offsetHeight\\s*?===\\s*?0/","adsBlocked","false","EventTarget.prototype.addEventListener","scriptObj","bait","detected","googlesyndication","checkAdBlock","offsetHeight === 0","pagead2.googlesyndication.com","/=window\\.setInterval\\([\\s\\S]*?\\.push\\(/","showAdblockAlert","/adsbygoogle.js","__ANTI_ADBLOCK_CORE__","/detect|\\.onerror|window\\.open/","decodeURIComponent(atob","advanced_ads_check_adblocker","googleads.g.doubleclick.net","googletagmanager.com","connect.facebook.net","static.ads-twitter.com","google-analytics.com","ULTIMATE_BAIT_REMOVED","click","overlay-notification","break;case",".offsetParent===","/window\\.getComputedStyle|adblock-/","unlock","*","0.001","seconds","popads.net","blockAdBlock","method:HEAD","isAdBlocked","String.fromCharCode(_0x","_an.ABMode","undefined","href","a[href]#clickfakeplayer","_0x","500","adClickCount","0","close","atob","wp-content/","checkAdsStatus","DHAntiAdBlocker","true","/pagead2\\.googlesyndication.com/ method:HEAD","www3.doubleclick.net","siteAccessPopup()","Por favor","console[_0x","widgets.outbrain.com","window.getComputedStyle","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","widgets.outbrain.com/outbrain.js","hasAdblock","contador","adsbygoogle.js","detectedAdblock","ad blocker","/mopinion\\.com|iubenda\\.com|bannersnack\\.com|unblockia\\.com|googlesyndication\\.com/","block_ads","fetch","/alert|bloqueador|\\.catch|\\.type/","adBlockerOn","hasAdblocker","banner-ads",".clientHeight","setNptTechAdblockerCookie","possivelAdblockDetectado","eazyAdUnBlockerHttp","antiAdBlockerStyle","Promise[\\'all\\'](urls","/googlesyndication\\.com|iubenda\\.com|unblockia\\.com|bannersnack\\.com|mopinion\\.com/",".html(","/adBlock|\\.height\\(\\)/","playFunction","imasdk.googleapis.com","AdBlockDetector.prototype.test","falseFunc","detect-modal","googletag","{}","googletag._loaded_","securepubads.g.doubleclick.net/pagead/ppub_config","canRunAds","blockAdBlock._options","checkAdblockUser","addEventListener","displayMessage","adManagerBlocked","call-zone-adxs","adBlockFunction","document.getElementsByTagName","$MICROSITE_INFO.blockAdBlock","","adblock.check","app.AdBlock.init","/pagead2\\.googlesyndication\\.com|ads-api\\.twitter\\.com/","alert","eval","history.go","$","blockWall","/^(?!.*(chrome-extension:)).*$/ method:HEAD","Por favor, desative","/adblock|Por favor, desative|adsbygoogle\\.js/","cdo","document.addEventListener",".innerHTML","!document.getElementById(","ads-twitter.com","Object.prototype.autoRecov","/Adblock|\\.height\\(\\)/","jQuery","/Adblock|dummy|detect/","]]=== 0",".adsbygoogle","adregain_wall","ad_nodes","hb_now","Object.prototype.adblockerEnabled","adsbygoogle.loaded","adBlockCheck","pp_show_popupmessage","easySettings.adblock","onload","AdBlock","adblockDetected","null","gothamBatAdblock","/hasAdblock|window\\.getComputedStyle/","PLAYER LIBERADO","/hasAdblock|detectadb|ad-placement/","/outbrain\\.com|adligature\\.com|quantserve\\.com|srvtrck\\.com/","//cdn.taboola.com/libtrc/unpkg/tfa.js","Bl0ckAdBl0ckCo","ppAdblocks","mMCheckAgainBlock","daadb_get_data","adsbygoogle.length","WSL2.config.enableAdblockEcommerce","ads_unblocked","Adblock","ai_front","cicklow_","better_ads_adblock","adBlockDetected","isAdsDisplayed","ATESTADO","1","Lata","/;return \\{clear:function\\(\\)\\{/","/Tamamo_Blocker|aadb_recheck/","loadingAds","dclm_ajax_var.disclaimer_redirect_url","e(!0)","popunder","ShowRewards","window.open","userout","String.prototype.concat","popup","resumeVideoFromAd","initPopunder","URL_VAST_YOUTUBE","__configuredDFPTags","vast_meta_url","ads","ads.policy.skipMode","vmap_ad_breaks interstitials","vmap_ad_breaks preroll","vmap_ad_breaks midroll-1","vmap_ad_breaks midroll-2","vmap_ad_breaks midroll-3","vmap_ad_breaks midroll-4","vmap_ad_breaks midroll-5","type=ad",".m3u8","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".mp.lura.live/prod/\")]] | //*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"][.//SegmentList[@presentationTimeOffset=\"0\"]])",".mpd","getid","initPu","adJsView","redirectpage","*.media.*.advertisement_id","contadorClics","enlace","document.write","li[onclick^=\"go_to_player\"] > a[target=\"_blank\"][href]","Object.prototype.adSlot","google.ima.OmidVerificationVendor","exopop","protData","cJsEdge","countdown","acdl","window.location.href","notficationAd","open","excludeDomains","global.noobMaxTry","player.preroll","lolaop","pUrlArray","adsdirect","videoliberado","0.02","anunciotag",".style.display","loadXMLDoc","PLAYER","liberaDownload","create_","!/download\\/|link|atomtt\\.com\\//","adk_pdisp","Loading...","adsHandle_noclick","ads breaks cuepoints times","10000","popurl","the_crakien","allclick_Public","checkCookieClick","onclick","?key=","clickd","_impspcabe","xxxStore","/_0x[\\s\\S]*?parentNode[\\s\\S]*?appendChild/","vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads","redirect","rot_url pop_type","videoTag","passeura","scriptwz_url","host","window.btoa","smrtSB","asgPopScript",".one(\"click\"","smrtSP","_cpp","a_consola","pub","redirdx.in/go/","Pub2","/atualizar|hided/","tick","elements","a.reward_ads[href]","inyectarBanner","javaUpdateAjax","_blank","Object.prototype.prerollShown","__POP_AD_LOCK__","openEnlace","openFullscreenAdOnce","localStorage","overlay","SmartAdsSafeStorage","NEW_LINK","trigger","preventDefault","redirigi","sg_gabarito_ads_config.adFrequency","1000","adUrl","openAdOnce","playerAds ads","puTS","__SMARTLINKS__","random","pumConfig","vast popup adblock","about:blank","JSON.stringify","data:text/javascript","noopener noreferrer","LieDetector","Popunder","a[data-stream][href][target=\"_blank\"]","window.gpp","__PRELOADED_STATE__.view.components.player.playbackContext.ads","adn_placement components.player.playbackContext.ads adnPlacement avails.* dashAvailabilityStartTime hlsAnchorMediaSequenceNumber nextToken nonLinearAvails","xpath(//*[name()=\"Period\"][./*[name()=\"EventStream\"][contains(@schemeIdUri, \":advertising-\")]] | //*[name()=\"Period\"]/@start)","PopunderData","showPopunder","clickCount","adpreload","vastPlayer.completed","sourceAd","start_preroll","anuncioConfig","setRandomBanner","Node.prototype.insertBefore","popns","VASTVideoPlayer","go_to_playerVast","/abrirVentanasEmergentes|abrirNuevaVentana|Popunder/","pop[_0x","Storage","/interstitial|redirectCount/","pframe","setInterval","doTabUnder","cnt1max","ifrconta","clickmax","#frm > a[href][onclick]","manejar","#fakeplayer > a","JSON.parse","showPopup","redirigido","redirigir","w-content","a.elementor-icon[target=\"_blank\"][rel][href]","window.location;","anuncios","/Popunder|Popup/","area51"];
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
})("eb67c4fa-700a-4c20-bf4f-852ab9b7ca91");

void 0;
