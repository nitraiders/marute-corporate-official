var ajax_url = "https://ez-page.net/Site/ajax/";

$(document).ready(function(){

    //PC用スクリプト
    if( window.matchMedia('(min-width:1024px)').matches ){

        if ($(".fitSide-bar").length >0) {
            $('.fitSide-bar').fitSidebar({
                wrapper : '.fitSide-body'
            });
        }
    }

    //タブレット・PC用スクリプト
    if( window.matchMedia('(min-width:641px)').matches ){
        $("#header").headroom({
            "tolerance": 5,
            "offset": 205,
            "classes": {
                "initial": "headroom",
                "pinned": "bounceInDown",
                "unpinned": "bounceOutUp"
            }
        });
    }

    $("#mobile_header #btn").click(function(){

        $('#nav').slideToggle(300, function() {
            if ( $('#nav').css("display") == "none") {
                $("#mobile_header .nav-1 img").css("display","inline");
            } else {
                $("#mobile_header .nav-1 img").css("display","none");
            }
        });

        return false;
    });

    if ($(".bxslider").length >0) {
        $('.bxslider').bxSlider({
            speed: 1000,
            mode: 'fade',
            pager: false,
            controls: false,
            auto: true,
            captions: true
        });
    }

    $('a[href^=#]').click(function(){

        if ( $(this).attr("id") != "bt_mobile_nav") {
            //return false;
        }
    });

    //スクロール
    $('a.scroll[href^=#]').click(function(){
        var speed = 500;
        var href= $(this).attr("href");
        var target = $(href == "#" || href == "" ? 'html' : href);
        var position = target.offset().top;
        $("html, body").animate({scrollTop:position}, speed, "swing");
        return false;
    });

    $(".gotop").hide();
    // ↑ページトップボタンを非表示にする

    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            // ↑ スクロール位置が100よりも小さい場合に以下の処理をする
            $('.gotop').slideDown("fast");
            // ↑ (100より小さい時は)ページトップボタンをスライドダウン
        } else {
            $('.gotop').slideUp("fast");
            // ↑ それ以外の場合の場合はスライドアップする。
        }
    });

    // フッター固定
    $(window).bind("scroll", function() {

        scrollHeight = $(document).height();
        // ドキュメントの高さ
        scrollPosition = $(window).height() + $(window).scrollTop();
        //　ウィンドウの高さ+スクロールした高さ→　現在のトップからの位置
        footHeight = $(".toTop-maxPosition").innerHeight();
        // フッターの高さ

        if ( scrollHeight - scrollPosition  <= footHeight ) {
            // 現在の下から位置が、フッターの高さの位置にはいったら

            $(".gotop").css({
                "position":"absolute",
                "bottom": footHeight
            });
            //  ".gotop"のpositionをabsoluteに変更し、フッターの高さの位置にする
        } else {
            // それ以外の場合は元のcssスタイルを指定

            $(".gotop").css({
                "position":"fixed",
                "bottom": "0px"
            });
        }
    });

    //スライダー
    if ($(".slider").length >0) {
        $(".slider").responsiveSlides({
            auto: true,             // Boolean: Animate automatically, true or false
            speed: 1500,            // Integer: Speed of the transition, in milliseconds
            timeout: 5000,          // Integer: Time between slide transitions, in milliseconds
            pager: false,           // Boolean: Show pager, true or false
            nav: false,             // Boolean: Show navigation, true or false
            random: false,          // Boolean: Randomize the order of the slides, true or false
            pause: false,           // Boolean: Pause on hover, true or false
            pauseControls: true,    // Boolean: Pause when hovering controls, true or false
            prevText: "Previous",   // String: Text for the "previous" button
            nextText: "Next",       // String: Text for the "next" button
            maxwidth: "",           // Integer: Max-width of the slideshow, in pixels
            navContainer: "",       // Selector: Where controls should be appended to, default is after the 'ul'
            manualControls: "",     // Selector: Declare custom pager navigation
            namespace: "rslides",   // String: Change the default namespace used
            before: function(){},   // Function: Before callback
            after: function(){}     // Function: After callback
        });
    }

    //アンカースクロール
    $('a.anchor').click(function(){
        var speed = 500;
        var position = $("#anchor"+$(this).attr("anchor")).offset().top;
        $("html, body").animate({scrollTop:position}, speed, "swing");
        return false;
    });

    //サムネイル表示
    /*
    if ( $('.my-thum').length >0){
        $(".thum400-300").MyThumbnail({ thumbWidth:140, thumbHeight:105, imageDivClass:"MyThum"});
        $(".thum160-120").MyThumbnail({ thumbWidth:160, thumbHeight:120, imageDivClass:"MyThum"});
        $(".thum80-80").MyThumbnail({ thumbWidth:80, thumbHeight:80, imageDivClass:"MyThum"});
    }
    */

    //メルマガ登録のメールアドレスチェック
    mmg_mailcheck();
});

