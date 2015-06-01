
var isAutoSearch = false;

$(document).ready(function(){
    var url = window.location.href;
    var idx = url.indexOf("#"); // if current location is not home page, go to home page when user refresh the page.
    if (idx != -1) {
        window.location = url.substring(0, idx);
        return;
    }
    init();
});

$.ajaxSetup ({
    cache: false
});

function init()
{
    applicationCacheHandeler();

    $("a.goBack").fastClick( function(e) {
        $.mobile.back();
        e.stopPropagation();
        return false;
    });
    $("a.goHome").fastClick( function() {
        var pageName = "#hotelSearchPage";
        var animation = isAndroid() ? "none" : "slidefade";
        $.mobile.changePage($(pageName), {transition: animation, reverse:true});
    });
    if (typeof(document.referrer) == "undefined") {
        console.log("document.referrer:" + document.referrer);
        sessionStorage.referrer = document.referrer;
    } else {
        console.log("browser not support document.referrer.");
    }
    setTimeout(function(){
        $.mobile.changePage($("#appListPage"), {transition: "none"});
    }, 100);
}

$(document).bind("mobileinit", function() {

    $.mobile.loadingMessage = '页面载入中';
    $.mobile.pageLoadErrorMessage = '页面载入失败';
    $.mobile.transitionFallbacks.slideout = "none";
    // jquery mobile used $.ajax() to load page for using page transition,
    // in jquery, $.ajax() method set cache option default by true, but in Android platform this will cause some problems, if loaded from cache
    // ajax request event will not be fired.
    // in order to improve the speed of loading resources, HTML5 feature application cache must to be used.
    // to fix this issue , set cache option to false before jquery mobile setting up.
//  var agent = navigator.userAgent.toLowerCase();
//  if (agent.match(/android/i) == "android") {
        $.ajaxSetup({
            cache: false,
            headers: {"Cache-Control": "no-cache"}
        });
//  }
    
});

function applicationCacheHandeler() 
{
    applicationCache.onchecking = function(){
        console.log(" application cache checking");
    };

    applicationCache.ondownloading = function(){
        console.log(" application cache downloading");
    };

    applicationCache.onnoupdate = function(){
        console.log(" application cache no update");
    };

    applicationCache.onprogress = function(){
        console.log(" application cache progress");
    };

    applicationCache.oncached = function(){
        console.log(" application cache cached");
//        location.reload(true); // reload the whole web page
    };

    applicationCache.onupdateready = function(){
        console.log(" application cache update ready");
        location.reload(true); // reload the whole web page
    };

    applicationCache.onerror = function(){
        console.log(" application cache error");
    };
    
}

function isAndroid()
{
    var agent = navigator.userAgent.toLowerCase();  // on Android, when click on 'input', it doesn't scroll up automatic.
    if (agent.match(/android/i) != "android") {
        return false;
    }
    return true;
}

function clearStorage()
{
    for (var i=0, len = sessionStorage.length; i < len; i++){
        var key = sessionStorage.key(i);
        var value = sessionStorage.getItem(key);
        console.log("removing " + key + " : " + value);
        sessionStorage.removeItem(key); /// ?????
    }
}

function getQueryString(name) // get parameter from url
{
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) 
        return decodeURIComponent(r[2]);
    return null;
}

function isPhoneNumber(number)
{
    var reg = /^1[3-8]\d{9}$/;
    if (reg.test(number)) {
        return true;
    }
    return false;
}

function isEmail(str)
{
    var reg = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
    if (reg.test(str)) {
        return true;
    }
    return false;
}

function makePostData(para)
{
    var para2 = commonPara();
    for( var i in para2) {
        para[i] = para2[i];
    }
    return para;
}

function dateDiff(date1Str, date2Str)
{
    var dateString = date1Str.replace(/-/g, "/");
    date1 = new Date(dateString);
    dateString = date2Str.replace(/-/g, "/");
    date2 = new Date(dateString);
    return parseInt(Math.abs(date1.getTime() - date2.getTime())/1000/60/60/24);    // ms -> day
}

function showMask()
{
    $("body").attr("ontouchmove", "return false;");
}

function hideMask()
{
    $("body").attr("ontouchmove", "");
}

function changePage(pageName)
{
    if (isAndroid()) {
        $.mobile.changePage($(pageName), {transition: "none"});
    } else {
        $.mobile.changePage($(pageName), {transition: "slidefade"});
    }
}

function showLoader(txt) {  
    var onlyTxt = true;
    if (txt === undefined) {
        txt = "加载中...";
        onlyTxt = false;
    }
    $.mobile.loading('show', {  
        text: txt, //加载器中显示的文字  
        textVisible: true, //是否显示文字  
        theme: 'b',        //加载器主题样式
        textonly: onlyTxt,   //是否只显示文字  
        html: ""           //要显示的html内容，如图片等  
    });  
}

function hideLoader()  
{  
    $.mobile.loading('hide');  
} 

function appServerUrl()
{
    return "http://livew.mobdsp.com/cb";
    // return "http://127.0.0.1:5000";
}
