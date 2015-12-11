var bl = require("bl");
var https = require("https");
var jobs = []; // final data is stored here - [job offer][secifications]
var links = ["https://remixjobs.com/?in=Design", "https://remixjobs.com/?in=D%C3%A9veloppement", "https://remixjobs.com/?in=Seo", "https://remixjobs.com/?in=Projets", "https://remixjobs.com/?in=Marketing", "https://remixjobs.com/?in=R%C3%A9seau", "https://remixjobs.com/?in=Autres"];
var bitDescription = 0; // set to 0 if description is not needed. to get description is much longer (set bit to 1 if you want to)
var bitGetAllSite = 0; // setting this to 0 only gets the first pages of the site. Else you retrieve all the data from the site (much longer)
var alertReachEnd = 0; // leave this alert bit to 0

getjobs = function(link){ // parse a page of results
  var sync = true;
  https.get(link, function(res) {
    res.pipe(bl(function (err, data) {
      var dts = data.toString();
      //console.log(dts.length);
      if(dts.indexOf("An Error Occurred: Not Found") != -1){
        alertReachEnd = 1;
        sync = false;
      }
      else{
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
          jspecs[4] = link.substring(link.indexOf("?in=")+4, link.length).replace(link.substring(link.indexOf('&'),link.length),"").replace("%C3%A9","é");
          if(bitDescription == 0){jspecs[5] = "description_not_required";}
          else{ jspecs[5] = "description_required";}
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
        sync = false;
      }
    }));
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
  while(sync) {require('deasync').sleep(100);}
}

getdesc = function(link,value){ // parse a job offer's page
  var sync = true;
  https.get(link, function(res) {
    res.pipe(bl(function (err, data) {
      console.log('.');
      var dts = data.toString();
      dts = dts.substring(dts.indexOf('<meta name="og:description" content="')+37, dts.indexOf('<meta name="og:type" content="article">')-5);
      jobs[value][5] = dts;
      sync=false;
    }));
  }).on('error', function(e) {
  console.log("Got error: " + e.message);
  });
  while(sync) {require('deasync').sleep(100);}
}

// MAIN
console.log("processing... please wait");
if(bitGetAllSite == 1){
  console.log("Get all site option activated, this can take a while...");
  var j;
  var i = 0;
  while(i<links.length){
    alertReachEnd=0;
    j=0;
    while(alertReachEnd == 0){
      j++;
      //console.log("Getting category "+i+", page "+j+", alert "+alertReachEnd);
      getjobs(links[i]+"&page="+j);
    }
    i++;
  }
}
else{
  for(var i=0; i<links.length; i++){
    getjobs(links[i]);
  }
}
console.log(jobs);
console.log("step 1 achieved");
if(bitDescription != 0){
  console.log("Get description option activated, this can take a while...");
  for(var i=0; i<jobs.length; i++){
    getdesc(jobs[i][0],i);
  }
  console.log(jobs);
  console.log("step 2 achieved");
}