/*------------------------------------------------------
 お問合せフォーム
 ------------------------------------------------------*/
function bt_form(this_obj,form_type){

    var post_data = {};

    //セッションID
    post_data["session_id"] = this_obj.attr("session_id");
    post_data["siteid"] = this_obj.attr("siteid");

    //入力チェック
    if ( this_obj.attr("to") == "confirm"){

        error_msg="";
        is_error=false;

        $(".form-box .input-form").each(function(){

            if ( $(this).hasClass("required") && $(this).val()==""){
                error_msg = error_msg+"※"+$(this).attr("label")+"は必須項目です\n";
                is_error = true;
            } else if ( $(this).attr("name")=="mail" ) {
                if (!$(this).val().match("^[0-9A-Za-z._\"-]+@[0-9A-Za-z.-]+$")) {
                    error_msg = error_msg+"※メールアドレスが不正です\n";
                    is_error = true;
                } else if ( $("#mail_confirm").val() != $(this).val() ) {
                    error_msg = error_msg+"※メールアドレスとメールアドレス（確認用）が違います\n";
                    is_error = true;
                }
            }
        });

        if ( is_error == false) {
            if ( $("#is_approval").prop('checked') != true ) {

                alert("※個人情報保護方針への同意をお願い致します");
                return;

            } else {
                //$("#contact-form").submit();


                $(".form-box .input-form").each(function(){
                    post_data[$(this).attr("name")] = $(this).val();
                });

                $.ajax({
                    url: ajax_url+form_type+"/confirm.php",
                    type: 'POST',
                    data: post_data,
                    dataType: 'html',
                    xhr : function(){
                        XHR = $.ajaxSettings.xhr();
                        if(XHR.upload){
                            $("#overlay").fadeIn();
                        }
                        return XHR;
                    }
                })
                    .done(function( data ) {	//成功の時の処理

                        $("#form-box").fadeOut("slow",function() {
                            $("#form-box").html(data);
                            $("#form-box").fadeIn("slow");
                        });

                    })
                    .fail(function( data ) {	//失敗の時の処理

                        alert("※データ通信に失敗しました");
                    })
                    .always(function( data ) {	//成功・失敗に関わらず通信が完了した時に呼ばれるコールバック関数
                        $("#overlay").fadeOut();
                    });
            }
        } else {

            alert(error_msg);
            return;
        }
    }

    //フォームへ戻る
    if ( this_obj.attr("to") == "form"){


        $.ajax({
            url: ajax_url+form_type+"/form.php",
            type: 'POST',
            data: post_data,
            dataType: 'html',
            xhr : function(){
                XHR = $.ajaxSettings.xhr();
                if(XHR.upload){
                    $("#overlay").fadeIn();
                }
                return XHR;
            }
        })
            .done(function( data ) {	//成功の時の処理

                $("#form-box").fadeOut("slow",function() {
                    $("#form-box").html(data);
                    $("#form-box").fadeIn("slow");
                });

                if ( form_type == "mmg") {
                    mmg_mailcheck();
                }
            })
            .fail(function( data ) {	//失敗の時の処理

                alert("※データ通信に失敗しました");
            })
            .always(function( data ) {	//成功・失敗に関わらず通信が完了した時に呼ばれるコールバック関数
                $("#overlay").fadeOut();
            });
    }

    //送信
    if ( this_obj.attr("to") == "send"){

        $.ajax({
            url: ajax_url+form_type+"/send.php",
            type: 'POST',
            data: post_data,
            dataType: 'html',
            xhr : function(){
                XHR = $.ajaxSettings.xhr();
                if(XHR.upload){
                    $("#overlay").fadeIn();
                }
                return XHR;
            }
        })
            .done(function( data ) {	//成功の時の処理

                $("#form-box").fadeOut("slow",function() {
                    $("#form-box").html(data);
                    $("#form-box").fadeIn("slow");
                });
            })
            .fail(function( data ) {	//失敗の時の処理

                alert("※データ通信に失敗しました");
            })
            .always(function( data ) {	//成功・失敗に関わらず通信が完了した時に呼ばれるコールバック関数
                $("#overlay").fadeOut();
            });
    }
}

/*------------------------------------------------------
 メルマガ登録のメールアドレスチェック
 ------------------------------------------------------*/
