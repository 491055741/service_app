var appServerUrl = "http://livew.mobdsp.com/cb";
var feedBackUrl = "http://www.dspmind.com/feedback/app_feedback.php";
var callback = "callback=?";
var localServerUrl = "http://127.0.0.1:5000";
var checkNetworkInterval = 1500; // ms
var checkNetworkUrl = "http://115.159.3.16/cb/app_test";
var countDownTimer = null;
var checkNetworkTimer = null;
var autoLoginTimer = null;
var requestKulianWifiTimer = null;
var connectedSSID = null;
var version = null;
var count = 0;
var WifiStatus = {"disconnected" : 0, "connected" : 1, "kulian" : 2, "kulianAuthed" : 3};

(function($) {
    $.ajaxSetup({
        timeout: 10000,
        cache: false,
        error: function (x, e) {
            showLoader("T_T 网络出问题了，请稍后再试");
            setTimeout("hideLoader()", 3000);
        }
    });
})(jQuery);
// js-Android interface
var updateDownloadProgress = function (appId, progress) {
    // console.log('app['+appId+'] download progress: '+progress);
    //已安装的应用  包含app列表和app管理里的
    var installApps = $(".installBtn[data-appid="+appId+"]");
    $.each(installApps, function (index,el) {
        if ($(el).hasClass('bigLogo-instBtn')) {
            //如果遮罩层存在就在遮罩层上获取对应的raobj对象
            var cMask = $(el).siblings('.app-img').children('.canvas-mask');
            var raObj = cMask.data('radialIndicator');
            // console.log('cmask-raobj');
        } else {
            // console.log("i'm installbtn");
            var raObj = $(el).data('radialIndicator');
            // console.log(raObj);
        }
        if (raObj) {
            raObj.animate(progress);
        }

    });
};
// js-Android interface
var finishDownloadProgress = function (appId) {
    console.log('app['+appId+'] download finished.');

    var installApps = $(".installBtn[data-appid="+appId+"]");
    $.each(installApps, function (index,el) {

        $(el).removeClass("downloading");
        if ($(el).hasClass('bigLogo-instBtn')) { // 推荐中的
            //如果遮罩层存在就在遮罩层上获取对应的raobj对象
            $(el).siblings('.app-img').children('.canvas-mask').hide();
            $(el).children('canvas').hide();
            $(el).text('已下载');
            $(el).attr('data-downloaded', 'YES');
            $(el).addClass("hasDownloaded inactive");
            $(el).after("<i class='down-symbol--t1'></i>");
        // } else if ($(el).hasClass('manageTab')) { // 下载管理列表中的
        //     $(el).attr('data-downloaded', 'YES');
        //     me.removeFromAppManageTab(el);
            // me.addToTaskListTab(el);
        } else { // 软件列表和详情中的
            $(el).children('canvas').remove();
            $(el).siblings('.app_down').hide();
            $(el).attr('data-downloaded', 'YES');
            $(el).addClass("hasDownloaded inactive");
            $(el).children('span').show().text('已下载');
        }
    });
};
// js-Android interface
var appInstallFinished = function (appId) {
    // report
    var phone_number = $(".acount_list #account").text();
    if (window.android) {
        var imei = window.android.getIMEI();
    } else {
        var imei = 'none';
    }
    var url = appServerUrl+"/download_report?"+callback+"&appid="+appId+"&phone_number="+phone_number+"&imei="+imei;
    console.log("Report app downloaded:"+url);

    $.getJSON(url, function(data) {
        if (data.ret_code == 0) {
            if (data.added_coin > 0) {
                showLoader('您获得了 '+data.added_coin+' 个金币');
                setTimeout("hideLoader()", 3000);
            }
            $("#coin").text(data.coin_num);
        } else {
            showLoader(data.ret_msg);
        }
        setTimeout("hideLoader()", 3000);
    });
    // update button status
    var installBtns = $(".installBtn[data-appid="+appId+"]");
    $.each(installBtns, function (index,el) {
        if ($(el).hasClass('bigLogo-instBtn')) { // 推荐中的
            //如果遮罩层存在就在遮罩层上获取对应的raobj对象
            $(el).siblings('.app-img').children('.canvas-mask').hide();
            $(el).children('canvas').hide();
            $(el).text('打  开');
            $(el).attr('data-installed', 'YES');
            $(el).addClass("hasInstalled inactive");
        // } else if ($(el).hasClass('manageTab')) { // 下载管理列表中的
            // $(el).attr('data-installed', 'YES');
            // me.removeFromAppManageTab(el);
            // me.addToTaskListTab(el);
        } else { // 软件列表中的
            $(el).children('canvas').remove();
            $(el).siblings('.app_down').hide();
            $(el).attr('data-installed', 'YES');
            $(el).addClass("hasInstalled inactive");
            $(el).children('span').text('打  开');
        }
        $(el).trigger('click');
    });
};
// js-Android interface
var appLanched = function (pkgName) {
    var lanchedApps = $(".installBtn[data-pkgname='"+pkgName+"']");
    if (lanchedApps.length > 0) {
        var appId = $(lanchedApps[0]).data('appid');
    }

    var phone_number = $(".acount_list #account").text();
    if (window.android) {
        var imei = window.android.getIMEI();
    } else {
        var imei = 'none';
    }
    var url = appServerUrl+"/applanch_report?"+callback+"&phone_number="+phone_number+"&imei="+imei;
    if (appId == undefined) {
        url = url+"&pkgname="+pkgName;
    } else {
        url = url+"&appid="+appId;
    }
    console.log("Report app lanched:"+url);

    $.getJSON(url, function(data) {
        if (data.ret_code == 0) {
            if (data.added_coin > 0) {
                showLoader('您获得了 '+data.added_coin+' 个金币');
                setTimeout("hideLoader()", 3000);
            }
            $("#coin").text(data.coin_num);
        } else if (data.ret_code == 3001) {  // not first time lanch
            // do nothing
        } else {
            showLoader(data.ret_msg);
        }
        setTimeout("hideLoader()", 3000);
    });
};
// js-Android interface
var wifiStatusChanged = function (ssid) {
    if ($(".acount_list #account").text() == '') {
        console.log('wifiStatusChanged: not login yet.');
        return;
    }
    console.log("wifiStatusChanged, ssid:"+ssid);
    if (ssid != undefined) { // wifi连接上了
        ssid = ssid.replace(/\"/g, ""); // 去掉双引号
        connectedSSID = ssid;
        if (me.isKuLianWifi(ssid)) {
            console.log("wifiStatusChanged: is kulian wifi.");
            $("#connectWifiBtn").attr("data-wifiStatus", WifiStatus.kulian);
        } else {
            console.log("wifiStatusChanged: not kulian wifi.");
            $("#connectWifiBtn").attr("data-wifiStatus", WifiStatus.connected);
        }
        $("#statusDesc").data("wifissid", ssid);
        me.updateWifiStatusUI($("#connectWifiBtn").attr("data-wifiStatus"));
        me.checkNetwork();
        me.removeFromWifiList(ssid);
    } else { // 断开连接了
        connectedSSID = null;
        $("#connectWifiBtn").attr("data-wifiStatus", WifiStatus.disconnected);
        me.updateWifiStatusUI(WifiStatus.disconnected);
        // me.requestWifiList();
    }
};
// js-android interface
var receivedVerifyCode = function(verifyCode) {
    console.log("receivedVerifyCode:"+verifyCode);
    $("#registVerifyCode").val(verifyCode);
};
// js-android interface
var checkLogin = function() {
    console.log("checkLogin");
    if (!me.isLogin) {
        me.autoLogin();
    }
};
// js-android interface
var wifiListChanged = function(wifiList) {
    console.log("wifiListChanged");
    if (typeof wifiList == "string") {
        var obj = eval("(" + jsonString +")");
        me.parseWifiList(obj);
    } else if (typeof wifiList == "object") {
        me.parseWifiList(wifiList);
    } else {
        console.log("unknown wifilist type:"+wifiList);
    }
}

/*page event  Start*/
$("#WelcomPage").on("pageshow", function () {
    console.log("welcome page show");

    var userName = getItem("userName");
    var password = getItem("passWord");
    if (userName && userName.length > 0 && password && password.length > 0) {
        setTimeout("changePage('#MainPage')",1000);
        return;
    } else {
        console.log("WelcomPage show : no saved account info");
        setTimeout("changePage('#RegisterPage')",1000);
    }
});

$("#RegisterPage").on("pagebeforeshow", function () {
    console.log("register page show");

    if (me.isChangingPassword) {
        me.showBackBtn(true);
        setTitle("修改密码");
        $("#passwordFields").show();
        $("#inviteCodeFields").hide();
        $("#genderFields").hide();
    } else {
        me.showBackBtn(false);
        setTitle("验证");
        $("#passwordFields").hide();
        $("#inviteCodeFields").show();
        $("#genderFields").show();
    }

    $("#registPassword").val('');
    $("#registVerifyCode").val('');
    $("#repeatPassword").val('');
});

$("#RegisterPage").on("pageshow", function () {
});

$("#MainPage").on("pageinit", function() {
    console.log("main page init");
    $("#logoutBtn").hide();
    // use fastClick will cause pop to home page when tap the tab on PC.
    $("#connectionBtn").click(function(e) {me.showTab(0);});
    $("#excellentBtn").click(function(e) {me.showTab(1);});
    $("#contentBtn").click(function(e) {me.showTab(2);});
    $("#mineBtn").click(function(e) {me.showTab(3);});
    $("#connectWifiBtn").attr("data-wifiStatus", WifiStatus.disconnected);
    me.fillVersion();
    setTimeout("me.requestKulianWifi()", 100);
    setTimeout("me.requestWifiList()",   300);
    setTimeout("me.checkNetwork()",     1500);
    setTimeout("me.requestMessage()",   2000);
    setTimeout("me.requestAppList()",   3000);
    setTimeout("me.requestTaskList()",   3500);
    me.initExchangePage();
    if (window.android != undefined) {
        setTimeout("window.android.requestCheckConnection()", 500);
        if (window.android.getIsFirstTimeRun()) {
            setTimeout("me.showGuide()", 1000);
        }
    } else { // for debug on browser
        setTimeout("wifiStatusChanged('SuperMary')", 1000);
        setTimeout("me.autoLogin()", 10000);
    }
});

$("#MainPage").on("pagebeforeshow", function () {
    console.log("main page before show");
    me.showBackBtn(false);
    me.showTab(me.currentTabIdx);
});

$("#MainPage").on("pageshow", function () {
    console.log("main page show");
    if (me.currentTabIdx == 0 && me.isGotTaskList) {
        var footerHeight = $("#mainFooter").height();
        $("#task-list-wrapper .wrapper").css('height', ($(window).height()-footerHeight)+'px');
        me.refreshScroll(4);
    } else {
        me.refreshScroll();
    }
});

$('#dialog').jqm({
    modal: true
});

$('#gzhdialog').jqm({
    modal: true
});

$("#AppDetailPage").on("pagebeforeshow", function () {
    me.showBackBtn(true);
});

$("#WechatTaskDetailPage").on("pagebeforeshow", function () {
    me.showBackBtn(true);
});

$("#AppDetailPage").on("pageshow", function () {
    gallery = new Swiper('.swiper-container',{
        initialSlide: 1,
        pagination: '.swiper-pagination',
        spaceBetween: 30,
        slidesPerView: 2,
        centeredSlides: true
    });
});

$("#ExchangePage").on("pagebeforeshow", function () {
    me.showBackBtn(true);
    $(".exchangeHeader .coin_num").text($("#coin").text());
});

//feed back page
$("#feedBackPage").on("pageinit",function() {
    var $feedBtn = $("#feedback-submit-btn"),
        $feedArea = $('#feedback-textarea'),
        //引入弹窗组件 by HC
        Dialog = H.Dialog;

    $feedBtn.fastClick(function() {

        var $feedContent = $feedArea.val();

        if ($feedContent.length == 0) {
            showLoader('请填写反馈内容');
            setTimeout("hideLoader()", 2000);
            return;            
        } else if ($feedContent.length > 150) {
            showLoader('反馈内容请不要超过150字');
            setTimeout("hideLoader()", 2000);
            return;
        }

        if (window.android) {
            var deviceInfo = window.android.getMobileInfo();
        } else {
            var deviceInfo = '';
        }
        var params = {
                phone_number : $('#account').text(),
                platform : 'Android',
                app_version : me.getVersion(),
                token : 'LUZ9EUzkELCyPIXLNrWrDbqzX',
                device_info : deviceInfo,
                feedback : $('#feedback-textarea').val()
            };
        showLoader('请稍候');
        console.log("feedback:"+feedBackUrl);
        $.ajax({
            url: feedBackUrl,
            data: params,
            dataType: "jsonp",
            success: function(data) {
                hideLoader();
                if (data.ret_code == 0) {
                    Dialog({
                        content:'谢谢您的反馈',
                        okCallback: function(){
                            changePageAndHideLoader("#MainPage");
                        }
                    }); 
                } else {
                    showLoader(data.ret_msg);
                    setTimeout("hideLoader()", 2000);
                }
            }
        });
    });
});

$("#feedBackPage").on("pageshow",function() {
    me.showBackBtn(true);
    $('#feedback-textarea').val('');
});

$("#FAQPage").on("pageshow",function() {
    me.showBackBtn(true);
});

/*page event END*/

$("#closePopupAdBtn").fastClick(function(){
    $("#popupAdView").hide();
});

$("#logoutBtn").fastClick(function() {
    me.isLogin = false;
    me.isChangingPassword = false;
    $("#logoutBtn").hide();
    changePage("#RegisterPage");
});

$("#registBtn").fastClick(function() {
    me.register();
});

$("#gzh_close_dialog_btn").click(function() {
    if (window.android) {
        window.android.openWechat();
    }
    me.requestTaskList();
    changePage("#MainPage");
});

$(".account_coin").fastClick(function() {
    changePage("#ExchangePage");
});

$("input").bind("focus", function() {
    if ($(this).attr("value")=='请填写您的手机号' || $(this).attr("value")=='选填') {
        $(this).attr("value","");
    }
});

$("#shenmaBtn").fastClick(function () {
    if (window.android != undefined) {
        window.android.appAuth();
    }
    showLoader("发送认证请求");
    setTimeout("hideLoader()", 2000);
});

$(".user_signin").fastClick(function() {
    me.signIn();
});

$(".verifyCodeBtn").fastClick(function() {
    me.requestVerifyCode();
});

$('#getMoreCoin').fastClick(function(){
    me.showGuide();
});

$(".changePwdBtn").fastClick(function() {
    if (!me.isLogin) {
        showLoader("还未登录");
        setTimeout("hideLoader()", 2000);
        return;
    }
    me.isChangingPassword = true;
    changePage("#RegisterPage");
});

$(".qqBtn").fastClick(function() {
    console.log("QQ");
    if (window.android != undefined) {
        window.android.openQQ('123456789');
    }
});

$(".feedbackBtn").fastClick(function() {
    if (!me.isLogin) {
        showLoader("还未登录");
        setTimeout("hideLoader()", 2000);
        return;
    }
    changePage("#feedBackPage");
});
/*[2015-11-18]*/
$(".FAQ").fastClick(function(){
    changePage("#FAQPage");
});

$(".socialShareBtn").fastClick(function() {
    console.log("social share");
    if (window.android != undefined) {
        window.android.socialShare();
    }
});

$("#toRegistBtn").fastClick(function() {
    me.isChangingPassword = false;
    changePage("#RegisterPage");
});

$("#connectWifiBtn").fastClick(function() {
    var status = parseInt($(this).attr("data-wifiStatus"));
    console.log("connectWifiBtn clicked, status code:"+status);
    switch (status) {
        case 0: // wifi not connected
        case 1: // connected to other wifi, switch to xiaohong wifi
            me.connectWifi(this);
            me.checkNetwork();
            break;
        case 2: // xiaohong not authed
            me.authentication();
            break;
        case 3: // xiaohong authed
            console.log("alreay authed");
            break;
        default:
            break;
    }
});

$(".refresh-app-list").fastClick(function() {
    me.requestAppTypePage(me.curAppTabIdx, 1);
});

$(".refresh-task-list").fastClick(function() {
    me.requestTaskList();
});

var me = {
    countDownSeconds : 0, 
    isChangingPassword : false,
    currentTabIdx : 0, // bottom tab
    curAppTabIdx : 1,  // app top tab
    curAppPageIdx : [1,1,1], // current page of each app tab
    myScroll : null,
    kuLianWifi : null,
    appList : null,
    isLogin : false,
    isGotTaskList : false,
    autoLoginRetryCount : 0,
    showBackBtn : function (isShowBackBtn) {
        console.log("showBackBtn:"+isShowBackBtn);
        if (window.android != undefined) {
            window.android.showBackBtn(isShowBackBtn);
        }
        if (isShowBackBtn) {
            console.log("ShowBackBtn: history.length:"+window.history.length);
        }
    },

    checkNetwork : function() {
        clearTimeout(checkNetworkTimer);
        var url = checkNetworkUrl;
        if (me.isLogin) {
            url = url + "?mobile="+$("#account").text();
        }
        console.log("checkNetwork: "+checkNetworkUrl);
        // $("#statusDesc").text("检查网络...");
        $.ajax({
            url: url,
            dataType : "jsonp",
            jsonp: "callback",//"callname",//服务端用于接收callback调用的function名的参数
            // jsonpCallback:"success",//callback的function名称
            success : function(data) {
                        console.log("checkNetwork success.");

                        if (parseInt($("#connectWifiBtn").attr("data-wifiStatus")) == WifiStatus.disconnected) {
                            me.updateWifiStatusUI(WifiStatus.disconnected);
                        } else if (parseInt($("#connectWifiBtn").attr("data-wifiStatus")) == WifiStatus.kulian) {
                            $("#connectWifiBtn").attr("data-wifiStatus", WifiStatus.kulianAuthed);
                            me.updateWifiStatusUI(WifiStatus.kulianAuthed);
                            if (me.isLogin) {
                                me.reportAuthenSuccess();
                            }
                        }
                        console.log("connectWifiBtn wifiStatus:"+$("#connectWifiBtn").attr("data-wifiStatus"));
                        if (!me.isLogin) {
                            me.autoLogin();
                        }
                        setTimeout("me.loadHumorPage()", 1000);
                        // setTimeout("me.requestAppAd()", 1500);
                    },
            error : function() {
                        console.log("checkNetwork fail.");
                        // $("#statusDesc").text("网络连接失败");
                        $(".wifiStatus .statusOn").hide();
                        $(".wifiStatus .statusOff").show();
                        if (parseInt($("#connectWifiBtn").attr("data-wifiStatus")) == WifiStatus.kulian) {
                            checkNetworkTimer = setTimeout(me.authentication(), checkNetworkInterval);
                        }
                    }
        });
    },

    authentication : function() {
        if (!me.isLogin) {
            me.autoLogin();
            return;
        }
        console.log("authentication.");
        // check coin only when connected to HongWifi
        if (me.isKuLianWifi(connectedSSID)) {
            var phone_number = $(".acount_list #account").text();
            var url = appServerUrl+"/query_coin?phone_number="+phone_number;
            $.getJSON(url, function(data) {
                if (data.ret_code == 0 || data.ret_code == 3001) {  // 3001 means already deduction coin today
                    me.sendAuthenticationRequest();
                } else {
                    showLoader(data.ret_msg);
                    setTimeout("hideLoader()", 2000);
                }
            });
        } else {
            me.sendAuthenticationRequest();
        }
    },

    sendAuthenticationRequest : function() {
        console.log("sendAuthenticationRequest.");
        clearTimeout(checkNetworkTimer);
        // $("#statusDesc").text("认证中...");
        if (checkNetworkInterval > 10000) {
            checkNetworkInterval = 1500;
            console.log("authentication timeout.");
            // $("#statusDesc").text("认证超时");
            return;
        }

        if (window.android != undefined) {
            window.android.appAuth();
        } else {
            console.log("send app auth request.");
        }

        var authUrl = "http://182.254.140.228/portaltt/Logon.html";
        $.ajax({
            crossDomain: true,
            url: authUrl,
            data: '',
            dataType : "jsonp",
            // jsonp: "callback",//服务端用于接收callback调用的function名的参数
            // jsonpCallback:"success_jsonpCallback",//callback的function名称
            // 由于返回的是html网页，不是json数据，所以下面会认为请求失败，但实际AC已经认证通过
            success : function(data, textStatus) {
                        // $("#statusDesc").text("认证成功");
                      },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
            }
        });

        checkNetworkTimer = setTimeout(me.checkNetwork(), checkNetworkInterval);
        checkNetworkInterval = checkNetworkInterval + 1000;
    },

    reportAuthenSuccess : function() {
        console.log("reportAuthenSuccess.");
        if (!me.isLogin) {
            console.log("error! not login yet!");
            return;
        }
        var phone_number = $(".acount_list #account").text();
        var url = appServerUrl+"/dec_coin?phone_number="+phone_number;
        $.getJSON(url, function(data) {
            if (data.ret_code == 0) {
                $("#dialog_message").empty();
                var html = "<div class='modalViewTitle'>恭喜您已连接到免费小鸿WiFi</div>";
                html += "<div class='modalViewText'>今日消耗金币</div>";
                html += "<div class='modalViewBigText'>"+data.dec_coin_num+"</div>"
                html += "<div class='modalViewText'>您还有"+data.coin_num+"金币</div>";
                html += "<div class='modalViewText'>可以通过签到、下载并运行APP来获得金币</div>";
                $("#dialog_message").append(html);
                me.showTab(0);
                $("#dialog").jqmShow();
                $("#coin").text(data.coin_num);
            } else if (data.ret_code != 3001) { // 3001 means already deduction coin today
                showLoader(data.ret_msg);
                setTimeout("hideLoader()", 2000);
            }
        });
    },

    signIn : function() {

        console.log("sign in.");
        if (!me.isLogin) {
            return;
        }
        var phone_number = $(".acount_list #account").text();
        var url = appServerUrl+"/user_sign?phone_number="+phone_number;
        $.getJSON(url, function(data) {
            if (data.ret_code == 0) {
                $("#dialog_message").empty();
                var html = "<div class='modalViewTitle'>恭喜您已签到成功</div>";
                html += "<div class='modalViewText'>今日赢取金币</div>";
                html += "<div class='modalViewBigText'>"+data.add_coin_num+"</div>"
                $("#dialog_message").append(html);
                me.showTab(0);
                $("#dialog").jqmShow();
                $("#coin").text(data.coin_num);
            } else if (data.ret_code == 3002) {
                showLoader("今天已经领取过了，明天再来哟！");
                setTimeout("hideLoader()", 3000);
            } else {
                showLoader(data.ret_msg);
                setTimeout("hideLoader()", 3000);
            }
        });
    },

    updateWifiStatusUI : function(status) {
        // WifiStatus = {"disconnected" : 0, "connected" : 1, "kulian" : 2, "kulianAuthed" : 3};
        console.log("updateWifiStatusUI:"+status);
        switch (parseInt(status))
        {
            case 0:
                $("#statusDesc").text("未连接到Wifi");
                $(".wifiStatus .statusOff").show();
                $(".wifiStatus .statusOn").hide();
                $("#connectWifiBtn").show().text("连接小鸿免费Wifi");
                $(".portalframe").hide();
                break;
            case 1:
                $("#statusDesc").text("已连接到Wifi: "+$("#statusDesc").data("wifissid"));
                $(".wifiStatus .statusOff").hide();
                $(".wifiStatus .statusOn").show();
                $("#connectWifiBtn").show().text("切换到小鸿免费Wifi");
                $(".portalframe").hide();
                break;
            case 2:
                $("#statusDesc").text("已连接到小鸿免费Wifi: "+$("#statusDesc").data("wifissid"));
                $(".wifiStatus .statusOff").hide();
                $(".wifiStatus .statusOn").show();
                $("#connectWifiBtn").show().text("认证上网");
                $(".portalframe").hide();
                break;
            case 3:
                $("#statusDesc").text("已连接到小鸿免费Wifi: "+$("#statusDesc").data("wifissid"));
                $(".wifiStatus .statusOff").hide();
                $(".wifiStatus .statusOn").show();
                $("#connectWifiBtn").hide();
                $(".portalframe").hide();
                break;
            default:
                break;
        }
    },

    showTab : function(idx) {
        var tabs = new Array("connectionView", "choiceView", "humorView", "mineView");
        for (var i = 0; i < tabs.length; i++) {
            if (i == idx) {
                $("#" + tabs[i]).show();
                $("#" + tabs[i] + "Btn").addClass("ui-btn-active");
            } else {
                $("#" + tabs[i]).hide();
                $("#" + tabs[i] + "Btn").removeClass("ui-btn-active");
            }
        }
        me.currentTabIdx = idx;
        if (idx == 1 && slide.isInited == true) { // app tab
            slide.show();
        } else {
            slide.hide();
        }
        if (idx == 0) {
            var footerHeight = $("#mainFooter").height();
            $("#task-list-wrapper .wrapper").css('height', ($(window).height()-footerHeight)+'px');
            me.refreshScroll(4);
       } else if (idx == 1) { // choice page
            var headerHeight = $("#appListHeader").height();
            var footerHeight = $("#mainFooter").height();
            // console.log("header:"+headerHeight+" footerHeight:"+footerHeight+" screenHeight:"+$(document).height());
            $("#tab-1 .wrapper").css('height', ($(window).height()-headerHeight-footerHeight)+'px');// screenHeight - topNavbarHeight-bottomNavbarHeight
            me.refreshScroll();
        } else if (idx == 2) {// iframe page （humor page）
            var footerHeight = $("#mainFooter").height();
            $("#humorIFrame").css('height', ($(window).height()-footerHeight)+'px');
        }
        var titles = new Array("连Wifi", "赚金币", "幽默搞笑", "我的");
        setTitle(titles[idx]);
    },

    requestAppAd : function()
    {
        var phone_number = me.getPhoneNumber();
        var url = appServerUrl+"/appad?phone_number="+phone_number+"&"+callback;
        console.log("requestAppAd:"+url);
        $.getJSON(url, function(data) {
            if (data.adlist != undefined && data.adlist.length > 0) {
                me.loadPopupAdView(data.adlist[0].ad_url);
            }
        });        
    },

    requestKulianWifi : function()
    {
        var url = appServerUrl+"/get_ssidlist?"+callback;
        console.log("requestKulianWifi:"+url);
        me.kuLianWifi = {"ssidlist": [ {"ssid":"@小鸿科技","ssid_passwd":""},{"ssid":"test","ssid_passwd":""}]};

        $.ajax({
            url: url,
            dataType : "jsonp",
            jsonp: "callback",
            success : function(data) {
                        console.log("requestKulianWifi success.");
                        if (data.ret_code == 0 && data.ssidlist.length > 0) {
                            me.kuLianWifi = data.ssidlist;
                        }
                        clearTimeout(requestKulianWifiTimer);
                    },
            error : function() {
                        console.log("requestKulianWifi fail.");
                        requestKulianWifiTimer = setTimeout(me.requestKulianWifi(), 2000);
                    }
        });
    },

    requestMessage : function()
    {
        var phone_number = me.getPhoneNumber();
        var url = appServerUrl+"/app_broadcast?phone_number="+phone_number+"&"+callback;
        console.log("requestAppMessage:"+url);
        $.getJSON(url, function(data) {
            if (data.broadcastlist != undefined && data.broadcastlist.length > 0) {
                me.parseMessages(data);
                var clickableMessage = $("#twitter div");
                $.each(clickableMessage, function (index,el) {
                    if ($(this).hasClass("clickable")) {
                        $(el).fastClick(function () {
                            if ($(this).data("url") != undefined) {
                                console.log("click on message, jump to url:"+$(this).data("url"));
                                window.location.href = $(this).data("url"); // jump to url
                            }
                        });                        
                    }
                });
                me.showMessage();
            }
        });
    },

    requestWifiList : function()
    {
        console.log("requestWifiList");
        if (window.android == undefined) {
            var url = localServerUrl + "/wifilist?"+callback;
            // console.log("requestWifiList:" + url);
            $.getJSON(url, function(data) {
                wifiListChanged(data);
            });
        } else {
            window.android.requestWifiList();
        }
        if (window.android) {
            setTimeout("me.requestWifiList()", 20000);
        }
    },

    parseWifiList : function(data)
    {
        var html = me.freeWifiListTemplate(data);
        $("#connectionView .freeWifi_box").empty();
        $("#connectionView .freeWifi_box").append(html);

        var html = me.encryptWifiListTemplate(data);
        $("#connectionView .annexWifi_box").empty();
        $("#connectionView .annexWifi_box").append(html);

        $(".wifiList img.lazy").lazyload({threshold:300, placeholder:null });
        $(window).trigger("scroll");

        $("#connectionView .wifiList li").fastClick(function() {
            me.connectWifi(this);
        });

        var arrWifiList = data.wifilist;

        for (var i = 0; i < arrWifiList.length; i++) {
            if (me.isKuLianWifi(arrWifiList[i].SSID)) {
                $("#connectWifiBtn").data("wifissid", arrWifiList[i].SSID);
                $("#connectWifiBtn").data("wifipasswd", '');
                $("#connectWifiBtn").data("wifiencrypt", arrWifiList[i].encrypt);
                break;
            }
        }
    },

    isKuLianWifi : function(ssid)
    {
        if (ssid.toLowerCase().startWith("ruijie") || ssid.toLowerCase().startWith("hongwifi") || ssid.toLowerCase().endWith("hongwifi") || ssid.indexOf("小鸿") != -1) { //   || ssid.startWith("SuperMary")
            console.log("isKuLianWifi match pattern: "+ssid);
            return true;
        }
        var ssidMD5 = CryptoJS.MD5(ssid, { asString: true });
        // console.log("my wifi ssid:"+ssid+"  MD5:"+ssidMD5);
        var isKuLian = false;
        // var passwd = "";
        var arrKuLianWifi = me.kuLianWifi;
        for (var j = 0; j < arrKuLianWifi.length; j++) {
            if (arrKuLianWifi[j].ssid == ssidMD5) {
                isKuLian = true;
                console.log("Found a xiaohong wifi:"+ssid);
                break;
            }
        }
        return isKuLian;
    },

    freeWifiListTemplate : function(res)
    {
        var data = res.wifilist;
        var arrHtml = new Array();
        var wifiCount = 0;
        for (var i = 0; i < data.length; i++) {

            if (data[i].encrypt != "" || data[i].SSID == connectedSSID) {
                continue;
            }

            var level = Math.abs(data[i].level);
            if (level > 90) { level = 1;}
            else if (level > 70) { level = 2; }
            else if (level > 50) { level = 3; }
            else { level = 4; }
            
            var li = "<li data-wifissid='"+data[i].SSID+"' data-wifiencrypt='"+data[i].encrypt+"'>";
            li += "<img class='wifi-icon lazy' data-original='images/wifi_signal_"+ level +".png' />";
            li += "<a>"+subString.autoAddEllipsis(data[i].SSID, 22, true)+"</a>";
            if (me.isKuLianWifi(data[i].SSID)) {
                li += "<span class='recomWifi_txtspan'>推荐</span>";
            }
            li += "</li>";
            arrHtml.push(li);
            wifiCount++;
        }
        $(".freeWifi_title").text(wifiCount+"个免费WiFi");
        if (wifiCount == 0) {
            $(".freeWifi").hide();
        } else {
            $(".freeWifi").show();
        }
        return arrHtml.join("");
    },

    encryptWifiListTemplate : function(res)
    {
        var data = res.wifilist;
        var arrHtml = new Array();
        var wifiCount = 0;
        for (var i = 0; i < data.length; i++) {
            if (data[i].encrypt == "" || data[i].SSID == connectedSSID) {
                continue;
            }

            var level = Math.abs(data[i].level);
            if (level > 90) { level = 1;}
            else if (level > 70) { level = 2; }
            else if (level > 50) { level = 3; }
            else { level = 4; }

            var li = "<li data-wifissid='"+data[i].SSID+"' data-wifiencrypt='"+data[i].encrypt+"' >";
            li += "<img class='wifi-icon lazy' data-original=\"images/wifi_signal_"+ level +".png\"><a>"+subString.autoAddEllipsis(data[i].SSID, 22, true)+"</a>";
            li += "<img class='lock-icon' src='images/lock.png' />";
            li += "</li>";
            arrHtml.push(li);
            wifiCount++;
        }
        if (wifiCount == 0) {
            $(".annexWifi").hide();
        } else {
            $(".annexWifi").show();
        }
        return arrHtml.join("");
    },

    connectWifi : function (obj)
    {
        var ssid    = $(obj).data("wifissid");
        var encrypt = $(obj).data("wifiencrypt");
        var pwd     = "";
        if (ssid == undefined) {
            showLoader("没有搜索到小鸿Wifi");
            setTimeout("hideLoader()", 2000);
            return;
        }
        if (encrypt != "") {
            pwd = prompt("请输入"+ssid+"的密码:", '');
            if (pwd == null) {
                return;
            }
        }
        console.log("connectWifi: "+ssid+"  pwd: "+pwd+"  encrypt: "+encrypt);
        showLoader("正在连接Wifi，请稍候");
        setTimeout("hideLoader()", 8000);

        if (window.android != undefined) {
            window.android.connectWifi(ssid, pwd, encrypt);
        } else {
            console.log("try to connect wifi but window.android is undefined");
        }
    },

    requestTaskList : function()
    {
        $("#task-list-wrapper .task-list .section.available").empty().append("<h5>做任务赚金币</h5>");
        $("#task-list-wrapper .task-list .section.inprogress").empty().append("<h5>已接任务</h5>");
        $("#task-list-wrapper .task-list .section.finished").empty().append("<h5>已完成任务</h5>");
        $("#task-list-wrapper .task-list .section.timedout").empty().append("<h5>超时任务</h5>");
        $("#task-list-wrapper .task-list .section.ended").empty().append("<h5>已结束任务</h5>");
        var phone_number = me.getPhoneNumber();
        var url = appServerUrl+"/get_tasklist?phone_number="+phone_number+"&"+callback;
        console.log("requestTaskList:" + url);
        $.getJSON(url, function(data) {
            if (data.ret_code == 0) {
                $("#task-list-wrapper .refresh-task-list").hide();
                $("#task-list-wrapper .wrapper").show();
                me.parseTaskList(data.tasklist);
                me.requestGzhTaskList();
                me.isGotTaskList = true;
            } else {
                showLoader(data.ret_msg);
                setTimeout("hideLoader()", 3000);
            }
        });
    },

    requestGzhTaskList : function()
    {
        var phone_number = me.getPhoneNumber();
        var url = appServerUrl+"/get_gzhtasklist?phone_number="+phone_number+"&"+callback;
        console.log("requestGzhTaskList:" + url);
        $.getJSON(url, function(data) {
            if (data.ret_code == 0) {
                $("#task-list-wrapper .refresh-task-list").hide();
                $("#task-list-wrapper .wrapper").show();
                me.parseGzhTaskList(data.tasklist);
                console.log("bind task item click event");

                $("#task-list-wrapper .task-list .index-item").one("click", function(){
                    me.clickOnTaskItem($(this));
                });

                $("#task-list-wrapper .task-list .index-item").click(function() {  // don't use fastclick, it will eat 'touchbegin' event
                });
                setTimeout(me.initIScroll(4), 500);
            } else {
                showLoader(data.ret_msg);
                setTimeout("hideLoader()", 3000);
            }
        });
    },

    clickOnTaskItem : function(obj) {
        console.log("click on task item");

        if (obj.data("url") != undefined) {
            if (window.android != undefined) {
                window.android.openWebview(obj.data("url"), obj.data("name"));
            } else {
                window.location.href = obj.data("url");
            }
        } else {
            me.clickOnGzhTask(obj);
        }

        // a wordaround for iscroll.js one click cause two click event issue
        setTimeout(function() {
            $("#task-list-wrapper .task-list .index-item").unbind("click").one("click", function() {
                me.clickOnTaskItem($(this));
            });
        },500);
    },

    acceptGzhTask : function(taskid)
    {
        var phone_number = me.getPhoneNumber();
        var url = appServerUrl+"/accept_gzh_task?phone_number="+phone_number+"&task_id="+taskid+"&"+callback;
        console.log("requestTaskList:" + url);
        $.getJSON(url, function(data) {
            if (data.ret_code == 0) {
                $('#copyToClipBdBtn').trigger('click');
                var dialogHtml="<div class='modalViewTitle'>任务领取成功</div><div class='modalViewText'>请在4小时内完成任务，超过时间任务将自动作废，无法获得金币奖励<br>公众号id已复制，请直接在微信中粘贴查找</div>";
                $("#gzh_dialog_message").html(dialogHtml);
                $("#gzhdialog").jqmShow();
            } else {
                showLoader(data.ret_msg);
                setTimeout("hideLoader()", 3000);
            }
        });
    },

    parseTaskList : function(tasklist)
    {
        var arrHtml = new Array();
        var phone_number = me.getPhoneNumber();
        for (var i = 0; i < tasklist.length; i++) {

            var url = tasklist[i].click_url+"phone_number="+phone_number;

            arrHtml.push("<li class='index-item list-index' data-url='"+url+"' data-name='"+tasklist[i].name+"'>");

            arrHtml.push("<div class='index-item-main'>");
            arrHtml.push("<dl class='clearfix' data-name='"+tasklist[i].name+"'>");
            arrHtml.push("<dt class='item-icon'><img src="+tasklist[i].logo_url+" /></dt>");
            arrHtml.push("<dd class='item-title item-title--t4'><div class='task_item'><span>"+tasklist[i].desc+"</span>");
            arrHtml.push("<i class='icon-arrow'></i></div></dd>");
            arrHtml.push("</dl></div>");

            arrHtml.push("<div class='app_down'>");
            arrHtml.push("<div class='app_coins'>");
            arrHtml.push("<div class='coin_num'><span>+"+tasklist[i].coin_num+"</span> 金币</div>");
            arrHtml.push("</div>");// app_coins
            arrHtml.push("<div class='ui-btn installBtn manageTab'><span>查看</span></div>");
            arrHtml.push("</div>");// app_down

            arrHtml.push("</li>");

            var html = arrHtml.join("");
        }

        $("#task-list-wrapper .task-list .section.available").show().append(html);
    },

    parseGzhTaskList : function(tasklist)
    {
        var arrHtml = new Array();
        var phone_number = me.getPhoneNumber();
        for (var i = 0; i < tasklist.length; i++) {
            me.addToTaskListTab(tasklist[i]);
        }
        var footerHeight = $("#mainFooter").height();
        $("#task-list-wrapper .wrapper").css('height', ($(window).height()-footerHeight)+'px');
        me.refreshScroll(4);
    },

    requestAppList : function()
    {
        showLoader();
        for (var type = 1; type <= 3; type++) {
            $("#tab-"+type+" .app-list").empty();
            setTimeout("me.requestAppTypePage("+type+", 1)" , 1000);
        }
    },

    getPhoneNumber : function()
    {
        if (me.isLogin) {
            var phone_number = $(".acount_list #account").text();
        } else {
            var phone_number = getItem('userName');
        }
        return phone_number;
    },
    // type : 1 ~ 3
    requestAppTypePage : function(type, page)
    {
        var phone_number = me.getPhoneNumber();
        var url = appServerUrl+"/applist_page?apptype="+type+"&page="+page+"&phone_number="+phone_number+"&"+callback;
        console.log("requestAppList:" + url);

        $("#tab-"+type+" .refresh-app-list").hide();

        $.ajax({
            url: url,
            dataType : "jsonp",
            jsonp: "callback",//"callname",//服务端用于接收callback调用的function名的参数
            // jsonpCallback:"success",//callback的function名称
            success : function(data) {
                        hideLoader();
                        if (data.applist_count == 0) {  // last page
                            $("#tab-"+type+" .scroller-pullUp").hide();
                            return;
                        }
                        $("#tab-"+type+" .wrapper").show();
                        me.curAppPageIdx[type] = page + 1;
                        me.appList = data;
                        var html;
                        if (type == 1) {
                            html = me.appBigLogoListTemplate(data);
                        } else {
                            html = me.appListTemplate(data);
                        }

                        $("#tab-"+type+" .app-list").append(html);
                        if (type == 1) {
                            $(".app-list img.lazy").lazyload({threshold:300, effect:"fadeIn", placeholder:null });
                            $(window).trigger("scroll");
                        }

                        $("#tab-"+type+" .app-list li").click(function() {  // don't use fastclick, it will eat 'touchbegin' event
                             me.clickOnApp(this);
                        });

                        $("#tab-"+type+" .app-list .installBtn").click(function(e) {
                            e.stopPropagation();

                            console.log('click on installBtn');
                            if ($(this).hasClass('downloading')) {
                                console.log('downloading, ignore download request...');
                                return;
                            }
                            if ($(this).attr("data-installed") == "YES") { // don't use $(this).data("installed")
                                if (window.android) {
                                    showLoader("请稍候...");
                                    setTimeout("hideLoader()", 2000);
                                    console.log('start app '+$(this).data("pkgname"));
                                    window.android.startAPP($(this).data("pkgname"));
                                    appLanched($(this).data("pkgname"));
                                } else {
                                    showLoader("只能在手机中打开");
                                    setTimeout("hideLoader()", 2000);
                                }
                                return;
                            }
                            if ($(this).attr("data-downloaded") == "YES") {
                                console.log('downloaded, install again...');
                                if (window.android) {
                                    if (window.android.installDownloadedAPP($(this).data("appid")) == false) {
                                        showLoader("请重新下载"); // todo: change status to not downloaded
                                        setTimeout("hideLoader()", 2000);
                                    }
                                } else {
                                    console.log('reinstall app...');
                                }
                                return;
                            }

                            me.downloadApp(this);
                            me.showDownloadProgress(this);
                        });
                        setTimeout(me.initIScroll(type), 2000);
                    },
            error : function() {
                        $("#tab-"+type+" .refresh-app-list").show();
                        $("#tab-"+type+" .wrapper").hide();
                    }
        });
    },

    showDownloadProgress : function(installBtn)
    {
        $(installBtn).addClass("inactive");
        //创建圆形进度条
        //如果为tab1(精选)中的安装按钮则在div.canvas-mask中创建进度条
        if ($(installBtn).hasClass('bigLogo-instBtn')) {
            var width = parseInt($(installBtn).parent().width()/8);
            console.log(width);
            $(installBtn).siblings('.app-img').children('.canvas-mask').show().radialIndicator({
                radius: width,
                displayNumber: false,
                barColor: '#fff',
                barBgColor: 'rgba(255,255,255,0.4)',
                barWidth: 6,
                initValue: 0,
                roundCorner : false,
                percentage: true
            });
            $(installBtn).text('下载中');
        } else if ($(installBtn).hasClass('downloadBtn')) {  // in app detail page
            $(installBtn).children('span').hide();
            $(installBtn).addClass('app-downloading--t3').radialIndicator({
                    radius: 12,
                    displayNumber: false,
                    barColor: '#48D1CC',
                    barBgColor: '#eee',
                    barWidth: 2,
                    initValue: 0,
                    roundCorner : false,
                    percentage: false
                });
        } else { // in app list page
            $(installBtn).siblings('.app_coins').hide();
            $(installBtn).children('span').hide();
            $(installBtn).addClass('app-downloading--t3').radialIndicator({
                radius: 15,
                displayNumber: false,
                barColor: '#48D1CC',
                barBgColor: '#eee',
                barWidth: 2,
                initValue: 0,
                roundCorner : false,
                percentage: false
            })
        }
    },

    appListTemplate : function(res)
    {
        var data = res.applist;
        if (data == null || data == undefined) {
            return;
        }

        var arrHtml = new Array();

        for (var j = 0; j < 2; j++) {

            for (var i = 0; i < data.length; i++) {

                if (data[i].PackageName == undefined) {
                    break;
                }

                var isAppInstalled = false;
                if (window.android != undefined && window.android.isAppInstalled(data[i].PackageName, 1)) {
                    isAppInstalled = true;
                }

                // 第一次遍历要未安装的，第二次遍历要已安装的
                if ((j == 0 && isAppInstalled == true) || (j == 1 && isAppInstalled == false)) {
                    continue;
                }

                arrHtml.push("<li data-appid='" + data[i].AppId + "' id=\"myId" + data[i].AppId +"\" class=\"index-item list-index\" >");
                arrHtml.push("<div class=\"index-item-main\">");
                arrHtml.push("<dl class=\"clearfix\">");
                arrHtml.push("<dt class=\"item-icon\"><span class=\"app-tags hide\"></span>");
                arrHtml.push("<img src=\"" + data[i].AppLogo + "\" />");
                arrHtml.push("</dt>");
                arrHtml.push("<dd class=\"item-title\">");
                arrHtml.push("<div class=\"item-title-sname\">");
                arrHtml.push("<div class=\"baiying-name\">");
                arrHtml.push(subString.autoAddEllipsis(data[i].AppName, 30, true) + "</div></div></dd>");
                arrHtml.push("<dd class=\"item-star\">");
                // arrHtml.push("<span class=\"score-star\"><span style=\"width:" + data[i].AppScore + "%;\"></span></span>");

                if (data[i].AppSize != "") {
                    // var size = parseFloat(data[i].AppSize/1000000).toFixed(1) + "MB";
                    arrHtml.push("<span class=\"new-item-size\">" + data[i].AppSize + "</span>");
                }

                arrHtml.push("</dd>");
                arrHtml.push("<dd>");
                arrHtml.push("<div class=\"xiaobian-comment\">");
                arrHtml.push(data[i].BriefSummary == "" ? "暂无介绍" : subString.autoAddEllipsis(data[i].BriefSummary, 25, true));
                arrHtml.push("</div></dd></dl></div>");

                arrHtml.push("<div class='app_down'>");
                // isAppInstalled = true;
                if (isAppInstalled) {
                    arrHtml.push("<div class='ui-btn installBtn inactive hasInstalled' data-installed='YES' data-applogo=\""+data[i].AppLogo+"\"  data-appname=\""+data[i].AppName+"\" data-appurl=\""+data[i].AppSource+"\" data-appid="+data[i].AppId+" data-pkgname=\""+data[i].PackageName+"\"><span>打  开</span></div>");
                } else {
                    arrHtml.push("<div class='app_coins'>");
                    arrHtml.push("<div class='coin_num'><span>+"+data[i].GiveCoin+"</span> 金币</div>");
                    arrHtml.push("</div>");

                    arrHtml.push("<div class='ui-btn installBtn' data-installed='NO' data-applogo=\""+data[i].AppLogo+"\"  data-appname=\""+data[i].AppName+"\" data-appurl=\""+data[i].AppSource+"\" data-appid="+data[i].AppId+" data-pkgname=\""+data[i].PackageName+"\"><span></span></div>");
                }
                arrHtml.push("</div>");
                arrHtml.push("</div>");
                arrHtml.push("</li>");
            }
        }

        return arrHtml.join("");
    },

    appBigLogoListTemplate : function (res) {

        var data = res.applist;
        if (data == null || data == undefined) {
            return;
        }

        var arrHtml = new Array();

        for (var j = 0; j < 2; j++) {

            for (var i = 0; i < data.length; i++) {

                if (data[i].PackageName == undefined) {
                    break;
                }

                var isAppInstalled = false;
                if (window.android != undefined && window.android.isAppInstalled(data[i].PackageName, 1)) {
                    isAppInstalled = true;
                }

                // 第一次遍历要未安装的，第二次遍历要已安装的
                if ((j == 0 && isAppInstalled == true) || (j == 1 && isAppInstalled == false)) {
                    continue;
                }

                arrHtml.push("<li data-appid='" + data[i].AppId + "' id=\"myId" + data[i].AppId +"\" class=\"index-item list-index h-list-item\" >");
                arrHtml.push("<div class=\"index-item-w\">");
                arrHtml.push("<div class='app-img'>");
                arrHtml.push("<img class='lazy' data-original='"+data[i].AppLargeLogo+"' />");
                //遮罩层
                arrHtml.push("<div class='canvas-mask'></div>");
                arrHtml.push("<div class='dummy'></div>");
                arrHtml.push("</div>");

                arrHtml.push("<div class=\"h baiying-name\">");
                arrHtml.push(subString.autoAddEllipsis(data[i].AppName, 30, true));
                if (data[i].AppSize != "") {
                    arrHtml.push("<span class=\"new-item-size\"> " + data[i].AppSize + " </span>");
                }
                arrHtml.push("</div>");
                // isAppInstalled = true;
                if (isAppInstalled) {
                    arrHtml.push("<div class='ui-btn installBtn bigLogo-instBtn hasInstalled inactive' data-installed='YES' data-applogo=\""+data[i].AppLogo+"\"  data-appname=\""+data[i].AppName+"\" data-appurl=\""+data[i].AppSource+"\" data-appid="+data[i].AppId+" data-pkgname=\""+data[i].PackageName+"\">打 开</div>");
                    arrHtml.push("<i class='down-symbol--t1'></i>")
                } else {
                    arrHtml.push("<div class='ui-btn installBtn bigLogo-instBtn' data-installed='NO' data-applogo=\""+data[i].AppLogo+"\"  data-appname=\""+data[i].AppName+"\" data-appurl=\""+data[i].AppSource+"\" data-appid="+data[i].AppId+" data-pkgname=\""+data[i].PackageName+"\">下 载</div>");
                }
                arrHtml.push("<div class='app-down-des'>打开才能获金币<span class='reward'>+"+data[i].GiveCoin+"</span></div>");
                arrHtml.push("</div>");
                arrHtml.push("</li>");
            }
        }
        return arrHtml.join("");
    },

    getAppInfoById : function (appId)
    {
        var appList = me.appList.applist;
        for (var i = 0; i < appList.length; i++) {
            if (appList[i].AppId == appId) {
                return appList[i];
            }
        }
        return null;
    },

    clickOnGzhTask : function (obj)
    {
        $("#wechatTaskContent").empty();
        var arrHtml = new Array();
        arrHtml.push("<div class='row'><dt><div>任务名称</div></dt><dd><div>"+$(obj).data("taskname")+"</div></dd></div>");
        arrHtml.push("<div class='row'><dt><div>可获金币</div></dt><dd><div>"+$(obj).data("coin")+"枚</div></dd></div>");
        arrHtml.push("<div class='row'><dt><div>任务步骤</div></dt><dd><div>1，点击“领取任务”；<br>2，关注公众号；<br>3，向公众号发送“小鸿”；<br>4，点击公众号回复的链接，在打开的页面中输入小鸿账号（手机号）领取金币；</div></dd></div>");
        arrHtml.push("<div class='row'><dt><div>微信公众号</div></dt><dd><div>"+$(obj).data("wechatid")+"  <a href='' id='copyToClipBdBtn' data-text="+$(obj).data("wechatid")+" class='ui-btn'>复制到剪贴板</a></div></dd></div>");
        arrHtml.push("<div class='row'><dt><div>公众号二维码</div></dt><dd class='crcode'><img src="+$(obj).data("qrcodeurl")+"></dd></div>");

        // task status: 1 可领取    2 已领取    3 已完成   4 超时（领取但未完成）   5任务已结束（未领取）
        if ($(obj).data("taskstatus")=='1') { // 可领取
            arrHtml.push("<br><center><div>还有"+$(obj).data("remainnum")+"个名额</div></center>");
            arrHtml.push("<div class='account_exit' style='margin-top:20px; '><center><a href='' id='acceptTaskBtn' data-taskid='"+$(obj).data("taskid")+"' class='ui-btn'>领取任务</a></center></div>");
        } else if ($(obj).data("taskstatus")=='2') { // 已领取
            var date = new Date(parseInt($(obj).data("remaintime"))*1000);
            var dateStr = convertDateToString(date);
            arrHtml.push("<div class='row'><dt><div>到期时间</div></dt><dd><div>"+dateStr+"</div></dd></div>");
        } else if ($(obj).data("taskstatus")=='3') { // 已完成
            arrHtml.push("<br><center><div>已完成</div></center>");
        } else if ($(obj).data("taskstatus")=='4') { // 超时
            arrHtml.push("<br><center><div>已超时</div></center>");
        } else if ($(obj).data("taskstatus")=='5') { // 结束
            arrHtml.push("<br><center><div>已结束</div></center>");
        }
        $("#wechatTaskContent").append(arrHtml);
        $("#acceptTaskBtn").fastClick(function() {
            me.acceptGzhTask($(this).data("taskid"));
        });
        $("#copyToClipBdBtn").fastClick(function() {
            console.log("copy "+$(this).data("text")+" to clipboard");
            me.copyToClipboard($(this).data("text"));
        });
        changePage('#WechatTaskDetailPage');
    },

    clickOnApp : function (obj)
    {
        var appId = $(obj).data("appid");
        me.requestAppDetail(appId);
    },

    requestAppDetail : function (appId)
    {
        var url = appServerUrl+"/appdetail?"+callback+"&apptype="+me.curAppTabIdx+"&appid="+appId;
        console.log(url);
        showLoader();
        $.getJSON(url, function(data) {
            hideLoader();
            me.parseAppDetail(data);
        });
    },

    parseAppDetail : function (data)
    {
    	$(".appDetail").empty();
        var html = me.appDetailTemplate(data.detail_info);
        $(".appDetail").append(html);
        if (me.getAppStatus(data.detail_info.AppId) == 'downloading') {
            var btns = $('.appDetail .downloadBtn');
            $.each(btns, function (index,el) {
                me.showDownloadProgress(el);
            });
        }

        $(".downloadBtn").fastClick(function() {

            if ($(this).attr("data-installed") == "YES") {
                if (window.android) {
                    showLoader("请稍候...");
                    setTimeout("hideLoader()", 2000);
                    console.log('start app '+$(this).data("pkgname"));
                    window.android.startAPP($(this).data("pkgname"));
                    appLanched($(this).data("pkgname"));
                } else {
                    showLoader("只能在手机中打开");
                    setTimeout("hideLoader()", 2000);
                }
                return;
            }
            if ($(this).attr("data-downloaded") == "YES" || $(this).hasClass("hasDownloaded")) {
                console.log('downloaded, ignore download request...');
                return;
            }

            // update download status both in app detail and app list page
            var installBtns = $(".installBtn[data-appid="+$(this).data("appid")+"]");
            $.each(installBtns, function (index,el) {
                me.showDownloadProgress($(el));
            });

            me.downloadApp(this);
        });

        //轮播图点击放大
        $('.swiper-container').on('click','.swiper-slide',function(){
            var $parent = $('.swiper-container'),
                index = $(this).index();
            //alert(index);
            if (!$parent.hasClass('larger')){
                $parent.addClass('larger');
                gallery.params.slidesPerView = 1;
                gallery.update({initialSlide:index});
            }else {
                $parent.removeClass('larger');
                gallery.params.slidesPerView = 2;
                gallery.update({initialSlide:index});
            }
        });

        changePage("#AppDetailPage");
    },

    downloadApp : function (installBtn)
    {
        console.log("downloadApp");
        if ($(installBtn).data("installed") == 'YES') {
            showLoader("软件已经安装了");
            setTimeout("hideLoader()", 2000);
            return;
        }
        var appId = $(installBtn).data("appid");
        var btns = $(".installBtn[data-appid="+appId+"]");
        $.each(btns, function (index,el) {
            $(el).addClass("downloading");
        });

        if (window.android != undefined) {
            var appInfo = me.getAppInfoById(appId);
            if (appInfo != null) {
                var mac = window.android.getMacAddress();
                var url = appInfo.Clickurl.replace("[M_MAC]", mac);
                var imei = window.android.getIMEI();
                url = url.replace("[M_IMEI]", imei);
                $.getJSON(url, function(data) {
                    console.log("report click:"+url);
                });
            }

            window.android.downloadApp(appId, $(installBtn).data("appname"), $(installBtn).data("pkgname"), $(installBtn).data("appurl"));
            showLoader("开始下载，保持WIFI酷连打开，完成安装后才会赠送金币哦");
            setTimeout("hideLoader()", 3000);
        } else { // for test on browser
            console.log("window.android undefined. url:" + $(installBtn).data("appurl"));
            setTimeout("updateDownloadProgress("+$(installBtn).data("appid")+",40)", 1000);
            setTimeout("updateDownloadProgress("+$(installBtn).data("appid")+",70)", 2000);
            setTimeout("finishDownloadProgress("+$(installBtn).data("appid")+")", 3000);
            setTimeout("appInstallFinished("+$(installBtn).data("appid")+")", 8000);
        }
    },

    removeFromWifiList : function(SSID)
    {
        var li = $(".wifiList li[data-wifissid='"+SSID+"']");
        li.remove();
        var wifiCount = $(".freeWifi_box li").length;
        $(".freeWifi_title").text(wifiCount+"个免费WiFi");
        if (wifiCount == 0) {
            $(".freeWifi").hide();
        }
        wifiCount = $(".annexWifi_box li").length;
        if (wifiCount == 0) {
            $(".annexWifi").hide();
        } else {
            $(".annexWifi").show();
        }
    },
/*
    removeFromAppManageTab : function(installBtn)
    {
        var li = $("#tab-4 .app-list li[data-appid='" + $(installBtn).data('appid')+"']");
        li.remove();
        if ($("#tab-4 .app-list .downloading").children("li").length == 0) {
            $("#tab-4 .app-list .downloading").hide();
        }
        if ($("#tab-4 .app-list .hasDownloaded").children("li").length == 0) {
            $("#tab-4 .app-list .hasDownloaded").hide();
        }
        if ($("#tab-4 .app-list .hasInstalled").children("li").length == 0) {
            $("#tab-4 .app-list .hasInstalled").hide();
        }
    },
*/
    addToTaskListTab : function(task)
    {
        if (task.task_status > 5) {
            console.log("unknown task status:"+task.task_status);
            return;
        }
        var arrHtml = new Array();
        arrHtml.push("<li class='index-item list-index' data-taskid='"+task.id+"' data-taskname=\""+task.name+"\" ");
        arrHtml.push("data-coin='"+task.coin_num+"' data-wechatid='"+task.weixin_id+"' data-qrcodeurl='"+task.qr_code_url+"' data-taskstatus='"+task.task_status+"' data-remainnum='"+task.remain_tasknum+"' data-remaintime='"+task.remain_time+"' class='index-item list-index' >");
        arrHtml.push("<div class='index-item-main'>");
        arrHtml.push("<dl class='clearfix'>");
        arrHtml.push("<dt class='item-icon'><img src='images/wechat.png' /></dt>");
        arrHtml.push("<dd class='item-title item-title--t4'>");
        arrHtml.push("<div class='task_item'>");
        arrHtml.push("<span>"+subString.autoAddEllipsis(task.name, 30, true) + "</span>");
        arrHtml.push("<i class='icon-arrow'></i>");
        arrHtml.push("</div></dd></dl></div>");

        arrHtml.push("<div class='app_down'>");
        // console.log($(installBtn).data());
        if (task.task_status == 1) {
            // arrHtml.push("<div class='ui-btn installBtn manageTab inactive' ><span>打  开</span></div>");
            arrHtml.push("<div class='app_coins'>");
            arrHtml.push("<div class='coin_num'><span>+"+task.coin_num+"</span> 金币</div>");
            arrHtml.push("</div>");
            arrHtml.push("<div class='ui-btn installBtn manageTab'><span>查看</span></div>");
        } else if (task.task_status == 2) {
            arrHtml.push("<div class='ui-btn installBtn manageTab inactive' ><span>已接</span></div>");
        } else if (task.task_status == 3) {
            arrHtml.push("<div class='ui-btn installBtn manageTab'><span>已完成</span></div>");
        } else if (task.task_status == 4) {
            arrHtml.push("<div class='ui-btn installBtn manageTab'><span>已超时</span></div>");
        } else if (task.task_status == 5) {
            arrHtml.push("<div class='ui-btn installBtn manageTab'><span>已结束</span></div>");
        }
        arrHtml.push("</div></li>");// app_down

        var html = arrHtml.join("");

        if (task.task_status == 1) {
            $("#task-list-wrapper .task-list .section.available").show().append(html);
        } else if (task.task_status == 2) {
            $("#task-list-wrapper .task-list .section.inprogress").show().append(html);
        } else if (task.task_status == 3) {
            $("#task-list-wrapper .task-list .section.finished").show().append(html);
        } else if (task.task_status == 4) {
            $("#task-list-wrapper .task-list .section.timedout").show().append(html);
        } else {
            $("#task-list-wrapper .task-list .section.ended").show().append(html);
        }
    },

    appDetailTemplate : function(data)
    {
        var arrHtml  = new Array();
        arrHtml.push(me.appIntroTemplate(data));

        arrHtml.push("<div class='swiper-container'><div class='swiper-wrapper'>");
        for (var i = 0; i < data.ImageSrcList.length; i++) {
          arrHtml.push("<div class='swiper-slide'><img src='" + data.ImageSrcList[i] + "' alt=''/></div>");
        }
        arrHtml.push("</div><div class='swiper-pagination'></div></div>");
        arrHtml.push(me.descriptionTemplate(data));
        return arrHtml.join("");
    },

    appIntroTemplate : function (data)
    {
        var arrHtml = new Array();
        arrHtml.push("<section class=\"intro\">");
        arrHtml.push("<div class=\"icon-brief\">");
        arrHtml.push("<div class=\"icon\">");
        arrHtml.push("<img src=\"" + data.AppLogo + "\" alt=\"\" />");
        arrHtml.push("</div>");
        arrHtml.push("<div class=\"content-brief\">");
        arrHtml.push("<span class=\"sname contentAppName\">" + data.AppName+ "</span>");
        arrHtml.push("<div class=\"download_size\">");
        arrHtml.push("<span>");
        arrHtml.push("v" + subString.autoAddEllipsis(data.AppVersion, 10, false) + "&nbsp;|&nbsp;" + data.AppSize);
        arrHtml.push("</span>");
        arrHtml.push("</div>");
        arrHtml.push("</div>");

        arrHtml.push("</div>");
        // var gaAppName = data.AppName.replace(/\"/g, "”").replace(/'/g, "’");

        arrHtml.push("<div id='divdownarea' class='down-area'>");
        arrHtml.push("<div class='content-btn-con'>");
        arrHtml.push("<a class='downloadBtn installBtn ");

        var appinfo = "data-appurl='"+data.AppSource+"' data-appname='"+data.AppName+"' data-appid='"+data.AppId+"' data-pkgname='"+data.PackageName+"' data-applogo='"+data.AppLogo+"' ";
        var status = me.getAppStatus(data.AppId);

        if (status == null) {
            arrHtml.push(" ' data-installed='NO' "+appinfo+"><span>下载</span></a>");
        } else if (status == 'hasInstalled') {
            arrHtml.push(" hasInstalled' data-installed='YES' "+appinfo+"><span>已安装</span></a>");
        } else if (status == 'hasDownloaded') {
            arrHtml.push(" hasDownloaded' data-installed='NO' "+appinfo+"><span>已下载</span></a>");
        } else if (status == 'downloading') {
            arrHtml.push(" ' data-installed='NO' "+appinfo+"><span>正在下载</span></a>");
        }

        arrHtml.push("</div>");
        arrHtml.push("</div>");
        arrHtml.push("</section>");

        return arrHtml.join("");
    },

    getAppStatus : function (appId)
    {
        var status = null;
        var btns = $(".installBtn[data-appid="+appId+"]");
        $.each(btns, function (index,el) {
            if ($(el).hasClass('downloading')) {
                status = 'downloading';
            } else if ($(el).hasClass('hasDownloaded')) {
                status = 'hasDownloaded';
            } else if ($(el).hasClass('hasInstalled')) {
                status = 'hasInstalled';
            }
        });
        return status;
    },

    descriptionTemplate : function (data)
    {
        var arrHtml = new Array();
        arrHtml.push("<section class=\"description\">");
        arrHtml.push("<div class=\"content-navdes-wrapper\">");
        arrHtml.push("<div class=\"des-main\">");
        // arrHtml.push("<div class=\"des-indent des-short\">");

        arrHtml.push("<div class=\"des-long-content\">");
        // arrHtml.push("<p>" + data.BriefSummary + "</p>");
        arrHtml.push("<p>" + data.AppSummary.replace(/\r\n/g,"<br/>").replace(/\\n/g,"<br/>").replace(/\n/g,"<br/>") + "</p>");
        arrHtml.push("</div>");
        // arrHtml.push("</div>");
        arrHtml.push("</div>");
        arrHtml.push("</div>");
        arrHtml.push("</section>");
        return arrHtml.join("");
    },

    //获取查询参数
    parseQueryString : function ()
    {
        var str = window.location.search;
        var objURL = {};
        str.replace(
            new RegExp("([^?=&]+)(=([^&]*))?", "g"),
            function ($0, $1, $2, $3) {
                objURL[$1] = $3;
            }
        );
        return objURL;
    },

    parseMessages : function (res)
    {
        var data = res.broadcastlist;
        if (data == null || data == undefined) {
            return;
        }

        var arrHtml = new Array();

        if (data.length > 0) {
            $(".message_grid").show();
        }

        for (var i = 0; i < data.length; i++) {
            arrHtml.push("<li><div ");
            if (data[i].click_url != undefined) {
                arrHtml.push("class=clickable  data-url='"+data[i].click_url+"'");
            }
            arrHtml.push("><p>"+data[i].broadcast_item+"</p></div></li>");
        }
        var html = arrHtml.join('');
        $("#twitter").append(html);
    },

    showMessage : function ()
    {
        
        if ($("#twitter li").length > 1) {
            $("#twitter li:not(:first)").css("display","none");
            var B = $("#twitter li:last");
            var C = $("#twitter li:first");
            setInterval(function() {
                if (B.is(":visible")) {
                    C.fadeIn(500).addClass("in");
                    B.hide()
                } else {
                    $("#twitter li:visible").addClass("in");
                    $("#twitter li.in").next().fadeIn(500);
                    $("li.in").hide().removeClass("in");
                }
            },5000); // 切换间隔
        }
    },

    requestVerifyCode : function()
    {
        if ($(".verifyCodeBtn").hasClass("text_disabled")) {
            console.log("Please wait...");
            return;
        }
        $(".verifyCodeBtn").addClass("text_disabled");
        var phone_number = $("#registPhoneNumber").val();
        if (phone_number == '' || phone_number == '请填写您的手机号' || !isPhoneNumber(phone_number)) {
            showLoader("请填写手机号");
            setTimeout("hideLoader()", 2000);
            return;
        }

        var url = appServerUrl+"/appverifycode?"+callback+"&phone_number="+phone_number;
        if (me.isLeShiPhone()) {
            url += "&leshi=1";
        }
        console.log(url);
        $.getJSON(url, function(data) {
            if (data.ret_code == 0) {

                if (me.isLeShiPhone()) {
                    receivedVerifyCode(getRandomNum(1000, 10000));
                } else {
                    showLoader("验证码已通过短信发送");
                    setTimeout("hideLoader()", 2000);
                    $(".verifyCodeBtn").addClass("text_disabled");
                    me.countDownSeconds = 120;
                    setTimeout("me.countDown()", 1000);
                    $(".verifyCodeBtn").attr("disabled","disabled");
                    if (window.android) {
                        window.android.startVerifyCodeObserver();
                    }
                }
            } else {
                showLoader(data.ret_msg);
                setTimeout("hideLoader()", 3000);
                $(".verifyCodeBtn").removeClass("text_disabled");
            }
        }
    )},

    countDown : function()
    {
        $(".verifyCodeBtn").text(me.countDownSeconds + "秒");
        me.countDownSeconds = me.countDownSeconds - 1;
        if (me.countDownSeconds <= 0) {
            me.resetCountDown();
        } else {
            countDownTimer = setTimeout("me.countDown()", 1000);
        }
    },

    resetCountDown : function ()
    {
        if (countDownTimer != null) {
            clearTimeout(countDownTimer);
            countDownTimer = null;
        }
        $(".verifyCodeBtn").removeClass("text_disabled").text("获取验证码");
        $(".verifyCodeBtn").attr("disabled","");
    },

    validLogin : function()
    {
        if ($("#loginUsername").val()=='' || $("#loginUsername").val()=='请填写您的手机号' || !isPhoneNumber($("#loginUsername").val())) {
            showLoader("请填写手机号");
            setTimeout("hideLoader()", 2000);
            return false;
        }
        if ($("#loginPassword").val()=='') {
            showLoader("请填写密码");
            setTimeout("hideLoader()", 2000);
            return false;
        }
        return true;
    },

    validRegist : function()
    {
        if ($("#registPhoneNumber").val()=='' || $("#registPhoneNumber").val()=='请填写您的手机号' || !isPhoneNumber($("#registPhoneNumber").val())) {
            showLoader("请填写手机号");
            setTimeout("hideLoader()", 2000);
            return false;
        }
        if ($("#registVerifyCode").val()=='') {
            showLoader("请填写验证码");
            setTimeout("hideLoader()", 2000);
            return false;
        }

        if (me.isChangingPassword) {
            if ($("#registPassword").val()=='') {
                showLoader("请填写密码");
                setTimeout("hideLoader()", 2000);
                return false;
            }
            if ($("#registPassword").val().length>16) {
                showLoader("密码长度不能超过16位");
                setTimeout("hideLoader()", 2000);
                return false;
            }
            var filter=/[`~!@#$^&*()\-\+=|\\\[\]\{\}:;'\,.<>/?]/;
            if (filter.test($("#registPassword").val())) {
                showLoader("密码只能包含字母、数字和下划线");
                setTimeout("hideLoader()", 2000);
                return false;
            }
            if ($("#repeatPassword").val()!=$("#registPassword").val()) {
                showLoader("两次输入的密码不一致");
                setTimeout("hideLoader()", 2000);
                return false;
            }
        } else {
            var gender = $("input:radio[name='gender']:checked").val() ;
            if (gender == undefined) {
                showLoader("请选择性别");
                setTimeout("hideLoader()", 2000);
                return false;
            }

            if ($("#inviteCode").val().length > 6) {
                showLoader("邀请码无效");
                setTimeout("hideLoader()", 2000);
                return false;
            }            
        }
        return true;
    },

    register : function ()
    {
        if (me.validRegist()) {
            var phone_number = $("#registPhoneNumber").val();
            var verify_code  = $("#registVerifyCode").val();
            var inviteCode   = $("#inviteCode").val();
            if (me.isChangingPassword) {
                var passwd    = $("#registPassword").val();
                var passwdMD5 = CryptoJS.MD5(passwd, { asString: true });
                var url = appServerUrl+"/reset_passwd?"+callback+"&phone_number="+phone_number+"&new_passwd="+passwdMD5+"&verify_code="+verify_code;
            } else {
                var passwd    = phone_number.substr(5, 6); // get phone number last 6 digit
                var passwdMD5 = CryptoJS.MD5(passwd, { asString: true });
                var gender = $("input:radio[name='gender']:checked").val() ;
                var url = appServerUrl+"/appregister?"+callback+"&phone_number="+phone_number+"&passwd="+passwdMD5+"&verify_code="+verify_code+"&gender="+gender;
                if (inviteCode && inviteCode.length > 0 && inviteCode != "可不填") {
                    url += "&invite_code=" + inviteCode;
                }
                if (me.isLeShiPhone()) {
                    url += "&leshi=1";
                }
                saveItem("userName", phone_number);
                saveItem("passWord", passwd);
            }
            console.log(url);

            $.getJSON(url, function(data) {
                me.resetCountDown();  // 重置验证码倒计时
                if (data.ret_code == 0) {
                    if (me.isChangingPassword == false) {
                        me.saveToken(data.token);
                        showLoader("验证成功");
                        me.isLogin = true;
                        $("#logoutBtn").show();
                    } else {
                        showLoader("密码修改成功");
                        saveItem("userName", phone_number);
                        saveItem("passWord", passwd);
                    }

                    if (data.coin_num == undefined) {
                        data.coin_num = 0;
                    }
                    if (data.invite_code == undefined) {
                        $("#myInviteCode").hide();
                    }

                    $("#coin").text(data.coin_num);

                    setTimeout("changePageAndHideLoader(\"#MainPage\")", 2000);
                    $("#account").text(phone_number);
                    $("#myInviteCode").text(data.invite_code);

                } else {
                    showLoader(data.ret_msg);
                    setTimeout("hideLoader()", 3000);
                }
            });
        }
    },

    autoLogin : function()
    {
        console.log("autoLogin");
        clearTimeout(autoLoginTimer);

        if (me.isLogin) {
            return;
        }
        if (me.autoLoginRetryCount > 10) {
            console.log("reach max auto login retry count, abort.");
            showLoader("无法联系服务器，请检查网络");
            setTimeout("hideLoader()", 3000);
            me.autoLoginRetryCount = 0;
            return;
        }
        console.log("autoLogin retry count:"+me.autoLoginRetryCount);
        var nativePackageName = "com.xiaohong.kulian";
        var phone_number = getItem("userName");
        var passwd       = getItem("passWord");
        if (phone_number == undefined || phone_number == null || phone_number.length == 0) {
            changePage("#RegisterPage");
            if (window.android != undefined && window.android.isAppInstalled(nativePackageName, 0)) {
                window.android.startAPP(nativePackageName);
            }
            return;
        }

        if (window.android != undefined && window.android.isAppInstalled(nativePackageName, 0)) {
            window.android.startNativeAppWithLoginInfo(nativePackageName, phone_number, passwd);
        }

        var passwdMD5    = CryptoJS.MD5(passwd, { asString: true });
        var url = appServerUrl+"/applogin?"+callback+"&phone_number="+phone_number+"&passwd="+passwdMD5;
        console.log(url);

        $.ajax({
            url: url,
            dataType : "jsonp",
            jsonp: "callback",//"callname",//服务端用于接收callback调用的function名的参数
            success : function(data) {
                        me.autoLoginRetryCount = 0;
                        if (data.ret_code == 0) {
                            me.isLogin = true;
                            me.saveToken(data.token);
                            // changePage("#MainPage");
                            console.log("login success, coin num:" + data.coin_num);

                            $("#logoutBtn").show();
                            if (data.coin_num == undefined) {
                                data.coin_num = 0;
                            }

                            $("#account").text(phone_number);
                            $("#myInviteCode").text(data.invite_code);
                            $("#coin").text(data.coin_num);

                            if (parseInt($("#connectWifiBtn").attr("data-wifiStatus")) == WifiStatus.kulianAuthed) {
                                me.reportAuthenSuccess();
                            }

                            me.reportConnection(phone_number);
                        } else {
                            console.log("auto login:"+data.ret_msg);
                            changePage("#RegisterPage");
                        }
                    },
            error : function() {
                        console.log("autoLogin network fail.");
                        autoLoginTimer = setTimeout(me.autoLogin(), 2000);
                        me.autoLoginRetryCount++;
                    }
        });
    },

    reportConnection : function(phone_number)
    {
        if (window.android == undefined || phone_number == undefined) {
            return;
        }
        // data内容，utf8，json编码
        // mm，手机mac
        // wm，wifimac
        // mn，手机号码
        // tm，时间戳

        // 20151105 add
        // ver, app版本号
        // imei
        // imsi
        // pos 经纬度:  lat(经),lon(纬)
        // mi, mobile info
        var macAddr = window.android.getMacAddress();
        var BSSID = window.android.getBSSID();
        if (macAddr == undefined || BSSID == undefined) {
            console.log("reportConnection error : mac["+macAddr+"] BSSID["+BSSID+"]");
            return;
        }

        if (window.android.getLatLonString() != "0.0,0.0") {
            window.android.stopListenGPS();
        }
        var time = parseInt(new Date().getTime()/1000);

        var data = {
            "mm":  macAddr,
            "mn":  phone_number,
            "tm":  time,
            "wm":  BSSID,
            "opt": "put",
            "name":"appmm",
            "auth":"hongkulian",
            "mi":  window.android.getMobileInfo(),
            "imei":window.android.getIMEI(),
            "imsi":window.android.getIMSI(),
            "ver": version,
            "pos": window.android.getLatLonString()
        };
        var url = "http://115.159.89.152:1220/?name=appmm&opt=put&data="+jsonToString(data)+"&auth=hongkulian&"+callback;
        console.log(url);
        $.ajax({
            url: url,
            dataType : "text",
            success : function(data) {},
            error : function() {}
        });
    },

    requestExchange : function(obj)
    {
        var myCoin = parseInt($("#coin").text());
        var needCoin = $(obj).data("coin");
        if (myCoin < needCoin) {
            showLoader("您的金币数不足");
            setTimeout("hideLoader()", 3000);
            return;
        }
        var type = $(obj).data("exchangetype");
        var phone_number = $(".acount_list #account").text();
        var url = appServerUrl+"/exchange?"+callback+"&phone_number="+phone_number+"&coin="+needCoin+"&exchange_type="+type;
        console.log(url);
        showLoader();

        $.getJSON(url, function(data) {
            if (data.ret_code == 0) {
                showLoader("话费兑换申请已提交，将在两个工作日内充值到您手机号码内");
                $("#coin").text(data.coin_num);// update coin num
                setTimeout("changePageAndHideLoader(\"#MainPage\")", 3000);
            } else {
                showLoader(data.ret_msg);
                setTimeout("hideLoader()", 3000);
            }
        });
    },

    saveToken : function(token)
    {
        $.cookie("token", token, {expires:10});
    },

    getVersion : function()
    {
        if (version == null) {
            if (window.android != undefined) {
                version = window.android.getVersion();
            } else {
                version = '1.0build0';
            }
        }
        return version;
    },

    fillVersion : function()
    {
        $("#version").text(me.getVersion());
    },

    showAppTab : function (tabIdx) {
        me.curAppTabIdx = tabIdx;
        var headerHeight = $("#appListHeader").height();
        var footerHeight = $("#mainFooter").height();
        // console.log("header:"+headerHeight+" footerHeight:"+footerHeight+" screenHeight:"+$(document).height());
        $("#tab-"+tabIdx+" .wrapper").css('height', ($(document).height()-headerHeight-footerHeight)+'px');// screenHeight - topNavbarHeight-bottomNavbarHeight
    },

    refreshScroll : function (idx) {
        if (idx == undefined) {
            idx = me.curAppTabIdx;
        }
        if (me.myScroll && me.myScroll[idx]) {
            me.myScroll[idx].refresh();
        }
    },
    
    initIScroll : function (idx) {
        console.log("initIScroll");
        if (me.myScroll == null) {
            me.myScroll = new Array(5);
        }

        if (me.myScroll[idx] != null) {
            me.myScroll[idx].destroy();
        }

        var upIcon = null;
        if (idx != 4) {
            upIcon = $("#tab-"+idx+" .up-icon");
            me.myScroll[idx] = new IScroll("#tab-"+idx+" .wrapper", 
                                {click:true, probeType: 3, mouseWheel: true, fadeScrollbars: true }
                                );
        } else {
            upIcon = $("#task-list-wrapper .up-icon");
            me.myScroll[idx] = new IScroll("#task-list-wrapper .wrapper", 
                                {click:true, probeType: 3, mouseWheel: true, fadeScrollbars: true }
                                );
        }
            // var downIcon = $("#tab-"+me.curAppTabIdx+" .down-icon");

        me.myScroll[idx].on("scroll",function() {
            var y = this.y,
                maxY = this.maxScrollY - y,
                // downHasClass = downIcon.hasClass("reverse_icon"),
                upHasClass = upIcon.hasClass("reverse_icon");
            
            // if(y >= 40){
            //     !downHasClass && downIcon.addClass("reverse_icon");
            //     return "";
            // }else if(y < 40 && y > 0){
            //     downHasClass && downIcon.removeClass("reverse_icon");
            //     return "";
            // }
            
            if (maxY >= 40) {
                !upHasClass && upIcon.addClass("reverse_icon");
                return "";
            } else if (maxY < 40 && maxY >=0) {
                upHasClass && upIcon.removeClass("reverse_icon");
                return "";
            }
        });
        
        me.myScroll[idx].on("slideDown",function(){
            if (this.y > 40) {
                // alert("slideDown");
                upIcon.removeClass("reverse_icon")
            }
        });
        
        me.myScroll[idx].on("slideUp",function(){
            if (this.maxScrollY - this.y > 40) {
                me.requestAppTypePage(me.curAppTabIdx, me.curAppPageIdx[me.curAppTabIdx]);
                upIcon.removeClass("reverse_icon");
            }
        });
        setTimeout(me.myScroll[idx].refresh(), 300);
    },

    showGuide : function() {
        $('#connectionBtn').trigger('click');
        //创建mask，传入图片提示图片的地址,提示文字可传可不传
        H.GuideMask({
            signImgSrc:"images/tl.png",
            signText:"每日签到赚取金币",
            downloadImgSrc:"images/dc.png",
            downloadText:"下载App获取更多金币"
        });
    },

    initExchangePage : function () {
        var data = {  
          exchangelist:[
            {coin:  10000, type: 1, text:"10元话费"},
            {coin:  20000, type: 2, text:"20元话费"},
            {coin:  30000, type: 3, text:"30元话费"},
            {coin:  50000, type: 4, text:"50元话费"},
            {coin: 100000, type: 5, text:"100元话费"}
          ]
        };
        var html = me.exchangeTemplate(data);
        $("div .exchange_list").append(html);
        $("div .exchange_list img.lazy").lazyload({threshold:300, placeholder:null });
        $(".exchange_item").fastClick(function() {
            me.requestExchange(this);
        });
    },

    exchangeTemplate : function (res) {

        var data = res.exchangelist;
        if (data == null || data == undefined) {
            return;
        }

        var arrHtml = new Array();

        for (var i = 0; i < data.length; i++) {

            arrHtml.push("<li data-exchangetype='" + data[i].type + "' data-coin="+data[i].coin+" class='exchange_item index-item list-index h-list-item' >");
            arrHtml.push("<div class=\"index-item-w\">");
            arrHtml.push("<div class='app-img'>");
            arrHtml.push("<img class='lazy' data-original='images/exchange_"+data[i].type+".png' />");
            arrHtml.push("<div class='dummy'></div>");
            arrHtml.push("</div>");

            arrHtml.push("<div class='ui-btn installBtn bigLogo-instBtn' >兑 换</div>");
            arrHtml.push("<div class='app-down-des'>需金币<span class='reward'>"+data[i].coin+"</span></div>");
            arrHtml.push("</div>");
            arrHtml.push("</li>");
        }

        return arrHtml.join("");
    },

    loadPopupAdView : function(url)
    {
        if (url != undefined && $("#popupAdIFrame").attr("src") == undefined) {
            $("#popupAdView").css('height', $(window).height());
            $("#popupAdIFrame").attr("src", url);
            setTimeout("me.showPopupAdView()", 3000);
        }
    },

    showPopupAdView : function()
    {
        $("#popupAdView").show();
    },

    loadHumorPage : function()
    {
        if ($("#humorIFrame").attr("src") == undefined) {
            $(".noNetwork").hide();
            $("#humorIFrame").show().attr("src", "http://xhaz.come11.com");
        }
    },

    isLeShiPhone : function()
    {
        if (window.android) {
            var mi = window.android.getMobileInfo();
            var bool = mi.toLowerCase().indexOf("letv");
            console.log("phone info: "+mi);
            return (bool > 0);
        } else {
            return false;
        }
    },

    toggleAdBannerTimer : function()
    {
        console.log("toggleAdBannerTimer");
        me.toggleAdBanner();
        setTimeout("me.toggleAdBannerTimer()", 10000);
    },

    toggleAdBanner : function()
    {
        $("#adgo_adContainer").empty();
        if (typeof(preload) != "undefined") {
            preload();
        }
    },

    copyToClipboard : function(text)
    {
        if (window.android) {
            window.android.copyToClipboard(text);
        }
        showLoader("已复制到剪贴板");
        setTimeout("hideLoader()", 2000);
    }

}; // end of var me
