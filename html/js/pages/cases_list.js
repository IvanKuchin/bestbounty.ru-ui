/*jslint devel: true, indent: 4, maxerr: 50, esversion: 6*/

var	cases_list = (function()
{
	'use strict';

	var	data_global;
	var	helpdesk_ticket_list_obj_global;

	var	Init = function()
	{
		GetCasesListFromServer();
	};

	var	GetCasesListFromServer = function(case_id)
	{
		let	curr_tag = $("#cases_list");

		$.getJSON(
			'/cgi-bin/helpdesk.cgi',
			{
				action:			"AJAX_getCasesList",
				filter:			($.urlParam("filter"))
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global = data.tickets;
					helpdesk_ticket_list_obj_global = new helpdesk_ticket_list_obj();

					RenderCaseList(data_global);

				}
				else
				{
					system_calls.PopoverInfo(curr_tag, data.description);
				}
			})
			.fail(function(data)
			{
				system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
			})
			.always(function()
			{
				setTimeout(function()
				{
					// curr_tag.button("reset");
				}, 200);
			});
	};


	var	RenderCaseList = function(case_list)
	{
		helpdesk_ticket_list_obj_global.SetCaseList(case_list);

		$("#cases_list").empty().append(helpdesk_ticket_list_obj_global.GetDOM());
	}

	return {
		Init: Init
	};

})();
