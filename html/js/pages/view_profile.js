var		view_profile = view_profile || {};

view_profile = (function()
{
	'use strict';

	var		userProfile;
	var		addRecommendation = {};

	var		myUserID;
	var		myUserLogin;
	var		friendUserID;

	var	Init = function()
	{
		myUserID = $("#myUserID").data("myuserid");
		myUserLogin = $("#myUserID").data("mylogin");
		friendUserID = $("#friendLastName").data("friendid");

		$("#AreYouSure #Remove").on("click", AreYouSureRemoveHandler);

		DrawFriendAvatar($("#friendLastName").data("friendavatar"), $("#friendName").text(), $("#friendLastName").text());
		FillinUserProfile();
	};


	var FillinUserProfile = function()
	{
		$.getJSON('/cgi-bin/index.cgi?action=JSON_getUserProfile', {id: $("#friendLastName").data("friendid")})
			.done(function(data) {
				if(data.result === "success")
				{
					userProfile = data.users[0];
					RenderGiftPath();
					RenderBirthday();
					RenderCity();
					RenderControlButtons();
					HandShakers();

					if(system_calls.GetParamFromURL("scrollto").length) system_calls.ScrollWindowToElementID("#" + system_calls.GetParamFromURL("scrollto"));
				}
				else
				{
					console.debug("FillinUserProfile: ERROR: " + data.description);
				}
			})
			.fail(function() {
				system_calls.PopoverError("friendName", "ошибка ответа сервера");
				console.error("ERROR parsing JSON response");
			});

	};

	var	HandShakers = function()
	{
		var		my_user_id = $("#myUserID").data("myuserid");
		var		friend_user_id = $("#friendLastName").data("friendid");

		if(parseInt(my_user_id) && parseInt(friend_user_id))
		{
			$.getJSON('/cgi-bin/index.cgi?action=JSON_getFindFriendByID', {lookForKey: friend_user_id})
		 		.done(function(data) 
		 		{
					if(data.result == "success")
					{
						system_calls.RenderFriendshipButtons(data.users[0], $("#viewProfileFriendshipButton"));
					}
					else
					{
						console.debug("HandShakers: getJSON(JSON_getShakeHands).done(): ERROR [" + data.description + "]");
					}
				});
		}
	};

	var	DrawFriendAvatar = function (friendImage, friendName, friendLastName)
	{
		var		canvasCtx; 

		$("#canvasForAvatar").attr("width", "160")
							.attr("height", "160")
							.addClass('canvas-big-avatar');
		canvasCtx = $("#canvasForAvatar")[0].getContext("2d");

		DrawUserAvatar(canvasCtx, friendImage, friendName, friendLastName);
	};

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

	var IsCompanyDuplicate = function(array, companyID)
	{
		var		duplicateFlag = false;

		array.forEach(
			function(item, i, arr)
			{
				if(item.companyID == companyID) { duplicateFlag = true; }
			});

		return duplicateFlag;
	};

	var	GetHandshakeCompany = function(data)
	{
		var		user1Companies, user2Companies;
		var		handshakeCompanies = [];

		console.debug("GetHandshakeCompany: start");

		user1Companies = data.user1.currentEmployment;
		user2Companies = data.user2.currentEmployment;

		if(data.user1.id != data.user2.id)
		{
			user1Companies.forEach(
				function(item1, index1, arr1)
				{
					user2Companies.forEach(
							function(item2, index2, arr2)
							{
								if((typeof(item1.companyID) != "undefined") && (typeof(item2.companyID) != "undefined"))
								{
									if(item1.companyID == item2.companyID) 
									{
										if(IsCompanyDuplicate(handshakeCompanies, item1.companyID) === false)
										{
											handshakeCompanies.push({companyID : item1.companyID, company : item1.company});
										}
									}
								}
							}
						);
				}
				);
		}

		console.debug("GetHandshakeCompany: end");
		return handshakeCompanies;
	};

	var DrawPathFromUser1ToUser2 = function(inputArg)
	{
		var		data = inputArg;
		var		handshakeCompanies = GetHandshakeCompany(data);

		console.debug("DrawPathFromUser1ToUser2: start");


		// --- handshake users
		{

			var		user1Canvas = $("<canvas>").attr("width", "80")
												.attr("height", "80")
												.addClass('canvas-big-avatar class-tooltip')
												.data("toggle", "tooltip")
												.data("placement", "top")
												.attr("title", data.user1.name + " " + data.user1.nameLast);
			var		user1CanvasCtx = user1Canvas[0].getContext("2d");
			var		user2Canvas = $("<canvas>").attr("width", "80")
												.attr("height", "80")
												.addClass('canvas-big-avatar class-tooltip')
												.data("toggle", "tooltip")
												.data("placement", "top")
												.attr("title", data.user2.name + " " + data.user2.nameLast);
			var		user2CanvasCtx = user2Canvas[0].getContext("2d");
			var		tagDivRow			= $("<div>").addClass("row");
			var		tagDivUser1 		= $("<div>").addClass("col-lg-1 col-md-1 col-sm-2 col-xs-3")
													.append(user1Canvas);
			var		tagDivUser1Arrow	= $("<div>").addClass("col-ld-1 col-md-1 col-sm-1 col-xs-1 div-height-80")
													.append($("<span>").addClass("glyphicon glyphicon-arrow-right"));
			var		tagDivUserHandshake = $("<div>").addClass("col-lg-1 col-md-1 col-sm-2 col-xs-3");
			var		tagDivUser2Arrow	= $("<div>").addClass("col-ld-1 col-md-1 col-sm-1 col-xs-1 div-height-80")
													.append($("<span>").addClass("glyphicon glyphicon-arrow-right"));
			var		tagDivUser2 		= $("<div>").addClass("col-lg-1 col-md-1 col-sm-2 col-xs-3")
													.append(user2Canvas);
			if(data.handshakeUserStatus == "1hop")
			{
				DrawUserAvatar(user1CanvasCtx, data.user1.avatar, data.user1.name, data.user1.nameLast);

				data.handshakeUsers.forEach(
					function(item, i, arr)
					{
						var		hrefUserLink = $("<a>").attr("href", "/userprofile/" + item.id);
						var		friendCanvas = $("<canvas>").attr("width", "40")
															.attr("height", "40")
															.addClass('canvas-big-avatar class-tooltip');
						var		friendCanvasCtx = friendCanvas[0].getContext("2d");
						var		fullName = "", name = "", nameLast = "";

						if(typeof(item.name) != "undefined")
						{
							name = item.name;
						}
						if(typeof(item.nameLast) != "undefined")
						{
							nameLast = " " + item.nameLast;
						}

						fullName = name + nameLast;
						if(fullName.length > 1)
						{
							if(i > 0) 
							{
								// tagDivUserHandshake.append("<br>");
							}

							DrawUserAvatar(friendCanvasCtx, item.avatar, item.name, item.nameLast);
							friendCanvas.addClass("class-tooltip")
										.data("toggle", "tooltip")
										.attr("title", fullName);
							tagDivUserHandshake.append(hrefUserLink.append(friendCanvas));
						}
					});

				DrawUserAvatar(user2CanvasCtx, data.user2.avatar, data.user2.name, data.user2.nameLast);

				tagDivRow	.append(tagDivUser1)
							.append(tagDivUser1Arrow)
							.append(tagDivUserHandshake)
							.append(tagDivUser2Arrow)
							.append(tagDivUser2);
			}
			else if(data.handshakeUserStatus == "directFriends")
			{
				DrawUserAvatar(user1CanvasCtx, data.user1.avatar, data.user1.name, data.user1.nameLast);

				DrawUserAvatar(user2CanvasCtx, data.user2.avatar, data.user2.name, data.user2.nameLast);

				tagDivRow	.append(tagDivUser1)
							.append(tagDivUser1Arrow)
							.append(tagDivUser2);
			}
			else if(data.handshakeUserStatus == "sameUser")
			{
				DrawUserAvatar(user1CanvasCtx, data.user1.avatar, data.user1.name, data.user1.nameLast);

				tagDivRow	.append(tagDivUser1);
			}

			$("#spanHandshakes").append(tagDivRow);
		}

		// --- handshake companies
		if(handshakeCompanies.length > 0)
		{
			data.handshakeCompanyStatus = "1hop";
			data.handshakeCompanies = handshakeCompanies;
		}
		else
		{
			data.handshakeCompanyStatus = "noConnection";
		}

		{
			var		user1Canvas = $("<canvas>").attr("width", "80")
												.attr("height", "80")
												.addClass('canvas-big-avatar class-tooltip')
												.data("toggle", "tooltip")
												.data("placement", "bottom")
												.attr("title", data.user1.name + " " + data.user1.nameLast);
			var		user1CanvasCtx = user1Canvas[0].getContext("2d");
			var		user2Canvas = $("<canvas>").attr("width", "80")
												.attr("height", "80")
												.addClass('canvas-big-avatar class-tooltip')
												.data("toggle", "tooltip")
												.data("placement", "bottom")
												.attr("title", data.user2.name + " " + data.user2.nameLast);
			var		user2CanvasCtx = user2Canvas[0].getContext("2d");
			var		tagDivRow			= $("<div>").addClass("row");
			var		tagDivUser1 		= $("<div>").addClass("col-lg-1 col-md-1 col-sm-2 col-xs-3")
													.append(user1Canvas);
			var		tagDivUser1Arrow	= $("<div>").addClass("col-ld-1 col-md-1 col-sm-1 col-xs-1 div-height-80")
													.append($("<span>").addClass("glyphicon glyphicon-arrow-right"));
			var		tagDivCompanyHandshake = $("<div>").addClass("col-lg-1 col-md-1 col-sm-2 col-xs-3");
			var		tagDivUser2Arrow	= $("<div>").addClass("col-ld-1 col-md-1 col-sm-1 col-xs-1 div-height-80")
													.append($("<span>").addClass("glyphicon glyphicon-arrow-right"));
			var		tagDivUser2 		= $("<div>").addClass("col-lg-1 col-md-1 col-sm-2 col-xs-3")
													.append(user2Canvas);

			if(data.handshakeCompanyStatus == "1hop")
			{

				DrawUserAvatar(user1CanvasCtx, data.user1.avatar, data.user1.name, data.user1.nameLast);

				data.handshakeCompanies.forEach(
					function(item, i, arr)
					{
						var		hrefCompanyLink = $("<a>").attr("href", "/companyprofile/" + item.companyID)
															.addClass("class-tooltip")
															.data("toggle", "tooltip")
															.data("placement", "bottom")
															.attr("title", item.company);

						if(i > 0) 
						{
							tagDivCompanyHandshake.append("<br>");
						}
						hrefCompanyLink.append(item.company);
						tagDivCompanyHandshake.append(hrefCompanyLink);
					});

				DrawUserAvatar(user2CanvasCtx, data.user2.avatar, data.user2.name, data.user2.nameLast);

				tagDivRow	.append(tagDivUser1)
							.append(tagDivUser1Arrow)
							.append(tagDivCompanyHandshake)
							.append(tagDivUser2Arrow)
							.append(tagDivUser2);

				$("#spanHandshakes").append(tagDivRow);
			}

			if((data.handshakeUserStatus == "noConnection") && (data.handshakeCompanyStatus == "noConnection"))
			{
				// tagDivCompanyHandshake.addClass("div-height-80");

				DrawUserAvatar(user1CanvasCtx, data.user1.avatar, data.user1.name, data.user1.nameLast);

				tagDivCompanyHandshake.append("У вас нет общих друзей.");

				DrawUserAvatar(user2CanvasCtx, data.user2.avatar, data.user2.name, data.user2.nameLast);

				tagDivRow	.append(tagDivUser1)
							.append(tagDivUser1Arrow)
							.append(tagDivCompanyHandshake)
							.append(tagDivUser2Arrow)
							.append(tagDivUser2);

				$("#spanHandshakes").append(tagDivRow);
			}
		}

		$('.class-tooltip').tooltip();

		console.debug("DrawPathFromUser1ToUser2: end");
	};

	var	GetEmploymentDuration = function(empStart, empFinish)
	{
		var		result = "";
		var		regexDate = /(\d+)\-(\d+)\-(\d+)/;
		var		arrStart = regexDate.exec(empStart);

		if(arrStart.length == 4)
		{
			var		dateStart = new Date(arrStart[1], arrStart[2] - 1, arrStart[3]);
			var		dateFinish;
			var		arrFinish = regexDate.exec(empFinish);

			if(arrFinish && arrFinish.length == 4) dateFinish = new Date(arrFinish[1], arrFinish[2] - 1, arrFinish[3]);
			else	dateFinish = new Date();
			
			result = system_calls.GetLocalizedWorkDurationFromDelta((dateFinish.getTime() - dateStart.getTime()) / 1000);
		}
		else
		{
			console.debug("ERROR: parsing date (required format YYYY-MM-DD) [" + empStart + "]");
		}

		return result;
	};

	var	RenderGiftPath = function()
	{
		$("div#GiftPath").empty();

		$("div#GiftPath").append(gift_list.GetGiftsListDOM(userProfile.gifts, userProfile.gifts_to_give, myUserID, function(data){ 
			userProfile.gifts_to_give = data.gifts_to_give; 
		}));
	};

	var	RenderCarrierPath = function()
	{
		var		result = $();
		var		currentEmploymentText = "";

		if(typeof(userProfile) == "undefined")
		{
			return;
		}

		$("div#CarrierPath").empty();
		userProfile.companies.sort(function(a, b)
			{
				var		arrA = a.occupationStart.split(/\-/);
				var		arrB = b.occupationStart.split(/\-/);
				var 	timeA, timeB;
				var		result = 0;

				timeA = new Date(parseInt(arrA[0]), parseInt(arrA[1]) - 1, parseInt(arrA[2]));
				timeB = new Date(parseInt(arrB[0]), parseInt(arrB[1]) - 1, parseInt(arrB[2]));

				if(timeA.getTime() == timeB.getTime()) { result = 0; }
				if(timeA.getTime() <  timeB.getTime()) { result = 1; }
				if(timeA.getTime() >  timeB.getTime()) { result = -1; }

				return result;
			});
		userProfile.companies.forEach( function(item, i, arr) {
			var		divRowTitle = $("<div>").addClass("row")
												.attr("id", "companyTitle" + item.companyID);

			var		divEmployment = $("<div>").addClass("col-xs-12 col-sm-7 col-sm-push-1");
			var		divCompanyLogo = $("<div>").addClass("col-xs-5 col-sm-1 col-sm-pull-7");
			var		divTimeline = $("<div>").addClass("col-xs-7 col-sm-4");
			var		divClose = $("<div>").addClass("col-xs-2 col-lg-1 col-lg-push-6");
			var		paragraphTimeline = $("<b>");


			// --- class.formatDate used for identify this span as a Date
			// --- class.datePick used to identify field as StartEmployment
			var		spanStartEmployment = $("<span>").attr("data-id", item.companyID)
													.attr("data-action", "update_occupation_start")
													.addClass("occupation_start datePick formatDate")
													.append(system_calls.ConvertDateSQLToHuman(item.occupationStart));
			var		spanFinishEmplyment = $("<span>").attr("data-id", item.companyID)
													.attr("data-action", "update_occupation_finish")
													.addClass("occupation_finish editableSpan formatDate")
													.append(system_calls.ConvertDateSQLToHuman(item.occupationFinish));

			var		employmentDuration = GetEmploymentDuration(item.occupationStart, (item.currentCompany == "1" ? "" : item.occupationFinish));
			var		spanEmploymentDuration = $("<small>").addClass("")
														.append("<br>(" + employmentDuration + ")");

			var		spanCurrentPosition = $("<img>").addClass("custom_checkbox animateClass")
													.attr("src", (item.currentCompany == "1" ? "/images/pages/common/checkbox_checked.png" : "/images/pages/common/checkbox_unchecked.png"))
													.attr("data-id", item.companyID)
													.attr("data-currentcompany", item.currentCompany);

			var		paragraphEmployment = $("<b>");
			var		spanJobTitle = $("<span>").attr("data-id", item.companyID)
													.attr("data-action", "updateJobTitle")
													.addClass("jobTitle editableSpan")
													.append(item.title);
			var		spanCompanyName = $("<span>").attr("data-id", item.companyID)
													.attr("data-action", "updateCompanyName")
													.addClass("companyName editableSpan")
													.append(item.companyType + " " + item.companyName);

			var		spanCurrentPositionText = $("<span>").append(" настоящее время")
														.data("id", item.companyID)
														.data("action", "AJAX_changeCurrentStatus");
			var		spanClose = $("<span>").attr("data-id", item.companyID)
											.attr("data-action", "AJAX_removeCompanyExperience")
											.attr("aria-hidden", "true")
											.addClass("glyphicon animateClass removeCompanyExperience");
			var		imgCover;

			result = result.add(divRowTitle);

			if(item.currentCompany == "1")
			{
				if(currentEmploymentText.length)
				{
					currentEmploymentText += "<br> ";
				}
				currentEmploymentText += item.companyName;			
			}

			if((typeof(item.companyLogoFolder) != "undefined") && (typeof(item.companyLogoFilename) != "undefined") && (item.companyLogoFolder.length) && (item.companyLogoFilename.length))
				imgCover = $("<img>").addClass("max_100percents_100px  niceborder")
									.attr("src", "/images/companies/" + item.companyLogoFolder + "/" + item.companyLogoFilename)
									.attr("data-type", "company")
									.attr("data-title", item.companyName)
									.data("id", item.companyInternalID)
									.on("click", DisplaySpecifiedImageModal_Show);
			else
				imgCover = $("<img>").addClass("max_100percents_100px  scale_1_2 cursor_pointer")
									.attr("src", "/images/pages/common/empty_2.png")
									.attr("id", "editProfileCoverCertificationID" + item.companyInternalID)
									.attr("data-type", "company")
									.data("id", item.companyInternalID);

			divRowTitle.append(divEmployment.append(paragraphEmployment.append(spanJobTitle).append(" в ").append(spanCompanyName)));
			divRowTitle.append(divCompanyLogo.append(imgCover));
			divRowTitle.append(divTimeline.append(paragraphTimeline.append("c ")
																	.append(spanStartEmployment)
																	.append(" по ")
																	.append(item.currentCompany == "1" ? spanCurrentPositionText : spanFinishEmplyment) ));
			if(employmentDuration.length) paragraphEmployment.append(spanEmploymentDuration);


			var		divRowResponsibilities = $("<div>").addClass("row")
													.attr("id", "responsibilitie" + item.companyID);
			var		divResponsibilities = $("<div>").addClass("col-xs-offset-1 col-xs-11");
			var		paragraphResponsibilities = $("<p>").attr("id", "paragraphRowResponsibilities" + item.companyID)
														.addClass("editableParagraph")
														.attr("data-id", item.companyID)
														.attr("data-action", "update_responsibilities")
														.append(item.responsibilities)
														.append("<br>");

			result = result.add(divRowResponsibilities);
			divRowResponsibilities.append(divResponsibilities.append(paragraphResponsibilities));

		});

		$("p#currentEmployment").html(currentEmploymentText);
		$("div#CarrierPath").append(result);
	};

	var	RenderCertificationPath = function()
	{
		var		result = $();

		if(typeof(userProfile) == "undefined")
		{
			return;
		}

		$("div#CertificationPath").empty();
		userProfile.certifications.sort(function(a, b)
			{
				var		vendorA = a.certificationVendor;
				var		vendorB = b.certificationVendor;
				var		result;

				if(vendorA == vendorB) { result = 0; }
				if(vendorA < vendorB) { result = 1; }
				if(vendorA > vendorB) { result = -1; }

				return result;
			});
		userProfile.certifications.forEach( function(item, i, arr) {
			var		divRowCertification = $("<div>").addClass("row")
												.attr("id", "certification" + item.certificationID);

			var		divCertification = $("<div>").addClass("col-xs-12 col-sm-7 col-sm-push-1");
			var		divCover = $("<div>").addClass("col-xs-5 col-sm-1 col-sm-pull-7");
			var		divCertificationNumber = $("<div>").addClass("col-xs-7 col-sm-4");
			var		paragraphCertification = $("<p>");
			var		spanVendor = $("<span>").attr("data-id", item.certificationID)
													.attr("data-action", "updateCertificationVendor")
													.addClass("certificationVendor editableSpan")
													.append(item.certificationVendor);
			var		spanTrack = $("<span>").attr("data-id", item.certificationID)
													.attr("data-action", "updateCertificationTrack")
													.addClass("certificationTrack editableSpan")
													.append(item.certificationTrack);
			var		spanNumber = $("<span>").attr("data-id", item.certificationID)
													.attr("data-action", "updateCertificationNumber")
													.addClass("certificationNumber editableSpan")
													.append(item.certificationNumber);

			var		divClose = $("<div>").addClass("col-xs-2");
			var		spanClose = $("<span>").attr("data-id", item.certificationID)
											.attr("data-action", "AJAX_removeCertificationEntry")
											.attr("aria-hidden", "true")
											.addClass("glyphicon glyphicon-remove animateClass removeCertificationEntry");

			var		imgCover;

			if((typeof(item.certificationPhotoFolder) != "undefined") && (typeof(item.certificationPhotoFilename) != "undefined") && (item.certificationPhotoFolder.length) && (item.certificationPhotoFilename.length))
				imgCover = $("<img>").addClass("max_100percents_100px  niceborder")
									.attr("src", "/images/certifications/" + item.certificationPhotoFolder + "/" + item.certificationPhotoFilename)
									.attr("data-type", "certification")
									.attr("data-title", item.certificationVendor + " " + item.certificationTrack)
									.data("id", item.certificationInternalID)
									.on("click", DisplaySpecifiedImageModal_Show);
			else
				imgCover = $("<img>").addClass("max_100percents_100px  scale_1_2 cursor_pointer")
									.attr("src", "/images/pages/common/empty_2.png")
									.attr("id", "editProfileCoverCertificationID" + item.certificationInternalID)
									.attr("data-type", "certification")
									.data("id", item.certificationInternalID);

			result = result.add(divRowCertification);

			divRowCertification.append(divCertification.append(paragraphCertification).append(spanVendor).append(", ").append(spanTrack));
			divRowCertification.append(divCover.append(imgCover));
			divRowCertification.append(divCertificationNumber.append("№ ").append(spanNumber));
			// divRowCertification.append(divClose);
		});

		$("div#CertificationPath").append(result);
	};

	var	RenderCoursePath = function()
	{
		var		result = $();

		if(typeof(userProfile) == "undefined")
		{
			return;
		}

		$("div#CoursePath").empty();
		userProfile.courses.sort(function(a, b)
			{
				var		vendorA = a.courseVendor;
				var		vendorB = b.courseVendor;
				var		result;

				if(vendorA == vendorB) { result = 0; }
				if(vendorA < vendorB) { result = 1; }
				if(vendorA > vendorB) { result = -1; }

				return result;
			});
		userProfile.courses.forEach( function(item, i, arr) {
			var		usersCoursesID = item.courseID;
			var		courseID = item.courseInternalID;

			var		divRowCourse = $("<div>").addClass("row")
												.attr("id", "Course" + item.courseID);

			var		divCourse = $("<div>").addClass("col-xs-12 col-sm-7 col-sm-push-1");
			var		divCover = $("<div>").addClass("col-xs-5 col-sm-1 col-sm-pull-7");
			var		divEventTimestamp = $("<div>").addClass("col-xs-7 col-sm-4");
			var		paragraphCourse = $("<p>");
			var		spanVendor = $("<span>").attr("data-id", item.courseID)
													.attr("data-action", "updateCourseVendor")
													.addClass("courseVendor editableSpan")
													.append(item.courseVendor);
			var		spanTrack = $("<span>").attr("data-id", item.courseID)
													.attr("data-action", "updateCourseTrack")
													.addClass("courseTrack editableSpan")
													.append(item.courseTrack);
			var		spanNumber = $("<span>").attr("data-id", item.courseID)
													.attr("data-action", "updateCourseNumber")
													.addClass("courseNumber editableSpan")
													.append(item.courseNumber);

			var		divClose = $("<div>").addClass("col-xs-2");
			var		spanClose = $("<span>").attr("data-id", item.courseID)
											.attr("data-action", "AJAX_removeCourseEntry")
											.attr("aria-hidden", "true")
											.addClass("glyphicon glyphicon-remove animateClass removeCourseEntry");
			var		currDate = new Date();
			var		imgCover;

			var		ratingCallback = function(rating)
									{
										var		id = $(this).data("id");

										$.getJSON('/cgi-bin/index.cgi?action=AJAX_setCourseRating', {id: usersCoursesID, rating: rating, rand: Math.round(Math.random() * 100000000)})
										.done(function(data) {
											if(data.result == "success")
											{	
											}
											else
											{
											  console.debug("ratingCallback: ERROR: " + data.description);
											}
										});
										
										userProfile.courses.forEach(function(item, i, arr)
										{
											if((typeof(item.courseInternalID) != "undefined") && (item.courseInternalID == courseID))
												userProfile.courses[i].courseRating = rating;
										});
									};

			if((typeof(item.coursePhotoFolder) != "undefined") && (typeof(item.coursePhotoFilename) != "undefined") && (item.coursePhotoFolder.length) && (item.coursePhotoFilename.length))
				imgCover = $("<img>").addClass("max_100percents_100px  niceborder")
									.attr("src", "/images/certifications/" + item.coursePhotoFolder + "/" + item.coursePhotoFilename)
									.attr("data-type", "course")
									.attr("data-title", item.courseVendor + " " + item.courseTrack)
									.data("id", item.courseInternalID)
									.on("click", DisplaySpecifiedImageModal_Show);
			else
				imgCover = $("<img>").addClass("max_100percents_100px  scale_1_2 cursor_pointer")
									.attr("src", "/images/pages/common/empty_2.png")
									.attr("id", "editProfileCoverCourseID" + item.courseInternalID)
									.attr("data-type", "course")
									.data("id", item.courseInternalID);

			result = result.add(divRowCourse);

			divRowCourse.append(divCourse.append(paragraphCourse).append(spanVendor).append(": ").append(spanTrack).append("<br>").append(system_calls.RenderRating("editProfileCourseRating" + courseID, item.courseRating, ratingCallback)));
			divRowCourse.append(divCover.append(imgCover));
			divRowCourse.append(divEventTimestamp.append(system_calls.GetLocalizedDateInHumanFormatMsecSinceEvent(currDate.getTime() - item.eventTimestamp*1000)));
			// divRowCourse.append(divClose);
		});

		$("div#CoursePath").append(result);

	};

	var	RenderSchoolPath = function()
	{
		var		result = $();

		if(typeof(userProfile) == "undefined")
		{
			return;
		}

		$("div#SchoolPath").empty();
		userProfile.school.sort(function(a, b)
			{
				var		occupationStartA = parseInt(a.schoolOccupationStart);
				var		occupationStartB = parseInt(b.schoolOccupationStart);
				var		result;

				if(occupationStartA == occupationStartB) { result = 0; }
				if(occupationStartA < occupationStartB) { result = 1; }
				if(occupationStartA > occupationStartB) { result = -1; }

				return result;
			});
		userProfile.school.forEach( function(item, i, arr) {
			var		divRowSchool = $("<div>").addClass("row")
											.attr("id", "School" + item.schoolID);

			var		divSchoolTitle = $("<div>").addClass("col-xs-12 col-sm-7 col-sm-push-1");
			var		divCover = $("<div>").addClass("col-xs-5 col-sm-1 col-sm-pull-7");
			var		divSchoolOccupation = $("<div>").addClass("col-xs-7 col-sm-4");
			var		paragraphSchool = $("<p>");
			var		spanOccupationStart = $("<span>").attr("data-id", item.schoolID)
													.attr("data-action", "updateSchoolOccupationStart")
													.addClass("schoolOccupationStart editableSelectYears19302017")
													.append(item.schoolOccupationStart);
			var		spanOccupationFinish = $("<span>").attr("data-id", item.schoolID)
													.attr("data-action", "updateSchoolOccupationFinish")
													.addClass("schoolOccupationFnish editableSelectYears19302017")
													.append(item.schoolOccupationFinish);
			var		spanLocality = $("<span>").attr("data-id", item.schoolID)
													.attr("data-action", "updateSchoolLocality")
													.addClass("schoolLocality editableSpan")
													.append(item.schoolLocality);
			var		spanTitle = $("<span>").attr("data-id", item.schoolID)
													.attr("data-action", "updateSchoolTitle")
													.addClass("schoolTitle editableSpan")
													.append(item.schoolTitle);

			var		divClose = $("<div>").addClass("col-xs-2");
			var		spanClose = $("<span>").attr("data-id", item.schoolID)
											.attr("data-action", "AJAX_removeSchoolEntry")
											.attr("aria-hidden", "true")
											.addClass("glyphicon glyphicon-remove animateClass removeSchoolEntry");

			var		imgCover;

			if((typeof(item.schoolPhotoFolder) != "undefined") && (typeof(item.schoolPhotoFilename) != "undefined") && (item.schoolPhotoFolder.length) && (item.schoolPhotoFilename.length))
				imgCover = $("<img>").addClass("max_100percents_100px  niceborder")
									.attr("src", "/images/schools/" + item.schoolPhotoFolder + "/" + item.schoolPhotoFilename)
									.attr("data-type", "school")
									.attr("data-title", item.schoolLocality + " школа " + item.schoolTitle)
									.data("id", item.schoolInternalID)
									.on("click", DisplaySpecifiedImageModal_Show);
			else
				imgCover = $("<img>").addClass("max_100percents_100px  scale_1_2 cursor_pointer")
									.attr("src", "/images/pages/common/empty_2.png")
									.attr("id", "editProfileCoverSchoolID" + item.schoolInternalID)
									.attr("data-type", "school")
									.data("id", item.schoolInternalID);


			result = result.add(divRowSchool);

			divRowSchool.append(divSchoolTitle.append(paragraphSchool).append(spanLocality).append(" школа ").append(spanTitle));
			divRowSchool.append(divCover.append(imgCover));
			divRowSchool.append(divSchoolOccupation.append(spanOccupationStart).append(" - ").append(spanOccupationFinish));
			// divRowSchool.append(divClose);
		});

		$("div#SchoolPath").append(result);
	};

	var	RenderUniversityPath = function()
	{
		var		result = $();
		var		educationInTitle = "";

		if(typeof(userProfile) == "undefined")
		{
			return;
		}

		$("div#UniversityPath").empty();
		userProfile.university.sort(function(a, b)
			{
				var		occupationStartA = parseInt(a.universityOccupationStart);
				var		occupationStartB = parseInt(b.universityOccupationStart);
				var		result;

				if(occupationStartA == occupationStartB) { result = 0; }
				if(occupationStartA < occupationStartB) { result = 1; }
				if(occupationStartA > occupationStartB) { result = -1; }

				return result;
			});
		userProfile.university.forEach( function(item, i, arr) {
			var		divRowUniversity = $("<div>").addClass("row")
											.attr("id", "University" + item.universityID);

			var		divUniversityTitle = $("<div>").addClass("col-xs-12 col-sm-7 col-sm-push-1");
			var		divCover = $("<div>").addClass("col-xs-5 col-sm-1 col-sm-pull-7");
			var		divUniversityOccupation = $("<div>").addClass("col-xs-7 col-sm-4");
			var		paragraphUniversity = $("<p>");
			var		spanOccupationStart = $("<span>").attr("data-id", item.universityID)
													.attr("data-action", "updateUniversityOccupationStart")
													.addClass("UniversityOccupationStart editableSelectYears19302017")
													.append(item.universityOccupationStart);
			var		spanOccuopationFinish = $("<span>").attr("data-id", item.universityID)
													.attr("data-action", "updateUniversityOccupationFinish")
													.addClass("UniversityOccupationFnish editableSelectYears19302017")
													.append(item.universityOccupationFinish);
			var		spanDegree = $("<span>").attr("data-id", item.universityID)
													.attr("data-action", "updateUniversityDegree")
													.addClass("UniversityRegion editableSelectUniversityDegree")
													.append(item.universityDegree);
			var		spanRegion = $("<span>").attr("data-id", item.universityID)
													.attr("data-action", "updateUniversityRegion")
													.addClass("UniversityRegion editableSpan")
													.append(item.universityRegion);
			var		spanTitle = $("<span>").attr("data-id", item.universityID)
													.attr("data-action", "updateUniversityTitle")
													.addClass("UniversityTitle editableSpan")
													.append(item.universityTitle);

			var		divClose = $("<div>").addClass("col-xs-2");
			var		spanClose = $("<span>").attr("data-id", item.universityID)
											.attr("data-action", "AJAX_removeUniversityEntry")
											.attr("aria-hidden", "true")
											.addClass("glyphicon glyphicon-remove animateClass removeUniversityEntry");

			var		imgCover;

			if((typeof(item.universityPhotoFolder) != "undefined") && (typeof(item.universityPhotoFilename) != "undefined") && (item.universityPhotoFolder.length) && (item.universityPhotoFilename.length))
				imgCover = $("<img>").addClass("max_100percents_100px  niceborder")
									.attr("src", "/images/universities/" + item.universityPhotoFolder + "/" + item.universityPhotoFilename)
									.attr("data-type", "university")
									.attr("data-title", item.universityTitle)
									.data("id", item.universityInternalID)
									.on("click", DisplaySpecifiedImageModal_Show);
			else
				imgCover = $("<img>").addClass("max_100percents_100px  scale_1_2 cursor_pointer")
									.attr("src", "/images/pages/common/empty_2.png")
									.attr("id", "editProfileCoverUniversityID" + item.universityInternalID)
									.attr("data-type", "university")
									.data("id", item.universityInternalID);

			result = result.add(divRowUniversity);

			divRowUniversity.append(divUniversityTitle.append(paragraphUniversity).append(spanDegree).append(" в ").append(spanTitle).append(" (").append(spanRegion).append(")"));
			divRowUniversity.append(divCover.append(imgCover));
			divRowUniversity.append(divUniversityOccupation.append(spanOccupationStart).append(" - ").append(spanOccuopationFinish));
			// divRowUniversity.append(divClose);

			educationInTitle += item.universityTitle + "<br>";
		});

		$("p#educationInTitle").html(educationInTitle);
		$("div#UniversityPath").append(result);
	};

	var	RenderLanguagePath = function()
	{
		var		result = $();

		if(typeof(userProfile) == "undefined")
		{
			return;
		}

		$("div#LanguagePath").empty();
		userProfile.language.sort(function(a, b)
			{
				var		titleA = a.languageTitle;
				var		titleB = b.languageTitle;
				var		result;

				if(titleA == titleB) { result = 0; }
				if(titleA > titleB) { result = 1; }
				if(titleA < titleB) { result = -1; }

				return result;
			});
		userProfile.language.forEach( function(item, i, arr) {
			var		divRowLanguage = $("<div>").addClass("row")
												.attr("id", "Language" + item.languageID);

			var		divCover = $("<div>").addClass("col-xs-5 col-sm-1");
			var		divLanguage = $("<div>").addClass("col-xs-7 col-sm-11");
			var		paragraphLanguage = $("<p>");
			var		spanTitle = $("<span>").attr("data-id", item.languageID)
													.attr("data-action", "updateLanguageTitle")
													.addClass("LanguageTitle editableSpan")
													.append(item.languageTitle);
			var		spanLevel = $("<span>").attr("data-id", item.languageID)
													.attr("data-action", "updateLanguageLevel")
													.addClass("LanguageLevel editableSelectLanguageLevel")
													.append(item.languageLevel);

			var		divClose = $("<div>").addClass("col-xs-2");
			var		spanClose = $("<span>").attr("data-id", item.languageID)
											.attr("data-action", "AJAX_removeLanguageEntry")
											.attr("aria-hidden", "true")
											.addClass("glyphicon glyphicon-remove animateClass removeLanguageEntry");
			var		imgCover;

			if((typeof(item.languagePhotoFolder) != "undefined") && (typeof(item.languagePhotoFilename) != "undefined") && (item.languagePhotoFolder.length) && (item.languagePhotoFilename.length))
				imgCover = $("<img>").addClass("max_100percents_100px  niceborder")
									.attr("src", "/images/flags/" + item.languagePhotoFolder + "/" + item.languagePhotoFilename)
									.attr("data-type", "language")
									.attr("data-title", item.languageTitle)
									.data("id", item.languageInternalID)
									.on("click", DisplaySpecifiedImageModal_Show);
			else
				imgCover = $("<img>").addClass("max_100percents_100px  scale_1_2 cursor_pointer")
									.attr("src", "/images/pages/common/empty_2.png")
									.attr("id", "editProfileCoverLanguageID" + item.languageInternalID)
									.attr("data-type", "language")
									.data("id", item.languageInternalID);

			result = result.add(divRowLanguage);

			divRowLanguage.append(divCover.append(imgCover));
			divRowLanguage.append(divLanguage.append(paragraphLanguage.append(spanTitle).append(" - ").append(spanLevel)));
			// divRowLanguage.append(divClose);
		});

		$("div#LanguagePath").append(result);

	};

	var	RenderSkillPath = function()
	{
		var		result = $();

		if(typeof(userProfile) == "undefined")
		{
			return;
		}

		$("div#SkillPath").empty();
		userProfile.skill.sort(function(a, b)
			{
				var		titleA = a.skillConfirmed.length;
				var		titleB = b.skillConfirmed.length;
				var		result;

				if(titleA == titleB) { result = 0; }
				if(titleA > titleB) { result = -1; }
				if(titleA < titleB) { result = +1; }

				return result;
			});
		userProfile.skill.forEach( function(item, i, arr) {
			var		divRowSkill = $("<div>").addClass("row")
											.attr("id", "skill" + item.skillID);

			var		divSkill = $("<div>").addClass("col-xs-12 col-sm-5 col-sm-offset-1");
			var		paragraphSkill = $("<p>");
			var		spanTitle = $("<span>").attr("data-id", item.skillID)
											.attr("data-action", "updateSkillTitle")
											.addClass("skillTitle editableSpan")
											.append(item.skillTitle.substr(0, 64) + (item.skillTitle.length > 64 ? " ..." : ""));

			var		isSkillConfirmed = (item.skillConfirmed.indexOf($("#myUserID").data("myuserid")) >= 0);

			var		spanAction = $("<span>").attr("data-id", item.skillID)
											.attr("data-action", (isSkillConfirmed ? "viewProfile_SkillReject" : "viewProfile_SkillApprove"))
											.attr("data-placement", "top")
											.attr("data-toggle", "tooltip")
											.attr("title", (isSkillConfirmed ? "согласен" : "не согласен"))
											.addClass("cursor_pointer label " + (isSkillConfirmed ? "label-primary" : "label-default"))
											.append((isSkillConfirmed ? "+" : "-"))
											.on("click", SkillConfirmationClickHandler);

			var		divApprovers = $("<div>").addClass("col-sm-6 hidden-xs");
			var		spanApprovers;

			item.skillConfirmed.forEach(function(item1, i1, arr1) {
				// --- maximum 10 avatars displayed
				if(i1 < 10)
				{
					spanApprovers = $("<span>").attr("data-id", item.skillID)
													.attr("data-approverID", item1)
													.attr("aria-hidden", "true")
													.addClass("animateClass");

					if(userCache.isUserCached(item1))
					{
						var		user = userCache.GetUserByID(item1);
						var		canvas = $("<canvas>").attr("height", "30")
														.attr("width", "30");
						var		href = $("<a>").attr("href", "/userprofile/" + user.id);
						DrawUserAvatar(canvas[0].getContext("2d"), user.avatar, user.name, user.nameLast);

						canvas.attr("data-toggle", "tooltip")
									.attr("data-placement", "top")
									.attr("title", user.name + " " + user.nameLast);
						// spanApprovers.append("[" + item1 + "]").append(" ");
						spanApprovers.append(href.append(canvas)).append(" ");
					}
					else
					{
						spanApprovers.append($("<img>").attr("src", "/images/pages/common/user_icon" + (Math.floor(Math.random() * 6) + 1) + ".png").addClass("height_34px"));

						userCache.AddUserIDForFutureUpdate(item1);
					}

					divApprovers.append(spanApprovers);
				}
				// --- last sign is "..."
				if(i1 == 10)
				{
					spanApprovers = $("<span>").append("...");
					
					divApprovers.append(spanApprovers);
				}
			});

			result = result.add(divRowSkill);

			divRowSkill.append(divSkill.append(paragraphSkill.append(spanTitle).append("&nbsp;").append(spanAction)));
			divRowSkill.append(divApprovers);
		}); // --- forEach skill

		$("div#SkillPath").append(result);
		$("div#SkillPath [data-toggle=\"tooltip\"]").tooltip({ animation: "animated bounceIn"});

		userCache.AddCallbackRunsAfterCacheUpdate(view_profile.RenderSkillPath);
		window.setTimeout(userCache.RequestServerToUpdateCache, 1000);
	};

	var	RenderBookPath = function()
	{
		var		result = $();

		if(typeof(userProfile) == "undefined")
		{
			return;
		}

		$("div#BookPath").empty();
		userProfile.books.sort(function(a, b)
			{
				var		timestampA = parseFloat(a.bookReadTimestamp);
				var		timestampB = parseFloat(b.bookReadTimestamp);
				var		result;

				if(timestampA == timestampB) { result = 0; }
				if(timestampA > timestampB) { result = -1; }
				if(timestampA < timestampB) { result = 1; }

				return result;
			});
		userProfile.books.forEach( function(item, i, arr) {
			var		bookID = item.bookID;
			var		usersBooksID = item.id;

			var		divRowBook = $("<div>").addClass("row margin_top_10")
												.attr("id", "Book" + item.id);
			var		divBook = $("<div>").addClass("col-xs-12 col-sm-7 col-sm-push-1");
			var		divCover = $("<div>").addClass("col-xs-5 col-sm-1 col-sm-pull-7");
			var		divTimestamp = $("<div>").addClass("col-xs-7 col-sm-4");

			var		paragraphBook = $("<p>");
			var		spanTitle = $("<span>").attr("data-id", item.id)
													.attr("data-action", "updateBookTitle")
													.attr("data-script", "book.cgi")
													.addClass("bookTitle")
													.append(item.bookTitle);
			var		spanAuthorName = $("<span>").attr("data-id", item.id)
													.attr("data-action", "updateBookAuthor")
													.attr("data-script", "book.cgi")
													.addClass("bookAuthor")
													.append(item.bookAuthorName);

			var		spanTimestamp = $("<span>").addClass("bookReadTimestamp editableSpan formatDate")
												.append(system_calls.GetLocalizedDateNoTimeFromSeconds(item.bookReadTimestamp))
												.data("id", item.id)
												.data("action", "updateBookReadTimestamp")
												.data("script", "book.cgi");
			var		currDate = new Date();
			var		imgCover;

			var		ratingCallback = function(rating)
									{
										var		id = $(this).data("id");

										$.getJSON('/cgi-bin/book.cgi?action=AJAX_setBookRating', {id: usersBooksID, rating: rating, rand: Math.round(Math.random() * 100000000)})
										.done(function(data) {
											if(data.result == "success")
											{	
											}
											else
											{
											  console.debug("ratingCallback: ERROR: " + data.description);
											}
										});
										
										userProfile.books.forEach(function(item, i, arr)
										{
											if((typeof(item.bookID) != "undefined") && (item.bookID == bookID))
												userProfile.books[i].bookRating = rating;
										});
									};


			if((typeof(item.bookCoverPhotoFolder) != "undefined") && (typeof(item.bookCoverPhotoFilename) != "undefined") && (item.bookCoverPhotoFolder.length) && (item.bookCoverPhotoFilename.length))
				imgCover = $("<img>").addClass("max_100percents_100px div_content_center_alignment niceborder")
									.attr("src", "/images/books/" + item.bookCoverPhotoFolder + "/" + item.bookCoverPhotoFilename)
									.attr("data-type", "book")
									.attr("data-title", item.bookAuthorName + ": " + item.bookTitle)
									.on("click", DisplaySpecifiedImageModal_Show);

			else
				imgCover = $("<img>").addClass("max_100percents_100px div_content_center_alignment scale_1_2")
									.attr("src", "/images/pages/news_feed/empty_book.jpg")
									.attr("id", "editProfileCoverBookID" + item.bookID)
									// .on("click", AddBookCoverUploadClickHandler)
									.data("id", item.bookID);

			result = result.add(divRowBook);

			paragraphBook.append(spanTitle)
						.append(" (")
						.append(spanAuthorName)
						.append(")<br>")
						.append(system_calls.RenderRating("editProfileBookRating" + item.bookID, item.bookRating, ratingCallback));

			divRowBook	.append(divBook.append(paragraphBook))
						.append(divCover.append(imgCover))
						.append(divTimestamp.append(system_calls.GetLocalizedDateInHumanFormatMsecSinceEvent(currDate.getTime() - item.bookReadTimestamp*1000)));
		});

		$("div#BookPath").append(result);
	};

	var	RenderSubscriptionCompanies = function()
	{
		var		result = $();

		if(typeof(userProfile) == "undefined")
		{
			return;
		}

		$("div#SubscriptionsCompany").empty();
		userProfile.subscriptions.sort(function(a, b)
			{
				var		titleA;
				var		titleB;
				var		result;

				if(a.entity_type == "company") titleA = a.company[0].name;
				if(a.entity_type == "group") titleA = a.group[0].title;
				if(b.entity_type == "company") titleB = b.company[0].name;
				if(b.entity_type == "group") titleB = b.group[0].title;

				if(titleA == titleB) { result = 0; }
				if(titleA > titleB) { result = -1; }
				if(titleA < titleB) { result = 1; }

				return titleA.localeCompare(titleB);
			});
		userProfile.subscriptions.forEach( function(item, i, arr) {
			if(item.entity_type == "company")
			{
				var		companyID = item.company[0].id;

				var		divRow = $("<div>").addClass("row margin_top_10")
											.attr("id", "company" + item.company[0].id);
				var		divCompany = $("<div>").addClass("col-xs-7 col-sm-11");
				var		divCover = $("<div>").addClass("col-xs-5 col-sm-1");

				var		paragraphCompany = $("<p>");
				var		linkToCompany = $("<a>").attr("href", "/company/" + item.company[0].link + "?random=" + system_calls.GetUUID())
												.append(item.company[0].name);
				var		spanTitle = $("<span>").attr("data-id", item.company[0].id)
												.attr("data-action", "updateCompanyTitle")
												.attr("data-script", "company.cgi")
												.addClass("companyTitle")
												.append(linkToCompany);

				var		spanTimestamp = $("<span>").addClass("companyReadTimestamp editableSpan formatDate")
													.append(system_calls.GetLocalizedDateNoTimeFromSeconds(item.company[0].eventTimestamp))
													.data("id", item.company[0].id)
													.data("action", "updateCompanyReadTimestamp")
													.data("script", "company.cgi");
				var		currDate = new Date();
				var		imgCover;

				if((typeof(item.company[0].logo_folder) != "undefined") && (typeof(item.company[0].logo_filename) != "undefined") && (item.company[0].logo_folder.length) && (item.company[0].logo_filename.length))
					imgCover = $("<img>").addClass("max_100percents_100px div_content_center_alignment niceborder")
										.attr("src", "/images/companies/" + item.company[0].logo_folder + "/" + item.company[0].logo_filename)
										.attr("data-type", "company")
										.attr("data-title", item.company[0].name)
										.on("click", DisplaySpecifiedImageModal_Show);

				else
				{
					imgCover = $("<canvas>").addClass("div_content_center_alignment")
											.attr("height", "50")
											.attr("width", "50");

					DrawUserAvatar(imgCover[0].getContext("2d"), "", item.company[0].name, item.company[0].nameLast);
/*
					imgCover = $("<img>").addClass("max_100percents_100px div_content_center_alignment scale_1_2")
										.attr("src", "/images/pages/common/empty_2.png")
										.attr("id", "editProfileCoverCompanyID" + item.company[0].id)
										// .on("click", AddCompanyCoverUploadClickHandler)
										.data("id", item.company[0].id);
*/
				}

				result = result.add(divRow);

				paragraphCompany.append(spanTitle);

				divRow	.append(divCover.append(imgCover))
						.append(divCompany.append(paragraphCompany));
						// .append(divTimestamp.append(system_calls.GetLocalizedDateInHumanFormatMsecSinceEvent(currDate.getTime() - item.eventTimestamp*1000)));
			}
		});

		$("div#SubscriptionsCompany").append(result);
	};

	var	RenderSubscriptionGroups = function()
	{
		var		result = $();

		if(typeof(userProfile) == "undefined")
		{
			return;
		}

		$("div#SubscriptionsGroup").empty();
		userProfile.subscriptions.sort(function(a, b)
			{
				var		titleA;
				var		titleB;
				var		result;

				if(a.entity_type == "company") titleA = a.company[0].name;
				if(a.entity_type == "group") titleA = a.group[0].title;
				if(b.entity_type == "company") titleB = b.company[0].name;
				if(b.entity_type == "group") titleB = b.group[0].title;

				if(titleA == titleB) { result = 0; }
				if(titleA > titleB) { result = -1; }
				if(titleA < titleB) { result = 1; }

				return titleA.localeCompare(titleB);
			});
		userProfile.subscriptions.forEach( function(item, i, arr) {
			if(item.entity_type == "group")
			{
				var		groupID = item.group[0].id;

				var		divRow = $("<div>").addClass("row margin_top_10")
											.attr("id", "group" + item.group[0].id);
				var		divGroup = $("<div>").addClass("col-xs-7 col-sm-11");
				var		divCover = $("<div>").addClass("col-xs-5 col-sm-1");

				var		paragraphGroup = $("<p>");
				var		linkToGroup = $("<a>").attr("href", "/group/" + item.group[0].link + "?random=" + system_calls.GetUUID())
												.append(item.group[0].title);
				var		spanTitle = $("<span>").attr("data-id", item.group[0].id)
												.attr("data-action", "updateGroupTitle")
												.attr("data-script", "group.cgi")
												.addClass("groupTitle")
												.append(linkToGroup);

				var		spanTimestamp = $("<span>").addClass("groupReadTimestamp editableSpan formatDate")
													.append(system_calls.GetLocalizedDateNoTimeFromSeconds(item.group[0].eventTimestamp))
													.data("id", item.group[0].id)
													.data("action", "updateGroupReadTimestamp")
													.data("script", "group.cgi");
				var		currDate = new Date();
				var		imgCover;

				if((typeof(item.group[0].logo_folder) != "undefined") && (typeof(item.group[0].logo_filename) != "undefined") && (item.group[0].logo_folder.length) && (item.group[0].logo_filename.length))
					imgCover = $("<img>").addClass("max_100percents_100px div_content_center_alignment niceborder")
										.attr("src", "/images/groups/" + item.group[0].logo_folder + "/" + item.group[0].logo_filename)
										.attr("data-type", "group")
										.attr("data-title", item.group[0].title)
										.on("click", DisplaySpecifiedImageModal_Show);

				else
				{
					imgCover = $("<canvas>").addClass("div_content_center_alignment")
											.attr("height", "50")
											.attr("width", "50");

					system_calls.RenderCompanyLogo(imgCover[0].getContext("2d"), "", item.group[0].title, "");


/*					imgCover = $("<img>").addClass("max_100percents_100px div_content_center_alignment scale_1_2")
										.attr("src", "/images/pages/common/empty_2.png")
										.attr("id", "editProfileCoverGroupID" + item.group[0].id)
										// .on("click", AddGroupCoverUploadClickHandler)
										.data("id", item.group[0].id);
*/				}

				result = result.add(divRow);

				paragraphGroup.append(spanTitle);

				divRow	.append(divCover.append(imgCover))
						.append(divGroup.append(paragraphGroup));
						// .append(divTimestamp.append(system_calls.GetLocalizedDateInHumanFormatMsecSinceEvent(currDate.getTime() - item.eventTimestamp*1000)));
			}
		});

		$("div#SubscriptionsGroup").append(result);
	};

	var	RenderControlButtons = function()
	{
		if(typeof(userProfile) == "undefined") return;
		
		$("#linkToUserChat").attr("href", "/chat/" + userProfile.userID + "?rand=" + system_calls.GetUUID());
		$("#linkToUserWall").attr("href", "/userid/" + userProfile.userID + "?rand=" + system_calls.GetUUID());
	};

	var	RenderBirthday = function()
	{
		if(typeof(userProfile) == "undefined") return;

		if(userProfile.birthday.length)
		{
			$("#birthdayPlace").empty().append(system_calls.ConvertDateRussiaToHumanFullMonth(userProfile.birthday));
		}
		else
		{
			$("#birthdayDiv").hide();
		}
	};

	var	RenderCity = function()
	{
		if(typeof(userProfile) == "undefined") return;

		if(userProfile.city.length)
		{
			$("#city").empty().append(userProfile.city);
		}
		else
		{
			$("#cityDiv").hide();
		}
	};

	var	RenderRecommendationPath = function()
	{
		var		result = $();

		if(typeof(userProfile) == "undefined")
		{
			return;
		}

		$("div#RecommendationPath").empty();
		userProfile.recommendation.sort(function(a, b)
			{
				var		timestampA = parseInt(a.recommendationTimestamp);
				var		timestampB = parseInt(b.recommendationTimestamp);
				var		result;

				if(timestampA == timestampB) { result = 0; }
				if(timestampA > timestampB) { result = -1; }
				if(timestampA < timestampB) { result = +1; }

				return result;
			});
		userProfile.recommendation.forEach( function(item, i, arr) {

			// --- if user recommendation haven't been checked by admin or confirmed and clean.
			if((item.recommendationState == "unknown") || (item.recommendationState == "clean"))
			{
				var		isMine = (item.recommendationRecommendedUserID == myUserID) || (item.recommendationRecommendingUserID == myUserID);
				var		divRowTitle = $("<div>").addClass("row")
												.attr("id", "titleRecommendation" + item.recommendationID);
				var		divFriendTitle = $("<div>").addClass("col-xs-6 col-sm-8");
				var		divFriendTimestamp = $("<div>").addClass("col-xs-4 col-sm-2")
													   .append($("<h6>").append($("<small>").append(system_calls.GetLocalizedDateFromSeconds(item.recommendationTimestamp))));
				var		divFriendClose = $("<div>").addClass("col-xs-2");
				var		spanClose = $("<span>").attr("data-id", item.recommendationID)
												.attr("data-action", "AJAX_removeRecommendationEntry")
												.attr("aria-hidden", "true")
												.addClass(isMine ? "glyphicon glyphicon-remove animateClass removeRecommendationEntry" : "");

				var		divRowRecommendation = $("<div>").addClass("row")
														.attr("id", "rowRecommendation" + item.recommendationID);
				var		divRecommendation = $("<div>").addClass("col-xs-10 col-sm-9 col-sm-offset-1");
				var		paragraphRecommendation = $("<p>").attr("id", "recommendation" + item.recommendationID)
														.attr("data-id", item.recommendationID)
														.attr("data-action", "updateRecommendationTitle")
														.addClass("recommendationTitle" + (item.recommendationRecommendingUserID == myUserID ? " editableParagraph " : "") )
														.append(item.recommendationTitle);


				// --- user row rendering
				if(userCache.isUserCached(item.recommendationRecommendingUserID))
				{
					var		user = userCache.GetUserByID(item.recommendationRecommendingUserID);

					var		canvas = $("<canvas>").attr("height", "30")
													.attr("width", "30");
					var		href1 = $("<a>").attr("href", "/userprofile/" + user.id);
					var		href2 = $("<a>").attr("href", "/userprofile/" + user.id);

					DrawUserAvatar(canvas[0].getContext("2d"), user.avatar, user.name, user.nameLast);

					canvas.attr("data-toggle", "tooltip")
								.attr("data-placement", "top")
								.attr("title", user.name + " " + user.nameLast);

					divFriendTitle.append($("<span>").append(href1.append(canvas)))
								  .append(" ")
								  .append($("<span>").addClass("vertical_align_top")
								  					 .append(href2.append(user.name + " " + user.nameLast).addClass("vertical_align_top"))
								  					 .append(system_calls.GetGenderedPhrase(user, " написал(а):", " написал:", " написала:")));
				}
				else
				{
					userCache.AddUserIDForFutureUpdate(item.recommendationRecommendingUserID);

					// divFriendTitle.append(item.recommendationRecommendingUserID);
					divFriendTitle.append($("<img>").attr("src", "/images/pages/common/user_icon" + (Math.floor(Math.random() * 6) + 1) + ".png").addClass("height_34px"));
				}

				divRowTitle.append(divFriendTitle).append(divFriendTimestamp).append(divFriendClose.append(spanClose));
				divRowRecommendation.append(divRecommendation.append(paragraphRecommendation));

				result = result.add(divRowTitle);
				result = result.add(divRowRecommendation);
			}
		}); // --- forEach Recommendation

		$("div#RecommendationPath").append(result);
		$("div#RecommendationPath [data-toggle=\"tooltip\"]").tooltip({ animation: "animated bounceIn"});

		$("div#RecommendationPath p.editableParagraph").on("click", editableFuncReplaceToTextarea);
		$("div#RecommendationPath p.editableParagraph").mouseenter(editableFuncHighlightBgcolor);
		$("div#RecommendationPath p.editableParagraph").mouseleave(editableFuncNormalizeBgcolor);

		$("div#RecommendationPath .removeRecommendationEntry").on("click", RemoveRecommendationEntry);

		userCache.AddCallbackRunsAfterCacheUpdate(view_profile.RenderRecommendationPath);
		window.setTimeout(userCache.RequestServerToUpdateCache, 1000);
	};

	var		SkillConfirmationClickHandler = function(event)
	{
		var		currTag = $(this);
		var		currTagAction = currTag.data("action");
		var		currTagID = currTag.data("id");
		var		myUserID = parseInt($("#myUserID").data("myuserid"));

		$.getJSON('/cgi-bin/index.cgi', {action:currTagAction, id:currTagID})
			.done(function(data) {
				if(data.result === "success")
				{
				}
				else
				{
					console.debug("SkillConfirmationClickHandler: ERROR: " + data.description);
				}
			});
		
		// --- improve UseExpirience to avoid delay in server response
		if(currTagAction == "viewProfile_SkillApprove")
		{
			userProfile.skill.forEach(function(item, i, arr)
			{
				if(item.skillID == currTagID)
				{
					if(item.skillConfirmed.indexOf(myUserID) < 0)
					{
						item.skillConfirmed.push(myUserID);	
					}
				}
			});
		}
		if(currTagAction == "viewProfile_SkillReject")
		{
			userProfile.skill.forEach(function(item, i, arr)
			{
				if(item.skillID == currTagID)
				{
					if(item.skillConfirmed.indexOf(myUserID) >= 0)
					{
						item.skillConfirmed.splice(item.skillConfirmed.indexOf(myUserID), 1);	
					}
				}
			});
		}

		RenderSkillPath();
	};

	// --- Recommendation
	var AddRecommendationPathCollapsibleZeroize = function()
	{
		$("div#AddRecommendation textarea#AddRecommendationTitle" ).val("").parent().removeClass("has-feedback has-success has-error");
	};

	var AddRecommendationPathToggleCollapsible = function()
	{
		$("#AddRecommendation").collapse("toggle");
	};

	var AddRecommendationPathCollapsibleInit = function()
	{
		$("div#AddRecommendation button#AddRecommendationAddButton").on("click", AddRecommendationAddButtonClickHandler);
		$("div#AddRecommendation button#AddRecommendationCancelButton").on("click", AddRecommendationPathToggleCollapsible);
	};

	var AddRecommendationAddButtonClickHandler = function()
	{
		var		isClearToAdd = 1;

		addRecommendation.AddRecommendationTitle = $("textarea#AddRecommendationTitle").val();

		if(addRecommendation.AddRecommendationTitle === "")
		{
			isClearToAdd = 0;
			$("#AddRecommendationTitle").popover({"content": "Напишите рекомендацию."})
								.popover("show")
								.parent().removeClass("has-success")
										.addClass("has-feedback has-error");
			setTimeout(function () 
				{
					$("#AddRecommendationTitle").popover("destroy");
				}, 3000);
		}
		else
		{
			$("#AddRecommendationTitle").parent().removeClass("has-error").addClass("has-feedback has-success");
		}

		if(isClearToAdd)
		{
			var		currDate = new Date();

			AddRecommendationPathToggleCollapsible();

			$.post('/cgi-bin/index.cgi?rand=' + Math.floor(Math.random() * 1000000000), 
							{
								"action" : "AJAX_addViewProfileAddRecommendation",
								"title": system_calls.FilterUnsupportedUTF8Symbols(addRecommendation.AddRecommendationTitle),
								"recommendedUserID": friendUserID,
								"eventTimestamp": currDate.getTime() / 1000 
							})
			.done(function(data) {
				var		resultJSON = JSON.parse(data);
				if(resultJSON.result == "success")
				{
					var newRecommendationID = resultJSON.recommendationID;
					var	newRecommendationObj = {
											"recommendationID": newRecommendationID,
											"recommendationTitle": system_calls.ConvertTextToHTML(addRecommendation.AddRecommendationTitle),
											"recommendationRecommendedUserID": friendUserID,
											"recommendationRecommendingUserID": myUserID,
											"recommendationTimestamp": currDate.getTime() / 1000, 
											"recommendationState": "unknown"
										};

					userProfile.recommendation.push(newRecommendationObj);

					RenderRecommendationPath();

					AddRecommendationPathCollapsibleZeroize();			
				}
				else
				{
					console.debug("AddRecommendationAddButtonClickHandler: ERROR: adding new recommendation path (" + resultJSON.description + ")");
				}
			});
		}
	};

	var		AddRecommendationTemplateToTextarea = function(templateNum)
	{
		var		templates = [
"Я считаю, что профессиональные навыки и личностные качества сотрудника позволяют мне рекомендовать его для дальнейшей работы в аналогичной сфере деятельности, и я надеюсь, что приобретенный опыт работы позволит ему и далее быть востребованным специалистом. Желаю ему дальнейших успехов в профессиональной сфере.",
"За время работы сотрудник зарекомендовал себя трудолюбивым, добросовестным, исполнительным и инициативным работником, пользующемся уважением и авторитетом в коллективе и у руководства. Сильное впечатление производит умение сотрудника организовать свою работу так, чтобы успевать сделать всё вовремя или даже раньше установленного срока. Я считаю, что сотрудник обладает всеми необходимыми качествами и профессиональными навыками в своей профессиональной сфере.",
"За время своей работы под нашим руководством сотрудник зарекомендовал себя как прекрасный специалист, обеспечивший сопровождение всех международные аспектов деятельности компании. За короткий срок он создал под своим началом команду профессионалов и стал в ней безусловным лидером. Сотрудник создал с своем коллективе прекрасный деловой и психологический климат, о чем свидетельствуют как достигнутые нашим отделом результаты, так и низкая текучесть кадров в подразделении. Высокие профессиональные и человеческие качества сотрудника позволили наладить доверительные отношения как с руководством головного офиса, так и с многочисленными деловыми партнерами нашей компании.",
"Сотрудник зарекомендовал себя как квалифицированный специалист, способный принимать решения и нести ответственность за конечный результат. Сотруднику присущи высокая работоспособность, коммуникабельность и доброжелательность. Особенно хочется подчеркнуть его умение ладить с клиентами и бесконфликтно решать возникающие вопросы. Профессиональные навыки и личностные качества сотрудника позволяют рекомендовать его для дальнейшей работы на аналогичной должности. Мы надеемся, что приобретенный опыт работы позволит сотруднику быть востребованным специалистом и желаем ему дальнейших успехов в профессиональной сфере."
		];
		$("#AddRecommendationTitle").val("Уважаемый " + $("#friendName").text() + "!\n\n" + templates[templateNum - 1]);
	};

	var		AddRandonRecommendationTemplateToTextarea = function()
	{
		var		templates = [
"Свои обязанности сотрудник выполнял отлично. В течение всего срока своей работы сотрудник демонстрировал высокий уровень внимательности, аналитические и математические способности, стремление к повышению профессионального уровня, аккуратность, исполнительность. Сотрудник является эмоционально устойчивым и коммуникабельным человеком. Кроме того, он постоянно стремился самостоятельно повысить свой профессиональный уровень. Я, как его непосредственный руководитель, с уверенностью могу рекомендовать сотрудника для работы на аналогичной должности. ",
"В процессе работы сотрудник продемонстрировал способность хорошо ориентироваться на рынке, знание конкурентов и их потребности. Сотрудник, не только работал с существующими клиентами, но и умело искал новых. В течение всего времени работы в нашей компании сотрудник демонстрировал стремление к повышению профессионализма, прошел несколько профессиональных тренингов. Также сотрудник показал себя как работник с высоким уровнем самоорганизации, лояльности к компании, мотивации, нацеленностью на результат. Сотрудник коммуникабелен, умеет находить общий язык с клиентами и сотрудниками, неконфликтен. Рекомендую сотрудника, как способного на любые должности, связанные с его профессиональным опытом работы.",
"Выражаю глубокую признательность и благодарность за Ваше профессиональное мастерство, талант, душевную щедрость.",
"Особенно хочется Вас поблагодарить за индивидуальный подход, компетентность, ответственность и доброжелательность.",
"Вы умный, талантливый, неповторимый профессионал своего дела!\n",
"Спасибо за все, что Вы делаете, и благодарю Вас за творческое отношение к работе, энтузиазм, открытость и доброжелательность!",
"Меня вы выручили ловко,\nЗа помощь вас благодарю.\nПоддержку вашу и заботу,\nПоверьте, очень я ценю.\n\nПускай судьба подарит счастье,\nВы славный, добрый человек.\nПускай здоровым и прекрасным\nЛишь будет Ваш достойный век.",
"Помочь – всегда святое дело,\nИ мне не отказали вы.\nСпасибо вам за понимание,\nПусть станут явью все мечты.\n\nВы не оставили с проблемой\nМеня страдать наедине.\nЖелаю вам всегда везения\nИ счастья яркого в судьбе.",
"Благодарю Вас за снисхождение, оказанное мне в начале моей карьеры, за некоторые незначительные поблажки, на совершенные мной автоматические ошибки, за веру в мой проект и за возможность самореализации.",
"Милый, я тебе клянусь,\nОт любви к тебе рехнусь!",
		];
		$("#AddRecommendationTitle").val("Уважаемый " + $("#friendName").text() + "!\n\n" + templates[Math.floor(Math.random() * templates.length)]);
	};




	// --- Are You Sure modal handler
	var RemoveRecommendationEntry = function(e) {
		var		affectedID = $(this).data("id");
		var		affectedAction = $(this).data("action");

		if(typeof($("#AreYouSure #Remove").data()) != "undefined")
		{
			Object.keys($("#AreYouSure #Remove").data()).forEach(function(item) { 
				$("#AreYouSure #Remove").data(item, ""); 
			});
		}
		$("#AreYouSure #Remove").data("id", affectedID);
		$("#AreYouSure #Remove").data("action", affectedAction);


		$("#AreYouSure").modal('show');
	};

	var	AreYouSureRemoveHandler = function() {
		var		affectedID = $("#AreYouSure #Remove").data("id");
		var		affectedAction = $("#AreYouSure #Remove").data("action");

		$("#AreYouSure").modal('hide');

		$.getJSON('/cgi-bin/index.cgi?action=' + affectedAction, {id: affectedID})
			.done(function(data) {
				if(data.result === "success")
				{
				}
				else
				{
					console.debug("AreYouSureRemoveHandler: ERROR: " + data.description);
				}
			});

		// --- update GUI has to be inside getJSON->done->if(success).
		// --- To improve User Expirience (react on user actions immediately) 
		// ---     I'm updating GUI immediately after click, not waiting server response
		if(affectedAction == "AJAX_removeRecommendationEntry")
		{
			userProfile.recommendation.forEach(function(item, i, arr) {
				if(item.recommendationID == affectedID)
				{
					userProfile.recommendation.splice(i, 1);
				}
			});
			RenderRecommendationPath();
		}
	};

	// --- Editable function
	var editableFuncHighlightBgcolor = function () {
		$(this).addClass("editable_highlited_class", 400);
	};

	var editableFuncNormalizeBgcolor = function () {
		$(this).removeClass("editable_highlited_class", 200, "easeInOutCirc");

	};

	var	editableFuncReplaceToParagraphAccept = function (currentTag) {
		var currentContent = $(currentTag).val();
		var	isClearToAdd = true;

		if(!currentContent.trim().length)
		{
			isClearToAdd = false;
			$(currentTag).popover({"content": "Рекомендация не может быть пустой."})
						.popover("show")
						.parent().removeClass("has-success")
						.addClass("has-feedback has-error");
			setTimeout(function () 
				{
					$(currentTag).popover("destroy");
				}, 3000);
		}
		else
		{
			$(currentTag).parent().removeClass("has-error").addClass("has-feedback has-success");
		}


		if(isClearToAdd)
		{
			if(system_calls.ConvertTextToHTML($(currentTag).val()) != system_calls.FilterUnsupportedUTF8Symbols($(currentTag).attr("initValue")))
			{
				// --- text has been changed

				if(currentTag.data("action") === "updateRecommendationTitle") 
				{
					if(currentContent === "") {	currentContent = "Опишите круг своих обязанностей работы в компании.";	}

					$.post('/cgi-bin/index.cgi?rand=' + Math.floor(Math.random() * 1000000000), 
						{
							id: $(currentTag).data("id"), content: system_calls.FilterUnsupportedUTF8Symbols($(currentTag).val()),
							action: "AJAX_updateRecommendationTitle",
							rand: Math.floor(Math.random() * 1000000000)
						}, "json")
						.done(function(data) {
							var		resultJSON = JSON.parse(data);
							if(resultJSON.result === "success")
							{

							}
							else
							{
								console.debug("editableFuncReplaceToParagraphAccept: ERROR: " + resultJSON.description);
							}
						});
				}

			}

			editableFuncReplaceToParagraphRenderHTML(currentTag, system_calls.ConvertTextToHTML(currentContent));
		}
	};

	var	editableFuncReplaceToParagraphReject = function (currentTag) {
		/*Escape pressed*/
		editableFuncReplaceToParagraphRenderHTML(currentTag, currentTag.attr("initValue"));
	};

	var	editableFuncReplaceToParagraphRenderHTML = function (currentTag, content) {
		/*Escape pressed*/
		var currentID = currentTag.attr("id");
		var	newTag = $("<p>", {
			html: content,
			id: currentID,
			class: currentTag.attr("class")
		});

		Object.keys(currentTag.data()).forEach(function(item) { $(newTag).data(item, currentTag.data(item)); });

		currentTag.replaceWith(newTag);
		$("#" + currentID + "ButtonAccept").remove();
		$("#" + currentID + "ButtonReject").remove();
		$(newTag).on('click', editableFuncReplaceToTextarea);
		$(newTag).mouseenter(editableFuncHighlightBgcolor);
		$(newTag).mouseleave(editableFuncNormalizeBgcolor);
	};

	var	editableFuncReplaceToTextarea = function (e) {
		var	ButtonAcceptHandler = function() {
			var		associatedTextareaID = $(this).data("associatedTagID");
			editableFuncReplaceToParagraphAccept($("#" + associatedTextareaID));
		};

		var	ButtonRejectHandler = function(e) {
			var		associatedTextareaID = $(this).data("associatedTagID");
			editableFuncReplaceToParagraphReject($("#" + associatedTextareaID));
		};

		var	currentTag = $(this);
		var	initContent = system_calls.PrebuiltInitValue(currentTag.html());
		var	tag = $("<textarea>", {
			val: system_calls.ConvertHTMLToText(initContent),
			type: "text",
			id: currentTag.attr("id"),
			class: currentTag.attr("class")
		});
		var tagButtonAccept = $("<button>", { 
			type: "button", 
			class: "btn btn-primary float_right margin_5",
			id: currentTag.attr("id") + "ButtonAccept",
			text: "Сохранить"
		}).data("action", "accept")
			.data("associatedTagID", currentTag.attr("id"))
			.on("click", ButtonAcceptHandler);
		var tagButtonReject = $("<button>", { 
			type: "button", 
			class: "btn btn-default float_right margin_5",
			id: currentTag.attr("id") + "ButtonReject",
			text: "Отменить"
		}).data("action", "reject")
			.data("associatedTagID", currentTag.attr("id"))
			.on("click", ButtonRejectHandler);

		var keyupEventHandler = function(event) {
			/* Act on the event */
			var	keyPressed = event.keyCode;

			if((event.ctrlKey && event.keyCode == 10) || (event.ctrlKey && event.keyCode == 13))
			{
				/*Ctrl+Enter pressed*/
				editableFuncReplaceToParagraphAccept($(this));
			}
			if(keyPressed == 27) {
				/* Esc pressed */
				editableFuncReplaceToParagraphReject($(this));
			}
		};

		$(tag).attr("initValue", initContent);
		$(tag).width(currentTag.width());
		$(tag).height((currentTag.height() + 30 < 100 ? 100 : currentTag.height() + 30));
		Object.keys(currentTag.data()).forEach(function(item) { 
			$(tag).data(item, currentTag.data(item)); 
		});

		currentTag.replaceWith(tag);
		$(tag).removeClass('editable_highlited_class');
		$(tag).after(tagButtonAccept);
		$(tag).after(tagButtonReject);
		$(tag).on('keyup', keyupEventHandler);
		$(tag).select();
	};



	return {
			Init: Init,
			DrawFriendAvatar: DrawFriendAvatar,
			RenderSkillPath: RenderSkillPath,
			RenderRecommendationPath: RenderRecommendationPath
		};
})(); // --- view_profile object

