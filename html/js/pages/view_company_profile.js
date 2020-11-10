var		view_company_profile = view_company_profile || {};

view_company_profile = (function()
{
	'use strict';

	var		companyProfile;
	var		myVacancies = [];
	var		myUserProfile;

	var		myUserID;
	var		companyID;

	var	Init = function()
	{
		myUserID = $("#myUserID").data("myuserid");
		companyID = $("#companyName").data("companyid");

		$("#AreYouSure #Remove").on("click", AreYouSureRemoveHandler);

		FillinCompanyProfile();
	}

	var FillinCompanyProfile = function()
	{
		$.getJSON('/cgi-bin/company.cgi?action=JSON_getCompanyProfileAndMyVacancies', {id: companyID})
			.done(function(data) {
				if(data.result === "success")
				{
					companyProfile = data.companies[0] || {};
					myVacancies = data.myvacancies || [];
					myUserProfile = data.users[0] || {};

					DrawCompanyLogo(companyProfile.logo_folder, companyProfile.logo_filename, companyProfile.name);

					RenderCommonInfo();
					RenderOpenVacancies();
					RenderFollowButton();
					RenderPostButton();

					if(system_calls.GetParamFromURL("scrollto").length) system_calls.ScrollWindowToElementID("#" + system_calls.GetParamFromURL("scrollto"));
				}
				else
				{
					console.debug("FillinCompanyProfile: ERROR: " + data.description);
				}
			});

	}

	var	DrawCompanyLogo = function (companyImageFolder, companyImageFilename, companyName)
	{
		var		canvasCtx; 

		$("#canvasForAvatar").attr("width", "320")
							.attr("height", "320");
		canvasCtx = $("#canvasForAvatar")[0].getContext("2d");

		if(companyImageFilename.length)
			DrawCompanyAvatar(canvasCtx, "/images/companies/" + companyImageFolder + "/" + companyImageFilename, companyName, "");
		else
			DrawCompanyAvatar(canvasCtx, "", companyName, "");

	}

	var	RenderCommonInfo = function()
	{
		var		foundersArr = [];
		var		ownersArr = [];
		var		industriesArr = [];

		{
			var		tempStr;

			if(companyProfile.webSite.length)
				tempStr = "<a href=\"" + companyProfile.webSite + "\" target=\"blank\">" + companyProfile.type + " " + companyProfile.name + "</a>";
			else
				tempStr = companyProfile.type + " " + companyProfile.name;

			$("#companyName").append(tempStr);
		}

		$("#companyFoundationDate").append(companyProfile.foundationDate);
		$("#numberOfEmployee").append(companyProfile.numberOfEmployee);
		$("#companyDescription").append(companyProfile.description);

		companyProfile.founders.forEach(function(item){
			var		temp = "";

			if(item.userid.length && (item.userid != "0"))
				temp = "<a href=\"/userprofile/" + item.userid + "\">" + item.name + "</a>";
			else
				temp = item.name;

			temp = " " + temp;
			foundersArr.push(temp);
		});
		$("#companyFounders").append(foundersArr.join());

		companyProfile.owners.forEach(function(item){
			var		temp = "";

			if(item.userid.length && (item.userid != "0"))
				temp = "<a href=\"/userprofile/" + item.userid + "\">" + item.name + "</a>";
			else
				temp = item.name;
			
			temp = " " + temp;
			ownersArr.push(temp);
		});
		$("#companyOwners").append(ownersArr.join());

		companyProfile.industries.forEach(function(item){
			var		temp = "";

			temp = item.name;

			temp = " " + temp;
			industriesArr.push(temp);
		});
		$("#companyIndustries").append(industriesArr.join());


	}

	var	amIAppliedToVacancy = function(vacancyID)
	{
		var		result = false;

		myVacancies.forEach(function(item)
			{
				if(item.vacancy_id == vacancyID) result = true;
			});

		return result;
	}

	var	amISuspendedOnVacancy = function(vacancyID)
	{
		var		result = false;

		myVacancies.forEach(function(item)
			{
				if((item.vacancy_id == vacancyID) && (item.status == "applied")) result = true;
			});

		return result;
	}

	var	amIRejectedFromVacancy = function(vacancyID)
	{
		var		result = false;

		myVacancies.forEach(function(item)
			{
				if((item.vacancy_id == vacancyID) && (item.status == "rejected")) result = true;
			});

		return result;
	}

	var amICapableWithLanguage = function(languageTitle)
	{
		var		result = false;

		if((typeof(myUserProfile) != "undefined") && (typeof(myUserProfile.languages) != "undefined"))
		{
			myUserProfile.languages.forEach(function(item)
				{
					if(item.languageTitle == languageTitle) result = true;
				});
		}

		return result;
	}

	var amICapableWithSkill = function(skillTitle)
	{
		var		result = false;

		if((typeof(myUserProfile) != "undefined") && (typeof(myUserProfile.skills) != "undefined"))
		{
			myUserProfile.skills.forEach(function(item)
				{
					if(item.title == skillTitle) result = true;
				});
		}

		return result;
	}

	var	amISubsribedToCompany = function(companyID)
	{
		var		result = false;

		if((typeof(myUserProfile) != "undefined") && (typeof(myUserProfile.subscriptions) != "undefined"))
		{
			myUserProfile.subscriptions.forEach(function(item)
			{
				if((item.entity_type == "company") && (item.entity_id == companyID))
					result = true;
			});
		}

		return result;
	}

	var	RenderPostButton = function()
	{
		if(companyProfile.isMine == "1")
			$("#NewsFeedNewMessageContainer").removeClass("hidden");
	}

	var	RenderFollowButton = function()
	{
		var		followButton = $("<button>").addClass("btn form-control")
											.attr("id", "SubscriptionButton")
											.data("script", "company.cgi")
											.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span> Ждите ...")
											.data("id", companyID)
											.on("click", CompanySubscriptionClickHandler);

		var		isSubscribed = amISubsribedToCompany(companyID) ? true : false;

		if(isSubscribed)
		{
			followButton.append("Отписаться")
						.addClass("btn-default")
						.data("action", "AJAX_UnsubscribeFromCompany");
		}
		else
		{
			followButton.append("Подписаться")
						.addClass("btn-primary")
						.data("action", "AJAX_SubscribeOnCompany");
		}

		$("#companyFollowButton").empty().append(followButton);
	}

	var	RenderOpenVacancies = function()
	{
		var		result = $();

		companyProfile.open_vacancies.sort(function(a, b)
			{
				var		result = 0;

				if(amIAppliedToVacancy(a.id) && amIAppliedToVacancy(b.id))
				{
					if(amISuspendedOnVacancy(a.id) && amISuspendedOnVacancy(b.id))
					{
						if(a.company_position_title <= b.company_position_title)
							result = -2;
						else
							result = 1;
					}
					if(!amISuspendedOnVacancy(a.id) && !amISuspendedOnVacancy(b.id))
					{
						if(a.company_position_title <= b.company_position_title)
							result = -2;
						else
							result = 1;
					}
					if(amISuspendedOnVacancy(a.id) && !amISuspendedOnVacancy(b.id)) result = -2;
					if(amISuspendedOnVacancy(b.id) && !amISuspendedOnVacancy(a.id)) result = 1;
				}
				else if(amIAppliedToVacancy(a.id) && !amIAppliedToVacancy(b.id))
				{
					result = -2;
				}
				else if(!amIAppliedToVacancy(a.id) && amIAppliedToVacancy(b.id))
				{
					result = 1;
				}
				else
				{
					if(a.company_position_title <= b.company_position_title)
						result = -2;
					else
						result = 1;
				}

				return result;
			});

		companyProfile.open_vacancies.forEach(function(item, i, arr)
		{
			var		publishFinishTS = new Date(item.publish_finish + "T00:00:00");
			var		currentTS = new Date();

			if((currentTS <= publishFinishTS))
			{
				
				var		divRow = $("<div>").addClass("row")
											.attr("id", "openVacancy" + item.id);
				var		divRowControl_xs = $("<div>").addClass("row");
				var		divSeparatop = $("<div>").addClass("col-xs-12").append($("<p>"));
				var		divStatus = $("<div>").addClass("col-xs-2 col-md-1");
				var		divTitle = $("<div>").addClass("col-xs-10 col-md-8");
				var		divControl1_md = $("<div>").addClass("hidden-xs hidden-sm col-md-1 ");
				var		divControl2_md = $("<div>").addClass("hidden-xs hidden-sm col-md-1");
				var		divControl3_md = $("<div>").addClass("hidden-xs hidden-sm col-md-1 ");
				var		divControl1_xs = $("<div>").addClass("hidden-md hidden-lg col-xs-4 ");
				var		divControl2_xs = $("<div>").addClass("hidden-md hidden-lg col-xs-12 form-group");
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
														.on("click", function() { ApplyToVacancyClickHandler($(this).data("id")); });
				var		buttonControl2_md = $("<button>").addClass("btn btn-primary form-control")
														.attr("data-group", "OpenVacancy" + item.id + "CandidatesButtons")
														.data("id", item.id)
														.append("<i class=\"fa fa-file-text-o\"></i>")
														.attr("data-toggle", "tooltip")
														.attr("data-placement", "top")
														.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>")
														.attr("title", "Податься на вакансию")
														.on("click", function() { ApplyToVacancyClickHandler($(this).data("id")); });
				var		buttonControl3_md = $("<button>").addClass("btn btn-default form-control")
														.data("id", item.id)
														.attr("data-toggle", "tooltip")
														.attr("data-placement", "top")
														.attr("title", "Удалить")
														.data("script", "company.cgi")
														.data("action", "AJAX_removeOpenVacancy")
														// .on("click", removeGeneralPreparation)
														.append("<i class=\"fa fa-trash-o fa-lg\"></i>");
				var		buttonControl1_xs = $("<button>").addClass("btn btn-primary form-control")
														.attr("data-group", "OpenVacancy" + item.id + "CandidatesButtons")
														.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>")
														.data("id", item.id)
														.append("<i class=\"fa fa-user\"></i> (" + item.number_of_applied_candidates + ")")
														.on("click", function() { ApplyToVacancyClickHandler($(this).data("id")); });
				var		buttonControl2_xs = $("<button>").addClass("btn btn-primary form-control")
														.attr("data-group", "OpenVacancy" + item.id + "CandidatesButtons")
														.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>")
														.data("id", item.id)
														.append("<i class=\"fa fa-file-text-o\"></i>")
														.on("click", function() { ApplyToVacancyClickHandler($(this).data("id")); });
				var		buttonControl3_xs = $("<button>").addClass("btn btn-default form-control")
														.data("id", item.id)
														.data("script", "company.cgi")
														.data("action", "AJAX_removeOpenVacancy")
														// .on("click", removeGeneralPreparation)
														.append("<i class=\"fa fa-trash-o fa-lg\"></i>");
	
				var		publishFinishTS = new Date(item.publish_finish + "T00:00:00");
				var		currentTS = new Date();
	
				if(amIAppliedToVacancy(item.id))
				{
					if(amISuspendedOnVacancy(item.id))
					{
						spanStatus = $("<span>").addClass("fa-stack")
												.append($("<i>").addClass("fa fa-circle-o fa-stack-2x color_orange"))
												.append($("<i>").addClass("fa fa-exclamation fa-stack-1x color_orange"))
												.attr("data-toggle", "tooltip")
												.attr("data-placement", "top")
												.attr("title", "На рассмотрении");
					}
					else
					{
						spanStatus = $("<span>").addClass("fa-stack")
												.append($("<i>").addClass("fa fa-circle-o fa-stack-2x color_red"))
												.append($("<i>").addClass("fa fa-times fa-stack-1x color_red"))
												.attr("data-toggle", "tooltip")
												.attr("data-placement", "top")
												.attr("title", "Отказано");
					}
				}
	
				divStatus.append(spanStatus);
				divTitle.append(item.company_position_title + " в " + item.geo_locality_title + (item.geo_region_title.length ? " (" + item.geo_region_title + ")" : ""));
				// divControl1_md.append(buttonControl1_md);
				divControl2_md.append(buttonControl2_md);
				// divControl3_md.append(buttonControl3_md);
				// divControl1_xs.append(buttonControl1_xs);
				divControl2_xs.append(buttonControl2_xs);
				// divControl3_xs.append(buttonControl3_xs);
	
				divRow	.append(divSeparatop)
						.append(divStatus)
						.append(divTitle)
						.append(divControl1_md)
						.append(divControl2_md)
						.append(divControl3_md);
				divRowControl_xs.append(divControl2_xs);
	
				result = result.add(divRow);
				result = result.add(divRowControl_xs);
				result = result.add(InitAppliedCandidatesToVacancy(item));
			}
		});

		$("#companyVacancies").empty().append(result);
		$("div#companyVacancies [data-toggle=\"tooltip\"]").tooltip({ animation: "animated bounceIn"});

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

	var ApplyToVacancyClickHandler = function(openVacancyID)
	{
		$("button[data-group='OpenVacancy" + openVacancyID + "CandidatesButtons']").button("loading");


		$.getJSON('/cgi-bin/company.cgi?action=AJAX_amIAppliedToVacancy', {id: openVacancyID})
			.done(function(data) {
				if(data.result === "success")
				{
					var		counterAppliedUsers = data.candidates.length;
					var		result = "";
					var		vacancy = {};

					companyProfile.open_vacancies.forEach(function(item)
					{
						if(item.id == openVacancyID)
							vacancy = item;
					});
					result = RenderSingleVacancyCollapsible(vacancy, (data.candidates.length ? data.candidates[0] : {}), data.user[0]);

					$("#OpenVacancy" + openVacancyID + "Candidates").empty().append(result);
					$("#OpenVacancy" + openVacancyID + "CandidatesCollapsible").collapse("toggle");
				}
				else
				{
					console.debug("ApplyToVacancyClickHandler: ERROR: " + data.description);
				}

				setTimeout(function() {$("button[data-group='OpenVacancy" + openVacancyID + "CandidatesButtons']").button("reset"); }, 500); // --- wait for animation
			})
			.fail(function() {
				console.debug("ApplyToVacancyClickHandler: ERROR: parse JSON response from server");
				setTimeout(function() {$("button[data-group='OpenVacancy" + openVacancyID + "CandidatesButtons']").button("reset"); }, 500); // --- wait for animation
			});
	}

	// --- Rendering open vacancy collapsible for applying
	var RenderSingleVacancyCollapsible = function(openVacancy, appliedAnswers, userProfile)
	{
		var		id = openVacancy.id;
		var		divRowCollapsible		= $("<div>")	.addClass(" form-group")
														.attr("id", "OpenVacancy" + id + "Edit");
	
		var		divRowTitle				= $("<div>")	.addClass("row");
		var		divColTitle				= $("<div>")	.addClass("col-xs-12 col-md-5 form-group")
														.append(openVacancy.company_position_title + " в " + openVacancy.geo_locality_title + (openVacancy.geo_region_title.length ? " (" + openVacancy.geo_region_title + ")" : ""));
		var		divColInfo				= $("<div>")	.addClass("col-xs-12 col-md-5 form-group");

		var		divRowEmploymenttype	= $("<div>")	.addClass("row");
		var		divColClosureDate		= $("<div>")	.addClass("col-xs-6 col-md-5 form-group");
		var		divColEmploymentType	= $("<div>")	.addClass("col-xs-6 col-md-5 form-group");

		var		divRowInfoText1			= $("<div>")	.addClass("row");
		var		divColInfoText1			= $("<div>")	.addClass("col-xs-12 form-group")
														.append("<p></p>Требования:");

		var		divRowInfoText2			= $("<div>")	.addClass("row");
		var		divColInfoText2			= $("<div>")	.addClass("col-xs-12 form-group")
														.append("<p></p>Квалификационный тест:");


		var		divRowQuestion1			= $("<div>")	.addClass("row");
		var		divColQuestion1			= $("<div>")	.addClass("col-xs-12 col-md-10 form-group")
														.append(openVacancy.question1);
		var		divRowQuestion2			= $("<div>")	.addClass("row");
		var		divColQuestion2			= $("<div>")	.addClass("col-xs-12 col-md-10 form-group")
														.append(openVacancy.question2);
		var		divRowQuestion3			= $("<div>")	.addClass("row");
		var		divColQuestion3			= $("<div>")	.addClass("col-xs-12 col-md-10 form-group")
														.append(openVacancy.question3);

		var		divRowAnswer11			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer11	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer11	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question1Answers")
														.attr("value", "1")
														.prop("checked", ((typeof(appliedAnswers.answer1) != "undefined") && (appliedAnswers.answer1 == "1") ? "true" : ""));
		var		divColAnswer11			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group")
														.append(openVacancy.answer11);

		var		divRowAnswer12			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer12	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer12	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question1Answers")
														.attr("value", "2")
														.prop("checked", ((typeof(appliedAnswers.answer1) != "undefined") && (appliedAnswers.answer1 == "2") ? "true" : ""));
		var		divColAnswer12			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group")
														.append(openVacancy.answer12);

		var		divRowAnswer13			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer13	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer13	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question1Answers")
														.attr("value", "3")
														.prop("checked", ((typeof(appliedAnswers.answer1) != "undefined") && (appliedAnswers.answer1 == "3") ? "true" : ""));
		var		divColAnswer13			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group")
														.append(openVacancy.answer13);

		var		divRowAnswer21			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer21	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer21	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question2Answers")
														.attr("value", "1")
														.prop("checked", ((typeof(appliedAnswers.answer2) != "undefined") && (appliedAnswers.answer2 == "1") ? "true" : ""));
		var		divColAnswer21			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group")
														.append(openVacancy.answer21);

		var		divRowAnswer22			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer22	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer22	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question2Answers")
														.attr("value", "2")
														.prop("checked", ((typeof(appliedAnswers.answer2) != "undefined") && (appliedAnswers.answer2 == "2") ? "true" : ""));
		var		divColAnswer22			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group")
														.append(openVacancy.answer22);

		var		divRowAnswer23			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer23	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer23	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question2Answers")
														.attr("value", "3")
														.prop("checked", ((typeof(appliedAnswers.answer2) != "undefined") && (appliedAnswers.answer2 == "3") ? "true" : ""));
		var		divColAnswer23			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group")
														.append(openVacancy.answer23);

		var		divRowAnswer31			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer31	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer31	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question3Answers")
														.attr("value", "1")
														.prop("checked", ((typeof(appliedAnswers.answer3) != "undefined") && (appliedAnswers.answer3 == "1") ? "true" : ""));
		var		divColAnswer31			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group")
														.append(openVacancy.answer31);

		var		divRowAnswer32			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer32	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer32	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question3Answers")
														.attr("value", "2")
														.prop("checked", ((typeof(appliedAnswers.answer3) != "undefined") && (appliedAnswers.answer3 == "2") ? "true" : ""));
		var		divColAnswer32			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group")
														.append(openVacancy.answer32);

		var		divRowAnswer33			= $("<div>")	.addClass("row");
		var		divColCorrectAnswer33	= $("<div>")	.addClass("col-xs-2 col-md-1 form-group");
		var		inputCorrectAnswer33	= $("<input>")	.addClass("correct_answer")
														.attr("type", "radio")
														.attr("name", "OpenVacancy" + id + "Edit_Question3Answers")
														.attr("value", "3")
														.prop("checked", ((typeof(appliedAnswers.answer3) != "undefined") && (appliedAnswers.answer3 == "3") ? "true" : ""));
		var		divColAnswer33			= $("<div>")	.addClass("col-xs-10 col-md-9 form-group")
														.append(openVacancy.answer33);


		var		divRowLanguage			= $("<div>")	.addClass("row");
		var		divColLanguage1			= $("<div>")	.addClass("col-xs-12 col-md-4 form-group");
		var		divColLanguage2			= $("<div>")	.addClass("col-xs-12 col-md-4 form-group");
		var		divColLanguage3			= $("<div>")	.addClass("col-xs-12 col-md-4 form-group");
		var		inputLanguage1			= $("<input>")	
														.attr("type", "checkbox")
														.attr("id", "OpenVacancy" + id + "Edit_Language1")
														.attr("placeholder", "Иностранный язык 1 (не обязательно)");
														// .prop("checked", ((typeof(appliedAnswers.language1) != "undefined") && (appliedAnswers.language1 == "Y") ? "checked" : ""));
		var		inputLanguage2			= $("<input>")	
														.attr("type", "checkbox")
														.attr("id", "OpenVacancy" + id + "Edit_Language2")
														.attr("placeholder", "Иностранный язык 2 (не обязательно)");
														// .prop("checked", ((typeof(appliedAnswers.language2) != "undefined") && (appliedAnswers.language2 == "Y") ? "checked" : ""));
		var		inputLanguage3			= $("<input>")	
														.attr("type", "checkbox")
														.attr("id", "OpenVacancy" + id + "Edit_Language3")
														.attr("placeholder", "Иностранный язык 3 (не обязательно)");
														// .prop("checked", ((typeof(appliedAnswers.language3) != "undefined") && (appliedAnswers.language3 == "Y") ? "checked" : ""));

		var		divRowSkill			= $("<div>")	.addClass("row");
		var		divColSkill1		= $("<div>")	.addClass("col-xs-12 col-md-4 form-group");
		var		divColSkill2		= $("<div>")	.addClass("col-xs-12 col-md-4 form-group");
		var		divColSkill3		= $("<div>")	.addClass("col-xs-12 col-md-4 form-group");
		var		inputSkill1			= $("<input>")	
													.attr("type", "checkbox")
													.attr("id", "OpenVacancy" + id + "Edit_Skill1")
													.attr("placeholder", "Навык 1 (не обязательно)");
													// .prop("checked", ((typeof(appliedAnswers.skill1) != "undefined") && (appliedAnswers.skill1 == "Y") ? "checked" : ""));
		var		inputSkill2			= $("<input>")	
													.attr("type", "checkbox")
													.attr("id", "OpenVacancy" + id + "Edit_Skill2")
													.attr("placeholder", "Навык 2 (не обязательно)");
													// .prop("checked", ((typeof(appliedAnswers.skill2) != "undefined") && (appliedAnswers.skill2 == "Y") ? "checked" : ""));
		var		inputSkill3			= $("<input>")	
													.attr("type", "checkbox")
													.attr("id", "OpenVacancy" + id + "Edit_Skill3")
													.attr("placeholder", "Навык 3 (не обязательно)");
													// .prop("checked", ((typeof(appliedAnswers.skill3) != "undefined") && (appliedAnswers.skill3 == "Y") ? "checked" : ""));

		var		divRowDescription	= $("<div>")	.addClass("row");
		var		divColDescription	= $("<div>")	.addClass("col-xs-12 col-md-10 form-group")
													.append((openVacancy.description.length ? "Доп. информация: " : "") + openVacancy.description);

		var		divRowPersonalInfo	= $("<div>")	.addClass("row");
		var		divColPersonalInfo	= $("<div>")	.addClass("col-xs-12 col-md-10 form-group");
		var		inputPersonalInfo	= $("<textarea>").addClass("form-control")
													.attr("id", "OpenVacancy" + id + "Edit_PersonalInfo")
													.attr("placeholder", "Доп. информация")
													.attr("rows", "4")
													.attr("maxlength", "16384")
													.val(system_calls.ConvertHTMLToText(typeof(appliedAnswers.description) != "undefined" ? appliedAnswers.description : ""));

		var		divRowControl		= $("<div>")	.addClass("row");
		var		divColControlSubmit	= $("<div>")	.addClass("col-xs-6 col-md-5 form-group");
		var		divColControlCancel	= $("<div>")	.addClass("col-xs-6 col-md-5 form-group");
		var		buttonSubmit		= $("<button>")	.addClass("btn btn-primary form-control")
													.attr("id", "EditOpenVacancy" + id + "SubmitButton")
													.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span> Подождите...")
													.data("id", id)
													.on("click", function() { ApplyToOpenVacancyClickHandler($(this).data("id")); })
													.append("Податься");
		var		buttonCancel		= $("<button>")	.addClass("btn btn-default form-control")
													.on("click", function() { $("#OpenVacancy" + id + "CandidatesCollapsible").collapse("toggle"); })
													.append("Закрыть");

		// --- info field
		{
			var		temp = "";
			var		work_format_arr = 	{ 
											"fte": "Полный рабочий день",
											 "pte": "Частичная занятость",
											 "remote": "Удаленная работа",
											 "entrepreneur": "Контрактный сотрудник"
										};
			var		start_month_arr = 
										{
											"1":"Выход на работу в январе",
											"2":"Выход на работу в феврале",
											"3":"Выход на работу в марте",
											"4":"Выход на работу в апреле",
											"5":"Выход на работу в мае",
											"6":"Выход на работу в июне",
											"7":"Выход на работу в июле",
											"8":"Выход на работу в августе",
											"9":"Выход на работу в сентябре",
											"10":"Выход на работу в октябре",
											"11":"Выход на работу в ноябре",
											"12":"Выход на работу в декабре"
										};

			if(openVacancy.salary_min != "0") temp += " от " + openVacancy.salary_min;
			if(openVacancy.salary_max != "0") temp += " до " + openVacancy.salary_max;
			if(temp.length) temp = "з/п " + temp;

			temp = work_format_arr[openVacancy.work_format] + ", " + temp + "<br>" + start_month_arr[openVacancy.start_month];


			divColInfo.append(temp);
		}

		if((typeof(appliedAnswers.language1) != "undefined"))
		{
			if(appliedAnswers.language1 == "Y")
				inputLanguage1.prop("checked", "checked");
		}
		else if(amICapableWithLanguage(openVacancy.language1_title))
			inputLanguage1.prop("checked", "checked");

		if(typeof(appliedAnswers.language2) != "undefined") 
		{
			if(appliedAnswers.language2 == "Y")
				inputLanguage2.prop("checked", "checked");
		}
		else if(amICapableWithLanguage(openVacancy.language2_title))
			inputLanguage2.prop("checked", "checked");

		if(typeof(appliedAnswers.language3) != "undefined")
		{
			if(appliedAnswers.language3 == "Y")
				inputLanguage3.prop("checked", "checked");
		}
		else if(amICapableWithLanguage(openVacancy.language3_title))
			inputLanguage3.prop("checked", "checked");

		if((typeof(appliedAnswers.skill1) != "undefined"))
		{
			if(appliedAnswers.skill1 == "Y")
				inputSkill1.prop("checked", "checked");
		}
		else if(amICapableWithSkill(openVacancy.skill1_title))
			inputSkill1.prop("checked", "checked");

		if(typeof(appliedAnswers.skill2) != "undefined") 
		{
			if(appliedAnswers.skill2 == "Y")
				inputSkill2.prop("checked", "checked");
		}
		else if(amICapableWithSkill(openVacancy.skill2_title))
			inputSkill2.prop("checked", "checked");

		if(typeof(appliedAnswers.skill3) != "undefined")
		{
			if(appliedAnswers.skill3 == "Y")
				inputSkill3.prop("checked", "checked");
		}
		else if(amICapableWithSkill(openVacancy.skill3_title))
			inputSkill3.prop("checked", "checked");

		if(amIAppliedToVacancy(id) && amISuspendedOnVacancy(id)) buttonSubmit.empty().append("Обновить");
		if(amIAppliedToVacancy(id) && amIRejectedFromVacancy(id)) buttonSubmit.empty().append("Отказано").attr("disabled", "");

		divRowTitle				.append(divColTitle)
								.append(divColInfo);
		divRowInfoText1			.append(divColInfoText1);
		divRowInfoText2			.append(divColInfoText2);
		divRowQuestion1			.append(divColQuestion1);
		divRowAnswer11			.append(divColCorrectAnswer11.append(inputCorrectAnswer11))
								.append(divColAnswer11);
		divRowAnswer12			.append(divColCorrectAnswer12.append(inputCorrectAnswer12))
								.append(divColAnswer12);
		divRowAnswer13			.append(divColCorrectAnswer13.append(inputCorrectAnswer13))
								.append(divColAnswer13);
		divRowQuestion2			.append(divColQuestion2);
		divRowAnswer21			.append(divColCorrectAnswer21.append(inputCorrectAnswer21))
								.append(divColAnswer21);
		divRowAnswer22			.append(divColCorrectAnswer22.append(inputCorrectAnswer22))
								.append(divColAnswer22);
		divRowAnswer23			.append(divColCorrectAnswer23.append(inputCorrectAnswer23))
								.append(divColAnswer23);
		divRowQuestion3			.append(divColQuestion3);
		divRowAnswer31			.append(divColCorrectAnswer31.append(inputCorrectAnswer31))
								.append(divColAnswer31);
		divRowAnswer32			.append(divColCorrectAnswer32.append(inputCorrectAnswer32))
								.append(divColAnswer32);
		divRowAnswer33			.append(divColCorrectAnswer33.append(inputCorrectAnswer33))
								.append(divColAnswer33);

		if(openVacancy.language1_title.length)								
			divRowLanguage.append(divColLanguage1.append(inputLanguage1).append(" " + openVacancy.language1_title))
		if(openVacancy.language2_title.length)		
			divRowLanguage.append(divColLanguage2.append(inputLanguage2).append(" " + openVacancy.language2_title))
		if(openVacancy.language3_title.length)		
			divRowLanguage.append(divColLanguage3.append(inputLanguage3).append(" " + openVacancy.language3_title));

		if(openVacancy.skill1_title.length)
			divRowSkill.append(divColSkill1.append(inputSkill1).append(" " + openVacancy.skill1_title));
		if(openVacancy.skill2_title.length)
			divRowSkill.append(divColSkill2.append(inputSkill2).append(" " + openVacancy.skill2_title));
		if(openVacancy.skill3_title.length)
			divRowSkill.append(divColSkill3.append(inputSkill3).append(" " + openVacancy.skill3_title));
		divRowControl			.append(divColControlSubmit.append(buttonSubmit))
								.append(divColControlCancel.append(buttonCancel));
		divRowDescription		.append(divColDescription);
		divRowPersonalInfo		.append(divColPersonalInfo.append(inputPersonalInfo));

		divRowCollapsible		.append(divRowTitle)
								.append(divRowDescription)
								.append(divRowInfoText1)
								.append(divRowLanguage)
								.append(divRowSkill)
								.append(divRowInfoText2)
								.append(divRowQuestion1)
								.append(divRowAnswer11)
								.append(divRowAnswer12)
								.append(divRowAnswer13)
								.append(divRowQuestion2)
								.append(divRowAnswer21)
								.append(divRowAnswer22)
								.append(divRowAnswer23)
								.append(divRowQuestion3)
								.append(divRowAnswer31)
								.append(divRowAnswer32)
								.append(divRowAnswer33)
								.append(divRowPersonalInfo)
								.append(divRowControl);


		return divRowCollapsible;
	}

	var	ApplyToOpenVacancyClickHandler = function(id)
	{
		if(typeof($("input[name=OpenVacancy" + id + "Edit_Question1Answers]:checked").val()) == "undefined")
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
		else
		{
			$("#EditOpenVacancy" + id + "SubmitButton").button("loading");

			$.post('/cgi-bin/company.cgi', 
				{
					action: "AJAX_applyToVacancy",
					id: id,
					question1answers: $("input[name=OpenVacancy" + id + "Edit_Question1Answers]:checked").val(),
					question2answers: $("input[name=OpenVacancy" + id + "Edit_Question2Answers]:checked").val(),
					question3answers: $("input[name=OpenVacancy" + id + "Edit_Question3Answers]:checked").val(),
					language1: ($("#OpenVacancy" + id + "Edit_Language1").length && $("#OpenVacancy" + id + "Edit_Language1").prop("checked") ? "Y" : "N"),
					language2: ($("#OpenVacancy" + id + "Edit_Language2").length && $("#OpenVacancy" + id + "Edit_Language2").prop("checked") ? "Y" : "N"),
					language3: ($("#OpenVacancy" + id + "Edit_Language3").length && $("#OpenVacancy" + id + "Edit_Language3").prop("checked") ? "Y" : "N"),
					skill1: ($("#OpenVacancy" + id + "Edit_Skill1").length && $("#OpenVacancy" + id + "Edit_Skill1").prop("checked") ? "Y" : "N"),
					skill2: ($("#OpenVacancy" + id + "Edit_Skill2").length && $("#OpenVacancy" + id + "Edit_Skill2").prop("checked") ? "Y" : "N"),
					skill3: ($("#OpenVacancy" + id + "Edit_Skill3").length && $("#OpenVacancy" + id + "Edit_Skill3").prop("checked") ? "Y" : "N"),
					description: $("#OpenVacancy" + id + "Edit_PersonalInfo").val(),
					rand: Math.floor(Math.random() * 1000000000)
				})
				.done(function(postData) {
					try 
					{
						var data = JSON.parse(postData);

						if(data.result === "success")
						{
							if(data.myvacancies.length)
							{
								$("#OpenVacancy" + id + "CandidatesCollapsible").collapse("toggle");
								setTimeout(function() 
								{
									myVacancies = data.myvacancies;
									RenderOpenVacancies();
								}, 600); // --- timeout must be bigger than "reset button timer - 500"
							}
							else
							{
								system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Ошибка сервера. Необходимо сообщить в тех. поддержку.");
								console.debug("ApplyToOpenVacancyClickHandler: ERROR: empty openvacancies array");
							}
						}
						else
						{
							system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", data.description);
							console.debug("ApplyToOpenVacancyClickHandler: ERROR: " + data.description);
						}
					}
					catch (e) // --- catch JSON.parse exception
					{
						console.log("ApplyToOpenVacancyClickHandler:exception handler: ERROR: " + e.name + " (most probably wrong JSON reponse)");
						system_calls.PopoverError("EditOpenVacancy" + id + "SubmitButton", "Ошибка JSON-ответа севера. Необходимо сообщить в тех. поддержку.");
					}
					setTimeout(function() {$("#EditOpenVacancy" + id + "SubmitButton").button("reset"); }, 500); // --- wait for animation
				})
				.fail(function(data) {
					setTimeout(function() {$("#EditOpenVacancy" + id + "SubmitButton").button("reset"); }, 500); // --- wait for animation
				});
		}
	}

	var	CompanySubscriptionClickHandler = function(e)
	{
		var		currTag = $(this);
		var		script = typeof(currTag.data("script")) == "string" ? currTag.data("script") : "company.cgi";
		var		action = typeof(currTag.data("action")) == "string" ? currTag.data("action") : "";

		if(action.length)
		{

			currTag.button("loading");

			$.getJSON('/cgi-bin/' + script + '?action=' + action, {id: currTag.data("id")})
				.done(function(data) 
				{
					if(data.result === "success")
					{
						myUserProfile.subscriptions = data.subscriptions;
						RenderFollowButton();
					}
					else
					{
						system_calls.PopoverError("SubscriptionButton", data.description);
						console.debug("CompanySubscriptionClickHandler: ERROR: " + data.description);
					}

					setTimeout(function() {currTag.button("reset"); }, 500); // --- wait for animation
				})
				.fail(function() 
				{
					console.debug("CompanySubscriptionClickHandler: ERROR: parse JSON response from server");
					system_calls.PopoverError("SubscriptionButton", "Ошибка ответа сервера. Попробуйте через 24 часа.");
					setTimeout(function() {currTag.button("reset"); }, 500); // --- wait for animation
				});
		}
		else
		{
			console.debug("CompanySubscriptionClickHandler: ERROR: action doesn't defined");
		}

	}

	// --- aditional modals
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

	}

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
		// --- To improve User Experience (react on user actions immediately) 
		// ---     I'm updating GUI immediately after click, not waiting server response
		if(affectedAction == "AJAX_removeRecommendationEntry")
		{
			companyProfile.recommendation.forEach(function(item, i, arr) {
				if(item.recommendationID == affectedID)
				{
					companyProfile.recommendation.splice(i, 1);
				}
			});
			RenderRecommendationPath();
		}
	};

	// --- Editable function
	var editableFuncHighlightBgcolor = function () {
		$(this).addClass("editable_highlighted_class", 400);
	};

	var editableFuncNormalizeBgcolor = function () {
		$(this).removeClass("editable_highlighted_class", 200, "easeInOutCirc");

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
		$(tag).removeClass('editable_highlighted_class');
		$(tag).after(tagButtonAccept);
		$(tag).after(tagButtonReject);
		$(tag).on('keyup', keyupEventHandler);
		$(tag).select();
	};



	return {
			Init: Init
		};
})() // --- view_company_profile object

