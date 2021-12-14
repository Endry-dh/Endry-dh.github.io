$(document).ready(function() {

  //Mobile-Menu
  $('.header__menu-btn').on('click', function() {
    $('.header__navigation-wrap').addClass('header__navigation-wrap_active');
    $('body').addClass('active');
  });
  $('.header__img-cancel').on('click', function() {
    $('.header__navigation-wrap').removeClass('header__navigation-wrap_active');
    $('body').removeClass('active');
  });

  //Questions
  $('.fag__item', this).on('click', function() {
    $('.fag__icon-plus', this).toggleClass("active");
    $('.fag__text', this).slideToggle(400);
  });

  //Forms
  $('.button-base_sign-up').on('click', function() {
    $('.form-sign-up').addClass("active");
  });
  $('.form-sign-up__cancel').on('click', function() {
    $('.form-sign-up').removeClass("active");
  });

  $('.button-base_login').on('click', function() {
    $('.form-login').addClass("active");
  });
  $('.form-login__cancel').on('click', function() {
    $('.form-login').removeClass("active");
  });

});


if ($(".horizontal-content").length > 0) {
  manifestoW = $(".horizontal-content").outerWidth();
  manifestoNeeded = manifestoW;
  $(".horizontal").css("width", manifestoNeeded);

  $(window).on("resize", function () {
    manifestoW = $(".horizontal-content").outerWidth();
    manifestoNeeded = manifestoW;
    $(".horizontal").css("width", manifestoNeeded);
  });

  var controller = new ScrollMagic.Controller();

  var tl = new TimelineMax();

  var elementWidth = document.getElementById("container").offsetWidth;

  var width = window.innerWidth - elementWidth;

  var duration = (elementWidth / window.innerHeight) * 100;

  var official = duration + "%";

  tl.to(".container", 5, { x: width, ease: Power0.easeNone });

  var scene1 = new ScrollMagic.Scene({
    triggerElement: ".container",
    triggerHook: 0,
    duration: official,
  })
    .setPin(".container")
    .setTween(tl)
    .addTo(controller);
}

var $window = $(window);
$vHeight = $(window).height();
$(window).scroll(function () {
  st = $(this).scrollTop();

  if ($(".horizontal-hold").length > 0) {
    horizontalWrapper = $(".horizontal-hold").offset().top;
    horizontalWrapperEnd = $(".horizontal-end").offset().top;
    scrolerW = $(".horizontal-content-scroller").outerWidth();
    scrolerSpanW = $(".horizontal-content-scroller span").outerWidth();
    totalH = horizontalWrapperEnd - horizontalWrapper;

    calculated =
      ((st - horizontalWrapper) / (totalH - $vHeight)) *
      (scrolerW - scrolerSpanW);

    $(".horizontal-content-scroller span").css({
      transform: "translateX(" + calculated + "px)",
      "-webkit-transform": "translateX(" + calculated + "px)",
      "-ms-transform": "translateX(" + calculated + "px)",
    });

    if (st > horizontalWrapper) {
      $(".horizontal-content-scroller").addClass("close");
    } else {
      $(".horizontal-content-scroller").removeClass("close");
    }

    if (st > horizontalWrapperEnd - $vHeight) {
      $(".horizontal-content-scroller").addClass("fadeout").removeClass("close");
    } else {
      $(".horizontal-content-scroller").removeClass("fadeout");
    }
  }
});
