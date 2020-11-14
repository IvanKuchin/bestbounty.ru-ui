
var	create_group = create_group || {};

create_group = (function()
{
	"use strict";

	var		groupProfile = {};
	var		uploadImg;

	var 	JSON_groupPosition = [];
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
		$("#submitButton").on("click", CreateNewGroupClickHandler);
		$("#cancelButton").on("click", function() { window.location.href="/feed?rand=" + system_calls.GetUUID(); });
		$("#fileupload").on("change", LogoUploadChangeHandler);
		InitImgUploaderClickHandler();

		// --- Image uploader
		$(function () 
		{
		    // Change this to the location of your server-side upload handler:
		    $("#fileupload").fileupload({
		        url: "/cgi-bin/grouplogouploader.cgi?uploadType=groupLogo",
		        formData: {groupid:groupProfile.id},
		        dataType: "json",
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
			            		groupProfile.logo_folder = value.logo_folder;
			            		groupProfile.logo_filename = value.logo_filename;

			            		console.error("fileupload: done handler: uploading success original file[" + value.fileName + "], destination file[folder:" + groupProfile.logo_folder + ", filename:" + groupProfile.logo_filename + "]");

			            		RenderGroupLogo();
			            	}
		            	});

		        },
		        progressall: function (e, data) {
		            var progress = parseInt(data.loaded / data.total * 100, 10);
		            $("#progress .progress-bar").css(
		                "width",
		                progress + "%"
		            );
		        },
		        fail: function (e, data) {
		        	alert("ошибка загрузки фаила: " + data.textStatus);
		        }

		    }).prop("disabled", !$.support.fileInput)
		        .parent().addClass($.support.fileInput ? undefined : "disabled");
		});

	};

	var InitImgUploaderClickHandler = function()
	{
		$("#logo img")	.on("click", function() { $("#fileupload").click(); })
						.addClass("cursor_pointer");
	};

	var	LogoUploadChangeHandler = function(e)
	{
		var		tmpURLObj = URL.createObjectURL(e.target.files[0]);
		var		imgLogo = new Image();

		//--- save file for future upload
		uploadImg = e.target.files[0];

		imgLogo.onload = function(e)
		{
			imgLogo.classList.add("max_100percent");
			$("#logo").empty().append(imgLogo);
			InitImgUploaderClickHandler();
		};

		imgLogo.src = tmpURLObj;
	};

	var	CreateNewGroupClickHandler = function()
	{
		var		currTag = $(this);

		var		title = $("#groupTitle").val();
		var		link = $("#groupLink").val();
		var		description = $("#groupDescription").val();
		var		tmp = link.match(/[\da-zA-Z_]+/) || [""];

		if(!title.length)
		{
			system_calls.PopoverError("groupTitle", "Выберите название группы");
		}
		else if(link.length != tmp[0].length) {
			system_calls.PopoverError("groupLink", "Может содержать только латинские буквы или цифры и _");
		}
		else if(link.length && link.length < 12)
		{
			// --- if link is empty it became equal to group id
			// --- maximum length group.id is 11
			// --- to avoid overlapping between group.links, it must be longer than 11 

			system_calls.PopoverError("groupLink", "Ссылка должна быть длиннее 10 символов");
		}
		else
		{
			$("#submitButton").button("loading");

			$.getJSON("/cgi-bin/group.cgi?action=AJAX_createGroup", {title:title, link:link, description:description})
				.done(function(groupData) {
					if(groupData.result === "success")
					{
						if(groupData.groups.length)
						{
							if(groupData.groups[0].id.length)
							{
								var		formData = new FormData();

								formData.append("groupid", groupData.groups[0].id);
								formData.append("cover", uploadImg);

								$.ajax({
									url: "/cgi-bin/grouplogouploader.cgi",
									cache: false,
									contentType: false,
									processData: false,
									async: true,
									data: formData,
									type: "post",
									success: function(imageData) {
										window.location.href = "/group/" + groupData.groups[0].link + "?rand=" + system_calls.GetUUID();
									},
									error: function(imageData) {
										var		jsonObj = JSON.parse(imageData);
										console.error("AddGeneralCoverUploadChangeHandler:upload:failHandler:ERROR: " + jsonObj.textStatus);
									}
								});

							}
							else
							{
								console.error("CreateNewGroupClickHandler: ERROR: group.id is empty");
								window.location.href = "/groups_i_own_list?rand=" + system_calls.GetUUID();
							}
						}
						else
						{
							console.error("CreateNewGroupClickHandler: ERROR: groups array is empty");
							window.location.href = "/groups_i_own_list?rand=" + system_calls.GetUUID();
						}
					}
					else
					{
						console.error("CreateNewGroupClickHandler: ERROR: " + data.description);

						if(data.description == "re-login required") 
							window.location.href = data.link;
						else
						{
							system_calls.PopoverError("submitButton", data.description);
						}

					}

					window.setTimeout(function(){ $("#submitButton").button("reset"); }, 500);
				})
				.fail(function()
					{
						console.error("CreateNewGroupClickHandler:ERROR: can't parse JSON response from server");
						
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
			console.error("CreateAutocompleteWithChangeCallback:ERROR: srcData or '" + elem + "' is empty");
		}
	};

	var AddDataForProfileCollapsibleInit = function()
	{
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancyTitle", JSON_groupPosition, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancyCity", JSON_geoLocality, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancyLanguage1", JSON_language, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancyLanguage2", JSON_language, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancyLanguage3", JSON_language, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancySkill1", JSON_skill, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancySkill2", JSON_skill, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancySkill3", JSON_skill, AutocompleteCallbackChange);

		// --- Initialize autocomplete after initial loading data
		if(typeof(groupProfile.open_vacancies) != "undefined")
			groupProfile.open_vacancies.forEach(function(item, i, arr)
			{
				if($("input#OpenVacancy" + item.id + "Edit_Title").length)		CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Title", JSON_groupPosition, AutocompleteCallbackChange);
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

		if(currentTag.data("action") == "AJAX_addEditGroupAddGroupFounder")
		{
			if(keyPressed == 13) AddGroupFounder("", currentTag.val());
		}
		if(currentTag.data("action") == "AJAX_addEditGroupAddGroupOwner")
		{
			if(keyPressed == 13) AddGroupOwner("", currentTag.val());
		}
		if(currentTag.data("action") == "AJAX_addEditGroupAddGroupIndustry")
		{
			if(keyPressed == 13) AddGroupIndustry("", currentTag.val());
		}
	};

	var	RenderGroupTitle = function()
	{
		$("span#groupTitle").html(groupProfile.title);
		$("span#groupLink").html(groupProfile.link);
		$("span#groupFoundationDate").html(system_calls.GetLocalizedDateNoTimeFromSeconds(groupProfile.eventTimestampCreation));
		$("p#groupDescription").html(groupProfile.description ? groupProfile.description : "(описание отсутствует)");

		$("div#groupInfo .createableSpan").on("click", createableFuncReplaceSpanToInput);
		$("div#groupInfo .createableSpan").mouseenter(createableFuncHighlightBgcolor);
		$("div#groupInfo .createableSpan").mouseleave(createableFuncNormalizeBgcolor);

		$("div#groupInfo .createableParagraph").on("click", createableFuncReplaceParagraphToTextarea);
		$("div#groupInfo .createableParagraph").mouseenter(createableFuncHighlightBgcolor);
		$("div#groupInfo .createableParagraph").mouseleave(createableFuncNormalizeBgcolor);

		$("div#groupInfo .createableSelectGroupType").on("click", createableFuncReplaceSpanToSelectGroupType);
		$("div#groupInfo .createableSelectGroupType").mouseenter(createableFuncHighlightBgcolor);
		$("div#groupInfo .createableSelectGroupType").mouseleave(createableFuncNormalizeBgcolor);
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
			affectedScript = "group.cgi";

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
		// --- To improve User Experience (react on user actions immediately, inspite on potential server error's) 
		if(affectedAction == "AJAX_removeGroupFounder")
		{
			var		removeItemIndex = -1;

			groupProfile.founders.forEach(function(item, i, arr)
			{
				if(item.id == affectedID) removeItemIndex = i;
			});

			if(removeItemIndex >= 0) groupProfile.founders.splice(removeItemIndex, 1);
			RenderGroupFounders();
		}
		if(affectedAction == "AJAX_removeGroupOwner")
		{
			var		removeItemIndex = -1;

			groupProfile.owners.forEach(function(item, i, arr)
			{
				if(item.id == affectedID) removeItemIndex = i;
			});

			if(removeItemIndex >= 0) groupProfile.owners.splice(removeItemIndex, 1);
			RenderGroupOwners();
		}
		if(affectedAction == "AJAX_removeGroupIndustry")
		{
			var		removeItemIndex = -1;

			groupProfile.industries.forEach(function(item, i, arr)
			{
				if(item.group_industry_ref_id == affectedID) removeItemIndex = i;
			});

			if(removeItemIndex >= 0) groupProfile.industries.splice(removeItemIndex, 1);
			RenderGroupIndustries();
		}
		if(affectedAction == "AJAX_removeOpenVacancy")
		{
			var		removeItemIndex = -1;

			groupProfile.open_vacancies.forEach(function(item, i, arr)
			{
				if(item.id == affectedID) removeItemIndex = i;
			});

			if(removeItemIndex >= 0) groupProfile.open_vacancies.splice(removeItemIndex, 1);
			RenderGroupOpenVacancies();
		}
		if(affectedAction == "AJAX_rejectCandidate")
		{
			var		removeItemIndex = -1;

			$("#rowAppliedCandidate" + affectedID).remove();
		}
	};

	var	createableFuncReplaceSpanToInput = function () 
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
				createableFuncReplaceInputToSpan($(this));
			}
			if(keyPressed == 27) 
			{
				/*Escape pressed*/
				$(this).val($(this).attr("initValue"));
				createableFuncReplaceInputToSpan($(this));
			}

		};

		$(tag).attr("initValue", $(this).text());
		$(tag).data("id", $(this).data("id"));
		$(tag).data("action", $(this).data("action"));
		$(tag).width($(this).width() + 30);

		$(this).replaceWith(tag);
		$(tag).on("keyup", keyupEventHandler);
		$(tag).removeClass("createable_highlighted_class");

		if($(tag).data("action") == "AJAX_updateGroupLink") 
		{
			$(tag).on("blur", createableFuncReplaceInputToSpan);
		}
		if($(tag).data("action") == "AJAX_updateGroupEmployeeNumber") 
		{
			$(tag).on("blur", createableFuncReplaceInputToSpan);
		}
		if($(tag).data("action") == "AJAX_updateGroupFoundationDate") 
		{
			var tagValue = system_calls.ConvertMonthNameToNumber($(this).text());

			$(tag).val(tagValue);
			$(tag).on("change", UpdateGroupFoundationDatePickerOnChangeHandler);
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

	var	createableFuncReplaceInputToSpan = function (param) 
	{
		var currentTag = ((typeof param.html == "function") ? param : $(this));
		var	newTag = $("<span>", {
			text: $(currentTag).val().replace(/^\s+/, "").replace(/\s+$/, ""),
			id: $(currentTag).attr("id"),
			class: $(currentTag).attr("class")
		});

		$(newTag).data("id", $(currentTag).data("id"));
		$(newTag).data("action", $(currentTag).data("action"));

		if(($(currentTag).data("action") == "AJAX_updateGroupFoundationDate"))
		{
			// --- don't replace datepicker back to span
			// --- it expose bootstrap error, few ms after replacement
		}
		else
		{
			$(currentTag).replaceWith(newTag);
			$(newTag).on("click", createableFuncReplaceSpanToInput);
			$(newTag).mouseenter(createableFuncHighlightBgcolor);
			$(newTag).mouseleave(createableFuncNormalizeBgcolor);
		}

		if(system_calls.ConvertTextToHTML($(currentTag).val()) == system_calls.ConvertTextToHTML($(currentTag).attr("initValue")))
		{
			// --- value hasn't been changed
			// --- no need to update server part
			console.error("createableFuncReplaceInputToSpan: value hasn't been changed");
		}
		else
		{
			var		ajaxAction = $(newTag).data("action");
			var		ajaxActionID = $(newTag).data("id");
			var		ajaxValue = $(newTag).text();

			$.ajax({
				url:"/cgi-bin/group.cgi",
				data: {action:ajaxAction, id:ajaxActionID, value:system_calls.ConvertTextToHTML(ajaxValue), groupid: groupProfile.id}
			}).done(function(data)
				{
					try // --- catch JSON.parse
					{
						var ajaxResult = JSON.parse(data);

						if(ajaxResult.result == "success")
						{

							if(ajaxAction == "AJAX_updateGroupLink")
							{
								groupProfile.link = (ajaxValue.length ? ajaxValue : "(отсутствует)");
								$("#groupLink").empty().append(groupProfile.link);
							}
							else if(ajaxAction == "AJAX_updateGroupEmployeeNumber")
							{
								groupProfile.numberOfEmployee = (ajaxValue.length ? ajaxValue : "0");
								$("#groupNumberOfEmployee").empty().append(groupProfile.numberOfEmployee);
							}
						}
						else
						{
							console.error("createableFuncReplaceInputToSpan: ERROR in ajax [action = " + ajaxAction + ", id = " + groupProfile.id + ", ajaxValue = " + ajaxValue + "] " + ajaxResult.description);

							if(ajaxAction == "AJAX_updateGroupLink")
							{
								system_calls.PopoverError("groupLink", ajaxResult.description);
								$("#groupLink").empty().append(ajaxResult.link);
							}
						}
					}
					catch(e)
					{
						console.error("createableFuncReplaceInputToSpan:ERROR: can't parse JSON form server");
					}

				});
		}

		// --- Check if first/last name is empty. In that case change it to "Без хххх"
		// --- !!! Важно !!! Нельзя передвигать наверх. Иначе не произойдет обновления в БД
		if($("#firstName").text() === "") { $("#firstName").text("Без имени"); }
		if($("#lastName").text() === "") { $("#lastName").text("Без фамилии"); }
	};



	var	createableFuncReplaceToParagraphRenderHTML = function (currentTag, content) {
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
		$(newTag).on("click", createableFuncReplaceParagraphToTextarea);
		$(newTag).mouseenter(createableFuncHighlightBgcolor);
		$(newTag).mouseleave(createableFuncNormalizeBgcolor);
	};

	var	createableFuncReplaceToParagraphAccept = function (currentTag) {
		var currentContent = $(currentTag).val();

		if(system_calls.ConvertTextToHTML($(currentTag).val()) != system_calls.FilterUnsupportedUTF8Symbols($(currentTag).attr("initValue")))
		{
			// --- text has been changed

			if(currentTag.data("action") === "updateGroupDescription") 
			{
				var		filteredGroupDescription = system_calls.FilterUnsupportedUTF8Symbols(currentContent);

				if((filteredGroupDescription === "") || (filteredGroupDescription === "(описание отсутствует)")) 
				{
					filteredGroupDescription = "";	
				}

				if(filteredGroupDescription.length > 16384)
				{
					filteredGroupDescription = filteredGroupDescription.substr(0, 16384);
					console.error("createableFuncReplaceToParagraphAccept:ERROR: description bigger than 16384 symbols");
				}

				groupProfile.description = filteredGroupDescription;

				$.post("/cgi-bin/group.cgi?rand=" + Math.floor(Math.random() * 1000000000), 
					{
						description: filteredGroupDescription,
						action: "AJAX_updateGroupDescription",
						groupid: groupProfile.id,
						rand: Math.floor(Math.random() * 1000000000)
					}).done(function(data) {
						var		resultJSON = JSON.parse(data);

						if(resultJSON.result === "success")
						{
							if(filteredGroupDescription == "")
							{
								$("#groupDescription").empty().append("(описание отсутствует)");
							}
						}
						else
						{
							console.error("createableFuncReplaceToParagraphAccept: ERROR: " + resultJSON.description);
						}
					});
			} // --- if action == updateGroupDescription
		} // --- if textarea value changed
		else
		{
			console.error("createableFuncReplaceToParagraphAccept: textarea value hasn't change");
		}

		createableFuncReplaceToParagraphRenderHTML(currentTag, system_calls.ConvertTextToHTML(currentContent));

	};

	var	createableFuncReplaceToParagraphReject = function (currentTag) {
		/*Escape pressed*/
		createableFuncReplaceToParagraphRenderHTML(currentTag, currentTag.attr("initValue"));
	};

	var	createableFuncReplaceParagraphToTextarea = function (e) 
	{
		var	ButtonAcceptHandler = function() {
			var		associatedTextareaID = $(this).data("associatedTagID");
			createableFuncReplaceToParagraphAccept($("#" + associatedTextareaID));
		};

		var	ButtonRejectHandler = function(e) {
			var		associatedTextareaID = $(this).data("associatedTagID");
			createableFuncReplaceToParagraphReject($("#" + associatedTextareaID));
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
				createableFuncReplaceToParagraphAccept($(this));
			}
			if(keyPressed == 27) {
				/* Esc pressed */
				createableFuncReplaceToParagraphReject($(this));
			}
		};

		$(tag).attr("initValue", initContent);
		$(tag).width(currentTag.width());
		$(tag).height((currentTag.height() + 30 < 100 ? 100 : currentTag.height() + 30));
		Object.keys(currentTag.data()).forEach(function(item) { 
			$(tag).data(item, currentTag.data(item)); 
		});

		currentTag.replaceWith(tag);
		$(tag).removeClass("createable_highlighted_class");
		$(tag).after(tagButtonAccept);
		$(tag).after(tagButtonReject);
		$(tag).on("keyup", keyupEventHandler);
		$(tag).select();
	};


	var UpdateGroupFoundationDatePickerOnChangeHandler = function(event) {
		var		ajaxAction = $(this).data("action");
		var		ajaxActionID = $(this).data("id");
		var		ajaxValue = $(this).val();

		if(ajaxValue.length)
		{
			/* Act on the event */
			$.getJSON("/cgi-bin/group.cgi",
				{action:ajaxAction, id:ajaxActionID, value:ajaxValue, groupid:groupProfile.id})
				.done(function (data) 
				{
					if(data.result == "success")
					{
						groupProfile.foundationDate = ajaxValue;
					}
					else
					{
						console.error("UpdateGroupFoundationDatePickerOnChangeHandler: ERROR: " + data.description);
					}

				});
		}
		else
		{
			$("#groupFoundationDate").popover({"content": "Выберите дату основания компании"})
								.popover("show")
								.parent().removeClass("has-success")
										.addClass("has-feedback has-error");
			setTimeout(function () 
				{
					$("#groupFoundationDate").popover("destroy");
				}, 3000);
		}
	};

	var	createableFuncReplaceSpanToSelectGroupType = function () 
	{
		var	currentValue = $(this).text();
		var	tag = $("<select>", {
			id: $(this).attr("id"),
			class: $(this).attr("class")
		});

		system_calls.groupTypes.forEach(function(item, i , arr)
		{
			$(tag).append($("<option>").append(item));
		});

		$(tag).val(currentValue); 

		var	selectChangeHandler = function(event) 
		{
			createableFuncReplaceSelectToSpan($(this), createableFuncReplaceSpanToSelectGroupType);
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
				createableFuncReplaceSelectToSpan($(this), createableFuncReplaceSpanToSelectGroupType);
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
		$(tag).removeClass("createable_highlighted_class");

		if($(tag).data("action") == "XXXXXXXXXX") 
		{
		}
	};

	// --- Replacement Select to Span
	// --- input: 1) tag
	// ---        2) function to call to convert Span->Select
	var	createableFuncReplaceSelectToSpan = function (param, funcFromSelectToSpan) 
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
		$(newTag).mouseenter(createableFuncHighlightBgcolor);
		$(newTag).mouseleave(createableFuncNormalizeBgcolor);

		ajaxAction = $(newTag).data("action");
		ajaxActionID = $(newTag).data("id");
		ajaxValue = $(newTag).text();

		if(ajaxValue == initValue)
		{
			console.error("createableFuncReplaceSelectToSpan: value hasn't been changed");
		}
		else
		{
			$.ajax({
					url:"/cgi-bin/group.cgi",
					data: {action:ajaxAction, id:ajaxActionID, value:system_calls.ConvertTextToHTML(ajaxValue), groupid: groupProfile.id}
				}).done(function(data)
				{
					var		ajaxResult = JSON.parse(data);
					if(ajaxResult.result == "success")
					{
						if(ajaxAction == "AJAX_updateGroupType")
						{
							groupProfile.type = ajaxValue;
						}
					}
					else
					{
						console.error("createableFuncReplaceSelectToSpan: ERROR in ajax [action = " + ajaxAction + ", id = " + actionID + ", ajaxValue = " + ajaxValue + "] " + ajaxResult.description);
					}

				});
		} // --- if currValue == initValue
	}; // --- function

	var RenderGroupLogo = function()
	{
		var		tagCanvas = $("#canvasForGroupLogo");
		var		logoPath;

		if(groupProfile.logo_filename.length) logoPath = "/images/groups/" + groupProfile.logo_folder + "/" + groupProfile.logo_filename;
		else logoPath = "/images/pages/create_group/nologo" + (Math.floor(Math.random()*8) + 1) + ".png";


		system_calls.RenderCompanyLogo(tagCanvas[0].getContext("2d"), logoPath, groupProfile.title, " ");
	};

	var createableFuncHighlightBgcolor = function () {
		$(this).addClass("createable_highlighted_class", 400);
	};

	var createableFuncNormalizeBgcolor = function () {
		$(this).removeClass("createable_highlighted_class", 200, "easeInOutCirc");
	};

	return {
		Init: Init,
		groupProfile: groupProfile
	};

})();
