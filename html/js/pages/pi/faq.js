/* exported faq_obj */

var	faq_obj = (function()
{
	"use strict";

	var	Init = function()
	{
		GetInitialData();
	};

	var	GetInitialData = function()
	{
		var		currTag = $("#dashboard");


		$.getJSON(
			"/cgi-bin/account.cgi",
			{
				"action":"AJAX_getFaq",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					RenderFaq(data.faq);
				}
				else
				{
					console.error(".done(): ERROR: " + data.description);
					system_calls.PopoverError(currTag, "Ошибка: " + data.description);
				}
			})
			.fail(function()
			{
				setTimeout(function() {
					system_calls.PopoverError(currTag, "Ошибка ответа сервера");
				}, 500);
			});
	};

	var	FAQ_GetDOM = function(faq_list)
	{
		let	result = $();


		faq_list.forEach(function(question)
		{
			let		row = $("<div>").addClass("row");
			let		col = $("<div>").addClass("col-xs-12");
			let		_a	= $("<a>")
									.attr("href", "#")
									.attr("data-toggle", "collapse")
									.attr("data-target", "#question_" + question.id + "_content")
									.append(question.title);

			var		collapsible_row = $("<div>")
									.addClass("row")
									.addClass("collapse out")
									.attr("id", "question_" + question.id + "_content");

			let		top_shadow_div = $("<div>")
									.addClass("col-xs-12 collapse-top-shadow margin_bottom_20")
									.append("<p></p>");

			let		bottom_shadow_div = $("<div>")
									.addClass("col-xs-12 collapse-bottom-shadow margin_top_20")
									.append("<p></p>");

			let		collapsible_content_col = $("<div>") .addClass("col-xs-12");

			collapsible_row
							.append(top_shadow_div)
							.append(collapsible_content_col.append(question.description))
							.append(bottom_shadow_div);

			result = result
							.add(row.append(col.append(_a)))
							.add(collapsible_row);


		});

		return result;
	};

	var	RenderFaq = function(faq_list)
	{
		$("#faq").empty().append(FAQ_GetDOM(faq_list));
	};

	return {
		Init: Init
	};

})();
