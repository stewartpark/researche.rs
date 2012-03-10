#!/usr/bin/env node

/*
  This program collects the name of researchers who researches something.
*/

var http = require('http');
var querystring = require('querystring');

var cfid = 0;
var cftoken = 0;

function search(keyword, start, callback){
  var postdata = querystring.stringify({query: keyword});
  

  var req = http.request({
    host: 'dl.acm.org',
    port: 80,
    path: '/results.cfm?h=1&cfid=' + cfid + '&cftoken=' + cftoken,// + '&start=' + parseInt(start),
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postdata.length,
      'Cookie': 'CFID=' + cfid + '; CFTOKEN=' + cftoken + '; cffp_mm=256'
    }
  }, 
  function(res){
    var rst = "";
    res.setEncoding('utf8');
    
    res.on('data', function(chunk){
      rst += chunk.toString();
    });

    res.on('end', function(){
      var final_result = [];

      // Process
      rst = rst.replace(/[\r\n\t]/gi, '');
      lst = rst;
      while(lst){
        rst = rst.replace('  ', ' ');
        if(rst==lst){
          break;
        }else{
          lst = rst;
        }
      }

      var papers_re = /\<td\ colspan\=\"3\"\>.*?\<a\ href\=\"citation\.cfm.+?\>(.+?)\<\/a\>.*?\<div\ class=\"authors\"\>(.*?)\<\/div\>/gi;
      var authors_re = /\<a.+?\>(.+?)\<\/a\>/gi;
      //var addinfo_re = /\<div\ class\=\"addinfo\"\>(.+?)\<\/div\>/gi;
      var abstract_re = /\<div\ class\=\"abstract2\"\>(.*?)\<\/div\>/gi;
      var abstract_s_re = /\<br\>\<p\>(.*?)\<\/p\>\ \<br\>\<b\>Keywords\<\/b\>\:\ (.*?)\ $/gi;

      pp = papers_re.exec(rst);
      p = abstract_re.exec(rst);
      while(pp){
        p = abstract_s_re.exec(p[1]);
        if(!p){
          p = ['','',''];
        }

        p[2] = p[2].replace(/\<\/kwd\>/gi, '');

        v = {
          'subject': pp[1],
          'authors': [],
          'abstract': p[1],
          'keywords': p[2].split(', ')
        }
        ppp = authors_re.exec(pp[2]);
        while(ppp){
          v.authors.push(ppp[1]);
          ppp = authors_re.exec(pp[2]);
        }
        final_result.push(v);
        pp = papers_re.exec(rst);
        p = abstract_re.exec(rst);
      }
      callback(final_result);
    });
  });
  req.write(postdata);
  req.end();
}

function start(){
  var authors = {};
  var done = 0;

  function author_mapper(rst){
    for(var ar in rst){
      t = rst[ar].subject;
      ar = rst[ar].authors;
      for(var arr in ar){
        if(!authors[ar[arr]]){
          authors[ar[arr]] = [];
        }
        authors[ar[arr]].push(t);
      }
    }
    done++;

    if(done == 4){
      console.log(authors);
    }
  }



  /*
  search('Computer vision', 0, author_mapper);
  search('Image processing', 0, author_mapper);
  search('Signal processing', 0, author_mapper);
  search('Rendering', 0, author_mapper);
  */
  

}

// Boot up
http.request({
  host: 'dl.acm.org',
  port: 80,
  path: '/',
  method: 'GET'
}, function(res){
  
  var re_cfid = /CFID\=(.+?)\;/;
  cfid = parseInt(re_cfid.exec(res.headers['set-cookie'][0])[1]);

  var re_cftoken = /CFTOKEN\=(.+?)\;/;
  cftoken= parseInt(re_cftoken.exec(res.headers['set-cookie'][1])[1]);

  start();

}).end();


