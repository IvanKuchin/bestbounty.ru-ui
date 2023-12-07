/*jslint devel: true, indent: 4, maxerr: 50*/ 
/*globals system_calls:off*/

// --- change it in (chat.js, common.js, localy.h)
var FREQUENCY_ECHO_REQUEST = 60;
var FREQUENCY_USERNOTIFICATION_REQUEST = 60 * 5;
var FREQUENCY_RANDOM_FACTOR = 10;


// -- global var used because of setTimeout don't support parameters in IE9
var	navMenu_search = navMenu_search || {};
var	navMenu_chat = navMenu_chat || {};
var navMenu_userNotification = navMenu_userNotification || {};
var	system_calls = system_calls || {};
var	system_notifications = system_notifications || {};
var userRequestList; 
var	userCache = userCache || {};
var	gift_list = gift_list || {};

system_calls = (function()
{
	"use strict";
	var	userSignedIn = false;
	var	firstRun = true; // --- used to fire one time running func depends on userSignedIn
	var	companyTypes = ["___","ООО","ОАО","ПАО","ЗАО","Группа","ИП","ЧОП","Концерн","Конгломерат","Кооператив","ТСЖ","Холдинг","Корпорация","НИИ"].sort();
	var	eventTypes = {invitee: "По приглашению", everyone: "Открыто для всех"};
	var	startTime = {"0:00":"0:00", "0:30":"0:30", "1:00":"1:00", "1:30":"1:30", "2:00":"2:00", "2:30":"2:30", "3:00":"3:00", "3:30":"3:30", "4:00":"4:00", "4:30":"4:30", "5:00":"5:00", "5:30":"5:30", "6:00":"6:00", "6:30":"6:30", "7:00":"7:00", "7:30":"7:30", "8:00":"8:00", "8:30":"8:30", "9:00":"9:00", "9:30":"9:30", "10:00":"10:00", "10:30":"10:30", "11:00":"11:00", "11:30":"11:30", "12:00":"12:00", "12:30":"12:30", "13:00":"13:00", "13:30":"13:30", "14:00":"14:00", "14:30":"14:30", "15:00":"15:00", "15:30":"15:30", "16:00":"16:00", "16:30":"16:30", "17:00":"17:00", "17:30":"17:30", "18:00":"18:00", "18:30":"18:30", "19:00":"19:00", "19:30":"19:30", "20:00":"20:00", "20:30":"20:30", "21:00":"21:00", "21:30":"21:30", "22:00":"22:00", "22:30":"22:30", "23:00":"23:00", "23:30":"23:30"};

	var	current_script_global = "";
	var	globalScrollPrevOffset = -1;

	var Init = function() 
	{
		// --- Turn of AJAX caching
		$.ajaxSetup({ cache: false });

		// --- Animate shadow on logo
		$("#imageLogo").on("mouseover", function() { $(this).addClass("box-shadow--8dp"); });
		$("#imageLogo").on("mouseout", function() { $(this).removeClass("box-shadow--8dp"); });

		// --- Friendship buttons
		$("#ButtonFriendshipRemovalYes").on("click", function()
			{
				var clickedButton = $(this).data("clickedButton");

				$("#DialogFriendshipRemovalYesNo").modal("hide");

				clickedButton.data("action", "disconnect");
				clickedButton.click();
			});

		$("#DialogFriendshipRemovalYesNo").on("shown.bs.modal", 
			function()
			{
				$("#DialogFriendshipRemovalYesNo button.btn.btn-default").focus();
			});


		// --- Friends href
		$("#navbar-my_network").on("click", function() 
			{
				window.location.href = "/my_network?rand=" + Math.random()*98765432123456;
			} );

		// --- Сhat href
		$("#navbar-chat").on("click", function() 
			{
				window.location.href = "/chat?rand=" + Math.random()*98765432123456;
			} );

		// --- Notification href
		$("#navbar-notification").on("click", function() 
			{
				window.location.href = "/user_notifications?rand=" + Math.random()*98765432123456;
			} );

		// --- Menu drop down on mouse over
		jQuery("ul.nav li.dropdown").mouseenter(function() {
		  jQuery(this).find(".dropdown-menu").stop(true, true).delay(200).fadeIn();
		});
		jQuery("ul.nav li.dropdown").mouseleave(function() {
		  jQuery(this).find(".dropdown-menu").stop(true, true).delay(200).fadeOut();
		});

		// --- Check availability / sign-in
		window.setTimeout(SendEchoRequest, 1000);
		window.setTimeout(system_calls.PingDomainName, 1100);

		// --- Main search
		$("#navMenuSearchText")
								.on("keyup", navMenu_search.OnKeyupHandler)
								.autocomplete({
												source: "/cgi-bin/anyrole_1.cgi?action=AJAX_getUserAutocompleteList",
												select: navMenu_search.AutocompleteSelectHandler,
											});

		$("#navMenuSearchSubmit").on("click", navMenu_search.OnSubmitClickHandler);
	};

	var	ReplaceUIToGuest = function()
	{
		var		navbar_logo,
				hrefTag;

		if($(".__registration_link").length)
		{
			// --- not needed repeat all steps
		}
		else
		{
			navbar_logo = $("<a>")
				.addClass("navbar-brand")
				.attr("href", "/login?rand=" + GetUUID())
				.append(
					$("<img>")
						.attr("id", "imageLogo")
						.attr("width", "40px")
						.addClass("logo-transform logo-shift-up animateClass box-shadow--3dp")
						.attr("src", "/images/pages/logo/logo_site.jpg")
				);
			hrefTag = $("<a>")
				.addClass("navbar-brand __registration_link")
				.attr("href", "/login?rand=" + GetUUID())
				.append("Регистрация / Вход");
										
			$("#NavigationMenu").empty();

			$(".navbar-header").empty().append(navbar_logo).append(hrefTag);
/*
			// --- replace navigation menu to guest
			$("#NavigationMenu ul").empty();
			// $("#NavigationMenu ul").first().append(liTag.append(hrefTag));

			// --- remove friendship buttons
			$("button.friendshipButton").remove();
*/
		}
	};

	var	GetUUID = function()
	{
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {var r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);return v.toString(16);});
	};

	var	isUserSignedin = function()
	{
		return userSignedIn;
	};

	var	SetUserSignedout = function()
	{
		userSignedIn = false;
		ReplaceUIToGuest();
	};

	var	SetUserSignedin = function()
	{
		userSignedIn = true;
	};

	var	GetIntoPublicZone = function() 
	{
		window.location.replace("/autologin?rand=" + Math.random()*98765432123456);
	};

	function isTouchBasedUA() {
	  try{ document.createEvent("TouchEvent"); return true; }
	  catch(e){ return false; }
	}

	function isOrientationPortrait()
	{
		return ($(window).height() > $(window).width() ? true : false);
	}

	function isOrientationLandscape()
	{
		return ($(window).width() > $(window).height() ? true : false);
	}

	var	RemoveSpaces = function(text)
	{
		var result = text;

		result = result.replace(/ /g, "");
		return result;
	};

	var CutLongMessages = function(message, len)
	{
	 	if(message.length > len)
		{
	 		return message.substr(0, len) + "...";
		}

	 	return message;
	};

	var	PopoverError = function(tagID, message, placement)
	{
		var		alarm_tag;
		var		attr_id = "";
		var		error_message = "";
		var		loop_counter = 0;
		var		original_tag = tagID;
		var		display_timeout = Math.min(Math.max(30, message.length) * 100, 10000);

		if(placement) {} else { placement = "top"; }

		if(typeof(tagID) == "string") 		{ alarm_tag = $("#" + tagID); attr_id = tagID; }
		else if(typeof(tagID) == "object")	{ alarm_tag = tagID; attr_id = tagID.attr("id"); }
		else console.error("unknown tagID type(" + typeof(tagID) + ")");

		console.error("ERROR: tagID(" + (attr_id ? attr_id : "") + ") " + message);

		while(alarm_tag.is(":visible") === false)
		{
			alarm_tag = alarm_tag.parent();

			if(loop_counter++ > 5)
			{
				error_message = "fail to find visible parent to " + original_tag.attr("id");
				break;
			}
		}

		if(error_message.length === 0)
		{
			if(typeof alarm_tag != "undefined")
			{
				alarm_tag
					.attr("disabled", "disabled")
					.popover({"content": message, "placement":placement, "html": true})
					.popover("show");

				if(alarm_tag.parent().hasClass("has-feedback"))
				{
					alarm_tag
						.parent()
						.removeClass("has-success")
						.addClass("has-feedback has-error");
				}

				setTimeout(function ()
					{
						alarm_tag
							.removeAttr("disabled")
							.popover("destroy");
						if(alarm_tag.parent().hasClass("has-feedback"))
						{
							alarm_tag
								.parent()
								.removeClass("has-feedback has-error");
						}
					}, display_timeout);
			}
		}
		else
		{
			console.error(error_message);
		}
	};

	var	PopoverInfo = function(tagID, message, html)
	{
		var		alarm_tag;
		var		error_message = "";
		var		loop_counter = 0;
		var		original_tag = tagID;
		var		display_timeout = Math.min(Math.max(30, message.length) * 100, 10000);

		if(html) {} else { html = false; }

		if(typeof(tagID) == "string") 		{ alarm_tag = $("#" + tagID); }
		else if(typeof(tagID) == "object")	{ alarm_tag = tagID; }
		else console.error("unknown tagID type(" + typeof(tagID) + ")");

		while(alarm_tag.is(":visible") === false)
		{
			alarm_tag = alarm_tag.parent();

			if(loop_counter++ > 5)
			{
				error_message = "fail to find visible parent to " + original_tag;
				break;
			}
		}

		if(error_message.length === 0)
		{
			if(typeof alarm_tag != "undefined")
			{
				$(alarm_tag)
					.attr("disabled", "disabled")
					.popover({"content": message, "placement":"top", html: html})
					.popover("show");
				setTimeout(function ()
				{
					$(alarm_tag)
						.removeAttr("disabled")
						.popover("destroy");
				}, display_timeout);
			}
		}
		else
		{
			console.error(error_message);
		}
	};

	var	AlertError = function(tagID, message)
	{
		$("#" + tagID).addClass("animateClass");
		$("#" + tagID).addClass("form-group alert alert-danger");
		$("#" + tagID).append(message);

		setTimeout(function () 
			{
				$("#" + tagID).empty().removeClass("form-group alert alert-danger");
			}, 3000);
	};

	var FilterUnsupportedUTF8Symbols = function(plainText)
	{
		var	result = String(plainText);

		result = result.replace(/–/img, "-");
		result = result.replace(/•/img, "*");
		result = result.replace(/\"/img, "&quot;");
		result = result.replace(/\\/img, "&#92;");
		result = result.replace(/^\s+/, "");
		result = result.replace(/\s+$/, "");

		return result;
	};

	var	PrebuiltInitValue = function(htmlText)
	{
		var	result = String(htmlText);
		
		result = result.replace(/&amp;/img, "&");

		return result;
	};

	var ConvertHTMLToText = function(htmlText)
	{
		var	result = String(htmlText);

		result = result.replace(/<br>/img, "\n");
		result = result.replace(/&amp;/img, "&");
		result = result.replace(/&lt;/img, "<");
		result = result.replace(/&gt;/img, ">");
		result = result.replace(/•/img, "*");
		result = result.replace(/&quot;/img, "\"");
		result = result.replace(/&#92;/img, "\\");
		result = result.replace(/&#39;/img, "'");
		result = result.replace(/^\s+/, "");
		result = result.replace(/\s+$/, "");

		return result;
	};

	var ConvertTextToHTML = function(plainText)
	{
		var	result = String(plainText);

		result = FilterUnsupportedUTF8Symbols(result);
		result = result.replace(/</img, "&lt;");
		result = result.replace(/>/img, "&gt;");
		result = result.replace(/\n/img, "<br>");
		result = result.replace(/•/img, "*");
		result = result.replace(/^\s+/, "");
		result = result.replace(/\s+$/, "");

		return result;
	};

	var	ConvertMonthNameToNumber = function(srcStr)
	{
		var		dstStr = String(srcStr);

		dstStr = dstStr.replace(/Январь/i, "01");
		dstStr = dstStr.replace(/Янв/i, "01");
		dstStr = dstStr.replace(/Февраль/i, "02");
		dstStr = dstStr.replace(/Фев/i, "02");
		dstStr = dstStr.replace(/Март/i, "03");
		dstStr = dstStr.replace(/Мар/i, "03");
		dstStr = dstStr.replace(/Апрель/i, "04");
		dstStr = dstStr.replace(/Апр/i, "04");
		dstStr = dstStr.replace(/Май/i, "05");
		dstStr = dstStr.replace(/Июнь/i, "06");
		dstStr = dstStr.replace(/Июн/i, "06");
		dstStr = dstStr.replace(/Июль/i, "07");
		dstStr = dstStr.replace(/Июл/i, "07");
		dstStr = dstStr.replace(/Август/i, "08");
		dstStr = dstStr.replace(/Авг/i, "08");
		dstStr = dstStr.replace(/Сентябрь/i, "09");
		dstStr = dstStr.replace(/Сент/i, "09");
		dstStr = dstStr.replace(/Сен/i, "09");
		dstStr = dstStr.replace(/Октябрь/i, "10");
		dstStr = dstStr.replace(/Окт/i, "10");
		dstStr = dstStr.replace(/Ноябрь/i, "11");
		dstStr = dstStr.replace(/Ноя/i, "11");
		dstStr = dstStr.replace(/Декабрь/i, "12");
		dstStr = dstStr.replace(/Дек/i, "12");

		return dstStr;
	};

	var	ConvertMonthNumberToAbbrName = function(srcStr)
	{
		var		dstStr = String(srcStr);

		dstStr = dstStr.replace(/^0?1$/i, "Янв");
		dstStr = dstStr.replace(/^0?2$/i, "Фев");
		dstStr = dstStr.replace(/^0?3$/i, "Мар");
		dstStr = dstStr.replace(/^0?4$/i, "Апр");
		dstStr = dstStr.replace(/^0?5$/i, "Май");
		dstStr = dstStr.replace(/^0?6$/i, "Июн");
		dstStr = dstStr.replace(/^0?7$/i, "Июл");
		dstStr = dstStr.replace(/^0?8$/i, "Авг");
		dstStr = dstStr.replace(/^0?9$/i, "Сен");
		dstStr = dstStr.replace(/^10$/i, "Окт");
		dstStr = dstStr.replace(/^11$/i, "Ноя");
		dstStr = dstStr.replace(/^12$/i, "Дек");

		return dstStr;
	};

	var	ConvertMonthNumberToFullName = function(srcStr)
	{
		var		dstStr = String(srcStr);

		dstStr = dstStr.replace(/^0?1$/i, "Января");
		dstStr = dstStr.replace(/^0?2$/i, "Февраля");
		dstStr = dstStr.replace(/^0?3$/i, "Марта");
		dstStr = dstStr.replace(/^0?4$/i, "Апреля");
		dstStr = dstStr.replace(/^0?5$/i, "Мая");
		dstStr = dstStr.replace(/^0?6$/i, "Июня");
		dstStr = dstStr.replace(/^0?7$/i, "Июля");
		dstStr = dstStr.replace(/^0?8$/i, "Августа");
		dstStr = dstStr.replace(/^0?9$/i, "Сентября");
		dstStr = dstStr.replace(/^10$/i, "Октября");
		dstStr = dstStr.replace(/^11$/i, "Ноября");
		dstStr = dstStr.replace(/^12$/i, "Декабря");

		return dstStr;
	};

	// Convert from SQL format to HumaReadable
	// SQL: yyyy-mm-dd (for ex: 1980-08-15)
	// Human readable: dd MM yyyy (for ex: 15 Aug 1980)
	var	ConvertDateSQLToHuman = function(sqlDate)
	{
		var		dateArr = sqlDate.split(/-/);

		return (((parseInt(dateArr[2])  < 10) && (dateArr[2].length == 1)) ? "0" + dateArr[2] : dateArr[2]) + " " + ConvertMonthNumberToAbbrName(dateArr[1]) + " " + dateArr[0];
	};

	// Convert from SQL format to HumaReadable
	// SQL: dd/mm/yyyy (for ex: 15/08/1980)
	// Human readable: dd MM yyyy (for ex: 15 Aug 1980)
	var	ConvertDateRussiaToHuman = function(sqlDate)
	{
		var		dateArr = sqlDate.split(/\//);

		return dateArr[0] + " " + ConvertMonthNumberToAbbrName(dateArr[1]) + " " + (((parseInt(dateArr[2])  < 10) && (dateArr[2].length == 1)) ? "0" + dateArr[2] : dateArr[2]);
	};

	// Convert from SQL format to HumaReadable
	// SQL: dd/mm/yyyy (for ex: 15/08/1980)
	// Human readable: dd MM (for ex: 15 Августа)
	var	ConvertDateRussiaToHumanWithoutYear = function(sqlDate)
	{
		var		dateArr = sqlDate.split(/\//);

		return dateArr[0] + " " + ConvertMonthNumberToFullName(dateArr[1]);
	};

	// Convert from SQL format to HumaReadable
	// SQL: dd/mm/yyyy (for ex: 15/08/1980)
	// Human readable: dd MM (for ex: 15 Августа 1980)
	var	ConvertDateRussiaToHumanFullMonth = function(sqlDate)
	{
		var		dateArr = sqlDate.split(/\//);

		return dateArr[0] + " " + ConvertMonthNumberToFullName(dateArr[1]) + " " + (((parseInt(dateArr[2])  < 10) && (dateArr[2].length == 1)) ? "0" + dateArr[2] : dateArr[2]);
	};

	var	GetLocalizedDateNoTimeFromTimestamp = function(timestampEvent)
	{
		var		result;

		result = timestampEvent.getDate() + " " + system_calls.ConvertMonthNumberToAbbrName( (timestampEvent.getMonth() + 1) ) + " " + timestampEvent.getFullYear();

		return result;
	};

	var	GetLocalizedDateFromTimestamp = function(timestampEvent)
	{
		var		result;

		result = (timestampEvent.getHours() < 10 ? "0" : "") + timestampEvent.getHours() + ":" + (timestampEvent.getMinutes() < 10 ? "0" : "") + timestampEvent.getMinutes() + ":" + (timestampEvent.getSeconds() < 10 ? "0" : "") + timestampEvent.getSeconds() + " " + timestampEvent.getDate() + " " + system_calls.ConvertMonthNumberToAbbrName( (timestampEvent.getMonth() + 1) ) + " " + timestampEvent.getFullYear();

		return result;
	};

	var	GetLocalizedDateTimeFromTimestamp = function(timestampEvent)
	{
		var		result;

		result =  timestampEvent.getDate() + " " + system_calls.ConvertMonthNumberToAbbrName( (timestampEvent.getMonth() + 1) ) + " " + timestampEvent.getFullYear() + " в " + (timestampEvent.getHours() < 10 ? "0" : "") + timestampEvent.getHours() + ":" + (timestampEvent.getMinutes() < 10 ? "0" : "") + timestampEvent.getMinutes() + ":" + (timestampEvent.getSeconds() < 10 ? "0" : "") + timestampEvent.getSeconds();

		return result;
	};

	// --- input seconds since 1970 to event
	// --- output example: 2017-5-2
	var	GetSQLFormatedDateNoTimeFromTimestamp = function(timestampEvent)
	{
		var		result;

		result = timestampEvent.getFullYear() + "-" + String(timestampEvent.getMonth() + 1) + "-" + timestampEvent.getDate();

		return result;
	};


	// --- input: seconds since 1970 GMT
	// --- output: example: 2 Май 2017
	var	GetLocalizedDateNoTimeFromSeconds = function(seconds)
	{
		var		timestampEvent = new Date(GetMsecSinceEpoch(seconds));
		return GetLocalizedDateNoTimeFromTimestamp(timestampEvent);
	};

	// --- input: seconds since 1970 GMT
	// --- output: example: 13:34:01 2 Май 2017
	var	GetLocalizedDateFromSeconds = function(seconds)
	{
		var		timestampEvent = new Date(GetMsecSinceEpoch(seconds));

		return GetLocalizedDateFromTimestamp(timestampEvent);
	};

	// --- private function
	// --- input: seconds since 1970 GMT
	// --- output: example: 2 Май 2017 в 13:34:01 
	var	GetLocalizedDateTimeFromSeconds = function(seconds)
	{
		var		timestampEvent = new Date(GetMsecSinceEpoch(seconds));

		return GetLocalizedDateTimeFromTimestamp(timestampEvent);
	};

	var	GetLocalizedDateFromDelta = function(seconds)
	{
		var		timestampNow = new Date();
		var		timestampEvent = new Date(timestampNow.getTime() - ((typeof(seconds) == "string") ? parseInt(seconds) : seconds) * 1000);

		return GetLocalizedDateFromTimestamp(timestampEvent);
	};

	// --- input: format
	// ---		YYYY - year (2012)
	// ---		YYY - year, don't show if same as now
	// ---		YY - year (12)
	// ---		MM - month (08)
	// ---		MMM - short month (Авг)
	// ---		MMMM - spelled month (Августа)
	// ---		DD - day
	// ---		hh - hour
	// ---		mm - mins
	// ---		ss - seconds
	var	GetFormattedDateFromSeconds = function(seconds, format)
	{
		var		result = "";

		if(typeof(format) == "undefined")
		{
			console.error("format parameter mandatory");
		}
		else
		{
			var		timestamp = new Date(GetMsecSinceEpoch(seconds));
			var		timestampNow = new Date();

			result = format;

			if(format.match(/\bYYYY\b/)) result = result.replace(/\bYYYY\b/g, timestamp.getFullYear());
			if(format.match(/\bYYY\b/)) result = result.replace(/\bYYY\b/g, timestamp.getYear() == timestampNow.getYear() ? "" : timestamp.getFullYear());
			if(format.match(/\bYY\b/)) result = result.replace(/\bYY\b/g, timestamp.getYear() - 100);
			if(format.match(/\bMM\b/)) result = result.replace(/\bMM\b/g, timestamp.getMonth() + 1);
			if(format.match(/\bMMM\b/)) result = result.replace(/\bMMM\b/g, ConvertMonthNumberToAbbrName(timestamp.getMonth() + 1));
			if(format.match(/\bMMMM\b/)) result = result.replace(/\bMMMM\b/g, ConvertMonthNumberToFullName(timestamp.getMonth() + 1));
			if(format.match(/\bDD\b/)) result = result.replace(/\bDD\b/g, timestamp.getDate());
			if(format.match(/\bhh\b/)) result = result.replace(/\bhh\b/g, timestamp.getHours());
			if(format.match(/\bmm\b/)) result = result.replace(/\bmm\b/g, (timestamp.getMinutes() < 10 ? "0" : "") + timestamp.getMinutes());
			if(format.match(/\bss\b/)) result = result.replace(/\bss\b/g, (timestamp.getSeconds() < 10 ? "0" : "") + timestamp.getSeconds());
		}

		return result;
	};

	var	GetSQLFormatedDateNoTimeFromSeconds = function(seconds)
	{
		var		timestampEvent = new Date(GetMsecSinceEpoch(seconds));

		return GetSQLFormatedDateNoTimeFromTimestamp(timestampEvent);
	};


	var	GetMinutesSpelling = function(units)
	{
		var		result = "";

		if((units >= 5) && (units <= 20)) { result = "минут"; }
		else if(units % 10 == 1) { result = "минута"; }
		else if((units % 10 >= 2) && (units % 10 <= 4)) { result = "минуты"; }
		else { result = "минут"; }

		return result;
	};

	var	GetHoursSpelling = function(units)
	{
		var		result = "";

		if((units >= 5) && (units <= 20)) { result = "часов"; }
		else if(units % 10 == 1) { result = "час"; }
		else if((units % 10 >= 2) && (units % 10 <= 4)) { result = "часа"; }
		else { result = "часов"; }

		return result;
	};

	var	GetDaysSpelling = function(units)
	{
		var		result = "";

		if((units >= 5) && (units <= 20)) { result = "дней"; }
		else if(units % 10 == 1) { result = "день"; }
		else if((units % 10 >= 2) && (units % 10 <= 4)) { result = "дня"; }
		else { result = "дней"; }

		return result;
	};

	var	GetMonthsSpelling = function(units)
	{
		var		result = "";

		if((units >= 5) && (units <= 20)) { result = "месяцев"; }
		else if(units % 10 == 1) { result = "месяц"; }
		else if((units % 10 >= 2) && (units % 10 <= 4)) { result = "месяца"; }
		else { result = "месяцев"; }

		return result;
	};

	var	GetYearsSpelling = function(units)
	{
		var		result = "";

		if((units >= 5) && (units <= 20)) { result = "лет"; }
		else if(units % 10 == 1) { result = "год"; }
		else if((units % 10 >= 2) && (units % 10 <= 4)) { result = "года"; }
		else { result = "лет"; }

		return result;
	};

	var	GetSpellingMonthName = function(id)
	{
		var		result;

		if(id == 1) result = "января";
		if(id == 2) result = "февраля";
		if(id == 3) result = "марта";
		if(id == 4) result = "апреля";
		if(id == 5) result = "мая";
		if(id == 6) result = "июня";
		if(id == 7) result = "июля";
		if(id == 8) result = "августа";
		if(id == 9) result = "сентября";
		if(id == 10) result = "октября";
		if(id == 11) result = "ноября";
		if(id == 12) result = "декабря";

		return	result;
	};

	var	GetLocalizedDateFromSecondsHumanFormat = function(seconds)
	{
		var		timestampEvent = new Date(GetMsecSinceEpoch());
		var		timestampNow = new Date();
		var		diffYears = timestampNow.getFullYear() - timestampEvent.getFullYear();
		var		diffMonths = timestampNow.getMonth() - timestampEvent.getMonth();
		var		diffDays = timestampNow.getDate() - timestampEvent.getDate();
		var		diffHours = timestampNow.getHours() - timestampEvent.getHours();
		var		diffMins = timestampNow.getMinutes() - timestampEvent.getMinutes();
		var		months;

		var		result = "";

		if((diffYears > 1) || ((diffYears == 1) && (diffMonths >= 0)))
		{
			result = timestampEvent.getDate() + " " + GetSpellingMonthName(timestampEvent.getMonth() + 1) + " " + timestampEvent.getFullYear();
		}
		else if((diffYears == 1) && (diffMonths < 0))
		{
			months = 12 - (timestampEvent.getMonth() + 1) + (timestampNow.getMonth() + 1);

			if(months == 1) { result = "прошлый месяц"; }
			else if(months == 2) { result = "позапрошлый месяц"; }
			else if(months == 6) { result = "пол года назад"; }
			else { result  = months + " " + GetMonthsSpelling(months) + " назад"; }
		} 
		else if(diffMonths)
		{
			months = (timestampNow.getMonth() + 1) - (timestampEvent.getMonth() + 1);

			if(months == 1) { result = "прошлый месяц"; }
			else if(months == 2) { result = "позапрошлый месяц"; }
			else if(months == 6) { result = "пол года назад"; }
			else { result  = months + " " + GetMonthsSpelling(months) + " назад"; }
		}

		result = result + " назад";

		return result;
	};

	// --- returns DST offset in minutes between NOW() and Jan 1
	var GetDSTOffsetNow = function()
	{
		var tsNow = new Date();
		var tsJan = new Date(tsNow.getFullYear(), 0, 1);

		return tsJan.getTimezoneOffset() - tsNow.getTimezoneOffset();
	};


	// --- private !!! don't use it from outside classes
	var	GetMsecSinceEpoch = function(seconds)
	{
		var		result = ((typeof(seconds) == "string") ? parseInt(seconds) : seconds) * 1000;

		// --- DST fixing
		// --- Explanation:
		// --- JavaScript returning timedifference taking DST into consideration
		// --- MySQL  returning timedifference doesn't taking DST into consideration
		// --- discrepancy appears between MySQL and JavaScript 
		// result -= GetDSTOffsetNow() * 60 * 1000;

		return 	result;
	};

	// --- input: second since 1970
	// --- output: DD/mm/YYYY (for ex: 02/05/2017)
	var	GetLocalizedRUFormatDateNoTimeFromSeconds = function(seconds)
	{
		var msecSince1970 = GetMsecSinceEpoch(seconds);
		var	d1 = new Date(msecSince1970);
		var	day =  d1.getDay();
		var	mon = d1.getMonth() + 1;
		var	year = d1.getYear() + 1900;

		if(day < 10) day = "0" + day;
		if(mon < 10) mon = "0" + mon;

		return (day + "/" + mon + "/" + year);
	};

	// --- input: 0
	// --- output: 31 декабря 1969
	var	GetLocalizedDateInHumanFormatSecSince1970 = function(seconds)
	{
		var msecSince1970 = GetMsecSinceEpoch(seconds);

		return(GetLocalizedDateInHumanFormatMsecSince1970(msecSince1970));
	};

	// --- input: 3600 000 
	// --- output: 1 час назад
	var	GetLocalizedDateInHumanFormatMsecSinceEvent = function(secSinceEvent)
	{
		var		timestampNow = new Date();
		// var		timestamp1970 = new Date(1970, 0, 1);

		return(GetLocalizedDateInHumanFormatMsecSince1970(timestampNow.getTime() - secSinceEvent));
	};

	// --- private !!! don't use it from outside classes
	var	GetLocalizedDateInHumanFormatMsecSince1970 = function(msecEventSince1970)
	{
		var		timestampNow = new Date();
		var		timestampEvent = new Date(msecEventSince1970);
		
		var		differenceFromNow = (timestampNow.getTime() - msecEventSince1970) / 1000;
		var		result = "";

		var		minutes;
		var		months;
		var		days;

		if(differenceFromNow < 60 * 60)
		{
			minutes = Math.floor(differenceFromNow / 60);

			result  =  minutes + " " + GetMinutesSpelling(minutes) + " назад";
		}
		else if(differenceFromNow < 24 * 60 * 60)
		{
			var 	hours = Math.floor(differenceFromNow / (60 * 60));

			result  = hours + " " + GetHoursSpelling(hours) + " назад";
		}
		else if(differenceFromNow < 30 * 24 * 60 * 60)
		{
			days = Math.floor(differenceFromNow / (24 * 60 * 60)); 


			result  = days + " " + GetDaysSpelling(days) + " назад";
		}
		else if(differenceFromNow < 12 * 30 * 24 * 60 * 60)
		{
			months = Math.floor(differenceFromNow / (30 * 24 * 60 * 60));
			days = Math.floor((differenceFromNow - months * 30 * 24 * 60 * 60) / (24 * 60 * 60));

			result  = months + " " + GetMonthsSpelling(months) + " " + days + " " + GetDaysSpelling(days) + " назад";
		}
		else 
		{
			result = timestampEvent.getDate() + " " + GetSpellingMonthName(timestampEvent.getMonth() + 1) + " " + timestampEvent.getFullYear();
		}

		return result;
	};


	// --- input: duration in seconds
	// --- output:	5 дней
	// --- 			2 месяца 
	// --- 			1 год 2 месяца 
	// --- 			3 года 11 месяцев 
	// ---                           ^^^^^^ (no days, no hours, no minutes)	
	var	GetLocalizedWorkDurationFromDelta = function(seconds)
	{
		var		result = "";
		var		minutes;
		var		days;
		var		months;
		var		years;

		if(seconds < 60 * 60)
		{
			minutes = Math.floor(seconds / 60);

			result  =  minutes + " " + GetMinutesSpelling(minutes);
		}
		else if(seconds < 24 * 60 * 60)
		{
			var 	hours = Math.floor(seconds / (60 * 60));

			result  = hours + " " + GetHoursSpelling(hours);
		}
		else if(seconds < 30 * 24 * 60 * 60)
		{
			days = Math.floor(seconds / (24 * 60 * 60)); 


			result  = days + " " + GetDaysSpelling(days);
		}
		else if(seconds < 365 * 24 * 60 * 60)
		{
			months = Math.floor(seconds / (30 * 24 * 60 * 60));

			result  = months + " " + GetMonthsSpelling(months);
		}
		else 
		{
			years = Math.floor(seconds / (365 * 24 * 60 * 60));
			months = Math.floor((seconds - years * 365 * 24 * 60 * 60) / (30 * 24 * 60 * 60));

			result  = years + " " + GetYearsSpelling(years) + (parseInt(months) ? " " + months + " " + GetMonthsSpelling(months) : "");
		}

		return result;
	};

	var	GetGenderedPhrase = function(object, commonPhrase, malePhrase, femalePhrase)
	{
		var		result = commonPhrase;
		var		temp;

		if((typeof(object.srcObj) != "undefined") && (typeof(object.srcObj.sex) != "undefined")) 
			temp = object.srcObj.sex;
		else if(typeof(object.userSex) != "undefined")
			temp = object.userSex;
		else if(typeof(object.notificationFriendUserSex) != "undefined")
			temp = object.notificationFriendUserSex;

		if(temp == "male") result = malePhrase;
		else if(temp == "female") result = femalePhrase;

		return	result;
	};

	var GetGenderedActionCategoryTitle = function(feedItem)
	{
		if(feedItem.actionTypesId == "11")
		{
			// --- message write

			// --- fix category title for events
			if((typeof(feedItem.dstObj) == "object") && (typeof(feedItem.dstObj.type) == "string") && (feedItem.dstObj.type == "event"))
			{
				var	titleAddon = " во время события <a href=\"/event/" + feedItem.dstObj.link + "?rand=" + Math.random() * 234567890987 + "\">" + feedItem.dstObj.name + "</a>";

				feedItem.actionCategoryTitle += titleAddon;
				feedItem.actionCategoryTitleMale += titleAddon;
				feedItem.actionCategoryTitleFemale += titleAddon;
			}
		}

		return GetGenderedPhrase(feedItem, feedItem.actionCategoryTitle, feedItem.actionCategoryTitleMale, feedItem.actionCategoryTitleFemale);
	};

	var GetGenderedActionTypeTitle = function(feedItem)
	{
		return GetGenderedPhrase(feedItem, feedItem.actionTypesTitle, feedItem.actionTypesTitleMale, feedItem.actionTypesTitleFemale);
	};

	var SendEchoRequest = function()
	{
		$.getJSON(
			"/cgi-bin/system.cgi",
			{action:"EchoRequest"})
			.done(function(data) 
				{
					if(data.type == "EchoResponse")
					{
						if(data.session == "true")
						{
							if(data.user == "true")
							{
								SetUserSignedin();

								if(firstRun)
								{
									// --- Check system notifications
									window.setTimeout(system_calls.GetUserRequestNotifications, 1200);

									// --- if any action has to be done after user sign-up 
									// --- for example: user was invited to event, but not registered
									if($.cookie("initialactionid")) window.location.replace("/invite/" + $.cookie("initialactionid") + "?rand=" + system_calls.GetUUID());

									firstRun = false;
								}
							}
							else
							{
								// --- no need to redirect to public zone 
								// --- this will brake Guest view of news_feed

								SetUserSignedout();
							}
						}
						else
						{

							SetUserSignedout();

							// --- Clear session must be here
							// --- Explanation:
							// ---		Once sessison timed out, EchoRequest will return "session" == false
							// ---		This mean that cookie and persistence must be cleared.
							// ---		Otherwise: double redirect to autologin
							// ---			Redirect to index.cgi/action=autologin will define that cookies are incorrect, expire cookie and redirect to autologin again
							ClearSession();
							GetIntoPublicZone();
						}
					}
				}
			);

		// --- check session expiration once per minute
		window.setTimeout(SendEchoRequest, (FREQUENCY_ECHO_REQUEST + (Math.random() * FREQUENCY_RANDOM_FACTOR - FREQUENCY_RANDOM_FACTOR / 2)) * 1000);
	};


	var GetUserRequestNotifications = function()
	{
		if(isUserSignedin())
		{
			$.getJSON(
				"/cgi-bin/system.cgi",
				{action:"GetUserRequestNotifications"})
				.done(function(data) 
					{
						if(data.type == "UnreadUserNotifications")
						{
							if(data.session == "true")
							{
								if(data.user == "true")
								{
/*									{
										var	badgeSpan = $("<span/>").addClass("badge")
																	.addClass("badge-danger");

										if(data.friendshipNotificationsArray.length > 0)
										{
											badgeSpan.append(data.friendshipNotificationsArray.length);
										}

										$("#user-requests-ahref .badge").remove();
										$("#user-requests-ahref").append(badgeSpan);
									}
*/
									if(data.userNotificationsArray.length > 0)
									{
										navMenu_userNotification.InitializeData(data.userNotificationsArray);
										navMenu_userNotification.BuildUserNotificationList();
									}

									userRequestList = data;

									window.setTimeout(BuildUserRequestList, 1000);
								}
								else
								{
									console.error("system_calls.GetUserRequestNotifications: DoneHandler: ERROR: guest user");
								}
							}
							else
							{
								console.error("system_calls.GetUserRequestNotifications: DoneHandler: ERROR: session does not exists on server, session must be deleted, parent window must be redirected");

								ClearSession();
								GetIntoPublicZone();
							}
						}
					}
				);

		} // --- if(isUserSignedin())
		else
		{
			// --- user not signed in (no need to check notifications)
		}

		// --- check system notifications
		window.setTimeout(system_calls.GetUserRequestNotifications, (FREQUENCY_USERNOTIFICATION_REQUEST + (Math.random() * FREQUENCY_RANDOM_FACTOR - FREQUENCY_RANDOM_FACTOR / 2)) * 1000);
	
		// console.debug('system_calls.GetUserRequestNotifications: end');
	};

	async function PingDomainName() {
		return fetch("/api/v1/domain", {
			method: "POST"
		})
	}

	var BuildUserRequestList = function()
	{
		var		resultDOM = $();
		var		userCounter = 0;

		var CutUserName19Symbols = function(userName)
		{
		 	if(userName.length > 19)
		 	{
		 		return userName.substr(0, 19) + "...";
		 	}

		 	return userName;
		};

		userRequestList.friendshipNotificationsArray.forEach(
			function(item, i, arr)
			{

				$.getJSON
				(
					"/cgi-bin/system.cgi",
					{ action: "GetUserInfo", userID: item.friendID }
				)
				.done(
					function(result)
					{
						var		userInfo = result.userArray[0];
						var		userSpan = $("<span/>").addClass("RequestUserListSpan");
						var		buttonSpan = $("<span/>");
						var		liUser = $("<li/>").addClass("dropdown-menu-li-higher");
						var		liDivider = $("<li/>").addClass("divider");
						var		buttonAccept = $("<button>").addClass("btn btn-primary")
															.append("Принять")
															.data("action", "confirm");
						var		buttonReject = $("<button>").addClass("btn btn-default")
															.append("Отказаться")
															.data("action", "disconnect");
						var		canvasAvatar = $("<canvas/>")	.attr("width", "30")
																.attr("height", "30")
																.addClass("canvas-big-avatar")
																.addClass("RequestUserListOverrideCanvasSize");

						// --- update cache with this user
						userCache.UpdateWithUser(userInfo);

						// --- use the global counter due to getJSON may be returned not in right order
						// --- firstly for user #2
						// --- secondly for user #1
						userCounter++;

						Object.keys(userInfo).forEach(function(itemChild, i, arr) {
							buttonReject.data(itemChild, userInfo[itemChild]);
							buttonAccept.data(itemChild, userInfo[itemChild]);
						});

						buttonReject.on("click", FriendshipButtonClickHandler);
						buttonAccept.on("click", FriendshipButtonClickHandler);


						resultDOM = resultDOM.add(liUser);

						var hrefTemp = $("<a/>").attr("href", "/userprofile/" + userInfo.id)
												.addClass("RequestUserListHrefLineHeigh")
												.append(CutUserName19Symbols(userInfo.name + " " + userInfo.nameLast));
						userSpan.append(canvasAvatar)
								.append(hrefTemp)
								.append(buttonSpan);
						buttonSpan
								.append(buttonAccept)
								.append(" ")
								.append(buttonReject);

						DrawUserAvatar(canvasAvatar[0].getContext("2d"), userInfo.avatar, userInfo.name, userInfo.nameLast);

						liUser.append(userSpan);

						if(userCounter < arr.length)
						{
							resultDOM = resultDOM.add(liDivider);
						}
			
						if(userCounter == arr.length)
						{
							$("#user-requests-ul").empty()
													.append(resultDOM);
						}
						
					}
				);


			}
		); // --- data.notificationsArray.forEach()
	};

	var	ScrollWindowToElementID = function(elementID)
	{
		if($(elementID).length)
		{
			var	elementOffset 			= $(elementID).position().top;
			var	elementClientHeight 	= $(elementID)[0].clientHeight;
			var	windowScrollTop			= $(window).scrollTop();
			var	windowHeight			= $(window).height();

			console.debug("ScrollWindowToElementID: prevOffset[" + globalScrollPrevOffset + "] == scroll len to elem = " + (elementOffset - windowScrollTop));

			// --- scroll only if 
			// --- 1) scroll length to element > 10
			// --- 2) scroll from previous to current cycles is successful (page was scrolled)
			// if((Math.abs(elementOffset - windowScrollTop) > 10) && (!globalScrollPrevOffset || (globalScrollPrevOffset > Math.abs(elementOffset - windowScrollTop))))
			if((Math.abs(elementOffset - windowScrollTop) > 10) && (globalScrollPrevOffset != (elementOffset - windowScrollTop)))
			{
				globalScrollPrevOffset = elementOffset - windowScrollTop;

				$("body").animate({scrollTop: elementOffset }, 400);
				$("html").animate({scrollTop: elementOffset }, 400);

				setTimeout(function() { ScrollWindowToElementID(elementID); }, 600);
			}
			else
			{
				globalScrollPrevOffset = 0;
			}
		}
	};

	var	GetParamFromURL = function(paramName)
	{
		var result = ""; 
		var	tmp = new RegExp("[\?&]" + paramName + "=([^&#]*)").exec(window.location.href);

		if(tmp && tmp.length) result = tmp[1];

		return result;
	};

	// --- build "management" buttons and put it into DOM-model
	// --- input
	// ---		companyInfo - info from GetUserListInJSONFormat
	// ---		housingTag - tag where buttons have to be placed to
	var RenderCompanyManagementButton = function(companyInfo, housingTag, callbackFunc)
	{
		var		buttonCompany1;

		buttonCompany1 = $("<button/>").data("action", "");
		Object.keys(companyInfo).forEach(function(itemChild, i, arr) {
			buttonCompany1.data(itemChild, companyInfo[itemChild]);
		});

		if(companyInfo.isMine == "1") 
		{ 
			buttonCompany1.append($("<span>").addClass("glyphicon glyphicon-pencil")) 
							.removeClass()
							.addClass("btn btn-primary form-control")
							.data("action", "companyProfileEdit")
							.attr("title", "Редактировать")
							.tooltip({ animation: "animated bounceIn", placement: "top" });
		}
		else if(companyInfo.isFree == "1") 
		{ 
			buttonCompany1.append($("<span>").addClass("glyphicon glyphicon-plus")) 
							.removeClass()
							.addClass("btn btn-success form-control")
							.data("action", "companyProfileTakeOwnership")
							.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>")
							.attr("title", "Моя компания !")
							.attr("data-target", "#PossessionAlertModal")
							.attr("data-toggle", "modal")
							.tooltip({ animation: "animated bounceIn", placement: "top" });
		}
		else
		{ 
			buttonCompany1.append($("<span>").addClass("glyphicon glyphicon-question-sign")) 
							.removeClass()
							.addClass("btn btn-danger form-control")
							.data("action", "companyProfileRequestOwnership")
							.attr("title", "Отправить запрос")
							.attr("data-target", "#PossessionRequestModal")
							.attr("data-toggle", "modal")
							.tooltip({ animation: "animated bounceIn", placement: "top" });
		}

		buttonCompany1.on("click", callbackFunc);

		housingTag.append(buttonCompany1);
	}; // --- RenderFriendshipButtons

	var	amIMeetingHost = function(eventInfo)
	{
		var		myUserID = $("#myUserID").data("myuserid");
		var		result = false;
		
		if((typeof(myUserID) == "number") && myUserID)
		{
			eventInfo.hosts.forEach(function(item)
				{
					if(item.user_id == myUserID) result = true;
				});
		}

		return	result;
	};

	// --- build "management" buttons and put it into DOM-model
	// --- input
	// ---		eventInfo - info from GetUserListInJSONFormat
	// ---		housingTag - tag where buttons have to be placed to
	var RenderEventManagementButton = function(eventInfo, housingTag, callbackFunc)
	{
		var		buttonEvent1;

		buttonEvent1 = $("<button/>").data("action", "");
		Object.keys(eventInfo).forEach(function(itemChild, i, arr) {
			buttonEvent1.data(itemChild, eventInfo[itemChild]);
		});

		if(amIMeetingHost(eventInfo))
		{
			buttonEvent1.append($("<span>").addClass("glyphicon glyphicon-pencil")) 
							.removeClass()
							.addClass("btn btn-primary form-control")
							.data("action", "eventProfileEdit")
							.attr("title", "Редактировать")
							.tooltip({ animation: "animated bounceIn", placement: "top" });

			buttonEvent1.on("click", callbackFunc);

			housingTag.append(buttonEvent1);
		}

	}; // --- RenderFriendshipButtons

	// --- build "management" buttons and put it into DOM-model
	// --- input
	// ---		groupInfo - info from GetUserListInJSONFormat
	// ---		housingTag - tag where buttons have to be placed to
	var RenderGroupManagementButton = function(groupInfo, housingTag, callbackFunc)
	{
		var		buttonGroup1;

		buttonGroup1 = $("<button/>").data("action", "");
		Object.keys(groupInfo).forEach(function(itemChild, i, arr) {
			buttonGroup1.data(itemChild, groupInfo[itemChild]);
		});

		if(groupInfo.isMine == "1") 
		{ 
			buttonGroup1.append($("<span>").addClass("glyphicon glyphicon-pencil")) 
							.removeClass()
							.addClass("btn btn-primary form-control")
							.data("action", "groupProfileEdit")
							.attr("title", "Редактировать")
							.tooltip({ animation: "animated bounceIn", placement: "top" });

			buttonGroup1.on("click", callbackFunc);

			housingTag.append(buttonGroup1);
		}

	}; // --- RenderFriendshipButtons

	// --- input:
	//            callbackFunc - function called on click event
	var	BuildCompanySingleBlock = function(item, i, arr, callbackFunc)
	{
		var 	divContainer, divRow, divColLogo, tagA3, tagImg3, divInfo, tagA5, spanSMButton, tagCanvas3, tagUl5;
		var		tagButtonFriend1;
		var		tagButtonFriend2;
		var		divRowXSButtons, divColXSButtons;

		divContainer= $("<div/>").addClass("container");
		divRow 		= $("<div/>").addClass("row container");
		divColLogo 	= $("<div/>").addClass("col-lg-1 col-md-1 col-sm-2 hidden-xs margin_top_bottom_15_0");
		tagA3   	= $("<a>").attr("href", "/company/" + item.link + "?rand=" + Math.random() * 1234567890);
		// tagImg3 	= $("<img>").attr("src", item["avatar"])
		//                         .attr("height", "80");
		tagCanvas3	= $("<canvas>").attr("width", "80")
									.attr("height", "80")
									.addClass("canvas-big-logo");
		divInfo 		= $("<div/>").addClass("col-sm-10 col-xs-12 single_block box-shadow--6dp");
		tagA5   		= $("<a>").attr("href", "/company/" + item.link + "?rand=" + Math.random() * 1234567890);
		spanSMButton	= $("<span>").addClass("hidden-xs pull-right");
		divRowXSButtons = $("<div>").addClass("row");
		divColXSButtons = $("<div>").addClass("col-xs-12 visible-xs-inline margin_top_bottom_0_15");

		RenderCompanyManagementButton(item, spanSMButton, callbackFunc);
		RenderCompanyManagementButton(item, divColXSButtons, callbackFunc);

		divContainer.append(divRow)
					.append(divRowXSButtons.append(divColXSButtons));
		divRow 		.append(divColLogo)
				    .append(divInfo);
		divColLogo	.append(tagA3);
		tagA3		.append(tagImg3);
		tagA3		.append(tagCanvas3);
		divInfo		.append(spanSMButton);
		divInfo		.append(tagA5);
		tagA5		.append("<span><h4>" + item.name + "</h4></span>");
		// --- OOO Cisco Systems vs Cisco Systems
		// tagA5		.append("<span><h4>" + item.type + " " + item.name + "</h4></span>");

		RenderCompanyLogo(tagCanvas3[0].getContext("2d"), (item.logo_filename.length ? "/images/companies/" + item.logo_folder + "/" + item.logo_filename : ""), item.name, "");

		return divContainer;
	};

	// --- input:
	//            callbackFunc - function called on click event
	var	BuildEventSingleBlock = function(item, i, arr, callbackFunc)
	{
		var		container, divRow, divColLogo, tagCanvasLink, tagImg3, divInfo, tagA5, spanSMButton, tagCanvas3, tagUl5;
		var		tagButtonFriend1;
		var		tagButtonFriend2;
		var		divRowXSButtons, divColXSButtons;

		container	= $("");
		divRow		= $("<div/>").addClass("row");
		divColLogo	= $("<div/>").addClass("col-lg-1 col-md-1 col-sm-2 col-xs-3 margin_top_15 form-group");
		tagCanvasLink		= $("<a>").attr("href", "/event/" + item.link + "?rand=" + GetUUID());
		// tagImg3 	= $("<img>").attr("src", item["avatar"])
		//                         .attr("height", "80");
		tagCanvas3	= $("<canvas>").attr("width", "80")
									.attr("height", "80")
									.addClass("canvas-big-logo");
		divInfo 		= $("<div/>").addClass("col-sm-10 col-xs-8 single_block box-shadow--6dp");
		tagA5   		= $("<a>").attr("href", "/event/" + item.link + "?rand=" + GetUUID());
		spanSMButton	= $("<span>").addClass("hidden-xs pull-right form-group");
		divRowXSButtons = $("<div>").addClass("row");
		divColXSButtons = $("<div>").addClass("col-xs-12 visible-xs-inline form-group");

		if(typeof(callbackFunc) == "function")
		{
			RenderEventManagementButton(item, spanSMButton, callbackFunc);
			RenderEventManagementButton(item, divColXSButtons, callbackFunc);
		}

		container = container	.add(divRow)
								.add(divRowXSButtons.append(divColXSButtons));
		divRow 		.append(divColLogo)
				    .append(divInfo);
		divColLogo	.append(tagCanvasLink);
		// tagCanvasLink.append(tagImg3);
		
		if(item.isBlocked == "Y")
		{
			var		fa_stack_lock = $("<span>")	.addClass("fa-stack fa-lg")
												.append($("<i>").addClass("fa fa-circle-o fa-stack-2x fa-inverse"))
												.append($("<i>").addClass("fa fa-lock fa-stack-1x fa-inverse"));

			tagCanvasLink.append(
				$("<div>")	.addClass("blockedevent") 
							.append(tagCanvas3)
							.append($("<div>").append(fa_stack_lock))
			);
		}
		else
		{
			tagCanvasLink.append(tagCanvas3);
		}

		divInfo
					.append("<p></p>")
					.append(spanSMButton)
					.append(tagA5)
					.append("<div class=\"form-group\">" + item.address + "</div>");
		tagA5		.append("<span class=\"h4\">" + item.title + " <small> " + GetLocalizedDateTimeFromSeconds(item.startTimestamp) + "</small></span> ");

		RenderCompanyLogo(tagCanvas3[0].getContext("2d"), (item.logo_filename.length ? "/images/events/" + item.logo_folder + "/" + item.logo_filename : ""), item.title, "");

		return container;
	};


	// --- input:
	//            callbackFunc - function called on click event
	var	BuildGroupSingleBlock = function(item, i, arr, callbackFunc)
	{
		var 	divContainer, divRow, divColLogo, tagA3, tagImg3, divInfo, tagA5, spanSMButton, tagCanvas3, tagUl5;
		var		tagButtonFriend1;
		var		tagButtonFriend2;
		var		divRowXSButtons, divColXSButtons;

		divContainer= $("<div/>").addClass("container");
		divRow 		= $("<div/>").addClass("row");
		divColLogo 	= $("<div/>").addClass("col-lg-1 col-md-1 col-sm-2 hidden-xs margin_top_bottom_15_0");
		tagA3   	= $("<a>").attr("href", "/group/" + item.link + "?rand=" + GetUUID());
		// tagImg3 	= $("<img>").attr("src", item["avatar"])
		//                         .attr("height", "80");
		tagCanvas3	= $("<canvas>").attr("width", "80")
									.attr("height", "80")
									.addClass("canvas-big-logo");
		divInfo 		= $("<div/>").addClass("col-sm-10 col-xs-12 single_block box-shadow--6dp");
		tagA5   		= $("<a>").attr("href", "/group/" + item.link + "?rand=" + GetUUID());
		spanSMButton	= $("<span>").addClass("hidden-xs pull-right");
		divRowXSButtons = $("<div>").addClass("row");
		divColXSButtons = $("<div>").addClass("col-xs-12 visible-xs-inline margin_top_bottom_0_15");

		RenderGroupManagementButton(item, spanSMButton, callbackFunc);
		RenderGroupManagementButton(item, divColXSButtons, callbackFunc);

		divContainer.append(divRow)
					.append(divRowXSButtons.append(divColXSButtons));
		divRow 		.append(divColLogo)
				    .append(divInfo);
		divColLogo	.append(tagA3);
		tagA3		.append(tagImg3);
		tagA3		.append(tagCanvas3);
		divInfo		.append(spanSMButton);
		divInfo		.append(tagA5);
		tagA5		.append("<span><h4>" + item.title + "</h4></span>");

		RenderCompanyLogo(tagCanvas3[0].getContext("2d"), (item.logo_filename.length ? "/images/groups/" + item.logo_folder + "/" + item.logo_filename : ""), item.title, "");

		return divContainer;
	};

	// --- build "friendship" buttons and put them into DOM-model
	// --- input
	// ---		friendInfo - info from GetUserListInJSONFormat
	// ---		housingTag - tag where buttons have to be placed to
	var RenderFriendshipButtons = function(friendInfo, housingTag)
	{
		// if(isUserSignedin())
		{
			var		tagButtonFriend1, tagButtonFriend2;

			tagButtonFriend1 = $("<button/>").data("action", "");
			tagButtonFriend2 = $("<button/>").data("action", "");
			Object.keys(friendInfo).forEach(function(itemChild, i, arr) {
				tagButtonFriend1.data(itemChild, friendInfo[itemChild]);
				tagButtonFriend2.data(itemChild, friendInfo[itemChild]);
			});
			if(friendInfo.userFriendship == "empty") 
			{ 
				tagButtonFriend1.append("<span class=\"fa fa-plus\">") 
								.removeClass()
								.addClass("btn btn-primary float_right friendshipButton")
								.data("action", "confirm");
								// .data("action", "requested");
			}
			else if(friendInfo.userFriendship == "confirmed") 
			{ 
				tagButtonFriend1.addClass("btn btn-default float_right friendshipButton")
								.append("<span class=\"fa fa-times\">")
								.data("action", "disconnectDialog");
			}
			else if(friendInfo.userFriendship == "requested") 
			{ 
				tagButtonFriend1.addClass("btn btn-primary friendshipButton")
								.append("Подтвердить")
								.data("action", "confirm");
				tagButtonFriend2.addClass("btn btn-default friendshipButton")
								.append("Отказаться")
								.data("action", "disconnect");
			}
			else if(friendInfo.userFriendship == "requesting") 
			{ 
				tagButtonFriend1.append("Отменить запрос дружбы")
								.removeClass()
								.addClass("btn btn-default form-control friendshipButton")
								.data("action", "disconnect");
			}
			else if(friendInfo.userFriendship == "blocked") 
			{ 
				tagButtonFriend1.addClass("btn btn-default form-control friendshipButton")
								.append("Снять блокировку")
								.data("action", "disconnect");
			}
			else if(friendInfo.userFriendship == "ignored") 
			{ 
				tagButtonFriend1.addClass("btn btn-default form-control friendshipButton")
								.append("Игнорируется")
								.data("action", "requested");
			}
			else
			{ 
				tagButtonFriend1.addClass("btn btn-primary form-control friendshipButton")
								.append("Добавить в друзья")
								.data("action", "requested");
				console.error("BuildFoundFriendSingleBlock: ERROR: unknown friendship status [" + item.userFriendship + "]");
			}

			tagButtonFriend1.on("click", FriendshipButtonClickHandler);
			tagButtonFriend2.on("click", FriendshipButtonClickHandler);

			housingTag.append(tagButtonFriend1);
			if(tagButtonFriend2.data("action").length > 0)
			{
				housingTag.append(" ")
						.append(tagButtonFriend2);
			}
		}

	}; // --- RenderFriendshipButtons

	var FriendshipButtonClickHandler = function(e) 
	{
		var		handlerButton = $(this);

		if(handlerButton.data("action") == "disconnectDialog")
		{
			$("#ButtonFriendshipRemovalYes").data("clickedButton", handlerButton);
			$("#DialogFriendshipRemovalYesNo").modal("show");
		}
		else
		{
			handlerButton.addClass("disabled");
			handlerButton.text("Ожидайте ...");

			$.getJSON(
				"/cgi-bin/index.cgi",
				{action:"AJAX_setFindFriend_FriendshipStatus", friendID:handlerButton.data("id"), status:handlerButton.data("action")})
				.done(function(data) {
						console.debug("AJAX_setFindFriend_FriendshipStatus.done(): success");

						if(data.result == "success")
						{
							console.debug("AJAX_setFindFriend_FriendshipStatus.done(): success");

							handlerButton.removeClass("disabled");
							if(handlerButton.data("action") == "requested")
							{
								handlerButton.text("Отменить запрос дружбы");
								handlerButton.removeClass().addClass("btn").addClass("btn-default");
								handlerButton.data("action", "disconnect");
							}
							else if(handlerButton.data("action") == "requesting")
							{
								handlerButton.text("Добавить в друзья");
								handlerButton.removeClass().addClass("btn").addClass("btn-primary");
								handlerButton.data("action", "requested");
							}
							else if(handlerButton.data("action") == "disconnect")
							{
								handlerButton.text("Добавить в друзья");
								handlerButton.removeClass().addClass("btn").addClass("btn-primary");
								handlerButton.data("action", "confirm");

								// --- remove "accept" buttonAccept
								handlerButton.siblings().remove();
							}
							else if(handlerButton.data("action") == "confirm")
							{
								handlerButton.text("Убрать из друзей");
								handlerButton.removeClass().addClass("btn").addClass("btn-default");
								handlerButton.data("action", "disconnect");

								// --- remove "reject" buttonAccept
								handlerButton.siblings().remove();
							}
							else
							{
								console.debug("AJAX_setFindFriend_FriendshipStatus.done(): unknown friendship status button");
								handlerButton.text("Добавить в друзья");
								handlerButton.removeClass().addClass("btn").addClass("btn-primary");
								handlerButton.data("action", "requested");
							}
								
							
						}
						else
						{
							console.debug("AJAX_setFindFriend_FriendshipStatus.done(): " + data.result + " [" + data.description + "]");

							handlerButton.text("Ошибка");
							handlerButton.removeClass("btn-default")
										 .removeClass("btn-primary")
										 .addClass("btn-danger", 300);
							
							console.debug("AJAX_setFindFriend_FriendshipStatus.done(): need to notify the Requester");
						}

					}); // --- getJSON.done()
		}
	}; 

	// --- private function
	// --- build "chat" buttons and put them into DOM-model
	// --- input
	// ---		friendInfo - info from GetUserListInJSONFormat
	// ---		housingTag - tag where buttons have to be placed to
	var RenderChatButton = function(friendInfo, housingTag)
	{
		// var		buttonChat = $("<button>").append($("<img>").attr("src", "/images/pages/common/chat.png").addClass("width_18"))
		var		buttonChat = $("<button>").append($("<span>").addClass("fa fa-comment-o fa-lg width_18"))
											.addClass("btn btn-primary");

		Object.keys(friendInfo).forEach(function(itemChild, i, arr) {
			buttonChat.data(itemChild, friendInfo[itemChild]);
		});

		buttonChat.on("click", function() {
			window.location.href = "/chat/" + $(this).data("id") + "?rand=" + Math.floor(Math.random() * 1000000000);
		});

		housingTag.append(buttonChat);
	};

	var GlobalBuildFoundFriendSingleBlock = function(item, i, arr)
	{
		var 	tagDiv1, tagDiv2, tagDiv3, tagA3, tagImg3, tagDiv4, tagA5, tagSpan5, tagCanvas3, tagCity;
		var		tagButtonFriend1;
		var		tagButtonFriend2;
		var		tagDivButtons;

		tagDiv1 	= $("<div/>").addClass("container");
		tagDiv2 	= $("<div/>").addClass("row");
		tagDiv3 	= $("<div/>").addClass("col-lg-1 col-md-1 col-sm-2 col-xs-3 ");
		tagA3   	= $("<a>").attr("href", "/userprofile/" + item.id + "?rand=" + Math.random() * 234567890);
		// tagImg3 	= $("<img>").attr("src", item["avatar"])
		//                         .attr("height", "80");
		tagCanvas3	= $("<canvas>").attr("width", "80")
									.attr("height", "80")
									.addClass("canvas-big-avatar " + (item.avatar.search("avatar") >= 0 ? "box-shadow--6dp " : ""));
		tagDiv4 	= $("<div/>").addClass("col-md-10 col-xs-8 single_block box-shadow--6dp padding_top_bottom_5px");
		tagA5   	= $("<a>").attr("href", "/userprofile/" + item.id + "?rand=" + Math.random() * 234567890);
		tagSpan5	= $("<span>").addClass("hidden-xs float_right");
		tagCity		= item.currentCity || "&nbsp;";
		tagDivButtons = $("<div>").addClass("col-xs-9 visible-xs-inline ");
		// --- friendship buttons
		RenderFriendshipButtons(item, tagSpan5);
		RenderFriendshipButtons(item, tagDivButtons);
/*
		RenderChatButton(item, tagSpan5);
		RenderChatButton(item, tagDivButtons);
*/
		tagDiv1.append(tagDiv2);
		tagDiv2 .append(tagDiv3)
				.append(tagDivButtons) // --- friendship button
			    .append(tagDiv4);
		tagDiv3.append(tagA3);
		tagA3.append(tagImg3);
		tagA3.append(tagCanvas3);
		tagDiv4.append(tagSpan5); // --- friendship button
		tagDiv4.append(tagA5);
		tagA5.append("<span><h4>" + item.name + " " + item.nameLast + "</h4></span>");

		tagDiv4.append(tagCity);

/*
		item.currentEmployment.forEach(function(item) 
			{
				tagUl5.append("<dt>" + item.company + "</dt>");
				tagUl5.append("<dd>" + item.title + "</dd>");
			});
*/
		DrawUserAvatar(tagCanvas3[0].getContext("2d"), item.avatar, item.name, item.nameLast);

		return tagDiv1;
	};

	var DrawCompanyImage = function(context, imageURL, avatarSize)
	{

		var x1 = 0, x2 = avatarSize, y1 = 0, y2 = avatarSize, radius = avatarSize / 8;
		var		pic = new Image();

		pic.onload = function() { 
			// var		sMaxEdge = Math.max(pic.width, pic.height);
			// var		sX = (pic.width - sMaxEdge) / 2, sY = (pic.height - sMaxEdge) / 2, sWidth = sMaxEdge, sHeight = sMaxEdge;
			// var		dX = 0, dY = 0, dWidth = avatarSize, dHeight = avatarSize;

			var		canvasW = avatarSize, canvasH = avatarSize;
			var		sWidth = pic.width, sHeight = pic.height;
			var		ratioW = canvasW/sWidth, ratioH = canvasH/sHeight;
			var		minRatio = Math.min(ratioW, ratioH);
			var		dWidth = sWidth*minRatio, dHeight = sHeight*minRatio;
			var		dX = (canvasW - dWidth)/2, dY = (canvasH - dHeight)/2;

			context.clearRect(0,0,avatarSize,avatarSize);
			// context.save();
			context.beginPath();
			context.moveTo(radius, 0);
			context.lineTo(x2 - radius, 0);
			context.quadraticCurveTo(x2,0, x2,radius);
			context.lineTo(x2, y2 - radius);
			context.quadraticCurveTo(x2,y2, x2-radius,y2);
			context.lineTo(radius, y2);
			context.quadraticCurveTo(0,y2, 0,y2-radius);
			context.lineTo(0, radius);
			context.quadraticCurveTo(0,0, radius,0);

			context.drawImage(pic, 0, 0, sWidth, sHeight, dX, dY, dWidth, dHeight);
			// context.restore();
		};
		pic.src = imageURL;
	};

	var RenderCompanyLogo = function(canvas, logoPath, userName, userNameLast)
	{

		if((logoPath == "empty") || (logoPath === ""))
		{
			// --- canvas.canvas.width returning width of canvas
			DrawTextLogo(canvas, GetUserInitials(userName, userNameLast), canvas.canvas.width);
		}
		else
		{
			DrawCompanyImage(canvas, logoPath, canvas.canvas.width);
		}
	};
	// --- avatar part end

	// --- rating rendering
	// --- input: 
	// ---			additionalClass - could be used to find all ratings for the same entity 
	// ---			initValue - currently selected element
	// ---			callBack - function to call after change rating
	// --- output: DOMmodel
	var	RenderRating = function(additionalClass, initValue, callbackFunc)
	{
		var		RatingSelectionItem = function(e)
		{
			var		currTag = $(this);
			var		currRating = currTag.data("rating");

			callbackFunc(currRating);
		};

		var		uniqueID = "";

		do
		{
			uniqueID = Math.floor(Math.random() * 100000000);
		} while($("div#rating" + uniqueID).length);


		var		bookRating = $("<div>").addClass("rating")
									.addClass(additionalClass)
									.attr("id", "rating" + uniqueID);
		var		star5 = $("<input>").attr("type", "radio")
									.attr("id", "rating_5_" + uniqueID)
									.attr("data-rating", "5")
									.on("click", RatingSelectionItem)
									.attr("name", "rating" + uniqueID);
		var		star4 = $("<input>").attr("type", "radio")
									.attr("id", "rating_4_" + uniqueID)
									.attr("data-rating", "4")
									.on("click", RatingSelectionItem)
									.attr("name", "rating" + uniqueID);
		var		star3 = $("<input>").attr("type", "radio")
									.attr("id", "rating_3_" + uniqueID)
									.attr("data-rating", "3")
									.on("click", RatingSelectionItem)
									.attr("name", "rating" + uniqueID);
		var		star2 = $("<input>").attr("type", "radio")
									.attr("id", "rating_2_" + uniqueID)
									.attr("data-rating", "2")
									.on("click", RatingSelectionItem)
									.attr("name", "rating" + uniqueID);
		var		star1 = $("<input>").attr("type", "radio")
									.attr("id", "rating_1_" + uniqueID)
									.attr("data-rating", "1")
									.on("click", RatingSelectionItem)
									.attr("name", "rating" + uniqueID);
		var		label5 = $("<label>").attr("for", "rating_5_" + uniqueID)
									.attr("title", "супер !")
									.tooltip({ animation: "animated bounceIn", placement: "top" });
		var		label4 = $("<label>").attr("for", "rating_4_" + uniqueID);
		var		label3 = $("<label>").attr("for", "rating_3_" + uniqueID);
		var		label2 = $("<label>").attr("for", "rating_2_" + uniqueID);
		var		label1 = $("<label>").attr("for", "rating_1_" + uniqueID)
									.attr("title", "не понравилось")
									.tooltip({ animation: "animated bounceIn", placement: "top" });


		bookRating	.append(star5).append(label5)
					.append(star4).append(label4)
					.append(star3).append(label3)
					.append(star2).append(label2)
					.append(star1).append(label1);

		if(initValue == 1) star1.attr("checked", true);
		if(initValue == 2) star2.attr("checked", true);
		if(initValue == 3) star3.attr("checked", true);
		if(initValue == 4) star4.attr("checked", true);
		if(initValue == 5) star5.attr("checked", true);

		return bookRating;
	};

	var	UpdateInputFieldOnServer = function(e)
	{
		var		__Revert_To_Prev_Value = function()
		{
			var	input_tag; 
			
			if(curr_tag.attr("type") == "checkbox")
			{
				curr_tag.prop("checked", curr_tag.attr("data-db_value") == "Y" ? "checked" : "");
			}
			else if(curr_tag[0].tagName == "LABEL")
			{
				input_tag = $("#" + curr_tag.attr("for"));
				input_tag.prop("checked", !input_tag.prop("checked"));

			}
			else
			{
				curr_tag.val(curr_tag.attr("data-db_value"));
			}
		};

		var		__GetTagValue = function(__tag)
		{
			var	curr_value = "";
			var	input_tag; 

			if(__tag[0].tagName == "LABEL") 
			{
				__tag = $("#" + __tag.attr("for"));
				curr_value = __tag.prop("checked") ? "N" : "Y"; // --- avoid using click_handler on LABEL, replace it to change_handler of input
																// --- label doesn't immediately update related input value,
																// --- therefore click on a label with associated checkbox in OFF state
																// --- should trigger update on server to a new (ON) state
			}
			else if(__tag.attr("type") == "checkbox")
			{
				curr_value = __tag.prop("checked") ? "Y" : "N";
			}
			else
			{
				curr_value = __tag.val();
			}

			return curr_value;
		};

		var		curr_tag;
		var		curr_value;

		if(typeof(e) != "undefined")
		{
			curr_tag = $(e.currentTarget);

			if("" + curr_tag.data("id") == "0")
			{
				// --- nothing to do
				console.error("data-id not defined");
			}
			else
			{
				var		current_script = curr_tag.attr("data-script") || current_script_global;

				if(current_script.length)
				{
					curr_tag.attr("disabled", "");

					curr_value = __GetTagValue(curr_tag);
					
					$.getJSON(
						"/cgi-bin/" + current_script,
						{
							action: curr_tag.data("action"),
							id: curr_tag.attr("data-id") || curr_tag.data("id"), // --- prefer attr(data_id) over jQuery.data(id), because jQuery.data doesn't updates properly
							value: curr_value,
							sow_id: curr_tag.attr("data-sow_id"),
							company_id: curr_tag.attr("data-company_id"),
						})
						.done(function(data)
						{
							if(data.result == "success")
							{
								// don't change it to .click(), otherwise it may be infinite loop if error
								curr_tag.attr("data-db_value", curr_tag.val());
							}
							else
							{
								__Revert_To_Prev_Value();

								console.error(curr_tag.data("action") + ".done(): ERROR: " + data.description);
								system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
							}
						})
						.fail(function(e)
						{
							__Revert_To_Prev_Value();
							system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
						})
						.always(function(e)
						{
							curr_tag.removeAttr("disabled");
						});
					
				}
				else
				{
					console.error("unknown script to call. Set the script with attr(\"data-script\") or call system_calls.SetCurrentScript(\"XXXXX.cgi\");");
				}
			}
		}
		else
		{
			console.error("undefined parameter type");
		}
	};

	// --- start avatar piece
	var	DrawCompanyLogoAvatar = function(context, imageURL, avatarSize)
	{

		var x1 = 0, x2 = avatarSize, y1 = 0, y2 = avatarSize, radius = avatarSize / 8;
		var		pic = new Image();

		pic.src = imageURL;
		pic.onload = function() { 
			var		sMaxEdge = Math.max(pic.width, pic.height);
			var		scale = sMaxEdge / avatarSize;
			var		dWidth = pic.width / scale;
			var		dHeight = pic.height / scale;

			context.clearRect(0,0,avatarSize,avatarSize);
			context.save();
			context.beginPath();
			// --- company logo should not have rounded corners
	/*
			context.moveTo(radius, 0);
			context.lineTo(x2 - radius, 0);
			context.quadraticCurveTo(x2,0, x2,radius);
			context.lineTo(x2, y2 - radius);
			context.quadraticCurveTo(x2,y2, x2-radius,y2);
			context.lineTo(radius, y2);
			context.quadraticCurveTo(0,y2, 0,y2-radius);
			context.lineTo(0, radius);
			context.quadraticCurveTo(0,0, radius,0);
			context.clip();
	*/
			// context.drawImage(pic, (pic.width - sMaxEdge) / 2, (pic.height - sMaxEdge) / 2, sMaxEdge, sMaxEdge, 0, 0, avatarSize, avatarSize);
			context.drawImage(pic, 0, 0, pic.width, pic.height, (avatarSize - dWidth) / 2, (avatarSize - dHeight) / 2, dWidth, dHeight);
			context.restore();
		};
	};

	var DrawPictureAvatar = function(context, imageURL, avatarSize)
	{

		var x1 = 0, x2 = avatarSize, y1 = 0, y2 = avatarSize, radius = avatarSize / 8;
		var		pic = new Image();

		pic.src = imageURL;
		pic.onload = function() { 
			var		sMinEdge = Math.min(pic.width, pic.height);

/*
			context.clearRect(0,0,avatarSize,avatarSize);

			context.save();
			context.beginPath();
			context.moveTo(radius, 0);
			context.lineTo(x2 - radius, 0);
			context.quadraticCurveTo(x2,0, x2,radius);
			context.lineTo(x2, y2 - radius);
			context.quadraticCurveTo(x2,y2, x2-radius,y2);
			context.lineTo(radius, y2);
			context.quadraticCurveTo(0,y2, 0,y2-radius);
			context.lineTo(0, radius);
			context.quadraticCurveTo(0,0, radius,0);
			context.clip();
*/

			context.clearRect(0, 0, avatarSize, avatarSize);

			context.beginPath();
			context.arc(avatarSize/2,avatarSize/2, avatarSize/2, 0,2*Math.PI);
			context.closePath();
			context.clip();

			context.drawImage(pic, (pic.width - sMinEdge) / 2, (pic.height - sMinEdge) / 2, sMinEdge, sMinEdge, 0, 0, avatarSize, avatarSize);
			context.restore();
		};
	};

	var DrawTextLogo = function(context, userInitials, size)
	{
		var		avatarSize = size;
		
		context.clearRect(0, 0, avatarSize, avatarSize);

		context.beginPath();
		context.rect(0, 0, avatarSize, avatarSize);
		context.closePath();
		context.fillStyle = "grey";
		context.fill();

		context.font = "normal "+avatarSize*3/8+"pt Calibri";
		context.textAlign = "center";
		context.fillStyle = "white";
		context.fillText(userInitials, avatarSize/2,avatarSize*21/32);
	};

	var DrawTextAvatar = function(context, userInitials, size)
	{
		var		avatarSize = size;
		
		context.clearRect(0, 0, avatarSize, avatarSize);

		context.beginPath();
		context.arc(avatarSize/2,avatarSize/2, avatarSize/2, 0,2*Math.PI);
		context.closePath();
		context.fillStyle = "grey";
		context.fill();

		context.font = "normal "+avatarSize*3/8+"pt Calibri";
		context.textAlign = "center";
		context.fillStyle = "white";
		context.fillText(userInitials, avatarSize/2,avatarSize*21/32);
	};

	var GetUserInitials = function(firstName, lastName)
	{
		var	result = "";

		if(typeof(firstName) != "undefined")
		{
			if(firstName.length > 0) { result += firstName[0]; }
		}
		if(typeof(lastName) != "undefined")
		{
			if(lastName.length > 0) { result += lastName[0]; }
		}

		return result;
	};
	// --- finish avatar piece

	var	GetSpelledKidsNumber = function(kidsNumber)
	{
		var		kidsText = "";

		if((typeof(kidsNumber) != "undefined") && kidsNumber)
		{
			if(((kidsNumber % 10) == 1) && (Math.floor(kidsNumber / 10) != 1))
			{
				kidsText += "ребенок";
			}
			else if(((kidsNumber % 10) <= 4) && (Math.floor(kidsNumber / 10) != 1))
			{
				kidsText += "ребенка";
			}
			else
			{
				kidsText += "детей";
			}
		}

		return kidsText;
	};

	var	GetSpelledAdultsNumber = function(adultsNumber)
	{
		var		adultsText = "";

		if((typeof(adultsNumber) != "undefined") && adultsNumber)
		{
			if(adultsNumber == 1) 
			{
				adultsText = " взрослый";
			}
			else
			{
				adultsText = " взрослых";
			}
		}

		return adultsText;
	};

	var GetSpelledAdultsKidsNumber = function(adultsNumber, kidsNumber)
	{
		var		adultsText = GetSpelledAdultsNumber(adultsNumber);
		var		kidsText = GetSpelledKidsNumber(kidsNumber);


		return (adultsNumber  ? " +" + adultsNumber + adultsText : "") + (kidsNumber ? " +" + kidsNumber + " " + kidsText : "");
	};

	var	ReplaceTextLinkToURL = function(srcText)
	{
		// --- url is everything before space or HTML-tag (for example: <br>)
		var		urlRegEx = /(https?:\/\/[^\s<]+)/g;
		var		resultText;

		resultText = srcText.replace(urlRegEx, function(url) {
			var		urlText = url;

			if(url.length > 32) urlText = url.substring(0, 32) + " ...";

			return "<a href=\"" + url + "\" target=\"blank\">" + urlText + "</a>"; 
		});

		return resultText;
	};

	var LongestWord = function(text)
	{
		var	lenghtyWord = "";
		var	lenghtyWordIdx = 0;
		var	wordsArr;

		// --- remove www links
		text = text.replace(/https?:\/\/[^\s<]+/g, "");
		wordsArr = text.match(/[^\s]+/g) || [""];

		wordsArr.forEach(function (item, i, arr) { if(item.length >= lenghtyWord.length) { lenghtyWord = item; lenghtyWordIdx = i; } });

		return wordsArr[lenghtyWordIdx];
	};

	var LongestWordSize = function(text)
	{
		var	lenghtyWord = LongestWord(text);

		return lenghtyWord.length;
	};

	var	DataURItoBlob = function (dataURI) 
	{
		// convert base64/URLEncoded data component to raw binary data held in a string
		var byteString;
		if (dataURI.split(",")[0].indexOf("base64") >= 0)
			byteString = atob(dataURI.split(",")[1]);
		else
			byteString = unescape(dataURI.split(",")[1]);

		// separate out the mime component
		var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

		// write the bytes of the string to a typed array
		var ia = new Uint8Array(byteString.length);
		for (var i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		}

		return new Blob([ia], {type:mimeString});
	};

/*
	var	GetBlob_ScaledDownTo640x480 = function(originalImg)
	{
		var		tmpCanvas = document.createElement("canvas");
		var		tmpCanvasCtx = tmpCanvas.getContext("2d");
		var		imgFromCanvas = new Image();

		tmpCanvas.width = originalImg.naturalWidth;
		tmpCanvas.height = originalImg.naturalHeight;

		tmpCanvasCtx.drawImage(originalImg, 0, 0);

		imgFromCanvas = tmpCanvas.toDataURL("image/jpeg", 0.92);
		return DataURItoBlob(imgFromCanvas);
	};
*/

	// --- this function resizes canvas to keep shape of original picture
	var	DrawImgOnCanvas_ScaleImgDownTo640x480 = function(tmpCanvas, originalImg)
	{
		var		tmpCanvasCtx = tmpCanvas.getContext("2d");
		var		maxWidth = 640, maxHeight = 480;
		var		origWidth = originalImg.naturalWidth, origHeight = originalImg.naturalHeight;
		var		scaleW = maxWidth / origWidth, scaleH = maxHeight / origHeight;
		var		scale = Math.min(scaleW, scaleH);
		var		finalW, finalH;

		if(scale > 1) scale = 1;
		finalH = scale * origHeight;
		finalW = scale * origWidth;

		tmpCanvas.width = finalW;
		tmpCanvas.height = finalH;

		tmpCanvasCtx.drawImage(originalImg, 0, 0, origWidth, origHeight, 0, 0, finalW, finalH);
	};

	var	GetBlob_ScaledDownTo640x480 = function(originalImg)
	{
		var		tmpCanvas = document.createElement("canvas");
		var		imgFromCanvas = new Image();
		
		var		tmpCanvasCtx = tmpCanvas.getContext("2d");
		var		maxWidth = 640, maxHeight = 480;
		var		origWidth = originalImg.naturalWidth, origHeight = originalImg.naturalHeight;
		var		scaleW = maxWidth / origWidth, scaleH = maxHeight / origHeight;
		var		scale = Math.min(scaleW, scaleH);
		var		finalW, finalH;

		if(scale > 1) scale = 1;
		finalH = scale * origHeight;
		finalW = scale * origWidth;

		tmpCanvas.width = finalW;
		tmpCanvas.height = finalH;

		tmpCanvasCtx.drawImage(originalImg, 0, 0, origWidth, origHeight, 0, 0, finalW, finalH);

		imgFromCanvas = tmpCanvas.toDataURL("image/jpeg", 0.92);
		return DataURItoBlob(imgFromCanvas);
	};

	var isValidEmail = function(email)
	{
	    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	    return re.test(String(email).toLowerCase());
	};

	var	isValidURL = function(url_str)
	{
		var		url_should_not_have = /[ ]/;
		var		url_must_have1 = /[.]/;
		var		url_must_have2 = /[\/]/;
		var		result = false;
		
		if(url_should_not_have.exec(url_str))
		{
			// --- URL contains failed characters
		}
		else
		{
			if(url_must_have1.exec(url_str) && url_must_have2.exec(url_str))
			{
				result = true;
			}
			else
			{
				// --- URL doesn't contains mandatory characters
			}
		}

		return result;
	};

	var	isValidHTTPURL = function(url_str)
	{
		var		url_must_have1 = /https?:\/\//;
		var		result = false;
		
		if(isValidURL && url_must_have1.exec(url_str) && (url_str.length > 10))
		{
			result = true;
		}

		return result;
	};



	var ClearSession = function()
	{
		$.removeCookie("sessid");
		// localStorage.removeItem("sessid");

		// --- Back button will not work (prefer method, to avoid hacking)
		// window.location.replace("/?rand=" + Math.random()*98765432123456);

		// --- Like click on the link
		// window.location.href = "/?rand=" + Math.random()*98765432123456;

	};

	return {
		companyTypes: companyTypes,
		eventTypes: eventTypes,
		startTime: startTime,
		Init: Init,
		isUserSignedin: isUserSignedin,
		GetUserRequestNotifications: GetUserRequestNotifications,
		PingDomainName: PingDomainName,
		isTouchBasedUA: isTouchBasedUA,
		CutLongMessages: CutLongMessages,
		RemoveSpaces: RemoveSpaces,
		isOrientationLandscape: isOrientationLandscape,
		isOrientationPortrait: isOrientationPortrait,
		ConvertTextToHTML: ConvertTextToHTML,
		ConvertHTMLToText: ConvertHTMLToText,
		ConvertMonthNameToNumber: ConvertMonthNameToNumber,
		ConvertMonthNumberToAbbrName: ConvertMonthNumberToAbbrName,
		ConvertDateSQLToHuman: ConvertDateSQLToHuman,
		ConvertDateRussiaToHuman: ConvertDateRussiaToHuman,
		ConvertDateRussiaToHumanWithoutYear: ConvertDateRussiaToHumanWithoutYear,
		ConvertDateRussiaToHumanFullMonth: ConvertDateRussiaToHumanFullMonth,
		FilterUnsupportedUTF8Symbols: FilterUnsupportedUTF8Symbols,
		GetLocalizedWorkDurationFromDelta: GetLocalizedWorkDurationFromDelta,
		GetLocalizedDateFromSeconds: GetLocalizedDateFromSeconds,
		GetFormattedDateFromSeconds: GetFormattedDateFromSeconds,
		GetLocalizedDateNoTimeFromSeconds: GetLocalizedDateNoTimeFromSeconds,
		GetLocalizedDateFromDelta: GetLocalizedDateFromDelta,
		GetLocalizedDateInHumanFormatSecSince1970:GetLocalizedDateInHumanFormatSecSince1970,
		GetLocalizedDateInHumanFormatMsecSinceEvent:GetLocalizedDateInHumanFormatMsecSinceEvent,
		GetLocalizedRUFormatDateNoTimeFromSeconds: GetLocalizedRUFormatDateNoTimeFromSeconds,
		GetYearsSpelling: GetYearsSpelling,
		GetGenderedPhrase: GetGenderedPhrase,
		GetGenderedActionCategoryTitle: GetGenderedActionCategoryTitle,
		GetGenderedActionTypeTitle: GetGenderedActionTypeTitle,
		GetSQLFormatedDateNoTimeFromSeconds: GetSQLFormatedDateNoTimeFromSeconds,
		GetSpelledAdultsKidsNumber: GetSpelledAdultsKidsNumber,
		GetSpelledKidsNumber: GetSpelledKidsNumber,
		GetSpelledAdultsNumber: GetSpelledAdultsNumber,
		BuildCompanySingleBlock: BuildCompanySingleBlock,
		BuildEventSingleBlock: BuildEventSingleBlock,
		BuildGroupSingleBlock: BuildGroupSingleBlock,
		GlobalBuildFoundFriendSingleBlock: GlobalBuildFoundFriendSingleBlock,
		RenderFriendshipButtons: RenderFriendshipButtons,
		PrebuiltInitValue: PrebuiltInitValue,
		amIMeetingHost: amIMeetingHost,
		ScrollWindowToElementID: ScrollWindowToElementID,
		GetParamFromURL: GetParamFromURL,
		UpdateInputFieldOnServer: UpdateInputFieldOnServer,
		RenderCompanyLogo: RenderCompanyLogo,
		GetIntoPublicZone: GetIntoPublicZone,
		GetUUID: GetUUID,
		GetMinutesSpelling: GetMinutesSpelling,
		GetHoursSpelling: GetHoursSpelling,
		GetDaysSpelling: GetDaysSpelling,
		GetMonthsSpelling: GetMonthsSpelling,
		PopoverError: PopoverError,
		PopoverInfo:  PopoverInfo,
		AlertError: AlertError,
		RenderRating: RenderRating,
		DrawCompanyLogoAvatar: DrawCompanyLogoAvatar,
		DrawPictureAvatar: DrawPictureAvatar,
		DrawTextLogo: DrawTextLogo,
		DrawTextAvatar: DrawTextAvatar,
		GetUserInitials: GetUserInitials,
		ReplaceTextLinkToURL: ReplaceTextLinkToURL,
		LongestWordSize: LongestWordSize,
		LongestWord: LongestWord,
		DataURItoBlob: DataURItoBlob,
		GetBlob_ScaledDownTo640x480: GetBlob_ScaledDownTo640x480,
		DrawImgOnCanvas_ScaleImgDownTo640x480: DrawImgOnCanvas_ScaleImgDownTo640x480,
		isValidEmail: isValidEmail,
		isValidURL: isValidURL,
		isValidHTTPURL: isValidHTTPURL,
		ClearSession: ClearSession
	};
}
)();

// --- use cache carefully !
// --- cache is not updating edit_profile user_changes 
var userCache = (function()
{
	"use strict";
	var		cache = []; // --- main storage
	var		userCacheFutureUpdateArr = []; // --- used for update userCache object with new users
	var		callbackRunAfterUpdateArr = []; 
	var		runLock = false; // --- semaphore for racing conditions

	var		UpdateWithUser = function(userObj)
	{
		var		updatedFlag = false;
		
		cache.forEach(function(item, i, arr)
			{
				if(cache[i].id == userObj.id)
				{
					cache[i] = item;
					updatedFlag = true;
				}
			});

		if(!updatedFlag) cache.push(userObj);
	};

	var		GetUserByID = function(userID)
	{
		var		result = {};

		cache.forEach(function(item, i, arr)
			{
				if(item.id == userID)
				{
					result = item;
				}
			});

		return result;
	};

	var		isUserCached = function(userID)
	{
		var		result = false;

		cache.forEach(function(item, i, arr)
			{
				if(item.id == userID)
				{
					result = true;
				}
			});

		return result;
	};

	var 	AddUserIDForFutureUpdate = function(userID)
	{
		userCacheFutureUpdateArr.push(userID);
	};

	var		AddCallbackRunsAfterCacheUpdate = function(func)
	{
		var		updateFlag = true;

		// --- add callback function just in case userscache not empty
		// --- otherwise there is no value to run callback without any changes
		if(userCacheFutureUpdateArr.length)
		{
			callbackRunAfterUpdateArr.forEach(function(item)
			{
				if(item == func) updateFlag = false;
			});

			if(updateFlag) callbackRunAfterUpdateArr.push(func);
		}
	};

	var		RequestServerToUpdateCache = function()
	{
		if(!runLock)
		{
			runLock = true; // --- lock-on, otherwise callbacklist will be cleared.

			// --- following two lines trying to speedup operations with userCacheUpdateArr 
			// --- to reduce probability of racing conditions
			var		param1 = userCacheFutureUpdateArr.join();
			userCacheFutureUpdateArr = []; 	// --- avoid repeating requests to server

			if(param1.length)
			{
				$.getJSON("/cgi-bin/system.cgi", { action: "GetUserInfo", userID: param1 })
					.done(
						function(result)
						{
							if((result.session == "true") && (result.user == "true") && (result.type == "UserInfo"))
							{
								result.userArray.forEach(function(item, i, arr)
								{
									UpdateWithUser(item);
								});

								callbackRunAfterUpdateArr.forEach(function(item, i, arr)
								{
									item();
								});
								callbackRunAfterUpdateArr = []; // --- safety measures to avoid repeated calling callback functions

							}

							runLock = false;
						});	
			}
			else
			{
				callbackRunAfterUpdateArr.forEach(function(item, i, arr)
				{
					item();
				});
				callbackRunAfterUpdateArr = []; // --- safety measures to avoid repeated calling callback functions
				runLock = false;
			} // --- if userCacheFutureUpdateArr not empty
		} // --- run lock
	};

	return {
		// cache: cache,
		UpdateWithUser: UpdateWithUser,
		GetUserByID: GetUserByID,
		isUserCached: isUserCached,
		AddUserIDForFutureUpdate: AddUserIDForFutureUpdate,
		AddCallbackRunsAfterCacheUpdate: AddCallbackRunsAfterCacheUpdate,
		RequestServerToUpdateCache: RequestServerToUpdateCache
	};
})();

var DrawUserAvatar = function(canvas, avatarPath, userName, userNameLast)
{
	"use strict";

	if((typeof(avatarPath) == "undefined") || (avatarPath == "empty") || (avatarPath === ""))
	{
		// --- canvas.canvas.width returning width of canvas
		system_calls.DrawTextAvatar(canvas, system_calls.GetUserInitials(userName, userNameLast), canvas.canvas.width);
	}
	else
	{
		system_calls.DrawPictureAvatar(canvas, avatarPath, canvas.canvas.width);
	}
};

// --- difference from user:
// --- user avatar - fit into quad with shortest side (crop other dimension)
// --- company log - fit into quad with longest side (no crop)
// --- INPUT:
//            usually userNameLast = ""
var DrawCompanyAvatar = function(canvas, avatarPath, userName, userNameLast)
{
	"use strict";

	if((avatarPath == "empty") || (avatarPath === ""))
	{
		// --- canvas.canvas.width returning width of canvas
		system_calls.DrawTextLogo(canvas, system_calls.GetUserInitials(userName, userNameLast), canvas.canvas.width);
	}
	else
	{
		system_calls.DrawCompanyLogoAvatar(canvas, avatarPath, canvas.canvas.width);
	}
};
// --- avatar part end

navMenu_search = (function() 
{
	"use strict";

	var AutocompleteList = [];

	var	AutocompleteSelectHandler = function(event, ui)
	{
		var	selectedID = ui.item.id;
		var selectedLabel = ui.item.label;

		window.location.href = "/userprofile/" + selectedID;
	};

	var OnKeyupHandler = function(event)
	{
		/* Act on the event */
		var	keyPressed = event.keyCode;

		console.debug("navMenu_search.OnKeyupHandler: start. Pressed key [" + keyPressed + "]");

		if(keyPressed == 13) {
			/*Enter pressed*/
			$("#navMenuSearchText").autocomplete("close");
			// FindFriendsFormSubmitHandler();
		}
	};

	var OnSubmitClickHandler = function(event)
	{
		var		searchText = $("#navMenuSearchText").val();

		if(searchText.length <= 2)
		{
			$("#navMenuSearchText").attr("title", "Напишите более 2 букв")
									.attr("data-placement", "bottom")
									.tooltip("show");
			window.setTimeout(function()
				{
					$("#navMenuSearchText").tooltip("destroy");
				}, 3000);
			return false;
		}
	};

	return {
		OnKeyupHandler: OnKeyupHandler,
		OnSubmitClickHandler: OnSubmitClickHandler,
		AutocompleteSelectHandler: AutocompleteSelectHandler,
	};
}
)();

navMenu_chat = (function()
{
	"use strict";

	var	chatUserList;
	var	userArray = [];
	var	unreadMessagesArray = [];

	var	UnreadMessageButtonClickHandler = function()
	{
	};

	var	GetUserInfoByID = function(messageID)
	{

	};

	var CutLongMultilineMessages = function(message)
	{
		var		lineList;
		var		cutMessage = [];
		
		lineList = message;
		lineList = lineList.replace(/\&ishort\;/g, "й");
		lineList = lineList.replace(/\&euml\;/g, "ё");
		lineList = lineList.replace(/\&zsimple\;/g, "з");
		lineList = lineList.replace(/\&Ishort\;/g, "Й");
		lineList = lineList.replace(/\&Euml\;/g, "Ё");
		lineList = lineList.replace(/\&Zsimple\;/g, "З");
		lineList = lineList.replace(/\&Norder;\;/g, "№");
		lineList = lineList.replace(/<br>/g, "\n").replace(/\r/g, "").split("\n");

		lineList.forEach(function(item, i, arr)
			{
				if(i < 3) 
				{
					cutMessage.push(item.substr(0,45) + (item.length > 45 ? " ..." : ""));
				}
			});
		if(lineList.length > 3)
		{
			cutMessage.push("...");
		}

		return cutMessage.join("<br>");
	};
	
	var	BuildUnreadMessageList = function()
	{

		var		resultDOM = $();
		var		messageCounter = 0;


		if(!unreadMessagesArray.length)
		{
			$("#user-chat-ul").empty();
		}
		unreadMessagesArray.forEach(
			function(item, i, arr)
			{
				if(i < 5)
				{

					var		messageInfo = item;
					var		userInfo = jQuery.grep(userArray, function(n, i) { return (n.id == messageInfo.fromID); });
							userInfo = userInfo[0];
					var		userSpan = $("<div/>").addClass("UnreadChatListSpan");
					var		buttonSpan = $("<span/>").addClass("UnreadChatListButtonSpan");
					var		liUser = $("<li/>").addClass("dropdown-menu-li-higher")
												.addClass(messageInfo.messageStatus);
					var		liDivider = $("<li/>").addClass("divider");
					var		buttonReply = $("<button>")	.addClass("btn btn-link")
														.append($("<span>").addClass("glyphicon glyphicon-pencil"))
														.data("action", "reply")
														.on("click", function(e) 
															{
																var		newURL =  "/chat/" + messageInfo.fromID + "?rand=" + Math.random()*98765432123456;
																window.location.href = newURL;
																e.stopPropagation(); 
															});
					var		buttonClose = $("<button>")	.addClass("btn btn-link")
														.append($("<span>").addClass("glyphicon glyphicon-remove"))
														.data("action", "markAsRead")
														.on("click", function(e) 
															{
																$.getJSON("/cgi-bin/index.cgi", {action:"AJAX_chatMarkMessageReadByMessageID", messageid:messageInfo.id})
																			.done(function(data) 
																				{
																					if(data.result == "success")
																					{
																						GetUserChatMessages();
																					}
																					else
																					{
																						console.error("AJAX_chatMarkMessageReadByMessageID: ERROR: " + data.description);
																					}
																				});

																e.stopPropagation(); 
															});
					var		canvasAvatar = $("<canvas/>")	.attr("width", "30")
															.attr("height", "30")
															.addClass("canvas-big-avatar")
															.addClass("UnreadChatListOverrideCanvasSize");
					var		messageBody = $("<div>").addClass("UnreadChatListMessage")
														.on("click", function(e) 
															{ 
																window.location.href = "/chat/" + messageInfo.fromID + "?rand=" + Math.random()*98765432123456; 
																e.stopPropagation();
															});

					messageCounter++;

					Object.keys(messageInfo).forEach(function(itemChild, i, arr) {
						buttonClose.data(itemChild, messageInfo[itemChild]);
						buttonReply.data(itemChild, messageInfo[itemChild]);
					});

					buttonClose.on("click", UnreadMessageButtonClickHandler);
					buttonReply.on("click", UnreadMessageButtonClickHandler);

					resultDOM = resultDOM.add(liUser);

					var hrefTemp = $("<a/>").attr("href", "/userprofile/" + userInfo.id)
							.addClass("UnreadChatListHrefLineHeigh")
							.append(system_calls.CutLongMessages(userInfo.name + " " + userInfo.nameLast, 19));
					userSpan.append(canvasAvatar)
							.append(hrefTemp)
							.append(buttonSpan);
					buttonSpan
							.append(buttonReply)
							.append(" ")
							.append(buttonClose);

					messageBody.append((item.messageType == "text" ? CutLongMultilineMessages(item.message) : "<i>Вам прислали картинку</i>"));

					DrawUserAvatar(canvasAvatar[0].getContext("2d"), userInfo.avatar, userInfo.name, userInfo.nameLast);

					liUser	.append(userSpan)
							.append($("<br/>"))
							.append($("<br/>"))
							.append(messageBody);

					if((messageCounter < arr.length) && (messageCounter < 5))
					{
						resultDOM = resultDOM.add(liDivider);
					}
		
					if((messageCounter == arr.length) || (messageCounter == 5))
					{
						$("#user-chat-ul").empty()
											.append(resultDOM);

						// --- if number of unread messages > allowed to display
						if((arr.length - 1) > messageCounter)
						{
							var		liSystemMessage = $("<li/>").addClass("dropdown-menu-li-higher")
																.addClass(messageInfo.messageStatus)
																.append("<div class=\"text_align_center\"><i><a href=\"/chat?rand=" + Math.random()*98765432123456 + "\">еще сообщения</a></i></div>");

							$("#user-chat-ul").append(liDivider).append(liSystemMessage);
						}
					}
				}
			});

	};

	var GetUserChatMessages = function()
	{

		if(system_calls.isUserSignedin())
		{

			$.getJSON(
				"/cgi-bin/system.cgi",
				{action:"GetNavMenuChatStatus"})
				.done(function(data) 
					{
						if(data.type == "ChatStatus")
						{
							if(data.session == "true")
							{
								if(data.user == "true")
								{

									var	badgeSpan = $("<span/>").addClass("badge")
																.addClass("badge-danger");

									userArray = data.userArray;
									unreadMessagesArray = data.unreadMessagesArray;
									if(unreadMessagesArray.length)
									{
											badgeSpan.append(unreadMessagesArray.length);
									}

									// console.debug("GetUserChatMessages: DoneHandler: put a badge [" + unreadMessagesArray.length + "]");

									$("#user-chat-ahref .badge").remove();
									$("#user-chat-ahref").append(badgeSpan);

									chatUserList = data;

									BuildUnreadMessageList();
								}
								else
								{
									// --- workflow can get here just in case 
									// --- 	1) EchoRequest: session-ok, user-ok
									// ---	AND
									// ---	2) GetNavMenuChatStatus: session-ok, user-NOT_ok
									// --- it means:
									// ---	*) session expired in short period of time 
									// ---  OR
									// ---  *) iOS buggy behavior (assign old cookie in about 3 secs after page reload)
									console.error("GetUserChatMessages: DoneHandler: ERROR: guest user");
									system_calls.GetIntoPublicZone();
								} // --- if(data.user == "true")
							}
							else
							{
								console.error("GetUserChatMessages: DoneHandler: ERROR: session do not exists on server, session must be deleted, parent window must be redirected");

								system_calls.ClearSession();
								system_calls.GetIntoPublicZone();
							} // --- if(data.session == "true")
						} // --- if(data.type == "UnreadChatMessages")
					} // --- function(data)
				);

		} // --- if(system_calls.isUserSignedin())
		else
		{
			// --- user not signed in (no need to check notifications)
		}

		// --- check system notifications
		window.setTimeout(GetUserChatMessages, 60000);
	};

	var GetNumberOfUnreadMessages = function()
	{
		return unreadMessagesArray.length;
	};

	return {
		GetUserChatMessages: GetUserChatMessages,
		GetNumberOfUnreadMessages: GetNumberOfUnreadMessages
	};
}
)();

navMenu_userNotification = (function()
{
	"use strict";

	var		userNotificationsArray = []; // --- storing all notifications

	var	InitializeData = function (data)
	{
		userNotificationsArray = data;

		userNotificationsArray.forEach(function(item, i, arr)
		{
			if(((item.notificationTypeID == "67") || (item.notificationTypeID == "68") || (item.notificationTypeID == "69") || (item.notificationTypeID == "70")) && ((typeof item.notificationEvent != "undefined") && (item.notificationEvent[0].isBlocked == "Y")))
			{
				// --- don't show NavBar notifications about blocked events
				userNotificationsArray.splice(i, 1);
			}
		});
	};

	var	DeleteButtonClickHandler = function()
	{
	};


	var	ReplaceUserIDTagsToUserName = function(src)
	{
		var		result = src;
		var		userRegex = /@[0-9]+/g;
		var		matchArray = src.match(userRegex);
		var		userArray = [];

		// --- if users tags found in notification text
		if(matchArray)
		{		
			matchArray.forEach(function(item) 
				{
					// --- substring: @1030 -> 1030
					if(userCache.isUserCached(item.substr(1, item.length - 1)))
					{
						var 	user = userCache.GetUserByID(item.substr(1, item.length - 1));

						userArray["@" + user.id] = user.name + " " + user.nameLast;
					}
					else
					{
						userCache.AddUserIDForFutureUpdate(item.substr(1, item.length - 1));
					}
				});
		}

		Object.keys(userArray).forEach(function(item)
		{
			function convert(str, match, offset, s)
			{
				return "<i>" + userArray[match] + "</i>";
			}
			result = result.replace(/(@\d+)/g, convert);
		});

		return result;
	};

	var	GetAdditionalTitle = function(notificationObj)
	{
		var		result = "";

		// --- comment provided
		if(notificationObj.notificationTypeID == "19")
		{
			if((typeof notificationObj.notificationCommentTitle != "undefined"))
			{
				result = ": &quot;" + ReplaceUserIDTagsToUserName(notificationObj.notificationCommentTitle) + "&quot;";
			}
		}
		// --- vacancy rejected 
		if(notificationObj.notificationTypeID == "59")
		{
			if((typeof notificationObj.notificationVacancy != "undefined") && notificationObj.notificationVacancy.length)
			{
				result = " " + notificationObj.notificationVacancy[0].company_position_title + "";
			}
		}
		// --- gift thank
		if(notificationObj.notificationTypeID == "66")
		{
			if((typeof notificationObj.gifts == "object") && notificationObj.gifts.length && (typeof notificationObj.gifts[0].title != "undefined"))
			{
				result = " " + notificationObj.gifts[0].title + " ";
			}
			if((typeof notificationObj.notificationComment != "undefined"))
			{
				result += ": &quot;" + notificationObj.notificationComment + "&quot;";
			}
		}


		return result;
	};

	var	BuildUserNotificationList = function()
	{

		var		resultDOM = $();
		var		notificationCounter = 0;
		var		notificationBody;
		var		user;
		var		avatarLink;
		var		hrefTemp;
		var		avatarPath;
		var		divDivider;


		if(userNotificationsArray.length === 0)
		{
			$("#user-notification-ul")
				.empty()
				.append($("<center>").append("нет новых извещений").addClass("color_grey"));
		}
		else
		{
			userNotificationsArray.forEach(
				function(item, i, arr)
				{
					if(notificationCounter < 6)
					{

						var		notificationInfo = item;
						var		userSpan = $("<div/>").addClass("UnreadChatListSpan");
						var		liDivider = $("<li/>").addClass("divider");
						var		buttonSpan = $("<span/>").addClass("UnreadChatListButtonSpan");
						var		liUser = $("<li/>").addClass("dropdown-menu-li-higher")
													.addClass(notificationInfo.messageStatus);
						var		buttonReply = $("<button>")	.addClass("btn btn-link")
															.append($("<span>").addClass("glyphicon glyphicon-pencil"))
															.attr("data-action", "reply")
															.on("click", function(e) 
																{
																	var		newURL =  "/notification/" + notificationInfo.fromID + "?rand=" + Math.random()*98765432123456;
																	window.location.href = newURL;
																	e.stopPropagation(); 
																});
						var		buttonClose = $("<button>")	.attr("data-action", "markAsRead")
															.attr("id", "notifClose" + item.notificationID)
															.append($("<span>").addClass("glyphicon glyphicon-remove"))
															.addClass("btn btn-link")
															.on("click", function(e) 
																{
																	$.getJSON("/cgi-bin/index.cgi", {action:"AJAX_notificationMarkMessageReadByMessageID", notificationID:item.notificationID})
																				.done(function(data)
																					{
																						if(data.result == "success")
																						{
																						}
																						else
																						{
																							console.error("AJAX_notificationMarkMessageReadByMessageID: ERROR: " + data.description);
																						}
																					});

																	userNotificationsArray.forEach(function(item2, i2, arr2) 
																		{
																			if(userNotificationsArray[i2].notificationID == item.notificationID)
																			{
																				userNotificationsArray[i2].notificationStatus = "read";
																			}
																		});
																	BuildUserNotificationList();

																	e.stopPropagation(); 
																});
						var		canvasAvatar = $("<canvas/>")	.attr("width", "30")
																.attr("height", "30")
																.addClass("canvas-big-avatar")
																.addClass("UnreadChatListOverrideCanvasSize");
						var		messageBody = $("<div>").addClass("UnreadChatListMessage")
															.on("click", function(e) 
																{ 
																	window.location.href = "/user_notifications?scrollto=notificationInfo" + item.notificationID + "&rand=" + Math.random()*98765432123456; 
																	e.stopPropagation();
																});

						resultDOM = $();

						if((notificationCounter < arr.length) && (notificationCounter < 5) && (item.notificationStatus == "unread"))
						{
								notificationBody = "";

								Object.keys(notificationInfo).forEach(function(itemChild, i, arr) {
									buttonClose.data(itemChild, notificationInfo[itemChild]);
									buttonReply.data(itemChild, notificationInfo[itemChild]);
								});

								if(notificationCounter) resultDOM = resultDOM.add(liDivider);
								resultDOM = resultDOM.add(liUser);

								if((typeof item.notificationFriendUserID != "undefined") || (typeof item.notificationFriendUserNameLast != "undefined") || (typeof item.notificationFriendUserNameLast != "undefined"))
								{
									avatarLink = "/userprofile/" + item.notificationFriendUserID + "?rand=" + system_calls.GetUUID();
									hrefTemp = $("<a>").attr("href", avatarLink)
											.addClass("UnreadChatListHrefLineHeigh")
											.append(system_calls.CutLongMessages(item.notificationFriendUserName + " " + item.notificationFriendUserNameLast));

									if(userCache.isUserCached(item.notificationFriendUserID))
									{
										user = userCache.GetUserByID(item.notificationFriendUserID);
										DrawUserAvatar(canvasAvatar[0].getContext("2d"), user.avatar, user.name, user.nameLast);
									}
									else
									{
										userCache.AddUserIDForFutureUpdate(item.notificationFriendUserID);
										DrawUserAvatar(canvasAvatar[0].getContext("2d"), "", item.notificationFriendUserName, item.notificationFriendUserNameLast);
									}

									canvasAvatar.on("click", function(e) 
																{
																	window.location.href = avatarLink; 
																	e.stopPropagation();
																});

									userSpan.append(canvasAvatar)
											.append(hrefTemp);	

								}
								else if((typeof item.notificationFromCompany != "undefined") && (typeof item.notificationFromCompany[0].id != "undefined"))
								{
									avatarLink = "/companyprofile/" + item.notificationFromCompany[0].id + "?rand=" + system_calls.GetUUID();
									hrefTemp = $("<a>").attr("href", avatarLink)
											.addClass("UnreadChatListHrefLineHeigh")
											.append(system_calls.CutLongMessages(item.notificationFromCompany[0].name));

									if(item.notificationFromCompany[0].logo_folder.length && item.notificationFromCompany[0].logo_filename.length)
									{
										avatarPath = "/images/companies/" + item.notificationFromCompany[0].logo_folder + "/" + item.notificationFromCompany[0].logo_filename;
										DrawCompanyAvatar(canvasAvatar[0].getContext("2d"), avatarPath, item.notificationFromCompany[0].name, "");
									}

									canvasAvatar.on("click", function(e) 
																{
																	window.location.href = avatarLink; 
																	e.stopPropagation();
																});

									userSpan.append(canvasAvatar)
											.append(hrefTemp);	
								}

								userSpan.append(buttonSpan);
								buttonSpan.append(buttonClose);

								notificationBody = system_calls.GetGenderedPhrase(item, item.notificationCategoryTitle, item.notificationCategoryTitleMale, item.notificationCategoryTitleFemale) + " " + system_calls.GetGenderedPhrase(item, item.notificationTypeTitle, item.notificationTypeTitleMale, item.notificationTypeTitleFemale) + " ";

								if((item.notificationTypeID == "49") && (item.notificationCommentType == "likeBook"))
									notificationBody = "понравилась ваша любознательность ";
								if((item.notificationTypeID == "49") && (item.notificationCommentType == "likeUniversityDegree"))
									notificationBody = "поздравляет вас с получением степени ";
								if((item.notificationTypeID == "49") && (item.notificationCommentType == "likeCertification"))
									notificationBody = "поздравляет вас с получением сертификата ";
								if((item.notificationTypeID == "49") && (item.notificationCommentType == "likeCourse"))
									notificationBody = "поздравляет вас с прохождением курса ";
								if((item.notificationTypeID == "49") && (item.notificationCommentType == "likeLanguage"))
									notificationBody = "понравилась ваша способность изучения иностранного языка ";
								if((item.notificationTypeID == "49") && (item.notificationCommentType == "likeCompany"))
									notificationBody = "поздравляет вас с новой должностью ";

								if((item.notificationTypeID == "19") && (item.notificationCommentType == "book"))
									notificationBody = "коментарий на книгу ";
								if((item.notificationTypeID == "19") && (item.notificationCommentType == "university"))
									notificationBody = "коментарий на получение степени ";
								if((item.notificationTypeID == "19") && (item.notificationCommentType == "certification"))
									notificationBody = "коментарий на получение сертификата ";
								if((item.notificationTypeID == "19") && (item.notificationCommentType == "course"))
									notificationBody = "коментарий на посещение курса ";
								if((item.notificationTypeID == "19") && (item.notificationCommentType == "language"))
									notificationBody = "коментарий на изучение ин. языка ";
								if((item.notificationTypeID == "19") && (item.notificationCommentType == "company"))
									notificationBody = "коментарий на получение новой должности ";

								notificationBody += GetAdditionalTitle(item);

								messageBody.append(RenderMessageWithSpecialSymbols(notificationBody));


								liUser	.append(userSpan)
										.append($("<br/>"))
										.append($("<br/>"))
										.append(messageBody);


								if(!notificationCounter) $("#user-notification-ul").empty();
								$("#user-notification-ul").append(resultDOM);

								notificationCounter++;
						}

						if((notificationCounter == 5))
						{
							if(i < arr.length)
							{
								divDivider = $("<li/>").addClass("divider");
								$("#user-notification-ul").append(divDivider)
															.append($("<center>").addClass("cursor_pointer").append("еще . . ."));
							}
							notificationCounter++;
						}
					}
				});

			BadgeUpdate();

			userCache.AddCallbackRunsAfterCacheUpdate(navMenu_userNotification.BuildUserNotificationList);
			window.setTimeout(userCache.RequestServerToUpdateCache, 2000);
		}
	};

	var	BadgeUpdate = function()
	{

		var	badgeSpan = $("<span/>").addClass("badge")
									.addClass("badge-danger");
		var	countOnBadge = 0;

		if(userNotificationsArray.length > 0)
		{
			userNotificationsArray.forEach(function(item)
			{
				if(item.notificationStatus == "unread") countOnBadge++;
			});

			badgeSpan.append((countOnBadge > 20 ? "20+" : countOnBadge));
		}

		$("#user-notification-ahref .badge").remove();
		$("#user-notification-ahref").append(badgeSpan);
	};

	var RenderMessageWithSpecialSymbols = function(message)
	{
		var		lineList;
		var		cutMessage = [];
		
		lineList = message;
		lineList = lineList.replace(/\&ishort\;/g, "й");
		lineList = lineList.replace(/\&euml\;/g, "ё");
		lineList = lineList.replace(/\&zsimple\;/g, "з");
		lineList = lineList.replace(/\&Ishort\;/g, "Й");
		lineList = lineList.replace(/\&Euml\;/g, "Ё");
		lineList = lineList.replace(/\&Zsimple\;/g, "З");
		lineList = lineList.replace(/\&Norder;\;/g, "№");
		lineList = lineList.replace(/<br>/g, "\n").replace(/\r/g, "").split("\n");

		lineList.forEach(function(item, i, arr)
			{
				if(i < 3) 
				{
					cutMessage.push(item.substr(0,45) + (item.length > 45 ? " .!." : ""));
				}
			});
		if(lineList.length > 3)
		{
			cutMessage.push("...");
		}

		// return cutMessage.join("<br>");
		return lineList;
	};


	return {
		InitializeData: InitializeData,
		BuildUserNotificationList: BuildUserNotificationList,
		GetAdditionalTitle: GetAdditionalTitle
	};
})();

gift_list = (function ()
{
	"use strict";

	var callback_function;

	var DisplaySpecifiedImageModal_Show = function()
	{
		var		currTag = $(this);
		var		type = currTag.data("type");
		var		id = currTag.data("id");
		var		src = currTag.attr("src");
		var		title = currTag.data("title");

		$("#ImageDisplayModal_Title").empty().append(title);
		$("#ImageDisplayModal_Img").attr("src", src);

		$("#ImageDisplayModal").modal("show");

	};

	var	GiftToGiveButtonClickHandler = function()
	{
		var		currTag = $(this);
		var		id = currTag.data("id");
		var		script = currTag.data("script") || "gift.cgi";
		var		action = currTag.data("action");

		if(id && action.length)
		{
			currTag.button("loading");

			$.getJSON("/cgi-bin/" + script + "?action=" + action, {id: id})
				.done(function(data) {
					if(data.result == "success")
					{
						var		classSelector;

						callback_function(data);

						$(".GiveGiftVisibleButton" + id).removeClass("btn-success btn-default").addClass("btn-default");
						$(".GiveGiftAnonymousButton" + id).removeClass("btn-success btn-default").addClass("btn-default");
						if(data.status == "reserved")
						{
							$(".GiveGiftVisibleButton" + id).attr("disabled", "");
							$(".GiveGiftAnonymousButton" + id).attr("disabled", "");

							currTag.removeAttr("disabled").removeClass("btn-default").addClass("btn-success");
						}
						else if(data.status == "canceled")
						{
							$(".GiveGiftVisibleButton" + id).removeAttr("disabled");
							$(".GiveGiftAnonymousButton" + id).removeAttr("disabled");
						}
						else
						{
							console.error("unknown data.status returned from " + script + "/" + action);
						}
						if(data.description.length)
							system_calls.PopoverInfo(currTag.attr("id"), data.description);
					}
					else
					{
						system_calls.PopoverError(currTag.attr("id"), data.description);
					}
					setTimeout(function() { currTag.button("reset"); }, 500); 
				})
				.fail(function(data) {
					
					setTimeout(function() { 
						currTag.button("reset"); 
						system_calls.PopoverError(currTag.attr("id"), "Ошибка ответа сервера");
					}, 500); 
					console.error("ERROR parsing JSON response from server");
				});
		}
		else
		{
			console.error("data('id') or data('action') doesn't defined");
		}
	};


	var	GetGiftToGiveVisibilityStatus = function(gifts_to_giveArray, giftID, user_id)
	{
		var		result = "";

		gifts_to_giveArray.forEach(function(item)
			{
				if((item.gift_id == giftID) && (item.user_id == user_id))
					result = item.visibility;
			});

		return	result;
	};

	var	GetNumberOfGiftReservations = function(gifts_to_giveArray, giftID, user_id)
	{
		var		result = 0;

		gifts_to_giveArray.forEach(function(item)
			{
				if     ((typeof(user_id) != "undefined") && (item.gift_id == giftID) && (item.user_id == user_id)) ++result;
				else if((typeof(user_id) == "undefined") && (item.gift_id == giftID)) ++result;
			});

		return	result;
	};


	// --- IMPORTANT !!!
	// --- $("#GiftPath").width() - using in link width calculating
	// --- 
	// --- input:
	// --- 		giftsArray			- array of all gifts to display
	// ---		gifts_to_giveArray	- array of gift userID intended to present
	// ---		userID 				- userID presenting gifts_to_giveArray
	// ---		update_gifts_to_give_for_current_user_callback - callback func to update runtime gifts_to_give array
	// --- output:
	// ---		gifts list DOM model
	var	GetGiftsListDOM = function(giftsArray, gifts_to_giveArray, userID, update_gifts_to_give_for_current_user_callback)
	{
		var		result = $();

		if(typeof(giftsArray) == "undefined")
		{
			console.error("ERROR: giftsArray not defined");
			return;
		}

		if(typeof(update_gifts_to_give_for_current_user_callback) == "undefined")
		{
			console.error("ERROR: callback function to update gifts_to_give array for current user doesn't defined");
			return;
		}

		callback_function = update_gifts_to_give_for_current_user_callback;

		giftsArray.sort(function(a, b)
			{
				var		priceA = parseFloat(a.estimated_price);
				var		priceB = parseFloat(b.estimated_price);
				var		result;

				if(priceA == priceB) { result = 0; }
				if(priceA > priceB) { result = 1; }
				if(priceA < priceB) { result = -1; }

				return result;
			});
		giftsArray.forEach( function(item, i, arr) {
			if(parseInt(item.requested_quantity) == parseInt(item.gained_quantity))
			{

			}
			else if(parseInt(item.requested_quantity) <= (parseInt(item.gained_quantity) + GetNumberOfGiftReservations(gifts_to_giveArray, item.id) - GetNumberOfGiftReservations(gifts_to_giveArray, item.id, userID)))
			{

			}
			else
			{
				var		giftID = item.id;

				var		divRowGift = $("<div>").addClass("row margin_top_10")
												.attr("id", "Gift" + item.id);

				var		imgCover;
				var		divCover = $("<div>").addClass("col-xs-5 col-sm-1 col-sm-pull-11 margin_bottom_10");
				var		divGiftTitle = $("<div>").addClass("col-xs-12 col-sm-11 col-sm-push-1");
				// var		divCover = $("<div>").addClass("col-xs-5 col-sm-1");
				// var		divGiftTitle = $("<div>").addClass("col-xs-7 col-sm-7");

				var		divGiftPrice = $("<div>").addClass("col-xs-12 col-sm-11 col-sm-offset-1 ");
				var		divGiftQuantity = $("<div>").addClass("col-xs-12 col-sm-11 col-sm-offset-1 ");
				var		divGiftLink = $("<div>").addClass("col-xs-12 col-sm-11 col-sm-offset-1 ");
				var		divGiftDescriptionXS = $("<div>").addClass("col-xs-12 col-sm-11 col-sm-offset-1 visible-xs-block visible-sm-block");
				var		divGiftDescriptionMD = $("<div>").addClass("visible-md-block visible-lg-block form-group");
				var		divGiftControlButtonsXS_1 = $("<div>").addClass("col-xs-6 form-group visible-xs-block visible-sm-block");
				var		divGiftControlButtonsXS_2 = $("<div>").addClass("col-xs-6 form-group visible-xs-block visible-sm-block");
				var		divGiftControlButtonsMD_1 = $("<div>").addClass("col-sm-2 visible-md-block visible-lg-block");
				var		divGiftControlButtonsMD_2 = $("<div>").addClass("col-sm-2 visible-md-block visible-lg-block");

				var		spanTitle = $("<span>").attr("data-id", item.id)
														.attr("data-action", "updateGiftTitle")
														.attr("data-script", "gift.cgi")
														.addClass("giftTitle editableSpan ")
														.append(item.link.length ? $("<a>").attr("href", item.link).attr("target", "_blank").append(item.title) : item.title);
				var		spanLink = $("<span>").attr("data-id", item.id)
														.attr("data-action", "updateGiftLink")
														.attr("data-script", "gift.cgi")
														.addClass("giftLink editableSpan maxwidth_100percent")
														.append(item.link.length ? system_calls.CutLongMessages(item.link, $("#GiftPath").width() / 9) : "(ссылка не определена)");

				var		spanPrice = $("<span>").attr("data-id", item.id)
														.attr("data-action", "updateGiftPrice")
														.attr("data-script", "gift.cgi")
														.addClass("giftPrice editableSpan ")
														.append(item.estimated_price.length ? item.estimated_price : "(цена не определена)");

				var		spanRequestedQuantity = $("<span>").attr("data-id", item.id)
														.attr("data-action", "updateGiftRequestedQuantity")
														.attr("data-script", "gift.cgi")
														.addClass("giftRequestedQuantity editableSpan ")
														.append(item.requested_quantity.length ? item.requested_quantity : "(количество не определено)");

				var		spanGainedQuantity = $("<span>").attr("data-id", item.id)
														.attr("data-action", "updateGiftGainedQuantity")
														.attr("data-script", "gift.cgi")
														.attr("id", "GainedQuantity" + item.id)
														.addClass("giftGainedQuantity")
														.append(item.gained_quantity.length ? item.gained_quantity : "(количество не определено)");

				var		paragraphDescriptionXS = $("<p>").attr("data-id", item.id)
														.attr("id", "giftDescription" + item.id)
														.attr("data-action", "updateGiftDescription")
														.attr("data-script", "gift.cgi")
														.addClass("giftDescription editableParagraph  ")
														.append(item.description);

				var		paragraphDescriptionMD = item.description;

				var		buttonGiveVisibleMD = $("<button>").attr("data-id", item.id)
													.attr("data-action", "AJAX_giveGiftVisible")
													.attr("data-script", "gift.cgi")
													.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span> Подождите...")
													.attr("id", "GiveGiftVisibleMDButton" + item.id)
													.addClass("btn form-control animated GiveGiftVisibleButton" + item.id)
													.on("click", GiftToGiveButtonClickHandler)
													.append("Подарю");

				var		buttonGiveAnonymousMD = $("<button>").attr("data-id", item.id)
													.attr("data-action", "AJAX_giveGiftAnonymous")
													.attr("data-script", "gift.cgi")
													.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span> Подождите...")
													.attr("id", "GiveGiftAnonymousMDButton" + item.id)
													.addClass("btn form-control animated GiveGiftAnonymousButton" + item.id)
													.on("click", GiftToGiveButtonClickHandler)
													.append("Анонимно");

				var		buttonGiveVisibleXS = $("<button>").attr("data-id", item.id)
													.attr("data-action", "AJAX_giveGiftVisible")
													.attr("data-script", "gift.cgi")
													.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span> Подождите...")
													.attr("id", "GiveGiftVisibleXSButton" + item.id)
													.addClass("btn animated form-control GiveGiftVisibleButton" + item.id)
													.on("click", GiftToGiveButtonClickHandler)
													.append("Подарю");

				var		buttonGiveAnonymousXS = $("<button>").attr("data-id", item.id)
													.attr("data-action", "AJAX_giveGiftAnonymous")
													.attr("data-script", "gift.cgi")
													.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span> Подождите...")
													.attr("id", "GiveGiftAnonymousXSButton" + item.id)
													.addClass("btn animated form-control GiveGiftAnonymousButton" + item.id)
													.on("click", GiftToGiveButtonClickHandler)
													.append("Анонимно");

				if((typeof(item.logo_folder) != "undefined") && (typeof(item.logo_filename) != "undefined") && (item.logo_folder.length) && (item.logo_filename.length))
					imgCover = $("<img>").addClass("max_100percents_100px  niceborder")
										.attr("src", "/images/gifts/" + item.logo_folder + "/" + item.logo_filename)
										.attr("data-type", "gift")
										.attr("data-title", item.title)
										.attr("id", "editProfileCoverGiftID" + item.id)
										.data("id", item.id)
										.on("click", DisplaySpecifiedImageModal_Show);
				else
					imgCover = $("<img>").addClass("max_100percents_100px ")
										.attr("src", "/images/pages/common/empty_2.png")
										.attr("data-type", "gift")
										.attr("data-title", "Нет изображения")
										.attr("id", "editProfileCoverGiftID" + item.id)
										.data("id", item.id);

				if(userID && (userID != "24")) // --- userID not Guest ?
				{
					// --- if I'm registered user
					if(GetNumberOfGiftReservations(gifts_to_giveArray, item.id, userID) > 0)
					{
						if(GetGiftToGiveVisibilityStatus(gifts_to_giveArray, item.id, userID) == "visible")
						{
							buttonGiveVisibleMD.addClass("btn-success");
							buttonGiveVisibleXS.addClass("btn-success");
							buttonGiveAnonymousMD.addClass("btn-default").attr("disabled", "");
							buttonGiveAnonymousXS.addClass("btn-default").attr("disabled", "");
						}
						else
						{
							buttonGiveVisibleMD.addClass("btn-default").attr("disabled", "");
							buttonGiveVisibleXS.addClass("btn-default").attr("disabled", "");
							buttonGiveAnonymousMD.addClass("btn-success");
							buttonGiveAnonymousXS.addClass("btn-success");
						}
					}
					else
					{
						buttonGiveVisibleMD.addClass("btn-default").removeAttr("disabled");
						buttonGiveVisibleXS.addClass("btn-default").removeAttr("disabled");
						buttonGiveAnonymousMD.addClass("btn-default").removeAttr("disabled");
						buttonGiveAnonymousXS.addClass("btn-default").removeAttr("disabled");
					}

				}
				else
				{
					// --- if I'm Guest

					buttonGiveVisibleMD.addClass("btn-default").attr("disabled", "");
					buttonGiveVisibleXS.addClass("btn-default").attr("disabled", "");
					buttonGiveAnonymousMD.addClass("btn-default").attr("disabled", "");
					buttonGiveAnonymousXS.addClass("btn-default").attr("disabled", "");
				}

				divGiftTitle.append($("<b>").append(spanTitle))
							.append(" (").append(spanPrice).append(" руб.)")
							.append(divGiftDescriptionMD.append(paragraphDescriptionMD))
							.append(divGiftControlButtonsMD_1.append(buttonGiveVisibleMD))
							.append(divGiftControlButtonsMD_2.append(buttonGiveAnonymousMD));

				divRowGift
							.append(divGiftTitle)
							// .append(divGiftDescriptionMD.append(paragraphDescriptionMD))
							.append(divCover.append(imgCover))
							// .append(divTimestamp.append(spanTimestamp))
							// .append(divClose.append(spanClose))
							// .append(divGiftQuantity.append(buttonGained).append(" ").append(spanGainedQuantity).append(" из ").append(spanRequestedQuantity))
							.append(divGiftDescriptionXS.append(paragraphDescriptionXS))
							.append(divGiftControlButtonsXS_1.append(buttonGiveVisibleXS))
							.append(divGiftControlButtonsXS_2.append(buttonGiveAnonymousXS));

				result = result.add(divRowGift);
			}
		});

		return result;
	};

	return {
		GetGiftsListDOM: GetGiftsListDOM
	};
})();

system_notifications = (function ()
{
	"use strict";

	var Display = function()
	{
		if(system_calls.isUserSignedin())
		{
			if (("Notification" in window)) 
			{
				if (Notification.permission === "granted") 
				{
					var	numberOfChatMessages = navMenu_chat.GetNumberOfUnreadMessages();
					if(numberOfChatMessages > 0)
					{
						var	currDate = new Date();
						var	currTimestamp = currDate.getTime() / 1000;

						var notificationShownTimestamp = 0;
						if(localStorage.getItem("notificationShownTimestamp"))
						{
							notificationShownTimestamp = parseFloat(localStorage.getItem("notificationShownTimestamp"));
						}

						if((currTimestamp - notificationShownTimestamp) > 24 * 3600)
						{
							var		notify, pronunciation;

							localStorage.setItem("notificationShownTimestamp", currTimestamp);

							if(numberOfChatMessages == 1) { pronunciation = " новое сообщение"; }
							if(numberOfChatMessages == 2) { pronunciation = " новых сообщения"; }
							if(numberOfChatMessages == 3) { pronunciation = " новых сообщения"; }
							if(numberOfChatMessages == 4) { pronunciation = " новых сообщения"; }
							if(numberOfChatMessages >= 5) { pronunciation = " новых сообщений"; }
							if(((numberOfChatMessages % 10) == 1) && (numberOfChatMessages > 19)) { pronunciation = " новое сообщение"; }
							if(((numberOfChatMessages % 10) == 2) && (numberOfChatMessages > 19)) { pronunciation = " новых сообщения"; }
							if(((numberOfChatMessages % 10) > 2) && (numberOfChatMessages > 19)) { pronunciation = " новых сообщений"; }
							if(((numberOfChatMessages % 10) > 0) && (numberOfChatMessages > 19)) { pronunciation = " новых сообщений"; }

							notify = new Notification("Вам письмо !", { icon: "/images/pages/chat/chat_notification_" + (Math.floor(Math.random() * 18) + 1) + ".png", body: "Вам прислали " + numberOfChatMessages + pronunciation } );
							notify.onclick = function() {
								notify.close();
								window.location.href = "/chat?rand=" + Math.random()*98765432123456;
							};
							setTimeout(function() { notify.close(); }, 10000);
						}
						else
						{
							// console.debug("Display notifications alerting once a day");
						}
					}
				}
				else
				{
					if (Notification.permission !== "denied") 
					{
					    Notification.requestPermission();
					}
					else
					{
						console.debug("notifications rejected by user");
					}
				}
			}
			else
			{
				console.debug("browser doesn't support notifications");
			}
		}
		else
		{
			// --- user not signed in (no need to check notifications)
		}
	};

	return {
		Display: Display
	};
})();
/*
create_password_block = (function ()
{
	var	typingAlarmFlagActive = false;
	var	adjectives_list_global;
	var	noun_list_global;

	var Init = function(adjectives_list, noun_list)
	{
		adjectives_list_global = adjectives_list || [];
		noun_list_global = noun_list || [];

		$("#regPassword").on("keyup", CheckKeyPressedRegisterAndKeyboardLayout);
		$("#regConfirmPassword").on("keyup", CheckKeyPressedRegisterAndKeyboardLayout);
		$("#regPassword").on("focus", function(e) { $("#password_type_progress_check").show(500); });
		$("#regPassword").on("blur", function(e) { $("#password_type_progress_check").hide(100); });
		$("#regConfirmPassword").on("focus", function(e) { $("#password_type_progress_check").show(500); });
		$("#regConfirmPassword").on("blur", function(e) { $("#password_type_progress_check").hide(100); });

		$("#signinInputPassword").on("keyup", CheckKeyPressedRegisterAndKeyboardLayout);

		// --- password examples
		$("#tooltip_reg_password")
				.attr("data-toggle", "tooltip")
				.attr("data-placement", "top")
				.attr("title", "Например: " + GetPasswordExamples(2))
				.tooltip({ animation: "animated bounceIn"});

		$("#tooltip_reg_confirm_password")
				.attr("data-toggle", "tooltip")
				.attr("data-placement", "top")
				.attr("title", "Например: " + GetPasswordExamples(2))
				.tooltip({ animation: "animated bounceIn"});
	};

	var	isCapital = function(letter)
	{
		var		result = false;

		if(('A' <= letter) && (letter <= 'Z'))
		{
			result = true;
		}
		if(('А' <= letter) && (letter <= 'Я'))
		{
			result = true;
		}

		return result;
	};

	var	isRussianSymbol = function(letter)
	{
		var		result = false;

		if(('а' <= letter) && (letter <= 'я'))
		{
			result = true;
		}
		if(('А' <= letter) && (letter <= 'Я'))
		{
			result = true;
		}

		return result;
	};

	var	TransliteRusToEng = function(src)
	{
		var		result = src;

		result = result.replaceAll("А", "A");
		result = result.replaceAll("Б", "B");
		result = result.replaceAll("В", "V");
		result = result.replaceAll("Г", "G");
		result = result.replaceAll("Д", "D");
		result = result.replaceAll("Е", "E");
		result = result.replaceAll("Ё", "E");
		result = result.replaceAll("Ж", "Zh");
		result = result.replaceAll("З", "Z");
		result = result.replaceAll("И", "I");
		result = result.replaceAll("Й", "I");
		result = result.replaceAll("К", "K");
		result = result.replaceAll("Л", "L");
		result = result.replaceAll("М", "M");
		result = result.replaceAll("Н", "N");
		result = result.replaceAll("О", "O");
		result = result.replaceAll("П", "P");
		result = result.replaceAll("Р", "R");
		result = result.replaceAll("С", "S");
		result = result.replaceAll("Т", "T");
		result = result.replaceAll("У", "U");
		result = result.replaceAll("Ф", "F");
		result = result.replaceAll("Х", "X");
		result = result.replaceAll("Ц", "C");
		result = result.replaceAll("Ч", "Ch");
		result = result.replaceAll("Ъ", "");
		result = result.replaceAll("Ы", "W");
		result = result.replaceAll("Ь", "");
		result = result.replaceAll("Ш", "Sh");
		result = result.replaceAll("Щ", "Sch");
		result = result.replaceAll("Э", "E");
		result = result.replaceAll("Ю", "Yu");
		result = result.replaceAll("Я", "Ya");
		result = result.replaceAll("а", "a");
		result = result.replaceAll("б", "b");
		result = result.replaceAll("в", "v");
		result = result.replaceAll("г", "g");
		result = result.replaceAll("д", "d");
		result = result.replaceAll("е", "e");
		result = result.replaceAll("ё", "e");
		result = result.replaceAll("ж", "zh");
		result = result.replaceAll("з", "z");
		result = result.replaceAll("и", "i");
		result = result.replaceAll("й", "i");
		result = result.replaceAll("к", "k");
		result = result.replaceAll("л", "l");
		result = result.replaceAll("м", "m");
		result = result.replaceAll("н", "n");
		result = result.replaceAll("о", "o");
		result = result.replaceAll("п", "p");
		result = result.replaceAll("р", "r");
		result = result.replaceAll("с", "s");
		result = result.replaceAll("т", "t");
		result = result.replaceAll("у", "u");
		result = result.replaceAll("ф", "f");
		result = result.replaceAll("х", "x");
		result = result.replaceAll("ц", "c");
		result = result.replaceAll("ч", "ch");
		result = result.replaceAll("ъ", "");
		result = result.replaceAll("ы", "w");
		result = result.replaceAll("ь", "");
		result = result.replaceAll("ш", "sh");
		result = result.replaceAll("щ", "sch");
		result = result.replaceAll("э", "e");
		result = result.replaceAll("ю", "yu");
		result = result.replaceAll("я", "ya");
		result = result.replaceAll(" ", "_");


		return result;
	};

	var	GetPasswordExamples = function(count)
	{
		var		result = "";
		var		rand1 = Math.floor(Math.random() * 100);
		var		rand2 = Math.floor(Math.random() * 100);

		if(noun_list_global.length && adjectives_list_global.length)
		{
			for(var i = 0; i < count; ++i)
			{
				var		example;

				rand1 = (rand1 + 1) % adjectives_list_global.length;
				rand2 = (rand2 + 1) % noun_list_global.length;
				example = adjectives_list_global[rand1] + "" + Math.round(Math.random() * 1000) + "" + noun_list_global[rand2];

				if(result.length) result += ", ";
				result += TransliteRusToEng(example);
			}
		}
		else
		{
			// console.error("noun_list_global(" + noun_list_global.length + ") or adjectives_list_global(" + adjectives_list_global.length + ") is empty");
		}

		return 	result;
	};

	var	CheckKeyPressedRegisterAndKeyboardLayout = function(keyEvent)
	{
		var		currTag = $(this);
		var		shiftPressed = keyEvent.shiftKey;
		var		capsLockAlarm = false;
		var		alarmMessage = "";

		if((typeof(keyEvent.key) != "undefined") && (keyEvent.key.length == 1))
		{
			// --- is caps lock on
			if(!shiftPressed && isCapital(keyEvent.key))
			{
				if(alarmMessage.length)
				{
					alarmMessage += " и ";
				}
				alarmMessage += "Нажат CapsLock";
			}

			// --- is russian keyboard layout
			if(isRussianSymbol(keyEvent.key))
			{
				if(alarmMessage.length)
				{
					alarmMessage += " и ";
				}
				alarmMessage += "русская раскладка";
			}

			if((alarmMessage !== "") && (!typingAlarmFlagActive))
			{
				typingAlarmFlagActive = true;
				currTag.popover({"content": alarmMessage, "placement": "bottom"})
						.popover("show");
				setTimeout(function ()
					{
						currTag.popover("destroy");
					}, 3000);
				setTimeout(function ()
					{
						typingAlarmFlagActive = false;
					}, 3500);
			}
		}

		if((currTag.attr("id") == "regPassword") || (currTag.attr("id") == "regConfirmPassword"))
		{
			Check_NewPassword_Len(currTag);
			Check_NewPassword_Letters(currTag);
			Check_NewPassword_Digits(currTag);
			Check_NewPassword_DigitLocation(currTag);
			Check_NewPasswords_Parity();
		}
	};

	var	Check_NewPassword_Len = function(currTag)
	{
		var		curr_pass = currTag.val();
		var		result = false;

		if(curr_pass.length >= 8)
		{
			$("#password_progress_length").removeClass("alert-danger").addClass("alert-success");
			result = true;
		}
		else
			$("#password_progress_length").removeClass("alert-success").addClass("alert-danger");

		return result;
	};



	var	Check_NewPassword_Letters = function(currTag)
	{
		var		curr_pass = currTag.val();
		var		result = false;

		if(curr_pass.match(/\D+/))
		{
			$("#password_progress_letters").removeClass("alert-danger").addClass("alert-success");
			result = true;
		}
		else
			$("#password_progress_letters").removeClass("alert-success").addClass("alert-danger");

		return result;
	};

	var	Check_NewPassword_Digits = function(currTag)
	{
		var		curr_pass = currTag.val();
		var		result = false;

		if(curr_pass.match(/\d+/))
		{
			$("#password_progress_digits").removeClass("alert-danger").addClass("alert-success");
			result = true;
		}
		else
			$("#password_progress_digits").removeClass("alert-success").addClass("alert-danger");

		return result;
	};

	var	Check_NewPassword_DigitLocation = function(currTag)
	{
		var		curr_pass = currTag.val();
		var		result = false;

		if(curr_pass.match(/\D+\d+\D+/))
		{
			$("#password_progress_digits_location").removeClass("alert-danger").addClass("alert-success");
			result = true;
		}
		else
			$("#password_progress_digits_location").removeClass("alert-success").addClass("alert-danger");

		return result;
	};

	var	Check_NewPasswords_Parity = function()
	{
		var		result = false;

		if($("#regPassword").val() == $("#regConfirmPassword").val())
		{
			$("#passwords_parity").removeClass("alert-danger").addClass("alert-success");
			result = true;
		}
		else
			$("#passwords_parity").removeClass("alert-success").addClass("alert-danger");

		return result;
	};

	return {
		Init: Init,
		Check_NewPassword_Len: Check_NewPassword_Len,
		Check_NewPassword_Letters: Check_NewPassword_Letters,
		Check_NewPassword_Digits: Check_NewPassword_Digits,
		Check_NewPassword_DigitLocation: Check_NewPassword_DigitLocation,
		Check_NewPasswords_Parity: Check_NewPasswords_Parity
	};
})();
*/
troubleshooting = (function ()
{
	var		before_at = "issue";
	var		very_important_var = "";
	var		at_sign = String.fromCharCode(64);
	var		another_very_important_var = "";
	var		after_at = "bestbounty.ru";
	var		Recipient = before_at + very_important_var + at_sign + another_very_important_var + after_at;

	var		GetTraceback = function()
	{
		var	traceback = "";

		var callback = function(stackframes) {
		  var stringifiedStack = stackframes.map(function(sf) {
		    return sf.toString();
		  }).join("\n");
		  traceback += stringifiedStack + "\n";

		  return traceback;
		};

		var errback = function(err) { console.log(err.message); };

		return StackTrace.get().then(callback).catch(errback);
	};

	var		PopoverError = function(popover_tag_id, message_to_user, mail_subj, mail_body)
	{
		GetTraceback().then(function(traceback)
		{
			var		body = traceback;

			body += "\n\n" + mail_body;
			system_calls.PopoverError(popover_tag_id,
				message_to_user +
				"<a href=\"mailto:" + Recipient +
				"?subject=" + mail_subj +
				"&body=" + encodeURI(body) + "\">Сообщите</a> в тех поддержку.");
		});
	};

	return {
		PopoverError: PopoverError
	};
})();


/**
 * isMobile.js v0.4.1
 *
 * A simple library to detect Apple phones and tablets,
 * Android phones and tablets, other mobile devices (like blackberry, mini-opera and windows phone),
 * and any kind of seven inch device, via user agent sniffing.
 *
 * @author: Kai Mallea (kmallea@gmail.com)
 *
 * @license: http://creativecommons.org/publicdomain/zero/1.0/
 */
(function (global) {

    var apple_phone         = /iPhone/i,
        apple_ipod          = /iPod/i,
        apple_tablet        = /iPad/i,
        android_phone       = /(?=.*\bAndroid\b)(?=.*\bMobile\b)/i, // Match 'Android' AND 'Mobile'
        android_tablet      = /Android/i,
        amazon_phone        = /(?=.*\bAndroid\b)(?=.*\bSD4930UR\b)/i,
        amazon_tablet       = /(?=.*\bAndroid\b)(?=.*\b(?:KFOT|KFTT|KFJWI|KFJWA|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA|KFARWI|KFASWI|KFSAWI|KFSAWA)\b)/i,
        windows_phone       = /Windows Phone/i,
        windows_tablet      = /(?=.*\bWindows\b)(?=.*\bARM\b)/i, // Match 'Windows' AND 'ARM'
        other_blackberry    = /BlackBerry/i,
        other_blackberry_10 = /BB10/i,
        other_opera         = /Opera Mini/i,
        other_chrome        = /(CriOS|Chrome)(?=.*\bMobile\b)/i,
        other_firefox       = /(?=.*\bFirefox\b)(?=.*\bMobile\b)/i, // Match 'Firefox' AND 'Mobile'
        seven_inch = new RegExp(
            "(?:" +         // Non-capturing group

            "Nexus 7" +     // Nexus 7

            "|" +           // OR

            "BNTV250" +     // B&N Nook Tablet 7 inch

            "|" +           // OR

            "Kindle Fire" + // Kindle Fire

            "|" +           // OR

            "Silk" +        // Kindle Fire, Silk Accelerated

            "|" +           // OR

            "GT-P1000" +    // Galaxy Tab 7 inch

            ")",            // End non-capturing group

            "i");           // Case-insensitive matching

    var match = function(regex, userAgent) {
        return regex.test(userAgent);
    };

    var IsMobileClass = function(userAgent) {
        var ua = userAgent || navigator.userAgent;

        // Facebook mobile app's integrated browser adds a bunch of strings that
        // match everything. Strip it out if it exists.
        var tmp = ua.split("[FBAN");
        if (typeof tmp[1] !== "undefined") {
            ua = tmp[0];
        }

        // Twitter mobile app's integrated browser on iPad adds a "Twitter for
        // iPhone" string. Same probable happens on other tablet platforms.
        // This will confuse detection so strip it out if it exists.
        tmp = ua.split("Twitter");
        if (typeof tmp[1] !== "undefined") {
            ua = tmp[0];
        }

        this.apple = {
            phone:  match(apple_phone, ua),
            ipod:   match(apple_ipod, ua),
            tablet: !match(apple_phone, ua) && match(apple_tablet, ua),
            device: match(apple_phone, ua) || match(apple_ipod, ua) || match(apple_tablet, ua)
        };
        this.amazon = {
            phone:  match(amazon_phone, ua),
            tablet: !match(amazon_phone, ua) && match(amazon_tablet, ua),
            device: match(amazon_phone, ua) || match(amazon_tablet, ua)
        };
        this.android = {
            phone:  match(amazon_phone, ua) || match(android_phone, ua),
            tablet: !match(amazon_phone, ua) && !match(android_phone, ua) && (match(amazon_tablet, ua) || match(android_tablet, ua)),
            device: match(amazon_phone, ua) || match(amazon_tablet, ua) || match(android_phone, ua) || match(android_tablet, ua)
        };
        this.windows = {
            phone:  match(windows_phone, ua),
            tablet: match(windows_tablet, ua),
            device: match(windows_phone, ua) || match(windows_tablet, ua)
        };
        this.other = {
            blackberry:   match(other_blackberry, ua),
            blackberry10: match(other_blackberry_10, ua),
            opera:        match(other_opera, ua),
            firefox:      match(other_firefox, ua),
            chrome:       match(other_chrome, ua),
            device:       match(other_blackberry, ua) || match(other_blackberry_10, ua) || match(other_opera, ua) || match(other_firefox, ua) || match(other_chrome, ua)
        };
        this.seven_inch = match(seven_inch, ua);
        this.any = this.apple.device || this.android.device || this.windows.device || this.other.device || this.seven_inch;

        // excludes 'other' devices and ipods, targeting touchscreen phones
        this.phone = this.apple.phone || this.android.phone || this.windows.phone;

        // excludes 7 inch devices, classifying as phone or tablet is left to the user
        this.tablet = this.apple.tablet || this.android.tablet || this.windows.tablet;

        if (typeof window === "undefined") {
            return this;
        }
    };

    var instantiate = function() {
        var IM = new IsMobileClass();
        IM.Class = IsMobileClass;
        return IM;
    };

    if (typeof module !== "undefined" && module.exports && typeof window === "undefined") {
        //node
        module.exports = IsMobileClass;
    } else if (typeof module !== "undefined" && module.exports && typeof window !== "undefined") {
        //browserify
        module.exports = instantiate();
    } else if (typeof define === "function" && define.amd) {
        //AMD
        define("isMobile", [], global.isMobile = instantiate());
    } else {
        global.isMobile = instantiate();
    }

})(this);


String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

String.prototype.trimLeft = function(charlist) {
  if (charlist === undefined)
    charlist = "\\s";

  return this.replace(new RegExp("^[" + charlist + "]+"), "");
};

String.prototype.trimRight = function(charlist) {
  if (charlist === undefined)
    charlist = "\\s";

  return this.replace(new RegExp("[" + charlist + "]+$"), "");
};

String.prototype.trim = function(charlist) {
  return this.trimLeft(charlist).trimRight(charlist);
};

$.fn.selectRange = function(start, end) {
    var e = document.getElementById($(this).attr("id")); // I don't know why... but $(this) don't want to work today :-/
    if (!e) return;
    else if (e.setSelectionRange) { e.focus(); e.setSelectionRange(start, end); } /* WebKit */ 
    else if (e.createTextRange) { var range = e.createTextRange(); range.collapse(true); range.moveEnd("character", end); range.moveStart("character", start); range.select(); } /* IE */
    else if (e.selectionStart) { e.selectionStart = start; e.selectionEnd = end; }
};

$.urlParam = function(name)
{
    var results = new RegExp("[\?&]" + name + "=([^&#]*)").exec(window.location.href);
    if (results === null){
       return "";
    }
    else{
       return decodeURI(results[1]) || "";
    }
};
