$(document).ready(function(){

	// установим обработчики, элементу с идентификатором foo. Обработчики будут выводить текстовые сообщения
	$('.asd').hover(
	function(){
		$(this).find("img").prop("src", "img/logo3.png");
	},
	function(){
		$(this).find("img").prop("src", "img/adik.png");
	});

	$('#fullpage').fullpage({
		/*anchors: ['section1','about','team', 'services', 'clients', 'contacts'],
		menu: '#menu',*/
		lockAnchors: !1,
		css3: !1,
		scrollingSpeed: 1200,
		autoScrolling: !1,
		fitToSection: !0,
		fitToSectionDelay: 1e3,
		scrollBar: !1,
		easing: "easeInOutCubic",
		easingcss3: "ease",
		sectionSelector: ".section",
		slideSelector: ".slide",
		controlArrows: !0,
		slidesNavigation: !0,
		slidesNavPosition: "bottom",
		verticalCentered: !1,
		autoScrolling:true,
		parallax: true,
		responsiveWidth: 1365,
	});
	if ( $(window).width() < 1365 ) {
		$.fn.fullpage.setAutoScrolling(false);
	} else {
$.fn.fullpage.setAutoScrolling(true);
	}

	$(window).resize(function () {
		if ($(window).width() < 1365) {
			$.fn.fullpage.setAutoScrolling(false);

		} else {
$.fn.fullpage.setAutoScrolling(true);
		}
	});
	$(".s-header-logo").click(function() {
		$.fn.fullpage.moveTo("section1")
	});
	$(".s-about-arrow").click(function() {
		$.fn.fullpage.moveTo("about")
	});
	$(".s-team-arrow").click(function() {
		$.fn.fullpage.moveTo("team")
	});

	if ($(window).width() >1023) {
		const $slider = $(".s-team-slider");
		$slider
			.on('init', () => {
				mouseWheel($slider)
			})
			.slick({
				infinite: false,
				slidesToShow: 1,
				slidesToScroll: 1,
				swipe: false,
				arrows: false,
				dots: true,
				autoplay: false,
				autoplaySpeed: 4000,
					vertical: true,
				pauseOnFocus: false,
				mobileFirst: false,
				responsive: [
				{
					breakpoint: 1024,
					settings: {
						swipe: true
					}
				}
				]
			})
		function mouseWheel($slider) {
			$(window).on('wheel', { $slider: $slider }, mouseWheelHandler)
		}
		function mouseWheelHandler(event) {
			event.preventDefault()
			const $slider = event.data.$slider
			const delta = event.originalEvent.deltaY
			if(delta > 0) {
				$slider.slick('slickNext')
			}
			else {
				$slider.slick('slickPrev')
			}
		}
	}
	else
	{
		/*$('.s-team-slider').slick({
			infinite: true,
			slidesToShow: 1,
			slidesToScroll: 1,
			swipe: false,
			arrows: false,
			dots: true,
			vertical: true,
			autoplay: false,
			autoplaySpeed: 4000,
			pauseOnFocus: false,
			mobileFirst: false,
			responsive: [
			{
				breakpoint: 1024,
				settings: {
					swipe: true,
					vertical: true,
					verticalScrolling: true
				}
			}
			]
		}); */
	}


	/*$('.s-team-slider').slick({
		infinite: true,
		slidesToShow: 1,
		slidesToScroll: 1,
		swipe: false,
		arrows: false,
		dots: true,
		autoplay: false,
		autoplaySpeed: 4000,
		fade: true,
		cssEase: 'linear',
		pauseOnFocus: false,
		mobileFirst: false,
		responsive: [
		{
			breakpoint: 1024,
			settings: {
				swipe: true
			}
		}
		]
	}); */
	$('.s-portfolio-slider-for').slick({
		slidesToShow: 1,
		slidesToScroll: 1,
		arrows: true,
		dots: false,
		fade: true,
		asNavFor: '.s-portfolio-slider-nav'
	});
	$('.s-portfolio-slider-nav').slick({
		slidesToShow: 7,
		slidesToScroll: 1,
		asNavFor: '.s-portfolio-slider-for',
		dots: false,
		centerMode: true,
		focusOnSelect: true,
		arrows: false,
		variableWidth: true,
		responsive: [
		{
			breakpoint: 767,
			settings: {
				slidesToShow: 3,
			}
		},
		{
			breakpoint: 480,
			settings: {
				slidesToShow: 2,
			}
		}
		]
	});
	
	//$(".s-portfolio-slider-for").slick('slickNext');

	$(".btn-toggle").on("click", function(){

		if ($(this).hasClass("active")) {

			$(".s-header-list").slideUp( "faste");
			$(this).removeClass("active");
			$(this).removeClass("opened");
		}else{

			$(this).addClass("active");
			$(this).addClass("opened");
			$(".s-header-list").slideDown( "faste");
		}

	});
	
	initMap();
	function initMap() {
			var coordinates = {lat: 55.833937, lng: 37.491430}, popupContent = '<div class="s-contacts-info"><div class="s-contacts-title">Контакты</div><ul class="s-contacts-list"><li><span>Адрес:</span>125212, Москва, Адмирала Макарова 6, стр.2, офис 405"</li><li><span>Телефон:</span><a href="tel:+84951505047">+8 (495) 150-50-47</a></li></ul></div>',
			
				map = new google.maps.Map(document.getElementById('map2'), {
					center: coordinates,
					zoom: 16,
					disableDefaultUI: false,
					scrollwheel: true
				});

				 marker = new google.maps.Marker({
					position: coordinates,
					map: map,
					animation: google.maps.Animation.DROP 
				});

				infowindow = new google.maps.InfoWindow({
					content: popupContent
				});
					
				marker.addListener('click', function() {
					infowindow.open(map, marker);
				});
				infowindow.open(map, marker);
		}


	 /*ymaps.ready(function () {	
			var map = new ymaps.Map('map', {
				center: [55.843692, 37.490548],
				zoom: 16,
				controls: []
			});


		

			var polygonPlacemark = new ymaps.Placemark(
				[55.843692, 37.490548], {
					hintContent: 'Наш адрес'
				}, {
					iconLayout: polygonLayout,
					// Описываем фигуру активной области "Полигон".
					iconShape: {   
						type: 'Polygon',
						// Полигон описывается в виде трехмерного массива. Массив верхнего уровня содержит контуры полигона. 
						// Первый элемента массива - это внешний контур, а остальные - внутренние.
						coordinates: [
							// Описание внешнего контура полигона в виде массива координат.
							[[-28,-76],[28,-76],[28,-20],[12,-20],[0,-4],[-12,-20],[-28,-20]]
							// , ... Описание внутренних контуров - пустых областей внутри внешнего.
						]
					}
				}
			);
			map.geoObjects.add(polygonPlacemark);
	 });*/

});

