/* exported helpdesk_dashboard */

var	helpdesk_dashboard = (function()
{
	"use strict";

	var	data_global;

	var	Init = function()
	{
		$.ajaxSetup({ cache: false });

		if(session_pi.isCookieAndLocalStorageValid())
		{
			GetInitialData();
			}
		else
		{
			window.location.href = "/autologin?rand=" + Math.random() * 1234567890;
		}
	};

	var	GetInitialData = function()
	{
		var		currTag = $("#dashboard");


		$.getJSON(
			"/cgi-bin/helpdesk.cgi",
			{
				"action":"AJAX_getDashboardData",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global = data;

					RenderOpenCases();
					RenderMyCases();
				}
				else
				{
					console.error("AJAX_getDashboardData.done(): ERROR: " + data.description);
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

	var	RenderOpenCases = function()
	{
		var		currTag = $("#open_cases");
		var		new_cases_counter = data_global.new_cases;
		var		active_cases = data_global.active_cases;
		var		new_cases_dom;
		var		open_cases_dom;
		var		separator_dom;
		var		new_dom = $();

		new_cases_dom = $("<strong>")
						.append(new_cases_counter)
						.addClass("h2 cursor_pointer")
						.addClass(new_cases_counter ? "color_red" : "color_green")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", "невзятые кейсы")
						.on("click", function() { window.location.href = "/cgi-bin/helpdesk.cgi?action=cases_list_template&filter=new&rand=" + Math.random() * 35987654678923; });

		new_cases_dom.tooltip({ animation: "animated bounceIn"});

		open_cases_dom = $("<strong>")
						.append(active_cases)
						.addClass("h2 cursor_pointer")
						.addClass("color_green")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", "открытые кейсы")
						.on("click", function() { window.location.href = "/cgi-bin/helpdesk.cgi?action=cases_list_template&filter=open&rand=" + Math.random() * 35987654678923; });

		open_cases_dom.tooltip({ animation: "animated bounceIn"});

		separator_dom = $("<strong>")
						.append(" / ")
						.addClass("h2");

		new_dom = new_dom
					.add(new_cases_dom)
					.add(separator_dom)
					.add(open_cases_dom);

		currTag.empty().append(new_dom);
	};

	var	RenderMyCases = function()
	{
		var		currTag = $("#my_open_cases");
		var		my_active_cases_counter = data_global.my_active_cases;
		var		my_company_pending_cases_counter = data_global.my_company_pending_cases;
		var		my_active_cases_dom;
		var		my_company_pending_cases_dom;
		var		new_dom = $();
		var		separator_dom = $("<strong>")
								.append(" / ")
								.addClass("h2");

		my_active_cases_dom = $("<strong>")
						.append(my_active_cases_counter)
						.addClass("h2 cursor_pointer")
						.addClass("color_green")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", "мои незакрытые кейсы")
						.on("click", function() { window.location.href = "/cgi-bin/helpdesk.cgi?action=cases_list_template&filter=my_open&rand=" + Math.random() * 35987654678923; });

		my_active_cases_dom.tooltip({ animation: "animated bounceIn"});

		my_company_pending_cases_dom = $("<strong>")
						.append(my_company_pending_cases_counter)
						.addClass("h2 cursor_pointer")
						.addClass(my_company_pending_cases_counter ? "color_red" : "color_green")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", "мои кейсы, ожидающие ответа")
						.on("click", function() { window.location.href = "/cgi-bin/helpdesk.cgi?action=cases_list_template&filter=my_open&rand=" + Math.random() * 35987654678923; });

		my_company_pending_cases_dom.tooltip({ animation: "animated bounceIn"});

		new_dom = new_dom
					.add(my_company_pending_cases_dom)
					.add(separator_dom)
					.add(my_active_cases_dom);

		currTag.empty().append(new_dom);
	};

	return {
		Init: Init
	};

})();
