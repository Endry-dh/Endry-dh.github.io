"use strict";

var myIMGs=new Array();
var myURLs=new Array();
var homelogosUrl = new Array();
var mimg = new Array();

//puff; drop; slide
var effect = "drop";
var speed = 1000;
var pauseLen = 2000;

var curIMG = "";
var options = {};
var options1 = { direction: 'left' };
var options2 = { direction: 'right' };
var curLogo = 1;
var lastLogo = 1;
var firsttime = true;
var curItem = 7; //we start with the 8th entry as last loaded.
var maxNum = 0;
//alert(maxNum + "logos loaded.");

function startFades(){
	$('#img_2').fadeIn(1500);
	$('#img_3').fadeIn(1500);
	$('#img_6').fadeIn(1500);
	$('#img_7').fadeIn(1500);
	$('#img_1').fadeIn(3000);
	$('#img_4').fadeIn(3000);
	$('#img_5').fadeIn(3000);
	$('#img_8').fadeIn(3000);
	setTimeout("fadeNext()",2000);
}
function launchLink(linknum){
	location.href=homelogosUrl[linknum];
}
function getOptions(logonum){
	//left and right groups
	if(logonum==3 || logonum==4 || logonum==7 || logonum==8) {
		return options2;
	} else {
		return options1;
	}
}
function getOptions2(logonum){
	//top and bottom groups
	if(logonum==1 || logonum==2 || logonum==3 || logonum==4) {
		return options1;
	} else {
		return options2;
	}
}
function fadeNext() {
	if(!firsttime) {
		options = getOptions(curLogo);
		$('#img_'+curLogo).show(effect,options,speed,function(){});
	} else {
		firsttime = false;
	}

	curItem = curItem + 1;

	while(curLogo==lastLogo || curLogo==0) {
		curLogo = Math.floor(Math.random()*9);
	}

	if(curLogo>8){
		curLogo=1;
	}

	if(curItem==maxNum){
		curItem=0;
	}

	lastLogo = curLogo;

	options = getOptions(curLogo);
	$('#img_'+curLogo).hide(effect, options, speed, function(){
		var thisLogo = checkDoubles(myIMGs[curItem]);
		$('#img_'+curLogo).attr('src',thisLogo[0]);
		mimg[curLogo] = thisLogo[0];
		homelogosUrl[curLogo] = thisLogo[1];
	});

	setTimeout("fadeNext()",pauseLen);
}
function checkDoubles(imagein){
	var newimg = imagein;
	while($.inArray(newimg,mimg)!=-1)
	{
		newimg = chooseNext();
	}
	return new Array(newimg,myURLs[curItem]);
}
function chooseNext(){
	curItem=curItem+1;
	if(curItem>=maxNum){ curItem=0; }
	return myIMGs[curItem];
}
function setUpLogoMix()
{
    myIMGs=new Array(); 
    myURLs=new Array();
    homelogosUrl = new Array();
    mimg = new Array();
    
    $.each(dynamicData, function(id, obj){
        myIMGs.push(obj.image);
        myURLs.push(obj.url);
    });
    
    for(var iLogoMix = 0; iLogoMix < 9; iLogoMix++) {
        homelogosUrl[iLogoMix] = myURLs[iLogoMix];
        mimg[iLogoMix] = myIMGs[iLogoMix];
    }
    maxNum = myIMGs.length;
 
}
$(document).ready(function() {
	setUpLogoMix();
	
	startFades();
});