/*jslint devel: true, indent: 4, maxerr: 50, esversion: 6*/

var	view_case = view_case || {};

var	view_case = (function()
{
	'use strict';

	var	DATE_FORMAT_GLOBAL = "DD MMMM YYYY HH:mm:ss";
	var	data_global;
	var	helpdesk_ticket_obj_global;
	var	user_global;
	var	interval_flag_global = 0;

	var	Init = function()
	{
		helpdesk_ticket_obj_global = new helpdesk_ticket_obj();
		helpdesk_ticket_obj_global.FormType("edit");
		helpdesk_ticket_obj_global.SetSuccessCallback(function() 
														{
															system_calls.PopoverInfo($("button[data-action=\"AJAX_updateCase\"]").parent(), "Готово");
															return GetCaseFromServer(data_global[0].id); 
														});

		GetUserInfoFromServer();
		setInterval(function() 
					{
						SetIntervalFlag();
						GetCaseFromServer($.urlParam("case_id"));
					}, 60000);
	};

	var	SetIntervalFlag		= function() { interval_flag_global = 1; };
	var	ResetIntervalFlag	= function() { interval_flag_global = 0; };
	var	isIntervalFlag		= function() { return interval_flag_global; };

	var	GetCaseFromServer = function(case_id)
	{
		var	curr_tag = $("#case_view");

		$.getJSON(
			'/cgi-bin/helpdesk.cgi',
			{
				action:			"AJAX_getCase",
				id: 			case_id,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global = data.tickets;
					RenderTicket(data_global[0]);

					ShowHideHelpdeskInfo(user_global);
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

	var	GetUserInfoFromServer = function()
	{
		$.getJSON(
			'/cgi-bin/helpdesk.cgi',
			{
				action:	"AJAX_getUserInfo",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					user_global = data.users[0];

					GetCaseFromServer($.urlParam("case_id"));
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

	var	ShowHideHelpdeskInfo = function(user)
	{
		if(user.userType == "helpdesk") $(".show_to_helpdesk").show(200);
	};

	var	RenderTicket = function(ticket)
	{
		var now					= new Date();
		var highest_severity	= Number.POSITIVE_INFINITY;
		var	helpdesk_ticket 	= new helpdesk_ticket_obj();
		var	curr_sla_waiting	= 0;

		ticket.history.sort(function(a, b)
		{
			var 	timeA = parseInt(a.eventTimestamp);
			var		timeB = parseInt(b.eventTimestamp);
			var		result = 0;

			if(timeA == timeB) { result = 0; }
			if(timeA <  timeB) { result = -1; }
			if(timeA >  timeB) { result = 1; }

			return result;
		});


		// --- define the highest severity
		ticket.history.forEach(function(item)
		{
			if(parseInt(item.severity) < highest_severity) highest_severity = helpdesk_ticket.GetSeverityBadge(item);
		});

		$("#case_id")
					.empty()
					.append(ticket.id);
		$("#case_title")
					.val(ticket.title)
					.attr("data-db_value", ticket.title)
					.attr("data-id", ticket.id)
					.on("change", system_calls.UpdateInputFieldOnServer);
		$("#open_date")
					.empty()
					.append(system_calls.GetFormattedDateFromSeconds(ticket.history[0].eventTimestamp, DATE_FORMAT_GLOBAL));
		$("#case_opener")
					.empty()
					.append("<span class=\"first_name\">" + ticket.users[0].name + "</span> <span class=\"last_name\">" + ticket.users[0].nameLast + "</span>");
		$("#current_severity")
					.empty()
					.append(helpdesk_ticket.GetSeverityBadge(ticket.history[ticket.history.length - 1]));
		$("#max_severity")
					.empty()
					.append(highest_severity);
		$("#current_state")
					.empty()
					.append(helpdesk_ticket.GetStatusBadge(ticket));

		$("#last_update")
					.empty()
					.append(system_calls.GetLocalizedDateInHumanFormatSecSince1970(ticket.history[ticket.history.length-1].eventTimestamp));

		$("#sla_badge")
					.empty()
					.append(helpdesk_ticket.GetSLABadge(ticket));

		$("#beyond_sla")
					.empty()
					.append();

		$("#case_view")
					.empty()
					.append(helpdesk_ticket.TicketHistory_GetDOM(ticket));

		// --- update input field only if it called regular flow, 
		if(isIntervalFlag())
		{
			ResetIntervalFlag();
		}
		else
		{
			$("#form_dom").empty().append(helpdesk_ticket_obj_global.GetDOM(ticket, ticket.history[ticket.history.length - 1]));
		}
	};

	return {
		Init: Init
	};

})();
