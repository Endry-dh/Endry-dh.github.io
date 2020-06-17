$(window).on('load', function () {
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
		$('body').addClass('ios');
	} else{
		$('body').addClass('web');
	};
	$('body').removeClass('loaded'); 
});
/* viewport width */
function viewport(){
	var e = window, 
	a = 'inner';
	if ( !( 'innerWidth' in window ) )
	{
		a = 'client';
		e = document.documentElement || document.body;
	}
	return { width : e[ a+'Width' ] , height : e[ a+'Height' ] }
};
/* viewport width */
$(function(){
	/* placeholder*/	   
	$('input, textarea').each(function(){
		var placeholder = $(this).attr('placeholder');
		$(this).focus(function(){ $(this).attr('placeholder', '');});
		$(this).focusout(function(){			 
			$(this).attr('placeholder', placeholder);  			
		});
	});
	/* placeholder*/

	$('.button-nav').click(function(){
		$(this).toggleClass('active'), 
		$('.main-nav-list').slideToggle(); 
		return false;
	});
	
	/* components */
	
	/*
	
	if($('.styled').length) {
		$('.styled').styler();
	};
	if($('.fancybox').length) {
		$('.fancybox').fancybox({
			margon  : 10,
			padding  : 10
		});
	};
	if($('.slick-slider').length) {
		$('.slick-slider').slick({
			dots: true,
			infinite: false,
			speed: 300,
			slidesToShow: 4,
			slidesToScroll: 4,
			responsive: [
				{
				  breakpoint: 1024,
				  settings: {
					slidesToShow: 3,
					slidesToScroll: 3,
					infinite: true,
					dots: true
				  }
				},
				{
				  breakpoint: 600,
				  settings: "unslick"
				}				
			]
		});
	};
	if($('.scroll').length) {
		$(".scroll").mCustomScrollbar({
			axis:"x",
			theme:"dark-thin",
			autoExpandScrollbar:true,
			advanced:{autoExpandHorizontalScroll:true}
		});
	};
	
	*/
	
	/* components */

	if($('input.star').length) {
		$('input.star').rating();
	}

	if($('.js-select').length) {
		$( '.js-select' ).selectmenu();
	};	


	var handle = $( '.js-range-value' );
	$( '.js-range' ).slider({
		range: "min",
		value: 1995,
		min: 1990,
		max: (new Date()).getFullYear(),
		create: function() {
			handle.text( $( this ).slider( "value" ) );
		},
		slide: function( event, ui ) {
			handle.text( ui.value );
		}
	});


});

var handler = function(){
	
	var mySwiper = new Swiper ('.js-review-slider', {
		effect: 'coverflow',
		spaceBetween: 0,
		slidesPerView: 'auto',
		centeredSlides: true,
		loop: true,
		slidesPerGroup: 1,
		coverflowEffect: {
			rotate: 0,
			stretch: 0,
			depth: 800,
			modifier: 1,
			slideShadows : false,
			shadowOffset: 0,
			centeredSlides: true,

		},
		navigation: {
			nextEl: '.swiper-button-next',
			prevEl: '.swiper-button-prev',
		},

		breakpoints: {
			991: {
				slidesPerView: 1,
				effect: false,
				centeredSlides: false,
				coverflowEffect: {
					depth: 0,
					modifier: false,
				}
			}
		}

	});

	// mySwiper.update();

	if (window.innerWidth <= 680) {
		$('.js-menu-title').removeClass('active');
		$('.js-menu-list').css('display', 'none');
	} else {
		$('.js-menu-title').addClass('active');
		$('.js-menu-list').css('display', 'block');
	}
}

$('.js-menu-title').click(function() {
	$(this).toggleClass('active');
	$(this).next('.js-menu-list').slideToggle();
})

// pagination
$('.js-pagination li a').click(function() {
	$('.js-pagination li a').removeClass('active');

	$(this).addClass('active');
})



$(window).bind('load', handler);
$(window).bind('resize', handler);


if($('a.js-image').length) {
	$("a.js-image").fancybox({
		overlayShow : true,
		wrapCSS: 'fancybox-img-wrap',
		padding: 0,
		margin: 30,
		arrows: false,
		autoResize : true,
	});
};

if($('.js-popup').length) {
	$(".js-popup").fancybox({
		maxWidth	: '410px',
		maxHeight	: '650px',
		width		: '90%',
		height		: '90%',
		closeClick	: false,
		openEffect	: 'none',
		closeEffect	: 'none',
		overlayShow : true,
		padding     : '0',
	});
}

if($('.js-popup-success').length) {
	$(".js-popup-success").fancybox({
		maxWidth	: '395px',
		maxHeight	: '650px',
		wrapCSS: 'fancybox-success',
		width		: '90%',
		height		: '90%',
		closeClick	: false,
		openEffect	: 'none',
		closeEffect	: 'none',
		overlayShow : true,
		padding     : '0',
		afterLoad: function(){
			setTimeout( function() {
				$.fancybox.close();
			},3000);
		}
	});
}

if($('.js-phone').length) {
	$('.js-phone').mask('+745(000)-000-00');
};


// fixed message

$(window).scroll(function() {
	var scrollTop = window.scrollY;
	var heightFooter = $('.js-footer')[0].clientHeight;
	var scrollFooter = $('.js-footer')[0].offsetTop;
	var scrollBottom  = scrollTop + window.innerHeight;
	if (scrollBottom > scrollFooter + 115) {
		$('.js-send-message').css('bottom', scrollBottom - scrollFooter - 115);
		$('.js-top').css('bottom', scrollBottom - scrollFooter - 135);
	} else {
		$('.js-send-message').css('bottom', '0');
		$('.js-top').css('bottom', '15px');
	}

	if (scrollTop > 200) {  
		$('.js-send-message').addClass('fixed-send-message');
		$('.js-top').addClass('fixed-top-button');
		$('header').addClass('header-scroll');
	} else {
		$('.js-send-message').removeClass('fixed-send-message');
		$('.js-top').removeClass('fixed-top-button');
		$('.js-form').removeClass('active');
		$('header').removeClass('header-scroll');

	}
});

// open form send mesage
$('.js-open-form').click( function() {
	$('.js-form').addClass('active');
})

$('.js-form-close').click( function() {
	$('.js-form').removeClass('active');
})

// top scroll
$('.js-top').click(function(){
	$('html, body').animate({scrollTop : 0},800);
	return false;
});

// menu

$('.js-menu-button').click(function(){
	$(this).toggleClass('active');
	$('.js-menu').toggleClass('active');
});

// animate
// new WOW().init();

wow = new WOW(
{
	mobile: false,
}
)
wow.init();