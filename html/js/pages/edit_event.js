var	edit_event = edit_event || {};

edit_event = (function()
{
	'use strict';

	var		eventProfile = {};
	var		AutocompleteList = [];
	var		datepickerDateFormat;

	var		eventChecklist_global;

	var 	JSON_eventPosition = [];
	var		JSON_geoCountry = [];
	var		JSON_geoRegion = [];
	var		JSON_geoLocality = [];
	var		JSON_university = [];
	var		JSON_school = [];
	var		JSON_language = [];
	var		JSON_skill = [];
	var		JSON_dataForProfile = {};

	var	Init = function()
	{
		eventProfile.id = $("#eventInfo").data("id");

		eventChecklist_global = new EventChecklist();

		$("#AreYouSure #Remove").on("click", AreYouSure_RemoveHandler);
		$("#eventBlock").on("click", BlockButton_ClickHandler);
		$("#ButtonAddEventHost").on("click", AddHost_ClickHandler);
		$("#ButtonAddEventGuest").on("click", AddGuest_ClickHandler);
		$("#ButtonAddEventGuestFromList").on("click", AddGuestFromList_ClickHandler);
		$("#canvasForEventLogo").on("click", function(e) { $("#fileupload").click(); });
		$("#ButtonRemoveEvent").on("click", AreYouSure_ClickHandler);
		$("#GuestListModal .submit").on("click", GuestListModal_Submit_ClickHandler);
		$("#switcherLabelNoGift").on("click", NoGift_ClickHeader);

		// --- if autocomplete functionality is not initialized from the beginning 
		// --- it will not pop-up after configure threshold, it will wait one symbol more 
		// --- to overcome this fake autocomplete initializtion applied
		CreateAutocompleteWithSelectCallback("#eventHost", [{0:"0"}], AddHost_SelectHandler);
		$("#eventHost").on("input", AddHost_InputHandler);
		$("#eventHost").on("keyup", AddHost_KeyupHandler);
		// --- use timeout to wait until input will be updated, otherwise handler will be called before new value pasted to input
		// --- bind(this) is reference to event source rather than regular object in setTimeout
		$("#eventHost").on("paste", function() { setTimeout(function() { AddHost_KeyupHandler(); }.bind(this), 0) });
		$("#eventHost").on("cut", function() { setTimeout(function() { AddHost_KeyupHandler(); }.bind(this), 0) });

		CreateAutocompleteWithSelectCallback("#eventGuest", [{0:"0"}], AddGuest_SelectHandler);
		$("#eventGuest").on("input", AddGuest_InputHandler);
		$("#eventGuest").on("keyup", AddGuest_KeyupHandler);
		// --- use timeout to wait until input will be updated, otherwise handler will be called before new value pasted to input
		// --- bind(this) is reference to event source rather than regular object in setTimeout
		$("#eventGuest").on("paste", function() { setTimeout(function() { AddGuest_KeyupHandler(); AddGuest_InputHandler(); }.bind(this), 0) });
		$("#eventGuest").on("cut", function() { setTimeout(function() { AddGuest_KeyupHandler(); AddGuest_InputHandler(); }.bind(this), 0) });


		$("#custom_checklist_item_category")
										.autocomplete({
											source: "/cgi-bin/event.cgi?action=AJAX_getChecklistCategoryAutocompleteList",
											// select: AviaBonus_Autocomplete_SelectHandler,
										});
		$("#custom_checklist_item_title")
										.autocomplete({
											source: "/cgi-bin/event.cgi?action=AJAX_getChecklistTitleAutocompleteList",
											// select: AviaBonus_Autocomplete_SelectHandler,
										});

		$("#ButtonAddItemToChecklist").on("click", AddCheckListitem_ClickHandler);

		RenderEventProfileFromServer();

		// --- Image uploader
		$(function () 
		{
		    // Change this to the location of your server-side upload handler:
		    $('#fileupload').fileupload({
		        url: '/cgi-bin/generalimageuploader.cgi',
		        formData: {type:"event", id:eventProfile.id, rand:system_calls.GetUUID()},
		        dataType: 'json',
		        maxFileSize: 30 * 1024 * 1024, 
		        acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,


		        done: function (e, data) {

		        	$.each(data.result, function(index, value) 
		        		{
			            	if(value.result == "error")
			            	{
			            		console.debug("fileupload: done handler: ERROR uploading file [" + value.fileName + "] error code [" + value.textStatus + "]");
			            		if(value.textStatus == "wrong format")
			            		{
				            		$("#UploadAvatarErrorBS_ImageName").text(value.fileName);
				            		$("#UploadAvatarErrorBS").modal("show");
				            	}
			            	}

			            	if(value.result == "success")
			            	{
			            		eventProfile.logo_folder = value.logo_folder;
			            		eventProfile.logo_filename = value.logo_filename;

			            		console.debug("fileupload: done handler: uploading success original file[" + value.fileName + "], destination file[folder:" + eventProfile.logo_folder + ", filename:" + eventProfile.logo_filename + "]");

			            		RenderEventLogo();
			            	}
		            	});

		        },
		        progressall: function (e, data) {
		            var progress = parseInt(data.loaded / data.total * 100, 10);
		            $('#progress .progress-bar').css(
		                'width',
		                progress + '%'
		            );
		        },
		        fail: function (e, data) {
		        	alert("ошибка загрузки фаила: " + data.textStatus);
		        }

		    }).prop('disabled', !$.support.fileInput)
		        .parent().addClass($.support.fileInput ? undefined : 'disabled');
		});

	};


	var RenderEventProfileFromServer = function()
	{
		$.getJSON('/cgi-bin/event.cgi?action=AJAX_getEventProfile', {id: eventProfile.id})
			.done(function(data) 
			{
				if((data.result === "success") && (data.events.length))
				{
					if(system_calls.amIMeetingHost(data.events[0]))
					{
						eventProfile = data.events[0];
						RenderEventLogo();
						RenderEventTitle();
						RenderEventStart();
						RenderBlockButton();
						RenderDeleteButton();
						RenderAccessTypeSelect();
						EventHostZeroize();
						RenderEventHosts();
						EventGuestZeroize();
						RenderEventGuests();
						InitNoGiftLabel();

						eventChecklist_global.SetData(eventProfile.checklists[0])
						RenderChecklist();

						$.getJSON('/cgi-bin/event.cgi?action=AJAX_getFavoriteChecklistsCategories')
							.done(function(data) 
							{
								if(data.result === "success")
								{
									RenderFavoriteChecklistTabs(data.checklists);
								}
								else
								{
									console.debug("Init: ERROR: " + data.description + " or events length = 0");
								}
							});
					}
					else
					{
						$("#NotMyEvent .mailme").on("click", function(){ return CraftEventChangeMail(data.events[0]); });
						$("#NotMyEvent").modal("show");
					}
				}
				else
				{
					console.debug("Init: ERROR: " + data.description + " or events length = 0");
				}
			});
	};


	var	AddHost_InputHandler = function()
	{
		var	currentTag = $(this);
		var	currentValue = currentTag.val();

		if(currentValue.length == 3)
		{
			$.getJSON(
				'/cgi-bin/index.cgi',
				{action:"JSON_getFindFriendsListAutocomplete", lookForKey:currentValue})
				.done(function(data) {
						var	AutocompleteList = [];

						data.forEach(function(item, i, arr)
							{
								AutocompleteList.push({id:item.id , label:item.name + " " + item.nameLast + " " + item.currentCity});
							});

						CreateAutocompleteWithSelectCallback("#" + currentTag.attr("id"), AutocompleteList, AddHost_SelectHandler);
					})
				.fail(function() {
					console.error("ERROR parsing JSON response from server");
				});
		}
	}

	var	AddHost_SelectHandler = function(event, ui)
	{
		var		userID = ui.item.id;
		var 	userLabel = ui.item.label;
	// var	AddCompanyFounder = function(userID, userName)
		var		isDuplicate = false;

		if(!system_calls.RemoveSpaces(userLabel))
		{
			system_calls.PopoverError("eventHost", "Выберите имя из списка");
		}
		else
		{
			// --- check duplicates
			eventProfile.hosts.forEach(function(item, i, arr)
				{
					if(item.user_id == userID) isDuplicate = true;
				});

			if(isDuplicate) {
				system_calls.PopoverError("eventHost", "Уже в списке");
			}
			else
			{
				// --- check Owners count
				if(eventProfile.hosts.length >20)
				{
					system_calls.PopoverError("eventHost", "Слишком много людей");
				}
				else
				{
					$("button#ButtonAddEventHost").button("loading");
					$("input#eventHost").attr("disabled", "");

					$.getJSON('/cgi-bin/event.cgi?action=AJAX_addEventHost', {user_id: userID, event_id: eventProfile.id})
						.done(function(data) {
							if(data.result === "success")
							{
								eventProfile.hosts = data.hosts;

								EventHostZeroize();
								RenderEventHosts();
							}
							else
							{
								system_calls.PopoverError("eventHost", data.description);
								console.debug("AddHost_InputHandler: ERROR: " + data.description);
							}

							$("button#ButtonAddEventHost").button("reset");
							$("input#eventHost").removeAttr("disabled");
						})
						.fail(function()
							{
								console.error("ERROR: parsing JSON response from server");
								system_calls.PopoverError("eventHost", "Ошибка ответа сервера");

								$("button#ButtonAddEventHost").button("reset");
								$("input#eventHost").removeAttr("disabled");
							});
				}
			}
		}
	};

	var	AutocompleteCallbackChange = function (event, ui) 
	{
		var		currTag = $(this);

		console.debug ("AutocompleteCallbackChange: change event handler"); 

		if(currTag.val() === "")
		{
			currTag.parent().removeClass("has-success").addClass("has-feedback has-error");
		}
		else
		{
			currTag.parent().removeClass("has-error").addClass("has-feedback has-success");
			currTag.data("id", (ui.item ? ui.item.id : "0"));
		}

		setTimeout(function() { 
			currTag.parent().removeClass("has-feedback has-success has-error"); 
		}, 3000);
	};

	// --- create autocomplete
	// --- input:
	// ---       elem - for ex ("input#ID")
	// --- 		 srcData - array of {id:"id", label:"label"}
	// ---       selectCallback - function(event, ui)
	var	CreateAutocompleteWithSelectCallback = function(elem, srcData, selectCallback)
	{
		if($(elem).length && srcData.length)
		{
			$(elem).autocomplete({
				delay : 300,
				source: srcData,
				minLength: 3,
				select: selectCallback,
				close: function (event, ui) 
				{ 
					// console.debug ("CreateAutocompleteWithSelectCallback: close event handler"); 
				},
				create: function () {
					// console.debug ("CreateAutocompleteWithSelectCallback: _create event handler"); 
				},
				_renderMenu: function (ul, items)  // --- requres plugin only
				{
					var	that = this;
					currentCategory = "";
					$.each( items, function( index, item ) {
						var li;
						if ( item.category != currentCategory ) {
							ul.append( "<li class='ui-autocomplete-category'>" + item.category + "</li>");
							currentCategory = item.category;
						}
						li = that._renderItemData( ul, item );
						if ( item.category ) {
							li.attr( "aria-label", item.category + " : " + item.label );
						}
					});
				}
			});
		}
		else
		{
			console.debug("CreateAutocompleteWithSelectCallback:ERROR: srcData or '" + elem + "' is empty");
		}
	};

	var AddDataForProfileCollapsibleInit = function()
	{
		CreateAutocompleteWithSelectCallback("input#CreateOpenVacancyTitle", JSON_eventPosition, AutocompleteCallbackChange);
		CreateAutocompleteWithSelectCallback("input#CreateOpenVacancyCity", JSON_geoLocality, AutocompleteCallbackChange);
		CreateAutocompleteWithSelectCallback("input#CreateOpenVacancyLanguage1", JSON_language, AutocompleteCallbackChange);
		CreateAutocompleteWithSelectCallback("input#CreateOpenVacancyLanguage2", JSON_language, AutocompleteCallbackChange);
		CreateAutocompleteWithSelectCallback("input#CreateOpenVacancyLanguage3", JSON_language, AutocompleteCallbackChange);
		CreateAutocompleteWithSelectCallback("input#CreateOpenVacancySkill1", JSON_skill, AutocompleteCallbackChange);
		CreateAutocompleteWithSelectCallback("input#CreateOpenVacancySkill2", JSON_skill, AutocompleteCallbackChange);
		CreateAutocompleteWithSelectCallback("input#CreateOpenVacancySkill3", JSON_skill, AutocompleteCallbackChange);

		// --- Initialize autocomplete after initial loading data
		if(typeof(eventProfile.open_vacancies) != "undefined")
			eventProfile.open_vacancies.forEach(function(item, i, arr)
			{
				if($("input#OpenVacancy" + item.id + "Edit_Title").length)		CreateAutocompleteWithSelectCallback("input#OpenVacancy" + item.id + "Edit_Title", JSON_eventPosition, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_City").length) 		CreateAutocompleteWithSelectCallback("input#OpenVacancy" + item.id + "Edit_City", JSON_geoLocality, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Language1").length) 	CreateAutocompleteWithSelectCallback("input#OpenVacancy" + item.id + "Edit_Language1", JSON_language, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Language2").length) 	CreateAutocompleteWithSelectCallback("input#OpenVacancy" + item.id + "Edit_Language2", JSON_language, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Language3").length) 	CreateAutocompleteWithSelectCallback("input#OpenVacancy" + item.id + "Edit_Language3", JSON_language, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Skill1").length) 	CreateAutocompleteWithSelectCallback("input#OpenVacancy" + item.id + "Edit_Skill1", JSON_skill, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Skill2").length) 	CreateAutocompleteWithSelectCallback("input#OpenVacancy" + item.id + "Edit_Skill2", JSON_skill, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Skill3").length) 	CreateAutocompleteWithSelectCallback("input#OpenVacancy" + item.id + "Edit_Skill3", JSON_skill, AutocompleteCallbackChange);
			});

	};

	var	InputKeyupHandler = function(e)
	{
		var		keyPressed = e.keyCode;
		var		currentTag = $(this);

		if(currentTag.data("action") == "AJAX_addEventHost")
		{
			if(keyPressed == 13) AddEventFounder("", currentTag.val());
		}
		if(currentTag.data("action") == "AJAX_addEventGuest")
		{
			if(keyPressed == 13) AddEventOwner("", currentTag.val());
		}
		if(currentTag.data("action") == "AJAX_addEditEventAddEventIndustry")
		{
			if(keyPressed == 13) AddEventIndustry("", currentTag.val());
		}
	};

	var	BlockButton_ClickHandler = function()
	{
		var		currTag = $(this);

		$("#eventBlock").button("loading");

		if(currTag.data("action") == "AJAX_unblockEvent")
		{

		}
		else if(currTag.data("action") == "AJAX_blockEvent")
		{

		}

		$.getJSON('/cgi-bin/event.cgi?action=' + currTag.data("action"), {id: currTag.data("id"), rand: Math.random() * 1234567890})
			.done(function(data) {
				if(data.result === "success")
				{
					eventProfile = data.events[0];
					window.setTimeout(function() { RenderBlockButton(); }, 600);
				}
				else
				{
					system_calls.PopoverError("eventBlock", data.description);
					console.debug("BlockButton_ClickHandler: ERROR: " + data.description);
				}

				window.setTimeout(function() { $("#eventBlock").button("reset"); }, 500);
			})
			.fail(function() {
				console.error("BlockButton_ClickHandler:ERROR: parsing JSON response from server");

				window.setTimeout(function() { $("#eventBlock").button("reset"); }, 500);
			});

	};

	var	RenderBlockButton = function()
	{
		var		classToAdd, description, action;

		if(eventProfile.isBlocked == "Y")
		{
			classToAdd = "btn-danger";
			description = "Заблокировано";
			action = "AJAX_unblockEvent";
		}
		else
		{
			classToAdd = "btn-success";
			description = "Активно";
			action = "AJAX_blockEvent";
		}

		$("#eventBlock").removeClass("btn-danger btn-default btn-success")
						.addClass(classToAdd)
						.empty()
						.append(description)
						.data("action", action)
						.data("id", eventProfile.id);
	};

	var	RenderDeleteButton = function()
	{
		if(eventProfile.isMine == "0") 
			$("#ContainerRemoveEvent").hide(250);
	};

	var RenderAccessTypeSelect = function()
	{
		$("span#eventAccessType")	.empty()
									.append(system_calls.eventTypes[eventProfile.accessType])
									.data("value", eventProfile.accessType);
		
		$("div#eventInfo .editableSelect").on("click", editableFuncReplaceSpanToSelect);
		$("div#eventInfo .editableSelect").mouseenter(editableFuncHighlightBgcolor);
		$("div#eventInfo .editableSelect").mouseleave(editableFuncNormalizeBgcolor);
	};

	var	RenderEventTitle = function()
	{
		$("span#eventTitle").html(eventProfile.title);
		$("span#eventLink").html(eventProfile.link);
		$("span#eventAddress").html(eventProfile.address.length ? eventProfile.address : "(без адреса)");
		$("p#eventDescription").html(eventProfile.description ? eventProfile.description : "(описание отсутствует)")

		$("div#eventInfo .editableSpan").on("click", editableFuncReplaceSpanToInput);
		$("div#eventInfo .editableSpan").mouseenter(editableFuncHighlightBgcolor);
		$("div#eventInfo .editableSpan").mouseleave(editableFuncNormalizeBgcolor);

		$("div#eventInfo .editableParagraph").on("click", editableFuncReplaceParagraphToTextarea);
		$("div#eventInfo .editableParagraph").mouseenter(editableFuncHighlightBgcolor);
		$("div#eventInfo .editableParagraph").mouseleave(editableFuncNormalizeBgcolor);

		$("#eventFoundationDate").append(system_calls.GetLocalizedDateNoTimeFromSeconds(eventProfile.eventTimestampCreation));
	};

	var	RenderEventStart = function()
	{
		var		result = $();
		var		spanTimestamp = $("<span>").addClass("eventStartTimestamp  formatDate")
											.data("id", "not used")
											.data("action", "AJAX_updateStartDate")
											.data("script", "event.cgi");

		var		startTime;

		if(typeof(eventProfile) == "undefined")
		{
			return;
		}
		if(typeof(eventProfile.startTimestamp) == "undefined")
		{
			return;
		}
		else
		{
			$("#paragraphStartTime")	.empty()
										.append(GetRoundedTimestampFromSec(eventProfile.startTimestamp))
										.data("value", GetRoundedTimestampFromSec(eventProfile.startTimestamp));
			

			spanTimestamp.append(system_calls.GetLocalizedDateNoTimeFromSeconds(eventProfile.startTimestamp));
			$("#paragraphStartDate").append(spanTimestamp);

			$("#eventStart .formatDate").on("click", editableFuncReplaceSpanToInput);
			$("#eventStart .formatDate").mouseenter(editableFuncHighlightBgcolor);
			$("#eventStart .formatDate").mouseleave(editableFuncNormalizeBgcolor);
		}
	};

	var	RenderChecklist = function()
	{
		$("#eventChecklist").empty().append(eventChecklist_global.GetDOM())
	};

	var	EventHostZeroize = function()
	{
		$("#eventHost").val("");
		$("#eventHost").removeAttr("disabled");
		$("#ButtonAddEventHost").attr("disabled", "");
	};

	var	RenderEventHosts = function()
	{
		$("#eventHostList").empty();
		eventProfile.hosts.forEach(function(item, i, arr)
			{
				var		removeSign = $("<span>").addClass("glyphicon glyphicon-remove cursor_pointer")
												.attr("data-action", "AJAX_removeEventHost")
												.attr("data-id", item.id)
												.on("click", AreYouSure_ClickHandler);
				var 	singleEntry = $("<span>").addClass("label label-default");
				var		userInfo = item.name;
	
				if(item.id != "0") userInfo = $("<a>").attr("href", "/userprofile/" + item.user_id + "?rand=" + system_calls.GetUUID()).addClass("color_white").append(item.name + " " + item.nameLast);
				singleEntry.append(userInfo)
							.append(" ")
							.append(removeSign);

				$("#eventHostList")	.append(singleEntry)
									.append(" ");
			});
	};

	var	EventGuestZeroize = function()
	{
		$("#eventGuest").val("");
		$("#eventGuest").removeAttr("disabled");
		$("#ButtonAddEventGuest").attr("disabled", "");
	};

	var	RenderEventGuests = function()
	{
		$("#eventGuestList").empty();

		eventProfile.guests.sort(function(a, b)
			{
				var		nameA, nameB;
				var		result = 0;

				if(a.status == b.status)
				{
					if(a.name.length) nameA = a.name;
					else if(a.nameLast.length) nameA = a.nameLast;
					else if((typeof(a.email) != "undefined") && a.email.length) nameA = a.email;

					if(b.name.length) nameB = b.name;
					else if(b.nameLast.length) nameB = b.nameLast;
					else if((typeof(b.email) != "undefined") && b.email.length) nameB = b.email;

					if(nameA == nameB) { result = 0; }
					if(nameA <  nameB) { result = -1; }
					if(nameA >  nameB) { result = 1; }
				}
				else
				{
					if(a.status == "accepted")	result = -1;
					if(b.status == "accepted")	result = 1;
					if(a.status == "rejected")	result = 1;
					if(b.status == "rejected")	result = -1;
				}

				return result;
			});

		eventProfile.guests.forEach(function(item, i, arr)
			{
				var		divRow = $("<div>").addClass("row")
											.attr("id", "GuestRow" + item.id);
				var		divStatus = $("<div>").addClass("col-xs-2 col-md-1");
				var		divTitle = $("<div>").addClass("col-xs-8 col-md-6");
				var		divSpare = $("<div>").addClass("col-xs-12 col-md-3");
				var		divControl = $("<div>").addClass("col-xs-12 col-md-2 form-group");
				var		removeTitle = $("<span>").append("<i class=\"fa fa-trash-o fa-lg\"></i><span class=\"hidden-md hidden-lg\"> Не приглашать</span>");
				var		buttonControl = $("<button>").addClass("btn btn-default form-control")
													.data("id", item.id)
													.attr("data-toggle", "tooltip")
													.attr("data-placement", "top")
													.attr("title", "Не приглашать")
													.data("script", "event.cgi")
													.data("action", "AJAX_removeEventGuest")
													.on("click", AreYouSure_ClickHandler)
													.append(removeTitle);
				var		spanStatus, userInfo;
				var		adultsNumber = 0, kidsNumber = 0; 

				if((item.status == "accepted"))
				{
					spanStatus = $("<span>").addClass("fa-stack")
											.append($("<i>").addClass("fa fa-circle-o fa-stack-2x color_green"))
											.append($("<i>").addClass("fa fa-check fa-stack-1x color_green"))
											.attr("data-toggle", "tooltip")
											.attr("data-placement", "top")
											.attr("title", "Приглашение принято");
					adultsNumber = parseInt(item.adults);
					kidsNumber = parseInt(item.kids);
				}
				else if((item.status == "rejected"))
				{
					spanStatus = $("<span>").addClass("fa-stack")
											.append($("<i>").addClass("fa fa-circle-o fa-stack-2x color_red"))
											.append($("<i>").addClass("fa fa-times fa-stack-1x color_red"))
											.attr("data-toggle", "tooltip")
											.attr("data-placement", "top")
											.attr("title", "Отказ");
				}



				if(item.name.length && item.nameLast.length) userInfo = $("<a>").attr("href", "/userprofile/" + item.user_id + "?rand=" + system_calls.GetUUID()).append(item.name + " " + item.nameLast);
				else if((typeof(item.email) != "undefined") && item.email.length) userInfo = item.email;

				divStatus.append(spanStatus);
				divTitle.append(userInfo);
				divControl.append(buttonControl);
				divSpare.append(adultsNumber || kidsNumber ? "(" + system_calls.GetSpelledAdultsKidsNumber(adultsNumber, kidsNumber) + ")" : "");

				divRow	.append(divStatus)
						.append(divTitle)
						.append(divSpare)
						.append(divControl);

				$("#eventGuestList").append(divRow);

			});

			$("div#eventGuestList [data-toggle=\"tooltip\"]").tooltip({ animation: "animated bounceIn"});

/*		eventProfile.guests.forEach(function(item, i, arr)
			{
				var		removeSign = $("<span>").addClass("glyphicon glyphicon-remove cursor_pointer")
												.attr("data-action", "AJAX_removeEventGuest")
												.attr("data-id", item.id)
												.on("click", AreYouSure_ClickHandler);
				var 	singleEntry = $("<span>").addClass("label label-default");
				var		userInfo = item.name;
	
				if(item.name.length && item.nameLast.length) userInfo = $("<a>").attr("href", "/userprofile/" + item.id + "?rand=" + system_calls.GetUUID()).addClass("color_white").append(item.name + " " + item.nameLast);
				else if((typeof(item.email) != "undefined") && item.email.length) userInfo = item.email;
				singleEntry.append(userInfo)
							.append(" ")
							.append(removeSign);

				$("#eventGuestList").append(singleEntry)
									.append(" ");
			});
*/
	};

	var	AddHost_KeyupHandler = function()
	{
		if($("#eventHost").val().length)
		{
			$("#ButtonAddEventHost").removeAttr("disabled");
		}
		else
		{
			$("#ButtonAddEventHost").attr("disabled", "");
		}
	};

	var	AddHost_ClickHandler = function()
	{
		var		currentTag = $(this);

		system_calls.PopoverInfo(currentTag.attr("id"), "Наберите имя и фамилию, затем выберите его из выпадающего списка");
	};

	var	AddGuest_KeyupHandler = function()
	{
		if(system_calls.isValidEmail($("#eventGuest").val()))
		{
			$("#ButtonAddEventGuest").removeAttr("disabled");
		}
		else
		{
			$("#ButtonAddEventGuest").attr("disabled", "");
		}
	};

	var	AddGuest_ClickHandler = function()
	{
		var		currentTag = $(this);
		var		guestValue = $("#eventGuest").val();

		if((guestValue.length) && (system_calls.isValidEmail(guestValue)))
		{
			AddGuestServerRequest({user_id:"", user_email: guestValue});
		}
		else
		{
			system_calls.PopoverInfo(currentTag.attr("id"), "Наберите имя и фамилию, затем выберите его из выпадающего списка");
		}	
	};

	var	FriendModal_SelectAll_ChangeHandler = function(e)
	{
		var	allIngridients = $("input.friend_checkbox");
		var	checkedIngridientCounter = 0;

		allIngridients.each(function(idx) 
			{
				if($(this).is(":checked")) ++checkedIngridientCounter;
			});

		if(checkedIngridientCounter)
		{
			$("#GuestListModal .submit").removeAttr("disabled");
		}
		else
		{
			$("#GuestListModal .submit").attr("disabled", "disabled");
		}
	};

	var	FriendModal_SelectAll_ClickHandler = function(e)
	{
		var	currTag = $(this);
		var	allIngridients = $("input.friend_checkbox");
		var	checkedIngridientCounter = 0;
		var	switchPace = 100;
		var	actionToDo = $("#checkboxSelectAll").is(":checked");

		allIngridients.each(function(idx) 
			{
				var		currCheckBox = $(this);
				if($(this).is(":checked")) ++checkedIngridientCounter;
				setTimeout(function() 
					{
						currCheckBox.prop("checked", actionToDo ? "checked" : "");
						FriendModal_SelectAll_ChangeHandler();
					}, switchPace * idx);
			});
	};

	// --- function render friends list who has to be invited to event
	var	RenderModalFriendList = function(guestsList)
	{
		var	result = $();

		if(guestsList.length > 2)
		{
			var		selectAll = $("<input>")
											.attr("type", "checkbox")
											.addClass("selectAll")
											.attr("id", "checkboxSelectAll")
											.on("click", FriendModal_SelectAll_ClickHandler);
			var		selectAllTitle = $("<div>")
											.addClass("display_inline_block form-group")
											.append("<label for=\"checkboxSelectAll\" class=\"font_weight_normal\">&nbsp;Выбрать всех</label>");

			result = result.add(selectAll).add(selectAllTitle);
		}

		guestsList.forEach(function(item, i)
		{
			var		friendDiv = $("<div>")		.attr("id", "ModalFriendID" + item.id)
												.addClass("modalFriend");
			var		friendLabel = $("<label>")	.append(item.name + " " + item.nameLast)
												.addClass("font_weight_normal")
												.attr("for", "checkbox" + item.id);
			var		avatarLabel = $("<label>")	.attr("for", "checkbox" + item.id);
			var		avatarCanvas = $("<canvas>").attr("width", "25").attr("height", "25").width(25).height(25);
			var		canvasContext = avatarCanvas[0].getContext("2d");
			var		avatarPositioning = $("<div>").addClass("vertical_align_middle avatarPositioning");
			var		linkPositioning = $("<div>").addClass("vertical_align_middle linkPositioning");
			var		checkBoxPositioning = $("<div>").addClass("vertical_align_middle linkPositioning");
			var		checkBox = $("<input>")
												.attr("type", "checkbox")
												.addClass("friend_checkbox")
												.attr("id", "checkbox" + item.id)
												.attr("value", item.id)
												.on("change", FriendModal_SelectAll_ChangeHandler);


			DrawUserAvatar(canvasContext, item.avatar, item.name, item.nameLast);

			avatarPositioning.append(avatarLabel.append(avatarCanvas));
			linkPositioning.append(friendLabel);
			checkBoxPositioning.append(checkBox);
			friendDiv.append(checkBoxPositioning).append(" ").append(avatarPositioning).append(" ").append(linkPositioning);
			result = result.add(friendDiv);
		});

		FriendModal_SelectAll_ChangeHandler();

		return result;
	};

	var	GuestListModal_Submit_ClickHandler = function(e)
	{
		var		currTag = $(this);
		var		usersListToInvite = [];

		var	allIngridients = $("input.friend_checkbox");
		var	checkedIngridientCounter = 0;

		allIngridients.each(function(idx) 
			{
				if($(this).is(":checked")) usersListToInvite.push($(this).val());
			});

		AddGuestServerRequest({user_id:usersListToInvite.join(" "), user_email:""});
		$("#GuestListModal").modal("hide");
	};

	var	AddGuestFromList_ClickHandler = function()
	{
		var	modalID = "GuestListModal";

		$("#" + modalID).modal("show");
		$("#" + modalID + " .modal-body").empty().append("<div class=\"wait-notice\"><center>Подождите <span class='fa fa-refresh fa-spin fa-fw animateClass'></span></center>");

		$.getJSON(
			'/cgi-bin/event.cgi',
			{action:"AJAX_getFriendsNotOnEvent", event_id: eventProfile.id})
			.done(function(data) {
				$("#" + modalID + " .modal-body .wait-notice").hide(250);

				// --- wait required until "hide animation" finishes
				// --- this element will be removed from DOM-model
				setTimeout(function()
					{
						$("#" + modalID + " .modal-body")	.empty()
															.append(RenderModalFriendList(data.users));
					}, 300);
			})
			.fail(function() {
				$("#" + modalID + " .modal-body .wait-notice").hide(250);
				system_calls.PopoverInfo(modalID, "Ошибка отета сервера");
				console.error("ERROR parsing JSON response from server");
			});
	};

	var	AddGuest_InputHandler = function()
	{
		var	currentTag = $(this);
		var	currentValue = currentTag.val();

		// if(currentValue.length == 3)
		{
			$.getJSON(
				'/cgi-bin/index.cgi',
				{action:"JSON_getFindFriendsListAutocomplete", lookForKey:currentValue})
				.done(function(data) {
						var	AutocompleteList = [];

						data.forEach(function(item, i, arr)
							{
								AutocompleteList.push({id:item.id , label:item.name + " " + item.nameLast + " " + item.currentCity});
							});

						CreateAutocompleteWithSelectCallback("#" + currentTag.attr("id"), AutocompleteList, AddGuest_SelectHandler);
					})
				.fail(function() {
					console.error("ERROR parsing JSON response from server");
				});
		}
	};


	var	AddGuest_SelectHandler = function(event, ui)
	{
		var		userID = ui.item.id;
		var 	userLabel = ui.item.label;
	// var	AddCompanyFounder = function(userID, userName)
		var		isDuplicate = false;

		if(!system_calls.RemoveSpaces(userLabel))
		{
			system_calls.PopoverError("eventGuest", "Выберите имя из списка");
		}
		else
		{
			// --- check duplicates
			eventProfile.guests.forEach(function(item, i, arr)
				{
					if(item.user_id == userID) isDuplicate = true;
				});

			if(isDuplicate) {
				system_calls.PopoverError("eventGuest", "Уже в списке");
			}
			else
			{
				// --- check count
				if(eventProfile.guests.length > 300)
				{
					system_calls.PopoverError("eventGuest", "Слишком много людей");
				}
				else
				{
					AddGuestServerRequest({user_id:userID, user_email:""});
				}
			}
		}
	};


	// --- input:
	//		object {user_id:xxx, user_email:yyyy}
	var	AddGuestServerRequest = function(obj)
	{
		$("button#ButtonAddEventGuest").button("loading");
		$("input#eventGuest").attr("disabled", "");

		$.getJSON('/cgi-bin/event.cgi?action=AJAX_addEventGuest', {user_id: obj.user_id, user_email: obj.user_email, event_id: eventProfile.id})
			.done(function(data) {
				if(data.result === "success")
				{
					eventProfile.guests = data.guests;

					EventGuestZeroize();
					RenderEventGuests();
				}
				else
				{
					system_calls.PopoverError("eventGuest", data.description);
					console.debug("AddGuest_InputHandler: ERROR: " + data.description);
				}

				setTimeout(function(e) 
					{
						$("button#ButtonAddEventGuest").button("reset");
						$("input#eventGuest").removeAttr("disabled");
					}, 1000);
			})
			.fail(function()
				{
					console.error("ERROR: parsing JSON response from server");
					system_calls.PopoverError("eventGuest", "Ошибка ответа сервера");

					setTimeout(function(e) 
						{
							$("button#ButtonAddEventGuest").button("reset");
							$("input#eventGuest").removeAttr("disabled");
						}, 1000);
				});
	};

	var	GetRoundedTimestampFromSec = function(secSinceEpoch)
	{
		var		remainder = secSinceEpoch % 1800;
		var		roundedMultiplier = Math.round(remainder / 1800);
		var		roundedValueInSec = secSinceEpoch - remainder + roundedMultiplier * 1800;
		var		d1 = new Date(roundedValueInSec * 1000);

		return d1.getHours() + ":" + (d1.getMinutes() < 10 ? "0" : "") + d1.getMinutes();
	};

	var removeGeneralPreparation = function()
	{
		var		currTag = $(this);

		$("#AreYouSure #Remove").removeData(); 

		Object.keys(currTag.data()).forEach(function(item) { 
			$("#AreYouSure #Remove").data(item, currTag.data(item)); 
		});

		$("#AreYouSure").modal('show');
	};

	var	AreYouSure_ClickHandler = function()
	{
		var		currTag = $(this);

		$("#AreYouSure #Remove").removeData();
		Object.keys(currTag.data()).forEach(function(item) { 
			$("#AreYouSure #Remove").data(item, currTag.data(item)); 
		});

		if(currTag.data("action") == "AJAX_dropCompanyPosession")
		{
			$("#AreYouSure #Remove").data("id", companyProfile.id);
			$("#AreYouSure #Remove").data("action", "AJAX_dropCompanyPosession");
			$("#AreYouSure #Remove").data("script", "company.cgi");

			$("#AreYouSure .description").empty().append("Вы больше _НЕ_ будете владеть компанией.<ul><li>_НЕ_ сможете публиковать новости от имени компании</li><li>_НЕ_ сможете искать сотрудников в компанию</li></ul>");
			$("#AreYouSure #Remove").empty().append("Уверен");
		}
		else
		{
			$("#AreYouSure .description").empty();
			$("#AreYouSure #Remove").empty().append("Удалить");
		}

		$("#AreYouSure").modal("show");
	};

	var	AreYouSure_RemoveHandler = function() {
		var		affectedID = $("#AreYouSure #Remove").data("id");
		var		affectedAction = $("#AreYouSure #Remove").data("action");
		var		affectedScript = $("#AreYouSure #Remove").data("script");

		if((typeof(affectedScript) == "undefined") || (affectedScript === ""))
			affectedScript = "event.cgi";

		$("#AreYouSure").modal('hide');

		$.getJSON('/cgi-bin/' + affectedScript + '?action=' + affectedAction, {id: affectedID, rand: Math.random() * 1234567890})
			.done(function(data) {
				var		removeItemIndex;

				if(affectedAction == "AJAX_removeEventHost")
				{
					if(data.result === "success")
					{
						var		my_user_id = $("#myUserID").attr("data-myuserid");

						if(my_user_id == data.removed_user_id)
						{
							window.location.replace("/events_list?rand=" + Math.random() * 1234567890);
						}

						removeItemIndex = -1;

						eventProfile.hosts.forEach(function(item, i, arr)
						{
							if(item.id == affectedID) removeItemIndex = i;
						});

						if(removeItemIndex >= 0) eventProfile.hosts.splice(removeItemIndex, 1);
						RenderEventHosts();
					}
					else
					{
						system_calls.PopoverError("eventHost", data.description);
					}
				}
				else if(affectedAction == "AJAX_removeEventGuest")
				{
					if(data.result === "success")
					{
						removeItemIndex = -1;

						eventProfile.guests.forEach(function(item, i, arr)
						{
							if(item.id == affectedID) removeItemIndex = i;
						});

						if(removeItemIndex >= 0) eventProfile.guests.splice(removeItemIndex, 1);
						$("#GuestRow" + affectedID).hide(250);
					}
					else
					{
							system_calls.PopoverError("eventGuestList", data.description);
					}
				}
				else if(affectedAction == "AJAX_removeEvent")
				{
					if(data.result === "success")
					{
						window.location.replace("/events_list?rand=" + Math.random()*234567890);
					}
					else
					{
						system_calls.PopoverError("ButtonRemoveEvent", data.description);
					}
				}
				else if(data.result === "success")
				{

				}
				else
				{
					console.error("AreYouSure_RemoveHandler: ERROR: " + data.description);
				}
			})
			.fail(function()
				{
					console.error("AreYouSure_RemoveHandler: ERROR: parsing json response from server");
				});
	};

	var	editableFuncReplaceSpanToInput = function () 
	{
		var	tag = $("<input>", {
			val: $(this).text(),
			type: "text",
			id: $(this).attr("id"),
			class: $(this).attr("class")
		});


		var keyupEventHandler = function(event) {
			/* Act on the event */
			var	keyPressed = event.keyCode;

			if(keyPressed == 13) 
			{
				/*Enter pressed*/
				editableFuncReplaceInputToSpan($(this));
			}
			if(keyPressed == 27) 
			{
				/*Escape pressed*/
				$(this).val($(this).attr("initValue"));
				editableFuncReplaceInputToSpan($(this));
			}

		};

		$(tag).attr("initValue", $(this).text());
		$(tag).data("id", $(this).data("id"));
		$(tag).data("action", $(this).data("action"));
		$(tag).width($(this).width() + 30);

		$(this).replaceWith(tag);
		$(tag).on('keyup', keyupEventHandler);
		$(tag).removeClass('editable_highlited_class');

		if(!$(this).hasClass("formatDate")) 
		{
			$(tag).on('blur', editableFuncReplaceInputToSpan);
		}
		if($(tag).data("action") == "AJAX_updateStartDate") 
		{
			var tagValue = system_calls.ConvertMonthNameToNumber($(this).text());

			tagValue = tagValue.replace(/ /g, "/");

			$(tag).attr("initValue", tagValue);
			$(tag).val(tagValue);
			$(tag).on("change", UpdateEventStartDatePickerOnChangeHandler);
			$(tag).datepicker({
				firstDay: 1,
				dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
				dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
				monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
				monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
				dateFormat: "dd/mm/yy",
				changeMonth: true,
	  			changeYear: true,
	  			showOtherMonths: true
	  			// maxDate: system_calls.ConvertMonthNameToNumber($(tag).next().val()) || system_calls.ConvertMonthNameToNumber($(tag).next().text())
			});
		}

		$(tag).select();
	};

	var	GetEventStartTimestamp = function()
	{
		var		dateArr, dateString;
		var		timeArr = ($("#paragraphStartTime").val() || $("#paragraphStartTime").text()).split(/:/);
		var		dateObj;

		if($("#paragraphStartDate").children().first().text().length)
		{
			// --- datePicker has not been clicked
			dateString = system_calls.ConvertMonthNameToNumber($("#paragraphStartDate").children().first().text());
			dateString = dateString.replace(/ /g, "/");
		}
		else if($("#paragraphStartDate").children().first().val().length)
		{
			// --- datePicker has been clicked
			dateString = $("#paragraphStartDate input").val();
		}
		else
		{
			var	d1 = new Date();
			dateString =  d1.GetDate() + "/" + (d1.GetMonth() + 1) + "/" + (d1.GetYear() + 1900);
		}
		dateArr = dateString.split(/\//);

		if((dateArr.length == 3) && (timeArr.length == 2))
			dateObj = new Date(parseInt(dateArr[2]), parseInt(dateArr[1]) - 1, parseInt(dateArr[0]), parseInt(timeArr[0]), parseInt(timeArr[1]));
		else
			dateObj = new Date();

		return Math.round(dateObj.getTime() / 1000);
	};

	var	editableFuncReplaceInputToSpan = function (param) 
	{
		var 	currentTag = ((typeof param.html == "function") ? param : $(this));
		var		newTag = $("<span>", {
					text: $(currentTag).val().replace(/^\s+/, '').replace(/\s+$/, ''),
					id: $(currentTag).attr("id"),
					class: $(currentTag).attr("class")
				});
		var		ajaxAction;
		var		ajaxActionID;
		var		ajaxValue;

		$(newTag).data("id", $(currentTag).data("id"));
		$(newTag).data("action", $(currentTag).data("action"));

		ajaxAction = $(newTag).data("action");
		ajaxActionID = $(newTag).data("id");
		ajaxValue = $(newTag).text();

		if(($(currentTag).data("action") == "AJAX_updateStartDate"))
		{
			// --- don't replace datepicker back to span
			// --- it expose bootstrap error, few ms after replacement

			eventProfile.startTimestamp = GetEventStartTimestamp()
			ajaxValue = eventProfile.startTimestamp;
		}
		else
		{
			$(currentTag).replaceWith(newTag);
			$(newTag).on('click', editableFuncReplaceSpanToInput);
			$(newTag).mouseenter(editableFuncHighlightBgcolor);
			$(newTag).mouseleave(editableFuncNormalizeBgcolor);
		}

		if(system_calls.ConvertTextToHTML($(currentTag).val()) == system_calls.ConvertTextToHTML($(currentTag).attr("initValue")))
		{
			// --- value hasn't been changed
			// --- no need to update server part
			console.debug("editableFuncReplaceInputToSpan: value hasn't been changed");
		}
		else
		{

			$.ajax({
				url:"/cgi-bin/event.cgi",
				data: {action:ajaxAction, id:ajaxActionID, value:system_calls.ConvertTextToHTML(ajaxValue), eventid: eventProfile.id}
			}).done(function(data)
				{
					try // --- catch JSON.parse
					{
						var ajaxResult = JSON.parse(data);

						if(ajaxResult.result == "success")
						{

							if(ajaxAction == "AJAX_updateEventLink")
							{
								eventProfile.link = (ajaxValue.length ? ajaxValue : "(отсутствует)");
								$("#eventLink").empty().append(eventProfile.link);
							}
							else if(ajaxAction == "AJAX_updateEventEmployeeNumber")
							{
								eventProfile.numberOfEmployee = (ajaxValue.length ? ajaxValue : "0");
								$("#eventNumberOfEmployee").empty().append(eventProfile.numberOfEmployee);
							}
						}
						else
						{
							console.debug("editableFuncReplaceInputToSpan: ERROR in ajax [action = " + ajaxAction + ", id = " + eventProfile.id + ", ajaxValue = " + ajaxValue + "] " + ajaxResult.description);

							if((ajaxAction == "AJAX_updateAddress") || (ajaxAction == "AJAX_updateEventLink") || (ajaxAction == "AJAX_updateTitle"))
							{
								system_calls.PopoverError(newTag.attr("id"), ajaxResult.description);
								$("#" + newTag.attr("id")).empty().append($(currentTag).attr("initValue"));
							}
						}
					}
					catch(e)
					{
						console.debug("editableFuncReplaceInputToSpan:ERROR: can't parse JSON form server");
					}

				});
		}

		// --- Check if first/last name is empty. In that case change it to "Без хххх"
		// --- !!! Важно !!! Нельзя передвигать наверх. Иначе не произойдет обновления в БД
		if($("#firstName").text() === "") { $("#firstName").text("Без имени"); }
		if($("#lastName").text() === "") { $("#lastName").text("Без фамилии"); }
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
		$(newTag).on('click', editableFuncReplaceParagraphToTextarea);
		$(newTag).mouseenter(editableFuncHighlightBgcolor);
		$(newTag).mouseleave(editableFuncNormalizeBgcolor);
	};

	var	editableFuncReplaceToParagraphAccept = function (currentTag) {
		var currentContent = $(currentTag).val();

		if(system_calls.ConvertTextToHTML($(currentTag).val()) != system_calls.FilterUnsupportedUTF8Symbols($(currentTag).attr("initValue")))
		{
			// --- text has been changed

			if(currentTag.data("action") === "updateEventDescription") 
			{
				var		filteredEventDescription = system_calls.FilterUnsupportedUTF8Symbols(currentContent);

				if((filteredEventDescription === "") || (filteredEventDescription === "(описание отсутствует)")) 
				{
					filteredEventDescription = "";	
				}

				if(filteredEventDescription.length > 16384)
				{
					filteredEventDescription = filteredEventDescription.substr(0, 16384);
					console.debug("editableFuncReplaceToParagraphAccept:ERROR: description bigger than 16384 symbols");
				}

				eventProfile.description = filteredEventDescription;

				$.post('/cgi-bin/event.cgi?rand=' + Math.floor(Math.random() * 1000000000), 
					{
						description: filteredEventDescription,
						action: "AJAX_updateEventDescription",
						eventid: eventProfile.id,
						rand: Math.floor(Math.random() * 1000000000)
					}).done(function(data) {
						try
						{
							var		resultJSON = JSON.parse(data);

							if(resultJSON.result === "success")
							{
								if(filteredEventDescription == "")
								{
									$("#eventDescription").empty().append("(описание отсутствует)");
								}
							}
							else
							{
								console.debug("editableFuncReplaceToParagraphAccept: ERROR: " + resultJSON.description);
							}
						}
						catch(e)
						{
							console.error("ERROR: parse JSON in server response (" + e.message + ")");
						}
					})
					.fail(function(data) {
						console.error("ERROR: getting server response");
					});
			} // --- if action == updateEventDescription
		} // --- if textarea value changed
		else
		{
			console.debug("editableFuncReplaceToParagraphAccept: textarea value hasn't change")
		}

		editableFuncReplaceToParagraphRenderHTML(currentTag, system_calls.ConvertTextToHTML(currentContent));

	};

	var	editableFuncReplaceToParagraphReject = function (currentTag) {
		/*Escape pressed*/
		editableFuncReplaceToParagraphRenderHTML(currentTag, currentTag.attr("initValue"));
	};

	var	editableFuncReplaceParagraphToTextarea = function (e) 
	{
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


	var UpdateEventStartDatePickerOnChangeHandler = function(event) {
		var		ajaxAction = $(this).data("action");
		var		ajaxActionID = $(this).data("id");
		var		ajaxValue;
		var		currTagID = $(this).attr("id");

		if(ajaxAction == "AJAX_updateStartDate")
		{
			eventProfile.startTimestamp = GetEventStartTimestamp();
			ajaxValue = eventProfile.startTimestamp;
		}

		if(ajaxValue)
		{
			/* Act on the event */

			$.getJSON("/cgi-bin/event.cgi",
				{action:ajaxAction, id:ajaxActionID, value:ajaxValue, eventid:eventProfile.id})
				.done(function (data) 
				{
					if(data.result == "success")
					{
						eventProfile.startTimestamp = ajaxValue;
					}
					else
					{
						console.debug("UpdateEventStartDatePickerOnChangeHandler: ERROR: " + data.description);
						system_calls.PopoverError(currTagID, data.description);
					}

				})
				.fail(function()
					{
						system_calls.PopoverError(currTagID, "Ошибка ответа сервера");
					});
		}
		else
		{
			system_calls.PopoverError(currTagID, "Выберите дату начала события");
/*			$("#"+ currTagID).popover({"content": "Выберите дату начала события"})
								.popover("show")
								.parent().removeClass("has-success")
										.addClass("has-feedback has-error");
			setTimeout(function () 
				{
					$("#"+ currTagID).popover("destroy");
				}, 3000);
*/		}
	};

	var	editableFuncReplaceSpanToSelect = function () 
	{
		var	currentValue = $(this).data("value");
		var	tag = $("<select>", {
			id: $(this).attr("id"),
			class: $(this).attr("class")
		});

		if($(this).data("action") == "AJAX_updateAccessType")
		{
			Object.keys(system_calls.eventTypes).forEach(function(item, i , arr)
			{
				$(tag).append($("<option>")	.append(system_calls.eventTypes[item])
											.attr("value", item));
			})
		}
		if($(this).data("action") == "AJAX_updateStartTime")
		{
			Object.keys(system_calls.startTime).forEach(function(item, i , arr)
			{
				$(tag).append($("<option>")	.append(system_calls.startTime[item])
											.attr("value", item));
			})
		}

		$(tag).val(currentValue); 

		var	selectChangeHandler = function(event) 
		{
			editableFuncReplaceSelectToSpan($(this), editableFuncReplaceSpanToSelect);
		};

		var keyupEventHandler = function(event) 
		{
			/* Act on the event */
			var	keyPressed = event.keyCode;

			if(keyPressed == 13) {
				/*Enter pressed*/
				selectChangeHandler();
			}
			if(keyPressed == 27) {
				/*Escape pressed*/
				$(this).val($(this).attr("initValue"));
				editableFuncReplaceSelectToSpan($(this), editableFuncReplaceSpanToSelect);
			}
		};

		$(tag).attr("initValue", $(this).data("value"));
		$(tag).data("id", $(this).attr("id"));
		$(tag).data("action", $(this).data("action"));
		$(tag).width($(this).width()*2);

		$(this).replaceWith(tag);
		$(tag).on('keyup', keyupEventHandler);
		$(tag).on('change', selectChangeHandler);
		$(tag).on('blur', selectChangeHandler);
		$(tag).removeClass('editable_highlited_class');

		if($(tag).data("action") == "XXXXXXXXXX") 
		{
		}

		$(tag).select();
	}



	// --- Replacement Select to Span
	// --- input: 1) tag
	// ---        2) function to call to convert Span->Select
	var	editableFuncReplaceSelectToSpan = function (param, funcFromSelectToSpan) 
	{
		var		ajaxAction;
		var		ajaxActionID;
		var		ajaxValue;

		var 	currentTag = ((typeof param.html == "function") ? param : $(this));
		var		initValue = $(currentTag).attr("initValue").replace(/^\s+/, '').replace(/\s+$/, '');

		var	newTag = $("<span>", {
			text: $(currentTag).children("[value='" + currentTag.val() + "']").text().replace(/^\s+/, '').replace(/\s+$/, ''),
			id: $(currentTag).attr("id"),
			class: $(currentTag).attr("class")
		});

		$(newTag).data("id", $(currentTag).data("id"));
		$(newTag).data("action", $(currentTag).data("action"));
		$(newTag).data("value", $(currentTag).val());

		$(currentTag).replaceWith(newTag);
		$(newTag).on('click', funcFromSelectToSpan);
		$(newTag).mouseenter(editableFuncHighlightBgcolor);
		$(newTag).mouseleave(editableFuncNormalizeBgcolor);

		ajaxAction = $(newTag).data("action");
		ajaxActionID = $(newTag).data("id");
		ajaxValue = $(currentTag).val();

		if(ajaxAction == "AJAX_updateStartTime")
		{
			eventProfile.startTimestamp = GetEventStartTimestamp();
			ajaxValue = eventProfile.startTimestamp;
		}

		if(ajaxValue == initValue)
		{
			console.debug("editableFuncReplaceSelectToSpan: value hasn't been changed");
		}
		else
		{
			// --- event start has been changed
			$.ajax({
					url:"/cgi-bin/event.cgi",
					data: {action:ajaxAction, id:ajaxActionID, value:ajaxValue, eventid: eventProfile.id}
				}).done(function(data)
				{
					try
					{
						var		ajaxResult = JSON.parse(data);
						if(ajaxResult.result == "success")
						{
							if(ajaxAction == "AJAX_updateAccessType")
							{
								eventProfile.accessType = ajaxValue;
							}
						}
						else
						{
							console.debug("editableFuncReplaceSelectToSpan: ERROR in ajax [action = " + ajaxAction + ", id = " + actionID + ", ajaxValue = " + ajaxValue + "] " + ajaxResult.description);
						}
					}
					catch(e)
					{
						console.debug("editableFuncReplaceSelectToSpan:ERROR: can't parse JSON form server");
					}

				});
		} // --- if currValue == initValue
	}; // --- function

	var RenderEventLogo = function()
	{
		var		tagCanvas = $("#canvasForEventLogo");
		var		logoPath = "";

		$('#progress .progress-bar').css('width', '0%');
		if(eventProfile.logo_filename.length) logoPath = "/images/events/" + eventProfile.logo_folder + "/" + eventProfile.logo_filename;


		system_calls.RenderCompanyLogo(tagCanvas[0].getContext("2d"), logoPath, eventProfile.title, " ");
	};

	var editableFuncHighlightBgcolor = function () {
		$(this).addClass("editable_highlited_class", 400);
	};

	var editableFuncNormalizeBgcolor = function () {
		$(this).removeClass("editable_highlited_class", 200, "easeInOutCirc");
	};

	var NoGift_ClickHeader = function(e)
	{
		var   currentTag = $(this);
		var   state = currentTag.data("state");

		// --- switch state
		if(state == "Y") state = "N"; else state = "Y";


		$.getJSON('/cgi-bin/event.cgi?action=' + (state == "Y" ? "AJAX_setNoGift_Y" : "AJAX_setNoGift_N"), {event_id: eventProfile.id})
		.done(function(data) {
			if(data.result == "success")
			{	
				currentTag.data("state", state);
				eventProfile.hideGifts = state;
				RenderGUINoGiftLabel();
			}
			else
			{
			  console.debug("ERROR: " + data.description);
			}
		})
		.fail(function(data){
			console.debug("ERROR: fail parse server responce");
		});
	};

	var	InitNoGiftLabel = function()
	{
		$("#switcherLabelNoGift").data("state", eventProfile.hideGifts);

		if(eventProfile.hideGifts == "N")
			$("#switcherNoGift").attr("checked", "checked");

		RenderGUINoGiftLabel();
	};

	var RenderGUINoGiftLabel = function()
	{
		var   currentTag = $("#switcherLabelNoGift");

		if(currentTag.data("state") == "Y")
			$("#switcherNoGiftDescription").empty().append("Без подарков");
		else
			$("#switcherNoGiftDescription").empty().append("Подарки нужны");
	};

	var	RenderFavoriteChecklistTabs = function(checklists)
	{
		$("#favorite_checklists_placeholder").empty().append(common_bestbounty.GetCheckListFavoritTabs_DOM(checklists, "_favorite", Tab_ClickHandler));
	};

	var	Tab_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	curr_id = curr_tag.attr("data-id");
		var	pane_tag = $(".__tab_pane_favorite[data-id=\"" + curr_id + "\"]");

		if(pane_tag.html().length) {}
		else
		{
			GetFavoriteChecklistItemsFromTheServer(curr_id);
		}
	};

	var	GetFavoriteChecklistItemsFromTheServer = function(id)
	{
		var		curr_tag = $(".__tab_pane_favorite[data-id=\"" + id + "\"]");

		if(curr_tag.empty())
		{
			$.getJSON(
				'/cgi-bin/event.cgi',
				{
					action: "AJAX_getFavoriteChecklistItems",
					id: id,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						if((typeof(data) != "undefined") && (typeof(data.checklists) != "undefined"))
						{
							RenderFavoriteChecklist(id, data.checklists);
						}
						else
						{
							system_calls.PopoverError(curr_tag, "Ошибка в JSON-объекте");
						}
					}
					else
					{
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(data)
				{
					setTimeout(function() {
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					}, 200);
				});
		}
	};

	var	RenderFavoriteChecklist = function(favorite_checklist_id, chacklists)
	{
		$(".__tab_pane_favorite[data-id=\"" + favorite_checklist_id + "\"]").empty().append(eventChecklist_global.FavoriteChecklist_GetDOM(favorite_checklist_id, chacklists, AddItemsFromFavoriteChecklist_ClickHandler));
	};

	var	AddItemsFromFavoriteChecklist_ClickHandler = function(e)
	{
		var	curr_tag			= $(this);
		var	checklist_id		= curr_tag.attr("data-checklist_id");

		if(checklist_id)
		{
			$.getJSON(
				'/cgi-bin/event.cgi',
				{
					action: "AJAX_addFavoriteChecklistItems",
					event_id: eventProfile.id,
					from_checklist_id: checklist_id,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						RenderEventProfileFromServer();
					}
					else
					{
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(data)
				{
					setTimeout(function() {
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					}, 200);
				});
		}
	}

	var	AddCheckListitem_ClickHandler = function(e)
	{
		var	curr_tag		= $(this);
		var	category_tag	= $("#custom_checklist_item_category");
		var	title_tag		= $("#custom_checklist_item_title");
		var	category		= category_tag.val();
		var	title			= title_tag.val();

		var	isValid = function()
		{
			return (title.length > 0);
		};

		if(isValid())
		{
			$.getJSON(
				'/cgi-bin/event.cgi',
				{
					action: "AJAX_addChecklistItem",
					title: title,
					category: category,
					event_id: eventProfile.id,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						RenderEventProfileFromServer();
						system_calls.PopoverInfo(curr_tag, "Добавлено");
						title_tag.val("");
					}
					else
					{
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(data)
				{
					setTimeout(function() {
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					}, 200);
				});
		}
		else
		{
			system_calls.PopoverError(curr_tag, "Заполните название")
		}
	};

	return {
		Init: Init,
		eventProfile: eventProfile
	};

})();
