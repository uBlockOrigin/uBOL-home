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
    const scriptletHostnames = /* 490 */ ["1i1.in","atv.pe","mdr.ar","r7.com","gnula.*","leak.pt","rde.lat","tn23.tv","vix.com","movidy.*","safez.es","anitube.*","arlx.site","cuevana.*","depor.com","goyabu.us","los40.com","netcine.*","payad.lat","redisex.*","tivify.tv","topflix.*","tt18.info","3xyaoi.com","acortaz.es","anitube.us","atomixhq.*","atomtt.com","c9n.com.py","cinetux.to","comando.to","csrevo.com","cuevana2.*","cuevana3.*","doceru.com","elmundo.es","escplus.es","fiuxy2.com","fotise.com","futemax.at","g37.com.br","gnula.club","gnulahd.nu","istigo.net","listas.pro","nartag.com","netcinez.*","pcworld.es","pirlotv.es","playdede.*","redirdx.in","rqp.com.bo","sbt.com.br","solopc.net","suaads.com","suaurl.com","subsbr.net","tulink.org","uol.com.br","vtv.com.hn","xataka.com","zpaste.net","animesbr.cc","anitube.vip","askflix.biz","atomohd.com","autotop.net","brazzpw.xyz","cinehax.com","embed69.org","eshentai.tv","espinof.com","fakings.com","fgtd.online","file4go.com","file4go.net","genbeta.com","hartico.com","hentaila.tv","htforum.net","kumanga.com","meocloud.pt","netcinetv.*","novizer.com","nptmedia.tv","nupload.top","okpeliz.com","pelispop.me","pornsub.org","satcesc.com","superhq.net","yyyx.online","zonaaps.com","20minutos.es","3djuegos.com","adclicker.io","anime-jl.net","anime-jl.top","animefire.io","animeflv.net","animeocs.com","anitube.news","aqualapp.com","casperhd.com","chapintv.com","darkmahou.io","deemixer.com","docer.com.ar","embedder.net","enlacito.com","fichajes.com","gashita.info","geeknetic.es","goanimes.vip","gourlpro.com","hentai-id.tv","hentaijl.com","illamadas.es","legendei.net","lineup11.net","luggames.com","manga-mx.com","megafire.net","miukt.com.br","netccine.lat","oliberal.com","otakustv.com","perisxxx.com","playertv.org","plplayer.com","pobreflix.do","redecanais.*","repretel.com","seireshd.com","sussytoons.*","terra.com.br","texto.kom.gt","tioeroge.com","veohentai.io","vernaruto.tv","viciados.net","videosad.net","vitonica.com","xupalace.org","acortados.com","acortalink.me","adslayuda.com","allfeeds.live","animeblix.com","animesup.info","animeyabu.net","animeyabu.org","anitube22.vip","app.prende.tv","bandab.com.br","barmonrey.com","bebesymas.com","cadenaser.com","canale-tv.net","cinemitas.org","cozinhabr.top","cuevana-3.wtf","culinaria.top","darkmahou.org","deemixweb.com","docero.com.br","drstonebr.com","elespanol.com","erosanime.com","firepaste.com","firesload.com","ggames.com.br","gourlcero.com","hentai-ia.com","hentaikai.com","latamtoon.com","lectulandia.*","luratoons.com","mangacrab.com","mangacrab.org","manhastro.net","minhatela.xyz","mundopolo.net","muyzorras.com","netcinebs.lat","nexustc18.com","niusdiario.es","pelismart.com","pkproject.net","playpaste.com","playpaste.net","pobreflix.foo","pridevana.com","redecanais.pk","repelisgt.net","servertwo.xyz","skynovels.net","softwarepc.es","southpark.lat","sub100.com.br","tiohentai.xyz","toonscrab.com","unlimplay.com","vidaextra.com","3djuegospc.com","allcalidad.pro","animefire.plus","animepelix.net","antena7.com.do","applesfera.com","arnolds.com.br","azuretoons.com","blizzpaste.com","botinnifit.com","canal12.com.sv","cine-calidad.*","cinecalidad2.*","cinelatino.net","compucalitv.tv","cuevanapro.org","cuitonline.com","devoracine.com","dicasgeeks.net","doramasmp4.com","ecartelera.com","elcomercio.com","expertplay.net","gadgetzona.net","gourlpaste.com","hinatasoul.com","informacion.es","isekaitube.cfd","laprovincia.es","lura-toons.com","lycantoons.com","meuwindows.com","multipaste.org","mundolucha.com","novelaplay.com","packsmega.info","peliplayhd.org","peliseries.xyz","player.gnula.*","portalyaoi.com","poseidonhd2.co","redecanaishd.*","redecanaistv.*","ricoysuave.com","seriesflix.onl","seriesflixhd.*","seriesperu.com","short.7hd.club","sololatino.net","starckfilmes.*","streamx-hd.com","todo-anime.net","topmanhuas.org","tubeonline.net","uberxviral.com","veo-hentai.com","vertvcable.com","xatakafoto.com","xatakahome.com","xerifetech.com","yomucomics.com","zona-leros.com","animenew.com.br","animeonline.lat","animeshouse.net","atresplayer.com","cineplus123.org","comunidades.net","devilnovels.com","documaniatv.com","emperorscan.com","hentaiporno.xxx","hentaistube.com","hentaitokyo.net","infojobs.com.br","it-swarm-es.com","kitsuneyako.com","latinpornhd.com","levante-emv.com","luchaonline.com","megafilmeshd.si","meutimao.com.br","monoschino2.com","motorpasion.com","mundodevalor.me","mundoxiaomi.com","oceans14.com.br","otakufilmes.org","panelacheia.top","paste4free.site","peliculas8k.com","pelismarthd.com","pelispedia.life","pelisxporno.net","pepeliculas.org","pornolandia.xxx","readhunters.xyz","redecanaistv.pk","seriesmaxhd.com","seriesretro.com","smartdoing.tech","softwareany.net","trendencias.com","verpelis.gratis","warezstream.net","xatakamovil.com","anime-latino.com","aquariumgays.com","cursomecanet.com","dattebayo-br.com","dicasreceita.com","elblogsalmon.com","embedplayer2.xyz","guideautoweb.com","infomatricula.pt","isekaibrasil.com","latinohentai.com","latinohentai.vip","monumental.co.cr","mundodonghua.com","netmovies.com.br","notipostingt.com","otakuanimess.net","player.cuevana.*","playnewserie.xyz","remedioscase.xyz","sejasaudavel.net","seriesflixhd.win","seriesgratis.biz","superflixapi.fit","superflixapi.pro","teleculinaria.pt","todoandroid.live","todostartups.com","tribunaavila.com","tvplusgratis.com","twobluescans.com","xatakandroid.com","3djuegosguias.com","acortame-esto.com","animeonline.ninja","animesonlinecc.us","canal13mexico.com","cinemastervip.com","clickjogos.com.br","coempregos.com.br","compradiccion.com","cuevana2espanol.*","daemon-hentai.com","diaridegirona.cat","dicasgostosas.com","eldiario24hrs.com","futbolfantasy.com","genshinpro.com.br","googleapis.com.do","guiacripto.online","hostingunlock.com","irmaosdotados.net","jogoscompleto.xyz","lectorhub.j5z.xyz","manhwa-latino.com","modescanlator.com","modescanlator.net","mundoperfecto.net","myfirstdollar.org","neworldtravel.com","ouniversodatv.com","outerspace.com.br","paraveronline.org","player.cuevana2.*","player.cuevana3.*","playerflixapi.com","pornoenspanish.es","portecnologia.com","puromarketing.com","qwanturankpro.com","qwanturankpro.net","redeflixapi.store","seriesdonghua.com","superflixapi.buzz","url.firepaste.com","vejaideias.com.br","verfutbollibre.pe","xatakaciencia.com","xatakawindows.com","alarmadefraude.com","animesonliner4.com","baixedetudo.net.br","elcorreogallego.es","foodiesgallery.com","guianoticiario.net","guiavidaesaude.com","httpmangacrab2.com","link-descarga.site","maringapost.com.br","minhasdelicias.com","modsimuladores.com","mundodeportivo.com","redecanaishd.forum","sabornutritivo.com","sushianimes.com.br","todamateria.com.br","tuhentaionline.com","tunovelaligera.com","tvserieslatino.com","venevisionplay.com","brjogostorrents.com","chinesetubex.com.es","comandotorrents.org","constanteonline.com","dicasdereceitas.net","empregoestagios.com","financasdeouro.info","financialtrust.info","forodecostarica.com","hardwarepremium.com","hentailegendado.com","minhaconexao.com.br","motorpasionmoto.com","multicanaistt.space","player.pelisgod.com","pymesyautonomos.com","redbolivision.tv.bo","resenhasglobais.com","seriesemcena.com.br","torrentjogos.com.br","tudoesportes.online","aquiyahorajuegos.net","colegialasdeverdad.*","costumbresmexico.com","descargaseriestv.com","diariodegoias.com.br","diariodelviajero.com","directoalpaladar.com","inuyashadowns.com.br","laopiniondezamora.es","megaseriesonline.pro","nutricaohoje.website","play.mercadolibre.cl","player.seriesgod.com","receitascaseiras.xyz","receitasdaora.online","redecanaishd.courses","ricasdelicias.online","verdragonball.online","comicspornohentai.com","descargarhentaimf.xyz","dragonball.sullca.com","meuplayeronlinehd.com","negociosecommerce.com","olimpicastereo.com.co","player.malfollado.com","player.poseidonhd2.co","trendenciashombre.com","independentespanol.com","informetecnologico.com","mundohentaioficial.com","player.hentaistube.com","serieslatinoamerica.tv","verpeliculasonline.org","lawebdelprogramador.com","mrvideospornogratis.xxx","raulprietofernandez.net","southparkstudios.com.br","assistirfilmeshdgratis.*","descargaranimehentai.com","play.mercadolibre.com.ar","play.mercadolivre.com.br","player.cuevana2espanol.*","starckfilmestorrent.site","ver-peliculas-online.com","ver-peliculas-online.org","caroloportunidades.com.br","impactoespananoticias.com","receitasoncaseiras.online","cozinha.minhasdelicias.com","gamesperu2021.blogspot.com","jilliandescribecompany.com","infohojeonline.blogspot.com","jornaldacidadeonline.com.br","gamesteelstudio.blogspot.com","videos.mrvideospornogratis.xxx","xn--kcksk7a2bl5le7b6doc1h3f.com","descargas2024gratis.blogspot.com","gamesteelstudioplus.blogspot.com","canalnatelinhaonline.blogspot.com"];
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
        const arglistRefs = /* 490 */ ["176","117,118,119","120","42","199,233","53","199","117,118,119","206,207,208,209,210,211,212,213,214,215,216","263","240","189","31,199","199,232,233","101","87,88","42","134,135,199","240","199","82","256","2","4,203","240","94,169,170,171,172","253","253","117,118,119","74,277,278","157","142","199,233","199,233","181","228","149","242","115","199","226","227","25","42","42","23","62","144","280","333","284","117,118,119","19","240","42,137,138,139,140,141","42,137,138,139,140,141,235,236,237,238","288","69,115","204,205","117,118,119","12,100","224","221","94,169,170,171,172","63","253","71","331","28","341,342","199","100","282","65,66,67","168","86,190","100","184","318","10","85","121","62","51","133","199","199","254","357","178,179","230,231","62","47,48","154","100","240","46,199","296","87,88,199,340","322","199,218","320","105","42","117,118,119","8,9,44","31,199","181","199,218,219","69","124","172","199","87,88","42,240","279","199,218","161","199,305,306","15,16,17","40","177","199,223,343","11","62","136","199,265,266","41","92","199,322,323,324","74","6,74,75,76,77,295","117,118,119","275,276","82","202","156","357","357","199","38","18","100","234","69,115","236","186","259","199,272,274","87,88","87,88","87,88","172","257","159","310,311","180","155","301","74","90","199,255","60","42,45,199","31,199","181","87,88,172","103","199,331","79,343","42","42","42","199,330,331","231","49","271","97,98","108","345","54,55,56,57,58,59","6","240","199","62","26","128,229","199","36","199,224,225","224","354","290","295","199","199","120","42","19,114","222","251,252","108,355,356","29","100","100","357","87,88,340","199,316","117,118,119","100","245","21,22","321","120","99,117,118,119","261","260","40,74","336","341,342","69","299","91","188","182","117,118,119","42","69","42","94,126,127,169,170,171","38","312","38","97,98","13,14","183","239","83","33,34,35,308","95,96,200,201","335","348,349,350,351","234","5,289","199,233","287","6,74,75,76,77,295","194","199,344","199,294","352,353,358","42","199,298","61","199,298","362","345","363","240","329","291,292","100","100","129,130,131","78","122","39","335","191","81","74","313","50","150","42","270","262","334","158","153","24","80","38","120","74","42","199,314,315,316","180","106","100","50","8","70","27","109,110,352,353,359","199","199,233","199","74","268","325","295","357","165","147","116","100","74","199","100","360,361","281","84","172","60","100,180","300","174","42,43","89","74,199,364","74,199,364","117,118,119","42,192,193","162","57,115","87,88","234","199,246","1","247","199,294","244","300","199","1","69","42,125","164","163","345","100","100","69","365","87,88","117,118,119","68","197","94,169,170,171,172","100","199,233","93,317","38","42,90,166","240","132","153","199","112,113","52","269","286","72","302","42","42","307","240","69,115","160","175,187","74","234","234","300,319","32","250","42,125","69","115","199,297","192,193","199","199","286","304","100","100","42","172","30","73","166,167","145,146","64","108","42","159","120","286","195","287","42,90,111","1,37","309","285","151,152","347","19","196","199","185,273","240","91","178,179","60","69,115","220","7","303","120,148","180","20","199","180","117,118,119","147","102","264","60","107","199","143","94","175","180","100,180","30","73","199","258","326,327,328","199","60","166,167","287","90","264","267","248","337,338","20","42,125","293","199","234","100","119","42","339","241","74","346","42","332","105,243","19,114","74","283","326,327,328","326,327,328","234","3","346","346","166,167","120","42,249","173","92,198","199","104,217","42","104","199","199","42","104","123"];
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
    const arglists = /* 366 */ ["","15,0","22,1,2","23,3,2","12,4,5","23,6,7","15,8","14,9","22,1,10","23,11,12","17,13,14,15","22,1,16","14,17","15,18","14,19","22,20,21","14,21","24,21","12,6,22","50","15,23","14,19,24","15,25","23,26,27","22,28,29","12,30,31","15,32","11,33,34","14,35","11,36,37","12,26,10","12,38,2","14,39","14,40","11,41,37","22,1,42","14,10","14,43","15,44","14,42","11,45,34","22,1,46","15,47","14,48","23,6,49","22,1,50","12,26,27","31,51","12,38,52","22,28,47","12,38,10","14,29","36,53","11,54,34","15,55","15,56","15,57","15,58","15,59","35,60","12,38,0","22,61,62","36,63","12,38,64","22,1,65","1,66,67,68","26,69,67,68","15,70","19,71","15,72","23,6,73","19,73","36,74","11,75,76","17,77,78","14,79,80","11,81,82","11,83,76","23,84,85","31,86","11,87,88","15,89","15,90","14,91","14,92","24,93","13,94","14,95","15,96","13,97","14,98","1,99,67,68","12,26,100","23,26,79","11,101,34","14,102","15,103","19,104","12,105,106","22,107","11,108,37","22,28,109","35,110","19,111","12,38,100","13,47","19,112","19,113","19,114","14,115","15,116","1,117,67,68","14,118","1,119,67,68","15,120","11,121,122","22,28,123","11,124,125","11,126,88","15,127","11,128,88","11,129,34","14,130","12,131,132","11,133,76","15,134","19,135","12,136,100","11,137,37","14,79","22,138,79","11,139,34","11,140,34","15,141","23,142,143","23,144,143","12,145,146","15,147","14,148","24,149","11,150,82","12,151,152","12,145,153","15,154","19,155","14,156","12,157,158","14,159","13,127","14,160","14,16","31,161","19,162","14,0","19,163","11,164,37","11,165,88","19,10","11,166,88","11,167,34","11,168,82","12,169,170","15,50","19,41","11,169,171","19,172","13,70","14,173","12,105,79","1,174,67,68","14,175","15,176","13,177","19,178","22,2","19,179","19,180","31,10","22,28,181","11,182,76","11,183,82","11,184,88","12,145,185","31,186","14,187","11,10,88","11,188,88","11,189,37","11,190,88","11,191,192","11,193,192","12,151,194","14,195","11,196,88","11,197,138","1,198,67,68","19,199","11,200,34","12,151,201","10","19,202","12,203,204","1,205,67,68","11,206,34","11,207,125","11,208,125","7,67,209","7,210,211","7,212","7,213","7,214","7,215","7,216","7,217","7,218","47,219,220","46,221,138,222","26,223,67,68","12,38,201","19,224","14,225","31,226","7,67,227","11,228,192","12,145,201","12,229,230","22,1,230","17,77,231","11,232,138","11,233,125","31,234","31,235","22,28,79","19,236","26,237,67,68","11,238,34","14,239","12,145,240","12,241,6","12,151,242","11,243,82","11,244,34","19,245","31,246","14,247","1,248,67,249","11,250,34","26,251,67,249","22,61,252","1,253,67,249","1,254,67,249","11,196,76","12,151,255","10,256","19,257","26,258,138,249","26,259,138,249","7,260,210","1,174,261,249","19,262","19,263","19,264","19,265","12,136,266","10,267","11,61,192","11,268,192","36,269","11,270,76","22,28,271","11,272,138","1,273,67,249","7,274","22,1,275","10,276","19,277","12,278,279","19,280","19,281","12,145,282","19,283","19,284","11,285,34","19,286","10,287","19,288","1,289,67,68","11,290,76","1,291","22,61,138,292,293","22,1,294","19,295","10,296,192","11,297,88","11,298,88","22,61,79","23,241,299","22,61,300","22,61,301","22,1,302","10,296","10,138,192","31,303","31,206","22,1,304","12,38,305","22,138,305","22,61,306","22,61,307","11,308,309","12,151,310","22,61,311","7,312","12,169,313","11,314,76","22,1,314","22,61,315","19,316","7,317","22,61,318","23,319,320","12,38,321","19,322","23,26,323","17,77,324","12,38,325","11,326,76","7,327","46,328,138,222","19,329","11,330,34","22,61,331","14,332","11,333,88","22,1,334","22,61,323","26,335,67,68","31,336","31,337","22,138,199","12,338,339","11,340,34","11,341,34","22,138,342","12,38,343","12,344,345","1,346,67,68","12,347,348","11,349,82","11,350,82","11,351,82","17,77,352","22,61,353","12,11,296","17,77,354","23,355,356","12,151,356","22,61,201","11,357,88","11,358,34","1,359,67,68","17,77,360","12,151,361","12,105,362","12,38,363","19,364"];
    const args = /* 365 */ ["adsbygoogle","DOMContentLoaded","detectAdBlock","console.log","RegExp.prototype.test","/detect/i","document.getElementById","triggerBlock","mode:no-cors","adsenseCargo","adblock","setTimeout","start","onerror","script[src*=\"googlesyndication.com\"]","asap",".offsetHeight === 0","offsetHeight===0","/google-analytics\\.com|pubadx\\.one/","offsetHeight","visibilitychange","bs()","/pagead2\\.googlesyndication\\.com|adsbygoogle/","cloudfront.net","300","doubleclick","document.createElement","detect","load","innerHTML","Image","error","/ads/banner","popunders","noopFunc","/\\.offsetHeight\\s*?===\\s*?0/","adsBlocked","false","EventTarget.prototype.addEventListener","scriptObj",".offsetHeight===0","adblockDetected","bait","detected","googlesyndication","checkAdBlock","offsetHeight === 0","pagead2.googlesyndication.com","/=window\\.setInterval\\([\\s\\S]*?\\.push\\(/","showAdblockAlert","/adsbygoogle.js","__ANTI_ADBLOCK_CORE__","/detect|\\.onerror|window\\.open/","decodeURIComponent(atob","advanced_ads_check_adblocker","googleads.g.doubleclick.net","googletagmanager.com","connect.facebook.net","static.ads-twitter.com","google-analytics.com","ULTIMATE_BAIT_REMOVED","click","overlay-notification","break;case",".offsetParent===","/window\\.getComputedStyle|adblock-/","unlock","*","0.001","seconds","popads.net","blockAdBlock","method:HEAD","isAdBlocked","String.fromCharCode(_0x","_an.ABMode","undefined","href","a[href]#clickfakeplayer","_0x","500","adClickCount","0","close","atob","wp-content/","checkAdsStatus","DHAntiAdBlocker","true","/pagead2\\.googlesyndication.com/ method:HEAD","www3.doubleclick.net","siteAccessPopup()","Por favor","console[_0x","widgets.outbrain.com","window.getComputedStyle","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","widgets.outbrain.com/outbrain.js","hasAdblock","contador","adsbygoogle.js","detectedAdblock","ad blocker","/mopinion\\.com|iubenda\\.com|bannersnack\\.com|unblockia\\.com|googlesyndication\\.com/","block_ads","fetch","/alert|bloqueador|\\.catch|\\.type/","adBlockerOn","hasAdblocker","banner-ads",".clientHeight","setNptTechAdblockerCookie","possivelAdblockDetectado","eazyAdUnBlockerHttp","antiAdBlockerStyle","Promise[\\'all\\'](urls","/googlesyndication\\.com|iubenda\\.com|unblockia\\.com|bannersnack\\.com|mopinion\\.com/",".html(","/adBlock|\\.height\\(\\)/","playFunction","imasdk.googleapis.com","AdBlockDetector.prototype.test","falseFunc","detect-modal","googletag","{}","googletag._loaded_","securepubads.g.doubleclick.net/pagead/ppub_config","canRunAds","blockAdBlock._options","checkAdblockUser","addEventListener","displayMessage","adManagerBlocked","call-zone-adxs","adBlockFunction","document.getElementsByTagName","$MICROSITE_INFO.blockAdBlock","","adblock.check","app.AdBlock.init","/pagead2\\.googlesyndication\\.com|ads-api\\.twitter\\.com/","alert","eval","history.go","$","blockWall","/^(?!.*(chrome-extension:)).*$/ method:HEAD","Por favor, desative","/adblock|Por favor, desative|adsbygoogle\\.js/","cdo","document.addEventListener",".innerHTML","!document.getElementById(","ads-twitter.com","Object.prototype.autoRecov","/Adblock|\\.height\\(\\)/","jQuery","/Adblock|dummy|detect/","]]=== 0",".adsbygoogle","adregain_wall","ad_nodes","hb_now","Object.prototype.adblockerEnabled","adsbygoogle.loaded","adBlockCheck","pp_show_popupmessage","easySettings.adblock","onload","AdBlock","null","gothamBatAdblock","/hasAdblock|window\\.getComputedStyle/","PLAYER LIBERADO","/hasAdblock|detectadb|ad-placement/","/outbrain\\.com|adligature\\.com|quantserve\\.com|srvtrck\\.com/","//cdn.taboola.com/libtrc/unpkg/tfa.js","Bl0ckAdBl0ckCo","ppAdblocks","mMCheckAgainBlock","daadb_get_data","adsbygoogle.length","WSL2.config.enableAdblockEcommerce","ads_unblocked","Adblock","ai_front","cicklow_","better_ads_adblock","adBlockDetected","isAdsDisplayed","ATESTADO","1","Lata","/;return \\{clear:function\\(\\)\\{/","/Tamamo_Blocker|aadb_recheck/","loadingAds","dclm_ajax_var.disclaimer_redirect_url","e(!0)","popunder","ShowRewards","window.open","userout","String.prototype.concat","popup","resumeVideoFromAd","initPopunder","URL_VAST_YOUTUBE","__configuredDFPTags","vast_meta_url","ads","ads.policy.skipMode","vmap_ad_breaks interstitials","vmap_ad_breaks preroll","vmap_ad_breaks midroll-1","vmap_ad_breaks midroll-2","vmap_ad_breaks midroll-3","vmap_ad_breaks midroll-4","vmap_ad_breaks midroll-5","type=ad",".m3u8","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".mp.lura.live/prod/\")]] | //*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"][.//SegmentList[@presentationTimeOffset=\"0\"]])",".mpd","getid","initPu","adJsView","redirectpage","*.media.*.advertisement_id","contadorClics","enlace","document.write","li[onclick^=\"go_to_player\"] > a[target=\"_blank\"][href]","Object.prototype.adSlot","google.ima.OmidVerificationVendor","exopop","protData","cJsEdge","countdown","acdl","window.location.href","notficationAd","open","excludeDomains","global.noobMaxTry","player.preroll","lolaop","pUrlArray","adsdirect","videoliberado","0.02","anunciotag",".style.display","loadXMLDoc","PLAYER","liberaDownload","create_","!/download\\/|link|atomtt\\.com\\//","adk_pdisp","Loading...","adsHandle_noclick","ads breaks cuepoints times","10000","popurl","the_crakien","allclick_Public","checkCookieClick","onclick","?key=","clickd","_impspcabe","xxxStore","/_0x[\\s\\S]*?parentNode[\\s\\S]*?appendChild/","vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads","redirect","rot_url pop_type","videoTag","passeura","scriptwz_url","host","window.btoa","smrtSB","asgPopScript",".one(\"click\"","smrtSP","_cpp","a_consola","pub","redirdx.in/go/","Pub2","/atualizar|hided/","dooVastCfg","tick","elements","a.reward_ads[href]","inyectarBanner","javaUpdateAjax","_blank","Object.prototype.prerollShown","__POP_AD_LOCK__","openEnlace","openFullscreenAdOnce","localStorage","overlay","SmartAdsSafeStorage","NEW_LINK","trigger","preventDefault","redirigi","sg_gabarito_ads_config.adFrequency","1000","adUrl","openAdOnce","playerAds ads","puTS","__SMARTLINKS__","random","pumConfig","vast popup adblock","about:blank","JSON.stringify","data:text/javascript","noopener noreferrer","LieDetector","Popunder","a[data-stream][href][target=\"_blank\"]","window.gpp","__PRELOADED_STATE__.view.components.player.playbackContext.ads","adn_placement components.player.playbackContext.ads adnPlacement avails.* dashAvailabilityStartTime hlsAnchorMediaSequenceNumber nextToken nonLinearAvails","xpath(//*[name()=\"Period\"][./*[name()=\"EventStream\"][contains(@schemeIdUri, \":advertising-\")]] | //*[name()=\"Period\"]/@start)","PopunderData","showPopunder","clickCount","adpreload","vastPlayer.completed","sourceAd","start_preroll","anuncioConfig","setRandomBanner","Node.prototype.insertBefore","popns","VASTVideoPlayer","go_to_playerVast","/abrirVentanasEmergentes|abrirNuevaVentana|Popunder/","pop[_0x","Storage","/interstitial|redirectCount/","pframe","setInterval","doTabUnder","cnt1max","ifrconta","clickmax","#frm > a[href][onclick]","manejar","#fakeplayer > a","JSON.parse","showPopup","redirigido","redirigir","w-content","a.elementor-icon[target=\"_blank\"][rel][href]","window.location;","anuncios","/Popunder|Popup/","area51"];
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
})("74f9600a-13a3-47bc-b856-40c6da158b89");

void 0;
