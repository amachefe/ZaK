ZAK_DB_NAME= 'zak';
ZAK_APP_NAME= 'Zak';
ZAK_DB_DISK= 1024 * 1024 * 50;

function goToSameDirPage(apage) {
  if (apage.indexOf('http') == 0) {
    var eurl= apage;
    window.location.href= eurl;
    return;
  }
  var pname= window.location.pathname;
  var segs= pname.split('/');
  var slen= segs.length;
  if (slen == 0) {
    window.location.href= location.protocol + '//' + location.host + '/' + apage;
    return
  }
  var i;
  var rsegs= new Array();
  for(i=0;i<slen-1;i++) {
    if (segs[i]) rsegs.push(segs[i]);
  }
  rsegs.push(apage);
  window.location.href= location.protocol + '//' + location.host + '/' + rsegs.join('/');
  return;
}

function zakOpenDb(v, sync) {
  var dbv= v || '';
  if (sync) {
    alert('not implemented yet');
    return -1;
  }
  var db= window.openDatabase(ZAK_DB_NAME, dbv, ZAK_APP_NAME, ZAK_DB_DISK);
  return db;
};

function _zakloop(tx, queries, cbs, cbe) {
  if (zakCountArrayDb == zakCountArrayNb -1 ) return;
  var s= queries[zakCountArrayDb];
  console.log(s);
  zakCountArrayDb+= 1;
  if (zakCountArrayDb == zakCountArrayNb -1 ) 
    tx.executeSql(s, new Array(), cbs, cbe);
  else
    tx.executeSql(s, new Array(), function(tx, recs) {_zakloop(tx, queries, cbs, cbe)}, cbe);
};

function safeExecuteSql(ses, sql, params, scb) {
  ses.executeSql(sql, params, scb, function(ses, err) {var a= 1/0;});
}

function arrayQueries(ses, ssql, cbs, cbe) {
  var queries= ssql.split(';;');
  zakCountArrayDb= 0;
  zakCountArrayNb= queries.length;
  _zakloop(ses, queries, function(ses, recs) {cbs(ses, recs);}, function(ses, err) {cbe(ses, err);});
}

function changeZakVersion(sqlstr, tov, cbs, cbe) {
  db= zakOpenDb();
  dbv= db.version;
  console.log('Migrating Version: ' + dbv + ' to ' + tov);
  db.changeVersion(dbv, tov, function(t) {
    arrayQueries(t, sqlstr, function(ses, recs) {cbs(ses, recs);}, function(ses, err) {cbe(ses, err);});
  });
}

function displayError(err) {
  alert(err);
}

function displayGood(err) {
  alert(err);
}

function displayMsg(err, iserr) {
  if (iserr) displayGood(err);
  else displayError(err);
}

if (window.opera && !window.console) {
    window.console = {};
    var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
    "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
    for (var i = 0; i < names.length; ++i)
        window.console[names[i]] = function() {}
    window.console.info = function() {
        opera.postError(arguments);
    }
}

function zakFrameBufferMsg(msg) {
  var cnt= '<b>' + msg + '</b>... ';
  $('#framebuffer').append(cnt);
}
function zakFrameBufferSt(st) {
  if (st) 
    var cnt= '[ <b style="color:red">Error</b> ]<br/>';
  else
    var cnt= '[ <b style="color:green">Ok</b> ]<br/>';
  $('#framebuffer').append(cnt);
}

function multipleSqlWhere(warray, keyname, anded) {
  var ftrcodes= new Array();
  var qarray= new Array();
  var i= 0;
  for(i=0;i<warray.length;i++) {
    ftrcodes.push(keyname + ' = ?');
    qarray.push(warray[i]);
  }
  if (!anded) 
    var of= ftrcodes.join(' or ');
  else
    var of= ftrcodes.join(' and ');
  return {qry: of, qar: qarray}
}

function selectPropertiesInit() {
  llGetProperties(
    function(ses, props) {
      var res= '';
      var i= 0;
      var aprop= getActiveProperty();
      console.log('Selecting with active= ' + aprop);
      console.log(aprop);
      $('.putPropertyname').each(function(idx, el) {
        $(this).append(aprop['name'] || 'Property');
      });
      var aid= aprop['id'];
      for(i=0;i<props.rows.length;i++) {
        var prop= props.rows.item(i);
        console.log('combo to ' + prop['name']);
        if (prop['id'] == aid) {
          res+= '<option selected="selected" value="' + prop['id'] + '">' + prop['name'] + '</option>';
        }
        else
          res+= '<option value="' + prop['id'] + '">' + prop['name'] + '</option>';
      }
      $('#selectproperty').empty().append(res).change(function() {
        var zcode= $('#selectproperty').val();
        if (getActiveProperty()['id'] != zcode) {
          console.log('Setting now prop: ' + zcode);
          setActiveProperty(zcode, function() {document.location.reload(false);});
        }
      });
    },
    function(ses, err) {
      humanMsg('Error Select Properties', 1);
    }
  );
}

function zakNotImplementedYet() {
  el= document.getElementById('zakNotImplementedYet');
  if (!el) {
    var htmltoshow= '<div id="zakNotImplementedYet" class="zakmodal">' +
      '<h1>Not Implemented Yet</h1> ' +
      '<h2>Feature actually not available</h2>' +
      'We\'re sorry: this feature has not been implemented yet. We will release it as soon as possible' +
      '<br/>' +
      '<br/>' +
      '<a style="color:#36ff00;font-weight:bold" href="javascript:$.modal.close()">Continue</a>' +
    '</div>';
    $(document.body).append(htmltoshow);
  }
  $('#zakNotImplementedYet').modal();
}

function checkFloat(x){
  var t= '^\[0-9]+(\.\?[0-9]+)?$';
  if (x.search(t) == -1) return false;
  return true;
}

function updateStatement(d) {
  var qry, qarr= new Array();
  var temp= new Array();
  for (var k in d) {
    temp.push(k + '= ?');
    qarr.push(d[k]);
  }
  return {qarr: qarr, qry: temp.join(',')};
}

function insertStatement(d) {
  var keys= new Array();
  var vals= new Array();
  var dots= new Array();
  for (var k in d) {
    keys.push(k);
    vals.push(d[k]);
    dots.push('?');
  }
  var q= '(' + keys.join(',') + ') values (' + dots.join(',') + ')';
  return {qarr: vals, qry: q};
}

function arrayFromRecords(r) {
  var i, res= new Array;
  for(i=0;i<r.rows.length;i++) {
    res.push(r.rows.item(i));
  }
  return res;
}

function copyObject(d, skipfields) {
  var no= {};
  for (var k in d) {
    if (!skipfields || skipfields.indexOf(k) == -1)
      no[k]= d[k];
  }
  return no;
}

function strObject(d) {
  for (var k in d) {
    console.log(k + '= ' + d[k]);
  }
}
