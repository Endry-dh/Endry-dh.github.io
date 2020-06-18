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

/*==========Components Start===========*/

	if($('.styled').length) {
		$('.styled').styler();
	};
	if($(".jq-datepicker" ).length) {
		$(".jq-datepicker").datepicker({
			dateFormat: "dd.mm.yy",
			showOn:"both",
			buttonImage: "img/date.png",
			buttonImageOnly: true
		});
	};
	if($('.slick-carousel').length) {
		$('.slick-carousel').slick({
			dots: false,
			arrows: false,
			autoplay: true,
			infinite: true,
			speed: 1000,
			autoplaySpeed: 3000,
			fade: true,
			cssEase: 'linear',
			slidesToShow: 1
		});
	};

/*=======Adaptive-Menu=======*/
	$('.btn__burger').on('click', function() {
		$('.menu').slideToggle(500);
	});

	$(window).resize(function() {
		if ($(window).width() > 992) {
			$('.menu').removeAttr('style');
		}
	});
/*=======Adaptive-Menu=======*/

/*==========Components End===========*/

});

var handler = function(){

	var height_footer = $('footer').height();
	var height_header = $('header').height();
	//$('.content').css({'padding-bottom':height_footer+40, 'padding-top':height_header+40});
	
	
	var viewport_wid = viewport().width;
	var viewport_height = viewport().height;
	
	if (viewport_wid <= 991) {

	}

}
$(window).bind('load', handler);
$(window).bind('resize', handler);