function mmg_mailcheck(){

    //アンカースクロール
    $('.mmg_mailcheck').keyup(function(){
        if ( $(this).val() != "") {
            $.ajax({
                url: ajax_url + "mmg/mail_check.php",
                type: 'POST',
                data: {siteid:$(this).attr("siteid"),mail:$(this).val()},
                dataType: 'html'
            })
            .done(function( data ) {	//成功の時の処理

                if ( data != "OK"){
                    alert("このメールアドレスは登録済みです");
                    $('.mmg_mailcheck').val("");
                }
            });
        }
    });

}

/*------------------------------------------------------
 生成フォーム　確認画面へ
 ------------------------------------------------------*/
function to_confirm(session_id) {

    var datas = {};
    var this_form = $("#form");
    var msg = {};
    var is_error = false;

    //エラーチェック
    $(".form" ,this_form).each(function(){

        if ( typeof $(this).attr("data-group") != "undefined" && $(this).attr("data-group") != "" ) {
            obj_name = $(this).attr("data-group");
        } else {
            obj_name = $(this).attr("name");
        }

        if ( $(this).attr("input-type") == "checkbox" || $(this).attr("input-type") == "radio" ) {
            datas[$(this).attr("name")] = $('input:checked',this).map(function(){
                return $(this).val();
            }).get().join(',');

            //改行コードを削除
            datas[$(this).attr("name")] = datas[$(this).attr("name")].replace(/[\n\r]/g,"");

            if ( $(this).hasClass("is_required") && datas[$(this).attr("name")] == "" ) {
                msg[$(this).attr("name")] = "※" + $(this).attr("title") + "は必須項目です";
                is_error = true;
            }
        } else if ( $(this).hasClass("is_required") && $(this).val() == "" ) {
            msg[obj_name] = "※" + $(this).attr("title") + "は必須項目です";
            is_error = true;
        } else if ( $(this).hasClass("is_num") && isNaN($(this).val()) ) {
            msg[obj_name] = "※" + $(this).attr("title") + "は数値を入力してください";
            is_error = true;
        } else if ( $(this).hasClass("is_mail") && !$(this).val().match("^[0-9A-Za-z._\"-]+@[0-9A-Za-z.-]+$") ) {
            msg[obj_name] = "※" + $(this).attr("title") + "は不正なメールアドレスです";
            is_error = true;
        } else if ( $(this).hasClass("is_kana") && !$(this).val().match(/^[ァ-ヶー]*$/)  ) {
            msg[obj_name] = "※" + $(this).attr("title") + "は全角カタカナで入力してください";
            is_error = true;
        } else {
            datas[$(this).attr("name")] = $(this).val();
        }
    });


    if ( is_error == true ) {
        var error_msg = "";
        $.each(msg, function(key, value) {
            error_msg = error_msg + value + "\n";
        });
        alert(error_msg);
        return;
    }

    datas["session_id"] = session_id;

    $.ajax({
        url: ajax_url+"create_form/confirm.php",
        type: 'POST',
        data: datas,
        dataType: 'html'
    })
        .done(function( data ) {	//成功の時の処理

            //$("html, body").animate({scrollTop:$("#form-box").offset().top}, 800, "easeOutCubic");
            $("#form-box").fadeOut("slow",function() {
                $("#form-box").html(data);
                $("#form-box").fadeIn("slow");
            });
        })
        .fail(function( data ) {	//失敗の時の処理

            alert("※データ通信に失敗しました");
        });

    return;
}

/*------------------------------------------------------
 生成フォーム　フォームへ戻る
 ------------------------------------------------------*/
function to_form(session_id) {

    var datas = {};

    datas["session_id"] = session_id;

    $.ajax({
        url: ajax_url+"create_form/form.php",
        type: 'POST',
        data: datas,
        dataType: 'html'
    })
        .done(function( data ) {	//成功の時の処理
            $("#form-box").fadeOut("slow",function() {
                $("#form-box").html(data);
                $("#form-box").fadeIn("slow");
            });
        })
        .fail(function( data ) {	//失敗の時の処理

            alert("※データ通信に失敗しました");
        });

    return;
}

/*------------------------------------------------------
 生成フォーム　送信する
 ------------------------------------------------------*/
function to_send(session_id) {

    var datas = {};

    datas["session_id"] = session_id;

    $.ajax({
        url: ajax_url+"create_form/send.php",
        type: 'POST',
        data: datas,
        dataType: 'html'
    })
        .done(function( data ) {	//成功の時の処理
            $("#form-box").fadeOut("slow",function() {
                $("#form-box").html(data);
                $("#form-box").fadeIn("slow");
            });
        })
        .fail(function( data ) {	//失敗の時の処理

            alert("※データ通信に失敗しました");
        });

    return;
}
