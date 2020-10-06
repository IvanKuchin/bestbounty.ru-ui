var		view_event_profile = view_event_profile || {};

view_event_profile = (function()
{
	'use strict';

	var		eventProfile;
	var		myUserProfile;

	var		myUserID;
	var		myUserLogin;
	var		eventID;
	var		eventLink;

	var	Init = function()
	{
		myUserID = $("#myUserID").data("myuserid");
		myUserLogin = $("#myUserID").data("mylogin");
		eventID = $("#eventName").data("eventid");
		eventLink = $("#eventName").data("eventlink");

		$("#news_feed").data("dsttype", "event");
		$("#news_feed").data("dstid", eventID);

		$("#AreYouSure #Remove").on("click", AreYouSureRemoveHandler);
		$("#eventAccept").on("click", ControlButtonsClickHandler);
		$("#eventReject").on("click", ControlButtonsClickHandler);
		$("#adultsCounter").on("change", ControlButtonsClickHandler);
		$("#kidsCounter").on("change", ControlButtonsClickHandler);

		FillinEventProfile();
	};

	var FillinEventProfile = function()
	{
		$.getJSON('/cgi-bin/event.cgi?action=AJAX_getEventProfileAndUser', {id: eventID})
			.done(function(data) {
				if(data.result === "success")
				{
					if(data.events.length)
					{
						eventProfile = data.events[0];
						myUserProfile = data.users[0];

						DrawEventLogo(eventProfile.logo_folder, eventProfile.logo_filename, eventProfile.title);

						RenderCommonInfo();
						RenderEventEditButton();
						RenderControlButtons();
						RenderHostsAvatar();
						RenderGuestsAvatar();
						RenderGiftsList();
						HideGiftList();

						if(system_calls.GetParamFromURL("scrollto").length) system_calls.ScrollWindowToElementID("#" + system_calls.GetParamFromURL("scrollto"));
					}
					else
					{
						$("#eventName").empty().append("Событие заблокировано");
						$("#SubmitMessage").addClass("hidden");
					}
				}
				else
				{
					console.debug("FillinEventProfile: ERROR: " + data.description);
				}
			})
			.fail(function() {
				console.debug("FillinEventProfile: error parsing JSON from server");
			});

	};

	var	DrawEventLogo = function (eventImageFolder, eventImageFilename, eventName)
	{
		var		canvasCtx; 

		$("#canvasForAvatar").attr("width", "320")
							.attr("height", "320");
		canvasCtx = $("#canvasForAvatar")[0].getContext("2d");

		if(eventImageFilename.length)
			DrawCompanyAvatar(canvasCtx, "/images/events/" + eventImageFolder + "/" + eventImageFilename, eventName, "");
		else
		{
			DrawCompanyAvatar(canvasCtx, "", eventName, "");
			$("#canvasForAvatar").addClass("hidden-xs");
		}

	};

	// --- not in system_class because of 
	// --- 1) user id not in ".id", rather in ".user_id"
	// --- 2) user status must be accepted instead of all users
	// --- 3) hint having additional field "(extra persons)"
	var	GetAvatarsList = function(usersArray)
	{
		var		guestAvatarsList = $();

		usersArray.forEach(function(item) 
			{
				if((item.name.length || item.nameLast.length) && (item.status == "accepted"))
				{
					var		spanContainer = $("<span>").data("obj", item);
					var		href = $("<a>").attr("href", "/userprofile/" + item.user_id + "?rand=" + system_calls.GetUUID());
					var		canvas = $("<canvas>").attr("height", "30")
													.attr("width", "30");
					var		extraPersons = parseInt(item.adults) + parseInt(item.kids);

					DrawUserAvatar(canvas[0].getContext("2d"), item.avatar, item.name, item.nameLast);

					canvas		.attr("data-toggle", "tooltip")
								.attr("data-placement", "top")
								.attr("title", item.name + " " + item.nameLast + (extraPersons ? " (+" + (extraPersons) + ")" : ""));

					spanContainer.append(href.append(canvas)).append(" ");

					guestAvatarsList = guestAvatarsList.add(spanContainer);
				}
			});

		return	guestAvatarsList;		
	};

	var	RenderHostsAvatar = function()
	{
		$("#HostsList").empty().append(GetAvatarsList(eventProfile.hosts));
		$("#HostsList [data-toggle=\"tooltip\"]").tooltip({ animation: "animated bounceIn"});
	};

	var	RenderGuestsAvatar = function()
	{
		$("#GuestsList").empty().append(GetAvatarsList(eventProfile.guests));
		$("#GuestsList [data-toggle=\"tooltip\"]").tooltip({ animation: "animated bounceIn"});
	};

	var	RenderNumberOfGuests = function()
	{
		$("#numberOfGuests").empty().append(function() 
		{
			var	result = "";
			var	adults = 0, kids = 0;
			var	adultsSpelling = "", kidsSpelling = "";

			eventProfile.guests.forEach(function(item) 
				{
					if(item.status == "accepted")
					{
						adults += 1;
						adults += parseInt(item.adults);
						kids += parseInt(item.kids);
					}
				});

			adults += eventProfile.hosts.length;

			adultsSpelling = system_calls.GetSpelledAdultsNumber(adults);
			kidsSpelling = system_calls.GetSpelledKidsNumber(kids);

			return adults | kids ? (adults ? adults + adultsSpelling : "") + (adults && kids ? " и " : " ") + (kids ? kids + " " + kidsSpelling : "") : "никого";
		});
	};

	var	RenderCommonInfo = function()
	{
		$("#eventName").append(eventProfile.title);
		$("#eventStartDate").append(system_calls.GetFormattedDateFromSeconds(eventProfile.startTimestamp, "DD MMMM YYY в hh:mm"));
		$("#eventLocation").append(eventProfile.address);
		$("#eventFoundationDate").append(system_calls.GetLocalizedDateNoTimeFromSeconds(eventProfile.eventTimestampCreation));
		$("#eventDescription").append(eventProfile.description);
	};

	var	RenderEventEditButton = function()
	{
		if(eventProfile.isMine == "1")
		{
			$("#event_edit_button")
				.show(300)
				.attr("href", "/edit_event?eventid=" + eventProfile.id + "&rand=" + system_calls.GetUUID());
		}
		else $("#event_edit_button").hide();
	};

	var	RenderControlButtons = function()
	{
		var		memberObj = {};

		eventProfile.guests.forEach(function(item) 
		{
			if(item.user_id == myUserID)
			{
				memberObj.type = "guest";
				memberObj.acceptStatus = item.status;
				memberObj.extraKids = parseInt(item.kids);
				memberObj.extraAdults = parseInt(item.adults);
			}
		});

		eventProfile.hosts.forEach(function(item) 
		{
			if(item.user_id == myUserID)
			{
				memberObj.type = "host";
				memberObj.acceptStatus = "";
				memberObj.extraKids = 0;
				memberObj.extraAdults = 0;
			}
		});

		if(memberObj.type == "host")
		{
			$("#adultsCounter")			.val(0);
			$("#kidsCounter")			.val(0);
			$("#kidsPronounciation")	.empty()
										.append(system_calls.GetSpelledKidsNumber(memberObj.extraKids) || " детей");

			$("#eventAccept")			.attr("disabled", "disabled");
			$("#eventReject")			.attr("disabled", "disabled");
			$("#adultsCounter")			.attr("disabled", "disabled");
			$("#kidsCounter")			.attr("disabled", "disabled");
		}
		if(memberObj.type == "guest")
		{
			$("#eventAccept")			.removeAttr("disabled")
										.addClass("opacity_03");
			$("#eventReject")			.removeAttr("disabled")
										.addClass("opacity_03");
			$("#adultsCounter")			.removeAttr("disabled")
										.val(memberObj.extraAdults);
			$("#kidsCounter")			.removeAttr("disabled")
										.val(memberObj.extraKids);
			$("#kidsPronounciation")	.empty()
										.append(system_calls.GetSpelledKidsNumber(memberObj.extraKids) || " детей");

			if(memberObj.acceptStatus == "accepted") $("#eventAccept").removeClass("opacity_03");
			if(memberObj.acceptStatus == "rejected") $("#eventReject").removeClass("opacity_03");
		}

		RenderNumberOfGuests();
		RenderGuestsAvatar();
	};

	var	ControlButtonsClickHandler = function()
	{
		var		currTag = $(this);
		var		action = currTag.data("action") || "";
		var		script = currTag.data("script") || "event.cgi";
		var		kidsCounter = $("#kidsCounter").val();
		var		adultsCounter = $("#adultsCounter").val();

		if(action.length && script.length)
		{
			currTag.button("loading");

			$.getJSON('/cgi-bin/' + script + '?action=' + action, {event_id: eventID, kidsCounter: kidsCounter, adultsCounter: adultsCounter})
				.done(function(data) 
				{
					if(data.result === "success")
					{
						eventProfile.guests = data.guests;
						setTimeout(function() { RenderControlButtons(); }, 600);
					}
					else
					{
						system_calls.PopoverError(currTag.attr("id"), data.description);
						console.error("ERROR: " + data.description);
					}

					setTimeout(function() {currTag.button("reset"); }, 500); // --- wait for animation
				})
				.fail(function() 
				{
					console.error("ERROR: parse JSON response from server");
					system_calls.PopoverError(currTag.attr("id"), "Ошибка ответа сервера. Попробуйте через 24 часа.");
					setTimeout(function() {currTag.button("reset"); }, 500); // --- wait for animation
				});
		}
		else
		{
			console.error("script and action must be defined");
		}

	};

	// --- aditional modals
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
			eventProfile.recommendation.forEach(function(item, i, arr) {
				if(item.recommendationID == affectedID)
				{
					eventProfile.recommendation.splice(i, 1);
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

	var	update_gifts_to_give_for_current_user_callback = function(data)
	{
		eventProfile.hosts.forEach(function(item,i)
		{
			if(item.user_id == data.recipient_user_id) eventProfile.hosts[i].gifts_to_give = data.gifts_to_give;
		});

		eventProfile.guests.forEach(function(item,i)
		{
			if(item.user_id == data.recipient_user_id) eventProfile.guests[i].gifts_to_give = data.gifts_to_give;
		});
	};

	var	RenderGiftsList = function()
	{
		var		__gifts = [];
		var		__gifts_to_give = [];

		eventProfile.hosts.forEach(function(item)
			{
				__gifts = __gifts.concat(item.gifts);
				__gifts_to_give = __gifts_to_give.concat(item.gifts_to_give);
			});

		$("div#GiftPath")
						.empty()
						.append(gift_list.GetGiftsListDOM(__gifts, __gifts_to_give, myUserID, update_gifts_to_give_for_current_user_callback));
	};

	var HideGiftList = function()
	{
		if(eventProfile.hideGifts == "Y") $("div.__gift_container").hide();
	};

	return {
			Init: Init,
			update_gifts_to_give_for_current_user_callback: update_gifts_to_give_for_current_user_callback
		};
})(); // --- view_event_profile object


