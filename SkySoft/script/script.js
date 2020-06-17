//SCRIPT FOR POPUP

$(document).ready(function () {
	$('#submit').on('click', function () {
		$('#popup1').fadeIn(500);
	});

	$('#popupHide').on('click', function () {
			$('#popup1').fadeOut(400);
		});
});


//SCRIPT FOR SCROLLING

$(document).ready(function () {
	$(document).on("scroll", onScroll);
	
	//smoothscroll
	$('a[href^="#"]').on('click', function (e) {
		e.preventDefault();
		$(document).off("scroll");
		
		$('a').each(function () {
			$(this).removeClass('active');
		})
		$(this).addClass('active');

		var target = this.hash,
			menu = target;
		$target = $(target);
		$('html, body').stop().animate({
			'scrollTop': $target.offset().top+2
		}, 500, 'swing', function () {
			window.location.hash = target;
			$(document).on("scroll", onScroll);
		});
	});
});

function onScroll(event){
	var scrollPos = $(document).scrollTop();
	$('#menu-center a').each(function () {
		var currLink = $(this);
		var refElement = $(currLink.attr("href"));
		if (refElement.position().top <= scrollPos && refElement.position().top + refElement.height() > scrollPos) {
			$('#menu-center ul li a').removeClass("active");
			currLink.addClass("active");
		}
		else{
			currLink.removeClass("active");
		}
	});
}


//SKRIPT FOR ANIMATE

$(window).load(function(){
		$('#slogan').delay(1500).fadeOut(1000);

		$('#submit').animate({bottom: "5%"}, 1500, 'swing');

		$('#text').animate({
			width: "41%",
			top: "21%",
			zIndex: "11"
		}, 800, 'linear');

		$('#clouds').animate({
			width: "19%",
			top: "40%",
			zIndex: "13"
		}, 800, 'linear');

		$('#text').animate({
			width: "25%",
			top: "33%",
		}, 800, 'linear');

		$('#clouds').animate({
			width: "35%",
			top: "30%",
		}, 800, 'linear');

		$('#text').animate({
			width: "38%",
			top: "40%",
			zIndex: "13"
		}, 800, 'linear', function(){
			$(this).fadeOut(1000);
		});

		$('#clouds').animate({
			width: "21%",
			top: "23%",
			zIndex: "11"
		}, 800, 'linear', function(){
			$(this).fadeOut(1000);
		});
	});


//SCRIPT FOR ACTIVE FANCYBOX

$(document).ready(function() {
	$(".fancybox").fancybox({

		overlayShow : true,
		padding : 20,
		margin : 50,
	});
});


$(document).ready(function() {
	$('#showMenu').on('click', function () {
		$('#mobileMenu').slideToggle("slow");
	})
});