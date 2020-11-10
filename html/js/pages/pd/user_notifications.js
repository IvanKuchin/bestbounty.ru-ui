
var	user_notifications = user_notifications || {};

var	user_notifications = (function()
{
	"use strict";

	var usersNotificationArray = [];
	var scrollLock = false; // --- controlls consecutive pagination
	var	globalPageCounter;

	var	Init = function()
	{
		globalPageCounter = 0;
		UpdateUserNotificationList();
		$(window).on("scroll resize lookup", HandlerScrollToShow);

		$("#Remove").on("click", ModalActionConfirmedClickHandler);		
	};

	var	UpdateUserNotificationList = function()
	{		
		$.getJSON(
			'/cgi-bin/index.cgi',
			{action:"AJAX_getUserNotification"})
			.done(function(data) {
					usersNotificationArray = data;

					$("#divUserNotifications").empty();
					BuildUserNotificationList(data);

					if(system_calls.GetParamFromURL("scrollto").length) system_calls.ScrollWindowToElementID("#" + system_calls.GetParamFromURL("scrollto"));

				}); // --- getJSON.done()
	};

	var	BuildUserNotificationList = function(data)
	{
		if(data.length === 0)
		{
			// reduce counter
			--globalPageCounter;
		}
		else
		{
			data.forEach(BuildUserNotificationSingleEntry);
		}
	};

	var HandlerScrollToShow = function() 
	{
		var		windowPosition	= $(window).scrollTop();
		var		clientHeight	= document.documentElement.clientHeight;
		var		divPosition		= $("#scrollerToShow").position().top;

		if(((windowPosition + clientHeight) > divPosition) && (! scrollLock))
		{
			// console.debug("HandlerScrollToShow: globalPageCounter = " + globalPageCounter);
			// --- AJAX get news_feed from the server 
			scrollLock = true;
			$.getJSON('/cgi-bin/index.cgi?action=AJAX_getUserNotification', {page: ++globalPageCounter})
			 		.done(function(data) {
						// console.debug("HandlerScrollToShow: getJSON(AJAX_getNewsFeed).done(): ajax getNewsFeed");
						usersNotificationArray = usersNotificationArray.concat(data);
						BuildUserNotificationList(data);
						scrollLock = false;
					});
		
		}
	};

	var	BuildUserNotificationSingleEntry = function(item, i, arr)
	{
		var		divContainer 			= $("<div/>")	.addClass("container")
														.attr("id", "notificationContainer" + item.notificationID);
		var		divRow 					= $("<div/>")	.addClass("row");
		var		divAvatar	 			= $("<div/>")	.addClass("col-md-1 col-sm-2 col-xs-3 user_notifications_photo_block")
														.attr("id", "notificationAvatar" + item.notificationID);
		var		divMsgInfo		 		= $("<div/>")	.addClass("col-md-10 col-sm-10 col-xs-9 shift_down")
														.attr("id", "notificationInfo" + item.notificationID);
		var		divMessage		 		= $("<div/>")	.addClass("col-md-10 col-xs-12 single_block box-shadow--6dp")
														.attr("id", "notificationBody" + item.notificationID);

		var		canvasAvatar 			= $("<canvas/>").attr("width", "80")
														.attr("height", "80");
		var 	hrefAvatar 				= $("<a/>");
		var		spanTimestamp			= $("<span>").addClass("user_notifications_timestamp");
		var		spanNotifTypeTitle		= $("<span>").append(system_calls.GetGenderedPhrase(item, item.notificationTypeTitle, item.notificationTypeTitleMale, item.notificationTypeTitleFemale));
		var		spanNotifCategoryTitle	= $("<span>").append(system_calls.GetGenderedPhrase(item, item.notificationCategoryTitle, item.notificationCategoryTitleMale, item.notificationCategoryTitleFemale));
		var		isValidToShow = true;


		divContainer.append(divRow);
		divRow	.append(divAvatar)
				.append(divMsgInfo.append(hrefAvatar).append(spanTimestamp));

		divAvatar.append(canvasAvatar);	

		if((typeof item.notificationFriendUserID != "undefined") && (typeof item.notificationFriendUserNameLast != "undefined") && (typeof item.notificationFriendUserNameLast != "undefined"))
		{
			var		friendAvatar = (item.notificationFriendUserAvatar != "undefined" ? item.notificationFriendUserAvatar : "");
			hrefAvatar.attr("href", "/userprofile/" + item.notificationFriendUserID)
						.addClass("UnreadChatListHrefLineHeigh")
						.append(item.notificationFriendUserName + " " + item.notificationFriendUserNameLast);

			canvasAvatar.addClass('canvas-big-avatar');
			DrawUserAvatar(canvasAvatar[0].getContext("2d"), friendAvatar, item.notificationFriendUserName, item.notificationFriendUserNameLast);

		}
		else if((typeof item.notificationFromCompany != "undefined") && (typeof item.notificationFromCompany[0].id != "undefined"))
		{
			var		avatarPath = "";

			hrefAvatar.attr("href", "/companyprofile/" + item.notificationFromCompany[0].id)
					.addClass("UnreadChatListHrefLineHeigh")
					.append(system_calls.CutLongMessages(item.notificationFromCompany[0].type + " " + item.notificationFromCompany[0].name));

			if(item.notificationFromCompany[0].logo_folder.length && item.notificationFromCompany[0].logo_filename.length)
				avatarPath = "/images/companies/" + item.notificationFromCompany[0].logo_folder + "/" + item.notificationFromCompany[0].logo_filename;

			canvasAvatar.addClass('canvas-big-avatar-corners');
			DrawCompanyAvatar(canvasAvatar[0].getContext("2d"), avatarPath, item.notificationFromCompany[0].name, "");
		}

		divMsgInfo.append(" ")
					.append(spanNotifCategoryTitle)
					.append(" ")
					.append(spanNotifTypeTitle)
					.append(" " + navMenu_userNotification.GetAdditionalTitle(item));

		spanTimestamp.append("<small>" + system_calls.GetLocalizedDateInHumanFormatSecSince1970(item.notificationEventTimestamp) + "</small>");

		// --- 19 - comment provided
		// --- 49 - message liked
		// --- 49 - message disliked
		if((item.notificationTypeID == 19) || (item.notificationTypeID == 49) || (item.notificationTypeID == 50))
		{
			var		spanImg = $("<div>").addClass("col-xs-5 col-sm-3 col-md-2 margin_top_15 form-group");
			var		spanTitle = $("<div>").addClass("col-xs-7 col-sm-9 col-md-10"); // .append($("<h4>").append(item.notificationMessageTitle));
			var		spanBody = $("<div>").addClass("col-xs-12 col-sm-9 col-md-10"); // .append(item.notificationMessageBody);

			var		divSeeAlso = $("<div>").addClass("row");
			var		divColSeeAlso = $("<div>").addClass("col-xs-12 margin_top_10");

			var		divNotificationBody = $("<div>").addClass("row");
			var		messageImg = $("<img>").addClass("max_100px div_content_center_alignment");
			var		messageVideo = $("<video>").addClass("max_100px div_content_center_alignment");
			var		messageYoutubeVideo = $("<iframe>").addClass("max_100px div_content_center_alignment")
														.attr("frameborder", "0");
			var		messageMedia;

			if((item.notificationCommentType == "message") || (item.notificationCommentType == "like"))
			{
				spanTitle.append($("<h4>").append(item.notificationMessageTitle));
				spanBody.append(item.notificationMessageBody);
				
				if((typeof(item.notificationMessageImageName) != "undefined") && item.notificationMessageImageName.length)
				{
					if((typeof(item.notificationMessageMediaType) != "undefined") && (item.notificationMessageMediaType == "image"))
					{
						messageImg.attr("src", "/images/feed/" + item.notificationMessageImageFolder + "/" + item.notificationMessageImageName);
						spanImg.append(messageImg);
					}
					if((typeof(item.notificationMessageMediaType) != "undefined") && (item.notificationMessageMediaType == "video"))
					{
						messageVideo.attr("src", "/video/feed/" + item.notificationMessageImageFolder + "/" + item.notificationMessageImageName);
						spanImg.append(messageVideo);
					}
					if((typeof(item.notificationMessageMediaType) != "undefined") && (item.notificationMessageMediaType == "youtube_video"))
					{
						messageYoutubeVideo.attr("src", item.notificationMessageImageName);
						spanImg.append(messageYoutubeVideo);
					}
				}
				else
				{
					messageImg.attr("src", "/images/pages/common/empty.png");
					spanImg.append(messageImg);
				}

				divColSeeAlso		.append($("<a>").attr("href", "/news_feed?scrollto=message" + item.notificationMessageID + "&rand=" + Math.random()*98765432123456).append("посмотреть в ленте..."));
			}
			else if((item.notificationCommentType == "book") || (item.notificationCommentType == "likeBook"))
			{
				var		isbns = "";

				if((typeof(item.notificationBookISBN10) != "undefined") && item.notificationBookISBN10.length)
					isbns += item.notificationBookISBN10;
				if((typeof(item.notificationBookISBN13) != "undefined") && item.notificationBookISBN13.length)
				{
					if(isbns.length) isbns += " / ";
					isbns += item.notificationBookISBN13;
				}
				if(isbns.length) isbns = "ISBN: " + isbns;

				if(item.notificationCommentType == "likeBook") spanNotifTypeTitle.empty().append("поддерживает вашу любознательность");

				spanTitle.append($("<h4>").append(item.notificationBookTitle))
						.append(item.notificationBookAuthor)
						.append($("<h6>").append(isbns));

				if((typeof(item.notificationBookImageName) != "undefined") && item.notificationBookImageName.length)
					messageImg.attr("src", "/images/books/" + item.notificationBookImageFolder + "/" + item.notificationBookImageName);
				else
					messageImg.attr("src", "/images/pages/news_feed/empty_book.jpg");

				spanImg.append(messageImg);
				divColSeeAlso		.append($("<a>").attr("href", "/news_feed?scrollto=book" + item.notificationBookID + "&rand=" + Math.random()*98765432123456).append("посмотреть в ленте..."));
			}
			else if((item.notificationCommentType == "university"))
			{
				var		universityLocation = "";
				var		studyPeriodMessage = "";
				var		studyPeriodLength = 0;

				spanNotifTypeTitle.empty().append(" получения научной степени");

				if((typeof(item.notificationUniversityCountryName) != "undefined") && (item.notificationUniversityCountryName.length))
					universityLocation += item.notificationUniversityCountryName;
				if((typeof(item.notificationUniversityRegionName) != "undefined") && (item.notificationUniversityRegionName.length))
				{
					if(universityLocation.length) universityLocation += ", ";
					universityLocation += item.notificationUniversityRegionName;
				}

				spanTitle.append($("<h4>").append(item.notificationUniversityTitle))
						.append(universityLocation);

				if((typeof(item.notificationUniversityImageName) != "undefined") && item.notificationUniversityImageName.length)
					messageImg.attr("src", "/images/universities/" + item.notificationUniversityImageFolder + "/" + item.notificationUniversityImageName);

				spanImg.append(messageImg);
				divColSeeAlso		.append($("<a>").attr("href", "/news_feed?scrollto=university" + item.notificationUniversityID + "&rand=" + Math.random()*98765432123456).append("посмотреть в ленте..."));
			}
			else if((item.notificationCommentType == "likeUniversityDegree"))
			{
				var		universityLocation = "";
				var		studyPeriodMessage = "";
				var		studyPeriodLength = 0;

				spanNotifTypeTitle.empty().append("поздравляет с получением научной степени");

				if((typeof(item.notificationUniversityCountryName) != "undefined") && (item.notificationUniversityCountryName.length))
					universityLocation += item.notificationUniversityCountryName;
				if((typeof(item.notificationUniversityRegionName) != "undefined") && (item.notificationUniversityRegionName.length))
				{
					if(universityLocation.length) universityLocation += ", ";
					universityLocation += item.notificationUniversityRegionName;
				}

				if(item.notificationUniversityStart.length && item.notificationUniversityFinish.length)
				{
					studyPeriodLength = parseInt(item.notificationUniversityFinish) - parseInt(item.notificationUniversityStart) + 1;
					studyPeriodMessage = "<br>c " + item.notificationUniversityStart + " по " + item.notificationUniversityFinish;
					studyPeriodMessage += " (" + studyPeriodLength + " " + system_calls.GetYearsSpelling(studyPeriodLength);
					studyPeriodMessage +=  ")";
				}

				spanTitle.append($("<h4>").append(item.notificationUniversityDegree + " в " + item.notificationUniversityTitle))
						.append(universityLocation)
						.append(studyPeriodMessage);

				if((typeof(item.notificationUniversityImageName) != "undefined") && item.notificationUniversityImageName.length)
					messageImg.attr("src", "/images/universities/" + item.notificationUniversityImageFolder + "/" + item.notificationUniversityImageName);

				spanImg.append(messageImg);
				divColSeeAlso		.append($("<a>").attr("href", "/news_feed?scrollto=scienceDegree" + item.notificationUsersUniversityID + "&rand=" + Math.random()*98765432123456).append("посмотреть в ленте..."));
			}
			else if((item.notificationCommentType == "certification"))
			{
				// --- certificate comments belongs to certification track, not to User/Certififcate pair
				spanNotifTypeTitle.empty().append(" на получение сертификата");

				spanTitle.append($("<h4>").append(item.notificationCertificationCompanyName + " " + item.notificationCertificationTitle));

				if((typeof(item.notificationCertificationImageName) != "undefined") && item.notificationCertificationImageName.length)
					messageImg.attr("src", "/images/certifications/" + item.notificationCertificationImageFolder + "/" + item.notificationCertificationImageName);

				spanImg.append(messageImg);
				divColSeeAlso		.append($("<a>").attr("href", "/news_feed?scrollto=certification_track" + item.notificationCertificationID + "&rand=" + Math.random()*98765432123456).append("посмотреть в ленте..."));
			}
			else if((item.notificationCommentType == "likeCertification"))
			{
				spanNotifTypeTitle.empty().append("поздравляет с получением сертификата");

				spanTitle.append($("<h4>").append(item.notificationCertificationCompanyName + " " + item.notificationCertificationTitle))
						.append("#" + item.notificationCertificationNumber);

				if((typeof(item.notificationCertificationImageName) != "undefined") && item.notificationCertificationImageName.length)
					messageImg.attr("src", "/images/certifications/" + item.notificationCertificationImageFolder + "/" + item.notificationCertificationImageName);

				spanImg.append(messageImg);
				divColSeeAlso		.append($("<a>").attr("href", "/news_feed?scrollto=certification" + item.notificationUsersCertificationID + "&rand=" + Math.random()*98765432123456).append("посмотреть в ленте..."));
			}
			else if((item.notificationCommentType == "course"))
			{
				spanNotifTypeTitle.empty().append(" прохождения курса");

				spanTitle.append($("<h4>").append(item.notificationCourseCompanyName + " " + item.notificationCourseTitle));

				if((typeof(item.notificationCourseImageName) != "undefined") && item.notificationCourseImageName.length)
					messageImg.attr("src", "/images/certifications/" + item.notificationCourseImageFolder + "/" + item.notificationCourseImageName);

				spanImg.append(messageImg);
				divColSeeAlso		.append($("<a>").attr("href", "/news_feed?scrollto=course" + item.notificationCourseID + "&rand=" + Math.random()*98765432123456).append("посмотреть в ленте..."));
			}
			else if((item.notificationCommentType == "likeCourse"))
			{
				spanNotifTypeTitle.empty().append("поздравляет с прохождением курса");

				spanTitle.append($("<h4>").append(item.notificationCourseCompanyName + " " + item.notificationCourseTitle));

				if((typeof(item.notificationCourseImageName) != "undefined") && item.notificationCourseImageName.length)
					messageImg.attr("src", "/images/certifications/" + item.notificationCourseImageFolder + "/" + item.notificationCourseImageName);

				spanImg.append(messageImg);
				divColSeeAlso		.append($("<a>").attr("href", "/news_feed?scrollto=usercourse" + item.notificationUsersCourseID + "&rand=" + Math.random()*98765432123456).append("посмотреть в ленте..."));
			}
			else if((item.notificationCommentType == "likeCompany"))
			{
				if(item.notificationCommentType == "likeCompany") spanNotifTypeTitle.empty().append("поздравляет с получением новой должности");

				spanTitle.append($("<h4>").append(item.notificationCompanyPositionTitle + " в " + item.notificationCompanyName));

				if((typeof(item.notificationCompanyImageName) != "undefined") && item.notificationCompanyImageName.length)
					messageImg.attr("src", "/images/companies/" + item.notificationCompanyImageFolder + "/" + item.notificationCompanyImageName);

				spanImg.append(messageImg);
				divColSeeAlso		.append($("<a>").attr("href", "/news_feed?scrollto=vacancy" + item.notificationUsersCompanyID + "&rand=" + Math.random()*98765432123456).append("посмотреть в ленте..."));
			}
			else if((item.notificationCommentType == "company"))
			{
				// --- company comments belongs to company, not to User/Company pair
				if(item.notificationCommentType == "company") spanNotifTypeTitle.empty().append(" получение новой должности");

				spanTitle.append($("<h4>").append(item.notificationCompanyName));

				if((typeof(item.notificationCompanyImageName) != "undefined") && item.notificationCompanyImageName.length)
					messageImg.attr("src", "/images/companies/" + item.notificationCompanyImageFolder + "/" + item.notificationCompanyImageName);

				spanImg.append(messageImg);
				divColSeeAlso		.append($("<a>").attr("href", "/news_feed?scrollto=company" + item.notificationCompanyID + "&rand=" + Math.random()*98765432123456).append("посмотреть в ленте..."));
			}
			else if((item.notificationCommentType == "likeLanguage"))
			{
				spanNotifTypeTitle.empty().append("понравилась ваша способность изучения иностранного языка");

				spanTitle.append($("<h4>").append(item.notificationLanguageTitle + " до уровня " + item.notificationLanguageLevel));

				if((typeof(item.notificationLanguageImageName) != "undefined") && item.notificationLanguageImageName.length)
					messageImg.attr("src", "/images/flags/" + item.notificationLanguageImageFolder + "/" + item.notificationLanguageImageName);

				spanImg.append(messageImg);
				divColSeeAlso		.append($("<a>").attr("href", "/news_feed?scrollto=userLanguage" + item.notificationUsersLanguageID + "&rand=" + Math.random()*98765432123456).append("посмотреть в ленте..."));
			}
			else if((item.notificationCommentType == "language"))
			{
				spanNotifTypeTitle.empty().append(" на изучение нового языка");

				spanTitle.append($("<h4>").append(item.notificationLanguageTitle));

				if((typeof(item.notificationLanguageImageName) != "undefined") && item.notificationLanguageImageName.length)
					messageImg.attr("src", "/images/flags/" + item.notificationLanguageImageFolder + "/" + item.notificationLanguageImageName);

				spanImg.append(messageImg);
				divColSeeAlso		.append($("<a>").attr("href", "/news_feed?scrollto=language" + item.notificationLanguageID + "&rand=" + Math.random()*98765432123456).append("посмотреть в ленте..."));
			}

			divRow.append(divMessage);
			divMessage.append(divNotificationBody);
			divMessage.append(divSeeAlso);

			divNotificationBody	.append(spanImg).append(spanTitle).append(spanBody);
			divSeeAlso			.append(divColSeeAlso);
		}
		// --- skill approved / reduced
		if((item.notificationTypeID == 44) || (item.notificationTypeID == 43))
		{
			divRow.append(divMessage);
			divMessage	.append($("<div>").addClass("h4").append("Эксперт в " + item.notificationSkillTitle))
						.append($("<a>").attr("href", "/userprofile/" + item.notificationOwnerUserID + "?scrollto=SkillPathHeader&rand=" + Math.random()*98765432123456).append("посмотреть в профиле..."));
		}
		// --- recommendation provided / corrected
		if((item.notificationTypeID == 45) || (item.notificationTypeID == 48))
		{
			divRow.append(divMessage);
			divMessage	.append($("<div>").addClass("h4").append("Рекомендация"))
						.append($("<p>").append(item.notificationRecommendationTitle))
						.append($("<a>").attr("href", "/userprofile/" + item.notificationOwnerUserID + "?scrollto=titleRecommendation" + item.notificationRecommendationID + "&rand=" + Math.random()*98765432123456).append("посмотреть в профиле..."));
		}
		// --- birthday
		if(item.notificationTypeID == 58)
		{
			var		spanImg = $("<div>").addClass("col-xs-5 col-sm-3 col-md-2 margin_top_15 form-group");
			var		spanTitle = $("<div>").addClass("col-xs-7 col-sm-9 col-md-10"); // .append($("<h4>").append(item.notificationMessageTitle));
			var		spanBody = $("<div>").addClass("col-xs-12 col-sm-9 col-md-10"); // .append(item.notificationMessageBody);

			var		divNotificationBody = $("<div>").addClass("row");
			var		messageImg = $("<img>").addClass("max_100px div_content_center_alignment")
											.attr("src", "/images/pages/notification/birthday.jpg");

			// divMsgInfo.empty();
			// spanNotifCategoryTitle.empty();
			// spanNotifTypeTitle.empty();
			spanTitle.append($("<h4>").append(system_calls.ConvertDateRussiaToHumanWithoutYear(item.notificationBirthdayDate)));

			if((typeof(item.notificationUniversityImageName) != "undefined") && item.notificationUniversityImageName.length)
				messageImg.attr("src", "/images/universities/" + item.notificationUniversityImageFolder + "/" + item.notificationUniversityImageName);

			spanImg.append(messageImg);

			divRow.append(divMessage);
			divMessage.append(divNotificationBody);

			divNotificationBody	.append(spanImg).append(spanTitle).append(spanBody);
		}
		// --- vacancy rejected
		if(item.notificationTypeID == 59)
		{
			var		divImg = $("<div>").addClass("col-xs-5 col-sm-3 col-md-2 margin_top_15 form-group");
			var		divTitle = $("<div>").addClass("col-xs-7 col-sm-9 col-md-10"); // .append($("<h4>").append(item.notificationMessageTitle));
			var		divBody = $("<div>").addClass("col-xs-12 col-sm-9 col-md-10") // .append(item.notificationMessageBody);
										.append($("<a>").attr("href", "/edit_profile?scrollto=VacanciesApplied&rand=" + Math.random() * 1234567890).append("проверить статус моих заявлений"));

			var		divNotificationRow = $("<div>").addClass("row");

			divTitle.append();

			if((typeof(item.notificationUniversityImageName) != "undefined") && item.notificationUniversityImageName.length)
				messageImg.attr("src", "/images/universities/" + item.notificationUniversityImageFolder + "/" + item.notificationUniversityImageName);

			divRow.append(divMessage);
			divMessage.append(divNotificationRow);

			divNotificationRow	.append(divImg).append(divTitle).append(divBody);
		}

		// --- company possession request
		if(item.notificationTypeID == 60)
		{
			var		divImg = $("<div>").addClass("col-xs-5 col-sm-3 col-md-2 margin_top_15 form-group");
			var		divTitle = $("<div>").addClass("col-xs-7 col-sm-9 col-md-10"); // .append($("<h4>").append(item.notificationMessageTitle));
			var		divBody = $("<div>").addClass("col-xs-12 form-group"); // .append(item.notificationMessageBody);
			var		divOK = $("<div>").addClass("col-xs-6 col-sm-4 col-md-5");
			var		buttonOK = $("<button>").addClass("btn btn-primary form-control")
												.data("id", item.notificationID)
												.data("action", "AJAX_grantPossessionRequest")
												.data("script", "company.cgi")
												.append("Передать")
												.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>")
												.on("click", AreYouSureClickHandler);
			var		divReject = $("<div>").addClass("col-xs-6 col-sm-4 col-md-5");
			var		buttonReject = $("<button>").addClass("btn btn-danger form-control")
												.data("id", item.notificationID)
												.data("action", "AJAX_rejectPossessionRequest")
												.data("script", "company.cgi")
												.append("Отказать")
												.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>")
												.on("click", AreYouSureClickHandler);

			var		messageImg = $("<img>").addClass("max_100px div_content_center_alignment")
											.attr("src", "/images/pages/notification/birthday.jpg");

			var		divNotificationRow = $("<div>").addClass("row");

			divTitle.append();

			if((typeof(item.notificationRequestedCompany) != "undefined") && item.notificationRequestedCompany.length)
			{
				messageImg.attr("src", "/images/companies/" + item.notificationRequestedCompany[0].logo_folder + "/" + item.notificationRequestedCompany[0].logo_filename);
				divTitle.append($("<h4>").append(item.notificationRequestedCompany[0].name));
			}

			divImg.append(messageImg);
			divBody.append(item.notificationDescription.length ? "Передает вам сообщение: " + item.notificationDescription : "");
			divOK.append(buttonOK);
			divReject.append(buttonReject);

			divRow.append(divMessage);
			divMessage.append(divNotificationRow);

			divNotificationRow	.append(divBody)
								.append(divImg)
								.append(divTitle);
			if(item.notificationPossessionStatus == "requested")
				divNotificationRow	.append(divOK)
									.append(divReject);
		}

		// --- granted company possession request
		if(item.notificationTypeID == 61)
		{
			var		divImg = $("<div>").addClass("col-xs-5 col-sm-3 col-md-2 margin_top_15 form-group");
			var		divTitle = $("<div>").addClass("col-xs-7 col-sm-9 col-md-10"); // .append($("<h4>").append(item.notificationMessageTitle));
			var		divBody = $("<div>").addClass("col-xs-12 col-sm-9 col-md-10") // .append(item.notificationMessageBody);
										.append($("<a>").attr("href", "edit_company?companyid=" + item.notificationFromCompany[0].id + "&rand=" + system_calls.GetUUID()).append("Редактировать данные компании"));

			var		divNotificationRow = $("<div>").addClass("row");

			divTitle.append();

			divRow.append(divMessage);
			divMessage.append(divNotificationRow);

			divNotificationRow	.append(divImg).append(divTitle).append(divBody);
		}

		// --- 67 - event host addedd
		// --- 68 - you are invited
		// --- 69 - event accept received
		// --- 70 - event start in 1 day
		
		if((item.notificationTypeID == 67) || (item.notificationTypeID == 68) || (item.notificationTypeID == 69) || (item.notificationTypeID == 70))
		{
			if((typeof item.notificationEvent != "undefined") && (item.notificationEvent[0].isBlocked == "N"))
			{
				var		eventContainer = system_calls.BuildEventSingleBlock(item.notificationEvent[0]);

				// --- patch to fit eventContainer into notification container
				eventContainer.removeClass("container");

				divRow.append(divMessage);
				divMessage.append(eventContainer);
			}
			else
			{
				isValidToShow = false;
			}
		}

		if(isValidToShow) $("#divUserNotifications").append(divContainer);
	};

	var	AreYouSureClickHandler = function()
	{
		var		currTag = $(this);

		$("#AreYouSure #Remove").removeData();
		Object.keys(currTag.data()).forEach(function(item) { 
			$("#AreYouSure #Remove").data(item, currTag.data(item)); 
		});

		if(currTag.data("action") == "AJAX_grantPossessionRequest")
		{

			$("#AreYouSure .description").empty().append("Вы больше _НЕ_ будете владеть компанией.<ul><li>_НЕ_ сможете публиковать новости от имени компании</li><li>_НЕ_ сможете искать сотрудников в компанию</li></ul>");
			$("#AreYouSure #Remove").empty().append("Согласен");
		}
		else if(currTag.data("action") == "AJAX_rejectPossessionRequest")
		{
			$("#AreYouSure .description").empty();
			$("#AreYouSure #Remove").empty().append("Отказать");
		}
		else
		{
			$("#AreYouSure .description").empty();
			$("#AreYouSure #Remove").empty().append("Удалить");
		}

		$("#AreYouSure").modal("show");
	}

	var ModalActionConfirmedClickHandler = function()
	{
		var		currTag = $(this);
		var		script = (typeof(currTag.data("script")) == "string" ? currTag.data("script") : "company.cgi");
		var		action = (typeof(currTag.data("action")) == "string" ? currTag.data("action") : "");

		if(action.length)
		{
			currTag.button("loading");

			$.getJSON(
				'/cgi-bin/' + script,
				{ action:action, id:currTag.data("id") })
				.done(function(data) {
						if(data.result == "success")
						{
							UpdateUserNotificationList();
						}
						else
						{
							console.debug("ModalActionConfirmedClickHandler.done(): ERROR: " + data.description);
						}

						currTag.button("reset");

						$("#AreYouSure").modal("hide");
					})
				.fail(function()
					{
						
						console.debug("ModalActionConfirmedClickHandler.done(): ERROR: parsing JSON response form server");

						setTimeout(function() {currTag.button("reset"); }, 500); // --- wait for animation
					}); // --- getJSON.done()

		}

	}

	return {
		Init: Init,
		BuildUserNotificationList:BuildUserNotificationList
	}

})();
