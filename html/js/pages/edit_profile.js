
var	edit_profile = edit_profile || {};

edit_profile = (function()
{
"use strict";

var 	JSON_jobTitleID = [];
var 	JSON_certificationVendors = [];
var 	JSON_certificationTracks = [];
var 	JSON_CompanyNameID = [];
var		JSON_AvatarList;  // --- must be global to get access from ShowActiveAvatar
var		JSON_geoCountry = [];
var		JSON_geoRegion = [];
var		JSON_geoLocality = [];
var		JSON_university = [];
var		JSON_school = [];
var		JSON_language = [];
var		JSON_skill = [];
var		JSON_book = [];
var		JSON_dataForProfile = {};
var		userProfile;
var		addCarrierCompany = {};
var		addCertification = {};
var		addCourse = {};
var		addSchool = {};
var		addUniversity = {};
var		addLanguage = {};
var		addSkill = {};
var		addBook = {};
var		addRecommendation = {};
var		datepickerDateFormat;
var		AutocompleteList = [];

var	Init = function()
{
	DrawAllAvatars();
	RenderCVandTitle();

	$("#AreYouSure #Remove").on("click", AreYouSureRemoveHandler);

	$.getJSON("/cgi-bin/index.cgi?action=JSON_getUserProfile", {param1: "_"})
		.done(function(data) {
			if(data.result === "success")
			{
				userProfile = data.users[0];
				InitBirthdayAccessLabel();
				RenderCity();
				RenderUserSex();
				RenderUserBirthday();
				RenderGiftPath();
			}
			else
			{
				console.debug("Init: ERROR: " + data.description);
			}
		})
		.fail(function() {
			console.error("error parse JSON response");
		});


	if(window.Worker)
	{
		var		helperWorker = new Worker("/js/pages/edit_profile_worker.js");

		helperWorker.onmessage = function(e)
		{
			JSON_dataForProfile = e.data.JSON_dataForProfile;
			JSON_geoCountry = e.data.JSON_geoCountry;
			JSON_geoRegion = e.data.JSON_geoRegion;
			JSON_geoLocality = e.data.JSON_geoLocality;
			JSON_university = e.data.JSON_university;
			JSON_school = e.data.JSON_school;
			JSON_language = e.data.JSON_language;
			JSON_skill = e.data.JSON_skill;

			AddDataForProfileCollapsibleInit();
		};

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
				$.getJSON("/cgi-bin/index.cgi?action=AJAX_getDataForProfile", {param1: ""})
						.done(function(data) {
							JSON_dataForProfile = data;

							data.geo_country.forEach(function(item, i, arr)
							{
								JSON_geoCountry.push(system_calls.ConvertHTMLToText(item.title));
							});

							data.geo_region.forEach(function(item, i, arr)
							{
								JSON_geoRegion.push(system_calls.ConvertHTMLToText(item.title));
							});

							data.geo_locality.forEach(function(item, i, arr)
							{
								JSON_geoLocality.push(system_calls.ConvertHTMLToText(item.title));
							});

							data.university.forEach(function(item, i, arr)
							{
								JSON_university.push(system_calls.ConvertHTMLToText(item.title));
							});
							jQuery.unique(JSON_university);

							data.school.forEach(function(item, i, arr)
							{
								JSON_school.push(system_calls.ConvertHTMLToText(item.title));
							});
							jQuery.unique(JSON_school);

							data.language.forEach(function(item, i, arr)
							{
								JSON_language.push(system_calls.ConvertHTMLToText(item.title));
							});

							data.skill.forEach(function(item, i, arr)
							{
								JSON_skill.push(system_calls.ConvertHTMLToText(item.title));
							});
							jQuery.unique(JSON_skill);

							AddDataForProfileCollapsibleInit();
						});
			}, 3000);
	} // --- End Worker


	// --- birthday access private/public 
	$("#switcherLabelBirthdayDatePublic").on("click", BirthdayAccessButtonClickHeader);
	// --- applied vacancies all/only in progress
	$("#switcherLabelAppliedVacancies").on("click", AppliedVacanciesButtonClickHeader);

	// --- Gift Initialization start
	AddGiftPathCollapsibleZeroize();
	$("button#AddGiftUnlimitedQuantityButton").on("click", function() { $("#AddGiftQuantity").val(9999999999); });
	$("button#AddGiftAddButton").on("click", AddGiftButton_ClickHandler);
	$("button#AddGiftLinkButton").on("click", GetDataFromProvidedURL);
	$("input#AddGiftLink").on("input", function() {
		var		link = $("#AddGiftLink").val();

		if(link.length)
			$("#AddGiftLinkButton").removeAttr("disabled");
		else
			$("#AddGiftLinkButton").attr("disabled", "");

	});
	$("input#AddGiftLink").on("change", function() {
		var		link = $("#AddGiftLink").val();

		if(link.length)
			$("#AddGiftLinkButton").removeAttr("disabled");
		else
			$("#AddGiftLinkButton").attr("disabled", "");

	});
	$("#AddGiftPreview").on("click", AddCoverNoUpload_ClickHandler);

	$("#AddGeneralCoverButton").on("change", AddGeneralCoverUploadChangeHandler);
	$("#AddGeneralCoverNoUploadButton").on("change", AddGeneralCoverNoUploadChangeHandler);
	// --- Gift Initialization finish

	// --- Modal: thank to grantor
	$("button#GiftGrantorThankModalSubmit").on("click", GiftGrantorThank_ClickHandler);

	$("div.btn-group.gift_filter > button.filter").on("click", GiftFilter_ClickHandler);

	$("#ImageComplainModal_Submit").on("click", ComplainSpecifiedImageModal_Submit_ClickHandler);

	$("#canvasForAvatar").on("click", AddAvatar_ClickHandler);

	$("#DeleteAvatarDialogBox").dialog({
		autoOpen: false,
		modal: true,
		show: {effect: "drop", duration: 300, direction: "up"},
		hide: {effect: "drop", duration: 200, direction: "down"},
		buttons : {
			"Удалить" : function() {
				console.debug("ShowPreviewAvatar: deletion dialog: delete preview AJAX_deleteAvatar?id="+$(this).dialog("option", "id"));

				$(this).dialog("close");

				DeletePreviewAvatar($(this).dialog("option", "id"));

			},
			"Отмена" : function() {
				$(this).dialog("close");
			}
		}
	});

	$("#DeleteAvatarDialogBoxBS_Submit").on("click", function() {
		console.debug("removed avatar id " + $("#DeletedAvatarID_InBSForm").val());

		$("#DeleteAvatarDialogBoxBS").modal("hide");

		// --- Real avatar deletion after closing dialog to improve User Experience
		DeletePreviewAvatar($("#DeletedAvatarID_InBSForm").val());
	});

	// --- Image uploader
	$(function () {
		// Change this to the location of your server-side upload handler:
		$("#fileupload").fileupload({
			url: "/cgi-bin/avataruploader.cgi",
			dataType: "json",
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
							console.debug("fileupload: done handler: uploading success [" + value.fileName + "]");
							edit_profile.DrawAllAvatars();
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

	ScrollToElementID("#" + system_calls.GetParamFromURL("scrollto"));
};

var	ScrollToElementID = function(elementID)
{
	if((elementID.length > 1) && $(elementID).length) // --- elementID is "#XXXX"
		system_calls.ScrollWindowToElementID(elementID);
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

var AddCarrierPathCollapsibleZeroize = function()
{
	$("div#AddCarrierCompany input#AddCarrierCompanyTitle").val("").parent().removeClass("has-feedback has-success has-error");
	$("div#AddCarrierCompany input#AddCarrierCompanyCompany").val("").parent().removeClass("has-feedback has-success has-error");
	$("div#AddCarrierCompany input#AddCarrierCompanyDescription").val("").parent().removeClass("has-feedback has-success has-error");
	$("div#AddCarrierCompany input#AddCarrierCompanyStartDate").val("").parent().removeClass("has-feedback has-success has-error");
	$("div#AddCarrierCompany input#AddCarrierCompanyEndDate").val("").parent().removeClass("has-feedback has-success has-error");
	$("div#AddCarrierCompany input#AddCarrierCompanyDescription").val("");
	$("div#AddCarrierCompany input#AddCarrierCompanyEndDate").parent().addClass("visibility_hidden");
	addCarrierCompany.currentEmployment = 1;
};

var AddCertificationPathCollapsibleZeroize = function()
{
	$("div#AddCertification input#AddCertificationVendor").val("").parent().removeClass("has-feedback has-success has-error")
														.removeAttr("disabled");
	$("div#AddCertification input#AddCertificationTitle").val("").parent().removeClass("has-feedback has-success has-error");
	// $("div#AddCertification input#AddCertificationTitle").attr("disabled", "");
	$("div#AddCertification input#AddCertificationNumber").val("").parent().removeClass("has-feedback has-success has-error");
	// $("div#AddCertification input#AddCertificationNumber").attr("disabled", "");
};

var AddBookPathCollapsibleZeroize = function()
{
	$("div#AddBook input#AddBookAuthor").val("").parent().removeClass("has-feedback has-success has-error");
	$("div#AddBook input#AddBookTitle").val("").parent().removeClass("has-feedback has-success has-error");
	$("div#AddBook input#AddBookISBN10").val("").parent().removeClass("has-feedback has-success has-error");
	$("div#AddBook input#AddBookISBN13").val("").parent().removeClass("has-feedback has-success has-error");
	$("div#AddBookCoverDiv").empty();
};

var AddGiftPathCollapsibleZeroize = function()
{
	$("div#AddGift input#AddGiftTitle").val("").parent().removeClass("has-feedback has-success has-error");
	$("div#AddGift input#AddGiftLink").val("").parent().removeClass("has-feedback has-success has-error");
	$("div#AddGift input#AddGiftPrice").val("").parent().removeClass("has-feedback has-success has-error");
	$("div#AddGift input#AddGiftQuantity").val("").parent().removeClass("has-feedback has-success has-error");
	$("div#AddGift textarea#AddGiftDescription").val("").parent().removeClass("has-feedback has-success has-error");
	$("button#AddGiftLinkButton").attr("disabled", "");
	$("div#AddGiftCoverDiv").empty();
	$("#AddGiftPreview").attr("src", "/images/pages/edit_profile/cloud_arrow.jpg");
};

var AddCoursePathCollapsibleZeroize = function()
{
	$("div#AddCourse input#AddCourseVendor").val("").parent().removeClass("has-feedback has-success has-error")
											.removeAttr("disabled");
	$("div#AddCourse input#AddCourseTitle").val("").parent().removeClass("has-feedback has-success has-error");
	// $("div#AddCourse input#AddCourseTitle").attr("disabled", "");
};

var AddUniversityPathCollapsibleZeroize = function()
{
	$("div#AddUniversityRegionRadioButtons").empty();
	$("div#AddUniversity input#AddUniversityTitle").val("").parent().removeClass("has-feedback has-success has-error");

	$("div#AddUniversity input#AddUniversityRegion").val("").parent().removeClass("has-feedback has-success has-error");
	$("div#AddUniversity input#AddUniversityRegion").attr("disabled", "");

	$("div#AddUniversity select#AddUniversityDegree").val("").parent().removeClass("has-feedback has-success has-error");
	// $("div#AddUniversity select#AddUniversityDegree").attr("disabled", "");
	$("div#AddUniversity select#AddUniversityPeriodStart").val("").parent().removeClass("has-feedback has-success has-error");
	// $("div#AddUniversity select#AddUniversityPeriodStart").attr("disabled", "");
	$("div#AddUniversity select#AddUniversityPeriodFinish").val("").parent().removeClass("has-feedback has-success has-error");
	// $("div#AddUniversity select#AddUniversityPeriodFinish").attr("disabled", "");
};

var AddSchoolPathCollapsibleZeroize = function()
{
	$("div#AddSchool input#AddSchoolLocality").val("").parent().removeClass("has-feedback has-success has-error");

	$("div#AddSchool input#AddSchoolTitle").val("").parent().removeClass("has-feedback has-success has-error");
	// $("div#AddSchool input#AddSchoolTitle").attr("disabled", "");

	$("div#AddSchool select#AddSchoolPeriodStart").val("").parent().removeClass("has-feedback has-success has-error");
	// $("div#AddSchool select#AddSchoolPeriodStart").attr("disabled", "");
	$("div#AddSchool select#AddSchoolPeriodFinish").val("").parent().removeClass("has-feedback has-success has-error");
	// $("div#AddSchool select#AddSchoolPeriodFinish").attr("disabled", "");
};

var AddLanguagePathCollapsibleZeroize = function()
{
	$("div#AddLanguage input#AddLanguageTitle").val("").parent().removeClass("has-feedback has-success has-error");

	$("div#AddLanguage select#AddLanguageLevel").val("").parent().removeClass("has-feedback has-success has-error");
	// $("div#AddLanguage select#AddLanguageLevel").attr("disabled", "");
};

var AddSkillPathCollapsibleZeroize = function()
{
	$("div#AddSkill input#AddSkillTitle").val("").parent().removeClass("has-feedback has-success has-error");
};


var AddCertificationPathCollapsibleInit = function()
{
	$("div#AddCertification button#AddCertificationAddButton").on("click", AddCertificationAddButton_ClickHandler);
	$("div#AddCertification button#AddCertificationCancelButton").on("click", AddCertificationPathToggleCollapsible);
};

var AddCoursePathCollapsibleInit = function()
{
	$("div#AddCourse button#AddCourseAddButton").on("click", AddCourseAddButton_ClickHandler);
	$("div#AddCourse button#AddCourseCancelButton").on("click", AddCoursePathToggleCollapsible);
};

var AddSchoolPathCollapsibleInit = function()
{
	// $("div#AddSchool button#AddSchoolAddButton").on("click", AddSchoolAddButton_ClickHandler);
	$("div#AddSchool button#AddSchoolCancelButton").on("click", AddSchoolPathToggleCollapsible);
};

var AddUniversityPathCollapsibleInit = function()
{
	$("div#AddUniversity button#AddUniversityAddButton").on("click", AddUniversityAddButton_ClickHandler);
	$("div#AddUniversity button#AddUniversityCancelButton").on("click", AddUniversityPathToggleCollapsible);
};

var AddLanguagePathCollapsibleInit = function()
{
	$("div#AddLanguage button#AddLanguageAddButton").on("click", AddLanguageAddButton_ClickHandler);
	$("div#AddLanguage button#AddLanguageCancelButton").on("click", AddLanguagePathToggleCollapsible);
};

var AddSkillPathCollapsibleInit = function()
{
	$("div#AddSkill button#AddSkillAddButton").on("click", AddSkillAddButton_ClickHandler);
	$("div#AddSkill button#AddSkillCancelButton").on("click", AddSkillPathToggleCollapsible);
};

var AddBookPathCollapsibleInit = function()
{
	$("div#AddBook button#AddBookAddButton").on("click", AddBookAddButton_ClickHandler);
	$("div#AddBook button#AddBookCancelButton").on("click", AddBookPathToggleCollapsible);
};

var AddCarrierPathCollapsibleInit = function()
{
	// --- start AddCarrierPath
	datepickerDateFormat = "yy-M-dd";
	$("div#AddCarrierCompany span#AddCarrierCompanyCurrentEmployment").hover(
														function() {
															$(this).children("img").data("initial_src", $(this).children("img").attr("src"));
															// $(this).children("img").attr("src", "/images/pages/common/checkbox_animated.gif"); 
															$(this).addClass("editable_highlighted_class", 400);
														}, 
														function() {
															// $(this).children("img").attr("src", $(this).children("img").data("initial_src")); 
															$(this).removeClass("editable_highlighted_class", 200, "easeInOutCirc");
														})
														.on("click", AddCarrierPathCollapsibleCurrentEmployment_ClickHandler);
	$("div#AddCarrierCompany button#AddCarrierCompanyAddButton").on("click", AddCarrierCompanyAddButton_ClickHandler);
	$("div#AddCarrierCompany button#AddCarrierCompanyCancelButton").on("click", AddCarrierPathToggleCollapsible);

	addCarrierCompany.currentEmployment = 1;
	addCarrierCompany.startDate = $("div#AddCarrierCompany input#AddCarrierCompanyStartDate")
		.datepicker({
			firstDay: 1,
			dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
			dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
			monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
			monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
			dateFormat: datepickerDateFormat,
			changeMonth: true,
			changeYear: true,
			defaultDate: "+1w",
			numberOfMonths: 1
			// maxDate: $("div#AddCarrierCompany input#AddCarrierCompanyEndDate").val()
		})
		.on( "change", function() {
			addCarrierCompany.endDate.datepicker( "option", "minDate", $(this).val() );

			if($(this).val() === "")
			{
				$(this).parent().removeClass("has-success").addClass("has-feedback has-error");
			}
			else
			{
				$(this).parent().removeClass("has-error").addClass("has-feedback has-success");
			}

		});
	addCarrierCompany.endDate = $("div#AddCarrierCompany input#AddCarrierCompanyEndDate").datepicker({
			firstDay: 1,
			dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
			dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
			monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
			monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
			dateFormat: datepickerDateFormat,
			changeMonth: true,
			changeYear: true,
			defaultDate: "+1w",
			numberOfMonths: 1
	  })
		.on( "change", function() {
			addCarrierCompany.startDate.datepicker( "option", "maxDate", $(this).val() );

			if($(this).val() === "")
			{
				$(this).parent().removeClass("has-success").addClass("has-feedback has-error");
			}
			else
			{
				$(this).parent().removeClass("has-error").addClass("has-feedback has-success");
			}
		});
	// --- end AddCarrierPath
};

var AddCarrierPathCollapsibleInitJobTitle = function()
{
	$("input#AddCarrierCompanyTitle").autocomplete({
		delay : 300,
		source: JSON_jobTitleID,
		minLength: 3,
		change: function (event, ui) { 
			console.debug ("AddCarrierPathCollapsibleInitJobTitle: change event handler"); 

			if($(this).val() === "")
			{
				$(this).parent().removeClass("has-success").addClass("has-feedback has-error");
			}
			else
			{
				$(this).parent().removeClass("has-error").addClass("has-feedback has-success");
			}
		},
		close: function (event, ui) 
		{ 
			console.debug ("AddCarrierPathCollapsibleInitJobTitle: close event handler"); 
		},
		create: function () {
			// console.debug ("AddCarrierPathCollapsibleInitJobTitle: _create event handler"); 
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
};

var AddCertificationPathCollapsibleInitVendorTitle = function()
{
	$("input#AddCertificationVendor").autocomplete({
		delay : 300,
		source: JSON_certificationVendors,
		minLength: 3,
		change: function (event, ui) { 
			console.debug ("AddCertificationPathCollapsibleInitVendorTitle: change event handler"); 

			if($(this).val() === "")
			{
				$(this).parent().removeClass("has-success").addClass("has-feedback has-error");
				// $("input#AddCertificationTitle").val("").attr("disabled", "");
				$("input#AddCertificationTitle").parent().removeClass("has-error has-feedback has-success");
				// $("input#AddCertificationNumber").val("").attr("disabled", "");
				$("input#AddCertificationNumber").parent().removeClass("has-error has-feedback has-success");
			}
			else
			{
				$(this).parent().removeClass("has-error").addClass("has-feedback has-success");
				// $("input#AddCertificationTitle").removeAttr("disabled");
			}
		},
		close: function (event, ui) 
		{ 
			console.debug ("AddCertificationPathCollapsibleInitVendorTitle:AddCertificationVendor: close event handler"); 
		},
		create: function () {
			// console.debug ("AddCertificationPathCollapsibleInitVendorTitle:AddCertificationVendor: _create event handler"); 
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

	$("input#AddCourseVendor").autocomplete({
		delay : 300,
		source: JSON_certificationVendors,
		minLength: 3,
		change: function (event, ui) { 
			console.debug ("AddCertificationPathCollapsibleInitVendorTitle: change event handler"); 

			if($(this).val() === "")
			{
				$(this).parent().removeClass("has-success").addClass("has-feedback has-error");
				// $("input#AddCourseTitle").val("").attr("disabled", "");
				$("input#AddCourseTitle").parent().removeClass("has-error has-feedback has-success");
			}
			else
			{
				$(this).parent().removeClass("has-error").addClass("has-feedback has-success");
				// $("input#AddCourseTitle").removeAttr("disabled");
			}
		},
		close: function (event, ui) 
		{ 
			console.debug ("AddCertificationPathCollapsibleInitVendorTitle:AddCourseVendor: close event handler"); 
		},
		create: function () {
			// console.debug ("AddCertificationPathCollapsibleInitVendorTitle:AddCourseVendor: _create event handler"); 
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
};

var AddCertificationPathCollapsibleInitTracksTitle = function()
{
	$("input#AddCertificationTitle").autocomplete({
		delay : 300,
		source: JSON_certificationTracks,
		minLength: 3,
		change: function (event, ui) { 
			console.debug ("AddCertificationPathCollapsibleInitTracksTitle: change event handler"); 

			if($(this).val() === "")
			{
				$(this).parent().removeClass("has-success").addClass("has-feedback has-error");
				// $("input#AddCertificationNumber").val("").attr("disabled", "");
				$("input#AddCertificationNumber").parent().removeClass("has-error has-feedback has-success");
			}
			else
			{
				$(this).parent().removeClass("has-error").addClass("has-feedback has-success");
				// $("input#AddCertificationNumber").removeAttr("disabled");
			}
		},
		close: function (event, ui) 
		{ 
			console.debug ("AddCertificationPathCollapsibleInitTracksTitle: close event handler"); 
			AddCertificationPathPrefillByTitle();
		},
		create: function () {
			// console.debug ("AddCertificationPathCollapsibleInitTracksTitle: _create event handler"); 
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

	$("input#AddCourseTitle").autocomplete({
		delay : 300,
		source: JSON_certificationTracks,
		minLength: 3,
		change: function (event, ui) { 
			console.debug ("AddCertificationPathCollapsibleInitTracksTitle: change event handler"); 

			if($(this).val() === "")
			{
				$(this).parent().removeClass("has-success").addClass("has-feedback has-error");
			}
			else
			{
				$(this).parent().removeClass("has-error").addClass("has-feedback has-success");
			}
		},
		close: function (event, ui) 
		{ 
			console.debug ("AddCertificationPathCollapsibleInitTracksTitle: close event handler"); 
			AddCoursePathPrefillByTitle();
		},
		create: function () {
			// console.debug ("AddCertificationPathCollapsibleInitTracksTitle: _create event handler"); 
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
};

var AddDataForProfileCollapsibleInit = function()
{
	$("input#AddUniversityTitle").autocomplete({
		delay : 300,
		source: JSON_university,
		minLength: 3,
		change: function (event, ui) { 
			console.debug ("AddDataForProfileCollapsibleInit: change event handler"); 

			if($(this).val() === "")
			{
				$(this).parent().removeClass("has-success").addClass("has-feedback has-error");
				$("div#AddUniversityRegionRadioButtons").empty();
				$("input#AddUniversityRegion").val("").attr("disabled", "");
				$("input#AddUniversityRegion").parent().removeClass("has-error has-feedback has-success");
				// $("select#AddUniversityDegree").val("").attr("disabled", "");
				$("select#AddUniversityDegree").parent().removeClass("has-error has-feedback has-success");
				// $("select#AddUniversityPeriodStart").val("").attr("disabled", "");
				$("select#AddUniversityPeriodStart").parent().removeClass("has-error has-feedback has-success");
				// $("select#AddUniversityPeriodFinish").val("").attr("disabled", "");
				$("select#AddUniversityPeriodFinish").parent().removeClass("has-error has-feedback has-success");
			}
			else
			{
				$(this).parent().removeClass("has-error").addClass("has-feedback has-success");
				$("input#AddUniversityRegion").removeAttr("disabled");
				// $("select#AddUniversityDegree").removeAttr("disabled");
				// $("select#AddUniversityPeriodStart").removeAttr("disabled");
				// $("select#AddUniversityPeriodFinish").removeAttr("disabled");

				AddUniversityUpdateRadioSelect();
			}
		},
		close: function (event, ui) 
		{ 
			console.debug ("AddDataForProfileCollapsibleInit: close event handler");
		},
		create: function () {
			// console.debug ("AddDataForProfileCollapsibleInit: _create event handler"); 
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

	$("input#AddSchoolTitle").autocomplete({
		delay : 300,
		source: JSON_school,
		minLength: 3,
		change: function (event, ui) { 
			console.debug ("AddDataForProfileCollapsibleInit: change event handler"); 

			if($(this).val() === "")
			{
				$(this).parent().removeClass("has-success").addClass("has-feedback has-error");
			}
			else
			{
				$(this).parent().removeClass("has-error").addClass("has-feedback has-success");
			}
		},
		close: function (event, ui) 
		{ 
			console.debug ("AddDataForProfileCollapsibleInit: close event handler"); 
		},
		create: function () {
			// console.debug ("AddDataForProfileCollapsibleInit: _create event handler"); 
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

	$("input#AddUniversityRegion").autocomplete({
		delay : 300,
		source: JSON_geoRegion,
		minLength: 2,
		change: function (event, ui) { 
			console.debug ("AddDataForProfileCollapsibleInit: change event handler"); 

			if($(this).val() === "")
			{
				$(this).parent().removeClass("has-success").addClass("has-feedback has-error");
			}
			else
			{
				$(this).parent().removeClass("has-error").addClass("has-feedback has-success");
			}
		},
		close: function (event, ui) 
		{ 
			console.debug ("AddDataForProfileCollapsibleInit: close event handler"); 
		},
		create: function () {
			// console.debug ("AddDataForProfileCollapsibleInit: _create event handler"); 
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

	$("input#AddSchoolLocality").autocomplete({
		delay : 300,
		source: JSON_geoLocality,
		minLength: 3,
		change: function (event, ui) { 
			console.debug ("AddDataForProfileCollapsibleInit: change event handler"); 

			if($(this).val() === "")
			{
				$(this).parent().removeClass("has-success").addClass("has-feedback has-error");
				// $("input#AddSchoolTitle").val("").attr("disabled", "");
				$("input#AddSchoolTitle").parent().removeClass("has-error has-feedback has-success");
				// $("select#AddSchoolPeriodStart").val("").attr("disabled", "");
				$("select#AddSchoolPeriodStart").parent().removeClass("has-error has-feedback has-success");
				// $("select#AddSchoolPeriodFinish").val("").attr("disabled", "");
				$("select#AddSchoolPeriodFinish").parent().removeClass("has-error has-feedback has-success");
			}
			else
			{
				$(this).parent().removeClass("has-error").addClass("has-feedback has-success");
				// $("input#AddSchoolTitle").removeAttr("disabled");
				// $("select#AddSchoolPeriodStart").removeAttr("disabled");
				// $("select#AddSchoolPeriodFinish").removeAttr("disabled");

				AddUniversityUpdateRadioSelect();
			}
		},
		close: function (event, ui) 
		{ 
			console.debug ("AddDataForProfileCollapsibleInit: close event handler"); 
		},
		create: function () {
			// console.debug ("AddDataForProfileCollapsibleInit: _create event handler"); 
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

	$("input#AddLanguageTitle").autocomplete({
		delay : 300,
		source: JSON_language,
		minLength: 2,
		change: function (event, ui) { 
			console.debug ("AddDataForProfileCollapsibleInit: change event handler"); 

			if($(this).val() === "")
			{
				$(this).parent().removeClass("has-success").addClass("has-feedback has-error");
				// $("select#AddLanguageLevel").val("").attr("disabled", "");
				$("select#AddLanguageLevel").parent().removeClass("has-error has-feedback has-success");
			}
			else
			{
				$(this).parent().removeClass("has-error").addClass("has-feedback has-success");
				// $("select#AddLanguageLevel").removeAttr("disabled");
			}
		},
		close: function (event, ui) 
		{ 
			console.debug ("AddDataForProfileCollapsibleInit: close event handler"); 
		},
		create: function () {
			// console.debug ("AddDataForProfileCollapsibleInit: _create event handler"); 
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

	$("input#AddSkillTitle").autocomplete({
		delay : 300,
		source: JSON_skill,
		minLength: 3,
		change: function (event, ui) { 
			console.debug ("AddDataForProfileCollapsibleInit: change event handler"); 

			if($(this).val() === "")
			{
				$(this).parent().removeClass("has-success").addClass("has-feedback has-error");
			}
			else
			{
				$(this).parent().removeClass("has-error").addClass("has-feedback has-success");
			}
		},
		close: function (event, ui) 
		{ 
			console.debug ("AddDataForProfileCollapsibleInit: close event handler"); 
		},
		create: function () {
			// console.debug ("AddDataForProfileCollapsibleInit: _create event handler"); 
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


};

var AddCarrierPathCollapsibleInitCompany = function()
{
	$("input#AddCarrierCompanyCompany").autocomplete({
		delay : 300,
		source: JSON_CompanyNameID,
		minLength: 3,
		change: function (event, ui) { 
			console.debug ("AddCarrierPathCollapsibleInitCompany: change event handler"); 

			if($(this).val() === "")
			{
				$(this).parent().removeClass("has-success").addClass("has-feedback has-error");
			}
			else
			{
				$(this).parent().removeClass("has-error").addClass("has-feedback has-success");
			}
		},
		close: function (event, ui) 
		{ 
			console.debug ("AddCarrierPathCollapsibleInitCompany: close event handler"); 
		},
		create: function () {
			// console.debug ("AddCarrierPathCollapsibleInitCompany: _create event handler"); 
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
};

var	GetRegionNameByID = function(regionID)
{
	var	regionName = "";

	JSON_dataForProfile.geo_region.forEach(function(item)
		{
			if(item.id === regionID) { regionName = item.title; }
		});

	return regionName;
};

var AddUniversityUpdateRadioSelect = function()
{
	var		universityPicked = $("input#AddUniversityTitle").val();
	var		radioButtonUniversityArray;

	$("div#AddUniversityRegionRadioButtons").empty();

	radioButtonUniversityArray = JSON_dataForProfile.university.filter(function(item)
		{
			return item.title === universityPicked;
		});

	if(radioButtonUniversityArray.length)
	{
		radioButtonUniversityArray.forEach(function(item, i, arr)
			{
				var	regionName = GetRegionNameByID(item.geo_region_id);
				var	divTag = $("<div>").addClass("radio");
				var	labelTag = $("<label>");
				var	inputTag = $("<input>").attr("type", "radio")
											.attr("name", "radioButtonUniversityRegion")
											.attr("id", "radioButtonUniversityRegion" + i)
											.attr("value", regionName);

				$("div#AddUniversityRegionRadioButtons").append(divTag.append(labelTag.append(inputTag).append(regionName)));
			});
		{
			var	divTag = $("<div>").addClass("radio");
			var	labelTag = $("<label>");
			var	inputTag = $("<input>").attr("type", "radio")
										.attr("name", "radioButtonUniversityRegion")
										.attr("id", "radioButtonUniversityRegionOther")
										.attr("value", "Другое");

			$("div#AddUniversityRegionRadioButtons").append(divTag.append(labelTag.append(inputTag).append("Другое")));
		}
	}
};

var AddCarrierPathToggleCollapsible = function()
{
	$("#AddCarrierCompany").collapse("toggle");
	$("#AddCarrierCompanyTitle").focus();
};

var AddCertificationPathToggleCollapsible = function()
{
	$("#AddCertification").collapse("toggle");
	$("#AddCertificationTitle").focus();
};

var AddCoursePathToggleCollapsible = function()
{
	$("#AddCourse").collapse("toggle");
	$("#AddCourseTitle").focus();
};

var AddSchoolPathToggleCollapsible = function()
{
	$("#AddSchool").collapse("toggle");
	$("#AddSchoolLocality").focus();
};

var AddUniversityPathToggleCollapsible = function()
{
	$("#AddUniversity").collapse("toggle");
	$("#AddUniversityTitle").focus();
};

var AddLanguagePathToggleCollapsible = function()
{
	$("#AddLanguage").collapse("toggle");
	$("#AddLanguageTitle").focus();
};

var AddSkillPathToggleCollapsible = function()
{
	$("#AddSkill").collapse("toggle");
	$("#AddSkillTitle").focus();
};

var AddBookPathToggleCollapsible = function()
{
	$("#AddBook").collapse("toggle");
	$("#AddBookTitle").focus();
	AddBookAllFieldsReset();
};

var AddGiftPathToggleCollapsible = function()
{
	$("#AddGift").collapse("toggle");
	$("#AddGiftTitle").focus();
	AddGiftAllFieldsReset();
};

var	AddBookAllFieldsLoading = function()
{
	$("#AddBookAuthor").attr("disabled", "");
	$("#AddBookTitle").attr("disabled", "");
	$("#AddBookISBN10").attr("disabled", "");
	$("#AddBookISBN13").attr("disabled", "");

	$("#AddBookCheckByISBN10").button("loading");
	$("#AddBookCheckByISBN13").button("loading");
	$("#AddBookCoverUpload").button("loading");

	$("#AddBookAddButton").button("loading");
	$("#AddBookCancelButton").button("loading");
};

var	AddBookAllFieldsReset = function()
{
	$("#AddBookAuthor").removeAttr("disabled", "");
	$("#AddBookTitle").removeAttr("disabled", "");
	$("#AddBookISBN10").removeAttr("disabled", "");
	$("#AddBookISBN13").removeAttr("disabled", "");

	$("#AddBookCheckByISBN10").button("reset");
	$("#AddBookCheckByISBN13").button("reset");
	$("#AddBookCoverUpload").button("reset");

	$("#AddBookAddButton").button("reset");
	$("#AddBookCancelButton").button("reset");
};

var AddGiftAllFieldsFreeze = function()
{
	$("div#AddGift input").attr("disabled", "");
	$("div#AddGift textarea").attr("disabled", "");
	$("div#AddGift button").button("loading");
};

var	AddGiftAllFieldsReset = function()
{
	$("div#AddGift input").removeAttr("disabled", "");
	$("div#AddGift textarea").removeAttr("disabled", "");
	$("div#AddGift button").button("reset");
};

var GetDataFromProvidedURL = function()
{
	var		giftLink = $("#AddGiftLink").val();

	giftLink.trimStart().trimEnd();
	if(!system_calls.isValidURL(giftLink))
	{
		system_calls.PopoverError("AddGiftLinkButton", "Ошибка в написании ссылки.");
	}
	else if(giftLink.length)
	{
		AddGiftAllFieldsFreeze();

		$.getJSON("/cgi-bin/gift.cgi?action=AJAX_getURLMetaData", {url: giftLink})
		 		.done(function(data) {
					if(data.result == "success")
					{
						if(data.title.length)
							$("#AddGiftTitle").val(system_calls.ConvertHTMLToText(data.title));
						else
							system_calls.PopoverInfo("AddGiftTitle", "ничего не нашлось");

						if(data.description.length)
							$("#AddGiftDescription").val(system_calls.ConvertHTMLToText(data.description));
						else
							system_calls.PopoverInfo("AddGiftDescription", "ничего не нашлось");

						// --- add preview image to the list of already uploaded images and update GUI
						if((typeof(data.imageID) != "undefined") && (typeof(data.imageURL) != "undefined") && data.imageID.length && data.imageURL.length)
						{
							// --- update GUI
							var		mediaPreview, mediaComment;

							if((typeof(data.mediaType) != "undefined") && (data.mediaType == "image"))
							{
								mediaPreview = $("#AddGiftPreview").attr("src", "/images/temp/" + data.imageURL);
							}
							else if((typeof(data.mediaType) != "undefined") && (data.mediaType == "youtube_video"))
							{
								mediaPreview = $("<iframe>").addClass("max_100percents_100px")
															.attr("src", data.imageURL)
															.attr("frameborder", "0")
															.attr("allowfullscreen", "");
							}
							else
							{
								console.debug("server returned unknown or undefined mediaType");
							}
						}
					}
					else
					{
						system_calls.PopoverInfo("AddGiftLinkButton", "ОШИБКА: " + data.description);
						console.error("getJSON(AJAX_getURLMetaData).done():ERROR [" + data.description + "]");
					}
				})
				.always(function(data) {
					setTimeout(AddGiftAllFieldsReset, 300);
				});
	}
	else
	{
		system_calls.PopoverInfo("AddGiftDescription", "напишите ссылку откуда взять данные");
	}
};


var	AddBookPathFindBookByISBN10 = function()
{
	var		isbn10 = $("input#AddBookISBN10").val();

	if(isbn10.length >= 10)
	{
		AddBookAllFieldsLoading();

		$.getJSON("/cgi-bin/book.cgi?action=JSON_getBookByISBN10", {id: isbn10})
			.done(function(data) {

				if(data.result === "success")
				{
					if(data.books.length)
					{
						var	tagImg = $("<img>").addClass("max_100percents_100px div_content_center_alignment");

						AddBookPathCollapsibleZeroize();
						$("#AddBookAuthor").val(system_calls.ConvertHTMLToText(data.books[0].bookAuthorName));
						$("#AddBookTitle").val(system_calls.ConvertHTMLToText(data.books[0].bookTitle));
						$("#AddBookISBN10").val(data.books[0].bookISBN10);
						$("#AddBookISBN13").val(data.books[0].bookISBN13);

						if(data.books[0].bookPhotoCoverFolder.length && data.books[0].bookPhotoCoverFilename.length)
						{
							tagImg.attr("src", "/images/books/" + data.books[0].bookPhotoCoverFolder + "/" + data.books[0].bookPhotoCoverFilename);
							$("#AddBookCoverDiv").append(tagImg);
						}

					}
					else
						system_calls.PopoverError("AddBookISBN10", "Книги с таким ISBN не найдено, вы первый читатель, кто ее прочитал.");
				}
				else
				{
					console.debug("Init: ERROR: " + data.description);
					system_calls.PopoverError("AddBookISBN10", data.description);
				}
				AddBookAllFieldsReset();
			})
			.fail(function(data) {
				console.debug("Init: ERROR: " + data.description);
				system_calls.PopoverError("AddBookISBN10", "Ошибка ответа сервера");
				AddBookAllFieldsReset();
			});
	}
	else
		system_calls.PopoverError("AddBookISBN10", "Напишите ISBN10 для поиска по этому идентификатору.");
};

var AddCertificationPathPrefillByTitle = function()
{
	var		certificationTitle = $("#AddCertificationTitle").val();	

	if(certificationTitle.length)
	{
		$.getJSON("/cgi-bin/index.cgi?action=JSON_getCertificationDetailsByTitle", {certificationTitle: certificationTitle})
			.done(function(data) {
				if(data.result === "success")
				{
					if(data.companies.length && data.companies[0].name) 
						$("#AddCertificationVendor").val(data.companies[0].name)
													.attr("disabled", "");
					else
						$("#AddCertificationVendor").removeAttr("disabled");

				}
				else
				{
					console.debug("AddCertificationPathPrefillByTitle:ERROR: " + data.description);
				}
			})
			.fail(function(data) {
				console.debug("AddCertificationPathPrefillByTitle: ERROR: " + data.description);
				// system_calls.PopoverError("AddCertificationTitle", "Ошибка ответа сервера");
			});
	}
};

var AddCoursePathPrefillByTitle = function()
{
	var		courseTitle = $("#AddCourseTitle").val();	

	if(courseTitle.length)
	{
		$.getJSON("/cgi-bin/index.cgi?action=JSON_getCourseDetailsByTitle", {courseTitle: courseTitle})
			.done(function(data) {
				if(data.result === "success")
				{
					if(data.companies.length && data.companies[0].name) 
						$("#AddCourseVendor").val(data.companies[0].name)
											.attr("disabled", "");
					else
						$("#AddCourseVendor").removeAttr("disabled");

				}
				else
				{
					console.debug("AddCoursePathPrefillByTitle:ERROR: " + data.description);
				}
			})
			.fail(function(data) {
				console.debug("AddCoursePathPrefillByTitle: ERROR: " + data.description);
				// system_calls.PopoverError("AddCourseTitle", "Ошибка ответа сервера");
			});
	}
};

var AddBookPathPrefillISBNs = function()
{
	var		bookTitle = $("#AddBookTitle").val();	
	var		bookAuthor = $("#AddBookAuthor").val();	

	if(bookTitle.length && bookAuthor.length)
	{
		$.getJSON("/cgi-bin/book.cgi?action=JSON_getBookISBNsByAuthorAndTitle", {bookTitle: bookTitle, bookAuthor: bookAuthor})
			.done(function(data) {
				if(data.result === "success")
				{
					$("#AddBookISBN10").val("");
					$("#AddBookISBN13").val("");
					if(data.books.length && data.books[0].bookISBN10) $("#AddBookISBN10").val(data.books[0].bookISBN10);
					if(data.books.length && data.books[0].bookISBN13) $("#AddBookISBN13").val(data.books[0].bookISBN13);
				}
				else
				{
					console.debug("AddBookPathPrefillISBNs:ERROR: " + data.description);
				}
			})
			.fail(function(data) {
				console.debug("AddBookPathPrefillISBNs: ERROR: " + data.description);
				system_calls.PopoverError("AddBookPathPrefillISBNs", "Ошибка ответа сервера");
			});
	}
	else if(bookTitle.length)
	{
		$.getJSON("/cgi-bin/book.cgi?action=JSON_getBookDetailsByTitle", {bookTitle: bookTitle})
			.done(function(data) {
				if(data.result === "success")
				{
					$("#AddBookAuthor").val("");
					$("#AddBookISBN10").val("");
					$("#AddBookISBN13").val("");
					if(data.books.length && data.books[0].bookAuthorName) $("#AddBookAuthor").val(data.books[0].bookAuthorName);
					if(data.books.length && data.books[0].bookISBN10) $("#AddBookISBN10").val(data.books[0].bookISBN10);
					if(data.books.length && data.books[0].bookISBN13) $("#AddBookISBN13").val(data.books[0].bookISBN13);
				}
				else
				{
					console.debug("AddBookPathPrefillISBNs:ERROR: " + data.description);
				}
			})
			.fail(function(data) {
				console.debug("AddBookPathPrefillISBNs: ERROR: " + data.description);
				system_calls.PopoverError("AddBookPathPrefillISBNs", "Ошибка ответа сервера");
			});
	}
};

var	AddBookPathFindBookByISBN13 = function()
{
	var		isbn13 = $("input#AddBookISBN13").val();

	if(isbn13.length >= 10)
	{
		AddBookAllFieldsLoading();

		$.getJSON("/cgi-bin/book.cgi?action=JSON_getBookByISBN10", {id: isbn13})
			.done(function(data) {

				if(data.result === "success")
				{
					if(data.books.length)
					{
						var	tagImg = $("<img>").addClass("max_100percents_100px div_content_center_alignment");

						AddBookPathCollapsibleZeroize();
						$("#AddBookAuthor").val(system_calls.ConvertHTMLToText(data.books[0].bookAuthorName));
						$("#AddBookTitle").val(system_calls.ConvertHTMLToText(data.books[0].bookTitle));
						$("#AddBookISBN10").val(data.books[0].bookISBN10);
						$("#AddBookISBN13").val(data.books[0].bookISBN13);

						if(data.books[0].bookPhotoCoverFolder.length && data.books[0].bookPhotoCoverFilename.length)
						{
							tagImg.attr("src", "/images/books/" + data.books[0].bookPhotoCoverFolder + "/" + data.books[0].bookPhotoCoverFilename);
							$("#AddBookCoverDiv").append(tagImg);
						}

					}
					else
						system_calls.PopoverError("AddBookISBN13", "Книги с таким ISBN не найдено, вы первый читатель, кто ее прочитал.");
				}
				else
				{
					console.debug("AddBookPathFindBookByISBN13: ERROR: " + data.description);
					system_calls.PopoverError("AddBookISBN13", data.description);
				}
				AddBookAllFieldsReset();
			})
			.fail(function(data) {
				console.debug("AddBookPathFindBookByISBN13: ERROR: " + data.description);
				system_calls.PopoverError("AddBookISBN13", "Ошибка ответа сервера");
				AddBookAllFieldsReset();
			});
	}
	else
		system_calls.PopoverError("AddBookISBN13", "Напишите ISBN13 для поиска по этому идентификатору.");
};

var AddCarrierCompanyAddButton_ClickHandler = function()
{
	var		isClearToAdd = 1;

	addCarrierCompany.AddCarrierCompanyTitle = $("#AddCarrierCompanyTitle").val();
	addCarrierCompany.AddCarrierCompanyCompany = $("#AddCarrierCompanyCompany").val();
	addCarrierCompany.AddCarrierCompanyStartDate = $("#AddCarrierCompanyStartDate").val();
	addCarrierCompany.AddCarrierCompanyEndDate = $("#AddCarrierCompanyEndDate").val();
	addCarrierCompany.AddCarrierCompanyCurrentEmployment = addCarrierCompany.currentEmployment;
	addCarrierCompany.AddCarrierCompanyDescription = $("#AddCarrierCompanyDescription").val();

	// --- removing OOO, OAO, etc from company name
	system_calls.companyTypes.push("OOO"); // --- temporarily add "OOO" with latin letters
	system_calls.companyTypes.forEach(function(item)
		{
			var		pos = addCarrierCompany.AddCarrierCompanyCompany.indexOf(item);

			if(pos >= 0) addCarrierCompany.AddCarrierCompanyCompany = addCarrierCompany.AddCarrierCompanyCompany.replace(item, "");
		});
	system_calls.companyTypes.pop(); // --- remove temporarily added latin-letter "OOO"
	addCarrierCompany.AddCarrierCompanyCompany.replace(/^\s+/, "").replace(/\s+$/, "");

	// --- fields correctness checks
	if(addCarrierCompany.AddCarrierCompanyTitle === "")
	{
		isClearToAdd = 0;
		$("#AddCarrierCompanyTitle").popover({"content": "Напишите название должности."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddCarrierCompanyTitle").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddCarrierCompanyTitle").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(addCarrierCompany.AddCarrierCompanyCompany === "")
	{
		isClearToAdd = 0;
		$("#AddCarrierCompanyCompany").popover({"content": "Напишите название компании."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddCarrierCompanyCompany").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddCarrierCompanyCompany").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(addCarrierCompany.AddCarrierCompanyStartDate === "")
	{
		isClearToAdd = 0;
		$("#AddCarrierCompanyStartDate").popover({"content": "Укажите дату начала работы."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddCarrierCompanyStartDate").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddCarrierCompanyStartDate").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(!addCarrierCompany.AddCarrierCompanyCurrentEmployment)
	{
		if(addCarrierCompany.AddCarrierCompanyEndDate === "")
		{
			isClearToAdd = 0;
			$("#AddCarrierCompanyEndDate").popover({"content": "Укажите дату окончания работы."})
								.popover("show")
								.parent().removeClass("has-success")
										.addClass("has-feedback has-error");
			setTimeout(function () 
				{
					$("#AddCarrierCompanyEndDate").popover("destroy");
				}, 3000);
		}
		else
		{
			$("#AddCarrierCompanyEndDate").parent().removeClass("has-error").addClass("has-feedback has-success");
		}
	}

	if(isClearToAdd)
	{
		$("#AddCarrierCompanyAddButton").button("loading");

		$.post("/cgi-bin/index.cgi?rand=" + Math.floor(Math.random() * 1000000000), 
						{
							"action" : "AJAX_addEditProfileAddCarrierCompany",
							"title": addCarrierCompany.AddCarrierCompanyTitle,
							"companyName": addCarrierCompany.AddCarrierCompanyCompany,
							"occupationStart": system_calls.ConvertMonthNameToNumber(addCarrierCompany.AddCarrierCompanyStartDate),
							"occupationFinish": system_calls.ConvertMonthNameToNumber(addCarrierCompany.AddCarrierCompanyEndDate),
							"currentCompany": addCarrierCompany.AddCarrierCompanyCurrentEmployment,
							"responsibilities": system_calls.FilterUnsupportedUTF8Symbols(addCarrierCompany.AddCarrierCompanyDescription)
						})
		.done(function(data) {
			var		resultJSON = JSON.parse(data);
			if(resultJSON.result == "success")
			{
				var newCarrierID = resultJSON.carrierID;
				var companyLogoFolder = resultJSON.logo_folder;
				var companyLogoFilename = resultJSON.logo_filename;
				var	newCompanyObj = {
										"companyID": newCarrierID, 
										"title": addCarrierCompany.AddCarrierCompanyTitle,
										"companyName": addCarrierCompany.AddCarrierCompanyCompany,
										"occupationStart": system_calls.ConvertMonthNameToNumber(addCarrierCompany.AddCarrierCompanyStartDate),
										"occupationFinish": system_calls.ConvertMonthNameToNumber(addCarrierCompany.AddCarrierCompanyEndDate),
										"currentCompany": addCarrierCompany.AddCarrierCompanyCurrentEmployment,
										"responsibilities": system_calls.ConvertTextToHTML(addCarrierCompany.AddCarrierCompanyDescription),
										"companyLogoFolder": companyLogoFolder,
										"companyLogoFilename": companyLogoFilename
									};
				AddCarrierPathToggleCollapsible();

				userProfile.companies.push(newCompanyObj);
				RenderCarrierPath();
				
				AddCarrierPathCollapsibleZeroize();			
			}
			else
			{
				system_calls.PopoverError("AddCarrierCompanyAddButton", resultJSON.description);
				console.debug("AddCarrierCompanyAddButton_ClickHandler: ERROR: adding new carrier path (" + resultJSON.description + ")");
			}
		})
		.fail(function() {
			system_calls.PopoverError("AddCarrierCompanyAddButton", "ошибка ответа сервера");
			console.debug("AddCarrierCompanyAddButton_ClickHandler: ERROR: fail to get response");
		}) // --- .always()
		.always(function() {
			$("#AddCarrierCompanyAddButton").button("reset");
		}) // --- .always()
		;
	}
};

var AddCertificationAddButton_ClickHandler = function()
{
	var		isClearToAdd = 1;

	addCertification.AddCertificationVendor = $("#AddCertificationVendor").val();
	addCertification.AddCertificationTitle = $("#AddCertificationTitle").val();
	addCertification.AddCertificationNumber = $("#AddCertificationNumber").val();

	if(addCertification.AddCertificationVendor === "")
	{
		isClearToAdd = 0;
		$("#AddCertificationVendor").popover({"content": "Напишите вендора сертификата."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddCertificationVendor").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddCertificationVendor").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(addCertification.AddCertificationTitle === "")
	{
		isClearToAdd = 0;
		$("#AddCertificationTitle").popover({"content": "Напишите название сертификата."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddCertificationTitle").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddCertificationTitle").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(addCertification.AddCertificationNumber === "")
	{
		isClearToAdd = 0;
		$("#AddCertificationNumber").popover({"content": "Напишите присвоенный номер."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddCertificationNumber").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddCertificationNumber").parent().removeClass("has-error").addClass("has-feedback has-success");
	}


	if(isClearToAdd)
	{
		$("#AddCertificationAddButton").button("loading");

		$.post("/cgi-bin/index.cgi?rand=" + Math.floor(Math.random() * 1000000000), 
						{
							"action" : "AJAX_addEditProfileAddCertificate",
							"vendor": system_calls.ConvertTextToHTML(addCertification.AddCertificationVendor),
							"track": system_calls.ConvertTextToHTML(addCertification.AddCertificationTitle),
							"number": system_calls.ConvertTextToHTML(addCertification.AddCertificationNumber)
						})
		.done(function(data) {
			var		resultJSON = JSON.parse(data);
			if(resultJSON.result == "success")
			{
				var	newCertificationObj = {
										"certificationID": resultJSON.certificationID,
										"certificationInternalID": resultJSON.certificationInternalID,
										"certificationPhotoFolder": resultJSON.certificationPhotoFolder,
										"certificationPhotoFilename": resultJSON.certificationPhotoFilename,
										"certificationVendor": system_calls.ConvertTextToHTML(addCertification.AddCertificationVendor),
										"certificationTrack": system_calls.ConvertTextToHTML(addCertification.AddCertificationTitle),
										"certificationNumber": system_calls.ConvertTextToHTML(addCertification.AddCertificationNumber)
									};
				AddCertificationPathToggleCollapsible();

				userProfile.certifications.push(newCertificationObj);
				RenderCertificationPath();

				AddCertificationPathCollapsibleZeroize();			
			}
			else
			{
				system_calls.PopoverError("AddCertificationAddButton", resultJSON.description);
				console.debug("AddCertificationAddButton_ClickHandler: ERROR: adding new certification path (" + resultJSON.description + ")");
			}
		})
		.fail(function() {
			system_calls.PopoverError("AddCertificationAddButton", "ошибка ответа сервера");
			console.debug("AddCertificationAddButton_ClickHandler: ERROR: fail to get response");
		}) // --- .always()
		.always(function() {
			$("#AddCertificationAddButton").button("reset");
		}) // --- .always()
		;
	}
};

var AddCourseAddButton_ClickHandler = function()
{

	var		isClearToAdd = 1;

	addCourse.AddCourseVendor = $("#AddCourseVendor").val();
	addCourse.AddCourseTitle = $("#AddCourseTitle").val();
	addCourse.AddCourseNumber = $("#AddCourseNumber").val();

	if(addCourse.AddCourseVendor === "")
	{
		isClearToAdd = 0;
		$("#AddCourseVendor").popover({"content": "Напишите вендора курса."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddCourseVendor").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddCourseVendor").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(addCourse.AddCourseTitle === "")
	{
		isClearToAdd = 0;
		$("#AddCourseTitle").popover({"content": "Напишите название курса."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddCourseTitle").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddCourseTitle").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(isClearToAdd)
	{
		$("#AddCourseAddButton").button("loading");

		$.post("/cgi-bin/index.cgi?random=" + Math.floor(Math.random() * 1000000000), 
						{
							"action": "AJAX_addEditProfileAddCourse",
							"vendor": system_calls.ConvertTextToHTML(addCourse.AddCourseVendor),
							"track": system_calls.ConvertTextToHTML(addCourse.AddCourseTitle)
						})
		.done(function(data) {
			var		resultJSON = JSON.parse(data);
			if(resultJSON.result == "success")
			{
				var	newCourseObj = {
										"courseID": resultJSON.courseID,
										"courseInternalID": resultJSON.courseInternalID,
										"courseVendor": system_calls.ConvertTextToHTML(addCourse.AddCourseVendor),
										"coursePhotoFolder": resultJSON.coursePhotoFolder,
										"coursePhotoFilename": resultJSON.coursePhotoFilename,
										"courseTrack": system_calls.ConvertTextToHTML(addCourse.AddCourseTitle)
									};
				AddCoursePathToggleCollapsible();

				userProfile.courses.push(newCourseObj);
				RenderCoursePath();

				AddCoursePathCollapsibleZeroize();			
			}
			else
			{
				system_calls.PopoverError("AddCourseAddButton", resultJSON.description);
				console.debug("AddCourseAddButton_ClickHandler: ERROR: adding new course path (" + resultJSON.description + ")");
			}
		}) // --- .done()
		.fail(function() {
			system_calls.PopoverError("AddCourseAddButton", "ошибка ответа сервера");
			console.debug("AddCourseAddButton_ClickHandler: ERROR: fail to get response");
		}) // --- .always()
		.always(function() {
			$("#AddCourseAddButton").button("reset");
		}) // --- .always()
		;
	}
};

var AddSchoolAddButton_ClickHandler = function()
{
	var		isClearToAdd = 1;

	addSchool.AddSchoolLocality = $("input#AddSchoolLocality").val();
	// addSchool.AddSchoolTitle = SchoolHumanFilter($("input#AddSchoolTitle").val());
	addSchool.AddSchoolPeriodStart = ($("#AddSchoolPeriodStart option:selected").length ? $("#AddSchoolPeriodStart option:selected").val() : "");
	addSchool.AddSchoolPeriodFinish = ($("#AddSchoolPeriodFinish option:selected").length ? $("#AddSchoolPeriodFinish option:selected").val() : "");

	if(addSchool.AddSchoolLocality === "")
	{
		isClearToAdd = 0;
		$("#AddSchoolLocality").popover({"content": "Укажите город в котором учились."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddSchoolLocality").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddSchoolLocality").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(addSchool.AddSchoolTitle === "")
	{
		isClearToAdd = 0;
		$("#AddSchoolTitle").popover({"content": "Напишите номер или название школы."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddSchoolTitle").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddSchoolTitle").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(addSchool.AddSchoolPeriodStart === "")
	{
		isClearToAdd = 0;
		$("#AddSchoolPeriodStart").popover({"content": "Укажите год начала обучения."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddSchoolPeriodStart").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddSchoolPeriodStart").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(addSchool.AddSchoolPeriodFinish === "")
	{
		isClearToAdd = 0;
		$("#AddSchoolPeriodFinish").popover({"content": "Укажите год окончания обучения."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddSchoolPeriodFinish").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddSchoolPeriodFinish").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if((addSchool.AddSchoolPeriodStart !== "") && (addSchool.AddSchoolPeriodFinish !== ""))
	{
		if(parseInt(addSchool.AddSchoolPeriodStart) > parseInt(addSchool.AddSchoolPeriodFinish))
		{
			isClearToAdd = 0;
			$("#AddSchoolPeriodStart").popover({"content": "Начало обучения должно быть раньше окончания."})
								.popover("show")
								.parent().removeClass("has-success")
										.addClass("has-feedback has-error");
			setTimeout(function () 
				{
					$("#AddSchoolPeriodStart").popover("destroy");
				}, 3000);

			$("#AddSchoolPeriodFinish").popover({"content": "Начало обучения должно быть раньше окончания."})
								.popover("show")
								.parent().removeClass("has-success")
										.addClass("has-feedback has-error");
			setTimeout(function () 
				{
					$("#AddSchoolPeriodFinish").popover("destroy");
				}, 3000);
		}		
	}

	if(isClearToAdd)
	{
		$("#AddSchoolAddButton").button("loading");

		$.post("/cgi-bin/index.cgi?rand=" + Math.floor(Math.random() * 1000000000), 
						{
							"action" : "AJAX_addEditProfileAddSchool",
							"locality": system_calls.ConvertTextToHTML(addSchool.AddSchoolLocality.replace(/\s+\(.*/, "")),
							"title": system_calls.ConvertTextToHTML(addSchool.AddSchoolTitle),
							"periodStart": system_calls.ConvertTextToHTML(addSchool.AddSchoolPeriodStart),
							"periodFinish": system_calls.ConvertTextToHTML(addSchool.AddSchoolPeriodFinish)
						})
		.done(function(data) {
			var		resultJSON = JSON.parse(data);
			if(resultJSON.result == "success")
			{
				var	newSchoolObj = {
										"schoolID": resultJSON.schoolID,
										"schoolInternalID": resultJSON.schoolInternalID,
										"schoolLocality": system_calls.ConvertTextToHTML(addSchool.AddSchoolLocality),
										"schoolTitle": system_calls.ConvertTextToHTML(addSchool.AddSchoolTitle),
										"schoolOccupationStart": system_calls.ConvertTextToHTML(addSchool.AddSchoolPeriodStart),
										"schoolOccupationFinish": system_calls.ConvertTextToHTML(addSchool.AddSchoolPeriodFinish),
										"schoolPhotoFolder": resultJSON.schoolPhotoFolder,
										"schoolPhotoFilename": resultJSON.schoolPhotoFilename
									};
				AddSchoolPathToggleCollapsible();

				userProfile.school.push(newSchoolObj);
				RenderSchoolPath();

				AddSchoolPathCollapsibleZeroize();			
			}
			else
			{
				system_calls.PopoverError("AddSchoolAddButton", resultJSON.description);
				console.debug("AddSchoolAddButton_ClickHandler: ERROR: adding new School path (" + resultJSON.description + ")");
			}
		})
		.fail(function() {
			system_calls.PopoverError("AddSchoolAddButton", "ошибка ответа сервера");
			console.debug("AddSchoolAddButton_ClickHandler: ERROR: fail to get response");
		}) // --- .always()
		.always(function() {
			$("#AddSchoolAddButton").button("reset");
		}) // --- .always()
		;
	}
};

var AddUniversityAddButton_ClickHandler = function()
{
	var		isClearToAdd = 1;

	addUniversity.AddUniversityTitle = $("input#AddUniversityTitle").val();
	addUniversity.AddUniversityRegion = ""; // --- assign it later on
	addUniversity.AddUniversityDegree = $("select#AddUniversityDegree option:selected").text();
	addUniversity.AddUniversityPeriodStart = ($("#AddUniversityPeriodStart option:selected").length ? $("#AddUniversityPeriodStart option:selected").val() : "");
	addUniversity.AddUniversityPeriodFinish = ($("#AddUniversityPeriodFinish option:selected").length ? $("#AddUniversityPeriodFinish option:selected").val() : "");

	if(addUniversity.AddUniversityTitle === "")
	{
		isClearToAdd = 0;
		$("#AddUniversityTitle").popover({"content": "Напишите название институа/университета."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddUniversityTitle").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddUniversityTitle").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	// --- check region selection
	if(($("input[name=radioButtonUniversityRegion]:checked").length) || ($("input#AddUniversityRegion").val().length))
	{
		// --- region picked from radio button (not "Other")
		if(($("input[name=radioButtonUniversityRegion]:checked").length) && ($("input[name=radioButtonUniversityRegion]:checked").val() != "Другое"))
		{
			addUniversity.AddUniversityRegion = $("input[name=radioButtonUniversityRegion]:checked").val();
		}
		// --- radio button eq "Others" or input field not empty
		else if($("input#AddUniversityRegion").val().length)
		{
			addUniversity.AddUniversityRegion = $("input#AddUniversityRegion").val();
		}
	}
	if(addUniversity.AddUniversityRegion === "")
	{
		isClearToAdd = 0;
		$("#AddUniversityRegion").popover({"content": "Укажите регион в котором учились."})
								.popover("show")
								.parent().removeClass("has-success")
								.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddUniversityRegion").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddUniversityRegion").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(addUniversity.AddUniversityDegree === "")
	{
		isClearToAdd = 0;
		$("#AddUniversityDegree").popover({"content": "Укажите полученную степень."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddUniversityDegree").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddUniversityDegree").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(addUniversity.AddUniversityPeriodStart === "")
	{
		isClearToAdd = 0;
		$("#AddUniversityPeriodStart").popover({"content": "Укажите год начала обучения."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddUniversityPeriodStart").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddUniversityPeriodStart").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(addUniversity.AddUniversityPeriodFinish === "")
	{
		isClearToAdd = 0;
		$("#AddUniversityPeriodFinish").popover({"content": "Укажите год окончания обучения."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddUniversityPeriodFinish").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddUniversityPeriodFinish").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if((addUniversity.AddUniversityPeriodStart !== "") && (addUniversity.AddUniversityPeriodFinish !== ""))
	{
		if(parseInt(addUniversity.AddUniversityPeriodStart) > parseInt(addUniversity.AddUniversityPeriodFinish))
		{
			isClearToAdd = 0;
			$("#AddUniversityPeriodStart").popover({"content": "Начало обучения должно быть раньше окончания."})
								.popover("show")
								.parent().removeClass("has-success")
										.addClass("has-feedback has-error");
			setTimeout(function () 
				{
					$("#AddUniversityPeriodStart").popover("destroy");
				}, 3000);

			$("#AddUniversityPeriodFinish").popover({"content": "Начало обучения должно быть раньше окончания."})
								.popover("show")
								.parent().removeClass("has-success")
										.addClass("has-feedback has-error");
			setTimeout(function () 
				{
					$("#AddUniversityPeriodFinish").popover("destroy");
				}, 3000);
		}		
	}

	if(isClearToAdd)
	{
		$("#AddUniversityAddButton").button("loading");

		$.post("/cgi-bin/index.cgi?rand=" + Math.floor(Math.random() * 1000000000), 
						{
							"action" : "AJAX_addEditProfileAddUniversity",
							"region": system_calls.ConvertTextToHTML(addUniversity.AddUniversityRegion),
							"title": system_calls.ConvertTextToHTML(addUniversity.AddUniversityTitle),
							"degree": system_calls.ConvertTextToHTML(addUniversity.AddUniversityDegree),
							"periodStart": system_calls.ConvertTextToHTML(addUniversity.AddUniversityPeriodStart),
							"periodFinish": system_calls.ConvertTextToHTML(addUniversity.AddUniversityPeriodFinish)
						})
		.done(function(data) {
			var		resultJSON = JSON.parse(data);
			if(resultJSON.result == "success")
			{
				var	newUniversityObj = {
										"universityID": resultJSON.universityID,
										"universityInternalID": resultJSON.universityInternalID,
										"universityRegion": system_calls.ConvertTextToHTML(addUniversity.AddUniversityRegion),
										"universityTitle": system_calls.ConvertTextToHTML(addUniversity.AddUniversityTitle),
										"universityDegree": system_calls.ConvertTextToHTML(addUniversity.AddUniversityDegree),
										"universityOccupationStart": system_calls.ConvertTextToHTML(addUniversity.AddUniversityPeriodStart),
										"universityOccupationFinish": system_calls.ConvertTextToHTML(addUniversity.AddUniversityPeriodFinish),
										"universityPhotoFolder": resultJSON.universityPhotoFolder,
										"universityPhotoFilename": resultJSON.universityPhotoFilename
									};
				AddUniversityPathToggleCollapsible();

				userProfile.university.push(newUniversityObj);
				RenderUniversityPath();

				AddUniversityPathCollapsibleZeroize();			
			}
			else
			{
				system_calls.PopoverError("AddUniversityAddButton", resultJSON.description);
				console.debug("AddUniversityAddButton_ClickHandler: ERROR: adding new university path (" + resultJSON.description + ")");
			}
		})
		.fail(function() {
			system_calls.PopoverError("AddUniversityAddButton", "ошибка ответа сервера");
			console.debug("AddUniversityAddButton_ClickHandler: ERROR: fail to get response");
		}) // --- .always()
		.always(function() {
			$("#AddUniversityAddButton").button("reset");
		}) // --- .always()
		;
	}
};

var AddLanguageAddButton_ClickHandler = function()
{
	var		isClearToAdd = 1;

	addLanguage.AddLanguageTitle = $("input#AddLanguageTitle").val();
	addLanguage.AddLanguageLevel = $("select#AddLanguageLevel option:selected").text();

	if(addLanguage.AddLanguageTitle === "")
	{
		isClearToAdd = 0;
		$("#AddLanguageTitle").popover({"content": "Укажите иностранный язык."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddLanguageTitle").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddLanguageTitle").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(addLanguage.AddLanguageLevel === "")
	{
		isClearToAdd = 0;
		$("#AddLanguageLevel").popover({"content": "Укажите уровень владения."})
							.popover("show")
							.parent().removeClass("has-success")
							.addClass("has-feedback has-error");
		setTimeout(function ()
			{
				$("#AddLanguageLevel").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddLanguageLevel").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(isClearToAdd)
	{
		$("#AddLanguageAddButton").button("loading");

		$.post("/cgi-bin/index.cgi?rand=" + Math.floor(Math.random() * 1000000000),
						{
							"action" : "AJAX_addEditProfileAddLanguage",
							"title": system_calls.ConvertTextToHTML(addLanguage.AddLanguageTitle),
							"level": system_calls.ConvertTextToHTML(addLanguage.AddLanguageLevel)
						})
		.done(function(data) {
			var		resultJSON = JSON.parse(data);
			if(resultJSON.result == "success")
			{
				var	newLanguageObj = {
										"languageID": resultJSON.languageID,
										"languageInternalID": resultJSON.languageInternalID,
										"languageTitle": system_calls.ConvertTextToHTML(addLanguage.AddLanguageTitle),
										"languageLevel": system_calls.ConvertTextToHTML(addLanguage.AddLanguageLevel),
										"languagePhotoFolder": resultJSON.languagePhotoFolder,
										"languagePhotoFilename": resultJSON.languagePhotoFilename
									};
				AddLanguagePathToggleCollapsible();

				userProfile.language.push(newLanguageObj);
				RenderLanguagePath();

				AddLanguagePathCollapsibleZeroize();			
			}
			else
			{
				system_calls.PopoverError("AddLanguageAddButton", resultJSON.description);
				console.debug("AddLanguageAddButton_ClickHandler: ERROR: adding new Language path (" + resultJSON.description + ")");
			}
		})
		.fail(function() {
			system_calls.PopoverError("AddLanguageAddButton", "ошибка ответа сервера");
			console.debug("AddLanguageAddButton_ClickHandler: ERROR: fail to get response");
		}) // --- .always()
		.always(function() {
			$("#AddLanguageAddButton").button("reset");
		}) // --- .always()
		;
	}
};

var AddSkillAddButton_ClickHandler = function()
{
	var		isClearToAdd = 1;

	addSkill.AddSkillTitle = $("input#AddSkillTitle").val();

	if(addSkill.AddSkillTitle === "")
	{
		isClearToAdd = 0;
		$("#AddSkillTitle").popover({"content": "Укажите сильну сторону."})
							.popover("show")
							.parent().removeClass("has-success")
									.addClass("has-feedback has-error");
		setTimeout(function () 
			{
				$("#AddSkillTitle").popover("destroy");
			}, 3000);
	}
	else
	{
		$("#AddSkillTitle").parent().removeClass("has-error").addClass("has-feedback has-success");
	}

	if(isClearToAdd)
	{
		$("#AddSkillAddButton").button("loading");

		$.post("/cgi-bin/index.cgi?rand=" + Math.floor(Math.random() * 1000000000), 
						{
							"action" : "AJAX_addEditProfileAddSkill",
							"title": system_calls.ConvertTextToHTML(addSkill.AddSkillTitle)
						})
		.done(function(data) {
			var		resultJSON = JSON.parse(data);
			if(resultJSON.result == "success")
			{
				var newSkillID = resultJSON.skillID;
				var	newSkillObj = {
										"skillID": newSkillID,
										"skillTitle": system_calls.ConvertTextToHTML(addSkill.AddSkillTitle)
									};
				AddSkillPathToggleCollapsible();

				userProfile.skill.push(newSkillObj);
				RenderSkillPath();

				AddSkillPathCollapsibleZeroize();			
			}
			else
			{
				system_calls.PopoverError("AddSkillAddButton", resultJSON.description);
				console.debug("AddSkillAddButton_ClickHandler: ERROR: adding new skill path (" + resultJSON.description + ")");
			}
		})
		.fail(function() {
			system_calls.PopoverError("AddSkillAddButton", "ошибка ответа сервера");
			console.debug("AddSkillAddButton_ClickHandler: ERROR: fail to get response");
		}) // --- .always()
		.always(function() {
			$("#AddSkillAddButton").button("reset");
		}) // --- .always()
		;
	}
};

var	AddBookComplainSubmit_ClickHandler = function(e)
{
	var		complainBookAuthor = $("#AddBookAuthor").val();
	var		complainBookTitle = $("#AddBookTitle").val();
	var		complainBookISBN10 = $("#AddBookISBN10").val();
	var		complainBookISBN13 = $("#AddBookISBN13").val();
	var		complainBookComment = $("#BookComplainModalComment").val();
	var		complainBookCover = $("#AddBookCoverDiv img").attr("src") || "";

	$("#BookComplainModal").modal("hide");

	$.getJSON("/cgi-bin/book.cgi?action=AJAX_complainBook", {complainBookAuthor: complainBookAuthor, complainBookTitle: complainBookTitle, complainBookISBN10: complainBookISBN10, complainBookISBN13: complainBookISBN13, complainBookCover: complainBookCover, complainBookComment: system_calls.ConvertTextToHTML(complainBookComment)})
		.done(function(data) {
			var		resultText;

			if(data.result === "success")
			{
				resultText = "Номер жалобы: " + data.id;
			}
			else
			{
				console.debug("AddBookComplainSubmit_ClickHandler: ERROR: " + data.description);
				resultText = data.description;
			}

			$("#BookComplainResultModal_ResultText").empty().append(resultText);
			setTimeout(function() {
				$("#BookComplainModalResult").modal("show");
			}, 300);
		});

};

var ComplainSpecifiedImageModal_Show = function()
{
	var		currTag = $(this);
	var		type = currTag.data("type");
	var		id = currTag.data("id");
	var		src = currTag.attr("src");

	$("#ImageComplainModal_Submit").removeData()
								.data("type", type)
								.data("id", id);
	$("#ImageComplainModal_Img").attr("src", src);

	$("#ImageComplainModal").modal("show");

};

var ComplainSpecifiedImageModal_Submit_ClickHandler = function()
{
	var		currTag = $(this);
	var		type = currTag.data("type");
	var		id = currTag.data("id");
	var		src = currTag.attr("src");

	$("#ImageComplainModal_Submit").removeData()
								.data("type", type)
								.data("id", id);

	$("#ImageComplainModal").modal("hide");

	$.getJSON("/cgi-bin/complain.cgi?action=AJAX_SubmitImageComplain", {id: id, type: type})
		.done(function(data) {
			var		resultText;

			if(data.result === "success")
			{
				resultText = "Номер жалобы: " + data.complains[0].id;
			}
			else
			{
				console.debug("AddBookComplainSubmit_ClickHandler: ERROR: " + data.description);
				resultText = data.description;
			}

			$("#BookComplainResultModal_ResultText").empty().append(resultText);
			setTimeout(function() {
				$("#BookComplainModalResult").modal("show");
			}, 300);
		});

};


var	AddBookComplainButton_ClickHandler = function(e)
{
	var		currTag = $(this);
	var		isClearToComplain = true;
	var		complainBookAuthor = $("#AddBookAuthor").val();
	var		complainBookTitle = $("#AddBookTitle").val();
	var		complainBookISBN10 = $("#AddBookISBN10").val();
	var		complainBookISBN13 = $("#AddBookISBN13").val();

	if(!(complainBookAuthor.length || complainBookTitle.length || complainBookISBN13.length || complainBookISBN10.length))
	{
		isClearToComplain = false;
	}

	if(isClearToComplain)
	{
		$("#BookComplainModal").modal("show");

		$("#BookComplainModalAuthor").empty().append(complainBookAuthor);
		$("#BookComplainModalTitle").empty().append(complainBookTitle);
		$("#BookComplainModalISBN10").empty().append(complainBookISBN10);
		$("#BookComplainModalISBN13").empty().append(complainBookISBN13);
		$("#BookComplainModalComment").val("");
		$("#BookComplainModalCover").empty().append($("#AddBookCoverDiv").html());
	}
	else
	{
		system_calls.PopoverError(currTag.attr("id"), "Вы не заполнили данные книги, подать жалобу не на что.");
	}

};

var AddBookAddButton_ClickHandler = function()
{
	var		isClearToAdd = 1;

	addBook.AddBookTitle = $("input#AddBookTitle").val();
	addBook.AddBookAuthor = $("input#AddBookAuthor").val();
	addBook.AddBookISBN10 = $("input#AddBookISBN10").val();
	addBook.AddBookISBN13 = $("input#AddBookISBN13").val();

	if(addBook.AddBookTitle === "")
	{
		isClearToAdd = 0;
		system_calls.PopoverError("AddBookTitle", "Укажите название книги.");
	}
	if(addBook.AddBookAuthor === "")
	{
		isClearToAdd = 0;
		system_calls.PopoverError("AddBookAuthor", "Укажите автора книги.");
	}
	if(addBook.AddBookISBN10.length && (addBook.AddBookISBN10.length < 10))
	{
		isClearToAdd = 0;
		system_calls.PopoverError("AddBookISBN10", "Неправильный ISBN10");
	}
	if(addBook.AddBookISBN13.length && (addBook.AddBookISBN13.length < 13))
	{
		isClearToAdd = 0;
		system_calls.PopoverError("AddBookISBN13", "Неправильный ISBN13");
	}

	if(isClearToAdd)
	{
		$("#AddBookAddButton").button("loading");

		$.post("/cgi-bin/book.cgi?rand=" + Math.floor(Math.random() * 1000000000), 
						{
							"action" : "AJAX_addEditProfileAddBook",
							"title": system_calls.ConvertTextToHTML(addBook.AddBookTitle),
							"author": system_calls.ConvertTextToHTML(addBook.AddBookAuthor),
							"isbn10": system_calls.ConvertTextToHTML(addBook.AddBookISBN10),
							"isbn13": system_calls.ConvertTextToHTML(addBook.AddBookISBN13)
						})
		.done(function(data) {
			var		resultJSON;

			try {
				resultJSON = JSON.parse(data);
	
				if(resultJSON.result == "success")
				{
					AddBookPathToggleCollapsible();

					userProfile.books = resultJSON.books;
					RenderBookPath();

					AddBookPathCollapsibleZeroize();
				}
				else
				{
					system_calls.PopoverError("AddBookAddButton", resultJSON.description);
					console.debug("AddBookAddButton_ClickHandler: ERROR: adding new book path (" + resultJSON.description + ")");
				}

			} catch(e) {
				ErrorModal("Сервер вернул не JSON-формат.");
			}

		})
		.fail(function(data) 
		{
			ErrorModal("Ошибка ответа сервера");
			console.debug("AddBookAddButton_ClickHandler: ERROR: fail to get response");
		})
		.always(function() {
			$("#AddBookAddButton").button("reset");
		}) // --- .always()
		;
	}
};

var GiftFilter_ClickHandler = function()
{
	var	curr_tag = $(this);
	var	curr_selection = $("div.btn-group.gift_filter > button.filter.btn-primary");

	if(curr_selection[0] != curr_tag[0])
	{
		var	filter_old = curr_selection.attr("data-filter");
		var	filter_new = curr_tag.attr("data-filter");

		curr_selection.toggleClass("btn-primary", "btn-default");
		curr_tag.toggleClass("btn-primary", "btn-default");

		$("div." + filter_old).not("div." + filter_new).hide(200);
		$("div." + filter_new).not("div." + filter_old).show(200);
	}

	return false;
};

var	GiftGrantorThank_ClickHandler = function()
{
	var		giftID = $("#GiftGrantorUserName").data("giftid");
	var		grantorUserID = $("#GiftGrantorUserName").data("userid");
	var		thankComment = $("#GiftGrantorThankModalComment").val();

	if(giftID && grantorUserID.length)
	{
		$("#GiftGrantorThankModal button").button("loading");

		$.getJSON("/cgi-bin/gift.cgi?action=AJAX_GiftThank", 
									{
										giftID: giftID,
										grantorUserID: grantorUserID,
										thankComment: system_calls.FilterUnsupportedUTF8Symbols(thankComment)
									})
			.done(function(data) {
				var		resultText;

				if(data.result === "success")
				{
				}
				else
				{
					console.debug("AddBookComplainSubmit_ClickHandler: ERROR: " + data.description);
				}

			})
			.fail(function(data) {
				console.error("ERROR parsing JSON response from server");
			})
			.always(function() {
				setTimeout(function() {
					$("#GiftGrantorThankModal button").button("reset");
					$("#GiftGrantorThankModal").modal("hide");
				}, 300);
			});
	}
	else
	{
		console.error("ERROR: giftID(" + giftID + ") or grantorUserID(" + grantorUserID + ") is empty");
		$("#GiftGrantorThankModal").modal("hide");
	}
};

var	isGiftObjectValid = function(gift)
{
	var	result = true;

	if(gift.AddGiftTitle === "")
	{
		result = false;
		system_calls.PopoverError($("input#AddGiftTitle"), "Добавте название");
	}
	if(gift.AddGiftLink.length)
	{
		if(system_calls.isValidHTTPURL(gift.AddGiftLink))
		{
		}
		else
		{
			result = false;
			system_calls.PopoverError($("input#AddGiftLink"), "Некорректрый URL (должен начинаться с http:// или https://)");
		}
	}

	return result;
};

var AddGiftButton_ClickHandler = function()
{
	var	curr_tag = $(this);

	addBook.AddGiftTitle = $("input#AddGiftTitle").val();
	addBook.AddGiftLink = $("input#AddGiftLink").val();
	addBook.AddGiftPrice = $("input#AddGiftPrice").val();
	addBook.AddGiftQuantity = $("input#AddGiftQuantity").val();
	addBook.AddGiftDescription = $("textarea#AddGiftDescription").val();

	if(isGiftObjectValid(addBook))
	{
		$("#AddGiftAddButton").button("loading");

		$.post("/cgi-bin/gift.cgi?rand=" + Math.floor(Math.random() * 1000000000), 
						{
							"action" : "AJAX_addGift",
							"title": system_calls.ConvertTextToHTML(addBook.AddGiftTitle),
							"link": system_calls.ConvertTextToHTML(addBook.AddGiftLink),
							"price": system_calls.ConvertTextToHTML(addBook.AddGiftPrice),
							"quantity": system_calls.ConvertTextToHTML(addBook.AddGiftQuantity),
							"description": system_calls.FilterUnsupportedUTF8Symbols(addBook.AddGiftDescription)
						})
		.done(function(data) 
		{
			var		resultJSON;

			try {
				resultJSON = JSON.parse(data);
	
				if(resultJSON.result == "success")
				{
					var		previewSrc = $("#AddGiftPreview").attr("src");
					var		previewGiftID = resultJSON.newGiftID;
					var		previewType = "gift";

					if(previewSrc != "/images/pages/edit_profile/cloud_arrow.jpg")
					{
						$("#AddGeneralCoverButton").data("uploadCoverID", previewGiftID);
						$("#AddGeneralCoverButton").data("uploadCoverType", previewType);
						AddGeneralCoverUploadChangeHandler({type:"image", src:previewSrc});
					}

					AddGiftPathToggleCollapsible();

					userProfile.gifts = resultJSON.gifts;
					RenderGiftPath();

					AddGiftPathCollapsibleZeroize();
				}
				else
				{
					system_calls.PopoverError("AddGiftAddButton", resultJSON.description);
					console.debug("AddGiftButton_ClickHandler: ERROR: adding new book path (" + resultJSON.description + ")");
				}

			} catch(e) {
				console.error("AddGiftButton_ClickHandler: ERROR: can't parse JSON response from server");
			}

		})
		.fail(function(data) 
		{
			ErrorModal("Ошибка ответа сервера");
			console.error("AddGiftButton_ClickHandler: ERROR: fail to get response");
		})
		.always(function() {
			$("#AddGiftAddButton").button("reset");
		}) // --- .always()
		;
	}
	else
	{
		system_calls.PopoverError(curr_tag, "Некоторые поля заролнены некорректно");
	}
};

var	GainedQuantityButton_ClickHandler = function(e)
{
	var		currTag = $(this);
	var		id = currTag.data("id");

	if(id)
	{
		currTag.button("loading");

		$.getJSON("/cgi-bin/gift.cgi?action=AJAX_GotIt", {id: id})
			.done(function(data) {
				if(data.result == "success")
				{
					$("#GainedQuantity" + id).empty().append(data.gained_quantity);
					if(data.potential_grantor_user.length == 1)
					{
						$("#GiftGrantorUserName")
												.data("userid", data.potential_grantor_user[0].id)
												.data("giftid", id)
												.empty()
												.append(data.potential_grantor_user[0].name + " " + data.potential_grantor_user[0].nameLast);
						$("#GiftGrantorThankModal").modal("show");
					}
				}
				else
				{
					system_calls.PopoverError(currTag.attr("id"), data.description);
				}
				setTimeout(function() { currTag.button("reset"); }, 500); 
			})
			.fail(function(data) {
				system_calls.PopoverError(currTag.attr("id"), "Ошибка ответа сервера");
				setTimeout(function() { currTag.button("reset"); }, 500); 
				console.error("ERROR parsing JSON response from server");
			});

	}
	else
	{
		console.error("data('id') not defined");
	}

};

var	AddAvatar_ClickHandler = function(e)
{
	var	currentTag = $(this);
	// var	upload_button_state = $("#");

	if(JSON_AvatarList.length < 3)
	{
		$("#fileupload").click();
	}
	else
	{
		system_calls.PopoverError(currentTag.attr("id"), "Уже загружено 3-и аватарки.");
	}
};

var	AutocompleteWithBookAuthors = function(e)
{
		var	AutocompleteSelectHandler = function(event, ui)
		{
			var	selectedID = ui.item.id;
			var selectedLabel = ui.item.label;

			console.debug("AutocompleteWithBookAuthors::AutocompleteSelectHandler: add selected value to input field");
		};

		var		currentTag = $(this);
		var		currentAction = currentTag.data("action");
		var		inputValue = $(this).val();

		if(inputValue.length == 3)
		{
			$.getJSON(
				"/cgi-bin/book.cgi",
				{action:"JSON_getBookAuthorListAutocomplete", lookForKey:inputValue})
				.done(function(data) {
						AutocompleteList = [];
						data.items.forEach(function(item, i, arr)
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
								console.debug ("autocompleteBookAuthor.OnInputHandler autocomplete.change: change event handler"); 
							},
							close: function (event, ui) 
							{ 
								console.debug ("autocompleteBookAuthor.OnInputHandler autocomplete.close: close event handler"); 
							},
							create: function () {
								console.debug ("autocompleteBookAuthor.OnInputHandler autocomplete.create: _create event handler"); 
							},
							_renderMenu: function (ul, items)  // --- requires plugin only
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
};

var	AutocompleteWithBookTitles = function(e)
{
		var	AutocompleteSelectHandler = function(event, ui)
		{
			// var	selectedID = ui.item.id;
			var selectedLabel = ui.item.label;

			console.debug("AutocompleteWithBookTitle::AutocompleteSelectHandler: add selected value to input field");
		};

		var		currentTag = $(this);
		var		currentAction = currentTag.data("action");
		var		inputValue = $(this).val();

		if(inputValue.length == 3)
		{
			$.getJSON(
				"/cgi-bin/book.cgi",
				{action:"JSON_getBookTitleListAutocomplete", lookForKey:inputValue})
				.done(function(data) {
						AutocompleteList = [];
						data.items.forEach(function(item, i, arr)
							{
								var	autocompleteLabel;
								var	obj;

								autocompleteLabel = "";

								if((item.name.length > 0))
								{
									if(autocompleteLabel.length > 0) { autocompleteLabel += " "; }
									autocompleteLabel += system_calls.ConvertHTMLToText(item.name);
								}

								AutocompleteList.push(autocompleteLabel);
							});
							jQuery.unique(AutocompleteList);


						currentTag.autocomplete({
							delay : 300,
							source: AutocompleteList,
							select: AutocompleteSelectHandler,
							change: function (event, ui) { 
								console.debug ("AutocompleteWithBookTitle.OnInputHandler autocomplete.change: change event handler"); 
							},
							close: function (event, ui) 
							{ 
								console.debug ("AutocompleteWithBookTitle.OnInputHandler autocomplete.close: close event handler"); 
								$("#AddBookAuthor").val("");
								AddBookPathPrefillISBNs();
							},
							create: function () {
								console.debug ("AutocompleteWithBookTitle.OnInputHandler autocomplete.create: _create event handler"); 
							},
							_renderMenu: function (ul, items)  // --- requires plugin only
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
};

var	AddCarrierPathCollapsibleCancel = function()
{
	$("div#AddCarrierCompany").empty();
};

var AddCarrierPathCollapsibleCurrentEmployment_ClickHandler = function()
{
	addCarrierCompany.currentEmployment ^= 1;
	addCarrierCompany.startDate.datepicker( "option", "maxDate", "");

	if(addCarrierCompany.currentEmployment)
	{
		$("div#AddCarrierCompany input#AddCarrierCompanyEndDate").parent().addClass("visibility_hidden");
		$("div#AddCarrierCompany span#AddCarrierCompanyCurrentEmployment img").attr("src", "/images/pages/common/checkbox_checked.png");
	}
	else
	{
		addCarrierCompany.startDate.datepicker( "option", "maxDate", $("div#AddCarrierCompany input#AddCarrierCompanyEndDate").val());

		$("div#AddCarrierCompany input#AddCarrierCompanyEndDate").parent().removeClass("visibility_hidden");
		$("div#AddCarrierCompany span#AddCarrierCompanyCurrentEmployment img").attr("src", "/images/pages/common/checkbox_unchecked.png");
	}
};

var ChangeCurrentStatus_ClickHandler = function()
{
	var	changeCompanyStatusID = $(this).data("id");

	userProfile.companies.forEach(function(item, i, arr) {
		if(item.companyID == changeCompanyStatusID)
		{
			if(item.currentCompany == "0")
			{
				item.currentCompany = "1";
			}	
			else
			{
				item.currentCompany = "0";
			}

			$.getJSON("/cgi-bin/index.cgi?action=AJAX_changeEditProfileCompanyEmploymentEndDateStatus", {companyID: item.companyID})
				.done(function(data) {
					if(data.result === "success")
					{
					}
					else
					{
						console.debug("ChangeCurrentStatus_ClickHandler: ERROR: " + data.description);
					}
				});

		}
	});

	RenderCarrierPath();
};

var	RenderCVandTitle = function()
{
	$("span#firstName.editableSpan").on("click", editableFuncReplaceToInput);
	$("span#firstName.editableSpan").mouseenter(editableFuncHighlightBgcolor);
	$("span#firstName.editableSpan").mouseleave(editableFuncNormalizeBgcolor);
	$("span#lastName.editableSpan").on("click", editableFuncReplaceToInput);
	$("span#lastName.editableSpan").mouseenter(editableFuncHighlightBgcolor);
	$("span#lastName.editableSpan").mouseleave(editableFuncNormalizeBgcolor);

	$("p#userCV.editableParagraph").on("click", editableFuncReplaceToTextarea);
	$("p#userCV.editableParagraph").mouseenter(editableFuncHighlightBgcolor);
	$("p#userCV.editableParagraph").mouseleave(editableFuncNormalizeBgcolor);
};

var	UpdateUserSex = function(userSex)
{
	$.getJSON("/cgi-bin/account.cgi?action=AJAX_changeUserSex", {userSex: userSex})
		.done(function(data) {
			if(data.result === "success")
			{
			}
			else
			{
				console.debug("UpdateUserSex: ERROR: " + data.description);
			}
		});
};

var	RenderCity = function()
{
	$("#city")
				.empty().append(userProfile.city.length ? userProfile.city : "(не указан)")
				.addClass("editableSpan")
				.data("action", "AJAX_updateCity")
				.data("script", "account.cgi");

	$("#city.editableSpan").on("click", editableFuncReplaceToInput);
	$("#city.editableSpan").mouseenter(editableFuncHighlightBgcolor);
	$("#city.editableSpan").mouseleave(editableFuncNormalizeBgcolor);
};

var	RenderUserSex = function()
{
	var		result = $();
	var		currentEmploymentText = "";
	var		elementID;

	if(typeof(userProfile) == "undefined")
	{
		return;
	}

	if(userProfile.sex == "male") elementID = "#sexMale";
	if(userProfile.sex == "female") elementID = "#sexFemale";

	$(elementID).prop("checked", true);

	$("input#sexMale").on("click", function() { UpdateUserSex("male"); });
	$("input#sexFemale").on("click", function () { UpdateUserSex("female"); });

};

var	RenderUserBirthday = function()
{
	var		result = $();
	var		currentEmploymentText = "";
	var		elementID;
	var		spanTimestamp = $("<span>").addClass("birthdayTimestamp editableSpan formatDate")
										.data("id", "not used")
										.data("action", "AJAX_changeUserBirthday")
										.data("script", "account.cgi");

	if(typeof(userProfile) == "undefined")
	{
		return;
	}
	
	spanTimestamp.append(system_calls.ConvertDateRussiaToHuman(userProfile.birthday));
	$("#paragraphBirthday").append(spanTimestamp);

	$("p#paragraphBirthday .editableSpan").on("click", editableFuncReplaceToInput);
	$("p#paragraphBirthday .editableSpan").mouseenter(editableFuncHighlightBgcolor);
	$("p#paragraphBirthday .editableSpan").mouseleave(editableFuncNormalizeBgcolor);

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
		var		divCover = $("<div>").addClass("col-xs-5 col-sm-1 col-sm-pull-7");
		var		divTimeline = $("<div>").addClass("col-xs-5 col-sm-2");
		var		divClose = $("<div>").addClass("col-xs-2 col-sm-2");
		var		paragraphTimeline = $("<p>");


		// --- class.formatDate used for identify this span as a Date
		// --- class.datePick used to identify field as StartEmployment
		var		spanStartEmployment = $("<span>").attr("data-id", item.companyID)
												.attr("data-action", "update_occupation_start")
												.addClass("occupation_start datePick formatDate")
												.append(system_calls.ConvertMonthNumberToAbbrName(item.occupationStart));
		var		spanFinishEmployment = $("<span>").attr("data-id", item.companyID)
												.attr("data-action", "update_occupation_finish")
												.addClass("occupation_finish editableSpan formatDate")
												.append(system_calls.ConvertMonthNumberToAbbrName(item.occupationFinish));

		var		spanCurrentPosition = $("<img>").addClass("custom_checkbox animateClass")
												.attr("src", (item.currentCompany == "1" ? "/images/pages/common/checkbox_checked.png" : "/images/pages/common/checkbox_unchecked.png"))
												.attr("data-id", item.companyID)
												.attr("data-currentcompany", item.currentCompany);

		var		paragraphEmployment = $("<p>");
		var		spanJobTitle = $("<span>").attr("data-id", item.companyID)
												.attr("data-action", "updateJobTitle")
												.addClass("jobTitle editableSpan")
												.append(item.title);
		var		spanCompanyName = $("<span>").attr("data-id", item.companyID)
												.attr("data-action", "updateCompanyName")
												.addClass("companyName ")
												.append(item.companyName);

		var		spanCurrentPositionText = $("<span>").append("<br>(").append(spanCurrentPosition).append(" настоящее время)")
													.addClass("cursor_pointer")
													.data("id", item.companyID)
													.data("action", "AJAX_changeCurrentStatus")
													.hover(
														function() {
															$(this).children("img").data("initial_src", $(this).children("img").attr("src"));
															$(this).children("img").attr("src", "/images/pages/common/checkbox_animated.gif"); 
															$(this).addClass("editable_highlighted_class", 400);
														}, 
														function() {
															$(this).children("img").attr("src", $(this).children("img").data("initial_src")); 
															$(this).removeClass("editable_highlighted_class", 200, "easeInOutCirc");
														})
													.on("click", ChangeCurrentStatus_ClickHandler);
		var		spanClose = $("<span>").attr("data-id", item.companyID)
										.attr("data-action", "AJAX_removeCompanyExperience")
										.attr("aria-hidden", "true")
										.addClass("glyphicon glyphicon-remove animateClass removeCompanyExperience");

		var		imgCover;

		if((typeof(item.companyLogoFolder) != "undefined") && (typeof(item.companyLogoFilename) != "undefined") && (item.companyLogoFolder.length) && (item.companyLogoFilename.length))
			imgCover = $("<img>").addClass("max_100percents_100px  niceborder")
								.attr("src", "/images/companies/" + item.companyLogoFolder + "/" + item.companyLogoFilename)
								.attr("data-type", "company")
								.data("id", item.companyInternalID)
								.on("click", ComplainSpecifiedImageModal_Show);
		else
			imgCover = $("<img>").addClass("max_100percents_100px")
								.attr("src", "/images/pages/common/empty_2.png");

		result = result.add(divRowTitle);

		if(item.currentCompany == "1")
		{
			if(currentEmploymentText.length)
			{
				currentEmploymentText += "<br> ";
			}
			currentEmploymentText += item.companyName;			
		}

		divRowTitle.append(divEmployment.append(paragraphEmployment).append(spanJobTitle).append(" в ").append(spanCompanyName));
		divRowTitle.append(divCover.append(imgCover));
		divRowTitle.append(divTimeline.append(paragraphTimeline.append("c ")
																.append(spanStartEmployment)
																.append("<br>по ")
																.append((item.currentCompany == "1" ? "" : spanFinishEmployment))
																.append(spanCurrentPositionText)));
		divRowTitle.append(divClose.append(spanClose));


		var		divRowResponsibilities = $("<div>").addClass("row")
												.attr("id", "responsibilities" + item.companyID);
		var		divResponsibilities = $("<div>").addClass("col-xs-12 col-sm-offset-1 col-sm-9");
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

	$("div#CarrierPath .editableSpan").on("click", editableFuncReplaceToInput);
	$("div#CarrierPath .editableSpan").mouseenter(editableFuncHighlightBgcolor);
	$("div#CarrierPath .editableSpan").mouseleave(editableFuncNormalizeBgcolor);

	$("div#CarrierPath .datePick").on("click", editableFuncReplaceToInput);
	$("div#CarrierPath .datePick").mouseenter(editableFuncHighlightBgcolor);
	$("div#CarrierPath .datePick").mouseleave(editableFuncNormalizeBgcolor);

	$("div#CarrierPath .editableParagraph").on("click", editableFuncReplaceToTextarea);
	$("div#CarrierPath .editableParagraph").mouseenter(editableFuncHighlightBgcolor);
	$("div#CarrierPath .editableParagraph").mouseleave(editableFuncNormalizeBgcolor);

	$("div#CarrierPath .removeCompanyExperience").on("click", removeCompanyExperience);
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
		var		divCertificationNumber = $("<div>").addClass("col-xs-5 col-sm-2");
		var		divClose = $("<div>").addClass("col-xs-2 col-sm-2");

		var		paragraphCertification = $("<p>");
		var		spanVendor = $("<span>").attr("data-id", item.certificationID)
										.attr("data-action", "updateCertificationVendor")
										.addClass("certificationVendor ")
										.append(item.certificationVendor);
		var		spanTrack = $("<span>").attr("data-id", item.certificationID)
										.attr("data-action", "updateCertificationTrack")
										.addClass("certificationTrack ")
										.append(item.certificationTrack);
		var		spanNumber = $("<span>").attr("data-id", item.certificationID)
										.attr("data-action", "updateCertificationNumber")
										.addClass("certificationNumber editableSpan")
										.append(item.certificationNumber);

		var		spanClose = $("<span>").attr("data-id", item.certificationID)
										.attr("data-action", "AJAX_removeCertificationEntry")
										.attr("aria-hidden", "true")
										.addClass("glyphicon glyphicon-remove animateClass removeCertificationEntry");

		var		imgCover;

		if((typeof(item.certificationPhotoFolder) != "undefined") && (typeof(item.certificationPhotoFilename) != "undefined") && (item.certificationPhotoFolder.length) && (item.certificationPhotoFilename.length))
			imgCover = $("<img>").addClass("max_100percents_100px  niceborder")
								.attr("data-type", "certification")
								.data("id", item.certificationInternalID)
								.on("click", ComplainSpecifiedImageModal_Show)
								.attr("src", "/images/certifications/" + item.certificationPhotoFolder + "/" + item.certificationPhotoFilename);
		else
			imgCover = $("<img>").addClass("max_100percents_100px  scale_1_2 cursor_pointer")
								.attr("src", "/images/pages/edit_profile/cloud_arrow.jpg")
								.attr("id", "editProfileCoverCertificationID" + item.certificationInternalID)
								.attr("data-type", "certification")
								.data("id", item.certificationInternalID)
								.on("click", AddCoverUpload_ClickHandler);

		result = result.add(divRowCertification);

		divRowCertification .append(divCertification.append(paragraphCertification).append(spanVendor).append(": ").append(spanTrack))
							.append(divCover.append(imgCover))
							.append(divCertificationNumber.append("№ ").append(spanNumber))
							.append(divClose.append(spanClose));
	});

	$("div#CertificationPath").append(result);

	$("div#CertificationPath .editableSpan").on("click", editableFuncReplaceToInput);
	$("div#CertificationPath .editableSpan").mouseenter(editableFuncHighlightBgcolor);
	$("div#CertificationPath .editableSpan").mouseleave(editableFuncNormalizeBgcolor);

	$("div#CertificationPath .editableParagraph").on("click", editableFuncReplaceToTextarea);
	$("div#CertificationPath .editableParagraph").mouseenter(editableFuncHighlightBgcolor);
	$("div#CertificationPath .editableParagraph").mouseleave(editableFuncNormalizeBgcolor);

	$("div#CertificationPath .removeCertificationEntry").on("click", removeCompanyExperience);
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
										.attr("id", "school" + item.schoolID);

		var		divSchoolTitle = $("<div>").addClass("col-xs-12 col-sm-7 col-sm-push-1");
		var		divSchoolOccupation = $("<div>").addClass("col-xs-5 col-sm-2");
		var		paragraphSchool = $("<p>");
		var		spanOccupationStart = $("<span>").attr("data-id", item.schoolID)
												.attr("data-action", "updateSchoolOccupationStart")
												.addClass("schoolOccupationStart editableSelectYears19302017")
												.append(item.schoolOccupationStart);
		var		spanOccupationFinish = $("<span>").attr("data-id", item.schoolID)
												.attr("data-action", "updateSchoolOccupationFinish")
												.addClass("schoolOccupationFinish editableSelectYears19302017")
												.append(item.schoolOccupationFinish);
		var		spanLocality = $("<span>").attr("data-id", item.schoolID)
												.attr("data-action", "updateSchoolLocality")
												.addClass("schoolLocality ")
												.append(item.schoolLocality);
		var		spanTitle = $("<span>").attr("data-id", item.schoolID)
												.attr("data-action", "updateSchoolTitle")
												.addClass("schoolTitle ")
												.append(item.schoolTitle);

		var		divClose = $("<div>").addClass("col-xs-2 col-sm-2");
		var		spanClose = $("<span>").attr("data-id", item.schoolID)
										.attr("data-action", "AJAX_removeSchoolEntry")
										.attr("aria-hidden", "true")
										.addClass("glyphicon glyphicon-remove animateClass removeSchoolEntry");

		var		divCover = $("<div>").addClass("col-xs-5 col-sm-1 col-sm-pull-7");
		var		imgCover;

		if((typeof(item.schoolPhotoFolder) != "undefined") && (typeof(item.schoolPhotoFilename) != "undefined") && (item.schoolPhotoFolder.length) && (item.schoolPhotoFilename.length))
			imgCover = $("<img>").addClass("max_100percents_100px  niceborder")
								.attr("src", "/images/schools/" + item.schoolPhotoFolder + "/" + item.schoolPhotoFilename)
								.attr("data-type", "school")
								.data("id", item.schoolInternalID)
								.on("click", ComplainSpecifiedImageModal_Show);
		else
			imgCover = $("<img>").addClass("max_100percents_100px  scale_1_2 cursor_pointer")
								.attr("src", "/images/pages/edit_profile/cloud_arrow.jpg")
								.attr("id", "editProfileCoverSchoolID" + item.schoolInternalID)
								.on("click", AddCoverUpload_ClickHandler)
								.attr("data-type", "school")
								.data("id", item.schoolInternalID);


		result = result.add(divRowSchool);

		divRowSchool.append(divSchoolTitle.append(paragraphSchool).append(spanLocality).append(" школа ").append(spanTitle))
					.append(divCover.append(imgCover))
					.append(divSchoolOccupation.append(spanOccupationStart).append(" - ").append(spanOccupationFinish))
					.append(divClose.append(spanClose));
	});

	$("div#SchoolPath").append(result);

	$("div#SchoolPath .editableSelectYears19302017").on("click", editableFuncReplaceSpanToSelect20171930);
	$("div#SchoolPath .editableSelectYears19302017").mouseenter(editableFuncHighlightBgcolor);
	$("div#SchoolPath .editableSelectYears19302017").mouseleave(editableFuncNormalizeBgcolor);

	$("div#SchoolPath .editableSpan").on("click", editableFuncReplaceToInput);
	$("div#SchoolPath .editableSpan").mouseenter(editableFuncHighlightBgcolor);
	$("div#SchoolPath .editableSpan").mouseleave(editableFuncNormalizeBgcolor);

	$("div#SchoolPath .editableParagraph").on("click", editableFuncReplaceToTextarea);
	$("div#SchoolPath .editableParagraph").mouseenter(editableFuncHighlightBgcolor);
	$("div#SchoolPath .editableParagraph").mouseleave(editableFuncNormalizeBgcolor);

	$("div#SchoolPath .removeSchoolEntry").on("click", removeCompanyExperience);
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
										.attr("id", "university" + item.universityID);

		var		divUniversityTitle = $("<div>").addClass("col-xs-12 col-sm-7 col-sm-push-1");
		var		divUniversityOccupation = $("<div>").addClass("col-xs-5 col-sm-2");
		var		paragraphUniversity = $("<p>");
		var		spanOccupationStart = $("<span>").attr("data-id", item.universityID)
												.attr("data-action", "updateUniversityOccupationStart")
												.addClass("UniversityOccupationStart editableSelectYears19302017")
												.append(item.universityOccupationStart);
		var		spanOccupationFinish = $("<span>").attr("data-id", item.universityID)
												.attr("data-action", "updateUniversityOccupationFinish")
												.addClass("UniversityOccupationFinish editableSelectYears19302017")
												.append(item.universityOccupationFinish);
		var		spanDegree = $("<span>").attr("data-id", item.universityID)
												.attr("data-action", "updateUniversityDegree")
												.addClass("UniversityRegion editableSelectUniversityDegree")
												.append(item.universityDegree);
		var		spanRegion = $("<span>").attr("data-id", item.universityID)
												.attr("data-action", "updateUniversityRegion")
												.addClass("UniversityRegion ")
												.append(item.universityRegion);
		var		spanTitle = $("<span>").attr("data-id", item.universityID)
												.attr("data-action", "updateUniversityTitle")
												.addClass("UniversityTitle ")
												.append(item.universityTitle);

		var		divClose = $("<div>").addClass("col-xs-2 col-sm-2");
		var		spanClose = $("<span>").attr("data-id", item.universityID)
										.attr("data-action", "AJAX_removeUniversityEntry")
										.attr("aria-hidden", "true")
										.addClass("glyphicon glyphicon-remove animateClass removeUniversityEntry");

		var		divCover = $("<div>").addClass("col-xs-5 col-sm-1 col-sm-pull-7");
		var		imgCover;

		if((typeof(item.universityPhotoFolder) != "undefined") && (typeof(item.universityPhotoFilename) != "undefined") && (item.universityPhotoFolder.length) && (item.universityPhotoFilename.length))
			imgCover = $("<img>").addClass("max_100percents_100px  niceborder")
								.attr("src", "/images/universities/" + item.universityPhotoFolder + "/" + item.universityPhotoFilename)
								.attr("data-type", "university")
								.data("id", item.universityInternalID)
								.on("click", ComplainSpecifiedImageModal_Show);
		else
			imgCover = $("<img>").addClass("max_100percents_100px  scale_1_2 cursor_pointer")
								.attr("src", "/images/pages/edit_profile/cloud_arrow.jpg")
								.attr("id", "editProfileCoverUniversityID" + item.universityInternalID)
								.on("click", AddCoverUpload_ClickHandler)
								.attr("data-type", "university")
								.data("id", item.universityInternalID);

		result = result.add(divRowUniversity);

		divRowUniversity.append(divUniversityTitle.append(paragraphUniversity).append(spanDegree).append(" в ").append(spanTitle).append(" (").append(spanRegion).append(")"))
						.append(divCover.append(imgCover))
						.append(divUniversityOccupation.append(spanOccupationStart).append(" - ").append(spanOccupationFinish))
						.append(divClose.append(spanClose));

		educationInTitle += item.universityTitle + "<br>";
	});

	$("p#educationInTitle").html(educationInTitle);
	$("div#UniversityPath").append(result);

	$("div#UniversityPath .editableSelectYears19302017").on("click", editableFuncReplaceSpanToSelect20171930);
	$("div#UniversityPath .editableSelectYears19302017").mouseenter(editableFuncHighlightBgcolor);
	$("div#UniversityPath .editableSelectYears19302017").mouseleave(editableFuncNormalizeBgcolor);

	$("div#UniversityPath .editableSelectUniversityDegree").on("click", editableFuncReplaceSpanToSelectUniversityDegree);
	$("div#UniversityPath .editableSelectUniversityDegree").mouseenter(editableFuncHighlightBgcolor);
	$("div#UniversityPath .editableSelectUniversityDegree").mouseleave(editableFuncNormalizeBgcolor);

	$("div#UniversityPath .editableSpan").on("click", editableFuncReplaceToInput);
	$("div#UniversityPath .editableSpan").mouseenter(editableFuncHighlightBgcolor);
	$("div#UniversityPath .editableSpan").mouseleave(editableFuncNormalizeBgcolor);

	$("div#UniversityPath .editableParagraph").on("click", editableFuncReplaceToTextarea);
	$("div#UniversityPath .editableParagraph").mouseenter(editableFuncHighlightBgcolor);
	$("div#UniversityPath .editableParagraph").mouseleave(editableFuncNormalizeBgcolor);

	$("div#UniversityPath .removeUniversityEntry").on("click", removeCompanyExperience);
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
	userProfile.courses.forEach( function(item, i, arr)
	{
		var		usersCoursesID = item.courseID;
		var		courseID = item.courseInternalID;

		var		divRowCourse = $("<div>").addClass("row")
											.attr("id", "course" + usersCoursesID);

		var		divCourse = $("<div>").addClass("col-xs-12 col-sm-7 col-sm-push-1");
		var		divCover = $("<div>").addClass("col-xs-5 col-sm-1 col-sm-pull-7");
		var		divTimestamp = $("<div>").addClass("col-xs-5 col-sm-2");
		var		divClose = $("<div>").addClass("col-xs-2 col-sm-2");

		var		paragraphCourse = $("<p>");
		var		spanVendor = $("<span>").attr("data-id", usersCoursesID)
												.attr("data-action", "updateCourseVendor")
												.addClass("courseVendor ")
												.append(item.courseVendor);
		var		spanTrack = $("<span>").attr("data-id", usersCoursesID)
												.attr("data-action", "updateCourseTrack")
												.addClass("courseTrack ")
												.append(item.courseTrack);


		var		spanClose = $("<span>").attr("data-id", usersCoursesID)
										.attr("data-action", "AJAX_removeCourseEntry")
										.attr("aria-hidden", "true")
										.addClass("glyphicon glyphicon-remove animateClass removeCourseEntry");

		var		imgCover;

		var		ratingCallback = function(rating)
								{
									var		id = $(this).data("id");

									$.getJSON("/cgi-bin/index.cgi?action=AJAX_setCourseRating", {id: usersCoursesID, rating: rating, rand: Math.round(Math.random() * 100000000)})
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
								.data("id", item.courseInternalID)
								.on("click", ComplainSpecifiedImageModal_Show);
		else
			imgCover = $("<img>").addClass("max_100percents_100px  scale_1_2 cursor_pointer")
								.attr("src", "/images/pages/edit_profile/cloud_arrow.jpg")
								.attr("id", "editProfileCoverCourseID" + item.courseInternalID)
								.on("click", AddCoverUpload_ClickHandler)
								.attr("data-type", "course")
								.data("id", item.courseInternalID);

		result = result.add(divRowCourse);

		divCourse	.append(paragraphCourse).append(spanVendor).append(": ").append(spanTrack).append("<br>")
					.append(system_calls.RenderRating("editProfileCourseRating" + courseID, item.courseRating, ratingCallback));
		divRowCourse.append(divCourse)
					.append(divCover.append(imgCover))
					.append(divTimestamp)
					.append(divClose.append(spanClose));
	});

	$("div#CoursePath").append(result);


	$("div#CoursePath .editableSpan").on("click", editableFuncReplaceToInput);
	$("div#CoursePath .editableSpan").mouseenter(editableFuncHighlightBgcolor);
	$("div#CoursePath .editableSpan").mouseleave(editableFuncNormalizeBgcolor);

	$("div#CoursePath .editableParagraph").on("click", editableFuncReplaceToTextarea);
	$("div#CoursePath .editableParagraph").mouseenter(editableFuncHighlightBgcolor);
	$("div#CoursePath .editableParagraph").mouseleave(editableFuncNormalizeBgcolor);

	$("div#CoursePath .removeCourseEntry").on("click", removeCompanyExperience);
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
											.attr("id", "language" + item.languageID);

		var		divLanguage = $("<div>").addClass("col-xs-5 col-sm-9");
		var		paragraphLanguage = $("<p>");
		var		spanTitle = $("<span>").attr("data-id", item.languageID)
												.attr("data-action", "updateLanguageTitle")
												.addClass("LanguageTitle ")
												.append(item.languageTitle);
		var		spanLevel = $("<span>").attr("data-id", item.languageID)
												.attr("data-action", "updateLanguageLevel")
												.addClass("LanguageLevel editableSelectLanguageLevel")
												.append(item.languageLevel);

		var		divClose = $("<div>").addClass("col-xs-2 col-sm-2");
		var		spanClose = $("<span>").attr("data-id", item.languageID)
										.attr("data-action", "AJAX_removeLanguageEntry")
										.attr("aria-hidden", "true")
										.addClass("glyphicon glyphicon-remove animateClass removeLanguageEntry");

		var		divCover = $("<div>").addClass("col-xs-5 col-sm-1");
		var		imgCover;

		if((typeof(item.languagePhotoFolder) != "undefined") && (typeof(item.languagePhotoFilename) != "undefined") && (item.languagePhotoFolder.length) && (item.languagePhotoFilename.length))
			imgCover = $("<img>").addClass("max_100percents_100px  niceborder")
								.attr("src", "/images/flags/" + item.languagePhotoFolder + "/" + item.languagePhotoFilename)
								.attr("data-type", "language")
								.data("id", item.languageInternalID)
								.on("click", ComplainSpecifiedImageModal_Show);
		else
			imgCover = $("<img>").addClass("max_100percents_100px  scale_1_2 cursor_pointer")
								.attr("src", "/images/pages/edit_profile/cloud_arrow.jpg")
								.attr("id", "editProfileCoverLanguageID" + item.languageInternalID)
								.on("click", AddCoverUpload_ClickHandler)
								.attr("data-type", "language")
								.data("id", item.languageInternalID);

		result = result.add(divRowLanguage);

		divRowLanguage	.append(divCover.append(imgCover))
						.append(divLanguage.append(paragraphLanguage.append(spanTitle).append(" ").append(spanLevel)))
						.append(divClose.append(spanClose));
	});

	$("div#LanguagePath").append(result);

	$("div#LanguagePath .editableSpan").on("click", editableFuncReplaceToInput);
	$("div#LanguagePath .editableSpan").mouseenter(editableFuncHighlightBgcolor);
	$("div#LanguagePath .editableSpan").mouseleave(editableFuncNormalizeBgcolor);

	$("div#LanguagePath .editableSelectLanguageLevel").on("click", editableFuncReplaceSpanToSelectLanguageLevel);
	$("div#LanguagePath .editableSelectLanguageLevel").mouseenter(editableFuncHighlightBgcolor);
	$("div#LanguagePath .editableSelectLanguageLevel").mouseleave(editableFuncNormalizeBgcolor);

	$("div#LanguagePath .editableParagraph").on("click", editableFuncReplaceToTextarea);
	$("div#LanguagePath .editableParagraph").mouseenter(editableFuncHighlightBgcolor);
	$("div#LanguagePath .editableParagraph").mouseleave(editableFuncNormalizeBgcolor);

	$("div#LanguagePath .removeLanguageEntry").on("click", removeCompanyExperience);
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
			var		titleA = a.skillTitle;
			var		titleB = b.skillTitle;
			var		result;

			if(titleA == titleB) { result = 0; }
			if(titleA > titleB) { result = 1; }
			if(titleA < titleB) { result = -1; }

			return result;
		});
	userProfile.skill.forEach( function(item, i, arr) {
		var		divRowSkill = $("<div>").addClass("row")
											.attr("id", "skill" + item.skillID);

		var		divSkill = $("<div>").addClass("col-xs-10 col-sm-9 col-sm-offset-1");
		var		paragraphSkill = $("<p>");
		var		spanTitle = $("<span>").attr("data-id", item.skillID)
												.attr("data-action", "updateSkillTitle")
												.addClass("skillTitle ")
												.append(item.skillTitle);

		var		divClose = $("<div>").addClass("col-xs-2");
		var		spanClose = $("<span>").attr("data-id", item.skillID)
										.attr("data-action", "AJAX_removeSkillEntry")
										.attr("aria-hidden", "true")
										.addClass("glyphicon glyphicon-remove animateClass removeSkillEntry");

		result = result.add(divRowSkill);

		divRowSkill.append(divSkill.append(paragraphSkill.append(spanTitle)));
		divRowSkill.append(divClose.append(spanClose));
	});

	$("div#SkillPath").append(result);

	$("div#SkillPath .editableSpan").on("click", editableFuncReplaceToInput);
	$("div#SkillPath .editableSpan").mouseenter(editableFuncHighlightBgcolor);
	$("div#SkillPath .editableSpan").mouseleave(editableFuncNormalizeBgcolor);

	$("div#SkillPath .editableParagraph").on("click", editableFuncReplaceToTextarea);
	$("div#SkillPath .editableParagraph").mouseenter(editableFuncHighlightBgcolor);
	$("div#SkillPath .editableParagraph").mouseleave(editableFuncNormalizeBgcolor);

	$("div#SkillPath .removeSkillEntry").on("click", removeCompanyExperience);
};

var	RenderGiftPath = function()
{
	var		result = $();

	if(typeof(userProfile) == "undefined")
	{
		return;
	}

	$("div#GiftPath").empty();
	userProfile.gifts.sort(function(a, b)
		{
			var		priceA = parseFloat(a.estimated_price);
			var		priceB = parseFloat(b.estimated_price);
			var		result;

			if(priceA == priceB) { result = 0; }
			if(priceA > priceB) { result = 1; }
			if(priceA < priceB) { result = -1; }

			return result;
		});
	userProfile.gifts.forEach( function(item, i, arr) {
		var		giftID = item.id;

		var		divRowGift			= $("<div>").addClass("row margin_top_10 gift_all")
												.attr("id", "Gift" + item.id);

		var		imgCover;
		var		divCover			= $("<div>").addClass("col-xs-5 col-sm-1 col-sm-pull-9 margin_bottom_10");
		var		divGiftTitle		= $("<div>").addClass("col-xs-12 col-sm-9 col-sm-push-1");

		var		divGiftPrice		= $("<div>").addClass("col-xs-12 col-sm-11 col-sm-offset-1 ");
		var		divGiftQuantity		= $("<div>").addClass("col-xs-12 col-sm-11 col-sm-offset-1 ");
		var		divGiftLink			= $("<div>").addClass("col-xs-10 col-sm-9 col-sm-offset-1 ");
		var		divGiftLinkOpen		= $("<div>").addClass("col-xs-2  col-sm-2");
		var		divGiftDescription	= $("<div>").addClass("col-xs-12 col-sm-11 col-sm-offset-1 form-group");

		var		spanTitle			= $("<span>").attr("data-id", item.id)
												.attr("data-action", "updateGiftTitle")
												.attr("data-script", "gift.cgi")
												.addClass("giftTitle editableSpan ")
												.append(item.title);
		var		giftLink			= $("<input>")
												.attr("data-id", item.id)
												.attr("data-action", "updateGiftLink")
												.attr("data-script", "gift.cgi")
												.addClass("giftLink transparent")
												.on("change", system_calls.UpdateInputFieldOnServer)
												.val(item.link);
		var		giftLinkOpen		= $("<i>")
												.addClass("fa fa-external-link cursor_pointer animateClass")
												.attr("aria-hidden", "true")
												.on("click", OpenGiftLink_ClickHandler);

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

		var		paragraphDescription = $("<p>").attr("data-id", item.id)
												.attr("id", "giftDescription" + item.id)
												.attr("data-action", "updateGiftDescription")
												.attr("data-script", "gift.cgi")
												.addClass("giftDescription editableParagraph  ")
												.append(item.description.length ? (item.description) : "(описание отсутствует)");

		var		buttonGained = $("<button>").attr("data-id", item.id)
											.attr("data-action", "updateGainedQuantity")
											.attr("data-script", "gift.cgi")
											.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span> Подождите...")
											.attr("id", "GainedQuantityButton" + item.id)
											.addClass("btn animated")
											.on("click", GainedQuantityButton_ClickHandler)
											.append("подарено !");

		var		divTimestamp = $("<div>").addClass("col-xs-5 col-sm-2");
		var		spanTimestamp = $("<span>").addClass("giftReadTimestamp")
											.append(system_calls.GetLocalizedDateNoTimeFromSeconds(item.eventTimestamp))
											.data("id", item.id)
											.data("action", "updateGiftEventTimestamp")
											.data("script", "gift.cgi");

		var		divClose = $("<div>")	.addClass("col-xs-2 col-xs-offset-5 col-sm-offset-0");
		var		spanClose = $("<span>")	.attr("data-id", item.id)
										.attr("data-action", "AJAX_removeGiftEntry")
										.attr("data-script", "gift.cgi")
										.attr("aria-hidden", "true")
										.addClass("glyphicon glyphicon-remove animateClass removeGiftEntry");

		if((typeof(item.logo_folder) != "undefined") && (typeof(item.logo_filename) != "undefined") && (item.logo_folder.length) && (item.logo_filename.length))
			imgCover = $("<img>").addClass("max_100percents_100px  niceborder")
								.attr("src", "/images/gifts/" + item.logo_folder + "/" + item.logo_filename)
								.attr("data-type", "gift")
								.attr("id", "editProfileCoverGiftID" + item.id)
								.data("id", item.id)
								.on("click", AddCoverUpload_ClickHandler);
		else
			imgCover = $("<img>").addClass("max_100percents_100px  scale_1_2 cursor_pointer")
								.attr("src", "/images/pages/edit_profile/cloud_arrow.jpg")
								.attr("data-type", "gift")
								.attr("id", "editProfileCoverGiftID" + item.id)
								.data("id", item.id)
								.on("click", AddCoverUpload_ClickHandler);

		if(parseInt(item.gained_quantity) == parseInt(item.requested_quantity))
		{
			buttonGained.attr("disabled", "");
			buttonGained.addClass("btn-success");
			divRowGift.addClass("gift_given");
		}
		else
		{
			buttonGained.addClass("btn-default");
			divRowGift.addClass("gift_pending");
		}

		result = result.add(divRowGift);

		divRowGift
					.append($("<b>").append(divGiftTitle.append(spanTitle).append(" (").append(spanPrice).append(" руб.)")))
					.append(divCover.append(imgCover))
					// .append(divTimestamp.append(spanTimestamp))
					.append(divClose.append(spanClose))
					.append(divGiftQuantity.append(buttonGained).append(" ").append(spanGainedQuantity).append(" из ").append(spanRequestedQuantity))
					.append(divGiftLink.append(giftLink).append($("<label>")))
					.append(divGiftLinkOpen.append(giftLinkOpen))
					.append(divGiftDescription.append(paragraphDescription));
	});

	$("div#GiftPath").append(result);

	$("div#GiftPath .editableSpan").on("click", editableFuncReplaceToInput);
	$("div#GiftPath .editableSpan").mouseenter(editableFuncHighlightBgcolor);
	$("div#GiftPath .editableSpan").mouseleave(editableFuncNormalizeBgcolor);

	$("div#GiftPath .editableParagraph").on("click", editableFuncReplaceToTextarea);
	$("div#GiftPath .editableParagraph").mouseenter(editableFuncHighlightBgcolor);
	$("div#GiftPath .editableParagraph").mouseleave(editableFuncNormalizeBgcolor);

	$("div#GiftPath .removeGiftEntry").on("click", removeCompanyExperience);
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

		var		divCover = $("<div>").addClass("col-xs-5 col-sm-1 col-sm-pull-7");
		var		imgCover;

		var		divBook = $("<div>").addClass("col-xs-12 col-sm-7 col-sm-push-1");
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

		var		divTimestamp = $("<div>").addClass("col-xs-5 col-sm-2");
		var		spanTimestamp = $("<span>").addClass("bookReadTimestamp editableSpan formatDate")
											.append(system_calls.GetLocalizedDateNoTimeFromSeconds(item.bookReadTimestamp))
											.data("id", item.id)
											.data("action", "updateBookReadTimestamp")
											.data("script", "book.cgi");

		var		divClose = $("<div>").addClass("col-xs-2");
		var		spanClose = $("<span>").attr("data-id", item.id)
										.attr("data-action", "AJAX_removeBookEntry")
										.attr("data-script", "book.cgi")
										.attr("aria-hidden", "true")
										.addClass("glyphicon glyphicon-remove animateClass removeBookEntry");

		var		ratingCallback = function(rating)
								{
									var		id = $(this).data("id");

									$.getJSON("/cgi-bin/book.cgi?action=AJAX_setBookRating", {id: usersBooksID, rating: rating, rand: Math.round(Math.random() * 100000000)})
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
			imgCover = $("<img>").addClass("max_100percents_100px  niceborder")
								.attr("src", "/images/books/" + item.bookCoverPhotoFolder + "/" + item.bookCoverPhotoFilename)
								.attr("data-type", "book")
								.data("id", item.bookID)
								.on("click", ComplainSpecifiedImageModal_Show);
		else
			imgCover = $("<img>").addClass("max_100percents_100px  scale_1_2 cursor_pointer")
								.attr("src", "/images/pages/edit_profile/cloud_arrow.jpg")
								.attr("id", "editProfileCoverBookID" + item.bookID)
								.on("click", AddCoverUpload_ClickHandler)
								.attr("data-type", "book")
								.data("id", item.bookID);

		result = result.add(divRowBook);

		paragraphBook.append(spanTitle)
					.append(" (")
					.append(spanAuthorName)
					.append(")<br>")
					.append(system_calls.RenderRating("editProfileBookRating" + item.bookID, item.bookRating, ratingCallback));

		divRowBook  .append(divBook.append(paragraphBook))
					.append(divCover.append(imgCover))
					.append(divTimestamp.append(spanTimestamp))
					.append(divClose.append(spanClose));
	});

	$("div#BookPath").append(result);

	$("div#BookPath .editableSpan").on("click", editableFuncReplaceToInput);
	$("div#BookPath .editableSpan").mouseenter(editableFuncHighlightBgcolor);
	$("div#BookPath .editableSpan").mouseleave(editableFuncNormalizeBgcolor);

	$("div#BookPath .editableParagraph").on("click", editableFuncReplaceToTextarea);
	$("div#BookPath .editableParagraph").mouseenter(editableFuncHighlightBgcolor);
	$("div#BookPath .editableParagraph").mouseleave(editableFuncNormalizeBgcolor);

	$("div#BookPath .removeBookEntry").on("click", removeCompanyExperience);
};

var	RenderVacancyPath = function()
{
	var		result = $();

	if(typeof(userProfile) == "undefined")
	{
		return;
	}

	$("div#VacanciesApplied").empty();
	userProfile.vacancyApplied.sort(function(a, b)
		{
			var		timestampA = parseFloat(a.eventTimestamp);
			var		timestampB = parseFloat(b.eventTimestamp);
			var		result;

			// --- both applied or both rejected
			if(a.status == b.status)
			{
				if(timestampA == timestampB) { result = 0; }
				if(timestampA > timestampB) { result = -1; }
				if(timestampA < timestampB) { result = 1; }
			}
			else
			{
				if(a.status == "applied") result = -1;
				if(b.status == "applied") result = 1;
			}

			return result;
		});

	userProfile.vacancyApplied.forEach( function(item, i, arr) 
	{
		if(($("#switcherLabelAppliedVacancies").data("state") == "all") || (item.status == "applied"))
		{

			var		applicationID = item.id;

			var		divRowApplication = $("<div>").addClass("row margin_top_10")
												.attr("id", "CompanyCandidate" + item.id);

			var		divCover = $("<div>").addClass("col-xs-5 col-sm-1 col-sm-pull-7");
			var		imgCover;

			var		divApplication = $("<div>").addClass("col-xs-12 col-sm-7 col-sm-push-1");
			var		paragraphBook = $("<p>");
			var		spanJobTitle = $("<span>").attr("data-id", item.id)
													.attr("data-action", "updatePositionTitle")
													.attr("data-script", "company.cgi")
													.addClass("positionTitle")
													.append(item.vacancy[0].company_position_title);
			var		spanCompanyName = $("<span>").attr("data-id", item.id)
													.attr("data-action", "updateCompanyTitle")
													.attr("data-script", "company.cgi")
													.addClass("companyTitle")
													.append($("<a>").attr("href", "/companyprofile/" + item.company[0].id + "?rand=" + Math.random()*123456789).append(item.company[0].name));

			var		divTimestamp = $("<div>").addClass("col-xs-5 col-sm-2");
			var		spanTimestamp = $("<span>").addClass("eventTimestamp formatDate")
												.append(system_calls.GetLocalizedDateNoTimeFromSeconds(item.eventTimestamp))
												.data("id", item.id)
												.data("action", "updateEventTimestamp")
												.data("script", "company.cgi");

			var		divClose = $("<div>").addClass("col-xs-2");
			var		spanClose = $("<span>").attr("data-id", item.id)
											.attr("data-action", "AJAX_removeAppliedVacancyEntry")
											.attr("data-script", "index.cgi")
											.attr("aria-hidden", "true")
											.addClass("glyphicon glyphicon-remove animateClass removeAppliedVacancyEntry");

			if((typeof(item.company[0].logo_folder) != "undefined") && (typeof(item.company[0].logo_filename) != "undefined") && (item.company[0].logo_folder.length) && (item.company[0].logo_filename.length))
				imgCover = $("<img>").addClass("max_100percents_100px  niceborder")
									.attr("src", "/images/companies/" + item.company[0].logo_folder + "/" + item.company[0].logo_filename)
									.attr("data-type", "company")
									.data("id", item.company[0].id)
									.on("click", ComplainSpecifiedImageModal_Show);
			else
				imgCover = $("<img>").addClass("max_100percents_100px  scale_1_2 cursor_pointer")
									.attr("src", "/images/pages/common/empty_2.png")
									.data("id", item.applicationID);

			result = result.add(divRowApplication);

			paragraphBook		.append(spanCompanyName)
								.append(" - ")
								.append(spanJobTitle)
								.append($("<span>").addClass(item.status == "applied" ? " color_orange" : "color_red").append(item.status == "applied" ? " (на рассмотрении) " : " (отказано) "));

			divRowApplication	.append(divApplication.append(paragraphBook))
								.append(divCover.append(imgCover))
								.append(divTimestamp.append(spanTimestamp))
								.append(divClose.append(spanClose));
		}
	});

	$("div#VacanciesApplied").append(result);

	$("div#VacanciesApplied .editableSpan").on("click", editableFuncReplaceToInput);
	$("div#VacanciesApplied .editableSpan").mouseenter(editableFuncHighlightBgcolor);
	$("div#VacanciesApplied .editableSpan").mouseleave(editableFuncNormalizeBgcolor);

	$("div#VacanciesApplied .editableParagraph").on("click", editableFuncReplaceToTextarea);
	$("div#VacanciesApplied .editableParagraph").mouseenter(editableFuncHighlightBgcolor);
	$("div#VacanciesApplied .editableParagraph").mouseleave(editableFuncNormalizeBgcolor);

	$("div#VacanciesApplied .removeAppliedVacancyEntry").on("click", removeCompanyExperience);
};

var	AddCoverNoUpload_ClickHandler = function(e)
{
	var		currTag = $(this);

	$("#AddGeneralCoverNoUploadButton").data("uploadCoverID", currTag.data("id"));
	$("#AddGeneralCoverNoUploadButton").data("uploadCoverType", currTag.data("type"));
	$("#AddGeneralCoverNoUploadButton").data("srcTagID", currTag.attr("id"));
	$("#AddGeneralCoverNoUploadButton").click();
};

var	AddGeneralCoverNoUploadChangeHandler = function(e)
{
	if((typeof e != "undefined") && (typeof e.target != "undefined") && (typeof e.target.files != "undefined") && e.target.files.length)
	{
		var		tmpURLObj = URL.createObjectURL(e.target.files[0]);
		var		srcTagID = $("#AddGeneralCoverNoUploadButton").data("srcTagID");
		var		uploadCoverID = $("#AddGeneralCoverNoUploadButton").data("uploadCoverID");
		var		uploadCoverType = $("#AddGeneralCoverNoUploadButton").data("uploadCoverType");
		var		imgPreview = $("#" + srcTagID);

		imgPreview.attr("src", tmpURLObj);
	}
};

var	AddCoverUpload_ClickHandler = function(e)
{
	var		currTag = $(this);

	$("#AddGeneralCoverButton").data("uploadCoverID", currTag.data("id"));
	$("#AddGeneralCoverButton").data("uploadCoverType", currTag.data("type"));
	$("#AddGeneralCoverButton").click();
};

var	AddGeneralCoverUploadChangeHandler = function(e)
{
	var		tmpURLObj;
	var		imgOriginal = new Image();
	var		uploadCoverID = $("#AddGeneralCoverButton").data("uploadCoverID");
	var		uploadCoverType = $("#AddGeneralCoverButton").data("uploadCoverType");

	// --- type == "change": user picked image from GUI
	// --- type == "image": standard <img src="xxxx"> tag
	tmpURLObj = e.type == "change" ? URL.createObjectURL(e.target.files[0]) :
				e.type == "image" ? e.src : 
				console.error("ERROR: unknown event type");

	imgOriginal.onload = function(e)
	{
		var		formData = new FormData();

		formData.append("action", "uploadCoverID");
		formData.append("id", uploadCoverID);
		formData.append("type", uploadCoverType);
		formData.append("cover", system_calls.GetBlob_ScaledDownTo640x480(imgOriginal), "cover.jpg");

		$.ajax({
			url: "/cgi-bin/generalimageuploader.cgi",
			cache: false,
			contentType: false,
			processData: false,
			async: true,
			data: formData,
			type: "post",
			success: function(data) {
				var		jsonObj = JSON.parse(data);
				console.debug("AddGeneralCoverUploadChangeHandler:upload:successHandler: URL /images/" + uploadCoverType + "/" + jsonObj[0].logo_folder + "/" + jsonObj[0].logo_filename);
				if(uploadCoverType == "certification")
				{
					// --- update GUI with image
					$("img#editProfileCoverCertificationID" + uploadCoverID).attr("src", "/images/certifications/" + jsonObj[0].logo_folder + "/" + jsonObj[0].logo_filename);
					$("img#editProfileCoverCourseID" + uploadCoverID).attr("src", "/images/certifications/" + jsonObj[0].logo_folder + "/" + jsonObj[0].logo_filename);

					// --- update userProfile structure w/ new image
					for(var i = 0; i < userProfile.certifications.length; i++)
						if(userProfile.certifications[i].certificationInternalID == uploadCoverID)
						{
							userProfile.certifications[i].certificationPhotoFolder = jsonObj[0].logo_folder;
							userProfile.certifications[i].certificationPhotoFilename = jsonObj[0].logo_filename;
						}
					for(var i = 0; i < userProfile.courses.length; i++)
						if(userProfile.courses[i].courseInternalID == uploadCoverID)
						{
							userProfile.courses[i].coursePhotoFolder = jsonObj[0].logo_folder;
							userProfile.courses[i].coursePhotoFilename = jsonObj[0].logo_filename;
						}
				}
				if(uploadCoverType == "course")
				{
					// --- update GUI with image
					$("img#editProfileCoverCertificationID" + uploadCoverID).attr("src", "/images/certifications/" + jsonObj[0].logo_folder + "/" + jsonObj[0].logo_filename);
					$("img#editProfileCoverCourseID" + uploadCoverID).attr("src", "/images/certifications/" + jsonObj[0].logo_folder + "/" + jsonObj[0].logo_filename);

					// --- update userProfile structure w/ new image
					for(var i = 0; i < userProfile.certifications.length; i++)
						if(userProfile.certifications[i].certificationInternalID == uploadCoverID)
						{
							userProfile.certifications[i].certificationPhotoFolder = jsonObj[0].logo_folder;
							userProfile.certifications[i].certificationPhotoFilename = jsonObj[0].logo_filename;
						}
					for(var i = 0; i < userProfile.courses.length; i++)
						if(userProfile.courses[i].courseInternalID == uploadCoverID)
						{
							userProfile.courses[i].coursePhotoFolder = jsonObj[0].logo_folder;
							userProfile.courses[i].coursePhotoFilename = jsonObj[0].logo_filename;
						}
				}
				if(uploadCoverType == "university")
				{
					// --- update GUI with image
					$("img#editProfileCoverUniversityID" + uploadCoverID).attr("src", "/images/universities/" + jsonObj[0].logo_folder + "/" + jsonObj[0].logo_filename);

					// --- update userProfile structure w/ new image
					for(var i = 0; i < userProfile.university.length; i++)
						if(userProfile.university[i].universityInternalID == uploadCoverID)
						{
							userProfile.university[i].universityPhotoFolder = jsonObj[0].logo_folder;
							userProfile.university[i].universityPhotoFilename = jsonObj[0].logo_filename;
						}
				}
				if(uploadCoverType == "school")
				{
					// --- update GUI with image
					$("img#editProfileCoverSchoolID" + uploadCoverID).attr("src", "/images/schools/" + jsonObj[0].logo_folder + "/" + jsonObj[0].logo_filename);

					// --- update userProfile structure w/ new image
					for(var i = 0; i < userProfile.school.length; i++)
						if(userProfile.school[i].schoolInternalID == uploadCoverID)
						{
							userProfile.school[i].schoolPhotoFolder = jsonObj[0].logo_folder;
							userProfile.school[i].schoolPhotoFilename = jsonObj[0].logo_filename;
						}
				}
				if(uploadCoverType == "language")
				{
					// --- update GUI with image
					$("img#editProfileCoverLanguageID" + uploadCoverID).attr("src", "/images/flags/" + jsonObj[0].logo_folder + "/" + jsonObj[0].logo_filename);

					// --- update userProfile structure w/ new image
					for(var i = 0; i < userProfile.language.length; i++)
						if(userProfile.language[i].languageInternalID == uploadCoverID)
						{
							userProfile.language[i].languagePhotoFolder = jsonObj[0].logo_folder;
							userProfile.language[i].languagePhotoFilename = jsonObj[0].logo_filename;
						}
				}
				if(uploadCoverType == "book")
				{
					// --- update GUI with image
					$("img#editProfileCoverBookID" + uploadCoverID).attr("src", "/images/books/" + jsonObj[0].coverPhotoFolder + "/" + jsonObj[0].coverPhotoFilename);

					// --- update userProfile structure w/ new image
					for(var i = 0; i < userProfile.books.length; i++)
						if(userProfile.books[i].bookID == uploadCoverID)
						{
							userProfile.books[i].bookCoverPhotoFolder = jsonObj[0].coverPhotoFolder;
							userProfile.books[i].bookCoverPhotoFilename = jsonObj[0].coverPhotoFilename;
						}
				}
				if(uploadCoverType == "company")
				{
					// --- update GUI with image
					$("img#editProfileCoverCompanyID" + uploadCoverID).attr("src", "/images/companies/" + jsonObj[0].logo_folder + "/" + jsonObj[0].logo_filename);

					// --- update userProfile structure w/ new image
					for(var i = 0; i < userProfile.companies.length; i++)
						if(userProfile.companies[i].companyInternalID == uploadCoverID)
						{
							userProfile.companies[i].companyPhotoFolder = jsonObj[0].logo_folder;
							userProfile.companies[i].companyPhotoFilename = jsonObj[0].logo_filename;
						}
				}
				if(uploadCoverType == "gift")
				{
					// --- update GUI with image
					$("img#editProfileCoverGiftID" + uploadCoverID).attr("src", "/images/gifts/" + jsonObj[0].logo_folder + "/" + jsonObj[0].logo_filename);

					// --- update userProfile structure w/ new image
					for(var i = 0; i < userProfile.gifts.length; i++)
						if(userProfile.gifts[i].id == uploadCoverID)
						{
							userProfile.gifts[i].logo_folder = jsonObj[0].logo_folder;
							userProfile.gifts[i].logo_filename = jsonObj[0].logo_filename;
						}
				}
			},
			error: function(data) {
				var		jsonObj = JSON.parse(data);
				console.debug("AddGeneralCoverUploadChangeHandler:upload:failHandler:ERROR: " + jsonObj.textStatus);
			}
		});

	};

	imgOriginal.src = tmpURLObj;
};

var	InitBirthdayAccessLabel = function()
{
	$("#switcherLabelBirthdayDatePublic").data("state", userProfile.birthdayAccess);

	if(userProfile.birthdayAccess == "public")
		$("#switcherBirthdayDatePublic").attr("checked", "checked");

	RenderGUIBirthdayAccessLabel();
};

var	InitAppliedVacanciesLabel = function()
{
	$("#switcherLabelAppliedVacancies").data("state", userProfile.appliedVacanciesRender);

	if(userProfile.appliedVacanciesRender == "all")
		$("#switcherAppliedVacancies").attr("checked", "checked");

	RenderGUIAppliedVacancies();
};

var RenderGUIBirthdayAccessLabel = function()
{
	var   currentTag = $("#switcherLabelBirthdayDatePublic");

	if(currentTag.data("state") == "private")
		$("#switcherBirthdayDateDescription").empty().append("скрыт");
	else
		$("#switcherBirthdayDateDescription").empty().append("открыт");
};

var RenderGUIAppliedVacancies = function()
{
	var		currentTag = $("#switcherLabelAppliedVacancies");

	if(currentTag.data("state") == "all")
		$("#switcherAppliedVacanciesDescription").empty().append("Все поданные вакансии");
	else
		$("#switcherAppliedVacanciesDescription").empty().append("Вакансии в ожидании");
};

var BirthdayAccessButtonClickHeader = function(e)
{
	var   currentTag = $(this);
	var   state = currentTag.data("state");

	// --- switch state
	if(state == "public") state = "private"; else state = "public";

	currentTag.data("state", state);
	userProfile.birthdayAccess = state;

	$.getJSON("/cgi-bin/account.cgi?action=" + (state == "public" ? "AJAX_editProfile_setBirthdayPublic" : "AJAX_editProfile_setBirthdayPrivate"), {rand: Math.round(Math.random() * 100000000)})
	.done(function(data) {
		if(data.result == "success")
		{	
		}
		else
		{
		  console.debug("BirthdayAccessButtonClickHeader: ERROR: " + data.description);
		}
	})
	.fail(function(data){
		  console.debug("BirthdayAccessButtonClickHeader: ERROR: fail parse server response");
	});

	RenderGUIBirthdayAccessLabel();
};

var AppliedVacanciesButtonClickHeader = function(e)
{
	var   currentTag = $(this);
	var   state = currentTag.data("state");

	// --- switch state
	if(state == "all") state = "inprogress"; else state = "all";

	currentTag.data("state", state);
	userProfile.appliedVacanciesRender = state;

	$.getJSON("/cgi-bin/index.cgi?action=" + (state == "all" ? "AJAX_editProfile_setAppliedVacanciesAll" : "AJAX_editProfile_setAppliedVacanciesInprogress"), {rand: Math.round(Math.random() * 100000000)})
	.done(function(data) {
		if(data.result == "success")
		{	
		}
		else
		{
		  console.debug("AppliedVacanciesButtonClickHeader: ERROR: " + data.description);
		}
	})
	.fail(function(data){
		  console.debug("AppliedVacanciesButtonClickHeader: ERROR: fail parse server response");
	});

	RenderGUIAppliedVacancies();
	RenderVacancyPath();
};

var AdverseCleanButtonClickHeader = function(e)
{
	var   currentTag = $(this);
	var   triggeredAction = currentTag.data("action");
	var   triggeredID = currentTag.data("id");

	$.getJSON("/cgi-bin/index.cgi?action=" + triggeredAction, {id: triggeredID, rand: Math.round(Math.random() * 100000000)})
	.done(function(data) {
		if(data.result == "success")
		{	
		}
		else
		{
		  console.debug("AdverseCleanButtonClickHeader: ERROR: " + data.description);
		}
	});

	userProfile.recommendation.forEach(function(item, i, arr)
	{
		if(item.recommendationID == triggeredID)
		{
			if(triggeredAction == "AJAX_editProfile_setRecommendationAdverse")
			{
				item.recommendationState = "adverse";
				// currentTag.removeAttr("checked");

				currentTag.data("action", "AJAX_editProfile_setRecommendationClean");
				$("#switcherStateRecommendation" + triggeredID + "Comment").empty().append("скрыта");
			}
			else
			{
				item.recommendationState = "clean";
				// currentTag.attr("checked", "");

				currentTag.data("action", "AJAX_editProfile_setRecommendationAdverse");
				$("#switcherStateRecommendation" + triggeredID + "Comment").empty().append("опубликована");
			}
		}
	});
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

		var		isMine = true;
		var		divRowTitle = $("<div>").addClass("row")
										.attr("id", "titleRecommendation" + item.recommendationID);
		var		divFriendTitle = $("<div>").addClass("col-xs-6 col-sm-8");
		var		divFriendTimestamp = $("<div>").addClass("col-xs-4 col-sm-2")
											   .append($("<h6>").append($("<small>").append(system_calls.GetLocalizedDateFromSeconds(item.recommendationTimestamp))));
		var		divFriendClose = $("<div>").addClass("col-xs-2");
		var		spanClose = $("<span>").attr("data-id", item.recommendationID)
										.attr("aria-hidden", "true")
										.attr("data-action", "AJAX_removeRecommendationEntry")
										.addClass(isMine ? "glyphicon glyphicon-remove animateClass removeRecommendationEntry" : "");

		var		divRowRecommendation = $("<div>").addClass("row")
												.attr("id", "recommendation" + item.recommendationID);
		var		divRecommendation = $("<div>").addClass("col-xs-12 col-sm-11 col-sm-offset-1");
		var		paragraphRecommendation = $("<p>");
		var		spanTitle = $("<span>").attr("data-id", item.recommendationID)
										.attr("data-action", "updateRecommendationTitle")
										.addClass("recommendationTitle editableSpan")
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
			divFriendTitle.append("...");

			userCache.AddUserIDForFutureUpdate(item.recommendationRecommendingUserID);
		}

		divRowTitle.append(divFriendTitle).append(divFriendTimestamp).append(divFriendClose.append(spanClose));
		divRowRecommendation.append(divRecommendation.append(paragraphRecommendation.append(spanTitle)));

		{
			var		divRecommendationButton = $("<div>").addClass("col-xs-4 col-sm-1 col-sm-offset-1");
			var		divRecommendationTitle = $("<div>").addClass("col-xs-7 col-sm-10")
														.attr("id", "switcherStateRecommendation" + item.recommendationID + "Comment");
			var		divSwitcher = $("<div>").addClass("form-switcher");
			var   	switcherButton = $("<input>").attr("type", "checkbox")
												.attr("id", "switcherStateRecommendation" + item.recommendationID)
												.attr("name", "switcherStateRecommendation" + item.recommendationID);
			var   	switcherLabel = $("<label>").addClass("switcher")
												.attr("for", "switcherStateRecommendation" + item.recommendationID)
												.attr("data-id", item.recommendationID)
												.on("click", AdverseCleanButtonClickHeader);

			if((item.recommendationState == "adverse") || (item.recommendationState == "potentially adverse"))
			{
				divRecommendationTitle.append("скрыта");

				switcherLabel.attr("data-action", "AJAX_editProfile_setRecommendationClean");
			}
			else
			{
				divRecommendationTitle.append("опубликована");

				switcherLabel.attr("data-action", "AJAX_editProfile_setRecommendationAdverse");
				switcherButton.attr("checked", "");
			}



			divRecommendationButton.append(divSwitcher.append(switcherButton).append(switcherLabel));
			divRowRecommendation.append(divRecommendationButton).append(divRecommendationTitle);
		}

		result = result.add(divRowTitle);
		result = result.add(divRowRecommendation);
	}); // --- forEach Recommendation

	$("div#RecommendationPath").append(result);
	$("div#RecommendationPath [data-toggle=\"tooltip\"]").tooltip({ animation: "animated bounceIn"});

	$("div#RecommendationPath .removeRecommendationEntry").on("click", removeCompanyExperience);

	userCache.AddCallbackRunsAfterCacheUpdate(edit_profile.RenderRecommendationPath);
	window.setTimeout(userCache.RequestServerToUpdateCache, 1000);
};

var isSpanEmpty = function (tag)
{
	if($(tag).text() === "") 
	{
		return true;
	}
	else
	{
		return false;
	}
};

var GetUserInitials = function()
{
	var textForAvatar = "";

	if(($("#firstName").text() == "Без имени") || ($("#firstName").text() === "")) { textForAvatar = "."; }
		else { textForAvatar = $("#firstName").text()[0]; }

	if(($("#lastName").text() == "Без фамилии") || ($("#lastName").text() === "")) { textForAvatar += "."; }
		else { textForAvatar += $("#lastName").text()[0]; }

	return textForAvatar;
};

var DrawTextAvatar = function(context, size)
{
	var	ctx = document.getElementById(context).getContext("2d");

	ctx.clearRect(0,0,size,size);

	ctx.beginPath();
	ctx.arc(size/2,size/2, size/2, 0,2*Math.PI);
	ctx.closePath();
	ctx.fillStyle = "grey";
	ctx.fill();

	ctx.font = "normal "+size*3/8+"pt Calibri";
	ctx.textAlign = "center";
	ctx.fillStyle = "white";
	ctx.fillText(GetUserInitials(), size/2,size*21/32);
};

var	DeletePreviewAvatar = function (id)
{
	$.ajax({
		url:"/cgi-bin/index.cgi",
		data: {action:"AJAX_deleteAvatar", id:id, value:""}
	}).done(DrawAllAvatars);
};

	var ShowPreviewAvatar = function (context, image, isActive, id)
	{

		var DrawBigAvatar = function()
		{
			var		ctxMain = document.getElementById("canvasForAvatar").getContext("2d");
			var 	x1 = 0, x2 = 150, y1 = 0, y2 = 150, radius = 10;
			var		sMinEdge = Math.min(pic.width, pic.height);

			// console.debug("DrawBigAvatar: click handler event [entryID="+id+"]");

			ctxMain.clearRect(0,0,150,150);
			ctxMain.save();
			ctxMain.beginPath();
			ctxMain.moveTo(radius, 0);
			ctxMain.lineTo(x2 - radius, 0);
			ctxMain.quadraticCurveTo(x2,0, x2,radius);
			ctxMain.lineTo(x2, y2 - radius);
			ctxMain.quadraticCurveTo(x2,y2, x2-radius,y2);
			ctxMain.lineTo(radius, y2);
			ctxMain.quadraticCurveTo(0,y2, 0,y2-radius);
			ctxMain.lineTo(0, radius);
			ctxMain.quadraticCurveTo(0,0, radius,0);
			ctxMain.clip();

			ctxMain.drawImage(pic, (pic.width - sMinEdge) / 2, (pic.height - sMinEdge) / 2, sMinEdge, sMinEdge, 0,0,150,150);
			ctxMain.restore();
		};

		var	ctx = document.getElementById(context).getContext("2d");
		var pic = new Image();

		if(context == "canvasForAvatarPreview0")
		{
			// --- Generation avatar text preview 
			DrawTextAvatar(context, 20);

			// --- Hide "delete" cross due to delete text avatar impossible
			$("#canvasForAvatarPreview0_del").hide();

			document.getElementById(context+"_overlay").addEventListener("click", function()
				{
					// --- mark all preview inactive
					JSON_AvatarList.forEach(function(item) 
											{
												item.isActive = "0";
											});

					DrawTextAvatar("canvasForAvatar", 150);

					$.ajax({
						url:"/cgi-bin/index.cgi",
						data: {action:"AJAX_updateActiveAvatar", id:"-1", value:""}
					}).done();

				}
			);
			if(isActive == 1) { DrawTextAvatar("canvasForAvatar", 150); }
		}
		else
		{

			pic.src = image;
			pic.onload = function () 
			{
				var		sMinEdge = Math.min(pic.width, pic.height);


				// console.debug("ShowPreviewAvatar("+context+","+image+"): onLoad handler event [entryID="+id+"]");
				ctx.drawImage(this, (pic.width - sMinEdge) / 2, (pic.height - sMinEdge) / 2, sMinEdge, sMinEdge,0,0,20,20);
				if(id > 0) 
				{

					document.getElementById(context+"_overlay").addEventListener("click", function()
					{
						// --- mark clicked preview active
						JSON_AvatarList.forEach(function(item) 
												{
													item.isActive = "0";
													if(item.avatarID == id)
													{
														item.isActive = "1";
													}
												});
						DrawBigAvatar();
						
						$.ajax({
							url:"/cgi-bin/index.cgi",
							data: {action:"AJAX_updateActiveAvatar", id:id, value:""}
						}).done(ajaxReturnSuccess);
					});

					document.getElementById(context+"_del").addEventListener("click", function()
					{
						// $("#DeleteAvatarDialogBox").dialog("option", "id", id);
						// $("#DeleteAvatarDialogBox").dialog("open");

						$("#DeletedAvatarID_InBSForm").val(id);
						$("#DeleteAvatarDialogBoxBS").modal("show");

						
					});

					if(isActive == 1) { DrawBigAvatar(); }
				}

			};
		}
	};

	var filterInactiveAvatars = function(item) 
	{
		if (item.isActive == "1")
		{
			return true;
		}
		return false;
	};

	var ShowActiveAvatar = function() 
	{
		if(JSON_AvatarList.filter(filterInactiveAvatars).length === 0)
		{
			DrawTextAvatar("canvasForAvatar", 150);
		}
		DrawTextAvatar("canvasForAvatarPreview0", 20);			
	};

var DrawAllAvatars = function()
{
	// --- AJAX avatar list download 
	$.getJSON("/cgi-bin/index.cgi?action=JSON_getAvatarList", {param1: ""})
		.done(function(data) {
			var		i;

			JSON_AvatarList = data;
			if(isSpanEmpty($("#firstName")))
			{
				$("#firstName").text("Без имени");
			}
			if(isSpanEmpty($("#lastName")))
			{
				$("#lastName").text("Без фамилии");
			}
			ShowActiveAvatar();

			i = 0;
			ShowPreviewAvatar("canvasForAvatarPreview" + i++, "");
			JSON_AvatarList.forEach
				(function (entry)
					{
						ShowPreviewAvatar("canvasForAvatarPreview" + i++, "/images/avatars/avatars" + entry.folder + "/" + entry.filename, entry.isActive, entry.avatarID);
					}
				);
			if(i < 4)
			{
				for(;i < 4; i++)
				{
					ShowPreviewAvatar("canvasForAvatarPreview" + i, "/images/pages/edit_profile/cloud_arrow.jpg", 0 /*entry.isActive*/, -2/*entry.avatarID*/);
				} 
				$("#fileupload").attr("disabled", false);
				$("#spanForFileUploadButton").addClass("btn-success");
				$("#spanForFileUploadButton").removeClass("btn-default");
			}
			else
			{
				$("#fileupload").attr("disabled", true);
				$("#spanForFileUploadButton").addClass("btn-default");
				$("#spanForFileUploadButton").removeClass("btn-success");

			}
		});
};

var	ajaxReturnSuccess = function(data) {
	console.debug("ajaxReturnSuccess: enter");

	console.debug("ajaxReturnSuccess: exit");
};

	var	editableFuncReplaceSpanToSelect20171930 = function () 
	{
		var	currentValue = parseInt($(this).text());
		var	startValue, finishValue;
		var	tag = $("<select>", {
			id: $(this).attr("id"),
			class: $(this).attr("class")
		});

		if($(this).attr("class").match(/Start/))
		{
			startValue = 1930;
			finishValue = $(this).next().text();
		}
		else
		{
			startValue = $(this).prev().text();
			finishValue = 2017;
		}


		for (var i = finishValue; i >= startValue; i--)
		{
			$(tag).append($("<option>").append(i));
		}
		$(tag).val(currentValue); 

		var	selectChangeHandler = function(event) 
		{
			editableFuncReplaceSelectToSpan($(this), editableFuncReplaceSpanToSelect20171930);
		};

		var keyupEventHandler = function(event) 
		{
			/* Act on the event */
			var	keyPressed = event.keyCode;

			console.debug("keyupEventHandler: pressed key [" + keyPressed + "]");

			if(keyPressed == 13) {
				/*Enter pressed*/
				selectChangeHandler();
			}
			if(keyPressed == 27) {
				/*Escape pressed*/
				var	tag = $("<span>", {
					text: $(this).attr("initValue"),
					id: $(this).attr("id"),
					class: $(this).attr("class")
				});

				$(tag).data("id", $(this).data("id"));
				$(tag).data("action", $(this).data("action"));

				$(this).replaceWith(tag);
				$(tag).on("click", editableFuncReplaceSpanToSelect20171930);
				$(tag).mouseenter(editableFuncHighlightBgcolor);
				$(tag).mouseleave(editableFuncNormalizeBgcolor);

			}
		};

		$(tag).attr("initValue", $(this).text());
		$(tag).data("id", $(this).data("id"));
		$(tag).data("action", $(this).data("action"));
		$(tag).width($(this).width()*2);

		$(this).replaceWith(tag);
		$(tag).on("keyup", keyupEventHandler);
		$(tag).on("change", selectChangeHandler);
		$(tag).on("blur", selectChangeHandler);
		$(tag).removeClass("editable_highlighted_class");

		if($(tag).data("action") == "XXXXXXXXXX") 
		{
		}
	};

	var	editableFuncReplaceSpanToSelectUniversityDegree = function () 
	{
		var	currentValue = $(this).text();
		var	tag = $("<select>", {
			id: $(this).attr("id"),
			class: $(this).attr("class")
		});

		$(tag).append($("<option>").append("Студент"));
		$(tag).append($("<option>").append("Бакалавр"));
		$(tag).append($("<option>").append("Магистр"));
		$(tag).append($("<option>").append("Кандидат наук"));
		$(tag).append($("<option>").append("Доктор наук"));
		$(tag).append($("<option>").append("Другое"));

		$(tag).val(currentValue); 

		var	selectChangeHandler = function(event) 
		{
			editableFuncReplaceSelectToSpan($(this), editableFuncReplaceSpanToSelectUniversityDegree);
		};

		var keyupEventHandler = function(event) 
		{
			/* Act on the event */
			var	keyPressed = event.keyCode;

			console.debug("keyupEventHandler: pressed key [" + keyPressed + "]");

			if(keyPressed == 13) {
				/*Enter pressed*/
				selectChangeHandler();
			}
			if(keyPressed == 27) {
				/*Escape pressed*/
				var	tag = $("<span>", {
					text: $(this).attr("initValue"),
					id: $(this).attr("id"),
					class: $(this).attr("class")
				});

				$(tag).data("id", $(this).data("id"));
				$(tag).data("action", $(this).data("action"));

				$(this).replaceWith(tag);
				$(tag).on("click", editableFuncReplaceSpanToSelectUniversityDegree);
				$(tag).mouseenter(editableFuncHighlightBgcolor);
				$(tag).mouseleave(editableFuncNormalizeBgcolor);

			}
		};

		$(tag).attr("initValue", $(this).text());
		$(tag).data("id", $(this).data("id"));
		$(tag).data("action", $(this).data("action"));
		$(tag).width($(this).width()*2);

		$(this).replaceWith(tag);
		$(tag).on("keyup", keyupEventHandler);
		$(tag).on("change", selectChangeHandler);
		$(tag).on("blur", selectChangeHandler);
		$(tag).removeClass("editable_highlighted_class");

		if($(tag).data("action") == "XXXXXXXXXX") 
		{
		}
	};

	var	editableFuncReplaceSpanToSelectLanguageLevel = function () 
	{
		var	currentValue = $(this).text();
		var	tag = $("<select>", {
			id: $(this).attr("id"),
			class: $(this).attr("class")
		});

		$(tag).append($("<option>").append("Свободно"));
		$(tag).append($("<option>").append("Читаю, пишу"));
		$(tag).append($("<option>").append("Начинающий"));

		$(tag).val(currentValue); 

		var	selectChangeHandler = function(event) 
		{
			editableFuncReplaceSelectToSpan($(this), editableFuncReplaceSpanToSelectLanguageLevel);
		};

		var keyupEventHandler = function(event) 
		{
			/* Act on the event */
			var	keyPressed = event.keyCode;

			console.debug("keyupEventHandler: pressed key [" + keyPressed + "]");

			if(keyPressed == 13) {
				/*Enter pressed*/
				selectChangeHandler();
			}
			if(keyPressed == 27) {
				/*Escape pressed*/
				var	tag = $("<span>", {
					text: $(this).attr("initValue"),
					id: $(this).attr("id"),
					class: $(this).attr("class")
				});

				$(tag).data("id", $(this).data("id"));
				$(tag).data("action", $(this).data("action"));

				$(this).replaceWith(tag);
				$(tag).on("click", editableFuncReplaceSpanToSelectLanguageLevel);
				$(tag).mouseenter(editableFuncHighlightBgcolor);
				$(tag).mouseleave(editableFuncNormalizeBgcolor);

			}
		};

		$(tag).attr("initValue", $(this).text());
		$(tag).data("id", $(this).data("id"));
		$(tag).data("action", $(this).data("action"));
		$(tag).width($(this).width()*2);

		$(this).replaceWith(tag);
		$(tag).on("keyup", keyupEventHandler);
		$(tag).on("change", selectChangeHandler);
		$(tag).on("blur", selectChangeHandler);
		$(tag).removeClass("editable_highlighted_class");

		if($(tag).data("action") == "XXXXXXXXXX") 
		{
		}
	};

	var	editableFuncReplaceToInput = function () {
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

			if(keyPressed == 13) {
				/*Enter pressed*/
				editableFuncReplaceInputToSpan($(this));
			}
			if(keyPressed == 27) {
				/*Escape pressed*/
/*
				if($(this).hasClass("hasDatepicker"))
				{
					// --- don't change input with datepicker to span
					// --- that generate error by jqueryUI in keyup event
				}
				else
*/
				{
					$(this).val($(this).attr("initValue"));
					editableFuncReplaceInputToSpan($(this));
				}
			}
		};

		$(tag).attr("initValue", $(this).text());
		$(tag).width($(this).width() + 30);
		// $(tag).data("id", $(this).data("id"));
		// $(tag).data("action", $(this).data("action"));
		{
			var thisTag = this;
			Object.keys($(thisTag).data()).forEach(function(item) { $(tag).data(item, $(thisTag).data(item)); });
		}

		$(this).replaceWith(tag);
		$(tag).on("keyup", keyupEventHandler);
		$(tag).removeClass("editable_highlighted_class");

		if($(tag).data("action") == "AJAX_updateFirstName") 
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
		}

		if($(tag).data("action") == "AJAX_updateLastName") 
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
		}

		if($(tag).data("action") == "updateGiftRequestedQuantity") 
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
		}

		if($(tag).data("action") == "updateGiftTitle") 
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
		}

		if($(tag).data("action") == "updateGiftPrice") 
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
		}

		if($(tag).data("action") == "updateGiftLink") 
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
		}

		if($(tag).data("action") == "updateJobTitle") 
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
			$(tag).autocomplete({
				delay : 300,
				minLength: 3,
				source: JSON_jobTitleID,
				change: function (event, ui) { 
					console.debug ("autocomplete updateJobTitle: change event handler"); 
				},
				close: function (event, ui) 
				{ 
					console.debug ("autocomplete updateJobTitle: close event handler"); 
				},
				create: function () 
				{
					console.debug ("autocomplete updateJobTitle: _create event handler"); 
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
		if($(tag).data("action") == "updateCompanyName") 
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
			$(tag).autocomplete({
				delay : 300,
				source: JSON_CompanyNameID,
				change: function (event, ui) { 
					console.debug ("autocomplete updateCompanyName: change event handler"); 
				},
				close: function (event, ui) 
				{ 
					console.debug ("autocomplete updateCompanyName: close event handler"); 
				},
				create: function () {
					// console.debug ("autocomplete updateCompanyName: _create event handler"); 
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
		if($(tag).data("action") == "AJAX_changeUserBirthday") 
		{
			var tagValue = system_calls.ConvertMonthNameToNumber($(this).text());
			tagValue = tagValue.replace(/ /g, "/"); // --- convert from "2 05 2017" -> "2/05/2017"

			$(tag).attr("initValue", tagValue);
			$(tag).val(tagValue);
			$(tag).on("change", UpdateUserBirthdayDatePickerOnChangeHandler);
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
			});
		}
		if($(tag).data("action") == "updateBookReadTimestamp") 
		{
			var tagValue = system_calls.ConvertMonthNameToNumber($(this).text());

			tagValue = tagValue.replace(/ /g, "/"); // --- convert from "2 05 2017" -> "2/05/2017"
			$(tag).val(tagValue);
			$(tag).on("change", UpdateBookReadDatePickerOnChangeHandler);
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
			});
		}
		if($(tag).data("action") == "update_occupation_start") 
		{
			var tagValue = system_calls.ConvertMonthNameToNumber($(this).text());

			$(tag).val(tagValue);
			$(tag).on("change", UpdateOccupationStartDatePickerOnChangeHandler);
			$(tag).datepicker({
				firstDay: 1,
				dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
				dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
				monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
				monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
				dateFormat: "yy-mm-dd",
				changeMonth: true,
	  			changeYear: true,
	  			showOtherMonths: true,
	  			maxDate: system_calls.ConvertMonthNameToNumber($(tag).next().val()) || system_calls.ConvertMonthNameToNumber($(tag).next().text())
			});
		}
		if($(tag).data("action") == "update_occupation_finish") 
		{
			var tagValue = system_calls.ConvertMonthNameToNumber($(this).text());

			$(tag).val(tagValue);
			$(tag).on("change", UpdateOccupationFinishDatePickerOnChangeHandler);
			$(tag).datepicker({
				firstDay: 1,
				dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
				dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
				monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
				monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
				dateFormat: "yy-mm-dd",
				changeMonth: true,
	  			changeYear: true,
	  			showOtherMonths: true,
	  			minDate: system_calls.ConvertMonthNameToNumber($(tag).prev().val()) || system_calls.ConvertMonthNameToNumber($(tag).prev().text())
			});
		}
		if(($(tag).data("action") == "updateCourseVendor") || ($(tag).data("action") == "updateCertificationVendor"))
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
			$(tag).autocomplete({
				delay : 300,
				source: JSON_certificationVendors,
				change: function (event, ui) { 
					console.debug ("autocomplete updateCourseVendor: change event handler"); 
				},
				close: function (event, ui) 
				{ 
					console.debug ("autocomplete updateCourseVendor: close event handler"); 
				},
				create: function () {
					// console.debug ("autocomplete updateCourseVendor: _create event handler"); 
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

		if(($(tag).data("action") == "updateCertificationTrack") || ($(tag).data("action") == "updateCourseTrack") )
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
			$(tag).autocomplete({
				delay : 300,
				source: JSON_certificationTracks,
				change: function (event, ui) { 
					console.debug ("autocomplete updateCertificationTrack: change event handler"); 
				},
				close: function (event, ui) 
				{ 
					console.debug ("autocomplete updateCertificationTrack: close event handler"); 
				},
				create: function () {
					// console.debug ("autocomplete updateCertificationTrack: _create event handler"); 
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

		if(($(tag).data("action") == "updateSchoolLocality"))
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
			$(tag).autocomplete({
				delay : 300,
				source: JSON_geoLocality,
				change: function (event, ui) { 
					console.debug ("autocomplete updateSchoolLocality: change event handler"); 
				},
				close: function (event, ui) 
				{ 
					console.debug ("autocomplete updateSchoolLocality: close event handler"); 
				},
				create: function () {
					// console.debug ("autocomplete updateSchoolLocality: _create event handler"); 
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

		if(($(tag).data("action") == "AJAX_updateCity"))
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
			$(tag).autocomplete({
				delay : 300,
				source: JSON_geoLocality,
				change: function (event, ui) { 
					console.debug ("autocomplete AJAX_updateCity: change event handler"); 
				},
				close: function (event, ui) 
				{ 
					console.debug ("autocomplete AJAX_updateCity: close event handler"); 
				},
				create: function () {
					// console.debug ("autocomplete AJAX_updateCity: _create event handler"); 
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

		if(($(tag).data("action") == "updateUniversityRegion"))
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
			$(tag).autocomplete({
				delay : 300,
				source: JSON_geoRegion,
				change: function (event, ui) { 
					console.debug ("autocomplete updateUniversityRegion: change event handler"); 
				},
				close: function (event, ui) 
				{ 
					console.debug ("autocomplete updateUniversityRegion: close event handler"); 
				},
				create: function () {
					// console.debug ("autocomplete updateUniversityRegion: _create event handler"); 
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

		if(($(tag).data("action") == "updateUniversityTitle"))
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
			$(tag).autocomplete({
				delay : 300,
				source: JSON_university,
				change: function (event, ui) { 
					console.debug ("autocomplete updateUniversityTitle: change event handler"); 
				},
				close: function (event, ui) 
				{ 
					console.debug ("autocomplete updateUniversityTitle: close event handler"); 
				},
				create: function () {
					// console.debug ("autocomplete updateUniversityTitle: _create event handler"); 
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

		if(($(tag).data("action") == "updateSchoolTitle"))
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
			$(tag).autocomplete({
				delay : 300,
				source: JSON_school,
				change: function (event, ui) { 
					console.debug ("autocomplete updateSchoolTitle: change event handler"); 
				},
				close: function (event, ui) 
				{ 
					console.debug ("autocomplete updateSchoolTitle: close event handler"); 
				},
				create: function () {
					// console.debug ("autocomplete updateSchoolTitle: _create event handler"); 
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

		if(($(tag).data("action") == "updateLanguageTitle"))
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
			$(tag).autocomplete({
				delay : 300,
				source: JSON_language,
				change: function (event, ui) { 
					console.debug ("autocomplete updateLanguageTitle: change event handler"); 
				},
				close: function (event, ui) 
				{ 
					console.debug ("autocomplete updateLanguageTitle: close event handler"); 
				},
				create: function () {
					// console.debug ("autocomplete updateLanguageTitle: _create event handler"); 
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

		if(($(tag).data("action") == "updateSkillTitle"))
		{
			$(tag).on("blur", editableFuncReplaceInputToSpan);
			$(tag).autocomplete({
				delay : 300,
				source: JSON_skill,
				change: function (event, ui) { 
					console.debug ("autocomplete updateLanguageTitle: change event handler"); 
				},
				close: function (event, ui) 
				{ 
					console.debug ("autocomplete updateLanguageTitle: close event handler"); 
				},
				create: function () {
					// console.debug ("autocomplete updateLanguageTitle: _create event handler"); 
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

		$(tag).select();
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
		$(newTag).on("click", editableFuncReplaceToTextarea);
		$(newTag).mouseenter(editableFuncHighlightBgcolor);
		$(newTag).mouseleave(editableFuncNormalizeBgcolor);
	};

	var	editableFuncReplaceToParagraphAccept = function (currentTag) {
		var currentContent = $(currentTag).val();

		if(system_calls.ConvertTextToHTML($(currentTag).val()) != system_calls.FilterUnsupportedUTF8Symbols($(currentTag).attr("initValue")))
		{
			// --- text has been changed

			if(currentTag.data("action") === "updateUserCV") 
			{
				if(currentContent === "") {	currentContent = "Напишите несколько слов о себе.";	}

				$.post("/cgi-bin/index.cgi?rand=" + Math.floor(Math.random() * 1000000000), 
					{
						cv: system_calls.FilterUnsupportedUTF8Symbols($(currentTag).val()),
						action: "AJAX_updateUserCV",
						rand: Math.floor(Math.random() * 1000000000)
					}).done(function(data) {
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

			if(currentTag.data("action") === "updateGiftDescription") 
			{
				if(currentContent === "") {	currentContent = "(описание отсутствует)";	}

				$.post("/cgi-bin/gift.cgi?rand=" + Math.floor(Math.random() * 1000000000), 
					{
						id: $(currentTag).data("id"), 
						value: system_calls.FilterUnsupportedUTF8Symbols($(currentTag).val()),
						action: "updateGiftDescription",
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

	};

	var	editableFuncReplaceToParagraphReject = function (currentTag) {
		/*Escape pressed*/
		editableFuncReplaceToParagraphRenderHTML(currentTag, currentTag.attr("initValue"));
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
		$(tag).removeClass("editable_highlighted_class");
		$(tag).after(tagButtonAccept);
		$(tag).after(tagButtonReject);
		$(tag).on("keyup", keyupEventHandler);
		$(tag).select();
	};

	var UpdateUserBirthdayDatePickerOnChangeHandler = function(event) {
		var		ajaxScript = $(this).data("script");
		var		ajaxAction = $(this).data("action");
		var		ajaxActionID = $(this).data("id");
		var		ajaxValue = $(this).val();

		var		re = /(\d+)\/(\d+)\/(\d+)/;
		var		found = ajaxValue.match(re);
		var		dateReadBook;

		if(found.length >= 4)
		{
			var dateDay = found[1];
			var dateMonth = found[2] - 1;
			var dateYear = found[3];

			dateReadBook = new Date(dateYear, dateMonth, dateDay);

			/* Act on the event */
			$.ajax({
				url:"/cgi-bin/" + ajaxScript,
				data: {action:ajaxAction, id:ajaxActionID, value:ajaxValue}
			}).done(function (data) 
				{
					var		data_temp = JSON.parse(data);

					if(data_temp.result == "success")
					{
						userProfile.birthday = ajaxValue;
					}
					else
					{
						console.debug("UpdateUserBirthdayDatePickerOnChangeHandler(" + data + "):ERROR: " + data.description);
					}
				})
			.fail(function() {
				console.debug("UpdateUserBirthdayDatePickerOnChangeHandler: ERROR: server response");
			});
		}
		else
		{
			console.debug("UpdateUserBirthdayDatePickerOnChangeHandler: RegEx match fail");
		}
	};

	var UpdateBookReadDatePickerOnChangeHandler = function(event) {
		var		ajaxAction = $(this).data("action");
		var		ajaxActionID = $(this).data("id");
		var		ajaxValue = $(this).val();

		var		re = /(\d+)\/(\d+)\/(\d+)/;
		var		found = ajaxValue.match(re);
		var		dateReadBook;

		if(found.length >= 4)
		{
			var dateDay = found[1];
			var dateMonth = found[2] - 1;
			var dateYear = found[3];

			dateReadBook = new Date(dateYear, dateMonth, dateDay);

			/* Act on the event */
			console.debug("UpdateBookReadDatePickerOnChangeHandler change event");
			$.ajax({
				url:"/cgi-bin/book.cgi",
				data: {action:ajaxAction, id:ajaxActionID, value:dateReadBook.getTime()/1000}
			}).done(function (data) 
				{
					var		ajaxResul = JSON.parse(data);
					console.debug("UpdateBookReadDatePickerOnChangeHandler(" + data + "): enter");

					userProfile.companies.forEach(function(item, i, arr)
					{
						if(item.companyID == ajaxActionID)
						{
							item.occupationStart = ajaxValue;
						}
					});
				});
		}
		else
		{
			console.debug("UpdateBookReadDatePickerOnChangeHandler: RegEx match fail");
		}
	};

	var UpdateOccupationStartDatePickerOnChangeHandler = function(event) {
		var		ajaxAction = $(this).data("action");
		var		ajaxActionID = $(this).data("id");
		var		ajaxValue = $(this).val();

		/* Act on the event */
		console.debug("UpdateOccupationStartDatePickerOnChangeHandler change event");
		$(this).next().datepicker("option", "minDate", ajaxValue);
		$.ajax({
			url:"/cgi-bin/index.cgi",
			data: {action:ajaxAction, id:ajaxActionID, value:ajaxValue}
		}).done(function (data) 
			{
				var		ajaxResul = JSON.parse(data);
				console.debug("UpdateOccupationStartDatePickerOnChangeHandler(" + data + "): enter");

				userProfile.companies.forEach(function(item, i, arr)
				{
					if(item.companyID == ajaxActionID)
					{
						item.occupationStart = ajaxValue;
					}
				});

				console.debug("UpdateOccupationStartDatePickerOnChangeHandler: exit");
			});
	};

	var UpdateOccupationFinishDatePickerOnChangeHandler = function(event) {
		var		ajaxAction = $(this).data("action");
		var		ajaxActionID = $(this).data("id");
		var		ajaxValue = $(this).val();

		/* Act on the event */
		console.debug("UpdateOccupationFinishDatePickerOnChangeHandler change event");
		$(this).prev().datepicker("option", "maxDate", ajaxValue);
		$.getJSON(
			"/cgi-bin/index.cgi",
			{action:ajaxAction, id:ajaxActionID, value:ajaxValue},
			function (data) 
			{
				console.debug("UpdateOccupationFinishDatePickerOnChangeHandler(" + data + "): enter");

				userProfile.companies.forEach(function(item, i, arr)
				{
					if(item.companyID == ajaxActionID)
					{
						item.occupationFinish = ajaxValue;
					}
				});

				console.debug("UpdateOccupationFinishDatePickerOnChangeHandler: exit");
			}
		);

	};

	var	editableFuncReplaceInputToSpan = function (param) {
		console.debug("editableFuncReplaceInputToSpan: start");

		var currentTag = ((typeof param.html == "function") ? param : $(this));
		var	initValue = $(currentTag).attr("initValue").replace(/^\s+/, "").replace(/\s+$/, "");
		var	newTag = $("<span>", {
			text: $(currentTag).val().replace(/^\s+/, "").replace(/\s+$/, ""),
			id: $(currentTag).attr("id"),
			class: $(currentTag).attr("class")
		});

		if(currentTag.hasClass("hasDatepicker"))
		{
			// --- every dataPicker have it own event handler
			// --- codeflow get here just in case KeyUp [enter | escape] event

			return;
		}
		else
		{
			// --- jQueryIU.autocomplete creates data("uiAutocomplete") attr
			// --- autocomplete must be destroyed before copying data() to new tagValue
			// --- otherwise autocomplete will not works
			if(typeof(currentTag.autocomplete("instance")) != "undefined")
				currentTag.autocomplete("destroy");

			// --- copying data attributes
			Object.keys($(currentTag).data()).forEach(function(item) { $(newTag).data(item, $(currentTag).data(item)); });

			setTimeout(function(){ currentTag.replaceWith(newTag); }, 100);
			$(newTag).on("click", editableFuncReplaceToInput);
			$(newTag).mouseenter(editableFuncHighlightBgcolor);
			$(newTag).mouseleave(editableFuncNormalizeBgcolor);
		}

		// --- update text avatar in case of updating FirstName or LastName
		if(($(newTag).data("action") == "AJAX_updateFirstName") || ($(newTag).data("action") == "AJAX_updateLastName")) 
		{
			ShowActiveAvatar();
		}

		if(($(newTag).text() == "Без имени") || ($(newTag).text() == "Без фамилии")) 
		{

		}
		else if($(newTag).text() == initValue)
		{
			// --- value has not been changed
		}
		else
		{
			var		ajaxAction = $(newTag).data("action");
			var		ajaxActionID = $(newTag).data("id");
			var		ajaxValue = $(newTag).text();
			var		ajaxScript = $(newTag).data("script") || "index.cgi";

			$.ajax({
				url:"/cgi-bin/" + ajaxScript,
				data: {action:ajaxAction, id:ajaxActionID, value:system_calls.ConvertTextToHTML(ajaxValue)}
			}).done(function(data)
				{
					var ajaxResult = JSON.parse(data);

					if(ajaxResult.result == "success")
					{
						if(ajaxAction == "updateGiftRequestedQuantity")
						{
							userProfile.gifts = ajaxResult.gifts;
							RenderGiftPath();
						}
						if(ajaxAction == "updateGiftTitle")
						{
							userProfile.gifts = ajaxResult.gifts;
						}
						if(ajaxAction == "updateGiftDescription")
						{
							userProfile.gifts = ajaxResult.gifts;
						}
						if(ajaxAction == "updateGiftGainedQuantity")
						{
							userProfile.gifts = ajaxResult.gifts;
						}
						if(ajaxAction == "updateGiftLink")
						{
							userProfile.gifts = ajaxResult.gifts;
						}
					}
					else
					{
						console.debug("editableFuncReplaceInputToSpan: ERROR in ajax [action = " + ajaxAction + ", id = " + ajaxActionID + ", ajaxValue = " + ajaxValue + "] " + ajaxResult.description);
					}

				});
		}

		// --- Check if first/last name is empty. In that case change it to "Без хххх"
		// --- !!! Важно !!! Нельзя передвигать наверх. Иначе не произойдет обновления в БД
		if($("#firstName").text() === "") { $("#firstName").text("Без имени"); }
		if($("#lastName").text() === "") { $("#lastName").text("Без фамилии"); }
	};

	// --- Replacement Select to Span
	// --- input: 1) tag
	// ---		2) function to call to convert Span->Select
	var	editableFuncReplaceSelectToSpan = function (param, funcFromSelectToSpan) 
	{
		var		ajaxAction;
		var		ajaxActionID;
		var		ajaxValue;

		console.debug("editableFuncReplaceSelectToSpan: start");

		var currentTag = ((typeof param.html == "function") ? param : $(this));
		var	newTag = $("<span>", {
			text: $(currentTag).val().replace(/^\s+/, "").replace(/\s+$/, ""),
			id: $(currentTag).attr("id"),
			class: $(currentTag).attr("class")
		});

		$(newTag).data("id", $(currentTag).data("id"));
		$(newTag).data("action", $(currentTag).data("action"));

		$(currentTag).replaceWith(newTag);
		$(newTag).on("click", funcFromSelectToSpan);
		$(newTag).mouseenter(editableFuncHighlightBgcolor);
		$(newTag).mouseleave(editableFuncNormalizeBgcolor);

		ajaxAction = $(newTag).data("action");
		ajaxActionID = $(newTag).data("id");
		ajaxValue = $(newTag).text();

		$.ajax({
			url:"/cgi-bin/index.cgi",
			data: {action:ajaxAction, id:ajaxActionID, value:system_calls.ConvertTextToHTML(ajaxValue)}
		}).done(function(data)
			{
				var		ajaxResult = JSON.parse(data);
				if(ajaxResult.result == "success")
				{
					if(ajaxAction == "updateLanguageLevel")
					{
						userProfile.language.forEach(function(item, i, arr)
						{
							if(item.languageID == ajaxActionID)
							{
								item.languageLevel = ajaxValue;
							}
						});
					}
					else if(ajaxAction == "updateSchoolOccupationFinish")
					{
						userProfile.school.forEach(function(item, i, arr)
						{
							if(item.schoolID == ajaxActionID)
							{
								item.schoolOccupationFinish = ajaxValue;
							}
						});
					}
					else if(ajaxAction == "updateSchoolOccupationStart")
					{
						userProfile.school.forEach(function(item, i, arr)
						{
							if(item.schoolID == ajaxActionID)
							{
								item.schoolOccupationStart = ajaxValue;
							}
						});
					}
					else if(ajaxAction == "updateUniversityOccupationFinish")
					{
						userProfile.university.forEach(function(item, i, arr)
						{
							if(item.universityID == ajaxActionID)
							{
								item.universityOccupationFinish = ajaxValue;
							}
						});
					}
					else if(ajaxAction == "updateUniversityOccupationStart")
					{
						userProfile.university.forEach(function(item, i, arr)
						{
							if(item.universityID == ajaxActionID)
							{
								item.universityOccupationStart = ajaxValue;
							}
						});
					}
					else if(ajaxAction == "updateUniversityDegree")
					{
							userProfile.university.forEach(function(item, i, arr)
						{
							if(item.universityID == ajaxActionID)
							{
								item.universityDegree = ajaxValue;
							}
						});
					}
				}
				else
				{
					console.debug("editableFuncReplaceSelectToSpan: ERROR in ajax [action = " + ajaxAction + ", id = " + actionID + ", ajaxValue = " + ajaxValue + "] " + ajaxResult.description);
				}

			});
	};

	var	UpdateFirstName = function () 
	{
		editableFuncReplaceInputToSpan();
	};

	var UpdateLastName = function ()
	{
		editableFuncReplaceInputToSpan();
	};

	var editableFuncHighlightBgcolor = function () {
		$(this).addClass("editable_highlighted_class", 400);
	};

	var editableFuncNormalizeBgcolor = function () {
		$(this).removeClass("editable_highlighted_class", 200, "easeInOutCirc");

	};

	var removeCompanyExperience = function(e) {
		var		currTag = $(this);
		var		affectedID = $(this).data("id");
		var		affectedAction = $(this).data("action");
		var		affectedScript = $(this).data("script");

		$("#AreYouSure #Remove").removeData(); 

		Object.keys(currTag.data()).forEach(function(item) { 
			$("#AreYouSure #Remove").data(item, currTag.data(item)); 
		});
		$("#AreYouSure #Remove").data("id", affectedID);
		$("#AreYouSure #Remove").data("action", affectedAction);
		// $("#AreYouSure #Remove").data("script", affectedScript);


		$("#AreYouSure").modal("show");
	};

	var	AreYouSureRemoveHandler = function() {
		var		affectedID = $("#AreYouSure #Remove").data("id");
		var		affectedAction = $("#AreYouSure #Remove").data("action");
		var		affectedScript = $("#AreYouSure #Remove").data("script");

		if(typeof(affectedScript) == "undefined") affectedScript = "";
		if(!affectedScript.length) affectedScript = "index.cgi";
		$("#AreYouSure").modal("hide");

		$.getJSON("/cgi-bin/" + affectedScript + "?action=" + affectedAction, {id: affectedID})
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
		// ---	 I'm updating GUI immediately after click, not waiting server response
		if(affectedAction == "AJAX_removeCompanyExperience")
		{
			userProfile.companies.forEach(function(item, i, arr) {
				if(item.companyID == affectedID)
				{
					userProfile.companies.splice(i, 1);
				}
			});
			RenderCarrierPath();
		}
		if(affectedAction == "AJAX_removeCertificationEntry")
		{
			userProfile.certifications.forEach(function(item, i, arr) {
				if(item.certificationID == affectedID)
				{
					userProfile.certifications.splice(i, 1);
				}
			});
			RenderCertificationPath();
		}
		if(affectedAction == "AJAX_removeCourseEntry")
		{
			userProfile.courses.forEach(function(item, i, arr) {
				if(item.courseID == affectedID)
				{
					userProfile.courses.splice(i, 1);
				}
			});
			RenderCoursePath();
		}

		if(affectedAction == "AJAX_removeSchoolEntry")
		{
			userProfile.school.forEach(function(item, i, arr) {
				if(item.schoolID == affectedID)
				{
					userProfile.school.splice(i, 1);
				}
			});
			RenderSchoolPath();
		}
		if(affectedAction == "AJAX_removeUniversityEntry")
		{
			userProfile.university.forEach(function(item, i, arr) {
				if(item.universityID == affectedID)
				{
					userProfile.university.splice(i, 1);
				}
			});
			RenderUniversityPath();
		}
		if(affectedAction == "AJAX_removeLanguageEntry")
		{
			userProfile.language.forEach(function(item, i, arr) {
				if(item.languageID == affectedID)
				{
					userProfile.language.splice(i, 1);
				}
			});
			RenderLanguagePath();
		}
		if(affectedAction == "AJAX_removeSkillEntry")
		{
			userProfile.skill.forEach(function(item, i, arr) {
				if(item.skillID == affectedID)
				{
					userProfile.skill.splice(i, 1);
				}
			});
			RenderSkillPath();
		}
		if(affectedAction == "AJAX_removeBookEntry")
		{
			userProfile.books.forEach(function(item, i, arr) {
				if(item.id == affectedID)
				{
					userProfile.books.splice(i, 1);
				}
			});
			RenderBookPath();
		}
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
		if(affectedAction == "AJAX_removeAppliedVacancyEntry")
		{
			userProfile.vacancyApplied.forEach(function(item, i, arr) {
				if(item.id == affectedID)
				{
					userProfile.vacancyApplied.splice(i, 1);
				}
			});
			RenderVacancyPath();
		}
		if((affectedAction == "AJAX_removeGiftEntry") && affectedID)
		{
			$("div#Gift" + affectedID).hide(250);
			setTimeout(function() { $("div#Gift" + affectedID).remove(); }, 1000);
		}

	};

	var	OpenGiftLink_ClickHandler = function(e)
	{
		var	curr_tag	= $(this);
		var	link		= curr_tag.closest(".gift_all").find(".giftLink").val();

		if(link.length)
		{
			window.open(link, "_blank").focus();
		}
		else
		{
			system_calls.PopoverInfo(curr_tag, "Ссылка не указана");
		}
	};

	var	ErrorModal = function(errorMessage)
	{
		$("#ErrorModal_ResultText").empty().append(errorMessage);
		$("#ErrorModal").modal("show");
	};

	return {
		Init: Init,
		DrawAllAvatars: DrawAllAvatars,
		userProfile: userProfile,
		GetUserInitials: GetUserInitials,
		RenderRecommendationPath: RenderRecommendationPath
	};

})();
