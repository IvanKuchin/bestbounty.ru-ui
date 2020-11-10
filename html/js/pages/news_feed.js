var	news_feed = news_feed || {};

news_feed = (function()
{
'use strict';

var	myCompanies = [];
var	globalPageCounter = 0;  // --- used for transfer arg to function HandlerScrollToShow
var	globalPostMessageImageList = []; // --- storage of previewImage objects in NewMessageModal
var	imageTempSet;
var globalNewsFeed;
var scrollLock = false; // --- controls consecutive pagination
var	globalUploadImageCounter, globalUploadImageTotal, globalUploadImage_UnloadedList;
var	myProfile = {};
var	globalMyCompanies = [];
var	modalScrollPosition; // --- Modal issues on IOS (see end of Init)

var Init = function() 
{
	var		uploadFileRegexImageVideo = /(\.|\/)(gif|jpe?g|png|mov|avi|mp4|webm)$/i;
	var		uploadFileRegexImage = /(\.|\/)(gif|jpe?g|png)$/i;
	var		uploadFileRegexVideo = /(\.|\/)(mov|avi|mp4|webm)$/i;

	myProfile.id = $("#myUserID").data("myuserid");
	myProfile.firstName = $("#myFirstName").text();
	myProfile.lastName = $("#myLastName").text();

	// --- avoid caching in XHR
	$.ajaxSetup({ cache: false });

	{

		ZeroizeThenUpdateNewsFeedThenScrollTo(system_calls.GetParamFromURL("scrollto").length ? "#" + system_calls.GetParamFromURL("scrollto") : "");

		// --- "New message" events
		// --- News feed post message
		$("#NewsFeedMessageSubmit").on("click", NewsFeedPostMessage);
		// --- News feed: New message: Link: GetData button
		$("#newsFeed_NewMessageLink_GetDataButton").on("click", function() {
			GetDataFromProvidedURL();
		});
		// --- Post message modal window show handler
		$("#NewsFeedNewMessage").on("shown.bs.modal", function (e) {
			NewMessageNewsFeedModalShownHandler();
		});
		// --- Post message modal window hide handler
		$("#NewsFeedNewMessage").on("hidden.bs.modal", function (e) {
			NewMessageNewsFeedModalHiddenHandler();
		});
		$("#newsFeedMessageLink").on("input" , function (e) {
			var		content = $(this).val();
			if(content.length) $("#newsFeed_NewMessageLink_GetDataButton").removeAttr("disabled");
			else $("#newsFeed_NewMessageLink_GetDataButton").attr("disabled", "");
		});

		// --- "Edit message" events
		// --- News feed post message
		$("#editNewsFeedMessageSubmit").on("click", function() {
			EditNewsFeedPostMessage();
		});
		// --- Post message modal window show handler
		$("#editNewsFeedMessage").on("show.bs.modal", function (e) {
			EditNewsFeedModalShownHandler();
		});
		// --- Post message modal window hide handler
		$("#editNewsFeedMessage").on("hidden.bs.modal", function (e) {
			EditNewsFeedModalHiddenHandler();
		});

		// --- New message image uploader
		$(function () {
			// Change this to the location of your server-side upload handler:
			$('#newMessageFileUpload').fileupload({
				url: '/cgi-bin/imageuploader.cgi',
				dataType: 'json',
				maxFileSize: 250 * 1024 * 1024,
				// acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
				acceptFileTypes: uploadFileRegexImageVideo,
				singleFileUploads: true,
				disableImageResize: false,
				imageMaxWidth: 1024,
				imageMaxHeight: 768,

				always: function (e, data)
				{
					var containerPreview = $("<div>").appendTo("#PostMessage_PreviewImage");

					console.debug("newimageuploader: always handler: start");
					containerPreview.addClass("container-fluid");

					data.files.forEach(
						function(item, i, arr)
						{
							var		rowPreview = $("<div>").appendTo(containerPreview)
																.addClass("row");

							console.debug("newimageuploader: always handler: filename [" + item.name + "]");

							--globalUploadImageCounter;
							$("#NewsFeedMessageSubmit").text('Загрузка (' + (globalUploadImageTotal - globalUploadImageCounter) + ' из ' + globalUploadImageTotal + ') ...');

							// TODO: 2delete: debug function to check upload functionality
							globalUploadImage_UnloadedList = jQuery.grep(globalUploadImage_UnloadedList, function(itemList, numList) { return itemList != item.name; } );
							Update_PostMessage_ListUnloaded(globalUploadImage_UnloadedList);


							console.debug("newimageuploader: always handler: number of uploading images is " + globalUploadImageCounter);
							if(!globalUploadImageCounter)
							{
								// $("#NewsFeedMessageSubmit").button('reset');
								$("#NewsFeedMessageSubmit").text('Написать');
							}

							// --- reset progress bar
							$('#NewMessageProgress .progress-bar').removeClass("active")
																  .css('width', '0%');
							$('#NewMessageProgress .progress-string').empty();


							if(typeof(data.result) != "undefined")
							{							
								if(data.result[i].result == "success")
								{							
									rowPreview.addClass(" alert alert-success");
									$("<div>").addClass("col-lg-2 col-md-3 col-sm-3 col-xs-5").appendTo(rowPreview).append(typeof(item.preview) != "undefined" ? item.preview : "");
									$("<div>").addClass("col-lg-9 col-md-8 col-sm-8 col-xs-6").appendTo(rowPreview).append(item.name);

									globalPostMessageImageList.push(data.result[i]);
								}
								else
								{
									rowPreview.addClass(" alert alert-danger");
									$("<div>").addClass("col-lg-2 col-md-3 col-sm-3 col-xs-5").appendTo(rowPreview);
									$("<div>").addClass("col-lg-9 col-md-8 col-sm-8 col-xs-6").appendTo(rowPreview).append(data.result[0].fileName + " " + data.result[0].textStatus);
								}
							}
							else
							{
								console.error("newimageuploader:ERROR in image upload (most probably image format is not supported)");							
								rowPreview.addClass(" alert alert-danger");
								$("<div>").addClass("col-lg-2 col-md-3 col-sm-3 col-xs-5").appendTo(rowPreview);
								$("<div>").addClass("col-lg-9 col-md-8 col-sm-8 col-xs-6").appendTo(rowPreview).append("ошибка: " + item.name);
							}
						}
					);
				},
				done: function (e, data) 
				{
					var	value = data.result;
						{
							if(value[0].result == "error")
							{
								console.error("newimageuploader: done handler:ERROR uploading file [" + value.fileName + "] error code [" + value.textStatus + "]");
							}

							if(value[0].result == "success")
							{
								console.debug("newimageuploader: done handler: uploading success [" + value[0].fileName + "]");
								// DrawAllAvatars();
							}
						}
				},
				add: function (e, data) 
				{
					// --- original part of "add" handler 
					// --- !!! ATTENTION !!! do not change it
					var $this = $(this);
					var originalAdd = $.blueimp.fileupload.prototype.options.add;

					data.process(function () {
						return $this.fileupload('process', data);
					});
					originalAdd.call(this, e, data);


					// --- custom part of "add" handler
					data.files.forEach(
						function(item, i)
						{ 
							console.debug("newimageuploader: add handler: filename " + i + " is " + item.name); 
							if(uploadFileRegexImageVideo.test(item.name))
							{
								++globalUploadImageCounter;
								globalUploadImageTotal = globalUploadImageCounter;

								// TODO: 2delete:  debug function to check upload functionality
								globalUploadImage_UnloadedList.push(item.name);
								Update_PostMessage_ListUnloaded(globalUploadImage_UnloadedList);
							}
						});
					if(globalUploadImageCounter)
					{
						// $("#NewsFeedMessageSubmit").button('loading');
						$("#NewsFeedMessageSubmit").text('Загрузка (0 из ' + globalUploadImageCounter + ') ...');
					}
					console.debug("newimageuploader: add handler: number of uploading images is " + globalUploadImageCounter);
				},
				progressall: function (e, data) {
					var progress = parseInt(data.loaded / data.total * 100, 10);

					$('#NewMessageProgress .progress-bar').css('width', progress + '%');
					if(progress > 97) 
					{
						$('#NewMessageProgress .progress-bar').addClass("active");
						$('#NewMessageProgress .progress-string').empty().append("Обработка...");
					}
					else
					{
						$('#NewMessageProgress .progress-string').empty().append(progress + "%");
					}
				},
				fail: function (e, data) {
					console.error("editimageuploader: fail handler:ERROR image uploading [" + data.textStatus + "]");
					// alert("ошибка загрузки фаила: " + data.textStatus);
				}

				})
				.on('fileuploadprocessalways', function (e, data) {
					if(
						(typeof(data.files.error) !=  "undefined") && data.files.error &&
						(typeof(data.files[0].error) !=  "undefined") && (data.files[0].error == "File is too large")
					  )
					{
						system_calls.AlertError("newsFeedNewMessageError", "Фаил слишком большой");
					}

					if(data.files.error)
					{
						console.error("fileuploader:fileuploadprocessalways:ERROR: submit to upload (" + data.files[0].error + ")");//error message
						return false;
					} 
					
					console.log("fileuploader:fileuploadprocessalways: submit to upload", data.files[0].name);//error message
					return true;
				})
				.prop('disabled', !$.support.fileInput)
				.parent().addClass($.support.fileInput ? undefined : 'disabled');
		});


		// --- Edit image uploader
		$(function () {
			// Change this to the location of your server-side upload handler:
			$('#editFileupload').fileupload({
				url: '/cgi-bin/imageuploader.cgi',
				dataType: 'json',
				maxFileSize: 250 * 1024 * 1024, 
				// acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
				acceptFileTypes: uploadFileRegexImageVideo,
				singleFileUploads: true,
				disableImageResize: false,
				imageMaxWidth: 1024,
				imageMaxHeight: 768,


				always: function (e, data)
				{
					var containerPreview = $("<div>").appendTo("#editPostMessage_PreviewImage");

					console.debug("editimageuploader: always handler: start");
					containerPreview.addClass("container-fluid");

					data.files.forEach(
						function(item, i, arr)
						{
							var		rowPreview = $("<div>").appendTo(containerPreview)
																.addClass("row");

							console.debug("editimageuploader: always handler: filename [" + item.name + "]");
		
							--globalUploadImageCounter;
							$("#editNewsFeedMessageSubmit").text('Загрузка (' + (globalUploadImageTotal - globalUploadImageCounter) + ' из ' + globalUploadImageTotal + ') ...');

							// TODO: 2delete: debug function to check upload functionality
							globalUploadImage_UnloadedList = jQuery.grep(globalUploadImage_UnloadedList, function(itemList, numList) { return itemList != item.name; } );
							Update_PostMessage_ListUnloaded(globalUploadImage_UnloadedList);

							console.debug("editimageuploader: always handler: number of uploading images is " + globalUploadImageCounter);
							if(!globalUploadImageCounter)
							{
								// $("#editNewsFeedMessageSubmit").button('reset');
								$("#editNewsFeedMessageSubmit").text('Написать');
							}

							// --- reset progress bar
							$('#EditMessageProgress .progress-bar').removeClass("active")
																  .css('width', '0%');
							$('#EditMessageProgress .progress-string').empty();

							if(typeof(data.result) != "undefined")
							{							
								if(data.result[i].result == "success")
								{							
									rowPreview.addClass(" alert alert-success");
									$("<div>").addClass("col-lg-2 col-md-3 col-sm-3 col-xs-5").appendTo(rowPreview).append(typeof(item.preview) != "undefined" ? item.preview : "");
									$("<div>").addClass("col-lg-9 col-md-8 col-sm-8 col-xs-6").appendTo(rowPreview).append(item.name);

									globalPostMessageImageList.push(data.result[i]);
								}
								else
								{
									rowPreview.addClass(" alert alert-danger");
									$("<div>").addClass("col-lg-2 col-md-3 col-sm-3 col-xs-5").appendTo(rowPreview);
									$("<div>").addClass("col-lg-9 col-md-8 col-sm-8 col-xs-6").appendTo(rowPreview).append(data.result[0].fileName + " " + data.result[0].textStatus);
								}
							}
							else
							{
								console.error("newimageuploader:ERROR in image upload (most probably image format is not supported)");							
								rowPreview.addClass(" alert alert-danger");
								$("<div>").addClass("col-lg-2 col-md-3 col-sm-3 col-xs-5").appendTo(rowPreview);
								$("<div>").addClass("col-lg-9 col-md-8 col-sm-8 col-xs-6").appendTo(rowPreview).append("ошибка: " + item.name);
							}
						}
					);
				},
				done: function (e, data) 
				{
					var	value = data.result;
						{
							if(value[0].result == "error")
							{
								console.error("editimageuploader: done handler:ERROR uploading file [" + value.fileName + "] error code [" + value.textStatus + "]");
							}

							if(value[0].result == "success")
							{
								console.debug("editimageuploader: done handler: uploading success [" + value[0].fileName + "]");
								// DrawAllAvatars();
							}
						}

				},
				add: function (e, data) 
				{
					// --- original part of "add" handler 
					// --- !!! ATTENTION !!! do not change it
					var $this = $(this);
					var originalAdd = $.blueimp.fileupload.prototype.options.add;

					data.process(function () {
						return $this.fileupload('process', data);
					});
					originalAdd.call(this, e, data);

					// --- custom part of "add" handler
					data.files.forEach(
						function(item, i)
						{ 
							console.debug("editimageuploader: add handler: filename " + i + " is " + item.name); 
							if(uploadFileRegexImageVideo.test(item.name))
							{
								++globalUploadImageCounter;
								globalUploadImageTotal = globalUploadImageCounter;
								// TODO: 2delete:  debug function to check upload functionality
								globalUploadImage_UnloadedList.push(item.name);
								Update_PostMessage_ListUnloaded(globalUploadImage_UnloadedList);
							}
						});
					if(globalUploadImageCounter)
					{
						// $("#NewsFeedMessageSubmit").button('loading');
						$("#editNewsFeedMessageSubmit").text('Загрузка (0 из ' + globalUploadImageCounter + ') ...');
					}

					console.debug("editimageuploader: add handler: number of uploading images is " + globalUploadImageCounter);
				},
				progressall: function (e, data) {
					var progress = parseInt(data.loaded / data.total * 100, 10);

					$('#EditMessageProgress .progress-bar').css('width', progress + '%');
					if(progress > 97) 
					{
						$('#EditMessageProgress .progress-bar').addClass("active");
						$('#EditMessageProgress .progress-string').empty().append("Обработка...");
					}
					else
					{
						$('#EditMessageProgress .progress-string').empty().append(progress + "%");
					}
				},
				fail: function (e, data) {
					console.error("editimageuploader: fail handler:ERROR image uploading [" + data.textStatus + "]");
					// alert("ошибка загрузки фаила: " + data.textStatus);
				}

			})
				.on('fileuploadprocessalways', function (e, data) {
					if(
						(typeof(data.files.error) !=  "undefined") && data.files.error &&
						(typeof(data.files[0].error) !=  "undefined") && (data.files[0].error == "File is too large")
					  )
					{
						system_calls.AlertError("newsFeedEditMessageError", "Фаил слишком большой");
					}

					if(data.files.error)
					{
						console.error("fileuploader:fileuploadprocessalways:ERROR: submit to upload (" + data.files[0].error + ")");//error message
						return false;
					} 
					
					console.log("fileuploader:fileuploadprocessalways: submit to upload", data.files[0].name);//error message
					return true;
				})
				.prop('disabled', !$.support.fileInput)
				.parent().addClass($.support.fileInput ? undefined : 'disabled');
		});


		// --- Is it require to update username ?
		if($("#myUserID").data("myuserid"))
		{
			if(isUsernameExist() === true)
			{
				if(isUserAvatarExist() === true)
				{

				}
			}
		}

		// --- DeleteMessage button click handler
		$("#deleteMessageFromFeedSubmit").on("click", function ()
		{
			$("#DeleteMessageFromFeed").modal("hide");
			DeleteMessage($(this).data("messageID"));
		});

		// --- DeleteMessageComment button click handler
		$("#deleteCommentFromFeedSubmit").on("click", function ()
		{
			$("#DeleteCommentFromFeed").modal("hide");
			$("#viewNewsFeedMessage").modal("hide");
			DeleteMessageComment($(this).data("commentID"));
		});

		// --- Update avatar modal click handler
		$("#usernameUpdateAvatarSubmit").on("click", function ()
		{
			$("#UsernameUpdateAvatar").modal("hide");
			window.location = "/edit_profile";
		});

		// --- UserName update modal
		$("#userNameUpdateSubmit").on("click", function() 
		{
			$("#UsernameCredentials").modal("hide");
			UsernameUpdate();
		});

		// --- Write comment
		$("#buttonNewsFeedViewMessageComment").on("click", function ()
		{
			WriteCommentButtonHandler();
		});

		// --- write comment hidden.bs handler	
		$("#viewNewsFeedMessage").on("hidden.bs.modal", function ()
		{
			$("#buttonNewsFeedViewMessageComment").button("reset");
		});
		$("#viewNewsFeedMessage").on("hidden.bs.modal", function ()
		{
			$("#divNewsFeedMessageBody").empty();
			$("#divNewsFeedMessageComments").empty();
			$("#spanNewsFeedViewMessageUsername").empty();
			$("#spanNewsFeedViewMessageTimestamp").empty();
			$("#buttonNewsFeedViewMessageComment").removeData()
												.data("loadingText", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span> Загрузка...");
		});

		/*
		Workaround to overcome issues in modal dialog on IOS devices
		  1) cursor positioning (https://stackoverflow.com/questions/46339063/ios-11-safari-bootstrap-modal-text-area-outside-of-cursor/46866149#46866149)
		  2) background scroll (https://stackoverflow.com/questions/19060301/how-to-prevent-background-scrolling-when-bootstrap-3-modal-open-on-mobile-browse)
		*/
		if(isMobile.apple.device)
		{
			$('body').addClass('iOS-device');

			$('.modal').on('show.bs.modal', function() {
					modalScrollPosition = $(window).scrollTop();
				});
			$('.modal').on('hidden.bs.modal', function() {
					$('.iOS-device').css('top', 0);
					$(window).scrollTop(modalScrollPosition);    
				});
		}

		// --- scroll handler
		$(window).on("scroll resize lookup", HandlerScrollToShow);
	}
};

// --- initialize all fields in "edit form"
var EditNewsFeedModalShownHandler = function()
{
	var		editMessageID = $("#editNewsFeedMessageSubmit").data("messageID");

	// --- globalUploadImageCounter used for disabling "Post" button during uploading images
	globalUploadImageCounter = 0;
	globalUploadImageTotal = 0;

	// TODO: 2delete: debug function to check upload functionality
	globalUploadImage_UnloadedList = [];
	Update_PostMessage_ListUnloaded(globalUploadImage_UnloadedList);

	// $("#editNewsFeedMessageSubmit").button('reset');
	$("#editNewsFeedMessageSubmit").text("Редактировать");

	// --- clean-up preview pictures in PostMessage modal window 
	$("#editPostMessage_PreviewImage").empty();
	globalPostMessageImageList = [];

	// --- set progress bar to 0 length
	$('div.progress .progress-bar').css('width', '0%');

	// --- set var imageTempSet to random
	imageTempSet = Math.floor(Math.random()*99999999);
	$('#editFileupload').fileupload({formData: {imageTempSet: imageTempSet, messageID: $("#editNewsFeedMessageSubmit").data("messageID")}});

	globalNewsFeed.forEach(function(item, i, arr)
		{
			if(typeof(item.messageId) != "undefined")
			{
				if(editMessageID == item.messageId)
				{
					var		messageMessage = item.messageMessage;
					var 	containerPreview = $("<div>").appendTo("#editPostMessage_PreviewImage");

					// --- init all fields
					$("#editNewsFeedMessageTitle").val(system_calls.ConvertHTMLToText(item.messageTitle));
					$("#editNewsFeedMessageLink").val(item.messageLink);
					$("#editNewsFeedMessageText").val(system_calls.ConvertHTMLToText(messageMessage));

					if(item.messageAccessRights == "public")
					{
						$("#editNewsFeedAccessRightsPublic").prop("checked", true);
					}
					if(item.messageAccessRights == "private")
					{
						$("#editNewsFeedAccessRightsPrivate").prop("checked", true);
					}
					if(item.messageAccessRights == "friends")
					{
						$("#editNewsFeedAccessRightsFriends").prop("checked", true);
					}


					containerPreview.addClass("container-fluid");

					item.messageImageList.forEach(
						function(item, i, arr)
						{
							// --- video could be encoded in two formats (webm and mp4), but having the same content
							// --- video must be displayed as the only file
							// --- all images must be shown
							if (
								(i === 0) ||
								((typeof(item.mediaType) != "undefined") && (item.mediaType == "image"))
							   )
							{

								var		rowPreview = $("<div>").appendTo(containerPreview)
																.addClass("row")
																.attr("id", "rowPreviewImageID" + item.id);
								var		spanRemove = $("<span>").addClass("glyphicon glyphicon-remove color_red cursor_pointer")
																.on("click", EditNewsFeedModalRemoveImage)
																.attr("data-imageid", item.id)
																.attr("data-action", "AJAX_newsFeedMarkImageToRemove");
								var		mediaPreview;
								var		mediaTitle;

								if(item.mediaType == "image")
								{
									mediaPreview = $("<img/>").attr("src", "/images/feed/" + item.folder + "/" + item.filename)
															.addClass("news_feed_edit_message_preview");
									mediaTitle = "изображение";
								}
								if(item.mediaType == "video")
								{
									mediaPreview = $("<video/>").attr("src", "/video/feed/" + item.folder + "/" + item.filename)
															.addClass("news_feed_edit_message_preview");
									mediaTitle = "видео";
								}
								if(item.mediaType == "youtube_video")
								{
									mediaPreview = $("<iframe>").addClass("max_100percents_100px")
																.attr("src", item.filename)
																.attr("frameborder", "0")
																.attr("allowfullscreen", "");
									mediaTitle = "youtube видео";
								}

								rowPreview.addClass(" alert alert-success");
								$("<div>").addClass("col-lg-2 col-md-3 col-sm-3 col-xs-5").appendTo(rowPreview).append(mediaPreview);
								$("<div>").addClass("col-lg-8 col-md-7 col-sm-6 col-xs-3").appendTo(rowPreview).append(mediaTitle);
								$("<div>").addClass("col-lg-1 col-md-1 col-sm-2 col-xs-3").appendTo(rowPreview).append(spanRemove);
							}
							// globalPostMessageImageList.push(data.result[i]);
						}
					);


				}
			}
		});

	// --- zeroize tempSet for user at image_news table
	$.getJSON('/cgi-bin/index.cgi?action=AJAX_prepareEditFeedImages', {messageID: editMessageID, imageTempSet: imageTempSet})
			.done(function(data) {
				console.debug("EditNewsFeedModalShownHandler: $(document).getJSON(AJAX_cleanupFeedImages).done(): result = " + data.result);
			});
};

var EditNewsFeedModalRemoveImage = function(e)
{
	var		currTag = $(this);
	var		currAction = currTag.data("action");
	var		imageID = currTag.data("imageid");

	$("div#rowPreviewImageID" + imageID).remove();

	$.getJSON('/cgi-bin/index.cgi?action=' + currAction, {imageID: imageID})
			.done(function(data) {
				if(data.result == "success")
				{

				}
				else
				{
					console.error("EditNewsFeedModalRemoveImage: " + currAction + ":ERROR: " + data.description);
				}
			});
};

// --- clean-up picture uploads environment
var EditNewsFeedModalHiddenHandler = function()
{
	// --- clean-up preview pictures in PostMessage modal window 
	$("#editPostMessage_PreviewImage").empty();
	globalPostMessageImageList = [];

	// --- set progress bar to 0 length
	$('div.progress .progress-bar').css('width', '0%');

	// --- clean-up error message
	$("#newsFeedEditMessageError").empty().removeClass();

	// --- cleanup picture list from the posted message
	$.getJSON('/cgi-bin/index.cgi?action=AJAX_editCleanupFeedImages', {imageTempSet: imageTempSet})
			.done(function(data) {
				console.debug("EditNewsFeedModalHiddenHandler: $(document).getJSON(AJAX_editCleanupFeedImages).done(): result = " + data.result);
			});


	// --- set var imageSet to NULL
	imageTempSet = "";
	$('#editFileupload').fileupload({formData: {imageTempSet: imageTempSet}});

};

var	EditNewsFeedPostMessage = function () 
{
	var	isClearToSubmit = false;
	var	title = $("#editNewsFeedMessageTitle").val();
	var	text = $("#editNewsFeedMessageText").val();
	var	images = $("#editPostMessage_PreviewImage").html();
	var	lenghtyWord;

	if((title.length === 0) && (text.length === 0) && (images.length < 40))
	{
		system_calls.PopoverError("editNewsFeedMessageSubmit", "Невозможно написать пустое сообщение");
	}
	else if(system_calls.LongestWordSize(title) > 37) // четырёхсотпятидесятисемимиллиметровое
	{
		lenghtyWord = system_calls.LongestWord(title);

		$("#editNewsFeedMessageTitle").selectRange(title.search(lenghtyWord), title.search(lenghtyWord) + lenghtyWord.length);

		system_calls.PopoverError("editNewsFeedMessageSubmit", "Слишком длинное слово: " + lenghtyWord);
	}
	else if(system_calls.LongestWordSize(text) > 37) // четырёхсотпятидесятисемимиллиметровое
	{
		lenghtyWord = system_calls.LongestWord(text);

		$("#editNewsFeedMessageText").selectRange(text.search(lenghtyWord), text.search(lenghtyWord) + lenghtyWord.length);

		system_calls.PopoverError("editNewsFeedMessageSubmit", "Слишком длинное слово: " + lenghtyWord);
	}
	else
	{
		$("#NewsFeedMessageSubmit").button("loading");

		$.ajax({
				url: '/cgi-bin/index.cgi', 
				type: 'POST',
				dataType: 'json',
				data: 
				{
					action: 'AJAX_updateNewsFeedMessage',
					newsFeedMessageID:	 $("#editNewsFeedMessageSubmit").data("messageID"),
					newsFeedMessageTitle:  $("#editNewsFeedMessageTitle").val(),
					newsFeedMessageLink:   $("#editNewsFeedMessageLink").val(),
					newsFeedMessageText:   $("#editNewsFeedMessageText").val(),
					newsFeedMessageRights: $("#editNewsFeedAccessRights input:checked").val(),
					newsFeedMessageImageTempSet: imageTempSet 
				}})
				.done(function(data) {
					console.debug("$(document).getJSON(AJAX_updateNewsFeed).success(): status - " + data[0].result);

					if(data[0].result == "error") 
					{
						system_calls.AlertError("newsFeedEditMessageError", data[0].description);
						console.error("$(document).getJSON(AJAX_updateNewsFeed).success():ERROR status " + data[0].description);
					}				
					if(data[0].result == "success") 
					{
						ZeroizeThenUpdateNewsFeedThenScrollTo("");

						$("#editNewsFeedMessage").modal("hide");
					}			
				})
				.fail( function(data) {
					system_calls.AlertError("newsFeedNewMessageError", "ошибка ответа сервера");
					console.error("$(document).getJSON(AJAX_updateNewsFeed).success():ERROR parsing JSON server response");
				})
				.always(function(data) {
					$("#NewsFeedMessageSubmit").button("reset");
				});
	}
};


var DeleteMessage = function(messageID) 
{
	// --- improve user experience by removing message immediately
	// --- on a slow speed links users can continue seeing it some time
	$("div#message" + messageID).parent().empty();
	$.getJSON('/cgi-bin/index.cgi?action=AJAX_deleteNewsFeedMessage', {messageID: messageID})
	 		.done(function(data) 
	 		{
				if(data.result == "success")
				{
					ZeroizeThenUpdateNewsFeedThenScrollTo("");
				}
				else
				{
					console.error("DeleteMessage: getJSON(AJAX_deleteNewsFeedMessage).done():ERROR [" + data.description + "]");
				}
			});
};

var DeleteMessageComment = function(commentID) 
{
	$.getJSON('/cgi-bin/index.cgi?action=AJAX_deleteNewsFeedComment', {commentID: commentID})
	 		.done(function(data) 
	 		{
				if(data.result == "success")
				{
					if($("#buttonNewsFeedViewMessageComment").data("action") == "AJAX_commentOnMessageInNewsFeed")
						RefreshMessageCommentsList($("#buttonNewsFeedViewMessageComment").data("messageID"));
					if($("#buttonNewsFeedViewMessageComment").data("action") == "AJAX_commentOnBookInNewsFeed")
						RefreshBookCommentsList($("#buttonNewsFeedViewMessageComment").data("bookID"));
					if($("#buttonNewsFeedViewMessageComment").data("action") == "AJAX_commentOnCertificationInNewsFeed")
						RefreshCertificationCommentsList($("#buttonNewsFeedViewMessageComment").data("certificationID"));
					if($("#buttonNewsFeedViewMessageComment").data("action") == "AJAX_commentOnScienceDegreeInNewsFeed")
						RefreshScienceDegreeCommentsList($("#buttonNewsFeedViewMessageComment").data("scienceDegreeID"));
				}
				else
				{
					console.error("DeleteMessageComment: getJSON(AJAX_deleteNewsFeedComment).done():ERROR [" + data.description + "]");
				}
			});
};

var LazyImageLoad = function()
{
	$("img[data-lazyload]").each(function() 
		{
			var		lazyImg = $(this).attr("data-lazyload");

			if(lazyImg)
			{
				$(this).attr("src", lazyImg);
				$(this).attr("data-lazyload", "");
			}
		});

	// --- !!! It is imprtant to rebuild carousel after downloading carousel-images
	$(".carousel").carousel();
};

var NewMessageModalFreezeAllFields = function()
{
	$("#newsFeedMessageTitle").attr("disabled", "");
	$("#newsFeedMessageLink").attr("disabled", "");
	$("#newsFeedMessageText").attr("disabled", "");

	$("#newsFeed_NewMessageLink_GetDataButton").button('loading');
	$("#NewsFeedMessageSubmit").button('loading');
};

var NewMessageModalResetLayout = function()
{
	$("#newsFeedMessageTitle").removeAttr("disabled");
	$("#newsFeedMessageLink").removeAttr("disabled");
	$("#newsFeedMessageText").removeAttr("disabled");

	$("#newsFeed_NewMessageLink_GetDataButton").button('reset');
	$("#NewsFeedMessageSubmit").button('reset');
};

var GetDataFromProvidedURL = function()
{
	var		newMessageURL = $("#newsFeedMessageLink").val();

	if(newMessageURL.length)
	{
		NewMessageModalFreezeAllFields();

		$.getJSON('/cgi-bin/index.cgi?action=AJAX_getURLMetaData', {url: newMessageURL, imageTempSet: imageTempSet})
		 		.done(function(data) {
					if(data.result == "success")
					{
						if(data.title.length)
						{
							$("#newsFeedMessageTitle").val($("#newsFeedMessageTitle").val() + system_calls.ConvertHTMLToText(data.title));
						}
						else
						{
							// field is empty
							$("#newsFeedMessageTitle").popover({"placement":"top", "content": "ничего не нашлось"})
													.popover("show");
							setTimeout(function () 
								{
									$("#newsFeedMessageTitle").popover("destroy");
								}, 3000);
						}

						if(data.description.length)
						{
							$("#newsFeedMessageText").val($("#newsFeedMessageText").val() + system_calls.ConvertHTMLToText(data.description));
						}
						else
						{
							// field is empty
							$("#newsFeedMessageText").popover({"placement":"top", "content": "ничего не нашлось"})
													.popover("show");
							setTimeout(function () 
								{
									$("#newsFeedMessageText").popover("destroy");
								}, 3000);
						}

						// --- add preview image to the list of already uploaded images and update GUI
						if(typeof(data.imageID) && typeof(data.imageURL) && data.imageID.length && data.imageURL.length)
						{
							// --- update GUI
							var 	containerPreview = $("<div>").appendTo("#PostMessage_PreviewImage");
							var		rowPreview = $("<div>").appendTo(containerPreview)
															.addClass("row")
															.attr("id", "rowPreviewImageID" + data.imageID);
							var		mediaPreview, mediaComment;
							var		spanRemove = $("<span>").addClass("glyphicon glyphicon-remove color_red cursor_pointer")
															.on("click", EditNewsFeedModalRemoveImage)
															.attr("data-imageid", data.imageID)
															.attr("data-action", "AJAX_newsFeedMarkImageToRemove");

							if((typeof(data.mediaType) != "undefined") && (data.mediaType == "image"))
							{
								mediaPreview = $("<img/>").attr("src", "/images/feed/" + data.imageURL)
														.addClass("news_feed_edit_message_preview");
								mediaComment = "подготовленное изображение";
							}
							else if((typeof(data.mediaType) != "undefined") && (data.mediaType == "youtube_video"))
							{
								// --- <iframe width="560" height="315" src="https://www.youtube.com/embed/WNkCqa1LfuI" frameborder="0" allowfullscreen></iframe>
								mediaPreview = $("<iframe>").addClass("max_100percents_100px")
															.attr("src", data.imageURL)
															.attr("frameborder", "0")
															.attr("allowfullscreen", "");
								mediaComment = "youtube видео";
							}
							else
							{
								console.debug("GetDataFromProvidedURL: server return unknown or undefined mediaType");
							}

							rowPreview.addClass("alert alert-success");
							$("<div>").addClass("col-lg-2 col-md-3 col-sm-3 col-xs-5").appendTo(rowPreview).append(mediaPreview);
							$("<div>").addClass("col-lg-8 col-md-7 col-sm-6 col-xs-3").appendTo(rowPreview).append(mediaComment);
							$("<div>").addClass("col-lg-1 col-md-1 col-sm-2 col-xs-3").appendTo(rowPreview).append(spanRemove);

							// --- add preview image to the list of already uploaded images
							globalPostMessageImageList.push({filename:"", imageID: data.imageID, imageURL:data.imageURL, jqXHR: "", result: "success", testStatus: ""});
						}

					}
					else
					{
						// field is empty
						$("#newsFeedMessageLink").popover({"placement":"top", "content": "ОШИБКА: " + data.description})
												.popover("show");
						setTimeout(function () 
							{
								$("#newsFeedMessageLink").popover("destroy");
							}, 3000);

						console.error("GetDataFromProvidedURL: getJSON(AJAX_getURLMetaData).done():ERROR [" + data.description + "]");
					}
				})
				.always(function(data) {
					NewMessageModalResetLayout();
				});
	}
	else
	{
		// field is empty
		$("#newsFeedMessageLink").popover({"placement":"top", "content": "напишите ссылку откуда взять данные"})
							.popover("show");
		setTimeout(function () 
			{
				$("#newsFeedMessageLink").popover("destroy");
			}, 3000);
	}
};

var isUserAvatarExist = function()
{
	var		myUserAvatar = $("#myUserID").data("myuseravatar");

	if((myUserAvatar === "") || (myUserAvatar == "empty"))
	{
		if(Math.floor(Math.random() * 10) == 5)
			$("#UsernameUpdateAvatar").modal("show");

		return false; // --- UserAvatar needed to update
	}
	return true; // --- UserAvatar don't need to update
};

var isUsernameExist = function()
{
	var myFirstName = $("#myFirstName").text();
	var myLastName = $("#myLastName").text();

	if((myFirstName === "") || (myLastName === ""))
	{
		if(myFirstName !== "")
		{
			$("#UsernameCredentialsFirstName").val(myFirstName);
		}
		if(myLastName !== "")
		{
			$("#UsernameCredentialsLastName").val(myLastName);
		}
		$("#UsernameCredentials").modal("show");

		return false; // --- Username needed to update
	}
	return true; // --- Username don't need to update
};

var UsernameUpdate = function()
{
	var firstName = $("#UsernameCredentialsFirstName").val();
	var lastName = $("#UsernameCredentialsLastName").val();

	$("#myFirstName").text(firstName);
	$("#myLastName").text(lastName);


	$.getJSON('/cgi-bin/index.cgi?action=AJAX_updateFirstLastName', {firstName: firstName, lastName: lastName})
	 		.done(function(data) {
				console.debug("UsernameUpdateClickHandler: getJSON(AJAX_updateFirstLastName).done(): receive answer from server on 'like' click");

				if(data.result == "success")
				{
				}
			});

};

var BuildFriendBlock = function(item)
{
	var		tagContainer, tagRowContainer, tagPhotoBlock, tagUserLink, tagPhotoCanvas, tagMainInfo, tagCompanyLink;
	var		result;

	tagContainer 	= $("<div/>").addClass("container-fluid");
	tagRowContainer	= $("<div/>").addClass("row single_block box-shadow--6dp ");
	tagPhotoBlock	= $("<div/>").addClass("col-md-1 col-xs-2 news_feed_photo_block padding_0px");
	tagUserLink		= $("<a>").attr("href", "/userprofile/" + item.friendID);
	tagCompanyLink	= $("<a>").attr("href", "/view_company?id=" + item.friendCompanyID);
	tagPhotoCanvas	= $("<canvas>")	.attr("width", "40")
									.attr("height", "40")
									.addClass('canvas-big-avatar')
									.addClass('canvas-width40px');
	tagMainInfo		= $("<div/>")	.addClass("col-md-10 col-xs-10 container ");

	tagContainer	.append(tagRowContainer);
	tagRowContainer	.append(tagMainInfo);
	tagRowContainer	.append(tagPhotoBlock)
					.append(tagMainInfo);
	tagPhotoBlock	.append(tagPhotoCanvas);
	tagMainInfo		.append(tagUserLink);
	tagUserLink		.append(item.friendName + " " + item.friendNameLast);
	if(item.friendUsersCompanyPositionTitle)
	{
		tagMainInfo	.append(" сейчас работает на должности " + item.friendUsersCompanyPositionTitle);
	}
	if(item.friendCompanyID)
	{
		tagCompanyLink.append(item.friendCompanyName);
		tagMainInfo	.append(" в ")
					.append(tagCompanyLink);
	}

	DrawUserAvatar(tagPhotoCanvas[0].getContext("2d"), item.friendAvatar, item.friendName, item.friendNameLast);

	result = tagContainer;
	return result;
};

var	IsMeHere = function(arr)
{
	var	result = false;

	arr.forEach(
		function(item, i, arr)
		{
			if(item.isMe == "yes")
			{
				result = true;
			}
		}
	);
	return result;
};

var ButtonLikeRender = function(buttonLike)
{
	var		listLikedUser = buttonLike.data("messageLikesUserList");
	var		spanLike = $("<span>").addClass("fa fa-thumbs-" + (IsMeHere(listLikedUser) ? "" : "o-") + "up fa-lg");

	if((buttonLike.data("messageLikeType") == "likeUniversityDegree") || (buttonLike.data("messageLikeType") == "likeCertification"))
		spanLike = $("<span>").addClass("fa fa-graduation-cap fa-lg");

	buttonLike	.empty()
				.append(spanLike)
				.append(" " + listLikedUser.length + " ")
				.append((IsMeHere(listLikedUser)) ? "мне нравится " : "");
};

var ButtonLikeTooltipTitle = function(buttonLike)
{
	var		strUserList = "";
	var		messageLikesUserList = buttonLike.data().messageLikesUserList;
	var		nameCounter = 0;

	messageLikesUserList.forEach(
		function(item, i, arr) 
		{
			var		strUser = "";

			if(nameCounter < 4)
			{
				if(typeof(item.name) != "undefined")
				{
					strUser += item.name;
				}
				if(typeof(item.nameLast) != "undefined")
				{
					strUser += " " + item.nameLast;
				}
				if(strUser.length > 0)
				{
					if(i > 0)
					{
						strUserList += " , ";
					}
					strUserList += strUser;
					nameCounter++;
				}
			}
			if(nameCounter == 4)
			{
				strUserList += " ...";
				nameCounter++;
			}
		}
	);

	return strUserList;
};

var ButtonMessageLikeClickHandler = function ()
{
	var	buttonLike = $(this);
	var	messageLikesUserList = buttonLike.data().messageLikesUserList;
	var	messageLikeType = buttonLike.data().messageLikeType;

	if(IsMeHere(messageLikesUserList))
	{
		var newArray = messageLikesUserList.filter(
			function(item)
			{
				if(item.isMe == "yes")
				{
					return false;
				}
				else
				{
					return true;
				}
			}
		);
		buttonLike.data().messageLikesUserList = newArray;
	}
	else
	{
		buttonLike.data().messageLikesUserList.push({"isMe":"yes"});
	}

	buttonLike.tooltip("destroy");

	ButtonLikeRender(buttonLike);

	buttonLike.attr("disabled", "");

	$.getJSON('/cgi-bin/index.cgi?action=JSON_ClickLikeHandler', {messageId: buttonLike.data().messageId, messageLikeType: messageLikeType})
	 		.done(function(data) {
				console.debug("ButtonMessageLikeClickHandler: getJSON(JSON_ClickLikeHandler).done(): receive answer from server on 'like' click");

				if(data.result == "success")
				{
					buttonLike.data("messageLikesUserList", data.messageLikesUserList);
					ButtonLikeRender(buttonLike);
				
					buttonLike.attr("title", ButtonLikeTooltipTitle(buttonLike));
					if(ButtonLikeTooltipTitle(buttonLike) !== "")
					{
						setTimeout(function() { buttonLike.tooltip(); }, 1000);
					}
				}
			})
			.fail(function(data) {
				console.error("ButtonMessageLikeClickHandler: FAIL to parse JSON response from server");
			})
			.always(function(data) {
				buttonLike.removeAttr("disabled");
			});
};

var WriteCommentButtonHandler = function()
{
	var		messageID = $("#buttonNewsFeedViewMessageComment").data("messageID") ||
						$("#buttonNewsFeedViewMessageComment").data("usersBooksID") ||
						$("#buttonNewsFeedViewMessageComment").data("usersCertificationID") ||
						$("#buttonNewsFeedViewMessageComment").data("usersCourseID") ||
						$("#buttonNewsFeedViewMessageComment").data("usersLanguageID") ||
						$("#buttonNewsFeedViewMessageComment").data("usersCompanyID") ||
						$("#buttonNewsFeedViewMessageComment").data("scienceDegreeID");
	var		action = $("#buttonNewsFeedViewMessageComment").data("action");
	var		comment = $("#textareaNewsFeedViewMessage").val().trim();


	if(comment.length && action.length && messageID.length)
	{
		var		tempArray = Array.prototype.slice.call($("#divNewsFeedMessageReplyTo span[data-userid]"));
		var		replyToUserList = [];

		// --- empty comment immediately after comment submission
		// --- it avoids double submission in double-click event
		$("#textareaNewsFeedViewMessage").val("");
		$("#buttonNewsFeedViewMessageComment").button("loading");

		tempArray.forEach(function(item, i, arr)
			{
				replyToUserList.push("@" + $(item).data("userid") + " ");
			});


		$.getJSON('/cgi-bin/index.cgi', {action: action, comment: replyToUserList.join('') + comment, messageID: messageID})
				.done(function(data) {
					console.debug("WriteCommentButtonHandler: done(): result = " + data.result);

					if(typeof($("#buttonNewsFeedViewMessageComment").data("messageID")) != "undefined") RefreshMessageCommentsList(messageID);
					if(typeof($("#buttonNewsFeedViewMessageComment").data("certificationTrackID")) != "undefined") RefreshCertificationCommentsList($("#buttonNewsFeedViewMessageComment").data("certificationTrackID"));
					if(typeof($("#buttonNewsFeedViewMessageComment").data("courseTrackID")) != "undefined") RefreshCertificationCommentsList($("#buttonNewsFeedViewMessageComment").data("courseTrackID"));
					if(typeof($("#buttonNewsFeedViewMessageComment").data("scienceDegreeUniversityID")) != "undefined") RefreshScienceDegreeCommentsList($("#buttonNewsFeedViewMessageComment").data("scienceDegreeUniversityID"));
					if(typeof($("#buttonNewsFeedViewMessageComment").data("bookID")) != "undefined") RefreshBookCommentsList($("#buttonNewsFeedViewMessageComment").data("bookID"));
					if(typeof($("#buttonNewsFeedViewMessageComment").data("companyID")) != "undefined") RefreshCompanyCommentsList($("#buttonNewsFeedViewMessageComment").data("companyID"));
					if(typeof($("#buttonNewsFeedViewMessageComment").data("languageID")) != "undefined") RefreshLanguageCommentsList($("#buttonNewsFeedViewMessageComment").data("languageID"));

					setTimeout(function() {$("#buttonNewsFeedViewMessageComment").button("reset"); }, 500); // --- wait for animation
				})
				.fail(function(data) {
					$("#buttonNewsFeedViewMessageComment").button("reset");
				});
	}
	else
	{
		$("#textareaNewsFeedViewMessage").focus();
		console.debug("WriteCommentButtonHandler: mandatory parameters are not defined.");
	}
};

var ButtonViewMessageClickHandler = function ()
{
	var		messageID = $(this).data("messageId");
	var		messageObject = {};

	globalNewsFeed.forEach(function(item, i, arr)
		{
			if((typeof(item.messageId) != "undefined") && (item.messageId == messageID))
			{
					messageObject = item;
			}
		});

	if(typeof(messageObject.messageId) != "undefined")
	{
		var		spanHeaderText = $("<span/>");
		var		spanHeaderLink = $("<a/>");
		var		spanBodyText = $("<span/>");
		var		srcObjName = messageObject.srcObj.name + " " + messageObject.srcObj.nameLast;

		$("#viewNewsFeedMessage").modal("show");

		$("#news_feed_view_message_header").empty().append("Просмотр сообщения");
		$("#spanNewsFeedViewMessageTimestamp").empty().text(system_calls.GetLocalizedDateInHumanFormatMsecSinceEvent(parseFloat(messageObject.eventTimestampDelta) * 1000));
// system_calls.GetLocalizedDateFromDelta(jsonMessage.eventTimestampDelta)		
		if(srcObjName.length)
		{
			var		tagA = $("<a/>").append(srcObjName)
									.attr("href", GetHrefAttrFromSrcObj(messageObject));

			$("#spanNewsFeedViewMessageUsername").empty().append(tagA).append(system_calls.GetGenderedPhrase(messageObject, " написал(а)", " написал", " написала"));
		}

		spanHeaderText.append(system_calls.ReplaceTextLinkToURL(messageObject.messageTitle || "Просмотр сообщения"));

		if(messageObject.messageLink !== "")
		{
			spanHeaderLink.attr("href", messageObject.messageLink)
							.attr("target", "_blank")
							.append(spanHeaderText);

			$("#divNewsFeedMessageTitle").empty()
										.append(spanHeaderLink);
		}
		else
		{
			$("#divNewsFeedMessageTitle").empty()
										.append(spanHeaderText);
		}

		$("#divNewsFeedMessageBody").empty()
									.append(system_calls.ReplaceTextLinkToURL(messageObject.messageMessage));

		$("#buttonNewsFeedViewMessageComment").data("messageID", messageID)
												.data("action", "AJAX_commentOnMessageInNewsFeed");

		if(messageObject.messageImageList.length && messageObject.messageImageList[0].mediaType == "video")
			BuildVideoTag(messageObject.messageImageList, $("#divNewsFeedMessageBody"));
		else if(messageObject.messageImageList.length && messageObject.messageImageList[0].mediaType == "image")
		{
			BuildCarousel(messageObject.messageImageList, $("#divNewsFeedMessageBody"));
			setTimeout(function() {
				$("#divNewsFeedMessageBody div.carousel.slide[data-ride='carousel']").carousel('pause');
			}, 1000);
			
		}
		else if(messageObject.messageImageList.length && messageObject.messageImageList[0].mediaType == "youtube_video")
			BuildYoutubeEmbedTag(messageObject.messageImageList, $("#divNewsFeedMessageBody"));

		RefreshMessageCommentsList(messageID);

		LazyImageLoad();
	}
};

var ButtonViewBookClickHandler = function ()
{
	var		usersBooksID = $(this).data("usersBooksID");
	var		bookID = $(this).data("bookID");
	var		bookObject = {};

	globalNewsFeed.forEach(function(item, i, arr)
		{
			if((typeof(item.bookID) != "undefined") && (item.bookID == bookID))
				bookObject = item;
		});

	if(typeof(bookObject.bookID) != "undefined")
	{
		// --- RefreshBookCommentsList comes first to have additional time during modal showing event
		RefreshBookCommentsList(bookID);

		$("#viewNewsFeedMessage").modal("show");

		$("#divNewsFeedMessageTitle").empty().append("Информация о книге");
		$("#buttonNewsFeedViewMessageComment").data("bookID", bookID)
												.data("usersBooksID", usersBooksID)
												.data("action", "AJAX_commentOnBookInNewsFeed");

		RenderBookMainInfo(bookObject, $("#divNewsFeedMessageBody"));

	}
	else
	{
		console.error("ERROR: can't find bookID[" + bookID + "]");
	}
};

var ButtonViewCertificationClickHandler = function ()
{
	var		usersCertificationID = $(this).data("usersCertificationID");
	var		certificationTrackID = $(this).data("certificationTrackID");
	var		certificationObject = {};

	globalNewsFeed.forEach(function(item, i, arr)
		{
			if((typeof(item.certificationTrackID) != "undefined") && (item.certificationTrackID == certificationTrackID))
				certificationObject = item;
		});

	if(typeof(certificationObject.certificationTrackID) != "undefined")
	{
		// --- RefreshCertificationCommentsList comes first to have additional time during modal showing event
		RefreshCertificationCommentsList(certificationTrackID);

		$("#viewNewsFeedMessage").modal("show");

		$("#divNewsFeedMessageTitle").empty().append("Получение сертификата");
		$("#buttonNewsFeedViewMessageComment").data("certificationTrackID", certificationTrackID)
												.data("usersCertificationID", usersCertificationID)
												.data("action", "AJAX_commentOnCertificationInNewsFeed");

		RenderCertificationMainInfo(certificationObject, $("#divNewsFeedMessageBody"));

	}
	else
	{
		console.error("ERROR: can't find certificationTrackID[" + certificationTrackID + "]");
	}
};

var ButtonViewCourseClickHandler = function ()
{
	var		usersCourseID = $(this).data("usersCourseID");
	var		courseTrackID = $(this).data("courseTrackID");
	var		courseObject = {};

	globalNewsFeed.forEach(function(item, i, arr)
		{
			if((typeof(item.courseTrackID) != "undefined") && (item.courseTrackID == courseTrackID))
				courseObject = item;
		});

	if(typeof(courseObject.courseTrackID) != "undefined")
	{
		// --- RefreshCourseCommentsList comes first to have additional time during modal showing event
		RefreshCertificationCommentsList(courseTrackID);

		$("#viewNewsFeedMessage").modal("show");

		$("#divNewsFeedMessageTitle").empty().append("Прослушивание курса");
		$("#buttonNewsFeedViewMessageComment").data("courseTrackID", courseTrackID)
												.data("usersCourseID", usersCourseID)
												.data("action", "AJAX_commentOnCourseInNewsFeed");

		RenderCourseMainInfo(courseObject, $("#divNewsFeedMessageBody"));

	}
	else
	{
		console.error("ERROR: can't find courseTrackID[" + courseTrackID + "]");
	}
};

var ButtonViewLanguageClickHandler = function ()
{
	var		languageID = $(this).data("languageID");
	var		usersLanguageID = $(this).data("usersLanguageID");
	var		languageObject = {};

	globalNewsFeed.forEach(function(item, i, arr)
		{
			if((typeof(item.languageID) != "undefined") && (item.languageID == languageID))
				languageObject = item;
		});

	if(typeof(languageObject.languageID) != "undefined")
	{
		// --- RefreshLanguageCommentsList comes first to have additional time during modal showing event
		RefreshLanguageCommentsList(languageID);

		$("#viewNewsFeedMessage").modal("show");

		$("#divNewsFeedMessageTitle").empty().append("Иностранный язык");
		$("#buttonNewsFeedViewMessageComment").data("languageID", languageID)
												.data("usersLanguageID", usersLanguageID)
												.data("action", "AJAX_commentOnLanguageInNewsFeed");

		RenderLanguageMainInfo(languageObject, $("#divNewsFeedMessageBody"));

	}
	else
	{
		console.error("ERROR: can't find languageID[" + languageID + "]");
	}
};

var ButtonViewCompanyClickHandler = function ()
{
	var		companyID = $(this).data("companyID");
	var		usersCompanyID = $(this).data("usersCompanyID");
	var		companyObject = {};

	globalNewsFeed.forEach(function(item, i, arr)
		{
			if((typeof(item.companyID) != "undefined") && (item.companyID == companyID))
				companyObject = item;
		});

	if(typeof(companyObject.companyID) != "undefined")
	{
		// --- RefreshCompanyCommentsList comes first to have additional time during modal showing event
		RefreshCompanyCommentsList(companyID);

		$("#viewNewsFeedMessage").modal("show");

		$("#divNewsFeedMessageTitle").empty().append("Компания");
		$("#buttonNewsFeedViewMessageComment").data("companyID", companyID)
												.data("usersCompanyID", usersCompanyID)
												.data("action", "AJAX_commentOnCompanyInNewsFeed");

		RenderCompanyMainInfo(companyObject, $("#divNewsFeedMessageBody"));

	}
	else
	{
		console.error("ERROR: can't find companyID[" + companyID + "]");
	}
};


var ButtonViewScienceDegreeClickHandler = function ()
{
	var		scienceDegreeID = $(this).data("scienceDegreeID");
	var		scienceDegreeUniversityID = $(this).data("scienceDegreeUniversityID");
	var		scienceDegreeObject = {};

	globalNewsFeed.forEach(function(item, i, arr)
		{
			if((typeof(item.scienceDegreeID) != "undefined") && (item.scienceDegreeID == scienceDegreeID))
				scienceDegreeObject = item;
		});

	if(typeof(scienceDegreeObject.scienceDegreeID) != "undefined")
	{
		// --- RefreshScienceDegreeCommentsList comes first to have additional time during modal showing event
		RefreshScienceDegreeCommentsList(scienceDegreeUniversityID);

		$("#viewNewsFeedMessage").modal("show");

		$("#divNewsFeedMessageTitle").empty().append("Получение ученой степени");
		$("#buttonNewsFeedViewMessageComment").data("scienceDegreeID", scienceDegreeID)
												.data("scienceDegreeUniversityID", scienceDegreeUniversityID)
												.data("action", "AJAX_commentOnScienceDegreeInNewsFeed");

		RenderScienceDegreeMainInfo(scienceDegreeObject, $("#divNewsFeedMessageBody"));

	}
	else
	{
		console.error("ERROR: can't find scienceDegreeID[" + scienceDegreeID + "]");
	}
};


// --- function adds user from this tag to ReplyTo field
var AddCommentOwnerToReply_ClickHandler = function(event)
{
	var		currTag = $(this);
	var		replyToUserID = currTag.data("ownerID");
	var		replyToUserName = currTag.data("ownerName");

	if(replyToUserName.length && replyToUserID)
	{
		if($("#divNewsFeedMessageReplyTo span[data-userid=" + replyToUserID + "]").length)
		{
			console.error("ERROR: this user already in ReplyTo list");

			// --- notify user about adding
			currTag.popover({"placement":"top", "content": "Уже в списке"})
					.popover("show");
			setTimeout(function () 
				{
					currTag.popover("destroy");
				}, 3000);
		}
		else
		{
			var		removeSign = $("<span>").addClass("glyphicon glyphicon-remove cursor_pointer")
											.on("click", function(e)
												{
													// --- remove user from ReplyTo list
													$(this).parent().remove();
												});
			var		badge = $("<span>").append(replyToUserName)
										.append(" ")
										.append(removeSign)
										.attr("data-userid", replyToUserID)
										.addClass("label label-default");

			$("#divNewsFeedMessageReplyTo").append(badge).append(" ");

			// --- notify user about adding
			currTag.popover({"placement":"top", "content": "Добавлен"})
					.popover("show");
			setTimeout(function () 
				{
					currTag.popover("destroy");
				}, 3000);
		}
	}
	else
	{
		// --- notify user about adding
		currTag.popover({"placement":"top", "content": "Ошибка: добавления"})
				.popover("show");
		setTimeout(function () 
			{
				currTag.popover("destroy");
			}, 3000);
		console.error("ERROR: issue with looking for commentOwnerID or commentOwnerName");
	}

};

// --- build comments list
// --- commentsArray - list  of comments
// --- DOMtag - place in DOM-model
var BuildCommentsList = function(commentsArray, DOMtag)
{
	var		commentsUserArray = [];

	commentsArray = commentsArray.sort(function(item1, item2) { return ((parseFloat(item1.id) < parseFloat(item2.id)) ? -1 : 1); });

	// --- populate commentsUserArray with users-comment-writers (for ex: commentsUserArray["@23"]="Иван Кучин")
	commentsArray.forEach(function(item, i, arr)
		{
			commentsUserArray["@" + item.user.userID] = "@" + item.user.name + " " + item.user.nameLast;
		});

	commentsArray.forEach(function(item, i, arr)
	{
		var	spanUser = $("<span/>").append($("<a>").attr("href", "/userprofile/" + item.user.userID).append(item.user.name + " " + item.user.nameLast)).append(" написал(а) ");
		var	spanReplyTo = $("<span>").append($("<span>").addClass("fa fa-reply")).append(" <div class=\"display_inline hidden-xs\">ответить</div>")
									.data("ownerID", item.user.userID)
									.data("ownerName", item.user.name + " " + item.user.nameLast)
									.addClass("font_size_small color_grey margin_left_20 cursor_pointer")
									.on("click", AddCommentOwnerToReply_ClickHandler);
		var	spanTimestamp = $("<span/>").append(item.eventTimestampDelta)
										.addClass("news_feed_timestamp");
		var	divComment = $("<div/>");
		var	commentText = item.comment;

		if(i > 0) { DOMtag.append($("<div/>").addClass("news_feed_comment_separator")); }

		// --- replace @userID -> @name_nameLast
		Object.keys(commentsUserArray).forEach(function(item)
			{
				function convert(str, match, offset, s)
				{
					return "<i>" + commentsUserArray[match] + "</i>";
				}
				commentText = commentText.replace(/(@\d+)/g, convert);
			});

		divComment = $("<div/>").append(commentText);
		DOMtag.append(spanUser).append(spanReplyTo).append(spanTimestamp).append(divComment);

		{
			// --- delete button

			var		myUserID = $("#myUserID").data("myuserid");

			if(item.user.userID == myUserID)
			{
				var		tagSpanTrashBin = $("<span/>").addClass("news_feed_trashbin_right");
				var		tagButtonTrashBin = $("<button/>").attr("type", "button")
															.addClass("btn btn-link")
															.data("commentID", item.id);
				var		tagImgTrashBin = $("<span>").addClass("glyphicon glyphicon-trash news_feed_trashbin");

				console.debug("BuildCommentsList: render delete icons for comment [" + item.id + "]");

				tagButtonTrashBin.on("click", function() {
					console.debug("BuildCommentsList: delete comment click handler [" + $(this).data("commentID") +"]");
					$("#deleteCommentFromFeedSubmit").data("commentID", $(this).data("commentID"));
					$("#DeleteCommentFromFeed").modal("show");
				});

				tagSpanTrashBin.append(tagButtonTrashBin.append(tagImgTrashBin));

				divComment.append(tagSpanTrashBin);
			}
		}
	
	});
};

// --- iOS based devices only
// --- 1) modal open
// --- 2) initial content size have to be smoller than screen vertical size
// --- 3) after rendering, modal have to become larger (comments added in this case)
// --- 4) y-scroll disabled because of bug
// --- https://github.com/twbs/bootstrap/issues/14839
var	Workaround_iOS_Scroll_Bug = function(isInit)
{
	if(isMobile.apple.device)
	{
		if(isInit)
			$("#viewNewsFeedMessage .modal-content").css("min-height", $(window).height() + "px");
		else
			$("#viewNewsFeedMessage .modal-content").css("min-height", "");
	}
};

// --- clean-up & build comments list
// --- messageID - comments to message
var RefreshMessageCommentsList = function(messageID)
{
	$("#textareaNewsFeedViewMessage").val("");
	$("#divNewsFeedMessageReplyTo").empty("");
	$("#divNewsFeedMessageComments").text("");
	Workaround_iOS_Scroll_Bug(true);

	$.getJSON('/cgi-bin/index.cgi?action=JSON_getCommentsOnMessage', {messageID: messageID})
	.done(function(data) {
		if(data.result == "success")
		{
			Workaround_iOS_Scroll_Bug(false);

			BuildCommentsList(data.commentsList, $("#divNewsFeedMessageComments"));

			// --- update number of comments on message === messageID
			$("button.btn.btn-link > img.news_feed_comment").parent().each(
					function(i, item) 
					{ 
						if($(item).data("messageId") === messageID)
						{
							$(item).empty().append($("<img/>").attr("src", "/images/pages/news_feed/comment.png").addClass("news_feed_comment")).append(" " + data.commentsList.length);
							return false;
						}
					});
		}
		else if(data.description == "re-login required")
		{
			window.location.href = data.link;
		}
		else
		{
			console.error("ERROR returned from JSON_getCommentsOnMessage (" + data.description + ")");
		}
	})
	.fail(function() {
		console.error("ERROR: parsing JSON response from server");
	});
};

// --- clean-up & build comments list
// --- bookID - comments to book
var RefreshBookCommentsList = function(bookID)
{
	$("#textareaNewsFeedViewMessage").val("");
	$("#divNewsFeedMessageReplyTo").empty("");
	$("#divNewsFeedMessageComments").text("");
	$.getJSON('/cgi-bin/index.cgi?action=JSON_getCommentsOnBook', {messageID: bookID})
	.done(function(data) {
		if(data.result == "success")
		{
			BuildCommentsList(data.commentsList, $("#divNewsFeedMessageComments"));

			// --- update number of comments on book === bookID
			$("button.btn.btn-link > img.news_feed_comment").parent().each(
					function(i, item) 
					{
						if($(item).data("bookID") === bookID)
							$(item).empty().append($("<img/>").attr("src", "/images/pages/news_feed/comment.png").addClass("news_feed_comment")).append(" " + data.commentsList.length);
					});
		}
		else if(data.description == "re-login required")
		{
			window.location.href = data.link;
		}
		else
		{
			console.error("ERROR returned from JSON_getCommentsOnMessage (" + data.description + ")");
		}
	})
	.fail(function() {
		console.error("ERROR: parsing JSON response from server");
	});
};

// --- clean-up & build comments list
// --- certificationID - comments to certification
var RefreshCertificationCommentsList = function(certificationID)
{
	$("#textareaNewsFeedViewMessage").val("");
	$("#divNewsFeedMessageReplyTo").empty("");
	$("#divNewsFeedMessageComments").text("");
	$.getJSON('/cgi-bin/index.cgi?action=JSON_getCommentsOnCertification', {messageID: certificationID})
	.done(function(data) {
		if(data.result == "success")
		{
			BuildCommentsList(data.commentsList, $("#divNewsFeedMessageComments"));

			// --- update number of comments on certification === certificationID
			$("button.btn.btn-link > img.news_feed_comment").parent().each(
					function(i, item) 
					{
						if($(item).data("certificationTrackID") === certificationID)
							$(item).empty().append($("<img/>").attr("src", "/images/pages/news_feed/comment.png").addClass("news_feed_comment")).append(" " + data.commentsList.length);
						if($(item).data("courseTrackID") === certificationID)
							$(item).empty().append($("<img/>").attr("src", "/images/pages/news_feed/comment.png").addClass("news_feed_comment")).append(" " + data.commentsList.length);
					});
		}
		else if(data.description == "re-login required")
		{
			window.location.href = data.link;
		}
		else
		{
			console.error("ERROR returned from JSON_getCommentsOnMessage (" + data.description + ")");
		}
	})
	.fail(function() {
		console.error("ERROR: parsing JSON response from server");
	});
};

// --- clean-up & build comments list
// --- scienceDegreeID - comments to scienceDegree
var RefreshScienceDegreeCommentsList = function(scienceDegreeID)
{
	$("#textareaNewsFeedViewMessage").val("");
	$("#divNewsFeedMessageReplyTo").empty("");
	$("#divNewsFeedMessageComments").text("");
	$.getJSON('/cgi-bin/index.cgi?action=JSON_getCommentsOnScienceDegree', {messageID: scienceDegreeID})
	.done(function(data) {
		if(data.result == "success")
		{
			BuildCommentsList(data.commentsList, $("#divNewsFeedMessageComments"));

			// --- update number of comments on scienceDegree === scienceDegreeID
			$("button.btn.btn-link > img.news_feed_comment").parent().each(
					function(i, item) 
					{
						if($(item).data("scienceDegreeUniversityID") === scienceDegreeID)
							$(item).empty().append($("<img/>").attr("src", "/images/pages/news_feed/comment.png").addClass("news_feed_comment")).append(" " + data.commentsList.length);
					});
		}
		else if(data.description == "re-login required")
		{
			window.location.href = data.link;
		}
		else
		{
			console.error("ERROR returned from JSON_getCommentsOnMessage (" + data.description + ")");
		}
	})
	.fail(function() {
		console.error("ERROR: parsing JSON response from server");
	});
};

// --- clean-up & build comments list
// --- companyID - comments to company
var RefreshCompanyCommentsList = function(companyID)
{
	$("#textareaNewsFeedViewMessage").val("");
	$("#divNewsFeedMessageReplyTo").empty("");
	$("#divNewsFeedMessageComments").text("");
	$.getJSON('/cgi-bin/index.cgi?action=JSON_getCommentsOnCompany', {messageID: companyID})
	.done(function(data) {
		if(data.result == "success")
		{
			BuildCommentsList(data.commentsList, $("#divNewsFeedMessageComments"));

			// --- update number of comments on company === companyID
			$("button.btn.btn-link > img.news_feed_comment").parent().each(
					function(i, item) 
					{
						if($(item).data("companyID") === companyID)
							$(item).empty().append($("<img/>").attr("src", "/images/pages/news_feed/comment.png").addClass("news_feed_comment")).append(" " + data.commentsList.length);
					});
		}
		else if(data.description == "re-login required")
		{
			window.location.href = data.link;
		}
		else
		{
			console.error("ERROR returned from JSON_getCommentsOnMessage (" + data.description + ")");
		}
	})
	.fail(function() {
		console.error("ERROR: parsing JSON response from server");
	});
};

// --- clean-up & build comments list
// --- languageID - comments to language
var RefreshLanguageCommentsList = function(languageID)
{
	$("#textareaNewsFeedViewMessage").val("");
	$("#divNewsFeedMessageReplyTo").empty("");
	$("#divNewsFeedMessageComments").text("");
	$.getJSON('/cgi-bin/index.cgi?action=JSON_getCommentsOnLanguage', {messageID: languageID})
	.done(function(data) {
		if(data.result == "success")
		{
			BuildCommentsList(data.commentsList, $("#divNewsFeedMessageComments"));

			// --- update number of comments on language === languageID
			$("button.btn.btn-link > img.news_feed_comment").parent().each(
					function(i, item) 
					{
						if($(item).data("languageID") === languageID)
							$(item).empty().append($("<img/>").attr("src", "/images/pages/news_feed/comment.png").addClass("news_feed_comment")).append(" " + data.commentsList.length);
					});
		}
		else if(data.description == "re-login required")
		{
			window.location.href = data.link;
		}
		else
		{
			console.error("ERROR returned from JSON_getCommentsOnMessage (" + data.description + ")");
		}
	})
	.fail(function() {
		console.error("ERROR: parsing JSON response from server");
	});
};

// --- attach video placement to DOMtag
// --- imageList - image list
// --- DOMtag - video tag will be attached to that tag
var BuildVideoTag = function(imageList, DOMtag)
{
	var		uniqueID;
	do
	{
		uniqueID = Math.round(Math.random() * 100000000);
	} while($("div#videoTag" + uniqueID).length);

	if(imageList.length > 0)
	{
		// --- Image carousel
		var		imageArr = imageList;
		var		tagDivContainer = $("<div/>").addClass("videoTag");
		var		videoTag = $("<video>").addClass("videoPlacement")
										.data("playedAttempts", "0")
										.attr("id", "videoTag" + uniqueID)
										.attr("controls", "true");

		// --- put the .webm on the first place
		imageList.sort(function(a, b)
		{
			if(b.filename.match(/.webm$/))
				return 1;
			return 0;
		});

		imageList.forEach(function(item)
		{	
			var		subtype = item.filename.match(/\.(.*)$/);
			var		srcTag = $("<source>").attr("src", "/video/feed/" + item.folder + "/" + item.filename)
											.attr("type", "video/" + (subtype[1] == "webm" ? "webm" : "mp4") );
			videoTag.append(srcTag);
		});

		tagDivContainer.append(videoTag);
		DOMtag.append(tagDivContainer);
	} // --- end of carousel
};

// --- attach youtube video placement to DOMtag
// --- imageList - image list
// --- DOMtag - video tag will be attached to that tag
var BuildYoutubeEmbedTag = function(imageList, DOMtag)
{
	var		uniqueID;
	do
	{
		uniqueID = Math.round(Math.random() * 100000000);
	} while($("div#youtubeEmbedTag" + uniqueID).length);

	if(imageList.length > 0)
	{
		// --- Image carousel
		var		imageArr = imageList;
		var		tagDivContainer = $("<div/>").addClass("videoTag");
		var		videoTag = $("<iframe>").addClass("youtubeVideoPlacement")
										.attr("id", "youtubeEmbedTag" + uniqueID)
										.attr("src", imageList[0].filename)
										.attr("frameborder", "0")
										.attr("allowfullscreen", "");

		tagDivContainer.append(videoTag);
		DOMtag.append(tagDivContainer);
	} // --- end of carousel
};


// --- attach Carousel to DOMtag
// --- imageList - image list
// --- DOMtag - carousel will be attached to that tag
var BuildCarousel = function(imageList, DOMtag)
{
	var		uniqueID;

	do
	{
		uniqueID = Math.round(Math.random() * 100000000);
	} while($("div#carousel" + uniqueID).length);

	if(imageList.length > 0)
	{
		// --- Image carousel
		var		imageArr = imageList;
		var		tagDivCarousel = $("<div/>").addClass("carousel slide")
											.attr("data-ride", "carousel")
											.attr("id", "carousel" + uniqueID);
		var		tagOlIndicator = $("<ol>").addClass("carousel-indicators");
		var		tagDivCarouselInner = $("<div/>").addClass("carousel-inner")
												.attr("role", "listbox");
		var		tagALeftCarouselControl = $("<a>").addClass("left carousel-control")
													.attr("href", "#carousel" + uniqueID)
													.attr("role", "button")
													.attr("data-slide", "prev");
		var		tagARightCarouselControl = $("<a>").addClass("right carousel-control")
													.attr("href", "#carousel" + uniqueID)
													.attr("role", "button")
													.attr("data-slide", "next");

		imageArr.forEach(
			function(item, i, arr)
			{
				var	tagLiIndicator = $("<li/>").attr("data-target", "#carousel" + uniqueID)
												.attr("data-slide-to", i);

				if(i === 0)
				{
					tagLiIndicator.addClass("active");
				}
				tagOlIndicator.append(tagLiIndicator);
			}
		);

		imageArr.forEach(
			function(item, i, arr)
			{
				var	tagDivItem = $("<div/>").addClass("item");
				var	tagImgCarousel = $("<img/>");


				if(i === 0)
				{
					tagImgCarousel.attr("src", "/images/feed/" + item.folder + "/" + item.filename);
					tagDivItem.addClass("active");
				}
				else
				{
					tagImgCarousel.attr("data-lazyload", "/images/feed/" + item.folder + "/" + item.filename);

					// --- this commented for unveil plugin
					// tagImgCarousel.attr("data-src", "/images/feed/" + item.folder + "/" + item.filename);
				}
				tagDivItem.append(tagImgCarousel);
				tagDivCarouselInner.append(tagDivItem);
			}
		);

		tagALeftCarouselControl.append(
			$("<span>")	.addClass("glyphicon glyphicon-chevron-left")
						.attr("aria-hidden", "true")
								)
								.append(
			$("<span>")	.addClass("sr-only").append("Previous")
								);
		tagARightCarouselControl.append(
			$("<span>")	.addClass("glyphicon glyphicon-chevron-right")
						.attr("aria-hidden", "true")
								)
								.append(
			$("<span>")	.addClass("sr-only").append("Next")
								);

		tagDivCarousel	.append(tagOlIndicator)
						.append(tagDivCarouselInner)
						.append(tagALeftCarouselControl)
						.append(tagARightCarouselControl);
		DOMtag.append(tagDivCarousel);
	} // --- end of carousel
};

var GetAverageRating = function(ratingArr)
{
	var		result = 0;
	var		ratingItemsCount = 0;
	var		ratingItemsSum = 0;

	if(ratingArr.length)
	{
		ratingArr.forEach(function(item) {
			if(item > 0)
			{
				ratingItemsCount++;
				ratingItemsSum += item - 1;
			}
		});
		if(ratingItemsCount)
			result = Math.floor(ratingItemsSum / (ratingItemsCount * 4) * 200) - 100;
	}

	return result;
};

var GetTotalVoters = function(ratingArr)
{
	var		ratingItemsCount = 0;

	ratingArr.forEach(function(item) {
		if(item > 0) ratingItemsCount++;
	});

	return ratingItemsCount;
};


var RenderBookMainInfo = function(jsonBook, DOMtag)
{
	var		ratingCallback = function(rating)
							{
								$.getJSON('/cgi-bin/book.cgi?action=AJAX_setBookRating', {bookID: bookID, rating: rating, rand: Math.round(Math.random() * 100000000)})
								.done(function(data) {
									if(data.result == "success")
									{
										spanTotalRating.empty().append(GetAverageRating(data.bookReadersRatingList));
										spanTotalVoters.empty().append(GetTotalVoters(data.bookReadersRatingList));

										// --- required to update feed in case changing in modal dialog
										$("span.bookCommonRating" + bookID).empty().append(GetAverageRating(data.bookReadersRatingList));
										$("span.bookTotalVoters" + bookID).empty().append(GetTotalVoters(data.bookReadersRatingList));

										// --- update bookReadersRatingList in globalNewsFeed object
										globalNewsFeed.forEach(function(item, i, arr)
											{
												if((typeof(item.bookID) != "undefined") && (item.bookID == bookID))
													globalNewsFeed[i].bookReadersRatingList = data.bookReadersRatingList;
											});
									}
									else
									{
									  console.error("ratingCallback:ERROR: " + data.description);
									}
								});

								// --- update bookMyRating in globalNewsFeed object
								globalNewsFeed.forEach(function(item, i, arr)
									{
										if((typeof(item.bookID) != "undefined") && (item.bookID == bookID))
											globalNewsFeed[i].bookMyRating = rating;
									});

								// --- required to update feed in case changing in modal dialog
								$("div.bookMyRating" + bookID + " input[data-rating='" + rating + "']").prop("checked", true);
							};

	var		divRow = $("<div>").addClass("row");
	var 	isbns = "";
	var		divMain = $("<div>").addClass("col-xs-12 col-sm-10");
	var		divCover = $("<div>").addClass("hidden-xs col-sm-2 margin_top_10 ");
	var		imgCover;
	var		imgXSCover;
	var		bookID = jsonBook.bookID;
	var		divRating = $("<div>").addClass("float_right");
	var		spanTotalRating = $("<span>").append(GetAverageRating(jsonBook.bookReadersRatingList));
	var		spanTotalVoters = $("<span>").append(GetTotalVoters(jsonBook.bookReadersRatingList));

	{
		// --- this function will be invoked for feed rendering and modal rendering
		// --- require to keep attr("id") uniq
		// --- first time will always be chosen Init value
		// --- first time will appear on rendering main page
		var		uniqueID = jsonBook.bookID;
		while($("#bookCommonRating" + uniqueID).length) {
			uniqueID = Math.floor(Math.random() * 100000000);
		}

		spanTotalRating.attr("id", "bookCommonRating" + uniqueID)
						.addClass("bookCommonRating" + jsonBook.bookID);
		spanTotalVoters.attr("id", "bookTotalVoters" + uniqueID)
						.addClass("bookTotalVoters" + jsonBook.bookID);
	}


	if((typeof(jsonBook.bookCoverPhotoFolder) != "undefined") && (typeof(jsonBook.bookCoverPhotoFilename) != "undefined") && (jsonBook.bookCoverPhotoFolder.length) && (jsonBook.bookCoverPhotoFilename.length))
	{
		imgCover = $("<img>").addClass("max_100percents_100px div_content_center_alignment niceborder cursor_pointer")
							.attr("src", "/images/books/" + jsonBook.bookCoverPhotoFolder + "/" + jsonBook.bookCoverPhotoFilename)
							.on("click", function(e) {
								$("#NewsFeedBookCoverDisplayModal").modal("show");
								$("#NewsFeedBookCoverDisplayModal span.bookTitle").empty().append(jsonBook.bookTitle);
								$("#NewsFeedBookCoverDisplayModal img").attr("src", "/images/books/" + jsonBook.bookCoverPhotoFolder + "/" + jsonBook.bookCoverPhotoFilename);
							});
		imgXSCover = $("<img>").addClass("max_100px visible-xs-inline niceborder cursor_pointer")
							.attr("src", "/images/books/" + jsonBook.bookCoverPhotoFolder + "/" + jsonBook.bookCoverPhotoFilename)
							.on("click", function(e) {
								$("#NewsFeedBookCoverDisplayModal").modal("show");
								$("#NewsFeedBookCoverDisplayModal span.bookTitle").empty().append(jsonBook.bookTitle);
								$("#NewsFeedBookCoverDisplayModal img").attr("src", "/images/books/" + jsonBook.bookCoverPhotoFolder + "/" + jsonBook.bookCoverPhotoFilename);
							});
	}
	else
	{
		imgCover = $("<img>").addClass("max_100percents_100px div_content_center_alignment scale_1_2")
							.attr("src", "/images/pages/news_feed/empty_book.jpg");
							// --- reason for having attr(id) unknown
							// .data("id", jsonBook.bookID);
		imgXSCover = $("<img>").addClass("max_100px visible-xs-inline scale_1_2")
							.attr("src", "/images/pages/news_feed/empty_book.jpg");
	}

	// --- book body start
	divMain.append(imgXSCover);
	divMain.append(divRating);

	if(jsonBook.bookTitle.length) divMain.append($("<h4/>").append(jsonBook.bookTitle));
	if(jsonBook.bookAuthorName !== "") divMain.append(jsonBook.bookAuthorName);

	if(jsonBook.bookISBN10 !== "") isbns = jsonBook.bookISBN10;
	if(isbns.length) isbns += " / ";
	if(jsonBook.bookISBN13 !== "") isbns += jsonBook.bookISBN13;
	if(isbns.length) isbns = "ISBN: " + isbns;
	divMain.append($("<h6>").addClass("color_grey").append(isbns));

	divRating	.append("рейтинг: ").append(spanTotalRating).append("% (голосов ").append(spanTotalVoters).append(")")
				.append("<br>моё мнение:<br>")
				.append(system_calls.RenderRating("bookMyRating" + jsonBook.bookID, jsonBook.bookMyRating, ratingCallback));


	divRow	.append(divCover.append(imgCover))
			.append(divMain);
	DOMtag	.append(divRow);
	// --- book body end
};

var RenderCertificationMainInfo = function(jsonCertification, DOMtag)
{
	var		divRow = $("<div>").addClass("row");
	var		divMain = $("<div>").addClass("col-xs-8 col-sm-10");
	var		divCover = $("<div>").addClass("col-xs-4 col-sm-2 margin_top_10 ");
	var		imgLogo;
	var		imgXSCover;
	var		certificationID = jsonCertification.certificationID;


	if((typeof(jsonCertification.certificationVendorLogoFolder) != "undefined") && (typeof(jsonCertification.certificationVendorLogoFilename) != "undefined") && (jsonCertification.certificationVendorLogoFolder.length) && (jsonCertification.certificationVendorLogoFilename.length))
	{
		imgLogo = $("<img>").addClass("max_100percents_100px div_content_center_alignment niceborder cursor_pointer")
							.attr("src", "/images/certifications/" + jsonCertification.certificationVendorLogoFolder + "/" + jsonCertification.certificationVendorLogoFilename)
							.on("click", function(e) {
								$("#NewsFeedBookCoverDisplayModal").modal("show");
								$("#NewsFeedBookCoverDisplayModal span.bookTitle").empty().append(jsonCertification.certificationTrackTitle);
								$("#NewsFeedBookCoverDisplayModal img").attr("src", "/images/certifications/" + jsonCertification.certificationVendorLogoFolder + "/" + jsonCertification.certificationVendorLogoFilename);
							});
	}

	// --- certification body start
	divMain.append(imgLogo);

	divMain.append($("<h4/>").append(jsonCertification.certificationVendorName + " " + jsonCertification.certificationTrackTitle))
			.append(typeof(jsonCertification.certificationNumber) != "undefined" ? " #" + jsonCertification.certificationNumber : "");

	divRow	.append(divCover.append(imgLogo))
			.append(divMain);
	DOMtag	.append(divRow);
	// --- certification body end
};

var RenderGroupMainInfo = function(jsonGroup, DOMtag)
{
	var		divRow = $("<div>").addClass("row");
	var		divMain = $("<div>").addClass("col-xs-8 col-sm-10");
	var		divDescription = $("<div>").addClass("col-xs-8 col-sm-10");
	var		divCover = $("<div>").addClass("col-xs-4 col-sm-2 margin_top_10 ");
	var		imgLogo;
	var		imgXSCover;
	var		groupID = jsonGroup.groups[0].groupID;


	if((typeof(jsonGroup.groups[0].logo_folder) != "undefined") && (typeof(jsonGroup.groups[0].logo_filename) != "undefined") && (jsonGroup.groups[0].logo_folder.length) && (jsonGroup.groups[0].logo_filename.length))
	{
		imgLogo = $("<img>").addClass("max_100percents_100px div_content_center_alignment niceborder cursor_pointer")
							.attr("src", "/images/groups/" + jsonGroup.groups[0].logo_folder + "/" + jsonGroup.groups[0].logo_filename);
	}
	else
	{
		imgLogo = $("<canvas>")	.attr("width", "80")
								.attr("height", "80");
		system_calls.RenderCompanyLogo(imgLogo[0].getContext("2d"), "", jsonGroup.groups[0].title, "");
	}

	// --- group body start
	divMain.append($("<h4/>").append($("<a>").append(jsonGroup.groups[0].title).attr("href", "/group/" + jsonGroup.groups[0].link + "?rand=" + system_calls.GetUUID())));
	divDescription.append(jsonGroup.groups[0].description);

	divRow	.append(divCover.append($("<a>").append(imgLogo).attr("href", "/group/" + jsonGroup.groups[0].link + "?rand=" + system_calls.GetUUID())))
			.append(divMain)
			.append(divDescription);
	DOMtag	.append(divRow);
	// --- group body end
};

var RenderCompanySubscriptionMainInfo = function(jsonCompany, DOMtag)
{
	var		divRow = $("<div>").addClass("row");
	var		divMain = $("<div>").addClass("col-xs-8 col-sm-10");
	var		divCover = $("<div>").addClass("col-xs-4 col-sm-2 margin_top_10 ");
	var		imgLogo;
	var		imgXSCover;
	var		companyID = jsonCompany.companies[0].companyID;


	if((typeof(jsonCompany.companies[0].logo_folder) != "undefined") && (typeof(jsonCompany.companies[0].logo_filename) != "undefined") && (jsonCompany.companies[0].logo_folder.length) && (jsonCompany.companies[0].logo_filename.length))
	{
		imgLogo = $("<img>").addClass("max_100percents_100px div_content_center_alignment niceborder cursor_pointer")
							.attr("src", "/images/companies/" + jsonCompany.companies[0].logo_folder + "/" + jsonCompany.companies[0].logo_filename);
	}
	else
	{
		imgLogo = $("<canvas>")	.attr("width", "80")
								.attr("height", "80");
		system_calls.RenderCompanyLogo(imgLogo[0].getContext("2d"), "", jsonCompany.companies[0].name, "");
	}

	// --- company body start
	divMain.append($("<h4/>").append($("<a>").append(jsonCompany.companies[0].name).attr("href", "/company/" + jsonCompany.companies[0].link + "?rand=" + system_calls.GetUUID())));

	divRow	.append(divCover.append($("<a>").append(imgLogo).attr("href", "/company/" + jsonCompany.companies[0].link + "?rand=" + system_calls.GetUUID())))
			.append(divMain);
	DOMtag	.append(divRow);
	// --- company body end
};

var RenderCourseMainInfo = function(jsonCourse, DOMtag)
{
	var		divRow = $("<div>").addClass("row");
	var		divMain = $("<div>").addClass("col-xs-8 col-sm-10");
	var		divCover = $("<div>").addClass("col-xs-4 col-sm-2 margin_top_10 ");
	var		imgLogo;
	var		imgXSCover;
	var		courseID = jsonCourse.courseID;

	var		ratingCallback = function(rating)
							{
								$.getJSON('/cgi-bin/index.cgi?action=AJAX_setCourseRating', {courseID: courseID, rating: rating, rand: Math.round(Math.random() * 100000000)})
								.done(function(data) {
									if(data.result == "success")
									{
										spanTotalRating.empty().append(GetAverageRating(data.courseReadersRatingList));
										spanTotalVoters.empty().append(GetTotalVoters(data.courseReadersRatingList));

										// --- required to update feed in case changing in modal dialog
										$("span.courseCommonRating" + courseID).empty().append(GetAverageRating(data.courseReadersRatingList));
										$("span.courseTotalVoters" + courseID).empty().append(GetTotalVoters(data.courseReadersRatingList));

										// --- update courseReadersRatingList in globalNewsFeed object
										globalNewsFeed.forEach(function(item, i, arr)
											{
												if((typeof(item.courseID) != "undefined") && (item.courseID == courseID))
													globalNewsFeed[i].courseReadersRatingList = data.courseReadersRatingList;
											});
									}
									else
									{
									  console.error("ratingCallback:ERROR: " + data.description);
									}
								});

								// --- update courseMyRating in globalNewsFeed object
								globalNewsFeed.forEach(function(item, i, arr)
									{
										if((typeof(item.courseID) != "undefined") && (item.courseID == courseID))
											globalNewsFeed[i].courseMyRating = rating;
									});

								// --- required to update feed in case changing in modal dialog
								$("div.courseMyRating" + courseID + " input[data-rating='" + rating + "']").prop("checked", true);
							};
	var		divRating = $("<div>").addClass("float_right");
	var		spanTotalRating = $("<span>").append(GetAverageRating(jsonCourse.courseRatingList));
	var		spanTotalVoters = $("<span>").append(GetTotalVoters(jsonCourse.courseRatingList));


	if((typeof(jsonCourse.courseVendorLogoFolder) != "undefined") && (typeof(jsonCourse.courseVendorLogoFilename) != "undefined") && (jsonCourse.courseVendorLogoFolder.length) && (jsonCourse.courseVendorLogoFilename.length))
	{
		imgLogo = $("<img>").addClass("max_100percents_100px div_content_center_alignment niceborder cursor_pointer")
							.attr("src", "/images/certifications/" + jsonCourse.courseVendorLogoFolder + "/" + jsonCourse.courseVendorLogoFilename)
							.on("click", function(e) {
								$("#NewsFeedBookCoverDisplayModal").modal("show");
								$("#NewsFeedBookCoverDisplayModal span.bookTitle").empty().append(jsonCourse.courseTrackTitle);
								$("#NewsFeedBookCoverDisplayModal img").attr("src", "/images/certifications/" + jsonCourse.courseVendorLogoFolder + "/" + jsonCourse.courseVendorLogoFilename);
							});
	}

	// --- course body start
	divMain.append(imgLogo)
			.append(divRating);

	divMain.append($("<h4/>").append(jsonCourse.courseVendorName + " " + jsonCourse.courseTrackTitle));

	divRow	.append(divCover.append(imgLogo))
			.append(divMain);

	divRating	.append("рейтинг: ").append(spanTotalRating).append("% (голосов ").append(spanTotalVoters).append(")")
				.append("<br>моё мнение:<br>")
				.append(system_calls.RenderRating("bookMyRating" + jsonCourse.courseTrackID, jsonCourse.courseMyRating, ratingCallback));

	DOMtag	.append(divRow);
	// --- course body end
};

var RenderScienceDegreeMainInfo = function(jsonScienceDegree, DOMtag)
{
	var		divRow = $("<div>").addClass("row");
	var		divMain = $("<div>").addClass("col-xs-8 col-sm-10");
	var		divCover = $("<div>").addClass("col-xs-4 col-sm-2 margin_top_10 ");
	var		imgLogo;
	var		scienceDegreeID = jsonScienceDegree.scienceDegreeID;
	var		universityLocation = "";
	var		studyPeriodLength = 0;
	var		studyPeriodMessage = "";


	if((typeof(jsonScienceDegree.scienceDegreeUniversityLogoFolder) != "undefined") && (typeof(jsonScienceDegree.scienceDegreeUniversityLogoFilename) != "undefined") && (jsonScienceDegree.scienceDegreeUniversityLogoFolder.length) && (jsonScienceDegree.scienceDegreeUniversityLogoFilename.length))
	{
		imgLogo = $("<img>").addClass("max_100percents_100px div_content_center_alignment niceborder cursor_pointer")
							.attr("src", "/images/universities/" + jsonScienceDegree.scienceDegreeUniversityLogoFolder + "/" + jsonScienceDegree.scienceDegreeUniversityLogoFilename)
							.on("click", function(e) {
								$("#NewsFeedBookCoverDisplayModal").modal("show");
								$("#NewsFeedBookCoverDisplayModal span.bookTitle").empty().append(jsonScienceDegree.scienceDegreeUniversityTitle);
								$("#NewsFeedBookCoverDisplayModal img").attr("src", "/images/universities/" + jsonScienceDegree.scienceDegreeUniversityLogoFolder + "/" + jsonScienceDegree.scienceDegreeUniversityLogoFilename);
							});
	}

	if(jsonScienceDegree.scienceDegreeUniversityCountryTitle.length) universityLocation = jsonScienceDegree.scienceDegreeUniversityCountryTitle;
	if(jsonScienceDegree.scienceDegreeUniversityRegionTitle.length)
	{
		if(universityLocation.length) universityLocation += ", ";
		universityLocation += jsonScienceDegree.scienceDegreeUniversityRegionTitle;
	}

	if(jsonScienceDegree.scienceDegreeStart.length && jsonScienceDegree.scienceDegreeFinish.length)
	{
		studyPeriodLength = parseInt(jsonScienceDegree.scienceDegreeFinish) - parseInt(jsonScienceDegree.scienceDegreeStart) + 1;
		studyPeriodMessage = "<br>c " + jsonScienceDegree.scienceDegreeStart + " по " + jsonScienceDegree.scienceDegreeFinish;
		studyPeriodMessage += " (" + studyPeriodLength + " " + system_calls.GetYearsSpelling(studyPeriodLength);
		studyPeriodMessage +=  ")";
	}

	// --- scienceDegree body start
	// divMain.append(imgLogo);

	divMain.append($("<h4/>").append(jsonScienceDegree.scienceDegreeTitle + " в " + jsonScienceDegree.scienceDegreeUniversityTitle))
			.append(universityLocation + studyPeriodMessage);

	divRow	.append(divCover.append(imgLogo))
			.append(divMain);
	DOMtag	.append(divRow);
	// --- scienceDegree body end
};

var RenderLanguageMainInfo = function(jsonLanguage, DOMtag)
{
	var		divRow = $("<div>").addClass("row");
	var		divMain = $("<div>").addClass("col-xs-8 col-sm-10");
	var		divCover = $("<div>").addClass("col-xs-4 col-sm-2 margin_top_10 ");
	var		imgLogo;
	var		languageID = jsonLanguage.languageID;
	var		studyPeriodLength = 0;
	var		studyPeriodMessage = "";


	if((typeof(jsonLanguage.languageLogoFolder) != "undefined") && (typeof(jsonLanguage.languageLogoFilename) != "undefined") && (jsonLanguage.languageLogoFolder.length) && (jsonLanguage.languageLogoFilename.length))
	{
		imgLogo = $("<img>").addClass("max_100percents_100px div_content_center_alignment niceborder cursor_pointer")
							.attr("src", "/images/flags/" + jsonLanguage.languageLogoFolder + "/" + jsonLanguage.languageLogoFilename)
							.on("click", function(e) {
								$("#NewsFeedBookCoverDisplayModal").modal("show");
								$("#NewsFeedBookCoverDisplayModal span.bookTitle").empty().append(jsonLanguage.languageUniversityTitle);
								$("#NewsFeedBookCoverDisplayModal img").attr("src", "/images/flags/" + jsonLanguage.languageLogoFolder + "/" + jsonLanguage.languageLogoFilename);
							});
	}

	// --- language body start
	divMain.append($("<h4/>").append(jsonLanguage.languageTitle + " до уровня " + jsonLanguage.languageLevel));

	divRow	.append(divCover.append(imgLogo))
			.append(divMain);
	DOMtag	.append(divRow);
	// --- language body end
};

var RenderCompanyMainInfo = function(jsonCompany, DOMtag)
{
	var		divRow = $("<div>").addClass("row");
	var		divMain = $("<div>").addClass("col-xs-8 col-sm-10");
	var		divCover = $("<div>").addClass("col-xs-4 col-sm-2 margin_top_10 ");
	var		imgLogo;
	var		companyID = jsonCompany.companyID;
	var		studyPeriodLength = 0;
	var		studyPeriodMessage = "";


	if((typeof(jsonCompany.companyLogoFolder) != "undefined") && (typeof(jsonCompany.companyLogoFilename) != "undefined") && (jsonCompany.companyLogoFolder.length) && (jsonCompany.companyLogoFilename.length))
	{
		imgLogo = $("<img>").addClass("max_100percents_100px div_content_center_alignment niceborder cursor_pointer")
							.attr("src", "/images/companies/" + jsonCompany.companyLogoFolder + "/" + jsonCompany.companyLogoFilename)
							.on("click", function(e) {
								$("#NewsFeedBookCoverDisplayModal").modal("show");
								$("#NewsFeedBookCoverDisplayModal span.bookTitle").empty().append(jsonCompany.companyUniversityTitle);
								$("#NewsFeedBookCoverDisplayModal img").attr("src", "/images/companies/" + jsonCompany.companyLogoFolder + "/" + jsonCompany.companyLogoFilename);
							});
	}

	// --- company body start
	divMain.append($("<h4/>").append(jsonCompany.companyPositionTitle + " в " + jsonCompany.companyTitle));

	divRow	.append(divCover.append(imgLogo))
			.append(divMain);
	DOMtag	.append(divRow);
	// --- company body end
};



// --- build book block 
// --- used for book and citing
var RenderBookBody = function(jsonBook, DOMtag)
{

	// --- assign bookID to be able to scroll to this book
	DOMtag.attr("id", "book" + jsonBook.bookID);

	RenderBookMainInfo(jsonBook, DOMtag);

	{
	// --- like, comment, delete, edit buttons

		var		tagDiv6_1 = $("<div>");
		var		tagSpan7_1 = $("<span/>");
		var		buttonLike = $("<button/>").attr("type", "button")
										.addClass("btn btn-link")
										.data("messageId", jsonBook.usersBooksID)
										.data("messageLikesUserList", jsonBook.messageLikesUserList)
										.data("messageLikeType", "likeBook")
										.on("click", ButtonMessageLikeClickHandler);

				buttonLike	.attr("title", ButtonLikeTooltipTitle(buttonLike))
							.tooltip({ animation: "animated bounceIn", placement: "top" });
		var		tagSpan7_2 = $("<span/>");
		var		buttonComment = $("<button/>").attr("type", "button")
										.addClass("btn btn-link")
										.data("bookID", jsonBook.bookID)
										.data("usersBooksID", jsonBook.usersBooksID)
										.on("click", ButtonViewBookClickHandler);
		var		imgComment = $("<img>").attr("src", "/images/pages/news_feed/comment.png")
										.addClass("news_feed_comment");

		var		myUserID = $("#myUserID").data("myuserid");

		DOMtag.append(tagDiv6_1);
		tagDiv6_1.append(tagSpan7_1);
		tagSpan7_1.append(buttonLike)
					.append(" ");

		ButtonLikeRender(buttonLike);

		tagDiv6_1.append(tagSpan7_2);
		tagSpan7_2.append(buttonComment);
		buttonComment.append(imgComment)
				.append(" " + jsonBook.bookCommentsCount + "");

	} // --- end like, comment
};

// --- build group block 
// --- used for group and citing
var RenderGroupBody = function(jsonGroup, DOMtag)
{
	// --- assign groupID to be able to scroll to this group
	DOMtag.attr("id", "group" + jsonGroup.groupID);

	RenderGroupMainInfo(jsonGroup, DOMtag);
};

// --- build company block 
// --- used for company and citing
var RenderCompanySubscriptionBody = function(jsonCompany, DOMtag)
{
	// --- assign groupID to be able to scroll to this company
	DOMtag.attr("id", "company" + jsonCompany.groupID);

	RenderCompanySubscriptionMainInfo(jsonCompany, DOMtag);
};

// --- build certification block 
// --- used for certification and citing
var RenderCertificationBody = function(jsonCertification, DOMtag)
{
	var			divRow = $("<div>").addClass("row");
	var 		isbns = "";
	var			divMain = $("<div>").addClass("col-xs-8 col-sm-10");
	var			divLogo = $("<div>").addClass("col-xs-4 col-sm-2");
	var			imgLogo;

	if(jsonCertification.certificationID && jsonCertification.certificationID.length) DOMtag.attr("id", "certification" + jsonCertification.certificationID);

	RenderCertificationMainInfo(jsonCertification, DOMtag);

	{
	// --- like, comment, delete, edit buttons

		var		tagDiv6_1 = $("<div>");
		var		tagSpan7_1 = $("<span/>");
		var		buttonLike = $("<button/>").attr("type", "button")
										.addClass("btn btn-link")
										.data("messageId", jsonCertification.certificationID)
										.data("messageLikeType", "likeCertification")
										.data("messageLikesUserList", jsonCertification.messageLikesUserList)
										.on("click", ButtonMessageLikeClickHandler);

				buttonLike	.attr("title", ButtonLikeTooltipTitle(buttonLike))
							.tooltip({ animation: "animated bounceIn", placement: "top" });
		var		tagSpan7_2 = $("<span/>");
		var		buttonComment = $("<button/>").attr("type", "button")
										.addClass("btn btn-link")
										.data("certificationTrackID", jsonCertification.certificationTrackID)
										.data("usersCertificationID", jsonCertification.certificationID)
										.on("click", ButtonViewCertificationClickHandler);
		var		imgComment = $("<img>").attr("src", "/images/pages/news_feed/comment.png")
										.addClass("news_feed_comment");

		var		myUserID = $("#myUserID").data("myuserid");

		DOMtag.append(tagDiv6_1);
		tagDiv6_1.append(tagSpan7_1);
		tagSpan7_1.append(buttonLike)
					.append(" ");

		ButtonLikeRender(buttonLike);

		tagDiv6_1.append(tagSpan7_2);
		tagSpan7_2.append(buttonComment);
		buttonComment.append(imgComment)
				.append(" " + jsonCertification.certificationCommentsCount + "");

	} // --- end like, comment

};

// --- build course block 
// --- used for course and citing
var RenderCourseBody = function(jsonCourse, DOMtag)
{
	var			divRow = $("<div>").addClass("row");
	var 		isbns = "";
	var			divMain = $("<div>").addClass("col-xs-8 col-sm-10");
	var			divLogo = $("<div>").addClass("col-xs-4 col-sm-2");
	var			imgLogo;

	if(jsonCourse.usersCourseID && jsonCourse.usersCourseID.length) DOMtag.attr("id", "usercourse" + jsonCourse.usersCourseID);
	if(jsonCourse.courseID && jsonCourse.courseID.length) DOMtag.append("<div id=\"course" + jsonCourse.courseID + "\"></div>");

	RenderCourseMainInfo(jsonCourse, DOMtag);

	{
	// --- like, comment, delete, edit buttons

		var		tagDiv6_1 = $("<div>");
		var		tagSpan7_1 = $("<span/>");
		var		buttonLike = $("<button/>").attr("type", "button")
										.addClass("btn btn-link")
										.data("messageId", jsonCourse.usersCourseID)
										.data("messageLikeType", "likeCourse")
										.data("messageLikesUserList", jsonCourse.messageLikesUserList)
										.on("click", ButtonMessageLikeClickHandler);

				buttonLike	.attr("title", ButtonLikeTooltipTitle(buttonLike))
							.tooltip({ animation: "animated bounceIn", placement: "top" });
		var		tagSpan7_2 = $("<span/>");
		var		buttonComment = $("<button/>").attr("type", "button")
										.addClass("btn btn-link")
										.data("courseTrackID", jsonCourse.courseTrackID)
										.data("usersCourseID", jsonCourse.usersCourseID)
										.on("click", ButtonViewCourseClickHandler);
		var		imgComment = $("<img>").attr("src", "/images/pages/news_feed/comment.png")
										.addClass("news_feed_comment");

		var		myUserID = $("#myUserID").data("myuserid");

		DOMtag.append(tagDiv6_1);
		tagDiv6_1.append(tagSpan7_1);
		tagSpan7_1.append(buttonLike)
					.append(" ");

		ButtonLikeRender(buttonLike);

		tagDiv6_1.append(tagSpan7_2);
		tagSpan7_2.append(buttonComment);
		buttonComment.append(imgComment)
				.append(" " + jsonCourse.courseCommentsCount + "");

	} // --- end like, comment

};


// --- build scienceDegree block 
// --- used for scienceDegree and citing
var RenderScienceDegreeBody = function(jsonScienceDegree, DOMtag)
{
	var			divRow = $("<div>").addClass("row");
	var 		isbns = "";
	var			divMain = $("<div>").addClass("col-xs-8 col-sm-10");
	var			divLogo = $("<div>").addClass("col-xs-4 col-sm-2");
	var			imgLogo;
	var			universityLocation = "";


	// --- assign scienceDegreeID to be able to scroll to this scienceDegree
	if(jsonScienceDegree.scienceDegreeID && jsonScienceDegree.scienceDegreeID.length) DOMtag.attr("id", "scienceDegree" + jsonScienceDegree.scienceDegreeID);
	if(jsonScienceDegree.scienceDegreeUniversityID && jsonScienceDegree.scienceDegreeUniversityID.length) DOMtag.append("<div id=\"university" + jsonScienceDegree.scienceDegreeUniversityID + "\"></div>");

	RenderScienceDegreeMainInfo(jsonScienceDegree, DOMtag);

	{
	// --- like, comment, delete, edit buttons

		var		tagDiv6_1 = $("<div>");
		var		tagSpan7_1 = $("<span/>");
		var		buttonLike = $("<button/>").attr("type", "button")
										.addClass("btn btn-link")
										.data("messageId", jsonScienceDegree.scienceDegreeID)
										.data("messageLikesUserList", jsonScienceDegree.messageLikesUserList)
										.data("messageLikeType", "likeUniversityDegree")
										.on("click", ButtonMessageLikeClickHandler);

				buttonLike	.attr("title", ButtonLikeTooltipTitle(buttonLike))
							.tooltip({ animation: "animated bounceIn", placement: "top" });
		var		tagSpan7_2 = $("<span/>");
		var		buttonComment = $("<button/>").attr("type", "button")
										.addClass("btn btn-link")
										.data("scienceDegreeID", jsonScienceDegree.scienceDegreeID)
										.data("scienceDegreeUniversityID", jsonScienceDegree.scienceDegreeUniversityID)
										.on("click", ButtonViewScienceDegreeClickHandler);
		var		imgComment = $("<img>").attr("src", "/images/pages/news_feed/comment.png")
										.addClass("news_feed_comment");

		var		myUserID = $("#myUserID").data("myuserid");

		DOMtag.append(tagDiv6_1);
		tagDiv6_1.append(tagSpan7_1);
		tagSpan7_1.append(buttonLike)
					.append(" ");

		ButtonLikeRender(buttonLike);

		tagDiv6_1.append(tagSpan7_2);
		tagSpan7_2.append(buttonComment);
		buttonComment.append(imgComment)
				.append(" " + jsonScienceDegree.scienceDegreeCommentsCount + "");

	} // --- end like, comment

};

// --- build language block 
// --- used for language and citing
var RenderLanguageBody = function(jsonLanguage, DOMtag)
{
	var			divRow = $("<div>").addClass("row");
	var			divMain = $("<div>").addClass("col-xs-8 col-sm-10");
	var			divLogo = $("<div>").addClass("col-xs-4 col-sm-2");
	var			imgLogo;

	// --- assign languageID to be able to scroll to this language
	if(jsonLanguage.usersLanguageID && jsonLanguage.usersLanguageID.length) DOMtag.attr("id", "userLanguage" + jsonLanguage.usersLanguageID);
	if(jsonLanguage.languageID && jsonLanguage.languageID.length) DOMtag.append("<div id=\"language" + jsonLanguage.languageID + "\"></div>");

	RenderLanguageMainInfo(jsonLanguage, DOMtag);

	{
	// --- like, comment, delete, edit buttons

		var		tagDiv6_1 = $("<div>");
		var		tagSpan7_1 = $("<span/>");
		var		buttonLike = $("<button/>").attr("type", "button")
										.addClass("btn btn-link")
										.data("messageId", jsonLanguage.usersLanguageID)
										.data("messageLikesUserList", jsonLanguage.messageLikesUserList)
										.data("messageLikeType", "likeLanguage")
										.on("click", ButtonMessageLikeClickHandler);

				buttonLike	.attr("title", ButtonLikeTooltipTitle(buttonLike))
							.tooltip({ animation: "animated bounceIn", placement: "top" });
		var		tagSpan7_2 = $("<span/>");
		var		buttonComment = $("<button/>").attr("type", "button")
										.addClass("btn btn-link")
										.data("languageID", jsonLanguage.languageID)
										.data("usersLanguageID", jsonLanguage.usersLanguageID)
										.on("click", ButtonViewLanguageClickHandler);
		var		imgComment = $("<img>").attr("src", "/images/pages/news_feed/comment.png")
										.addClass("news_feed_comment");

		var		myUserID = $("#myUserID").data("myuserid");

		DOMtag.append(tagDiv6_1);
		tagDiv6_1.append(tagSpan7_1);
		tagSpan7_1.append(buttonLike)
					.append(" ");

		ButtonLikeRender(buttonLike);

		tagDiv6_1.append(tagSpan7_2);
		tagSpan7_2.append(buttonComment);
		buttonComment.append(imgComment)
				.append(" " + jsonLanguage.languageCommentsCount + "");

	} // --- end like, comment

};

// --- build company block 
// --- used for company and citing
var RenderCompanyBody = function(jsonCompany, DOMtag)
{
	var			divRow = $("<div>").addClass("row");
	var			divMain = $("<div>").addClass("col-xs-8 col-sm-10");
	var			divLogo = $("<div>").addClass("col-xs-4 col-sm-2");
	var			imgLogo;

	// --- assign companyID to be able to scroll to this company
	if(jsonCompany.usersCompanyID && jsonCompany.usersCompanyID.length) DOMtag.attr("id", "vacancy" + jsonCompany.usersCompanyID);
	if(jsonCompany.companyID && jsonCompany.companyID.length) DOMtag.append("<div id=\"company" + jsonCompany.companyID + "\"></div>");

	RenderCompanyMainInfo(jsonCompany, DOMtag);

	{
	// --- like, comment, delete, edit buttons

		var		tagDiv6_1 = $("<div>");
		var		tagSpan7_1 = $("<span/>");
		var		buttonLike = $("<button/>").attr("type", "button")
										.addClass("btn btn-link")
										.data("messageId", jsonCompany.usersCompanyID)
										.data("messageLikesUserList", jsonCompany.messageLikesUserList)
										.data("messageLikeType", "likeCompany")
										.on("click", ButtonMessageLikeClickHandler);

				buttonLike	.attr("title", ButtonLikeTooltipTitle(buttonLike))
							.tooltip({ animation: "animated bounceIn", placement: "top" });
		var		tagSpan7_2 = $("<span/>");
		var		buttonComment = $("<button/>").attr("type", "button")
										.addClass("btn btn-link")
										.data("companyID", jsonCompany.companyID)
										.data("usersCompanyID", jsonCompany.usersCompanyID)
										.on("click", ButtonViewCompanyClickHandler);
		var		imgComment = $("<img>").attr("src", "/images/pages/news_feed/comment.png")
										.addClass("news_feed_comment");

		var		myUserID = $("#myUserID").data("myuserid");

		DOMtag.append(tagDiv6_1);
		tagDiv6_1.append(tagSpan7_1);
		tagSpan7_1.append(buttonLike)
					.append(" ");

		ButtonLikeRender(buttonLike);

		tagDiv6_1.append(tagSpan7_2);
		tagSpan7_2.append(buttonComment);
		buttonComment.append(imgComment)
				.append(" " + jsonCompany.companyCommentsCount + "");

	} // --- end like, comment

};

// --- build message block 
// --- used for message and citing
var RenderMessageBody = function(jsonMessage, DOMtag)
{
	// --- assign MessageID to be able to scroll to this message
	if(jsonMessage.messageId && jsonMessage.messageId.length) DOMtag.attr("id", "message" + jsonMessage.messageId);
	// --- Message post
	if(jsonMessage.messageTitle !== "")
	{
		if(jsonMessage.messageLink !== "")
		{
			var		tagHeader5 = $("<h4/>");
			var		tagA6_1 = $("<a/>").attr("href", jsonMessage.messageLink)
										.attr("target", "_blank");
			tagA6_1.append(jsonMessage.messageTitle);

			tagHeader5.append(tagA6_1);
			DOMtag.append(tagHeader5);
		}
		else
		{
			DOMtag.append($("<h4/>").append(system_calls.ReplaceTextLinkToURL(jsonMessage.messageTitle)));				
		}
	}
	if(jsonMessage.messageMessage !== "")
	{
		DOMtag.append(system_calls.ReplaceTextLinkToURL(jsonMessage.messageMessage));
	}

	if(jsonMessage.messageImageList.length && jsonMessage.messageImageList[0].mediaType == "video")
		BuildVideoTag(jsonMessage.messageImageList, DOMtag);
	else if(jsonMessage.messageImageList.length && jsonMessage.messageImageList[0].mediaType == "image")
		BuildCarousel(jsonMessage.messageImageList, DOMtag);
	else if(jsonMessage.messageImageList.length && jsonMessage.messageImageList[0].mediaType == "youtube_video")
		BuildYoutubeEmbedTag(jsonMessage.messageImageList, DOMtag);

	// --- like, comment, delete, edit buttons
	{
		var		tagDivMain = $("<div>");
		var		tagSpanLike = $("<span/>");
		var		buttonLike = $("<button/>").attr("type", "button")
										.addClass("btn btn-link")
										.data("messageId", jsonMessage.messageId)
										.data("messageLikesUserList", jsonMessage.messageLikesUserList)
										.on("click", ButtonMessageLikeClickHandler);

				buttonLike	.attr("title", ButtonLikeTooltipTitle(buttonLike))
							.tooltip({ animation: "animated bounceIn", placement: "top" });
		var		tagSpanComment = $("<span/>");
		var		tagButtonComment = $("<button/>").attr("type", "button")
										.addClass("btn btn-link")
										.data("messageId", jsonMessage.messageId)
										.on("click", ButtonViewMessageClickHandler);
		var		imgComment = $("<img>").attr("src", "/images/pages/news_feed/comment.png")
										.addClass("news_feed_comment");

		var		myUserID = $("#myUserID").data("myuserid");

		DOMtag.append(tagDivMain);
		tagDivMain.append(tagSpanLike);
		tagSpanLike.append(buttonLike)
					.append(" ");

		ButtonLikeRender(buttonLike);

		tagDivMain.append(tagSpanComment);
		tagSpanComment.append(tagButtonComment);
		tagButtonComment.append(imgComment)
				.append(" " + jsonMessage.messageCommentsCount + "");

		if(
			((jsonMessage.srcObj.type == "user") && (jsonMessage.srcObj.id == myUserID)) ||
			((jsonMessage.srcObj.type == "company") && (globalMyCompanies.indexOf(parseFloat(jsonMessage.srcObj.id)) >= 0))
		)
		{
			var		tagSpanTrashBin = $("<span/>").addClass("news_feed_trashbin_right");
			var		tagButtonTrashBin = $("<button/>").attr("type", "button")
														.addClass("btn btn-link")
														.data("messageID", jsonMessage.messageId);
			var		tagImgTrashBin = $("<span>").addClass("glyphicon glyphicon-trash news_feed_trashbin");

			var		tagSpanPencil = $("<span/>").addClass("news_feed_pencil_right");
			var		tagButtonPencil = $("<button/>").attr("type", "button")
														.addClass("btn btn-link")
														.data("messageID", jsonMessage.messageId);
			var		tagImgPencil = $("<span>").addClass("glyphicon glyphicon-pencil news_feed_pencil");

			tagButtonTrashBin.on("click", function() {
				console.debug("RenderMessageBody: delete click handler" + $(this).data("messageID"));
				$("#deleteMessageFromFeedSubmit").data("messageID", $(this).data("messageID"));
				$("#DeleteMessageFromFeed").modal("show");
			});
			tagButtonPencil.on("click", function() {
				console.debug("RenderMessageBody: edit click handler" + $(this).data("messageID"));
				$("#editNewsFeedMessageSubmit").data("messageID", $(this).data("messageID"));
				$("#editNewsFeedMessage").modal("show");
			});

			tagSpanTrashBin.append(tagButtonTrashBin.append(tagImgTrashBin));
			tagSpanPencil.append(tagButtonPencil.append(tagImgPencil));

			tagDivMain.append(tagSpanTrashBin);
			tagDivMain.append(tagSpanPencil);
		}
	} // --- end like, comment, edit, delete buttons

};

var	GetHrefAttrFromSrcObj = function(jsonMessage)
{
	var 	result;

	result	=	jsonMessage.srcObj.type == "user" ? "/userprofile/" + jsonMessage.srcObj.id + "?rand=" + system_calls.GetUUID() :
				jsonMessage.srcObj.type == "company" ? "/company/" + jsonMessage.srcObj.link + "?rand=" + system_calls.GetUUID() : 
				jsonMessage.srcObj.type == "group" ? "/group/" + jsonMessage.srcObj.link + "?rand=" + system_calls.GetUUID() : "";

	return result;
};

var	GetHrefAttrFromDstObj = function(jsonMessage)
{
	var 	result;

	result	=	jsonMessage.dstObj.type == "user" ? "/userprofile/" + jsonMessage.dstObj.id + "?rand=" + system_calls.GetUUID() :
				jsonMessage.dstObj.type == "company" ? "/company/" + jsonMessage.dstObj.link + "?rand=" + system_calls.GetUUID() : 
				jsonMessage.dstObj.type == "group" ? "/group/" + jsonMessage.dstObj.link + "?rand=" + system_calls.GetUUID() : "";

	return result;
};

var BuildNewsFeedSingleBlock = function(item, i, arr)
{
	var 	divContainer, divRow, divPhoto, hrefSrcObj, tagImg3, tagDivMessage, hrefUsername, spanTimestamp, canvasSrcObj;
	var		tagDivMsgInfo;
	var		canvasCtx; 				// --- used for transfer arg to function HandlerDrawPicture Avatar
	var		jsonMessage = item;

	divContainer 	= $("<div/>").addClass("container");
	divRow 			= $("<div/>").addClass("row");
	// divRow 			= $("<div/>").addClass("row container");
	divPhoto 		= $("<div/>").addClass("col-lg-1 col-md-1 col-sm-2 col-xs-3 news_feed_photo_block");
	tagDivMsgInfo 	= $("<div/>").addClass("col-lg-10 col-md-10 col-sm-10 col-xs-9 shift_down");
	hrefSrcObj   	= $("<a>");
	canvasSrcObj	= $("<canvas>").attr("width", "80")
									.attr("height", "80");
	tagDivMessage 	= $("<div/>").addClass("col-lg-10 col-md-10 col-sm-12 col-xs-12 single_block box-shadow--6dp");
	hrefUsername   	= $("<a>");
	spanTimestamp	= $("<div>").addClass("news_feed_timestamp")
								.addClass("cursor_pointer")
								.attr("data-toggle", "tooltip")
								.attr("data-placement", "top")
								.attr("title", system_calls.GetLocalizedDateFromDelta(parseFloat(jsonMessage.eventTimestampDelta)))
								.append(system_calls.GetLocalizedDateInHumanFormatMsecSinceEvent(parseFloat(jsonMessage.eventTimestampDelta) * 1000));

	divContainer.append(divRow); 
	divRow.append(divPhoto)
		   .append(tagDivMsgInfo);
	divPhoto.append(hrefSrcObj);
	hrefSrcObj.append(tagImg3);
	hrefSrcObj.append(canvasSrcObj);
	tagDivMsgInfo.append(hrefUsername)
				.append(spanTimestamp);
	tagDivMsgInfo.append(" " + system_calls.GetGenderedActionCategoryTitle(jsonMessage) + "<br>");

	// --- Draw the text avatar initials after adding Context to DOM model
	canvasCtx = canvasSrcObj[0].getContext("2d");
	if((typeof(jsonMessage.dstObj) == "object") && (typeof(jsonMessage.dstObj.type) == "string") && (jsonMessage.dstObj.type == "group"))
	{
		canvasSrcObj.addClass('canvas-big-avatar-corners');
		DrawCompanyAvatar(canvasCtx, jsonMessage.dstObj.avatar, jsonMessage.dstObj.name, jsonMessage.dstObj.nameLast);

		hrefUsername.append(jsonMessage.dstObj.name + " " + jsonMessage.dstObj.nameLast)
					.attr("href", GetHrefAttrFromDstObj(jsonMessage));
		hrefSrcObj	.attr("href", GetHrefAttrFromDstObj(jsonMessage));
	}
	else if(jsonMessage.srcObj.type == "company")
	{
		canvasSrcObj.addClass('canvas-big-avatar-corners');
		DrawCompanyAvatar(canvasCtx, jsonMessage.srcObj.avatar, jsonMessage.srcObj.name, jsonMessage.srcObj.nameLast);

		hrefUsername.append(jsonMessage.srcObj.companyType + " " + jsonMessage.srcObj.name + " " + jsonMessage.srcObj.nameLast)
					.attr("href", GetHrefAttrFromSrcObj(jsonMessage));
		hrefSrcObj	.attr("href", GetHrefAttrFromSrcObj(jsonMessage));
	}
	else
	{
		canvasSrcObj.addClass('canvas-big-avatar');
		DrawUserAvatar(canvasCtx, jsonMessage.srcObj.avatar, jsonMessage.srcObj.name, jsonMessage.srcObj.nameLast);

		hrefUsername.append(jsonMessage.srcObj.name + " " + jsonMessage.srcObj.nameLast)
					.attr("href", GetHrefAttrFromSrcObj(jsonMessage));
		hrefSrcObj	.attr("href", GetHrefAttrFromSrcObj(jsonMessage));
	}

	// --- message types parsing
	if(jsonMessage.actionTypesId == "11")
	{
		// --- 11 message written

		divRow.append(tagDivMessage);
		RenderMessageBody(jsonMessage, tagDivMessage);
	} // --- end of message generation
	else if((jsonMessage.actionTypesId == "14") || (jsonMessage.actionTypesId == "16") || (jsonMessage.actionTypesId == "15"))
	{
		// --- 14 friendship established
		// --- 15 friendship broken
		// --- 16 friendship request sent

		var	tagFriendLink = $("<a>").attr("href", "/userprofile/" + jsonMessage.friendID);

		tagFriendLink.append(jsonMessage.friendName + " " + jsonMessage.friendNameLast);

		tagDivMsgInfo.empty();
		tagDivMsgInfo.append(spanTimestamp);
		tagDivMsgInfo.append(hrefUsername);
		tagDivMsgInfo.append(" " + jsonMessage.actionCategoryTitle + " ")
			   .append(tagFriendLink);

		var infoAboutFriend = BuildFriendBlock(jsonMessage);
		divRow.append(tagDivMessage);
		tagDivMessage.append(infoAboutFriend);
	}
	else if(jsonMessage.actionTypesId === "41")
	{
		// --- skill added

		var		message = "";
		var		skillLink = $("<a>").attr("href", "/userprofile/" + jsonMessage.srcObj.id + "?scrollto=SkillPathHeader&rand=" + system_calls.GetUUID()).append("подтвердите");

		message = system_calls.GetGenderedPhrase(jsonMessage, jsonMessage.actionTypesTitle, jsonMessage.actionTypesTitleMale, jsonMessage.actionTypesTitleFemale);
		message += " <i>" + jsonMessage.skillTitle + "</i>, ";

		tagDivMsgInfo.append(message)
					.append(skillLink)
					.append(" если вы согласны");
	}
	else if((jsonMessage.actionTypesId === "54") || (jsonMessage.actionTypesId === "53"))
	{
		// --- book read

		// --- hide subtitile to save some space
		// tagDivMsgInfo.append(jsonMessage.actionTypesTitle);
		divRow.append(tagDivMessage);
		RenderBookBody(jsonMessage, tagDivMessage);
	}
	else if((jsonMessage.actionTypesId === "64") || (jsonMessage.actionTypesId === "65"))
	{
		// --- create / subscribe group

		// --- hide subtitile to save some space
		// tagDivMsgInfo.append(jsonMessage.actionTypesTitle);
		divRow.append(tagDivMessage);
		RenderGroupBody(jsonMessage, tagDivMessage);
	}
	else if(jsonMessage.actionTypesId === "63")
	{
		// --- create / subscribe group

		// --- hide subtitile to save some space
		// tagDivMsgInfo.append(jsonMessage.actionTypesTitle);
		divRow.append(tagDivMessage);
		RenderCompanySubscriptionBody(jsonMessage, tagDivMessage);
	}
	else if(jsonMessage.actionTypesId === "22")
	{
		// --- became certified

		// --- hide subtitile to save some space
		// tagDivMsgInfo.append(jsonMessage.actionTypesTitle);
		divRow.append(tagDivMessage);
		RenderCertificationBody(jsonMessage, tagDivMessage);
	}
	else if(jsonMessage.actionTypesId === "23")
	{
		// --- course attending

		// --- hide subtitile to save some space
		// tagDivMsgInfo.append(jsonMessage.actionTypesTitle);
		divRow.append(tagDivMessage);
		RenderCourseBody(jsonMessage, tagDivMessage);
	}
	else if(jsonMessage.actionTypesId === "39")
	{
		// --- got science degree

		// --- hide subtitile to save some space
		// tagDivMsgInfo.append(jsonMessage.actionTypesTitle);
		divRow.append(tagDivMessage);
		RenderScienceDegreeBody(jsonMessage, tagDivMessage);
	}
	else if(jsonMessage.actionTypesId === "40")
	{
		// --- language improved

		// --- hide subtitile to save some space
		// tagDivMsgInfo.append(jsonMessage.actionTypesTitle);
		divRow.append(tagDivMessage);
		RenderLanguageBody(jsonMessage, tagDivMessage);
	}
	else if(jsonMessage.actionTypesId === "1")
	{
		// --- change employment

		// --- hide subtitile to save some space
		// tagDivMsgInfo.append(jsonMessage.actionTypesTitle);
		divRow.append(tagDivMessage);
		RenderCompanyBody(jsonMessage, tagDivMessage);
	}
	else
	{
		tagDivMsgInfo.append(system_calls.GetGenderedPhrase(jsonMessage, jsonMessage.actionTypesTitle, jsonMessage.actionTypesTitleMale,  jsonMessage.actionTypesTitleFemale));
	}

	$("#news_feed").append(divContainer);
	spanTimestamp.tooltip({ animation: "animated bounceIn"});
};

var BuildNewsFeed = function(data) 
{
	if(data.length === 0)
	{
		// reduce counter
		--globalPageCounter;

		console.debug("BuildNewsFeed: reduce page# due to request return empty result");
	}
	else
	{
		data.forEach(BuildNewsFeedSingleBlock);
	}

	setTimeout(LazyImageLoad, 3000);
};

var	ScrollToElementID = function(elementID)
{
	if((elementID.length > 1) && $(elementID).length) // --- elementID is "#XXXX"
		system_calls.ScrollWindowToElementID(elementID);
};

var	GetNewsFeedFromServer = function(cleanBeforeUpdate, scrollToElementID)
{
	var		cgiScript, action;
	var		cgiParams = {};

	scrollLock = true;

	if($("#news_feed").data("action") == "news_feed")
	{
		cgiScript = "index.cgi";
		action = "AJAX_getNewsFeed";
		cgiParams = {page: globalPageCounter};
	}
	else if($("#news_feed").data("action") == "getUserWall")
	{
		cgiScript = "index.cgi"; 
		action = "AJAX_getUserWall"; 
		cgiParams = {page: globalPageCounter, id: $("#news_feed").data("id"), login: $("#news_feed").data("login")};
	}
	else if($("#news_feed").data("action") == "getGroupWall")
	{
		cgiScript = "group.cgi"; 
		action = "AJAX_getGroupWall"; 
		cgiParams = {page: globalPageCounter, link: $("#news_feed").data("link")};
	}
	else if($("#news_feed").data("action") == "getEventWall")
	{
		cgiScript = "index.cgi"; 
		action = "AJAX_getEventWall"; 
		cgiParams = {page: globalPageCounter, link: $("#news_feed").data("link")};
	}
	else if($("#news_feed").data("action") == "getCompanyWall")
	{
		cgiScript = "company.cgi"; 
		action = "AJAX_getCompanyWall"; 
		cgiParams = {page: globalPageCounter, link: $("#news_feed").data("link")};
	}
	else if($("#news_feed").data("action") == "view_company_profile")
	{
		cgiScript = "company.cgi"; 
		action = "AJAX_getCompanyWall"; 
		cgiParams = {page: globalPageCounter, link: $("#news_feed").data("link")};
	}

	if(action.length && cgiScript.length)
	{
		$.getJSON('/cgi-bin/' + cgiScript + '?action=' + action, cgiParams)
			.done(function(data) {
				if(data.status == "success")
				{
					if(cleanBeforeUpdate)
					{
						globalNewsFeed = [];
						$("#news_feed").empty();
					}
					globalMyCompanies = data.my_companies || [];
					globalNewsFeed = globalNewsFeed.concat(data.feed);
					BuildNewsFeed(data.feed);
					scrollLock = false;

					// --- scroll required just in case updating
					// --- no need to scroll, during surfing
					if(cleanBeforeUpdate)
						ScrollToElementID(scrollToElementID);
				}
				else
				{
					console.error("GetNewsFeedFromServer:ERROR: JSON returned error status (" + data.description + ")");
					if(data.description == "re-login required") window.location.href = data.link;
				}
			})
			.fail(function() {
				console.error("GetNewsFeedFromServer:ERROR: parsing JSON response from server");
			});
	}
	else
	{
		console.error("GetNewsFeedFromServer:ERROR: action[" + action + "] or cgiScript[" + cgiScript + "] is empty");
	}
};

var	ZeroizeThenUpdateNewsFeedThenScrollTo = function(scrollToElementID)
{
	var		action = "";
	var		cgiScript = "";

	globalPageCounter = 0;
	GetNewsFeedFromServer(true, scrollToElementID);
};

var HandlerScrollToShow = function() 
{
	var		windowPosition	= $(window).scrollTop();
	var		clientHeight	= document.documentElement.clientHeight;
	var		divPosition		= $("#scrollerToShow").position().top;

	if(((windowPosition + clientHeight) > divPosition) && (!scrollLock))
	{
		// console.debug("HandlerScrollToShow: globalPageCounter = " + globalPageCounter);
		// --- AJAX get news_feed from the server 
		globalPageCounter += 1;

		GetNewsFeedFromServer(false, "");
	}

	// console.debug("HandlerScrollToShow: defining position of each carousel");
	$("div.carousel.slide[data-ride='carousel']").each(
		function()
		{
			var		tag = $(this);
			// console.debug("HandlerScrollToShow: carousel id [" + tag.attr('id') + "] top position is " + tag.offset().top + " compare to " + windowPosition + " - " + (windowPosition + clientHeight));
			if((tag.offset().top >= windowPosition) && (tag.offset().top <= windowPosition + clientHeight))
				tag.carousel('cycle');
			else
				tag.carousel('pause');
		});

	// console.debug("HandlerScrollToShow: defining position of each carousel");
	$("div video.videoPlacement").each(
		function()
		{
			var		tag = $(this);
			// console.debug("HandlerScrollToShow: carousel id [" + tag.attr('id') + "] top position is " + tag.offset().top + " compare to " + windowPosition + " - " + (windowPosition + clientHeight));
			if((tag.offset().top >= windowPosition) && (tag.offset().top <= windowPosition + clientHeight))
			{
				var		playedAttempts = parseInt(tag.data("playedAttempts"));
				if(!playedAttempts)
				{
					tag.data("playedAttempts", playedAttempts + 1);
					tag.get(0).play();
				}
			}
			else
				tag.get(0).pause();
		});
};

var ZeroizeNewMessageModal = function()
{
	$("#newsFeedMessageTitle").val("");
	$("#newsFeedMessageLink").val("");
	$("#newsFeed_NewMessageLink_GetDataButton").attr("disabled", "");
	$("#newsFeedMessageText").val("");
	$("[name=newsFeedAccessRights]:eq(0)").prop("checked", true);
};

var	NewsFeedPostMessage = function () 
{
	var	isClearToSubmit = false;
	var	title = $("#newsFeedMessageTitle").val();
	var	text = $("#newsFeedMessageText").val();
	var	images = $("#PostMessage_PreviewImage").html();
	var	lenghtyWord;

	if((title.length || text.length || images.length) === 0)
	{
		system_calls.PopoverError("NewsFeedMessageSubmit", "Невозможно написать пустое сообщение");
	}
	else if(system_calls.LongestWordSize(title) > 37) // четырёхсотпятидесятисемимиллиметровое
	{
		lenghtyWord = system_calls.LongestWord(title);

		$("#newsFeedMessageTitle").selectRange(title.search(lenghtyWord), title.search(lenghtyWord) + lenghtyWord.length);

		system_calls.PopoverError("NewsFeedMessageSubmit", "Слишком длинное слово: " + lenghtyWord);
	}
	else if(system_calls.LongestWordSize(text) > 37) // четырёхсотпятидесятисемимиллиметровое
	{
		lenghtyWord = system_calls.LongestWord(text);

		$("#newsFeedMessageText").selectRange(text.search(lenghtyWord), text.search(lenghtyWord) + lenghtyWord.length);

		system_calls.PopoverError("NewsFeedMessageSubmit", "Слишком длинное слово: " + lenghtyWord);
	}
	else
	{
		// --- success in message posting

		$("#NewsFeedMessageSubmit").button("loading");

		$.ajax({
				url: '/cgi-bin/index.cgi', 
				type: 'POST',
				dataType: 'json',
				cache: false,
				data: 
				{
					action: 'AJAX_postNewsFeedMessage',
					newsFeedMessageDstType: $("#news_feed").data("dsttype"),
					newsFeedMessageDstID: $("#news_feed").data("dstid"),
					newsFeedMessageSrcType: $("#srcEntity option:selected").data("srcType"),
					newsFeedMessageSrcID: $("#srcEntity option:selected").data("srcID"),
					newsFeedMessageTitle: $("#newsFeedMessageTitle").val(),
					newsFeedMessageLink: $("#newsFeedMessageLink").val(),
					newsFeedMessageText: $("#newsFeedMessageText").val(),
					newsFeedMessageRights: $("#newsFeedAccessRights:checked").val(),
					newsFeedMessageImageTempSet: imageTempSet,
					random: system_calls.GetUUID()
				}})
				.done(function(data) {
					console.debug("$(document).getJSON(AJAX_postNewsFeed).success(): status - " + data[0].result);

					if(data[0].result == "error") 
					{
						system_calls.AlertError("newsFeedNewMessageError", data[0].description);
						console.error("$(document).getJSON(AJAX_postNewsFeed).success():ERROR status " + data[0].description);
					}				
					if(data[0].result == "success") 
					{
						ZeroizeNewMessageModal();
						ZeroizeThenUpdateNewsFeedThenScrollTo("");

						$("#NewsFeedNewMessage").modal("hide");
					}			
				})
				.fail( function(data) {
					system_calls.AlertError("newsFeedNewMessageError", "ошибка ответа сервера");
					console.error("$(document).getJSON(AJAX_postNewsFeed).success():ERROR parsing JSON server response");
				})
				.always(function(data) {
					$("#NewsFeedMessageSubmit").button("reset");
				});
	}
};

var	GetCompanyName = function(companyID, companies)
{
	var		result = "";

	if(typeof(companies) != "undefined")
	{
		companies.forEach(function(item) {
			if(item.id == companyID) result = item.type + " " + item.name;
		});
	}

	return result;
};

// --- clean-up picture uploads environment
var NewMessageNewsFeedModalShownHandler = function()
{
	// --- globalUploadImageCounter used for disabling "Post" button during uploading images
	globalUploadImageCounter = 0;
	globalUploadImageTotal = 0;

	// TODO: 2delete: debug function to check upload functionality
	globalUploadImage_UnloadedList = [];
	Update_PostMessage_ListUnloaded(globalUploadImage_UnloadedList);

	// $("#NewsFeedMessageSubmit").button('reset');
	$("#NewsFeedMessageSubmit").text('Написать');

	// --- clean-up preview pictures in PostMessage modal window 
	$("#PostMessage_PreviewImage").empty();
	globalPostMessageImageList = [];

	// --- set progress bar to 0 length
	$('#progress .progress-bar').css('width', '0%');

	// --- set var imageTempSet to random
	imageTempSet = Math.floor(Math.random()*99999999);
	$('#newMessageFileUpload').fileupload({formData: {imageTempSet: imageTempSet}});

	// --- zeroize tempSet for user at image_news table
	$.getJSON('/cgi-bin/index.cgi?action=AJAX_prepareFeedImages', {param1: ''})
			.done(function(data) {
				if(data.result == "success")
				{
					var		action = $("#news_feed").data("action");

					// --- if user is administering companies build new select box for company news
					myCompanies = data.companies;
					$("#NewsFeedNewMessage div.messageSrc")	.empty()
															.append("<label for=\"newsFeedMessageSrc\">Написать от имени:</label>")
															.append(RenderSelectBoxWithUserAndCompanies(myProfile, myCompanies));

					if(action == "getGroupWall")
						$("#NewsFeedNewMessage div.messageSrc").addClass("hidden");
					else if((action == "getCompanyWall") || (action == "view_company_profile"))
					{
						$("#NewsFeedNewMessage div.messageSrc").addClass("hidden");
						$("#srcEntity").val(GetCompanyName($("#news_feed").data("id"), data.companies));
					}
					else if(myCompanies.length)
						$("#NewsFeedNewMessage div.messageSrc").removeClass("hidden");
					else
						$("#NewsFeedNewMessage div.messageSrc").addClass("hidden");
				}
				else if(data.result == "error")
				{
					console.error("NewMessageNewsFeedModalShownHandler:ERROR: " + data.description);
					if((data.description == "re-login required") && (data.location.length))
					{
						window.location.href = data.location;
					}

				}
				else
				{
					console.error("NewMessageNewsFeedModalShownHandler:ERROR: unknown status returned from server");
				}
			})
			.fail(function(e) {
				console.error("NewMessageNewsFeedModalShownHandler:ERROR: parsing JSON response from server");
			});

	// --- enable all field for safelty reason, just in case they were disabled earlier
	NewMessageModalResetLayout();
};

var	RenderSelectBoxWithUserAndCompanies = function(user, companies)
{
	var		resultTag = $("<select>", {id:"srcEntity", class:"form-control"});

	resultTag.append($("<option>").append(user.firstName + " " + user.lastName).data("srcID", user.id).data("srcType", "user"));
	companies.forEach(function(item) 
	{
		resultTag.append($("<option>").append(item.type + " " + item.name).data("srcID", item.id).data("srcType", "company"));
	});

	return resultTag;
};

// --- clean-up picture uploads environment
var NewMessageNewsFeedModalHiddenHandler = function()
{
	// --- clean-up preview pictures in PostMessage modal window 
	$("#PostMessage_PreviewImage").empty();
	globalPostMessageImageList = [];

	// --- set progress bar to 0 length
	$('#progress .progress-bar').css('width', '0%');

	// --- clean-up error mesage div
	$("#newsFeedNewMessageError").empty().removeClass();

	// --- cleanup picture list from the posted message
	$.getJSON('/cgi-bin/index.cgi?action=AJAX_cleanupFeedImages', {imageTempSet: imageTempSet})
			.done(function(data) {
				console.debug("NewMessageNewsFeedModalHiddenHandler: $(document).getJSON(AJAX_cleanupFeedImages).done(): result = " + data.result);
			});


	// --- set var imageSet to NULL
	imageTempSet = "";
	$('#newMessageFileUpload').fileupload({formData: {imageTempSet: imageTempSet}});
};

// TODO: 2delete: debug function to check upload functionality
var Update_PostMessage_ListUnloaded = function(arr2show)
{
	$(".PostMessage_ListUnloaded").text( arr2show.join(" , "));
};

return {
	Init:Init
		};

})();


