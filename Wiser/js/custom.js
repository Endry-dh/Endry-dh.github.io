$(document).ready(function() {

  $(".header__menu-icon").on('click', function(){
    $(".header__wrap-nav").slideToggle(500);
  });

  $(".popupLogin").on('click', function(){
    event.preventDefault();
    $(".popup-login").addClass("active");

    $(".popup-login__cancel").on('click', function(){
      $(".popup-login").removeClass("active");
    });
  });
  
  $(".our-packages__plate").hover(
    function(){
      $(".our-packages__plate").removeClass("active")
    }
  );

  $(".transaction-data .orange-btn").on('click', function(){
    $(".transaction-data_hide").slideToggle(500);
  });

  $(".results-table__wrap-content", this).on('click', function(){
    $(this).find(".results-table__arrow").toggleClass("active");
    $(this).find(".results-table__content").toggleClass("active");
  });


  $(".results-table__filter-item span.arrow").on('click', function(){
    $(this).toggleClass("active");
  });

  if ($('.dashboard').length) {
    $(".dashboard .transaction-analysis .form__arrow-down").on('click', function(){
      $(".dis-none").toggleClass("active");
      $(this).toggleClass("active");
      $(".form__wrap-btn_close").toggleClass("active");
      $(".form__wrap-btn_open").toggleClass("active");
    });
  };
  
  $(".dashboard.dashboard_2 .b-search .form__arrow-down, this").on('click', function(){
    $(this).toggleClass("active");
    $(".dashboard_2 .transaction-data_hide").slideToggle(500);
  });


  $(".results-table__filter-item_setting, this").on('click', function(){
    $(".results-table__filter-item_setting > div ").toggleClass("active");
  });

  $(".results-table__filter-item_setting .arrow").on('click', function(){
    $(this).toggleClass("active");
  });

  $(".expect-flows .button-base").on('click', function(){
    $(".expect-flows .popup").addClass("active");
  });
  $(".expect-flows .cancel").on('click', function(){
    $(".expect-flows .popup").removeClass("active");
  });

//Tabs
  $('.tabs-wrap').each(function() {
    let ths = $(this);
    ths.find('.tabs__content').not(':first').hide();
    ths.find('.tabs__btn').click(function() {
      ths.find('.tabs__btn').removeClass('active').eq($(this).index()).addClass('active');
      ths.find('.tabs__content').hide().eq($(this).index()).fadeIn()
    }).eq(0).addClass('active');
  });

  //Counter
    if ($('.counter').length) {
      var $element = $('.counter');
      let counter = 0;
      $(window).scroll(function() {

        var scroll = $(window).scrollTop() + $(window).height();
        var offset = $element.offset().top + $element.height();

        if (scroll > offset && counter == 0) {
          $('.counter__number').each(function() {
            var $this = $(this),
                countTo = $this.attr('data-count');
            
            $({ countNum: $this.text()}).animate({
              countNum: countTo
            },
          
            {
              duration: 3000,
              easing:'linear',
              step: function() {
                $this.text(Math.floor(this.countNum));
              },
              complete: function() {
                $this.text(this.countNum);
              }
            });
          });
          counter = 1;
        }
      });
    }

  //Scroll Left to Right
    if ($('.our-packages__wrap-content').length) {
      var $element_2 = $('.our-packages__wrap-content');
      let counter_2 = 0;
      $(window).scroll(function() {

        var scroll = $(window).scrollTop() + $(window).height();
        var offset = $element_2.offset().top + $element_2.height();

        if (scroll > offset && counter_2 == 0) {
          if ($(window).width() <=320) {
            $($element_2).animate({
              scrollLeft: $(this).scrollLeft() -500 
            }, 1500);
          }
          else if ($(window).width() <= 480) {
            $($element_2).animate({
              scrollLeft: $(this).scrollLeft() -580 
            }, 1500);
          }
          else if ($(window).width() <= 768) {
            $($element_2).animate({
              scrollLeft: $(this).scrollLeft() -400 
            }, 1500);
          }
          else if ($(window).width() <= 1000) {
            $($element_2).animate({
              scrollLeft: $(this).scrollLeft() -500 
            }, 1500);
          }

          counter_2 = 1;
        }
      });
    }


//Slider
    if ($('.flexslider').length) {
      var $window = $(window),
        flexslider = { vars:{} };

      function getGridSize() {
        return (window.innerWidth < 768) ? 1 :
        (window.innerWidth < 1000) ? 2 : 3;
      }

      $window.load(function() {
        $('.flexslider').flexslider({
          animation: "slide",
          animationLoop: true,
          controlNav: false,
          slideshow: false,
          touch: true,
          prevText: "",
          nextText: "",
          itemWidth: 210,
          animationSpeed: 500,
          minItems: getGridSize(),
          maxItems: getGridSize(),
          
          start: function(slider){
            flexslider = slider;
          }
        });
      });

      $window.resize(function() {
        var gridSize = getGridSize();

        flexslider.vars.minItems = gridSize;
        flexslider.vars.maxItems = gridSize;
      });
    }


    if ($('select').length) {
      $('select').styler();
    }

    $('testSelect1').styler('destroy');


    $("#slider").slider({
      min: 0,
      max: 15000,
      step: 10,
      values: [0,15000],
      range: true,
    });
  
    $("#slider-2").slider({
      min: 0,
      max: 15000,
      step: 10,
      values: [0,15000],
      range: true,
    });
  
    $("#slider-3").slider({
      min: 0,
      max: 15000,
      step: 10,
    });
  
    $("#slider-4").slider({
      min: 0,
      max: 15000,
      step: 10,
    });
  
    $("#slider-5").slider({
      min: 0,
      max: 15000,
      step: 10,
    });
  
    $("#slider-6").slider({
      min: 0,
      max: 15000,
      step: 10,
    });
});


//Multiselect
document.multiselect('#testSelect1')
		.setCheckBoxClick("checkboxAll", function(target, args) {
			console.log("Checkbox 'Select All' was clicked and got value ", args.checked);
		})
		.setCheckBoxClick("1", function(target, args) {
			console.log("Checkbox for item with value '1' was clicked and got value ", args.checked);
		});

    $('.multiselect-input').on('focusin', function(){
      $(".multiselect-dropdown-arrow").addClass("active");
    });
    $('.multiselect-input').on('focusout', function(){
      $(".multiselect-dropdown-arrow").removeClass("active");
    });