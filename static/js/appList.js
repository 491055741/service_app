// (function($){
// })(jQuery);

$("#appListPage").on("pageshow", function () {
    output("app list page show");
});

$("#appListPage").on("pageinit", function() {
    output("app list page init");
    // use fastClick will cause pop to home page when tap the tab on PC.
    $("#excellentBtn").click(function() {me.showTab(0);});
    $("#applicationBtn").click(function() {me.showTab(1);});
    $("#gameBtn").click(function() {me.showTab(2);});
    $("#mineBtn").click(function() {me.showTab(3);});

    me.showTab(0);
    slide.init();

    // $(window).trigger("scroll"); // it is a hack for trigger lazyload update. otherwise the image will not appear.
    // window.scrollTo(0, 1);

})

var me = {
    currentCat : 0,



    showTab : function(idx)
    {
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

    requestAppList : function()
    {
    	$.mobile.showPageLoadingMsg();
        $.get(appServerUrl()+"/applist/"+currentCat, function(data,status) {
    		$.mobile.hidePageLoadingMsg();
    		me.parseAppList(data);
    	});
    },

    parseAppList : function(data)
    {
    // console.log(data);
    	var obj = eval("("+data+")"); // json to object
    	var html = me.appListTemplate(obj);


        $("#"+currentCat).empty();
        $("#"+currentCat).append(html);
        
        $(".app-list li").fastClick(function() {
           me.clickOnApp(this);
        });
    },

    appListTemplate : function(res) {

        // var panle = $("#" + me.currentObj.getPanleId());

        // me.currentObj.totalCount = res.TotalCount;

        // if (res.TotalCount == 0) {
        //     return nothing.app();
        // }

        var data = res.AppList;

        var arrHtml = new Array();

        for (var i = 0; i < data.length; i++) {

            // if (panle.find("#myId" + data[i].AppId).length == 0) {

                arrHtml.push("<li data-appid='" + data[i].AppId + "' id=\"myId" + data[i].AppId + "\" class=\"index-item list-index\" >"); // style=\"display:none;\"
                arrHtml.push("<div class=\"index-item-main\">");
                // arrHtml.push("<a href=\"/app?action=content#appid=" + data[i].AppId + "\">");
                // arrHtml.push("<a href=''  >");
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
                arrHtml.push("<span class=\"new-item-size\">" + data[i].LeftAttrValue);

                if (data[i].AppSize != "") {
                    arrHtml.push(" | " + data[i].AppSize);
                }

                arrHtml.push("</span>");
                arrHtml.push("</dd>");
                arrHtml.push("<dd>");
                arrHtml.push("<div class=\"xiaobian-comment\">");
                arrHtml.push(data[i].BriefSummary == "" ? "暂无介绍" : data[i].BriefSummary);
                // arrHtml.push("</div></dd></dl></a></div>");
                arrHtml.push("</div></dd></dl></div>");
                var gaAppName = data[i].AppName.replace(/\"/g, "”").replace(/'/g, "’");
                // arrHtml.push("<div class=\"item-side item-download item-side-download\"><a href=\"javascript:void(0);\" onclick=\"appDownload('" + data[i].AppId + "');\"><div class=\"status-download\"><span class=\"download-text" + (data[i].FreePage == 1 ? " download-text-through" : "") + "\">" + data[i].AppPrice + "</span></div></a></div>");
                // arrHtml.push("<div class=\"item-side item-download item-side-download\"><a href=\"javascript:void(0);\" onclick=\"clickOnApp('" + data[i].AppId + "');\"></a></div>");
                arrHtml.push("</li>");
            // }
        }

        return arrHtml.join("");
    },

    clickOnApp : function (obj)
    {
        me.requestHotelDetail($(obj).data("appid"));
    },

    requestHotelDetail : function (appId)
    {
        $.mobile.showPageLoadingMsg();
        $.get(appServerUrl()+"/appdetail/"+appId, function(data,status) {
            $.mobile.hidePageLoadingMsg();
            me.parseAppDetail(data);
        });
    },

    parseAppDetail : function (data)
    {
    	$("#appDetail").empty();
        var obj = eval("("+data+")");
        var html = me.appDetailTemplate(obj);

        $("#appDetail").append(html);
        $.mobile.changePage("#appDetailPage", "slideup");
    },

    appDetailTemplate : function(obj)
    {
        var arrHtml  = new Array();
        // var appId    = obj.AppleAppId;
        // var appName  = obj.AppName;
        // var price    = obj.AppPrice;
        // var logo     = obj.AppLogo;
        // // var desc     = obj.AppSummary;
        // var brief    = '版本:' + obj.AppVersion + ' | 大小:' + obj.AppSize;

        // arrHtml.push("<div class='hotelTableCell' data-app-id='" + appId + "' data-hotel-name='" + appName + "' data-theme='c'  style='margin : 2px -10px 0px -10px; height:80px; border-bottom: gray 1px dashed;'>" +
        //    "<image width='100px' height='78px'  src='" + logo + "' style='position: absolute; vertical-align:middle; text-align:right;display:inline-block;'   /> " +
        //    "<div style='margin-left: 100px;'>" +
        //    "<div class='text_overflow' style='padding:6px 0px 2px 5px; max-height:30px; font-size:big; font-weight:bold; '>" + appName + "</div>" +
        //    "<span style='padding-left:5px; font-size:small; color:gray;'>" + brief + "</span>" +
        //    // "<div class='text_overflow' style='padding:2px 0px 0px 5px; max-height:18px; font-size:small;'> " + desc + "</div>" +
        //    "</div></div>");
        arrHtml.push(me.appIntroTemplate(obj));

        arrHtml.push("<div><img style='"+ obj.ImageStyle +"' src='" + obj.ImageSrc + "'>");
        for (var i = 0; i < obj.ImageSrcList.length; i++) {
          arrHtml.push("<img style='"+ obj.ImageStyle +"' src='" + obj.ImageSrcList[i] + "'>");
        }
        arrHtml.push("</div>");
        arrHtml.push(me.descriptionTemplate(obj))
        arrHtml.push(me.commentTemplate(obj));
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
        // arrHtml.push("v" + subString.autoAddEllipsis(data.AppVersion, 10, false) + "&nbsp;|&nbsp;" + data.AppSize);
        arrHtml.push("v" + data.AppVersion + "&nbsp;|&nbsp;" + data.AppSize);
        arrHtml.push("</span>");
        arrHtml.push("</div>");
        arrHtml.push("</div>");

        arrHtml.push("</div>");
        var gaAppName = data.AppName.replace(/\"/g, "”").replace(/'/g, "’");

        arrHtml.push("<div id=\"divdownarea\" class=\"down-area\">");
        //详情页顶部应用信息的左下角官方下载
        arrHtml.push("<div class=\"content-btn-con\">");
        // arrHtml.push("<a class=\"content-BaiYingFreeDownload\" onclick=\"googleStatistics.appDownload('" + pingguozushou.appId + "','" + pingguozushou.appName + "','" + pingguozushou.appSource + "','content','','');\" href=\"javascript:void(0);\">");
        arrHtml.push("<a class=\"content-BaiYingFreeDownload\" href=\"" + data.AppSource + "\">");
        arrHtml.push('下载');
        arrHtml.push("</a>");
        arrHtml.push("</div>");

        arrHtml.push("<div id=\"divDownloadPanle\" class=\"content-btn-con\">");
        arrHtml.push("</div>");
        arrHtml.push("<div class=\"divDownloadTip\">提示：首次使用高速下载需要连接PC进行激活！</div>");
        //详情页顶部应用信息的右下角安装苹果助手
        /*arrHtml.push("<div class=\"divDownloadPingguoapp\">");
        arrHtml.push("<a class=\"pingguoappDownload detailTopDownload\" onclick=\"pingguozushou.ipaDownload();\" href=\"javascript:void(0);\">");
        arrHtml.push("安装苹果助手");
        arrHtml.push("</a>");*/
        arrHtml.push("</div>");
        arrHtml.push("</section>");

        // arrHtml.push("<nav class=\"xz_list\">");
        // arrHtml.push("<ul>");
        // arrHtml.push("<li id=\"tab_info\"" + (content.currentObj.tab == "info" ? " class=\"cur\"" : "") + ">");
        // arrHtml.push("<a href=\"/app?action=content#appid=" + data.AppleAppId + "\">详情</a>");
        // arrHtml.push("</li>");
        // arrHtml.push("<li id=\"tab_comment\"" + (content.currentObj.tab == "comment" ? " class=\"cur\"" : "") + ">");
        // arrHtml.push("<a href=\"/app?action=content#appid=" + data.AppleAppId + "&t=comment\">");
        // arrHtml.push("评论");
        // arrHtml.push("</a>");
        // arrHtml.push("</li>");
        // arrHtml.push("</ul>");
        // arrHtml.push("</nav>");

        return arrHtml.join("");
    },

    descriptionTemplate : function (data) {
        var arrHtml = new Array();
        arrHtml.push("<section class=\"description\">");
        arrHtml.push("<div class=\"content-navdes-wrapper\">");
        /*arrHtml.push("<div class=\"content-navdes-header clearfix\">");
        arrHtml.push("<h2>");
        arrHtml.push("应用简介");
        arrHtml.push("</h2>");
        arrHtml.push("<div class=\"content-navdes-header-line\">");
        arrHtml.push("</div>");
        arrHtml.push("</div>");*/
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

        // if (content.currentObj.currentPage > 1) {
        //     return content.getCommentHtml(data);
        // }

        // if (data.AppleAppId == 0) {
        //     return nothing.app();
        // }

        // if (data.RecommendClient == 2 && (system.iPhone || system.iPod)) {
        //     return nothing.ipad(data);
        // }

        var arrHtml = new Array();
        // content.currentObj.totalCount = data.TotalCount;

        // var existContentPanle = content.currentObj.existContentPanle();
        // if (!existContentPanle) {
        //     arrHtml.push("<div id=\"detail\" class=\"\">");
        //     arrHtml.push(content.getAppBaseHtml(data));
        //     arrHtml.push("<div id=\"subDetail_" + data.AppleAppId + "\" class=\"\">");
        // }

        arrHtml.push("<section class=\"comment-area content-comment-area\">");
        arrHtml.push("<div class=\"pingfen-tab\">");
        arrHtml.push("评论");
        arrHtml.push("</div>");
        arrHtml.push("<div class=\"comment-list\">");
        if (data.AppCommentCount > 0) {
            arrHtml.push("<ul class=\"comment-list-inner\">");
            arrHtml.push(me.getCommentHtml(data.AppCommentList));
            arrHtml.push("</ul>");
        }
        else {
            arrHtml.push("<span class=\"no-msg\">暂无评论</span>");
        }
        arrHtml.push("</div>");
        arrHtml.push("</section>");

        // if (!existContentPanle) {
            arrHtml.push("</div>");
            arrHtml.push("</div>");
        // }

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


    //输入事件
    $("input[id]").bind("focus",function () { 
        if ($(this).attr("id")=='username' || $(this).attr("id")=='password')
            $(this).attr("value",""); 
    }); 
    //提交
    $("#loginBtn").bind("click", function() {
        if (valid()) {

            // $.ajax({
            //    type: "POST",
            //    url: "http://localhost:8080/note/servlet/Login",
            //    data: $("form#loginform").serialize(),
            //    success: function(msg){
            //      if(msg=='success'){
            //         $.mobile.changePage("content/first.html","slidedown", true, true);
            //      }else{
            //         $.mobile.changePage("content/loginfalse.html","slidedown", true, true);
            //      }
                  
            //    }
            // }); 
        } else {
            $.mobile.showPageLoadingMsg("e", "请输入用户名和密码", true);
            setTimeout("$.mobile.hidePageLoadingMsg()", 3000);
        }
    });

    //输入事件
    $("input[id]").bind("focus",function () { 
        if ($(this).attr("value")=='用户名' || $(this).attr("value")=='密码')
            $(this).attr("value",""); 
    }); 
    //提交
    $("#toRegistBtn").bind("click", function() {
        changePage("#registerPage");
        // if (true) {
        //     output("goto reigister page");
        //     $.ajax({
        //         type: "POST",
        //         url: "http://localhost:8080/note/servlet/Login",
        //         data: $("form#loginform").serialize(),
        //         success: function(msg){
        //             if(msg=='success'){
        //                 $.mobile.changePage("../content/first.html","slidedown", true, true);
        //             } else {
        //                 $.mobile.changePage("../content/loginfalse.html","slidedown", true, true);
        //             }
        //         }
        //     }); 
        // }
    });

//输入信息验证
function valid()
{
    if ($("#username").attr("value")=='' || $("#password").attr("value")=='') {
        
        return false;           
    } 
    return true;
};



function scrollToObj (obj) {
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