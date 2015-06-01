(function($){
    // changePage("#")
})(jQuery);

// var callback = "";
var callback = "callback=?";

$("#appListPage").on("pageshow", function () {
    console.log("app list page show");
});

$("#appListPage").on("pageinit", function() {
    console.log("app list page init");
    // use fastClick will cause pop to home page when tap the tab on PC.
    $("#excellentBtn").click(function() {me.showTab(0);});
    $("#applicationBtn").click(function() {me.showTab(1);});
    $("#gameBtn").click(function() {me.showTab(2);});
    $("#mineBtn").click(function() {me.showTab(3);});

    me.requestAds();
    me.showTab(3);
})

var me = {
    currentCat : 0,
    countDownSeconds : 0, showTab : function(idx) {
        var tabs = new Array("excellent", "application", "game", "mine");
        var titles = new Array("精选", "应用", "游戏", "我的");
        for (var i = 0; i < tabs.length; i++) {
            if (i == idx) {
                $("#" + tabs[i]).show();
                $("#appListTitle").text(titles[i]);
                $("#" + tabs[i] + "Btn").addClass("ui-btn-active");
            } else {
                $("#" + tabs[i]).hide();
                $("#" + tabs[i] + "Btn").removeClass("ui-btn-active");
            }
        }
        currentCat = tabs[idx];
        if (idx < tabs.length-1) {
            me.requestAppList();
            slide.show();
        } else {
            slide.hide();
        }
    },

    requestAds : function()
    {
        // var url=appServerUrl()+"/ads?"+callback;
        var url = "/static/json/ads.json";
        console.log("requestAds:"+url);
        $.get(url, function(data, status) {
            var obj = eval("(" + data +")");
            me.parseAds(obj);
            slide.init();
        });
    },

    parseAds : function(data)
    {
    // console.log(data);
        // var obj = eval("("+data+")"); // json to object
        var html = me.adsTemplate(data);

        $("#fouce").empty();
        $("#fouce").append(html);
    },

    adsTemplate : function(data)
    {
        var data = data.adlist;
        var arrHtml = new Array();

        for (var i = 0; i < data.length; i++) {
            arrHtml.push("<li>");
            arrHtml.push("<a href=\"" + data[i].Link + "\">");
            arrHtml.push("<img src=\"" + data[i].ImageSrc + "\" />");
            arrHtml.push("</a>");
            arrHtml.push("</li>");
        }
        return arrHtml.join("");
    },

    requestAppList : function()
    {
    	showLoader();
        // +currentCat+
        var url = appServerUrl()+"/applist?"+callback;
        console.log(url);
        $.getJSON(url, function(data) {
    		hideLoader();
    		me.parseAppList(data);
    	});
    },

    parseAppList : function(data)
    {
    // console.log(data);
    	// var obj = eval("("+data+")"); // json to object
    	var html = me.appListTemplate(data);

        $("#"+currentCat).empty();
        $("#"+currentCat).append(html);
        
        $(".app-list li").fastClick(function() {
           me.clickOnApp(this);
        });
    },

    appListTemplate : function(res) {

        var data = res.applist;

        var arrHtml = new Array();

        for (var i = 0; i < data.length; i++) {

            // if (panle.find("#myId" + data[i].AppId).length == 0) {

                arrHtml.push("<li data-appid='" + data[i].AppId + "' id=\"myId" + data[i].AppId + "\" class=\"index-item list-index\" >"); // style=\"display:none;\"
                arrHtml.push("<div class=\"index-item-main\">");
                arrHtml.push("<dl class=\"clearfix\">");
                arrHtml.push("<dt class=\"item-icon\"><span class=\"app-tags hide\"></span>");
                arrHtml.push("<img src=\"" + data[i].AppLogo + "\" />");
                arrHtml.push("</dt>");
                arrHtml.push("<dd class=\"item-title\">");
                arrHtml.push("<div class=\"item-title-sname\">");
                arrHtml.push("<div class=\"baiying-name\">");
                arrHtml.push(subString.autoAddEllipsis(data[i].AppName, 22, true) + "</div></div></dd>");
                arrHtml.push("<dd class=\"item-star\">");
                arrHtml.push("<span class=\"score-star\"><span style=\"width:" + data[i].AppScore + "%;\"></span></span>");

                if (data[i].AppSize != "") {
                    arrHtml.push("<span class=\"new-item-size\">" + data[i].AppSize + "</span>");
                }

                arrHtml.push("</dd>");
                arrHtml.push("<dd>");
                arrHtml.push("<div class=\"xiaobian-comment\">");
                arrHtml.push(data[i].BriefSummary == "" ? "暂无介绍" : data[i].BriefSummary);
                arrHtml.push("</div></dd></dl></div>");
                var gaAppName = data[i].AppName.replace(/\"/g, "”").replace(/'/g, "’");
                arrHtml.push("</li>");
            // }
        }

        return arrHtml.join("");
    },

    clickOnApp : function (obj)
    {
        me.requestAppDetail($(obj).data("appid"));
    },

    requestAppDetail : function (appId)
    {
        var url = appServerUrl()+"/appdetail?"+callback+"&appid="+appId;
        console.log(url);
        showLoader();
        $.getJSON(url, function(data) {
            hideLoader();
            me.parseAppDetail(data);
        });
    },

    parseAppDetail : function (data)
    {
    	$("#appDetail").empty();
        // var obj = eval("("+data+")");
        var html = me.appDetailTemplate(data.detail_info);

        $("#appDetail").append(html);
        $.mobile.changePage("#appDetailPage", "slideup");
    },

    appDetailTemplate : function(data)
    {
        var arrHtml  = new Array();
        arrHtml.push(me.appIntroTemplate(data));

        arrHtml.push("<div><img style='"+ data.ImageStyle +"' src='" + data.ImageSrc + "'>");
        for (var i = 0; i < data.ImageSrcList.length; i++) {
          arrHtml.push("<img style='"+ data.ImageStyle +"' src='" + data.ImageSrcList[i] + "'>");
        }
        arrHtml.push("</div>");
        arrHtml.push(me.descriptionTemplate(data))
        arrHtml.push(me.commentTemplate(data));
        return arrHtml.join("");
    },

    appIntroTemplate : function (data) {

        var arrHtml = new Array();

        arrHtml.push("<section class=\"intro\">");
        arrHtml.push("<div class=\"icon-brief\">");
        arrHtml.push("<div class=\"icon\">");
        arrHtml.push("<img src=\"" + data.AppLogo + "\" alt=\"\" />");
        arrHtml.push("</div>");
        arrHtml.push("<div class=\"content-brief\">");
        arrHtml.push("<span class=\"sname contentAppName\">" + data.AppName+ "</span>");
        arrHtml.push("<br>");
        arrHtml.push("<span class=\"score-star\">");
        arrHtml.push("<span style=\"width: " + data.AppScore + "%;\">");
        arrHtml.push("</span>");
        arrHtml.push("</span>");
        arrHtml.push("<br>");
        arrHtml.push("<div class=\"download_size\">");
        arrHtml.push("<span>");
        arrHtml.push("v" + subString.autoAddEllipsis(data.AppVersion, 10, false) + "&nbsp;|&nbsp;" + data.AppSize);
        arrHtml.push("</span>");
        arrHtml.push("</div>");
        arrHtml.push("</div>");

        arrHtml.push("</div>");
        var gaAppName = data.AppName.replace(/\"/g, "”").replace(/'/g, "’");

        arrHtml.push("<div id=\"divdownarea\" class=\"down-area\">");
        arrHtml.push("<div class=\"content-btn-con\">");
        arrHtml.push("<a class=\"content-BaiYingFreeDownload\" href=\"" + data.AppSource + "\">");
        arrHtml.push('下载');
        arrHtml.push("</a>");
        arrHtml.push("</div>");

        arrHtml.push("<div id=\"divDownloadPanle\" class=\"content-btn-con\">");
        arrHtml.push("</div>");
        arrHtml.push("<div class=\"divDownloadTip\">提示：首次使用高速下载需要连接PC进行激活！</div>");
        arrHtml.push("</div>");
        arrHtml.push("</section>");

        return arrHtml.join("");
    },

    descriptionTemplate : function (data) {
        var arrHtml = new Array();
        arrHtml.push("<section class=\"description\">");
        arrHtml.push("<div class=\"content-navdes-wrapper\">");
        arrHtml.push("<div class=\"des-main\">");
        arrHtml.push("<div class=\"des-indent des-short\">");
        arrHtml.push("<div class=\"des-short-content\">");
        arrHtml.push("<p>" + data.BriefSummary + "</p>");
        arrHtml.push("</div>");
        arrHtml.push("<div class=\"des-long-content\">");
        arrHtml.push("<p>" + data.BriefSummary + "</p>");
        arrHtml.push("<br />");
        arrHtml.push("<p>" + data.AppSummary + "</p>");
        arrHtml.push("</div>");
        arrHtml.push("<a id=\"desmore\" href=\"javascript:void(0);\" onclick=\"$('.des-short-content,.des-long-content').toggle();if($('.des-short-content').is(':visible')){scrollToObj($('.description'));$('#desmore').text('了解更多')}else{$('#desmore').text('收起')}\">了解更多");
        arrHtml.push("</a>");
        arrHtml.push("</div>");
        arrHtml.push("</div>");
        arrHtml.push("</div>");
        arrHtml.push("</section>");
        return arrHtml.join("");
    },

    commentTemplate : function (res) {
        var data = res;
        var arrHtml = new Array();

        arrHtml.push("<section class=\"comment-area content-comment-area\">");
        arrHtml.push("<div class=\"pingfen-tab\">");
        arrHtml.push("评论");
        arrHtml.push("</div>");
        arrHtml.push("<div class=\"comment-list\">");
        if (data.AppCommentList.length > 0) {
            arrHtml.push("<ul class=\"comment-list-inner\">");
            arrHtml.push(me.getCommentHtml(data.AppCommentList));
            arrHtml.push("</ul>");
        }
        else {
            arrHtml.push("<span class=\"no-msg\">暂无评论</span>");
        }
        arrHtml.push("</div>");
        arrHtml.push("</section>");
        arrHtml.push("</div>");
        arrHtml.push("</div>");
        return arrHtml.join("");
    },

    getCommentHtml : function (data) {

        // var panle = $("#" + content.currentObj.getPanleId());
        var arrHtml = new Array();

        for (var i = 0; i < data.length; i++) {

            // if (panle.find("#myId" + data[i].Id).length == 0) {
                arrHtml.push("<li id=\"myId" + data[i].Id + "\" class=\"comment-item template\">");
                arrHtml.push("<div class=\"comment-name-version\">");
                arrHtml.push("<span class=\"comment-name\">");
                arrHtml.push(data[i].UserName);// arrHtml.push(subString.autoAddEllipsis(data[i].UserName, 12, true));
                arrHtml.push("</span>");
                arrHtml.push("<span class=\"comment-version\">");
                arrHtml.push("&nbsp;");
                arrHtml.push("<span class=\"score-star\">");
                arrHtml.push("<span style=\"width: " + data[i].Score + "%;\">");
                arrHtml.push("</span>");
                arrHtml.push("</span>");
                arrHtml.push("</span>");
                arrHtml.push("<span class=\"comment-time\">");
                arrHtml.push(data[i].CommentCreateTime);
                arrHtml.push("</span>");
                arrHtml.push("</div>");
                arrHtml.push("<div class=\"comment-content\">");
                arrHtml.push(data[i].CommentContent);
                arrHtml.push("</div> ");
                arrHtml.push("</li>");
            // }
        }
        return arrHtml.join("");
    },

    //获取查询参数
    parseQueryString : function () {
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

    requestVerifyCode : function() {
        var phone_number = $("#registPhoneNumber").val();
        if (phone_number == '' || phone_number == '手机号') {
            showLoader("请填写手机号");
            setTimeout("hideLoader()", 2000);
            return;
        }
        var url          = appServerUrl()+"/appverifycode?"+callback+"&phone_number="+phone_number;
        console.log(url);
        $.getJSON(url, function(data) {
            if (data.ret_code == 0) {
                showLoader("验证码已通过短信发送");
                setTimeout("hideLoader()", 2000);
                $("#verifyCodeBtn").addClass("text_disabled");
                me.countDownSeconds = 60;
                setTimeout("me.countDown()", 1000);
                $("#verifyCodeBtn").attr("disabled","disabled");
            } else {
                showLoader(data.ret_msg);
                setTimeout("hideLoader()", 3000);
            }
        }
    )},

    countDown : function() {
        $("#verifyCodeBtn").text(me.countDownSeconds + "秒");
        me.countDownSeconds = me.countDownSeconds - 1;
        if (me.countDownSeconds <= 0) {
            $("#verifyCodeBtn").removeClass("text_disabled").text("获取验证码");
            $("#verifyCodeBtn").attr("disabled","");
        } else {
            setTimeout("me.countDown()", 1000);
        }
    },

    validLogin : function() {
        if ($("#loginUsername").val()=='' || $("#loginUsername").val()=='手机号') {
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

    validRegist : function() {
        if ($("#registPhoneNumber").val()=='' || $("#registPhoneNumber").val()=='手机号') {
            showLoader("请填写手机号");
            setTimeout("hideLoader()", 2000);
            return false;
        }
        if ($("#registVerifyCode").val()=='') {
            showLoader("请填写验证码");
            setTimeout("hideLoader()", 2000);
            return false;
        }
        if ($("#registPassword").val()=='') {
            showLoader("请填写密码");
            setTimeout("hideLoader()", 2000);
            return false;
        }
        return true;
    },

}; // end of var me

var slide = {
    slidePanle: null,
    scrollX: 0,
    isGesture: false,
    isRun: false,
    intIndex: 1,
    itemWidth: 0,
    itemLen: 0,
    interval: null,
    bug: 0,
    init: function () {
        var deviceWidth, deviceHeight;
        deviceWidth = $(document).width();
        if (deviceWidth == 320) {
            deviceHeight = 167;
        }
        else if (deviceWidth == 375) {
            deviceHeight = 196;
        } else {
            deviceHeight = 217;
        }
        $('#slidebox').find('li').css({ 'width': (deviceWidth + 'px'), 'height': (deviceHeight + 'px') });

        slide.itemLen = $('#slidebox').find('li').length;
        slide.itemWidth = $(document).width();

        var ulSlide = $('#slidebox').find('ul');
        var liFirst = $(ulSlide).find("li").first().clone();
        var liLast = $(ulSlide).find("li").last().clone();
        $(ulSlide).append(liFirst).prepend(liLast);

        $('#slidebox').css({ "width": slide.itemWidth * (slide.itemLen + 2) });
        slide.bind();
    },
    bind: function () {

        if (slide.slidePanle != null) {
            slide.slidePanle.destroy();
            slide.slidePanle = null;
        }
        slide.stop();
        slide.slidePanle = new iScroll('divSlidePanle', {
            momentum: false,
            hScrollbar: false,
            vScrollbar: false,
            bounce: false,
            vScroll: false
        });

        slide.intIndex = 1;

        slide.slidePanle.scrollTo(0 - slide.itemWidth, 0, 0, false);
        $("#olSlideNum").find("li:eq(0)").addClass("cur").siblings().removeClass("cur");

        slide.slidePanle.disable();

        fnslide(jQuery);
        $("#divSlidePanle").touchwipe({
            min_move_x: 20,
            min_move_y: 40,
            wipeLeft: function () {
                slide.scroll(true);
            },
            wipeRight: function () {
                slide.scroll(false);
            },
            preventDefaultEvents: false
        });

        slide.start();
    },
    show: function () {
        if (!$(".fouce").is(":visible")) {
            $(".fouce").show();
            slide.bind();
        }
    },
    hide: function () {
        $(".fouce").hide();
        slide.stop();
    },
    scroll: function (isLeft) {

        if (slide.isRun) {
            slide.bug++;
            if (slide.bug > 1) {
                slide.isRun = false;
                slide.bug = 0;
            }
            return;
        }

        slide.isRun = true;
        slide.stop();

        if (isLeft) {
            slide.intIndex += 1;
        }
        else {
            slide.intIndex -= 1;
        }

        var scrollNum = 0 - slide.intIndex * slide.itemWidth;
        var time = 200;
        slide.slidePanle.scrollTo(scrollNum, 0, time, false);

        setTimeout(function () {

            if (slide.intIndex > slide.itemLen) {
                slide.slidePanle.scrollTo(0 - slide.itemWidth, 0, 0, false);
                slide.intIndex = 1;
                $("#olSlideNum").find("li:eq(0)").addClass("cur").siblings().removeClass("cur");
            }
            else if (slide.intIndex < 1) {
                slide.slidePanle.scrollTo(0 - slide.itemWidth * slide.itemLen, 0, 0, false);
                slide.intIndex = slide.itemLen;
                $("#olSlideNum").find("li:eq(" + (slide.itemLen - 1) + ")").addClass("cur").siblings().removeClass("cur");
            }
            else {
                $("#olSlideNum").find("li:eq(" + (slide.intIndex - 1) + ")").addClass("cur").siblings().removeClass("cur");
            }

            slide.isRun = false;
            slide.start();
        }, time + 10);
    },
    start: function () {
        slide.interval = setInterval(function () {
            slide.scroll(true);
        }, 4000);
    },
    stop: function () {
        if (slide.interval != null) {
            clearInterval(slide.interval);
            slide.interval = null;
        }
    }
};

//手势操作
var fnslide = function (a) {
    a.prototype.touchwipe = function (c) {
        var b = {
            min_move_x: 20,
            min_move_y: 20,
            wipeLeft: function () {
            },
            wipeRight: function () {
            },
            wipeUp: function () {
            },
            wipeDown: function () {
            },
            wipe: function () {
            },
            wipehold: function () {
            },
            preventDefaultEvents: true
        };
        if (c) {
            a.extend(b, c);
        }
        this.each(function () {
            var h;
            var g;
            var j = false;
            var i = false;
            var e;

            function m() {
                this.removeEventListener("touchmove", d);
                h = null;
                j = false;
                clearTimeout(e);
            }

            function d(q) {
                if (b.preventDefaultEvents) {
                    q.preventDefault();
                }
                if (j) {
                    var n = q.touches[0].pageX;
                    var r = q.touches[0].pageY;
                    var p = h - n;
                    var o = g - r;
                    if (Math.abs(p) >= b.min_move_x) {
                        q.preventDefault();
                        m();
                        if (p > 0) {
                            b.wipeLeft();
                        } else {
                            b.wipeRight();
                        }
                    } else {
                        if (Math.abs(o) >= b.min_move_y) {
                            m();
                            if (o > 0) {
                                b.wipeUp();
                            } else {
                                b.wipeDown();
                            }
                        }
                    }
                }
            }

            function k() {
                clearTimeout(e);
                if (!i && j) {
                    b.wipe();
                }
                i = false;
            }

            function l() {
                i = true;
                b.wipehold();
            }

            function f(n) {
                if (n.touches.length == 1) {
                    h = n.touches[0].pageX;
                    g = n.touches[0].pageY;
                    j = true;
                    this.addEventListener("touchmove", d, false);
                    e = setTimeout(l, 750);
                }
            }

            if ("ontouchstart" in document.documentElement) {
                this.addEventListener("touchstart", f, false);
                this.addEventListener("touchend", k, false);
            }
        });
        return this;
    };
    a.extend(a.prototype.touchwipe, 1);
};

$("#loginBtn").bind("click", function() {
    if (me.validLogin()) {
        var phone_number = $("#loginUsername").val();
        var passwd       = $("#loginPassword").val();
        var url = appServerUrl()+"/login?"+callback+"&phone_number="+phone_number+"&passwd="+passwd;
        console.log(url);
        $.getJSON(url, function(data) {
            if (data.ret_code == 0) {
                changePage("#accountPage");
                console.log("login success, coin num:" + data.coin_num);
                $("#coin").text(data.coin_num);
            } else {
                showLoader(data.ret_msg);
                setTimeout("hideLoader()", 3000);
            }
        });
    }
});

$("#registBtn").fastClick(function() {
    if (me.validRegist()) {
        var phone_number = $("#registPhoneNumber").val();
        var passwd       = $("#registPassword").val();
        var verify_code  = $("#registVerifyCode").val();
        var url = appServerUrl()+"/appregister?"+callback+"&phone_number="+phone_number+"&passwd="+passwd+"&verify_code="+verify_code;
        console.log(url);

        $.getJSON(url, function(data) {
            if (data.ret_code == 0) {
                changePage("#accountPage");
            } else {
                showLoader(data.ret_msg, true);
                setTimeout("hidePageLoader()", 3000);
            }
        });
    }
});

$("input").bind("focus", function() { 
    if ($(this).attr("value")=='手机号')
        $(this).attr("value",""); 
});

$("#verifyCodeBtn").fastClick(function() {
    me.requestVerifyCode();
});

function scrollToObj(obj) {
    window.scrollTo(0, obj.offset().top);
}

var subString = {
    thisStr: "",
    thisLen: 10,
    thisFlag: true,
    autoAddEllipsis: function (pStr, pLen, pFlag) {
        this.thisStr = pStr;
        this.thisLen = pLen;
        this.thisFlag = pFlag;
        var _ret = this.cutString();
        var _cutFlag = _ret.cutflag;
        var _cutStringn = _ret.cutstring;
        if ("1" == _cutFlag && this.thisFlag) {
            return _cutStringn + "...";
        } else {
            return _cutStringn;
        }
    },
    cutString: function () {
        var pStr = this.thisStr;
        var pLen = this.thisLen;
        var pFlag = this.thisFlag;
        var _strLen = this.thisStr.length;
        var _tmpCode;
        var _cutString;
        var _cutFlag = "1";
        var _lenCount = 0;
        var _ret = false;
        if (_strLen <= pLen / 2) {
            _cutString = pStr;
            _ret = true;
        }
        if (pFlag) {
            pLen = pLen - 3;
        }
        if (!_ret) {
            for (var i = 0; i < _strLen; i++) {
                if (this.isFull(pStr.charAt(i))) {
                    _lenCount += 2;
                } else {
                    _lenCount += 1;
                }
                if (_lenCount > pLen) {
                    _cutString = pStr.substring(0, i);
                    _ret = true;
                    break;
                } else if (_lenCount == pLen) {
                    _cutString = pStr.substring(0, i + 1);
                    _ret = true;
                    break;
                }
            }
        }
        if (!_ret) {
            _cutString = pStr;
            _ret = true;
        }
        if (_cutString.length == _strLen) {
            _cutFlag = "0";
        }
        return { "cutstring": _cutString, "cutflag": _cutFlag };
    },
    isFull: function (pChar) {
        if ((pChar.charCodeAt(0) > 128)) {
            return true;
        } else {
            return false;
        }
    }
};