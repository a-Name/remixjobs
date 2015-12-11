var bl = require("bl");
var https = require("https");
var jobs = [];
var links = ["https://remixjobs.com/?in=Design", "https://remixjobs.com/?in=Développement", "https://remixjobs.com/?in=Seo", "https://remixjobs.com/?in=Projets", "https://remixjobs.com/?in=Marketing", "https://remixjobs.com/?in=Réseau", "https://remixjobs.com/?in=Autres"];
var bitDescription = 0; // set to 0 if description is not needed. to get description is much longer (set bit to 1 if you want to)

getjobs = function(link){
  https.get(link, function(res) {
    res.pipe(bl(function (err, data) {
      var dts = data.toString();
      dts = dts.substring(dts.indexOf('<ul class="jobs-list">'),dts.length);
      dts = dts.substring(0,dts.indexOf('</ul>'));
      var joffers = [];
      while(dts.indexOf('<li class="job-item clearfix') != -1){
        var joffer = dts.substring(dts.indexOf('<li class="job-item clearfix'), dts.indexOf('</li>')+5);
        joffers.push(joffer);
        dts = dts.replace(joffer,"");
      }
      for(var i=0; i<joffers.length; i++){
        var jspecs = []; //Link - Job title - Company - Localization - Category - Description - Contract - Date - Tags
        joffers[i] = joffers[i].replace(joffers[i].substring(0, joffers[i].indexOf('<a class="job-link" ')+20),"");
        jspecs[0] = "https://www.remixjobs.com"+joffers[i].substring(6, joffers[i].indexOf('">'));
        joffers[i] = joffers[i].replace(joffers[i].substring(0, joffers[i].indexOf('">')+2),"");
        jspecs[1] = joffers[i].substring(0, joffers[i].indexOf('</a>'));
        joffers[i] = joffers[i].replace(joffers[i].substring(0, joffers[i].indexOf('<a class="contract clearfix" ')+29),"");
        jspecs[6] = joffers[i].substring(joffers[i].indexOf('">')+15, joffers[i].indexOf('</a>')-11);
        joffers[i] = joffers[i].replace(joffers[i].substring(0, joffers[i].indexOf('<a class="company" ')+19),"");
        jspecs[2] = joffers[i].substring(joffers[i].indexOf('">')+2, joffers[i].indexOf('</a>'));
        joffers[i] = joffers[i].replace(joffers[i].substring(0, joffers[i].indexOf('<a class="workplace" ')+21),"");
        jspecs[3] = joffers[i].substring(joffers[i].indexOf('">')+2, joffers[i].indexOf('</a>'));
        jspecs[4] = link.substring(link.indexOf("?in=")+4, link.length);
        if(bitDescription == 0){jspecs[5] = "description_not_required";}
        else{
          var sync=true;
          https.get(jspecs[0], function(re) {
            res.pipe(bl(function (er, dat) {
              var datts = dat.toString;
              datts = datts.substring(datts.indexOf('<meta name="og:description" content="')+37, datts.indexOf('<meta name="og:type" content="article">')-5);
              jspecs[5] = datts;
              sync=false;
            }));
          }).on('error', function(e) {
            console.log("Got error: " + e.message);
          });
          while(sync) {require('deasync').sleep(100);}
        }
        joffers[i] = joffers[i].replace(joffers[i].substring(0, joffers[i].indexOf('<span class="job-details-right')+30),"");
        jspecs[7] = joffers[i].substring(joffers[i].indexOf('">')+2, joffers[i].indexOf('</span>'));
        joffers[i] = joffers[i].replace(joffers[i].substring(0, joffers[i].indexOf('<div class="job-tags">')+22),"");
        joffers[i] = joffers[i].replace(joffers[i].substring(joffers[i].indexOf('</div>'), joffers[i].length),"");
        var jtags = [];
        while(joffers[i].indexOf('data-tag-name="') != -1){
          joffers[i] = joffers[i].replace(joffers[i].substring(0, joffers[i].indexOf('data-tag-name="')+15), "");
          jtags.push(joffers[i].substring(0,joffers[i].indexOf('" ')));
        }
        for(var j=0; j<jtags.length; j++){
          jspecs[8] += ", "+jtags[j];
          jspecs[8] = jspecs[8].replace("undefined, ", "");
        }
        jobs.push(jspecs);
      }
      console.log(jobs);
    }));
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
}

for(var i=0; i<links.length; i++){
  getjobs(links[i]);
}
