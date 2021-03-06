var	create_event = create_event || {};

create_event = (function()
{
	"use strict";

	var		eventProfile = {};
	var		uploadImg;
	var		imgLogo;

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
		$("#submitButton").on("click", CreateNewEventClickHandler);
		$("#cancelButton").on("click", function() { window.location.href="/feed?rand=" + system_calls.GetUUID(); });
		$("#fileupload").on("change", LogoUploadChangeHandler);
		$("#eventDate").datepicker({
			firstDay: 1,
			dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
			dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
			monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
			monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
			dateFormat: "dd M yy",
			changeMonth: true,
			changeYear: true,
			defaultDate: "+1w",
			numberOfMonths: 1
			
		});

		InitImgUploaderClickHandler();
		RenderEventLogo();

		{
			// --- init date to next date
			var	d1 = new Date();
			var	d2 = new Date(d1.getTime() + 24 * 3600 * 1000);

			$("#eventDate").val(system_calls.GetFormattedDateFromSeconds(d2.getTime() / 1000, "DD MMM YYYY"));
		}

/*
		$(function () 
		{
		    $('#fileupload').fileupload({
		        url: '/cgi-bin/eventlogouploader.cgi?uploadType=eventLogo',
		        formData: {eventid:eventProfile.id},
		        dataType: 'json',
		        maxFileSize: 30 * 1024 * 1024, 
		        acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,


		        done: function (e, data) {

		        	$.each(data.result, function(index, value) 
		        		{
			            	if(value.result == "error")
			            	{
			            		console.error("fileupload: done handler: ERROR uploading file [" + value.fileName + "] error code [" + value.textStatus + "]");
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

			            		console.error("fileupload: done handler: uploading success original file[" + value.fileName + "], destination file[folder:" + eventProfile.logo_folder + ", filename:" + eventProfile.logo_filename + "]");

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
*/
	};

	var InitImgUploaderClickHandler = function()
	{

		$("#canvasForEventLogo")
						.on("click", function() { $("#fileupload").click(); })
						.addClass("cursor_pointer");
	};

	var	LogoUploadChangeHandler = function(e)
	{
		var		tmpURLObj = URL.createObjectURL(e.target.files[0]);

		imgLogo = new Image();

		//--- save file for future upload
		uploadImg = e.target.files[0];

		imgLogo.onload = function(e)
		{
			// --- new title means image have to be uploaded, after clicking "Create event"
			imgLogo.title = "newLogo";

			system_calls.DrawImgOnCanvas_ScaleImgDownTo640x480($("#canvasForEventLogo")[0], imgLogo);
		};

		imgLogo.src = tmpURLObj;
	};

	var	CreateNewEventClickHandler = function()
	{
		var		currTag = $(this);

		var		title = $("#eventTitle").val();
		var		time = $("#eventTime").val();
		var		date = $("#eventDate").val();
		var		address = $("#eventAddress").val();
		var		accessType = $("#eventAccessType").val();
		var		description = $("#eventDescription").val();
		var		timestamp;
		// var		tmp = link.match(/[\da-zA-Z_]+/) || [""];

		// --- build event timestamp
		date = system_calls.ConvertMonthNameToNumber(date);
		date = date.split(" ");
		time = time.split(":");
		if(date.length != 3)
		{
			date = "";
		}
		else if (time.length != 2)
		{
			time = "";
		}
		else
		{
			timestamp = new Date(parseInt(date[2]), parseInt(date[1]) - 1, parseInt(date[0]), parseInt(time[0]), parseInt(time[1]));
		}

		if(!title.length)
		{
			system_calls.PopoverError("eventTitle", "Выберите название события");
			system_calls.PopoverError("submitButton", "Выберите название события");
		}
		else if(!date.length)
		{
			system_calls.PopoverError("eventDate", "Укажите дату начала события");
			system_calls.PopoverError("submitButton", "Укажите дату начала события");
		}
		else if(!time.length)
		{
			system_calls.PopoverError("eventTime", "Укажите время начала события");
			system_calls.PopoverError("submitButton", "Укажите время начала события");
		}
		else if(!accessType.length)
		{
			system_calls.PopoverError("eventAccessType", "Открыто для всех или по приглашению ?");
			system_calls.PopoverError("submitButton", "Открыто для всех или по приглашению ?");
		}
		else
		{
			$("#submitButton").button("loading");

			$.getJSON("/cgi-bin/event.cgi?action=AJAX_createEvent", {title:title, timestamp:timestamp.getTime() / 1000, accessType:accessType, address: address, description:description})
				.done(function(eventData)
				{
					if(eventData.result === "success")
					{
						if(eventData.events.length)
						{
							if(eventData.events[0].id.length)
							{
								if((typeof(imgLogo) != "undefined") && (typeof(imgLogo.title) != "undefined") && (imgLogo.title == "newLogo"))
								{
									var		formData = new FormData();
									var		blob = system_calls.GetBlob_ScaledDownTo640x480(imgLogo);

									formData.append("type", "event");
									formData.append("id", eventData.events[0].id);

									formData.append("cover", blob, "cover.jpg");
									formData.append("rand", system_calls.GetUUID());

									$.ajax({
										url: "/cgi-bin/generalimageuploader.cgi",
										cache: false,
										contentType: false,
										processData: false,
										async: true,
										data: formData,
										type: "post",
										success: function(imageData) {
											// debugger;
											window.location.href = "/edit_event?eventid=" + eventData.events[0].id + "&rand=" + system_calls.GetUUID();
										},
										error: function(imageData) {
											var		jsonObj = JSON.parse(imageData);
											console.error("AddGeneralCoverUploadChangeHandler:upload:failHandler:ERROR: " + jsonObj.textStatus);

											window.location.href = "/edit_event?eventid=" + eventData.events[0].id + "&rand=" + system_calls.GetUUID();
										}
									});
								}
								else
								{
									window.location.href = "/edit_event?eventid=" + eventData.events[0].id + "&rand=" + system_calls.GetUUID();
								}
							}
							else
							{
								console.error("CreateNewEventClickHandler: ERROR: event.id is empty");
								window.location.href = "/events_i_own_list?rand=" + system_calls.GetUUID();
							}
						}
						else
						{
							console.error("CreateNewEventClickHandler: ERROR: events array is empty");
							window.location.href = "/events_i_own_list?rand=" + system_calls.GetUUID();
						}
					}
					else
					{
						console.error("CreateNewEventClickHandler: ERROR: " + eventData.description);

						if(eventData.description == "re-login required") 
							window.location.href = eventData.link;
						else
						{
							system_calls.PopoverError("submitButton", eventData.description);
						}

					}

					window.setTimeout(function(){ $("#submitButton").button("reset"); }, 500);
				})
				.fail(function()
					{
						console.error("CreateNewEventClickHandler:ERROR: can't parse JSON response from server");
						
						window.setTimeout(function(){ $("#submitButton").button("reset"); }, 500);
					});
		}
	};

	var	AutocompleteCallbackChange = function (event, ui) 
	{
		var		currTag = $(this);

		console.error ("AutocompleteCallbackChange: change event handler"); 

		if(currTag.val() == "")
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
	// ---       callbackChange - function(event, ui)
	var	CreateAutocompleteWithChangeCallback = function(elem, srcData, callbackChange)
	{
		if($(elem).length && srcData.length)
		{
			$(elem).autocomplete({
				delay : 300,
				source: srcData,
				minLength: 3,
				change: callbackChange,
				close: function (event, ui) 
				{ 
					// console.error ("CreateAutocompleteWithChangeCallback: close event handler"); 
				},
				create: function () {
					// console.error ("CreateAutocompleteWithChangeCallback: _create event handler"); 
				},
				_renderMenu: function (ul, items)  // --- requires plugin only
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
			console.error("CreateAutocompleteWithChangeCallback:ERROR: srcData or '" + elem + "' is empty");
		}
	};

	var AddDataForProfileCollapsibleInit = function()
	{
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancyTitle", JSON_eventPosition, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancyCity", JSON_geoLocality, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancyLanguage1", JSON_language, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancyLanguage2", JSON_language, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancyLanguage3", JSON_language, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancySkill1", JSON_skill, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancySkill2", JSON_skill, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancySkill3", JSON_skill, AutocompleteCallbackChange);

		// --- Initialize autocomplete after initial loading data
		if(typeof(eventProfile.open_vacancies) != "undefined")
			eventProfile.open_vacancies.forEach(function(item, i, arr)
			{
				if($("input#OpenVacancy" + item.id + "Edit_Title").length)		CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Title", JSON_eventPosition, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_City").length) 		CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_City", JSON_geoLocality, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Language1").length) 	CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Language1", JSON_language, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Language2").length) 	CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Language2", JSON_language, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Language3").length) 	CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Language3", JSON_language, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Skill1").length) 	CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Skill1", JSON_skill, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Skill2").length) 	CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Skill2", JSON_skill, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Skill3").length) 	CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Skill3", JSON_skill, AutocompleteCallbackChange);
			});

	};

	var	InputKeyupHandler = function(e)
	{
		var		keyPressed = e.keyCode;
		var		currentTag = $(this);

		if(currentTag.data("action") == "AJAX_addEditEventAddEventFounder")
		{
			if(keyPressed == 13) AddEventFounder("", currentTag.val());
		}
		if(currentTag.data("action") == "AJAX_addEditEventAddEventOwner")
		{
			if(keyPressed == 13) AddEventOwner("", currentTag.val());
		}
		if(currentTag.data("action") == "AJAX_addEditEventAddEventIndustry")
		{
			if(keyPressed == 13) AddEventIndustry("", currentTag.val());
		}
	};

	var	RenderEventTitle = function()
	{
		$("span#eventTitle").html(eventProfile.title);
		$("span#eventLink").html(eventProfile.link);
		$("span#eventFoundationDate").html(system_calls.GetLocalizedDateNoTimeFromSeconds(eventProfile.eventTimestampCreation));
		$("p#eventDescription").html(eventProfile.description ? eventProfile.description : "(описание отсутствует)");

		$("div#eventInfo .creatableSpan").on("click", creatableFuncReplaceSpanToInput);
		$("div#eventInfo .creatableSpan").mouseenter(creatableFuncHighlightBgcolor);
		$("div#eventInfo .creatableSpan").mouseleave(creatableFuncNormalizeBgcolor);

		$("div#eventInfo .creatableParagraph").on("click", creatableFuncReplaceParagraphToTextarea);
		$("div#eventInfo .creatableParagraph").mouseenter(creatableFuncHighlightBgcolor);
		$("div#eventInfo .creatableParagraph").mouseleave(creatableFuncNormalizeBgcolor);

		$("div#eventInfo .creatableSelectEventType").on("click", creatableFuncReplaceSpanToSelectEventType);
		$("div#eventInfo .creatableSelectEventType").mouseenter(creatableFuncHighlightBgcolor);
		$("div#eventInfo .creatableSelectEventType").mouseleave(creatableFuncNormalizeBgcolor);
	};


	var removeGeneralPreparation = function()
	{
		var		currTag = $(this);

		$("#AreYouSure #Remove").removeData(); 

		Object.keys(currTag.data()).forEach(function(item) { 
			$("#AreYouSure #Remove").data(item, currTag.data(item)); 
		});

		$("#AreYouSure").modal("show");
	};

	var	AreYouSureRemoveHandler = function() {
		var		affectedID = $("#AreYouSure #Remove").data("id");
		var		affectedAction = $("#AreYouSure #Remove").data("action");
		var		affectedScript = $("#AreYouSure #Remove").data("script");

		if((typeof(affectedScript) == "undefined") || (affectedScript == ""))
			affectedScript = "event.cgi";

		$("#AreYouSure").modal("hide");

		$.getJSON("/cgi-bin/" + affectedScript + "?action=" + affectedAction, {id: affectedID, rand: Math.random() * 1234567890})
			.done(function(data) {
				if(data.result === "success")
				{
				}
				else
				{
					console.error("AreYouSureRemoveHandler: ERROR: " + data.description);
				}
			});

		// --- update GUI has to be inside getJSON->done->if(success).
		// --- To improve User Experience (react on user actions immediately, in-spite on potential server error's) 
		if(affectedAction == "AJAX_removeEventFounder")
		{
			var		removeItemIndex = -1;

			eventProfile.founders.forEach(function(item, i, arr)
			{
				if(item.id == affectedID) removeItemIndex = i;
			});

			if(removeItemIndex >= 0) eventProfile.founders.splice(removeItemIndex, 1);
			RenderEventFounders();
		}
		if(affectedAction == "AJAX_removeEventOwner")
		{
			var		removeItemIndex = -1;

			eventProfile.owners.forEach(function(item, i, arr)
			{
				if(item.id == affectedID) removeItemIndex = i;
			});

			if(removeItemIndex >= 0) eventProfile.owners.splice(removeItemIndex, 1);
			RenderEventOwners();
		}
		if(affectedAction == "AJAX_removeEventIndustry")
		{
			var		removeItemIndex = -1;

			eventProfile.industries.forEach(function(item, i, arr)
			{
				if(item.event_industry_ref_id == affectedID) removeItemIndex = i;
			});

			if(removeItemIndex >= 0) eventProfile.industries.splice(removeItemIndex, 1);
			RenderEventIndustries();
		}
		if(affectedAction == "AJAX_removeOpenVacancy")
		{
			var		removeItemIndex = -1;

			eventProfile.open_vacancies.forEach(function(item, i, arr)
			{
				if(item.id == affectedID) removeItemIndex = i;
			});

			if(removeItemIndex >= 0) eventProfile.open_vacancies.splice(removeItemIndex, 1);
			RenderEventOpenVacancies();
		}
		if(affectedAction == "AJAX_rejectCandidate")
		{
			var		removeItemIndex = -1;

			$("#rowAppliedCandidate" + affectedID).remove();
		}
	};

	var	creatableFuncReplaceSpanToInput = function () 
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
				creatableFuncReplaceInputToSpan($(this));
			}
			if(keyPressed == 27) 
			{
				/*Escape pressed*/
				$(this).val($(this).attr("initValue"));
				creatableFuncReplaceInputToSpan($(this));
			}

		};

		$(tag).attr("initValue", $(this).text());
		$(tag).data("id", $(this).data("id"));
		$(tag).data("action", $(this).data("action"));
		$(tag).width($(this).width() + 30);

		$(this).replaceWith(tag);
		$(tag).on("keyup", keyupEventHandler);
		$(tag).removeClass("creatable_highlighted_class");

		if($(tag).data("action") == "AJAX_updateEventLink") 
		{
			$(tag).on("blur", creatableFuncReplaceInputToSpan);
		}
		if($(tag).data("action") == "AJAX_updateEventEmployeeNumber") 
		{
			$(tag).on("blur", creatableFuncReplaceInputToSpan);
		}
		if($(tag).data("action") == "AJAX_updateEventFoundationDate") 
		{
			var tagValue = system_calls.ConvertMonthNameToNumber($(this).text());

			$(tag).val(tagValue);
			$(tag).on("change", UpdateEventFoundationDatePickerOnChangeHandler);
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

	var	creatableFuncReplaceInputToSpan = function (param) 
	{
		var currentTag = ((typeof param.html == "function") ? param : $(this));
		var	newTag = $("<span>", {
			text: $(currentTag).val().replace(/^\s+/, "").replace(/\s+$/, ""),
			id: $(currentTag).attr("id"),
			class: $(currentTag).attr("class")
		});

		$(newTag).data("id", $(currentTag).data("id"));
		$(newTag).data("action", $(currentTag).data("action"));

		if(($(currentTag).data("action") == "AJAX_updateEventFoundationDate"))
		{
			// --- don't replace datepicker back to span
			// --- it expose bootstrap error, few ms after replacement
		}
		else
		{
			$(currentTag).replaceWith(newTag);
			$(newTag).on("click", creatableFuncReplaceSpanToInput);
			$(newTag).mouseenter(creatableFuncHighlightBgcolor);
			$(newTag).mouseleave(creatableFuncNormalizeBgcolor);
		}

		if(system_calls.ConvertTextToHTML($(currentTag).val()) == system_calls.ConvertTextToHTML($(currentTag).attr("initValue")))
		{
			// --- value hasn't been changed
			// --- no need to update server part
			console.error("creatableFuncReplaceInputToSpan: value hasn't been changed");
		}
		else
		{
			var		ajaxAction = $(newTag).data("action");
			var		ajaxActionID = $(newTag).data("id");
			var		ajaxValue = $(newTag).text();

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
							console.error("creatableFuncReplaceInputToSpan: ERROR in ajax [action = " + ajaxAction + ", id = " + eventProfile.id + ", ajaxValue = " + ajaxValue + "] " + ajaxResult.description);

							if(ajaxAction == "AJAX_updateEventLink")
							{
								system_calls.PopoverError("eventLink", ajaxResult.description);
								$("#eventLink").empty().append(ajaxResult.link);
							}
						}
					}
					catch(e)
					{
						console.error("creatableFuncReplaceInputToSpan:ERROR: can't parse JSON form server");
					}

				});
		}

		// --- Check if first/last name is empty. In that case change it to "Без хххх"
		// --- !!! Важно !!! Нельзя передвигать наверх. Иначе не произойдет обновления в БД
		if($("#firstName").text() === "") { $("#firstName").text("Без имени"); }
		if($("#lastName").text() === "") { $("#lastName").text("Без фамилии"); }
	};



	var	creatableFuncReplaceToParagraphRenderHTML = function (currentTag, content) {
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
		$(newTag).on("click", creatableFuncReplaceParagraphToTextarea);
		$(newTag).mouseenter(creatableFuncHighlightBgcolor);
		$(newTag).mouseleave(creatableFuncNormalizeBgcolor);
	};

	var	creatableFuncReplaceToParagraphAccept = function (currentTag) {
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
					console.error("creatableFuncReplaceToParagraphAccept:ERROR: description bigger than 16384 symbols");
				}

				eventProfile.description = filteredEventDescription;

				$.post("/cgi-bin/event.cgi?rand=" + Math.floor(Math.random() * 1000000000), 
					{
						description: filteredEventDescription,
						action: "AJAX_updateEventDescription",
						eventid: eventProfile.id,
						rand: Math.floor(Math.random() * 1000000000)
					}).done(function(data) {
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
							console.error("creatableFuncReplaceToParagraphAccept: ERROR: " + resultJSON.description);
						}
					});
			} // --- if action == updateEventDescription
		} // --- if textarea value changed
		else
		{
			console.error("creatableFuncReplaceToParagraphAccept: textarea value hasn't change");
		}

		creatableFuncReplaceToParagraphRenderHTML(currentTag, system_calls.ConvertTextToHTML(currentContent));

	};

	var	creatableFuncReplaceToParagraphReject = function (currentTag) {
		/*Escape pressed*/
		creatableFuncReplaceToParagraphRenderHTML(currentTag, currentTag.attr("initValue"));
	};

	var	creatableFuncReplaceParagraphToTextarea = function (e) 
	{
		var	ButtonAcceptHandler = function() {
			var		associatedTextareaID = $(this).data("associatedTagID");
			creatableFuncReplaceToParagraphAccept($("#" + associatedTextareaID));
		};

		var	ButtonRejectHandler = function(e) {
			var		associatedTextareaID = $(this).data("associatedTagID");
			creatableFuncReplaceToParagraphReject($("#" + associatedTextareaID));
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
				creatableFuncReplaceToParagraphAccept($(this));
			}
			if(keyPressed == 27) {
				/* Esc pressed */
				creatableFuncReplaceToParagraphReject($(this));
			}
		};

		$(tag).attr("initValue", initContent);
		$(tag).width(currentTag.width());
		$(tag).height((currentTag.height() + 30 < 100 ? 100 : currentTag.height() + 30));
		Object.keys(currentTag.data()).forEach(function(item) { 
			$(tag).data(item, currentTag.data(item)); 
		});

		currentTag.replaceWith(tag);
		$(tag).removeClass("creatable_highlighted_class");
		$(tag).after(tagButtonAccept);
		$(tag).after(tagButtonReject);
		$(tag).on("keyup", keyupEventHandler);
		$(tag).select();
	};


	var UpdateEventFoundationDatePickerOnChangeHandler = function(event) {
		var		ajaxAction = $(this).data("action");
		var		ajaxActionID = $(this).data("id");
		var		ajaxValue = $(this).val();

		if(ajaxValue.length)
		{
			/* Act on the event */
			$.getJSON("/cgi-bin/event.cgi",
				{action:ajaxAction, id:ajaxActionID, value:ajaxValue, eventid:eventProfile.id})
				.done(function (data) 
				{
					if(data.result == "success")
					{
						eventProfile.foundationDate = ajaxValue;
					}
					else
					{
						console.error("UpdateEventFoundationDatePickerOnChangeHandler: ERROR: " + data.description);
					}

				});
		}
		else
		{
			$("#eventFoundationDate").popover({"content": "Выберите дату основания компании"})
								.popover("show")
								.parent().removeClass("has-success")
										.addClass("has-feedback has-error");
			setTimeout(function () 
				{
					$("#eventFoundationDate").popover("destroy");
				}, 3000);
		}
	};

	var	creatableFuncReplaceSpanToSelectEventType = function () 
	{
		var	currentValue = $(this).text();
		var	tag = $("<select>", {
			id: $(this).attr("id"),
			class: $(this).attr("class")
		});

		system_calls.eventTypes.forEach(function(item, i , arr)
		{
			$(tag).append($("<option>").append(item));
		});

		$(tag).val(currentValue); 

		var	selectChangeHandler = function(event) 
		{
			creatableFuncReplaceSelectToSpan($(this), creatableFuncReplaceSpanToSelectEventType);
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
				creatableFuncReplaceSelectToSpan($(this), creatableFuncReplaceSpanToSelectEventType);
			}
		};

		$(tag).attr("initValue", $(this).text());
		$(tag).data("id", $(this).attr("id"));
		$(tag).data("action", $(this).data("action"));
		$(tag).width($(this).width()*2);

		$(this).replaceWith(tag);
		$(tag).on("keyup", keyupEventHandler);
		$(tag).on("change", selectChangeHandler);
		$(tag).on("blur", selectChangeHandler);
		$(tag).removeClass("creatable_highlighted_class");

		if($(tag).data("action") == "XXXXXXXXXX") 
		{
		}
	};

	// --- Replacement Select to Span
	// --- input: 1) tag
	// ---        2) function to call to convert Span->Select
	var	creatableFuncReplaceSelectToSpan = function (param, funcFromSelectToSpan) 
	{
		var		ajaxAction;
		var		ajaxActionID;
		var		ajaxValue;

		var 	currentTag = ((typeof param.html == "function") ? param : $(this));
		var		initValue = $(currentTag).attr("initValue").replace(/^\s+/, "").replace(/\s+$/, "");

		var	newTag = $("<span>", {
			text: $(currentTag).val().replace(/^\s+/, "").replace(/\s+$/, ""),
			id: $(currentTag).attr("id"),
			class: $(currentTag).attr("class")
		});

		$(newTag).data("id", $(currentTag).data("id"));
		$(newTag).data("action", $(currentTag).data("action"));

		$(currentTag).replaceWith(newTag);
		$(newTag).on("click", funcFromSelectToSpan);
		$(newTag).mouseenter(creatableFuncHighlightBgcolor);
		$(newTag).mouseleave(creatableFuncNormalizeBgcolor);

		ajaxAction = $(newTag).data("action");
		ajaxActionID = $(newTag).data("id");
		ajaxValue = $(newTag).text();

		if(ajaxValue == initValue)
		{
			console.error("creatableFuncReplaceSelectToSpan: value hasn't been changed");
		}
		else
		{
			$.ajax({
					url:"/cgi-bin/event.cgi",
					data: {action:ajaxAction, id:ajaxActionID, value:system_calls.ConvertTextToHTML(ajaxValue), eventid: eventProfile.id}
				}).done(function(data)
				{
					var		ajaxResult = JSON.parse(data);
					if(ajaxResult.result == "success")
					{
						if(ajaxAction == "AJAX_updateEventType")
						{
							eventProfile.type = ajaxValue;
						}
					}
					else
					{
						console.error("creatableFuncReplaceSelectToSpan: ERROR in ajax [action = " + ajaxAction + ", id = " + actionID + ", ajaxValue = " + ajaxValue + "] " + ajaxResult.description);
					}

				});
		} // --- if currValue == initValue
	}; // --- function

	var RenderEventLogo = function()
	{
		var		tagCanvas = $("#canvasForEventLogo");
		var		logoPath;

		if((typeof(eventProfile) != "undefined") && (typeof(eventProfile.logo_filename) != "undefined") && eventProfile.logo_filename.length)
			logoPath = "/images/events/" + eventProfile.logo_folder + "/" + eventProfile.logo_filename;
		else
			logoPath = "/images/pages/common/upload.png";

		system_calls.RenderCompanyLogo(tagCanvas[0].getContext("2d"), logoPath, eventProfile.title, " ");
	};

	var creatableFuncHighlightBgcolor = function () {
		$(this).addClass("creatable_highlighted_class", 400);
	};

	var creatableFuncNormalizeBgcolor = function () {
		$(this).removeClass("creatable_highlighted_class", 200, "easeInOutCirc");
	};

	return {
		Init: Init,
		eventProfile: eventProfile
	};

})();
