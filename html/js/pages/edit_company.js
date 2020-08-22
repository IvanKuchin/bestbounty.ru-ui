
var	edit_company = edit_company || {};

edit_company = (function()
{
	'use strict';

	var		companyProfile = {};
	var		AutocompleteList = [];
	var		datepickerDateFormat;

	var 	JSON_companyPosition = [];
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
		companyProfile.id = $("#companyInfo").data("id");


		$("#AreYouSure #Remove").on("click", AreYouSureRemoveHandler);

		$.getJSON('/cgi-bin/company.cgi?action=JSON_getCompanyProfile', {id: companyProfile.id})
			.done(function(data) {
				if((data.result === "success") && (data.companies.length))
				{
					if((data.companies[0].isMine == "1"))
					{
						companyProfile = data.companies[0];
						RenderCompanyLogo();
						RenderCompanyTitle();
						RenderCompanyFounders();
						RenderCompanyOwners();
						RenderCompanyIndustries();
						RenderCompanyOpenVacancies();
					}
					else
					{
						$("#NotMyCompany .mailme").on("click", function(){ return CraftCompanyChangeMail(data.companies[0]); });
						$("#NotMyCompany").modal("show");
					}
				}
				else
				{
					console.debug("Init: ERROR: " + data.description + " or companies length = 0");
				}
			});

		PrefillInternalStructures();

		// --- Drop company posession
		$("button#companyDropPosession").on("click", AreYouSureClickHandler);

		// --- Founder add
		$("input#companyFounderItem").on("keyup", InputKeyupHandler);
		$("input#companyFounderItem").on("input", AutocompleteWithUsers);
		$("button#ButtonAddFounderToCompany").on("click", function() {
			AddCompanyFounder("", $("#companyFounderItem").val());
		});

		// --- Owner add
		$("input#companyOwnerItem").on("keyup", InputKeyupHandler);
		$("input#companyOwnerItem").on("input", AutocompleteWithUsers);
		$("button#ButtonAddOwnerToCompany").on("click", function() {
			AddCompanyOwner("", $("#companyOwnerItem").val());
		});

		// --- Owner add
		$("input#companyIndustryItem").on("keyup", InputKeyupHandler);
		$("input#companyIndustryItem").on("input", AutocompleteWithIndustries);
		$("button#ButtonAddIndustryToCompany").on("click", function() {
			AddCompanyIndustry("", $("#companyIndustryItem").val());
		});

		// --- Add new open vacancy
		$("button#ButtonAddOpenVacancyToCompany").on("click", AddNewOpenVacancyToggleCollapsible);
		$("#AddNewOpenVacancyCancelButton").on("click", AddNewOpenVacancyToggleCollapsible);
		$("#AddNewOpenVacancySubmitButton").on("click", AddNewOpenVacancyClickHandler);
		AddNewOpenVacancyReset();

		// --- Image uploader
		$(function () {
		    // Change this to the location of your server-side upload handler:
		    $('#fileupload').fileupload({
		        url: '/cgi-bin/companylogouploader.cgi?uploadType=companyLogo',
		        formData: {companyid:companyProfile.id},
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
			            		companyProfile.logo_folder = value.logo_folder;
			            		companyProfile.logo_filename = value.logo_filename;

			            		console.debug("fileupload: done handler: uploading success original file[" + value.fileName + "], destination file[folder:" + companyProfile.logo_folder + ", filename:" + companyProfile.logo_filename + "]");

			            		RenderCompanyLogo();
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

	var CraftCompanyChangeMail = function(company)
	{
		var		currTag = $(this);
		var		mailDomain;
		var		link;

		{
			var		tempArr = document.location.host.split('.');

			mailDomain = tempArr.slice(tempArr.length - 2).join('.');
		}

		link	= 'mailto:admin@' + mailDomain + '?subject=Ошибка в данных компании ' + company.name + ' (id: ' + company.id + ')'
				+ '&body=Добрый день ! ' + encodeURIComponent("\n\n")
				+ 'Найдена ошибка в данных компании ' + company.name + ' (id: ' + company.id + ')' + encodeURIComponent("\n")
				+ 'Прошу рассмотреть исправление некорректного значения ________ на ___________ ' + encodeURIComponent("\n\n")
				+ 'С уважением ' + $("#myFirstName").text() + " " + $("#myLastName").text() + ' (userid:' + $("#myUserID").data("myuserid") + ').';


	    window.location.href = link;
	}

	var	PrefillInternalStructures = function() 
	{
		if(window.Worker)
		{
			var		helperWorker = new Worker("/js/pages/edit_profile_worker.js");

			helperWorker.onmessage = function(e)
			{
				JSON_dataForProfile = e.data.JSON_dataForProfile;
				JSON_companyPosition = e.data.JSONarrWithID_companyPosition;
				JSON_geoCountry = e.data.JSONarrWithID_geoCountry;
				JSON_geoRegion = e.data.JSONarrWithID_geoRegion;
				JSON_geoLocality = e.data.JSONarrWithID_geoLocality;
				JSON_university = e.data.JSONarrWithID_university;
				JSON_language = e.data.JSONarrWithID_language;
				JSON_skill = e.data.JSONarrWithID_skill;

				AddDataForProfileCollapsibleInit();
			}

			setTimeout(function () 
				{
					helperWorker.postMessage("start");
				}, 3000);
		}
		else
		{
			setTimeout(function () 
				{
					// --- AJAX jobTitle download 
					$.getJSON('/cgi-bin/index.cgi?action=AJAX_getDataForProfile', {param1: ''})
							.done(function(data) {
								JSON_dataForProfile = data;

								data.geo_country.forEach(function(item, i, arr)
								{
									JSON_geoCountry.push(system_calls.ConvertHTMLToText(item.title));
								})

								data.geo_region.forEach(function(item, i, arr)
								{
									JSON_geoRegion.push(system_calls.ConvertHTMLToText(item.title));
								})

								data.geo_locality.forEach(function(item, i, arr)
								{
									JSON_geoLocality.push(system_calls.ConvertHTMLToText(item.title));
								})

								data.university.forEach(function(item, i, arr)
								{
									JSON_university.push(system_calls.ConvertHTMLToText(item.title));
								})
								jQuery.unique(JSON_university);

								data.school.forEach(function(item, i, arr)
								{
									JSON_school.push(system_calls.ConvertHTMLToText(item.title));
								})
								jQuery.unique(JSON_school);

								data.language.forEach(function(item, i, arr)
								{
									JSON_language.push(system_calls.ConvertHTMLToText(item.title));
								})

								data.skill.forEach(function(item, i, arr)
								{
									JSON_skill.push(system_calls.ConvertHTMLToText(item.title));
								})
								jQuery.unique(JSON_skill);

								AddDataForProfileCollapsibleInit();
							});
				}, 3000);
		} // --- End Worker
	};

	var	AutocompleteCallbackChange = function (event, ui) 
	{
		var		currTag = $(this);

		console.debug ("AutocompleteCallbackChange: change event handler"); 

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
					// console.debug ("CreateAutocompleteWithChangeCallback: close event handler"); 
				},
				create: function () {
					// console.debug ("CreateAutocompleteWithChangeCallback: _create event handler"); 
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
			console.debug("CreateAutocompleteWithChangeCallback:ERROR: srcData or '" + elem + "' is empty");
		}
	};

	var AddDataForProfileCollapsibleInit = function()
	{
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancyTitle", JSON_companyPosition, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancyCity", JSON_geoLocality, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancyLanguage1", JSON_language, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancyLanguage2", JSON_language, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancyLanguage3", JSON_language, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancySkill1", JSON_skill, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancySkill2", JSON_skill, AutocompleteCallbackChange);
		CreateAutocompleteWithChangeCallback("input#CreateOpenVacancySkill3", JSON_skill, AutocompleteCallbackChange);

		// --- Initialize autocomplete after initial loading data
		if(typeof(companyProfile.open_vacancies) != "undefined")
			companyProfile.open_vacancies.forEach(function(item, i, arr)
			{
				if($("input#OpenVacancy" + item.id + "Edit_Title").length)		CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Title", JSON_companyPosition, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_City").length) 		CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_City", JSON_geoLocality, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Language1").length) 	CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Language1", JSON_language, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Language2").length) 	CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Language2", JSON_language, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Language3").length) 	CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Language3", JSON_language, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Skill1").length) 	CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Skill1", JSON_skill, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Skill2").length) 	CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Skill2", JSON_skill, AutocompleteCallbackChange);
				if($("input#OpenVacancy" + item.id + "Edit_Skill3").length) 	CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Skill3", JSON_skill, AutocompleteCallbackChange);
			});

	};

	var	getDate = function ( elem ) 
	{
		var date;
		try {
			date = $.datepicker.parseDate( datepickerDateFormat, elem.value );
		} catch( error ) {
		date = null;
		}

		return date;
	};


	var	AddCompanyFounder = function(userID, userName)
	{
		var		isDuplicate = false;

		if(!system_calls.RemoveSpaces(userName))
		{
			$("#companyFounderItem").popover({"content": "напишите имя и фамилию основателя", "placement":"top"})
									.popover("show")
									.parent()
									.removeClass("has-success")
									.addClass("has-feedback has-error");
			setTimeout(function () 
				{
					$("#companyFounderItem").popover("destroy");
					$("#companyFounderItem").parent().removeClass("has-feedback has-error has-success");

				}, 3000);
		}
		else
		{

			// --- check duplicates
			companyProfile.founders.forEach(function(item, i, arr)
				{
					if( system_calls.RemoveSpaces(item.name).toLowerCase().search(system_calls.RemoveSpaces(userName).toLowerCase()) >= 0) isDuplicate = true;
				});

			if(isDuplicate) {
				$("#companyFounderItem").popover({"content": "уже в списке", "placement":"top"})
										.popover("show")
										.parent()
										.removeClass("has-success")
										.addClass("has-feedback has-error");
				setTimeout(function () 
					{
						$("#companyFounderItem").popover("destroy");
						$("#companyFounderItem").parent().removeClass("has-feedback has-error has-success");

					}, 3000);
			}
			else
			{
				// --- check founders count
				if(companyProfile.founders.length >20)
				{
					$("#companyFounderItem").popover({"content": "слишком много основателей", "placement":"top"})
											.popover("show")
											.parent()
											.removeClass("has-success")
											.addClass("has-feedback has-error");
					setTimeout(function () 
						{
							$("#companyFounderItem").popover("destroy");
							$("#companyFounderItem").parent().removeClass("has-feedback has-error has-success");

						}, 3000);
				}
				else
				{
					$("button#ButtonAddFounderToCompany").attr("disabled", "")
														.text("Добавление");
					$("input#companyFounderItem").attr("disabled", "");

					$.getJSON('/cgi-bin/index.cgi?action=AJAX_addEditCompanyAddCompanyFounder', {userid: userID, username: system_calls.FilterUnsupportedUTF8Symbols(userName), companyid: companyProfile.id})
						.done(function(data) {
							if(data.result === "success")
							{
								var		newObj = {};

								newObj.id = data.id;
								newObj.name = userName;
								newObj.userid = (userID == "" ? "0" : userID);

								companyProfile.founders.push(newObj);

								companyFounderItemZeroize();
								RenderCompanyFounders();
							}
							else
							{
								console.debug("AJAX_addEditCompanyAddCompanyFounder: ERROR: " + data.description);
							}

							$("button#ButtonAddFounderToCompany").removeAttr("disabled")
																.text("Добавить");
							$("input#companyFounderItem").removeAttr("disabled");
						});
				}
			}
		}
	};

	var	AddCompanyOwner = function(userID, userName)
	{
		var		isDuplicate = false;

		if(!system_calls.RemoveSpaces(userName))
		{
			$("#companyOwnerItem").popover({"content": "напишите имя и фамилию владельца", "placement":"top"})
									.popover("show")
									.parent()
									.removeClass("has-success")
									.addClass("has-feedback has-error");
			setTimeout(function () 
				{
					$("#companyOwnerItem").popover("destroy");
					$("#companyOwnerItem").parent().removeClass("has-feedback has-error has-success");

				}, 3000);
		}
		else
		{

			// --- check duplicates
			companyProfile.owners.forEach(function(item, i, arr)
				{
					if( system_calls.RemoveSpaces(item.name).toLowerCase().search(system_calls.RemoveSpaces(userName).toLowerCase()) >= 0) isDuplicate = true;
				});

			if(isDuplicate) {
				$("#companyOwnerItem").popover({"content": "уже в списке", "placement":"top"})
										.popover("show")
										.parent()
										.removeClass("has-success")
										.addClass("has-feedback has-error");
				setTimeout(function () 
					{
						$("#companyOwnerItem").popover("destroy");
						$("#companyOwnerItem").parent().removeClass("has-feedback has-error has-success");

					}, 3000);
			}
			else
			{
				// --- check Owners count
				if(companyProfile.owners.length >20)
				{
					$("#companyOwnerItem").popover({"content": "слишком много владельцев", "placement":"top"})
											.popover("show")
											.parent()
											.removeClass("has-success")
											.addClass("has-feedback has-error");
					setTimeout(function () 
						{
							$("#companyOwnerItem").popover("destroy");
							$("#companyOwnerItem").parent().removeClass("has-feedback has-error has-success");

						}, 3000);
				}
				else
				{
					$("button#ButtonAddOwnerToCompany").attr("disabled", "")
														.text("Добавление");
					$("input#companyOwnerItem").attr("disabled", "");

					$.getJSON('/cgi-bin/index.cgi?action=AJAX_addEditCompanyAddCompanyOwner', {userid: userID, username: system_calls.FilterUnsupportedUTF8Symbols(userName), companyid: companyProfile.id})
						.done(function(data) {
							if(data.result === "success")
							{
								var		newObj = {};

								newObj.id = data.id;
								newObj.name = userName;
								newObj.userid = (userID == "" ? "0" : userID);

								companyProfile.owners.push(newObj);

								companyOwnerItemZeroize();
								RenderCompanyOwners();
							}
							else
							{
								console.debug("AJAX_addEditCompanyAddCompanyOwner: ERROR: " + data.description);
							}

							$("button#ButtonAddOwnerToCompany").removeAttr("disabled")
																.text("Добавить");
							$("input#companyOwnerItem").removeAttr("disabled");
						});
				}
			}
		}
	};

	var	AddCompanyIndustry = function(industryID_notUsed, industryTitle)
	{
		var		isDuplicate = false;

		if(!system_calls.RemoveSpaces(industryTitle))
		{
			$("#companyIndustryItem").popover({"content": "напишите отрасль компании", "placement":"top"})
									.popover("show")
									.parent()
									.removeClass("has-success")
									.addClass("has-feedback has-error");
			setTimeout(function () 
				{
					$("#companyIndustryItem").popover("destroy");
					$("#companyIndustryItem").parent().removeClass("has-feedback has-error has-success");

				}, 3000);
		}
		else
		{

			// --- check duplicates
			companyProfile.industries.forEach(function(item, i, arr)
				{
					if( system_calls.RemoveSpaces(item.name).toLowerCase().search(system_calls.RemoveSpaces(industryTitle).toLowerCase()) >= 0) isDuplicate = true;
				});

			if(isDuplicate) {
				$("#companyIndustryItem").popover({"content": "уже в списке", "placement":"top"})
										.popover("show")
										.parent()
										.removeClass("has-success")
										.addClass("has-feedback has-error");
				setTimeout(function () 
					{
						$("#companyIndustryItem").popover("destroy");
						$("#companyIndustryItem").parent().removeClass("has-feedback has-error has-success");

					}, 3000);
			}
			else
			{
				// --- check industries count
				if(companyProfile.industries.length > 20)
				{
					$("#companyIndustryItem").popover({"content": "слишком много отраслей", "placement":"top"})
											.popover("show")
											.parent()
											.removeClass("has-success")
											.addClass("has-feedback has-error");
					setTimeout(function () 
						{
							$("#companyIndustryItem").popover("destroy");
							$("#companyIndustryItem").parent().removeClass("has-feedback has-error has-success");

						}, 3000);
				}
				else
				{
					$("button#ButtonAddIndustryToCompany").attr("disabled", "")
														.text("Добавление");
					$("input#companyIndustryItem").attr("disabled", "");

					$.getJSON('/cgi-bin/index.cgi?action=AJAX_addEditCompanyAddCompanyIndustry', {industrytitle: system_calls.FilterUnsupportedUTF8Symbols(industryTitle), companyid: companyProfile.id})
						.done(function(data) {
							if(data.result === "success")
							{
								var		newObj = {};

								newObj.company_industry_ref_id = data.company_industry_ref_id;
								newObj.name = industryTitle;

								companyProfile.industries.push(newObj);

								companyIndustryItemZeroize();
								RenderCompanyIndustries();
							}
							else
							{
								console.debug("AJAX_addEditCompanyAddCompanyIndustry: ERROR: " + data.description);
							}

							$("button#ButtonAddIndustryToCompany").removeAttr("disabled")
																.text("Добавить");
							$("input#companyIndustryItem").removeAttr("disabled");
						});
				}
			}
		}
	};


	var	InputKeyupHandler = function(e)
	{
		var		keyPressed = e.keyCode;
		var		currentTag = $(this);

		if(currentTag.data("action") == "AJAX_addEditCompanyAddCompanyFounder")
		{
			if(keyPressed == 13) AddCompanyFounder("", currentTag.val());
		}
		if(currentTag.data("action") == "AJAX_addEditCompanyAddCompanyOwner")
		{
			if(keyPressed == 13) AddCompanyOwner("", currentTag.val());
		}
		if(currentTag.data("action") == "AJAX_addEditCompanyAddCompanyIndustry")
		{
			if(keyPressed == 13) AddCompanyIndustry("", currentTag.val());
		}
	}

	var AutocompleteWithUsers = function() 
	{
		var	AutocompleteSelectHandler = function(event, ui)
		{
			var	selectedID = ui.item.id;
			var selectedLabel = ui.item.label;

			if(currentAction == "AJAX_addEditCompanyAddCompanyFounder")
			{
				AddCompanyFounder(selectedID, selectedLabel);
			}
			if(currentAction == "AJAX_addEditCompanyAddCompanyOwner")
			{
				AddCompanyOwner(selectedID, selectedLabel);
			}

		};

		var		currentTag = $(this);
		var		currentAction = currentTag.data("action");
		var		inputValue = $(this).val();

		if(inputValue.length == 3)
		{
			$.getJSON(
				'/cgi-bin/index.cgi',
				{action:"JSON_getFindFriendsListAutocompleteIncludingMyself", lookForKey:inputValue})
				.done(function(data) {
						AutocompleteList = [];
						data.forEach(function(item, i, arr)
							{
								var	autocompleteLabel;
								var	obj;

								autocompleteLabel = "";

								if((item.name.length > 0))
								{
									if(autocompleteLabel.length > 0) { autocompleteLabel += " "; }
									autocompleteLabel += item.name;
								}
								if(item.nameLast.length > 0)
								{
									if(autocompleteLabel.length > 0) { autocompleteLabel += " "; }
									autocompleteLabel += item.nameLast;
								}
								if(autocompleteLabel.length > 0)
								{
									if(item.currentEmployment.length > 0)
									{
										autocompleteLabel += " ";
										item.currentEmployment.forEach(
											function(item, i, arr)
											{
												autocompleteLabel += item.company;
												if(i+1 < arr.length) { autocompleteLabel += ", "; }
											}
										);
									}
								}

								AutocompleteList.push({id:item.id , label:autocompleteLabel});
							});

						currentTag.autocomplete({
							delay : 300,
							source: AutocompleteList,
							select: AutocompleteSelectHandler,
							change: function (event, ui) { 
								console.debug ("edit_company.OnInputHandler autocomplete.change: change event handler"); 
							},
							close: function (event, ui) 
							{ 
								console.debug ("edit_company.OnInputHandler autocomplete.close: close event handler"); 
							},
							create: function () {
								console.debug ("edit_company.OnInputHandler autocomplete.create: _create event handler"); 
							},
							_renderMenu: function (ul, items)  // --- requres plugin only
							{
								var	that = this;
								var currentCategory = "";
								$.each( items, function( index, item ) {
									var li;
								    if ( item.category != currentCategory ) {
								    	ul.append( "<li class='ui-autocomplete-category'>" + item.category + "</li>" );
								        currentCategory = item.category;
								    }
									li = that._renderItemData( ul, item );
									if ( item.category ) {
									    li.attr( "aria-label", item.category + " : " + item.label + item.login );
									} // --- getJSON.done() autocomplete.renderMenu foreach() if(item.category)
								}); // --- getJSON.done() autocomplete.renderMenu foreach()
							} // --- getJSON.done() autocomplete.renderMenu
						}); // --- getJSON.done() autocomplete
					}); // --- getJSON.done()

		}
		else if(inputValue.length < 3)
		{
			AutocompleteList = [];
			currentTag.autocomplete({
							delay : 300,
							source: AutocompleteList
						});
		} // --- if(inputValue.length >= 2)

		if(inputValue.length) currentTag.parent().next().children("button").removeAttr("disabled");
		else currentTag.parent().next().children("button").attr("disabled", "");
	};

	var AutocompleteWithIndustries = function() 
	{
		var	AutocompleteSelectHandler = function(event, ui)
		{
			var	selectedID = ui.item.id;
			var selectedLabel = ui.item.label;

			if(currentAction == "AJAX_addEditCompanyAddCompanyIndustry")
			{
				AddCompanyIndustry(selectedID, selectedLabel);
			}
		};

		var		currentTag = $(this);
		var		currentAction = currentTag.data("action");
		var		inputValue = $(this).val();

		if(inputValue.length == 2)
		{
			$.getJSON(
				'/cgi-bin/index.cgi',
				{action:"JSON_getIndustryListAutocomplete", lookForKey:inputValue})
				.done(function(data) {
						AutocompleteList = [];
						if(data.status == "success")
						{

							data.industries.forEach(function(item, i, arr)
								{
									var	autocompleteLabel;
									var	obj;

									autocompleteLabel = "";

									if((item.name.length > 0))
									{
										if(autocompleteLabel.length > 0) { autocompleteLabel += " "; }
										autocompleteLabel += item.name;
									}

									AutocompleteList.push({id:item.id , label:autocompleteLabel});
								});

							currentTag.autocomplete({
								delay : 300,
								source: AutocompleteList,
								select: AutocompleteSelectHandler,
								change: function (event, ui) { 
									console.debug ("edit_company.OnInputHandler autocomplete.change: change event handler"); 
								},
								close: function (event, ui) 
								{ 
									console.debug ("edit_company.OnInputHandler autocomplete.close: close event handler"); 
								},
								create: function () {
									console.debug ("edit_company.OnInputHandler autocomplete.create: _create event handler"); 
								},
								_renderMenu: function (ul, items)  // --- requres plugin only
								{
									var	that = this;
									var currentCategory = "";
									$.each( items, function( index, item ) {
										var li;
									    if ( item.category != currentCategory ) {
									    	ul.append( "<li class='ui-autocomplete-category'>" + item.category + "</li>" );
									        currentCategory = item.category;
									    }
										li = that._renderItemData( ul, item );
										if ( item.category ) {
										    li.attr( "aria-label", item.category + " : " + item.label + item.login );
										} // --- getJSON.done() autocomplete.renderMenu foreach() if(item.category)
									}); // --- getJSON.done() autocomplete.renderMenu foreach()
								} // --- getJSON.done() autocomplete.renderMenu
							}); // --- getJSON.done() autocomplete
						} // --- if status == "success"
						else
						{
							console.debug("AutocompleteWithIndustries")
						} // --- if status == "success"
					}); // --- getJSON.done()

		}
		else if(inputValue.length < 2)
		{
			AutocompleteList = [];
			currentTag.autocomplete({
							delay : 300,
							source: AutocompleteList
						});
		} // --- if(inputValue.length >= 2)

		if(inputValue.length) currentTag.parent().next().children("button").removeAttr("disabled");
		else currentTag.parent().next().children("button").attr("disabled", "");
	};

	var	companyFounderItemZeroize = function()
	{
		$("#companyFounderItem").val("");
		$("#companyFounderItem").removeAttr("disabled");
		$("#ButtonAddFounderToCompany").attr("disabled", "");
	}

	var	RenderCompanyFounders = function()
	{
		$("#companyFounderList").empty();
		companyProfile.founders.forEach(function(item, i, arr)
			{
				var		removeSign = $("<span>").addClass("glyphicon glyphicon-remove cursor_pointer")
												.attr("data-action", "AJAX_removeCompanyFounder")
												.attr("data-id", item.id)
												.on("click", AreYouSureClickHandler);
				var 	singleEntry = $("<span>").addClass("label label-default");
				var		userInfo = item.name;
	
				if(item.userid != "0") userInfo = $("<a>").attr("href", "/userprofile/" + item.userid).addClass("color_white").append(item.name);
				singleEntry.append(userInfo)
							.append(" ")
							.append(removeSign);

				$("#companyFounderList").append(singleEntry)
										.append(" ");
			});
	};

	var	companyOwnerItemZeroize = function()
	{
		$("#companyOwnerItem").val("");
		$("#companyOwnerItem").removeAttr("disabled");
		$("#ButtonAddOwnerToCompany").attr("disabled", "");
	}

	var	RenderCompanyOwners = function()
	{
		$("#companyOwnerList").empty();
		companyProfile.owners.forEach(function(item, i, arr)
			{
				var		removeSign = $("<span>").addClass("glyphicon glyphicon-remove cursor_pointer")
												.attr("data-action", "AJAX_removeCompanyOwner")
												.attr("data-id", item.id)
												.on("click", AreYouSureClickHandler);
				var 	singleEntry = $("<span>").addClass("label label-default");
				var		userInfo = item.name;
	
				if(item.userid != "0") userInfo = $("<a>").attr("href", "/userprofile/" + item.userid).addClass("color_white").append(item.name);
				singleEntry.append(userInfo)
							.append(" ")
							.append(removeSign);

				$("#companyOwnerList").append(singleEntry)
										.append(" ");
			});
	};

	var	companyIndustryItemZeroize = function()
	{
		$("#companyIndustryItem").val("");
		$("#companyIndustryItem").removeAttr("disabled");
		$("#ButtonAddIndustryToCompany").attr("disabled", "");
	}

	var	RenderCompanyIndustries = function()
	{
		$("#companyIndustryList").empty();
		companyProfile.industries.forEach(function(item, i, arr)
			{
				var		removeSign = $("<span>").addClass("glyphicon glyphicon-remove cursor_pointer")
												.attr("data-action", "AJAX_removeCompanyIndustry")
												.attr("data-id", item.company_industry_ref_id)
												.on("click", AreYouSureClickHandler);
				var 	singleEntry = $("<span>").addClass("label label-default");
				var		companyInfo = item.name;
	
				singleEntry.append(companyInfo)
							.append(" ")
							.append(removeSign);

				$("#companyIndustryList").append(singleEntry)
										.append(" ");
			});
	};

	var	RenderCandidatesList = function(openVacancyID, candidatesList)
	{
		var		result = $();
		var		correctAnswers = [];
		var		lngsTitle = [];
		var		skillsTitle = [];

		companyProfile.open_vacancies.forEach(function(item) {
			if(item.id == openVacancyID)
			{
				correctAnswers[1] = item.correct_answer1;
				correctAnswers[2] = item.correct_answer2;
				correctAnswers[3] = item.correct_answer3;
				lngsTitle[1] = item.language1_title;
				lngsTitle[2] = item.language2_title;
				lngsTitle[3] = item.language3_title;
				skillsTitle[1] = item.skill1_title;
				skillsTitle[2] = item.skill2_title;
				skillsTitle[3] = item.skill3_title;
			}
		});

		{
			var		divTitle;

			// --- title
			divTitle = $("<div>")	.addClass("row bg-info form-group")
									.append($("<div>").addClass("hidden-xs hidden-sm col-md-1 ").append("Оценка"))
									.append($("<div>").addClass("hidden-xs hidden-sm col-md-3 ").append("Имя кандидата"))
									.append($("<div>").addClass("hidden-xs hidden-sm col-md-2  padding_0px").append("Ответы на вопросы"))
									.append($("<div>").addClass("hidden-xs hidden-sm col-md-2  padding_0px").append("Ин. языки"))
									.append($("<div>").addClass("hidden-xs hidden-sm col-md-2  padding_0px").append("Требования"));

			result = result.add(divTitle);
		}

		candidatesList.forEach(function(item, i, arr) 
		{
			if(item.status == "applied")
			{

				var		divRowCandidate			= $("<div>")	.addClass("row form-group")
																.attr("id", "rowAppliedCandidate" + item.id)
				var		divColFitness			= $("<div>")	.addClass("col-xs-3 col-md-1");
				var		divColName				= $("<div>")	.addClass("col-xs-9 col-md-3");
				var		divColCompanyQue		= $("<div>")	.addClass("col-xs-4 col-md-2 padding_0px");
				var		divColCompanySkill		= $("<div>")	.addClass("col-xs-4 col-md-2 padding_0px");
				var		divColCompanyLng		= $("<div>")	.addClass("col-xs-4 col-md-2 padding_0px");

				var		spanAnswer1				= $("<span>")	.addClass("fa-stack")
																.attr("data-toggle", "tooltip")
																.attr("data-placement", "top")
																.attr("title", "Кв. вопрос 1");
				var		spanAnswer2				= $("<span>")	.addClass("fa-stack")
																.attr("data-toggle", "tooltip")
																.attr("data-placement", "top")
																.attr("title", "Кв. вопрос 2");
				var		spanAnswer3				= $("<span>")	.addClass("fa-stack")
																.attr("data-toggle", "tooltip")
																.attr("data-placement", "top")
																.attr("title", "Кв. вопрос 3");
				var		answerRoaster			= $();
				var		skillRoaster			= $();
				var		lngRoaster				= $();

				var		divColReject			= $("<div>")	.addClass("col-xs-6 col-md-1 form-group");
				var		divColChat				= $("<div>")	.addClass("col-xs-6 col-md-1 form-group");

				var		buttonChat				= $("<button>")	.addClass("btn btn-primary form-control")
																.data("user_id", item.user.id)
																.data("action", "chat")
																.append("<i class=\"fa fa-comments-o fa-lg\"></i>")
																.on("click", function() {
																	var		user_id = $(this).data("user_id");

																	window.location.href = "/chat/" + user_id + "?rand=" + Math.random() * 1234567890;
																});
				var		buttonReject			= $("<button>")	.addClass("btn btn-danger form-control")
																.data("id", item.id)
																.data("script", "company.cgi")
																.data("action", "AJAX_rejectCandidate")
																.attr("data-toggle", "tooltip")
																.attr("data-placement", "top")
																.attr("title", "Отказать")
																.append("<i class=\"fa fa-times fa-lg\"></i>")
																.on("click", removeGeneralPreparation);

				var		ratingClass;
				var		candidateRating			= 0;
				var		candidateScore			= 0;
				var		positionScore 			= 0;


				// --- count correct answers
				for (var i = 1; i <= correctAnswers.length - 1; ++i) 
				{
					
					var		spanAnswer				= $("<span>")	.addClass("fa-stack")
																	.attr("data-toggle", "tooltip")
																	.attr("data-placement", "top")
																	.attr("title", "Кв. вопрос " + i);
					positionScore += 1;
					if(correctAnswers[i] == item["answer" + i])
					{
						candidateScore += 1;
						spanAnswer.append("<i class=\"fa fa-circle-o fa-stack-2x color_green\"></i><i class=\"fa fa-check fa-stack-1x color_green\"></i>");
					}
					else
					{
						spanAnswer.append("<i class=\"fa fa-circle-o fa-stack-2x color_red\"></i><i class=\"fa fa-times fa-stack-1x color_red\"></i>")
					}

					answerRoaster = answerRoaster.add(spanAnswer);
				}

				// --- count skill scores
				for (var i = 1; i <= skillsTitle.length - 1; ++i) 
				{
					var	spanSkill = $("<span>")	.addClass("fa-stack")
												.attr("data-toggle", "tooltip")
												.attr("data-placement", "top")
												.attr("title", system_calls.ConvertHTMLToText(skillsTitle[i]));

					if(skillsTitle[i].length)
					{
						positionScore += 1;
						if(item["skill" + i] == "Y")
						{
							candidateScore += 1;
							spanSkill.append("<i class=\"fa fa-circle-o fa-stack-2x color_green\"></i><i class=\"fa fa-check fa-stack-1x color_green\"></i>");
						}
						else
						{
							spanSkill.append("<i class=\"fa fa-circle-o fa-stack-2x color_red\"></i><i class=\"fa fa-times fa-stack-1x color_red\"></i>")
						}
					}
					else
					{
						spanSkill.append("<i class=\"fa fa-circle-o fa-stack-2x color_grey\"></i>")
					}

					skillRoaster = skillRoaster.add(spanSkill);
				}

				// --- count lng scores
				for (var i = 1; i <= lngsTitle.length - 1; ++i) 
				{
					var	spanLng = $("<span>")	.addClass("fa-stack")
												.attr("data-toggle", "tooltip")
												.attr("data-placement", "top")
												.attr("title", system_calls.ConvertHTMLToText(lngsTitle[i]));

					if(lngsTitle[i].length)
					{
						positionScore += 1;
						if(item["language" + i] == "Y")
						{
							candidateScore += 1;
							spanLng.append("<i class=\"fa fa-circle-o fa-stack-2x color_green\"></i><i class=\"fa fa-check fa-stack-1x color_green\"></i>");
						}
						else
						{
							spanLng.append("<i class=\"fa fa-circle-o fa-stack-2x color_red\"></i><i class=\"fa fa-times fa-stack-1x color_red\"></i>")
						}
					}
					else
					{
						spanLng.append("<i class=\"fa fa-circle-o fa-stack-2x color_grey\"></i>")
					}

					lngRoaster = lngRoaster.add(spanLng);
				}


				candidateRating = Math.round(candidateScore / positionScore * 100);
				if(candidateRating < 33) ratingClass = "color_red"
				else if(candidateRating < 66) ratingClass = "color_orange"
				else ratingClass = "color_green";
				divColFitness	.append(candidateRating + "%")
								.addClass(ratingClass);
				divColName.append("<a href=\"/userprofile/" + item.user.id + "\">" + item.user.name + " " + item.user.nameLast + "</a>");
				if(item.description.length)
				{
					var		userInfo = $("<span>").addClass("fa fa-info-circle")
												.attr("id", "OpenVacancyCandidate" + item.id)
												.on("click", function() 
													{
														system_calls.PopoverInfo("OpenVacancyCandidate" + item.id, system_calls.ConvertHTMLToText(item.description));
													});

					divColName	.append(" ")
								.append(userInfo);
				}

				divRowCandidate	.append(divColFitness)
								.append(divColName)
								.append(divColCompanyQue.append(answerRoaster))
								.append(divColCompanyLng.append(lngRoaster))
								.append(divColCompanySkill.append(skillRoaster))
								.append(divColChat.append(buttonChat))
								.append(divColReject.append(buttonReject));

				result = result.add(divRowCandidate);

			}
		});


		$("#OpenVacancy" + openVacancyID + "Candidates").append(result);
		$("#OpenVacancy" + openVacancyID + "Candidates [data-toggle=\"tooltip\"]").tooltip({ animation: "animated bounceIn"});

		return		result;
	}

	var AppliedCandidatesListClickHandler = function(openVacancyID)
	{
		$("#OpenVacancy" + openVacancyID + "CandidatesCollapsible").collapse("toggle");
		$("button[data-group='OpenVacancy" + openVacancyID + "CandidatesButtons']").button("loading");


		$.getJSON('/cgi-bin/company.cgi?action=AJAX_getCandidatesAppliedToPosition', {id: openVacancyID, rand: Math.random() * 1234567890})
			.done(function(data) {
				if(data.result === "success")
				{
					var		counterAppliedUsers = 0;

					$("#OpenVacancy" + openVacancyID + "Candidates").empty();
					RenderCandidatesList(openVacancyID, data.candidates);

					data.candidates.forEach(function(item) { 
						if(item.status == "applied") 
							++counterAppliedUsers; 
					});

					setTimeout(function() {
					$("button[data-group='OpenVacancy" + openVacancyID + "CandidatesButtons']").empty().append("<i class=\"fa fa-user\"></i> (" + counterAppliedUsers + ")"); }, 550); // --- timeout exactly the same as loading timeout
				}
				else
				{
					console.debug("InitAppliedCandidatesToVacancy: ERROR: " + data.description);
				}

				setTimeout(function() {$("button[data-group='OpenVacancy" + openVacancyID + "CandidatesButtons']").button("reset"); }, 500); // --- wait for animation
			})
			.fail(function() {
				console.debug("InitAppliedCandidatesToVacancy: ERROR: parse JSON response from server");
				setTimeout(function() {$("button[data-group='OpenVacancy" + openVacancyID + "CandidatesButtons']").button("reset"); }, 500); // --- wait for animation
			});
	}

	// --- Rendering vacancy collapsible immediately after page loading.
	var InitAppliedCandidatesToVacancy = function(openVacancy)
	{
		var		id = openVacancy.id;
		var		divRowCollapsible	= $("<div>").addClass("collapse form-group")
												.attr("id", "OpenVacancy" + id + "CandidatesCollapsible");
		var		divRowTop			= $("<div>")	.addClass("row form-group")
		var		divColTop			= $("<div>")	.addClass("col-xs-12 collapse-top-shadow form-group")
													.append($("<p>"));

		var		divCandidate		= $("<div>")	.attr("id", "OpenVacancy" + id + "Candidates");

		var		divRowBottom		= $("<div>")	.addClass("row")
		var		divColBottom		= $("<div>")	.addClass("col-xs-12 collapse-bottom-shadow")
													.append($("<p>"));
		divRowTop				.append(divColTop);
		divRowBottom			.append(divColBottom);

		divRowCollapsible.append(divRowTop);
		divRowCollapsible.append(divCandidate);
		divRowCollapsible.append(divRowBottom);

		return divRowCollapsible;
	}

	// --- Rendering single open vacancy collapsible for editing.
	var RenderSingleVacancyCollapsible = function(openVacancy)
	{
		var		id = openVacancy.id;
		var		divRowCollapsible	= $("<div>").addClass("collapse form-group")
												.attr("id", "OpenVacancy" + id + "Edit");
		var		divRowTop			= $("<div>")	.addClass("row form-group")
		var		divColTop			= $("<div>")	.addClass("col-xs-12 collapse-top-shadow form-group")
													.append($("<p>"));

		var		divRowTitle			= $("<div>")	.addClass("row");
		var		divColTitle			= $("<div>")	.addClass("col-xs-12 col-md-5 form-group");
		var		inputTitle			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Title")
													.attr("placeholder", "Должность")
													.val(system_calls.ConvertHTMLToText(openVacancy.company_position_title));
		var		divColCity			= $("<div>")	.addClass("col-xs-12 col-md-5 form-group");
		var		inputCity			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_City")
													.attr("placeholder", "Город")
													.val(system_calls.ConvertHTMLToText(openVacancy.geo_locality_title + (openVacancy.geo_region_title.length ? " (" + openVacancy.geo_region_title + ")" : "")));

		var		divRowSalary		= $("<div>")	.addClass("row");
		var		divColMinSalary		= $("<div>")	.addClass("col-xs-6 col-md-5 form-group");
		var		inputMinSalary		= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_MinSalary")
													.attr("placeholder", "Минимум з/п")
													.attr("step", "10000")
													.attr("min", "0")
													.attr("type", "number")
													.val(openVacancy.salary_min);
		var		divColMaxSalary		= $("<div>")	.addClass("col-xs-6 col-md-5 form-group");
		var		inputMaxSalary		= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_MaxSalary")
													.attr("placeholder", "Максимум з/п")
													.attr("step", "10000")
													.attr("min", "0")
													.attr("type", "number")
													.val(openVacancy.salary_max);

		var		divRowEmploymenttype= $("<div>")	.addClass("row");
		var		divColClosureDate= $("<div>")	.addClass("col-xs-6 col-md-5 form-group");
		var		inputClosureDate	= $("<select>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_ClosureDate")
													.append($("<option>").attr("value", "1").append("Выход на работу в январе"))
													.append($("<option>").attr("value", "2").append("Выход на работу в феврале"))
													.append($("<option>").attr("value", "3").append("Выход на работу в марте"))
													.append($("<option>").attr("value", "4").append("Выход на работу в апреле"))
													.append($("<option>").attr("value", "5").append("Выход на работу в мае"))
													.append($("<option>").attr("value", "6").append("Выход на работу в июне"))
													.append($("<option>").attr("value", "7").append("Выход на работу в июле"))
													.append($("<option>").attr("value", "8").append("Выход на работу в августе"))
													.append($("<option>").attr("value", "9").append("Выход на работу в сентябре"))
													.append($("<option>").attr("value", "10").append("Выход на работу в октябре"))
													.append($("<option>").attr("value", "11").append("Выход на работу в ноябре"))
													.append($("<option>").attr("value", "12").append("Выход на работу в декабре"))
													.val(openVacancy.start_month);
		var		divColEmploymentType	= $("<div>").addClass("col-xs-6 col-md-5 form-group");
		var		inputEmploymentType	= $("<select>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_EmploymentType")
													.append($("<option>").attr("value", "fte").append("Полный рабочий день"))
													.append($("<option>").attr("value", "pte").append("Частичная занятость"))
													.append($("<option>").attr("value", "remote").append("Удаленная работа"))
													.append($("<option>").attr("value", "entrepreneur").append("Контрактный сотрудник"))
													.val(openVacancy.work_format);

		var		divRowQuestion1			= $("<div>")	.addClass("row");
		var		divColQuestion1			= $("<div>")	.addClass("col-xs-12 col-md-10 form-group");
		var		inputQuestion1			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Question1")
													.attr("placeholder", "Квалификационный вопрос 1")
													.val(system_calls.ConvertHTMLToText(openVacancy.question1));

		var		divRowQuestion2			= $("<div>")	.addClass("row");
		var		divColQuestion2			= $("<div>")	.addClass("col-xs-12 col-md-10 form-group");
		var		inputQuestion2			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Question2")
													.attr("placeholder", "Квалификационный вопрос 2")
													.val(system_calls.ConvertHTMLToText(openVacancy.question2));

		var		divRowQuestion3			= $("<div>")	.addClass("row");
		var		divColQuestion3			= $("<div>")	.addClass("col-xs-12 col-md-10 form-group");
		var		inputQuestion3			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Question3")
													.attr("placeholder", "Квалификационный вопрос 3")
													.val(system_calls.ConvertHTMLToText(openVacancy.question3));

		var		divRowAnswer11			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer11	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer11	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question1Answers")
														.attr("value", "1")
														.prop("checked", (openVacancy.correct_answer1 == "1" ? "true" : ""));
		var		divColAnswer11			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group");
		var		inputAnswer11			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Question1Answer1")
													.attr("placeholder", "Вариант ответа 1")
													.val(system_calls.ConvertHTMLToText(openVacancy.answer11));

		var		divRowAnswer12			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer12	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer12	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question1Answers")
														.attr("value", "2")
														.prop("checked", (openVacancy.correct_answer1 == "2" ? "true" : ""));
		var		divColAnswer12			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group");
		var		inputAnswer12			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Question1Answer2")
													.attr("placeholder", "Вариант ответа 2")
													.val(system_calls.ConvertHTMLToText(openVacancy.answer12));

		var		divRowAnswer13			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer13	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer13	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question1Answers")
														.attr("value", "3")
														.prop("checked", (openVacancy.correct_answer1 == "3" ? "true" : ""));
		var		divColAnswer13			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group");
		var		inputAnswer13			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Question1Answer3")
													.attr("placeholder", "Вариант ответа 3")
													.val(system_calls.ConvertHTMLToText(openVacancy.answer13));

		var		divRowAnswer21			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer21	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer21	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question2Answers")
														.attr("value", "1")
														.prop("checked", (openVacancy.correct_answer2 == "1" ? "true" : ""));
		var		divColAnswer21			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group");
		var		inputAnswer21			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Question2Answer1")
													.attr("placeholder", "Вариант ответа 1")
													.val(system_calls.ConvertHTMLToText(openVacancy.answer21));

		var		divRowAnswer22			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer22	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer22	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question2Answers")
														.attr("value", "2")
														.prop("checked", (openVacancy.correct_answer2 == "2" ? "true" : ""));
		var		divColAnswer22			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group");
		var		inputAnswer22			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Question2Answer2")
													.attr("placeholder", "Вариант ответа 2")
													.val(system_calls.ConvertHTMLToText(openVacancy.answer22));

		var		divRowAnswer23			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer23	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer23	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question2Answers")
														.attr("value", "3")
														.prop("checked", (openVacancy.correct_answer2 == "3" ? "true" : ""));
		var		divColAnswer23			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group");
		var		inputAnswer23			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Question2Answer3")
													.attr("placeholder", "Вариант ответа 3")
													.val(system_calls.ConvertHTMLToText(openVacancy.answer23));

		var		divRowAnswer31			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer31	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer31	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question3Answers")
														.attr("value", "1")
														.prop("checked", (openVacancy.correct_answer3 == "1" ? "true" : ""));
		var		divColAnswer31			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group");
		var		inputAnswer31			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Question3Answer1")
													.attr("placeholder", "Вариант ответа 1")
													.val(system_calls.ConvertHTMLToText(openVacancy.answer31));

		var		divRowAnswer32			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer32	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer32	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question3Answers")
														.attr("value", "2")
														.prop("checked", (openVacancy.correct_answer3 == "2" ? "true" : ""));
		var		divColAnswer32			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group");
		var		inputAnswer32			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Question3Answer2")
													.attr("placeholder", "Вариант ответа 2")
													.val(system_calls.ConvertHTMLToText(openVacancy.answer32));

		var		divRowAnswer33			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer33	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer33	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question3Answers")
														.attr("value", "3")
														.prop("checked", (openVacancy.correct_answer3 == "3" ? "true" : ""));
		var		divColAnswer33			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group");
		var		inputAnswer33			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Question3Answer3")
													.attr("placeholder", "Вариант ответа 3")
													.val(system_calls.ConvertHTMLToText(openVacancy.answer33));


		var		divRowLanguage			= $("<div>")	.addClass("row");
		var		divColLanguage1			= $("<div>")	.addClass("col-xs-12 col-md-4 form-group");
		var		divColLanguage2			= $("<div>")	.addClass("col-xs-12 col-md-4 form-group");
		var		divColLanguage3			= $("<div>")	.addClass("col-xs-12 col-md-4 form-group");
		var		inputLanguage1			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Language1")
													.attr("placeholder", "Иностранный язык 1 (не обязательно)")
													.val(system_calls.ConvertHTMLToText(openVacancy.language1_title));
		var		inputLanguage2			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Language2")
													.attr("placeholder", "Иностранный язык 2 (не обязательно)")
													.val(system_calls.ConvertHTMLToText(openVacancy.language2_title));
		var		inputLanguage3			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Language3")
													.attr("placeholder", "Иностранный язык 3 (не обязательно)")
													.val(system_calls.ConvertHTMLToText(openVacancy.language3_title));

		var		divRowSkill			= $("<div>")	.addClass("row");
		var		divColSkill1		= $("<div>")	.addClass("col-xs-12 col-md-4 form-group");
		var		divColSkill2		= $("<div>")	.addClass("col-xs-12 col-md-4 form-group");
		var		divColSkill3		= $("<div>")	.addClass("col-xs-12 col-md-4 form-group");
		var		inputSkill1			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Skill1")
													.attr("placeholder", "Навык 1 (не обязательно)")
													.val(system_calls.ConvertHTMLToText(openVacancy.skill1_title));
		var		inputSkill2			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Skill2")
													.attr("placeholder", "Навык 2 (не обязательно)")
													.val(system_calls.ConvertHTMLToText(openVacancy.skill2_title));
		var		inputSkill3			= $("<input>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Skill3")
													.attr("placeholder", "Навык 3 (не обязательно)")
													.val(system_calls.ConvertHTMLToText(openVacancy.skill3_title));

		var		divRowDescription	= $("<div>")	.addClass("row");
		var		divColDescription	= $("<div>")	.addClass("col-xs-12 col-md-10 form-group");
		var		inputDescription	= $("<textarea>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Description")
													.attr("placeholder", "Описание")
													.attr("rows", "4")
													.attr("maxlength", "16384")
													.val(system_calls.ConvertHTMLToText(openVacancy.description));

		var		divRowPublish		= $("<div>")	.addClass("row");
		var		divColPublish		= $("<div>")	.addClass("col-xs-12 col-md-10 form-group");
		var		inputPublish		= $("<select>")	.addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_Publish")
													.append($("<option>").attr("value", "week").append("Опубликовать на неделю"))
													.append($("<option>").attr("value", "month").append("Опубликовать на месяц"))
													.append($("<option>").attr("value", "suspend").append("Не публиковать"))
													.val(openVacancy.publish_period);

		var		divRowControl		= $("<div>").addClass("row");
		var		divColControlSubmit	= $("<div>").addClass("col-xs-6 col-md-5 form-group");
		var		divColControlCancel	= $("<div>").addClass("col-xs-6 col-md-5 form-group");
		var		buttonSubmit		= $("<button>").addClass("btn btn-primary form-control")
													.attr("id", "EditOpenVacancy" + id + "SubmitButton")
													.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span> Подождите...")
													.data("id", id)
													.on("click", function() { UpdateOpenVacancyClickHandler($(this).data("id")); })
													.append("Сохранить");
		var		buttonCancel		= $("<button>").addClass("btn btn-default form-control")
													.on("click", function() { $("#OpenVacancy" + id + "Edit").collapse("toggle"); })
													.append("Закрыть");
		var		divRowBottom		= $("<div>")	.addClass("row")
		var		divColBottom		= $("<div>")	.addClass("col-xs-12 collapse-bottom-shadow")
													.append($("<p>"));

		divRowTop				.append(divColTop);
		divRowTitle				.append(divColTitle.append(inputTitle))
								.append(divColCity.append(inputCity));
		divRowSalary			.append(divColMinSalary.append(inputMinSalary))
								.append(divColMaxSalary.append(inputMaxSalary));
		divRowEmploymenttype	.append(divColClosureDate.append(inputClosureDate))
								.append(divColEmploymentType.append(inputEmploymentType));
		divRowQuestion1			.append(divColQuestion1.append(inputQuestion1));
		divRowAnswer11			.append(divColCorrectAnswer11.append(inputCorrectAnswer11))
								.append(divColAnswer11.append(inputAnswer11));
		divRowAnswer12			.append(divColCorrectAnswer12.append(inputCorrectAnswer12))
								.append(divColAnswer12.append(inputAnswer12));
		divRowAnswer13			.append(divColCorrectAnswer13.append(inputCorrectAnswer13))
								.append(divColAnswer13.append(inputAnswer13));
		divRowQuestion2			.append(divColQuestion2.append(inputQuestion2));
		divRowAnswer21			.append(divColCorrectAnswer21.append(inputCorrectAnswer21))
								.append(divColAnswer21.append(inputAnswer21));
		divRowAnswer22			.append(divColCorrectAnswer22.append(inputCorrectAnswer22))
								.append(divColAnswer22.append(inputAnswer22));
		divRowAnswer23			.append(divColCorrectAnswer23.append(inputCorrectAnswer23))
								.append(divColAnswer23.append(inputAnswer23));
		divRowQuestion3			.append(divColQuestion3.append(inputQuestion3));
		divRowAnswer31			.append(divColCorrectAnswer31.append(inputCorrectAnswer31))
								.append(divColAnswer31.append(inputAnswer31));
		divRowAnswer32			.append(divColCorrectAnswer32.append(inputCorrectAnswer32))
								.append(divColAnswer32.append(inputAnswer32));
		divRowAnswer33			.append(divColCorrectAnswer33.append(inputCorrectAnswer33))
								.append(divColAnswer33.append(inputAnswer33));
		divRowLanguage			.append(divColLanguage1.append(inputLanguage1))
								.append(divColLanguage2.append(inputLanguage2))
								.append(divColLanguage3.append(inputLanguage3));
		divRowSkill				.append(divColSkill1.append(inputSkill1))
								.append(divColSkill2.append(inputSkill2))
								.append(divColSkill3.append(inputSkill3));
		divRowPublish			.append(divColPublish.append(inputPublish));
		divRowControl			.append(divColControlSubmit.append(buttonSubmit))
								.append(divColControlCancel.append(buttonCancel));
		divRowDescription		.append(divColDescription.append(inputDescription));
		divRowBottom			.append(divColBottom);

		divRowCollapsible.append(divRowTop);
		divRowCollapsible.append(divRowTitle);
		divRowCollapsible.append(divRowSalary);
		divRowCollapsible.append(divRowEmploymenttype);
		divRowCollapsible.append(divRowQuestion1);
		divRowCollapsible.append(divRowAnswer11);
		divRowCollapsible.append(divRowAnswer12);
		divRowCollapsible.append(divRowAnswer13);
		divRowCollapsible.append(divRowQuestion2);
		divRowCollapsible.append(divRowAnswer21);
		divRowCollapsible.append(divRowAnswer22);
		divRowCollapsible.append(divRowAnswer23);
		divRowCollapsible.append(divRowQuestion3);
		divRowCollapsible.append(divRowAnswer31);
		divRowCollapsible.append(divRowAnswer32);
		divRowCollapsible.append(divRowAnswer33);
		divRowCollapsible.append(divRowLanguage);
		divRowCollapsible.append(divRowSkill);
		divRowCollapsible.append(divRowDescription);
		divRowCollapsible.append(divRowPublish);
		divRowCollapsible.append(divRowControl);
		divRowCollapsible.append(divRowBottom);


		return divRowCollapsible;
	}

	var	RenderCompanyOpenVacancies = function()
	{

		$("div#OpenVacanciesList").empty();

		companyProfile.open_vacancies.sort(function(a, b)
			{
				var		arrA = a.publish_finish.split(/\-/);
				var		arrB = b.publish_finish.split(/\-/);
				var 	publishA, publishB;
				var		startMonthA, startMonthB, startMonthDiff;
				var		result = 0;

				publishA = new Date(parseInt(arrA[0]), parseInt(arrA[1]) - 1, parseInt(arrA[2]));
				publishB = new Date(parseInt(arrB[0]), parseInt(arrB[1]) - 1, parseInt(arrB[2]));
				startMonthA = parseInt(a.start_month);
				startMonthB = parseInt(b.start_month);
				startMonthDiff = startMonthA - startMonthB + 0.1;

				if(publishA.getTime() == publishB.getTime()) { result = startMonthDiff / Math.abs(startMonthDiff); }
				if(publishA.getTime() <  publishB.getTime()) { result = 1; }
				if(publishA.getTime() >  publishB.getTime()) { result = -1; }

				return result;
			});

		companyProfile.open_vacancies.forEach(function(item, i, arr)
		{
			var		divRow = $("<div>").addClass("row")
										.attr("id", "openVacancy" + item.id);
			var		divRowControl_xs = $("<div>").addClass("row");
			var		divSeparatop = $("<div>").addClass("col-xs-12").append($("<p>"));
			var		divStatus = $("<div>").addClass("col-xs-2 col-md-1");
			var		divTitle = $("<div>").addClass("col-xs-8 col-md-7");
			var		divMonth = $("<div>").addClass("col-xs-2 col-md-1");
			var		divControl1_md = $("<div>").addClass("hidden-xs hidden-sm col-md-1 ");
			var		divControl2_md = $("<div>").addClass("hidden-xs hidden-sm col-md-1 ");
			var		divControl3_md = $("<div>").addClass("hidden-xs hidden-sm col-md-1 ");
			var		divControl1_xs = $("<div>").addClass("hidden-md hidden-lg col-xs-4 ");
			var		divControl2_xs = $("<div>").addClass("hidden-md hidden-lg col-xs-4 ");
			var		divControl3_xs = $("<div>").addClass("hidden-md hidden-lg col-xs-4 ");
			var		spanStatus;

			var		buttonControl1_md = $("<button>").addClass("btn btn-primary form-control")
													.attr("data-group", "OpenVacancy" + item.id + "CandidatesButtons")
													.data("id", item.id)
													.append("<i class=\"fa fa-user\"></i> (" + item.number_of_applied_candidates + ")")
													.attr("data-toggle", "tooltip")
													.attr("data-placement", "top")
													.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>")
													.attr("title", "Список кандидатов")
													.on("click", function() { AppliedCandidatesListClickHandler($(this).data("id")); });
			var		buttonControl2_md = $("<button>").addClass("btn btn-primary form-control")
													.data("id", item.id)
													.append("<i class=\"fa fa-pencil\"></i>")
													.attr("data-toggle", "tooltip")
													.attr("data-placement", "top")
													.attr("title", "Изменить вакансию")
													.on("click", function() { $("#OpenVacancy" + item.id + "Edit").collapse("toggle"); });
			var		buttonControl3_md = $("<button>").addClass("btn btn-default form-control")
													.data("id", item.id)
													.attr("data-toggle", "tooltip")
													.attr("data-placement", "top")
													.attr("title", "Удалить")
													.data("script", "company.cgi")
													.data("action", "AJAX_removeOpenVacancy")
													.on("click", removeGeneralPreparation)
													.append("<i class=\"fa fa-trash-o fa-lg\"></i>");
			var		buttonControl1_xs = $("<button>").addClass("btn btn-primary form-control")
													.attr("data-group", "OpenVacancy" + item.id + "CandidatesButtons")
													.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>")
													.data("id", item.id)
													.append("<i class=\"fa fa-user\"></i> (" + item.number_of_applied_candidates + ")")
													.on("click", function() { AppliedCandidatesListClickHandler($(this).data("id")); });
			var		buttonControl2_xs = $("<button>").addClass("btn btn-primary form-control")
													.data("id", item.id)
													.append("<i class=\"fa fa-pencil\"></i>")
													.on("click", function() { $("#OpenVacancy" + item.id + "Edit").collapse("toggle"); });
			var		buttonControl3_xs = $("<button>").addClass("btn btn-default form-control")
													.data("id", item.id)
													.data("script", "company.cgi")
													.data("action", "AJAX_removeOpenVacancy")
													.on("click", removeGeneralPreparation)
													.append("<i class=\"fa fa-trash-o fa-lg\"></i>");

			var		publishFinishTS = new Date(item.publish_finish + "T00:00:00");
			var		currentTS = new Date();

			if((currentTS <= publishFinishTS))
			{
				var		publisDaysRemains = Math.floor((publishFinishTS.getTime() - currentTS.getTime()) / (24 * 3600 * 1000) );

				spanStatus = $("<span>").addClass("fa-stack")
										.append($("<i>").addClass("fa fa-circle-o fa-stack-2x color_green"))
										.append($("<i>").addClass("fa fa-check fa-stack-1x color_green"))
										.attr("data-toggle", "tooltip")
										.attr("data-placement", "top")
										.attr("title", "Опубликована (еще " + publisDaysRemains + " " + system_calls.GetDaysSpelling(publisDaysRemains) + ")");
			}
			else
			{
				spanStatus = $("<span>").addClass("fa-stack")
										.append($("<i>").addClass("fa fa-circle-o fa-stack-2x color_red"))
										.append($("<i>").addClass("fa fa-times fa-stack-1x color_red"))
										.attr("data-toggle", "tooltip")
										.attr("data-placement", "top")
										.attr("title", "Не опубликована");
			}

			divStatus.append(spanStatus);
			divTitle.append(item.company_position_title + " в " + item.geo_locality_title + (item.geo_region_title.length ? " (" + item.geo_region_title + ")" : ""));
			divMonth.append(system_calls.ConvertMonthNumberToAbbrName(item.start_month));
			divControl1_md.append(buttonControl1_md);
			divControl2_md.append(buttonControl2_md);
			divControl3_md.append(buttonControl3_md);
			divControl1_xs.append(buttonControl1_xs);
			divControl2_xs.append(buttonControl2_xs);
			divControl3_xs.append(buttonControl3_xs);

			divRow	.append(divSeparatop)
					.append(divStatus)
					.append(divTitle)
					.append(divMonth)
					.append(divControl1_md)
					.append(divControl2_md)
					.append(divControl3_md);
			divRowControl_xs.append(divControl1_xs)
							.append(divControl2_xs)
							.append(divControl3_xs);

			$("div#OpenVacanciesList").append(divRow);
			$("div#OpenVacanciesList").append(divRowControl_xs);
			$("div#OpenVacanciesList").append(InitAppliedCandidatesToVacancy(item));
			$("div#OpenVacanciesList").append(RenderSingleVacancyCollapsible(item));

			// --- autocomplete should be added to existing DOM
			if(JSON_companyPosition.length)
				CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Title", JSON_companyPosition, AutocompleteCallbackChange);
			if(JSON_geoLocality.length) // --- condition added to avoid console error logging 
				CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_City", JSON_geoLocality, AutocompleteCallbackChange);
			if(JSON_language.length)
				CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Language1", JSON_language, AutocompleteCallbackChange);
			if(JSON_language.length)
				CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Language2", JSON_language, AutocompleteCallbackChange);
			if(JSON_language.length)
				CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Language3", JSON_language, AutocompleteCallbackChange);
			if(JSON_skill.length)
				CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Skill1", JSON_skill, AutocompleteCallbackChange);
			if(JSON_skill.length)
				CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Skill2", JSON_skill, AutocompleteCallbackChange);
			if(JSON_skill.length)
				CreateAutocompleteWithChangeCallback("input#OpenVacancy" + item.id + "Edit_Skill3", JSON_skill, AutocompleteCallbackChange);
		});

		$("div#OpenVacanciesList [data-toggle=\"tooltip\"]").tooltip({ animation: "animated bounceIn"});
	};

	var	RenderCompanyTitle = function()
	{
		$("span#companyType").html(companyProfile.type ? companyProfile.type : "___");
		$("span#companyTitle").html(companyProfile.name);
		$("span#companyLink").html(companyProfile.link);
		$("span#companyWebSite").html(companyProfile.webSite.length ? companyProfile.webSite : "(отсутствует)");
		$("span#companyFoundationDate").html(companyProfile.foundationDate);
		$("span#companyNumberOfEmployee").html(companyProfile.numberOfEmployee.length ? companyProfile.numberOfEmployee : "0");
		$("p#companyDescription").html(companyProfile.description ? companyProfile.description : "(описание отсутствует)")

		$("div#companyInfo .editableSpan").on("click", editableFuncReplaceSpanToInput);
		$("div#companyInfo .editableSpan").mouseenter(editableFuncHighlightBgcolor);
		$("div#companyInfo .editableSpan").mouseleave(editableFuncNormalizeBgcolor);

		$("div#companyInfo .editableParagraph").on("click", editableFuncReplaceParagraphToTextarea);
		$("div#companyInfo .editableParagraph").mouseenter(editableFuncHighlightBgcolor);
		$("div#companyInfo .editableParagraph").mouseleave(editableFuncNormalizeBgcolor);

		$("div#companyInfo .editableSelectCompanyType").on("click", editableFuncReplaceSpanToSelectCompanyType);
		$("div#companyInfo .editableSelectCompanyType").mouseenter(editableFuncHighlightBgcolor);
		$("div#companyInfo .editableSelectCompanyType").mouseleave(editableFuncNormalizeBgcolor);
	};


	var removeGeneralPreparation = function()
	{
		var		currTag = $(this);

		$("#AreYouSure #Remove").removeData(); 

		Object.keys(currTag.data()).forEach(function(item) { 
			$("#AreYouSure #Remove").data(item, currTag.data(item)); 
		});

		$("#AreYouSure").modal('show');
	}

	var	AreYouSureClickHandler = function()
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
	}

	var	AreYouSureRemoveHandler = function() {
		var		affectedID = $("#AreYouSure #Remove").data("id");
		var		affectedAction = $("#AreYouSure #Remove").data("action");
		var		affectedScript = $("#AreYouSure #Remove").data("script");

		if((typeof(affectedScript) == "undefined") || (affectedScript == ""))
			affectedScript = "index.cgi";

		$("#AreYouSure").modal('hide');

		$.getJSON('/cgi-bin/' + affectedScript + '?action=' + affectedAction, {id: affectedID, rand: Math.random() * 1234567890})
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
		// --- To improve User Expirience (react on user actions immediately, inspite on potential server error's) 
		if(affectedAction == "AJAX_removeCompanyFounder")
		{
			var		removeItemIndex = -1;

			companyProfile.founders.forEach(function(item, i, arr)
			{
				if(item.id == affectedID) removeItemIndex = i;
			});

			if(removeItemIndex >= 0) companyProfile.founders.splice(removeItemIndex, 1);
			RenderCompanyFounders();
		}
		if(affectedAction == "AJAX_removeCompanyOwner")
		{
			var		removeItemIndex = -1;

			companyProfile.owners.forEach(function(item, i, arr)
			{
				if(item.id == affectedID) removeItemIndex = i;
			});

			if(removeItemIndex >= 0) companyProfile.owners.splice(removeItemIndex, 1);
			RenderCompanyOwners();
		}
		if(affectedAction == "AJAX_removeCompanyIndustry")
		{
			var		removeItemIndex = -1;

			companyProfile.industries.forEach(function(item, i, arr)
			{
				if(item.company_industry_ref_id == affectedID) removeItemIndex = i;
			});

			if(removeItemIndex >= 0) companyProfile.industries.splice(removeItemIndex, 1);
			RenderCompanyIndustries();
		}
		if(affectedAction == "AJAX_removeOpenVacancy")
		{
			var		removeItemIndex = -1;

			companyProfile.open_vacancies.forEach(function(item, i, arr)
			{
				if(item.id == affectedID) removeItemIndex = i;
			});

			if(removeItemIndex >= 0) companyProfile.open_vacancies.splice(removeItemIndex, 1);
			RenderCompanyOpenVacancies();
		}
		if(affectedAction == "AJAX_rejectCandidate")
		{
			$("#rowAppliedCandidate" + affectedID).remove();
		}
		if(affectedAction == "AJAX_dropCompanyPosession")
		{
			window.location.href = "/companies_i_own_list?rand=" + system_calls.GetUUID();
		}
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

			console.debug("keyupEventHandler: pressed key [" + keyPressed + "]");

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

		if($(tag).data("action") == "AJAX_updateCompanyWebSite") 
		{
			$(tag).on('blur', editableFuncReplaceInputToSpan);
		}
		if($(tag).data("action") == "AJAX_updateCompanyEmployeeNumber") 
		{
			$(tag).on('blur', editableFuncReplaceInputToSpan);
		}
		if($(tag).data("action") == "AJAX_updateCompanyFoundationDate") 
		{
			var tagValue = system_calls.ConvertMonthNameToNumber($(this).text());

			$(tag).val(tagValue);
			$(tag).on("change", UpdateCompanyFoundationDatePickerOnChangeHandler);
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

	var	editableFuncReplaceInputToSpan = function (param) 
	{
		var currentTag = ((typeof param.html == "function") ? param : $(this));
		var	newTag = $("<span>", {
			text: $(currentTag).val().replace(/^\s+/, '').replace(/\s+$/, ''),
			id: $(currentTag).attr("id"),
			class: $(currentTag).attr("class")
		});

		$(newTag).data("id", $(currentTag).data("id"));
		$(newTag).data("action", $(currentTag).data("action"));

		if(($(currentTag).data("action") == "AJAX_updateCompanyFoundationDate"))
		{
			// --- don't replace datepicker back to span
			// --- it expose bootstrap error, few ms after replacement
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
			var		ajaxAction = $(newTag).data("action");
			var		ajaxActionID = $(newTag).data("id");
			var		ajaxValue = $(newTag).text();

			$.ajax({
				url:"/cgi-bin/index.cgi",
				data: {action:ajaxAction, id:ajaxActionID, value:system_calls.ConvertTextToHTML(ajaxValue), companyid: companyProfile.id}
			}).done(function(data)
				{
					var ajaxResult = JSON.parse(data);

					if(ajaxResult.result == "success")
					{

						if(ajaxAction == "AJAX_updateCompanyWebSite")
						{
							companyProfile.webSite = (ajaxValue.length ? ajaxValue : "(отсутствует)");
							$("#companyWebSite").empty().append(companyProfile.webSite);
						}
						else if(ajaxAction == "AJAX_updateCompanyEmployeeNumber")
						{
							companyProfile.numberOfEmployee = (ajaxValue.length ? ajaxValue : "0");
							$("#companyNumberOfEmployee").empty().append(companyProfile.numberOfEmployee);
						}
					}
					else
					{
						console.debug("editableFuncReplaceInputToSpan: ERROR in ajax [action = " + ajaxAction + ", id = " + companyProfile.id + ", ajaxValue = " + ajaxValue + "] " + ajaxResult.description);

						if(ajaxAction == "AJAX_updateCompanyLink")
						{
							system_calls.PopoverError("companyLink", ajaxResult.description);
							$("#companyLink").empty().append(ajaxResult.link);
						}
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

			if(currentTag.data("action") === "updateCompanyDescription") 
			{
				var		filteredCompanyDescription = system_calls.FilterUnsupportedUTF8Symbols(currentContent);

				if((filteredCompanyDescription === "") || (filteredCompanyDescription === "(описание отсутствует)")) 
				{
					filteredCompanyDescription = "";	
				}

				if(filteredCompanyDescription.length > 16384)
				{
					filteredCompanyDescription = filteredCompanyDescription.substr(0, 16384);
					console.debug("editableFuncReplaceToParagraphAccept:ERROR: description bigger than 16384 symbols");
				}

				companyProfile.description = filteredCompanyDescription;

				$.post('/cgi-bin/index.cgi?rand=' + Math.floor(Math.random() * 1000000000), 
					{
						description: filteredCompanyDescription,
						action: "AJAX_updateCompanyDescription",
						companyid: companyProfile.id,
						rand: Math.floor(Math.random() * 1000000000)
					}).done(function(data) {
						var		resultJSON = JSON.parse(data);

						if(resultJSON.result === "success")
						{
							if(filteredCompanyDescription == "")
							{
								$("#companyDescription").empty().append("(описание отсутствует)");
							}
						}
						else
						{
							console.debug("editableFuncReplaceToParagraphAccept: ERROR: " + resultJSON.description);
						}
					});
			} // --- if action == updateCompanyDescription
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


	var UpdateCompanyFoundationDatePickerOnChangeHandler = function(event) {
		var		ajaxAction = $(this).data("action");
		var		ajaxActionID = $(this).data("id");
		var		ajaxValue = $(this).val();

		if(ajaxValue.length)
		{
			/* Act on the event */
			$.getJSON("/cgi-bin/index.cgi",
				{action:ajaxAction, id:ajaxActionID, value:ajaxValue, companyid:companyProfile.id})
				.done(function (data) 
				{
					if(data.result == "success")
					{
						companyProfile.foundationDate = ajaxValue;
					}
					else
					{
						console.debug("UpdateCompanyFoundationDatePickerOnChangeHandler: ERROR: " + data.description);
					}

				});
		}
		else
		{
			$("#companyFoundationDate").popover({"content": "Выберите дату основания компании"})
								.popover("show")
								.parent().removeClass("has-success")
										.addClass("has-feedback has-error");
			setTimeout(function () 
				{
					$("#companyFoundationDate").popover("destroy");
				}, 3000);
		}
	};

	var	editableFuncReplaceSpanToSelectCompanyType = function () 
	{
		var	currentValue = $(this).text();
		var	tag = $("<select>", {
			id: $(this).attr("id"),
			class: $(this).attr("class")
		});

		system_calls.companyTypes.forEach(function(item, i , arr)
		{
			$(tag).append($("<option>").append(item));
		})

		$(tag).val(currentValue); 

		var	selectChangeHandler = function(event) 
		{
			editableFuncReplaceSelectToSpan($(this), editableFuncReplaceSpanToSelectCompanyType);
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
				editableFuncReplaceSelectToSpan($(this), editableFuncReplaceSpanToSelectCompanyType);
			}
		};

		$(tag).attr("initValue", $(this).text());
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
			text: $(currentTag).val().replace(/^\s+/, '').replace(/\s+$/, ''),
			id: $(currentTag).attr("id"),
			class: $(currentTag).attr("class")
		});

		$(newTag).data("id", $(currentTag).data("id"));
		$(newTag).data("action", $(currentTag).data("action"));

		$(currentTag).replaceWith(newTag);
		$(newTag).on('click', funcFromSelectToSpan);
		$(newTag).mouseenter(editableFuncHighlightBgcolor);
		$(newTag).mouseleave(editableFuncNormalizeBgcolor);

		ajaxAction = $(newTag).data("action");
		ajaxActionID = $(newTag).data("id");
		ajaxValue = $(newTag).text();

		if(ajaxValue == initValue)
		{
			console.debug("editableFuncReplaceSelectToSpan: value hasn't been changed");
		}
		else
		{
			$.ajax({
					url:"/cgi-bin/index.cgi",
					data: {action:ajaxAction, id:ajaxActionID, value:system_calls.ConvertTextToHTML(ajaxValue), companyid: companyProfile.id}
				}).done(function(data)
				{
					var		ajaxResult = JSON.parse(data);
					if(ajaxResult.result == "success")
					{
						if(ajaxAction == "AJAX_updateCompanyType")
						{
							companyProfile.type = ajaxValue;
						}
					}
					else
					{
						console.debug("editableFuncReplaceSelectToSpan: ERROR in ajax [action = " + ajaxAction + ", id = " + actionID + ", ajaxValue = " + ajaxValue + "] " + ajaxResult.description);
					}

				});
		} // --- if currValue == initValue
	}; // --- function

	var RenderCompanyLogo = function()
	{
		var		tagCanvas = $("#canvasForCompanyLogo");
		var		logoPath;

		if(companyProfile.logo_filename.length) logoPath = "/images/companies/" + companyProfile.logo_folder + "/" + companyProfile.logo_filename;
		else logoPath = "/images/pages/edit_company/nologo" + (Math.floor(Math.random()*8) + 1) + ".png";


		system_calls.RenderCompanyLogo(tagCanvas[0].getContext("2d"), logoPath, companyProfile.name, " ");
	};

	var editableFuncHighlightBgcolor = function () {
		$(this).addClass("editable_highlited_class", 400);
	};

	var editableFuncNormalizeBgcolor = function () {
		$(this).removeClass("editable_highlited_class", 200, "easeInOutCirc");
	};

	var	AddNewOpenVacancyClickHandler = function() 
	{
		var		title = $("#CreateOpenVacancyTitle").val();
		var		geo_locality = $("#CreateOpenVacancyCity").val();
		var		geo_locality_id = $("#CreateOpenVacancyCity").data("id");
		var		month = $("#CreateOpenVacancyClosureDate option:selected").attr("value");



		if(!title.length)
		{
			system_calls.PopoverError("CreateOpenVacancyTitle", "Необходимо заполнить должность");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо заполнить должность");
		}
		else if(!geo_locality.length)
		{
			system_calls.PopoverError("CreateOpenVacancyCity", "Необходимо заполнить город");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо заполнить город");
		}
		else if(!$("#CreateOpenVacancyQuestion1").val())
		{
			system_calls.PopoverError("CreateOpenVacancyQuestion1", "Необходимо заполнить 1-ый квалификационный вопрос");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо заполнить 1-ый квалификационный вопрос");
		}
		else if(!$("#CreateOpenVacancyQuestion2").val())
		{
			system_calls.PopoverError("CreateOpenVacancyQuestion2", "Необходимо заполнить 2-ой квалификационный вопрос");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо заполнить 2-ой квалификационный вопрос");
		}
		else if(!$("#CreateOpenVacancyQuestion3").val())
		{
			system_calls.PopoverError("CreateOpenVacancyQuestion3", "Необходимо заполнить 3-ий квалификационный вопрос");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо заполнить 3-ий квалификационный вопрос");
		}
		else if(!$("#CreateOpenVacancyQuestion1Answer1").val())
		{
			system_calls.PopoverError("CreateOpenVacancyQuestion1Answer1", "Необходимо заполнить ответ на 1-ый вопрос");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо заполнить ответ на 1-ый вопрос");
		}
		else if(!$("#CreateOpenVacancyQuestion1Answer2").val())
		{
			system_calls.PopoverError("CreateOpenVacancyQuestion1Answer2", "Необходимо заполнить ответ на 1-ый вопрос");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо заполнить ответ на 1-ый вопрос");
		}
		else if(!$("#CreateOpenVacancyQuestion1Answer3").val())
		{
			system_calls.PopoverError("CreateOpenVacancyQuestion1Answer3", "Необходимо заполнить ответ на 1-ый вопрос");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо заполнить ответ на 1-ый вопрос");
		}
		else if(!$("#CreateOpenVacancyQuestion2Answer1").val())
		{
			system_calls.PopoverError("CreateOpenVacancyQuestion2Answer1", "Необходимо заполнить ответ на 2-ой вопрос");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо заполнить ответ на 2-ой вопрос");
		}
		else if(!$("#CreateOpenVacancyQuestion2Answer2").val())
		{
			system_calls.PopoverError("CreateOpenVacancyQuestion2Answer2", "Необходимо заполнить ответ на 2-ой вопрос");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо заполнить ответ на 2-ой вопрос");
		}
		else if(!$("#CreateOpenVacancyQuestion2Answer3").val())
		{
			system_calls.PopoverError("CreateOpenVacancyQuestion2Answer3", "Необходимо заполнить ответ на 2-ой вопрос");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо заполнить ответ на 2-ой вопрос");
		}
		else if(!$("#CreateOpenVacancyQuestion3Answer1").val())
		{
			system_calls.PopoverError("CreateOpenVacancyQuestion3Answer1", "Необходимо заполнить ответ на 3-ий вопрос");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо заполнить ответ на 3-ий вопрос");
		}
		else if(!$("#CreateOpenVacancyQuestion3Answer2").val())
		{
			system_calls.PopoverError("CreateOpenVacancyQuestion3Answer2", "Необходимо заполнить ответ на 3-ий вопрос");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо заполнить ответ на 3-ий вопрос");
		}
		else if(!$("#CreateOpenVacancyQuestion3Answer3").val())
		{
			system_calls.PopoverError("CreateOpenVacancyQuestion3Answer3", "Необходимо заполнить ответ на 3-ий вопрос");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо заполнить ответ на 3-ий вопрос");
		}
		else if(typeof($("input[name=CreateOpenVacancyQuestion1Answers]:checked").val()) == "undefined")
		{
			system_calls.PopoverError("CreateOpenVacancyQuestion1", "Необходимо выбрать правильный ответ на 1-ый вопрос");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо выбрать правильный ответ на 1-ый вопрос");
		}
		else if(typeof($("input[name=CreateOpenVacancyQuestion2Answers]:checked").val()) == "undefined")
		{
			system_calls.PopoverError("CreateOpenVacancyQuestion2", "Необходимо выбрать правильный ответ на 2-ой вопрос");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо выбрать правильный ответ на 2-ой вопрос");
		}
		else if(typeof($("input[name=CreateOpenVacancyQuestion3Answers]:checked").val()) == "undefined")
		{
			system_calls.PopoverError("CreateOpenVacancyQuestion3", "Необходимо выбрать правильный ответ на 3-ий вопрос");
			system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Необходимо выбрать правильный ответ на 3-ий вопрос");
		}
		else
		{
			$("#AddNewOpenVacancySubmitButton").button("loading");

			$.post('/cgi-bin/company.cgi',
						{
							action: "AJAX_precreateNewOpenVacancy",
							company_id: companyProfile.id, 
							title: $("#CreateOpenVacancyTitle").val(),
							geo_locality: $("#CreateOpenVacancyCity").val(),
							geo_locality_id: geo_locality_id,
							minsalary: $("#CreateOpenVacancyMinSalary").val(),
							maxsalary: $("#CreateOpenVacancyMaxSalary").val(),
							month: $("#CreateOpenVacancyClosureDate").val(),
							employmenttype: $("#CreateOpenVacancyEmploymentType").val(),
							question1: $("#CreateOpenVacancyQuestion1").val(),
							question1answers: $("input[name=CreateOpenVacancyQuestion1Answers]:checked").val(),
							question1answer1: $("#CreateOpenVacancyQuestion1Answer1").val(),
							question1answer2: $("#CreateOpenVacancyQuestion1Answer2").val(),
							question1answer3: $("#CreateOpenVacancyQuestion1Answer3").val(),
							question2: $("#CreateOpenVacancyQuestion2").val(),
							question2answers: $("input[name=CreateOpenVacancyQuestion2Answers]:checked").val(),
							question2answer1: $("#CreateOpenVacancyQuestion2Answer1").val(),
							question2answer2: $("#CreateOpenVacancyQuestion2Answer2").val(),
							question2answer3: $("#CreateOpenVacancyQuestion2Answer3").val(),
							question3: $("#CreateOpenVacancyQuestion3").val(),
							question3answers: $("input[name=CreateOpenVacancyQuestion3Answers]:checked").val(),
							question3answer1: $("#CreateOpenVacancyQuestion3Answer1").val(),
							question3answer2: $("#CreateOpenVacancyQuestion3Answer2").val(),
							question3answer3: $("#CreateOpenVacancyQuestion3Answer3").val(),
							language1: $("#CreateOpenVacancyLanguage1").val(),
							language2: $("#CreateOpenVacancyLanguage2").val(),
							language3: $("#CreateOpenVacancyLanguage3").val(),
							skill1: $("#CreateOpenVacancySkill1").val(),
							skill2: $("#CreateOpenVacancySkill2").val(),
							skill3: $("#CreateOpenVacancySkill3").val(),
							description: $("#CreateOpenVacancyDescription").val(),
							publish: $("#CreateOpenVacancyPublish").val(),
							rand: Math.floor(Math.random() * 1000000000)
						})
				.done(function(postData) {
					try
					{
						var data = JSON.parse(postData);

						if(data.result === "success")
						{
							if(data.open_vacancies.length)
							{
								AddNewOpenVacancyReset();
								AddNewOpenVacancyToggleCollapsible();
								setTimeout(function() 
								{
									companyProfile.open_vacancies = data.open_vacancies;
									RenderCompanyOpenVacancies();
								}, 600); // --- timeout must be bigger than "reset button timer - 500"
							}
							else
							{
								system_calls.PopoverError("AddNewOpenVacancySubmitButton", "Вакансия не создалась.");
								console.debug("AddNewOpenVacancyClickHandler: ERROR: empty openvacancies array");
							}
						}
						else
						{
							system_calls.PopoverError("AddNewOpenVacancySubmitButton", data.description);
							console.debug("AddNewOpenVacancyClickHandler: ERROR: " + data.description);
						}
					}
					catch (e) // --- catch JSON.parse exception
					{
						console.log("AddNewOpenVacancySubmitButton:exception handler: ERROR: " + e.name + " (most probably wrong JSON reponse)");
						system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Ошибка JSON-ответа севера. Необходимо сообщить в тех. поддержку.");
					}
				setTimeout(function() {$("#AddNewOpenVacancySubmitButton").button("reset"); }, 500); // --- wait for animation
				})
				.fail(function(data) {
					$("#AddNewOpenVacancySubmitButton").button("reset");
				});
		}
	};

	var	UpdateOpenVacancyClickHandler = function(id)
	{
		var		title = $("#OpenVacancy" + id + "Edit_Title").val();
		var		geo_locality = $("#OpenVacancy" + id + "Edit_City").val();
		var		geo_locality_id = $("#OpenVacancy" + id + "Edit_City").data("id");
		var		month = $("#OpenVacancy" + id + "Edit_ClosureDate option:selected").attr("value");



		if(!$("#OpenVacancy" + id + "Edit_Title").val())
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Title", "Необходимо заполнить должность");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо заполнить должность");
		}
		else if(!$("#OpenVacancy" + id + "Edit_City").val())
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_City", "Необходимо заполнить город");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо заполнить город");
		}
		else if(!$("#OpenVacancy" + id + "Edit_Question1").val())
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Question1", "Необходимо заполнить 1-ый квалификационный вопрос");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо заполнить 1-ый квалификационный вопрос");
		}
		else if(!$("#OpenVacancy" + id + "Edit_Question2").val())
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Question2", "Необходимо заполнить 2-ой квалификационный вопрос");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо заполнить 2-ой квалификационный вопрос");
		}
		else if(!$("#OpenVacancy" + id + "Edit_Question3").val())
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Question3", "Необходимо заполнить 3-ий квалификационный вопрос");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо заполнить 3-ий квалификационный вопрос");
		}
		else if(!$("#OpenVacancy" + id + "Edit_Question1Answer1").val())
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Question1Answer1", "Необходимо заполнить ответ на 1-ый вопрос");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо заполнить ответ на 1-ый вопрос");
		}
		else if(!$("#OpenVacancy" + id + "Edit_Question1Answer2").val())
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Question1Answer2", "Необходимо заполнить ответ на 1-ый вопрос");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо заполнить ответ на 1-ый вопрос");
		}
		else if(!$("#OpenVacancy" + id + "Edit_Question1Answer3").val())
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Question1Answer3", "Необходимо заполнить ответ на 1-ый вопрос");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо заполнить ответ на 1-ый вопрос");
		}
		else if(!$("#OpenVacancy" + id + "Edit_Question2Answer1").val())
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Question2Answer1", "Необходимо заполнить ответ на 2-ой вопрос");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо заполнить ответ на 2-ой вопрос");
		}
		else if(!$("#OpenVacancy" + id + "Edit_Question2Answer2").val())
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Question2Answer2", "Необходимо заполнить ответ на 2-ой вопрос");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо заполнить ответ на 2-ой вопрос");
		}
		else if(!$("#OpenVacancy" + id + "Edit_Question2Answer3").val())
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Question2Answer3", "Необходимо заполнить ответ на 2-ой вопрос");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо заполнить ответ на 2-ой вопрос");
		}
		else if(!$("#OpenVacancy" + id + "Edit_Question3Answer1").val())
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Question3Answer1", "Необходимо заполнить ответ на 3-ий вопрос");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо заполнить ответ на 3-ий вопрос");
		}
		else if(!$("#OpenVacancy" + id + "Edit_Question3Answer2").val())
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Question3Answer2", "Необходимо заполнить ответ на 3-ий вопрос");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо заполнить ответ на 3-ий вопрос");
		}
		else if(!$("#OpenVacancy" + id + "Edit_Question3Answer3").val())
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Question3Answer3", "Необходимо заполнить ответ на 3-ий вопрос");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо заполнить ответ на 3-ий вопрос");
		}
		else if(typeof($("input[name=OpenVacancy" + id + "Edit_Question1Answers]:checked").val()) == "undefined")
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Question1", "Необходимо выбрать правильный ответ на 1-ый вопрос");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо выбрать правильный ответ на 1-ый вопрос");
		}
		else if(typeof($("input[name=OpenVacancy" + id + "Edit_Question2Answers]:checked").val()) == "undefined")
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Question2", "Необходимо выбрать правильный ответ на 2-ой вопрос");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо выбрать правильный ответ на 2-ой вопрос");
		}
		else if(typeof($("input[name=OpenVacancy" + id + "Edit_Question3Answers]:checked").val()) == "undefined")
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_Question3", "Необходимо выбрать правильный ответ на 3-ий вопрос");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Необходимо выбрать правильный ответ на 3-ий вопрос");
		}
		else if(parseInt($("#OpenVacancy" + id + "Edit_MinSalary").val()) > parseInt($("#OpenVacancy" + id + "Edit_MaxSalary").val()))
		{
			system_calls.PopoverError("OpenVacancy" + id + "Edit_MinSalary", "ОШИБКА: Минимальнся з/п больше максимальной");
			system_calls.PopoverError("OpenVacancy" + id + "Edit_MaxSalary", "ОШИБКА: Минимальнся з/п больше максимальной");
			system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "ОШИБКА: Минимальнся з/п больше максимальной");
		}
		else
		{
			$("#EditOpenVacancy" + id + "SubmitButton").button("loading");

			$.post('/cgi-bin/company.cgi', 
				{
					action: "AJAX_updateOpenVacancy",
					id: id, 
					title: $("#OpenVacancy" + id + "Edit_Title").val(),
					geo_locality: $("#OpenVacancy" + id + "Edit_City").val(),
					minsalary: $("#OpenVacancy" + id + "Edit_MinSalary").val(),
					maxsalary: $("#OpenVacancy" + id + "Edit_MaxSalary").val(),
					month: $("#OpenVacancy" + id + "Edit_ClosureDate").val(),
					employmenttype: $("#OpenVacancy" + id + "Edit_EmploymentType").val(),
					question1: $("#OpenVacancy" + id + "Edit_Question1").val(),
					question2: $("#OpenVacancy" + id + "Edit_Question2").val(),
					question3: $("#OpenVacancy" + id + "Edit_Question3").val(),
					question1answers: $("input[name=OpenVacancy" + id + "Edit_Question1Answers]:checked").val(),
					question2answers: $("input[name=OpenVacancy" + id + "Edit_Question2Answers]:checked").val(),
					question3answers: $("input[name=OpenVacancy" + id + "Edit_Question3Answers]:checked").val(),
					question1Answer1: $("#OpenVacancy" + id + "Edit_Question1Answer1").val(),
					question1Answer2: $("#OpenVacancy" + id + "Edit_Question1Answer2").val(),
					question1Answer3: $("#OpenVacancy" + id + "Edit_Question1Answer3").val(),
					question2Answer1: $("#OpenVacancy" + id + "Edit_Question2Answer1").val(),
					question2Answer2: $("#OpenVacancy" + id + "Edit_Question2Answer2").val(),
					question2Answer3: $("#OpenVacancy" + id + "Edit_Question2Answer3").val(),
					question3Answer1: $("#OpenVacancy" + id + "Edit_Question3Answer1").val(),
					question3Answer2: $("#OpenVacancy" + id + "Edit_Question3Answer2").val(),
					question3Answer3: $("#OpenVacancy" + id + "Edit_Question3Answer3").val(),
					language1: $("#OpenVacancy" + id + "Edit_Language1").val(),
					language2: $("#OpenVacancy" + id + "Edit_Language2").val(),
					language3: $("#OpenVacancy" + id + "Edit_Language3").val(),
					skill1: $("#OpenVacancy" + id + "Edit_Skill1").val(),
					skill2: $("#OpenVacancy" + id + "Edit_Skill2").val(),
					skill3: $("#OpenVacancy" + id + "Edit_Skill3").val(),
					description: $("#OpenVacancy" + id + "Edit_Description").val(),
					publish: $("#OpenVacancy" + id + "Edit_Publish").val(),
					rand: Math.floor(Math.random() * 1000000000)
				})
				.done(function(postData) {
					try 
					{
						var data = JSON.parse(postData);

						if(data.result === "success")
						{
							if(data.open_vacancies.length)
							{
								$("#OpenVacancy" + id + "Edit").collapse("toggle");
								setTimeout(function() 
								{
									companyProfile.open_vacancies = data.open_vacancies;
									RenderCompanyOpenVacancies();
								}, 600); // --- timeout must be bigger than "reset button timer - 500"
							}
							else
							{
								system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Ошибка сервера. Необходимо сообщить в тех. поддержку.");
								console.debug("UpdateOpenVacancyClickHandler: ERROR: empty openvacancies array");
							}
						}
						else
						{
							system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", data.description);
							console.debug("UpdateOpenVacancyClickHandler: ERROR: " + data.description);
						}
					}
					catch (e) // --- catch JSON.parse exception
					{
						console.log("UpdateOpenVacancyClickHandler:exception handler: ERROR: " + e.name + " (most probably wrong JSON reponse)");
						system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Ошибка JSON-ответа севера. Необходимо сообщить в тех. поддержку.");
					}
					setTimeout(function() {$("#EditOpenVacancy" + id + "SubmitButton").button("reset"); }, 500); // --- wait for animation
				})
				.fail(function(data) {
					$("#EditOpenVacancy" + id + "SubmitButton").button("reset");
				});
		}
	};

	var AddNewOpenVacancyToggleCollapsible = function() {
		$("#AddOpenVacancy").collapse("toggle");
	};

	var	AddNewOpenVacancyReset = function() {
		$("#CreateOpenVacancyTitle").val("");
		$("#CreateOpenVacancyCity").val("");
		$("#CreateOpenVacancyMinSalary").val("");
		$("#CreateOpenVacancyMaxSalary").val("");
		$("#CreateOpenVacancyEmploymentType").val("fte");
		$("#CreateOpenVacancyQuestion1").val("");
		$("input[name=CreateOpenVacancyQuestion1Answers]").prop("checked", false);
		$("#CreateOpenVacancyQuestion1Answer1").val("");
		$("#CreateOpenVacancyQuestion1Answer2").val("");
		$("#CreateOpenVacancyQuestion1Answer3").val("");
		$("#CreateOpenVacancyQuestion2").val("");
		$("input[name=CreateOpenVacancyQuestion2Answers]").prop("checked", false);
		$("#CreateOpenVacancyQuestion2Answer1").val("");
		$("#CreateOpenVacancyQuestion2Answer2").val("");
		$("#CreateOpenVacancyQuestion2Answer3").val("");
		$("#CreateOpenVacancyQuestion3").val("");
		$("input[name=CreateOpenVacancyQuestion3Answers]").prop("checked", false);
		$("#CreateOpenVacancyQuestion3Answer1").val("");
		$("#CreateOpenVacancyQuestion3Answer2").val("");
		$("#CreateOpenVacancyQuestion3Answer3").val("");
		$("#CreateOpenVacancyLanguage1").val("");
		$("#CreateOpenVacancyLanguage2").val("");
		$("#CreateOpenVacancyLanguage3").val("");
		$("#CreateOpenVacancySkill1").val("");
		$("#CreateOpenVacancySkill2").val("");
		$("#CreateOpenVacancySkill3").val("");
		$("#CreateOpenVacancyDescription").val("");
		$("#CreateOpenVacancyPublish").val("week");

		// --- Select current month in new open vacancy
		{
			var		currDate = new Date();
			var		currMonth = currDate.getMonth() + 1;

			$("#CreateOpenVacancyClosureDate option:nth-child(" + currMonth + ")").attr("selected", "");
		}
	}

	return {
		Init: Init,
		companyProfile: companyProfile
	};

})();
