/* jslint devel: true, indent: 4, maxerr: 50, esversion: 6*/
/* exported helpdesk_ticket_list_obj */
/* global helpdesk_ticket_list_obj:off */

var	helpdesk_ticket_obj = function()
{
	"use strict";

	var	DATE_FORMAT_GLOBAL = "DD MMMM YYYY HH:mm:ss";
	var	MOBILE_DATE_FORMAT_GLOBAL = "DD MMMM";
	var	ATTACH_PREFIX = "/helpdesk_ticket_attaches/";
	var	form_type_global = {};
	var	SLA_S1 = 2 * 3600;

	var	Init = function()
	{
	};

	var	FormType = function(form_type)
	{
		if(form_type == "open")
		{
			form_type_global.action					= "open";
			form_type_global.submit_action			= "AJAX_openCase";
			form_type_global.success_callback		= RedirectToViewCase;
			form_type_global.severity_hidden_show	= "";
			form_type_global.title_hidden_show		= "";
		}
		else if(form_type == "edit")
		{
			form_type_global.action					= "edit";
			form_type_global.submit_action			= "AJAX_updateCase";
			form_type_global.severity_hidden_show	= " style=\"display: none;\" ";
			form_type_global.title_hidden_show		= " style=\"display: none;\" ";
		}
		else
		{
			console.error("ERROR: unknown form_type");
		}
	};

	var	SetSuccessCallback = function(func)
	{
		form_type_global.success_callback = func;
	};

	var	Main_GetDOM = function(ticket)
	{
		var		result = $();

		result = result.add(
"	  <div class=\"row form-group\" id=\"severity_row\" " + (form_type_global.severity_hidden_show) + ">" +
"		<div class=\"col-xs-12 col-md-3\">"+
"		  <label>"+
"			<input type=\"radio\" name=\"severity\" id=\"severity_1\" value=\"1\">"+
"			Экстренная помощь (S1)"+
"		  </label>"+
"		</div>"+
"		<div class=\"col-xs-12 col-md-3\">"+
"		  <label>"+
"			<input type=\"radio\" name=\"severity\" id=\"severity_2\" value=\"2\">"+
"			Решение проблемы (S2)"+
"		  </label>"+
"		</div>"+
"		<div class=\"col-xs-12 col-md-3\">"+
"		  <label>"+
"			<input type=\"radio\" name=\"severity\" id=\"severity_3\" value=\"3\">"+
"			Вопрос специалисту (S3)"+
"		  </label>"+
"		</div>"+
"		<div class=\"col-xs-12 col-md-3\">"+
"		  <label>"+
"			<input type=\"radio\" name=\"severity\" id=\"severity_4\" value=\"4\">"+
"			Запрос на доп фунционал (S4)"+
"		  </label>"+
"		</div>"+
"	  </div>"+
"	  <div class=\"row form-group\" " + (form_type_global.title_hidden_show) + ">"+
"		<div class=\"col-xs-12\">"+
"		  <input maxlength=\"256\" id=\"title\" class=\"transparent form-control\" placeholder=\"Краткое описание\">"+
"		  <label></label>"+
"		</div>"+
"	  </div>"+
"	  <div class=\"row form-group\">"+
"		<div class=\"col-xs-12\">"+
"		  <textarea id=\"description\" class=\"transparent form-control\" placeholder=\"Полное описание (ссылка на страницу, последовательность действий, сообщение об ошибке и т.д.).\" rows=\"10\"></textarea>"+
"		  <input type=\"hidden\" id=\"ticket_id\">"+
"		</div>"+
"	  </div>"
		);

		if(ticket && (typeof(ticket.id) != "undefined"))
		{
			result.find("#ticket_id").val(ticket.id);
		}

		if(ticket && (typeof(ticket.title) != "undefined"))
		{
			result.find("#title").val(ticket.title);
		}

		if((typeof(ticket) != "undefined") && (typeof(ticket.history) != "undefined") && ticket.history[ticket.history.length - 1] && (typeof(ticket.history[ticket.history.length - 1].severity) != "undefined"))
		{
			result.find("#severity_" + ticket.history[ticket.history.length - 1].severity).prop("checked", true);
		}
		else
		{
			result.find("#severity_3").prop("checked", true);
		}

		return result;
	};

	var	CloseCase_ClickHandler = function()
	{
		var	curr_tag = $(this);

		if(isValid(curr_tag))
		{
			$("#CloseTicketModal").modal("show");
		}
	};

	var	ControlButtons_GetDOM = function()
	{
		var	result = $();

		if(form_type_global.action == "edit")
		{
			let row_1 = $("<div>").addClass("row form-group");
			var col_11 = $("<div>").addClass("col-xs-6 col-md-2 col-md-offset-8");
			var button_11 = $("<button>")
							.addClass("btn btn-primary form-control")
							.attr("data-action", form_type_global.submit_action)
							.append("Добавить запись")
							.on("click", Submit_ClickHandler);

			var col_12 = $("<div>").addClass("col-xs-6 col-md-2");
			var button_12 = $("<button>")
							.addClass("btn btn-primary form-control")
							.attr("data-action", "AJAX_closeCase")
							.append("Закрыть кейс")
							.on("click", CloseCase_ClickHandler);

			var row_2 = $("<div>").addClass("row form-group show_to_helpdesk");
			var col_21 = $("<div>").addClass("col-xs-6 col-md-2");
			var button_21 = $("<button>")
							.addClass("btn btn-primary form-control")
							.attr("data-action", "AJAX_closeCase")
							.append("Изменить приоритет")
							.on("click", function() { $("#severity_row").toggle(200); });
			var col_22 = $("<div>").addClass("col-xs-6 col-md-2");
			var button_22 = $("<button>")
							.addClass("btn btn-primary form-control")
							.attr("data-action", "AJAX_monitoringCase")
							.append("Monitoring state")
							.on("click", Submit_ClickHandler);
			var col_23 = $("<div>").addClass("col-xs-6 col-md-2");
			var button_23 = $("<button>")
							.addClass("btn btn-success form-control")
							.attr("data-action", "AJAX_solutionProvidedCase")
							.append("Решение")
							.on("click", Submit_ClickHandler);
			var col_24 = $("<div>").addClass("col-xs-6 col-md-2");
			var button_24 = $("<button>")
							.addClass("btn btn-primary form-control")
							.attr("data-action", "AJAX_closePendingCase")
							.append("Ожидание Закрытия")
							.on("click", Submit_ClickHandler);
			var row_3 = $("<div>").addClass("row form-group show_to_helpdesk");
			var col_31 = $("<div>").addClass("col-xs-6 col-md-2");
			var button_31 = $("<button>")
							.addClass("btn btn-default form-control")
							.attr("data-action", "AJAX_closePendingCase")
							.append("Welcome message")
							.on("click", Prefill_WelcomeMessage);

			var col_32 = $("<div>").addClass("col-xs-6 col-md-2");
			var button_32 = $("<button>")
							.addClass("btn btn-default form-control")
							.attr("data-action", "AJAX_closePendingCase")
							.append("1-st attempt")
							.on("click", Prefill_1stAttempt);

			var col_33 = $("<div>").addClass("col-xs-6 col-md-2");
			var button_33 = $("<button>")
							.addClass("btn btn-default form-control")
							.attr("data-action", "AJAX_closePendingCase")
							.append("2-nd attempt")
							.on("click", Prefill_2ndAttempt);

			var col_34 = $("<div>").addClass("col-xs-6 col-md-2");
			var button_34 = $("<button>")
							.addClass("btn btn-default form-control")
							.attr("data-action", "AJAX_closePendingCase")
							.append("3-rd attempt")
							.on("click", Prefill_3rdAttempt);

			var col_35 = $("<div>").addClass("col-xs-6 col-md-2");
			var button_35 = $("<button>")
							.addClass("btn btn-default form-control")
							.attr("data-action", "AJAX_closePendingCase")
							.append("close pending")
							.on("click", Prefill_ClosePending);

			var col_36 = $("<div>").addClass("col-xs-6 col-md-2");
			var button_36 = $("<button>")
							.addClass("btn btn-default form-control")
							.attr("data-action", "AJAX_closePendingCase")
							.append("Thank you")
							.on("click", Prefill_Thankyou);

			var row_9 = $("<div>").addClass("row form-group");
			var col_91 = $("<div>")
							.addClass("col-xs-12")
							.append(
"	<div class=\"modal fade\" id=\"CloseTicketModal\" tabindex=\"-1\" role=\"dialog\">" +
"	  <div class=\"modal-dialog modal-md\" role=\"document\">" +
"	  <div class=\"modal-content\">" +
"		<div class=\"modal-header\">" +
"		<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>" +
"		<h4 class=\"modal-title\">Закрытие кейса</h4>" +
"		</div>" +
"		<div class=\"modal-body\">" +
"		  <div class=\"row\">" +
"			<div class=\"col-xs-12 description\">" +
"			  Вы уверены, что хотите закрыть кейс ?" +
"			</div>" +
"		  </div>" +
"		</div>" +
"		<div class=\"modal-footer\">"+
"		  <button type=\"button\" class=\"btn btn-primary submit\" data-action=\"AJAX_closeCase\">Закрыть кейс</button>" +
"		  <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Отмена</button>" +
"		</div>" +
"	  </div>" +
"	  </div>" +
"	</div>"
								);

			col_91.find("button.submit").on("click", function() 
													{
														var	context = this;
														$("#CloseTicketModal").modal("hide");
														setTimeout(function() { Submit_ClickHandler.bind(context)(); }, 300); 
													});
			// col_31.find("button.submit").on("click", Submit_ClickHandler);

			result = result
						.add(
							row_1
								.append(col_11.append(button_11))
								.append(col_12.append(button_12))
							)
						.add(
							row_2
								.append(col_21.append(button_21))
								.append(col_22.append(button_22))
								.append(col_23.append(button_23))
								.append(col_24.append(button_24))
							)
						.add(
							row_3
								.append(col_31.append(button_31))
								.append(col_32.append(button_32))
								.append(col_33.append(button_33))
								.append(col_34.append(button_34))
								.append(col_35.append(button_35))
								.append(col_36.append(button_36))
							)
						.add(
							row_9
								.append(col_91)
							);
		}
		else if(form_type_global.action == "open")
		{
			let row_1 = $("<div>").addClass("row form-group");
			var col_1 = $("<div>").addClass("col-xs-6 col-md-2 col-md-offset-10");
			var button_1 = $("<button>")
							.addClass("btn btn-primary form-control")
							.attr("data-action", form_type_global.submit_action)
							.append("Открыть")
							.on("click", Submit_ClickHandler);

			result = result.add(
								row_1
									.append(col_1.append(button_1))
								);
		}
		else
		{
			console.error("unknown form_type_global.action (" + form_type_global.action + ")");
		}


		return result;
	};

	var	GetCaseOpenerHiMessage = function()
	{
		return "Здравствуйте " + $("#case_opener .first_name").text() + ",\n\n";
	};

	var	GetWorkingHoursMessage = function()
	{
		return "\n\nЦентр поддержки работает по рабочим дням с 12:00 до 21:00 по Московскому времени.";
	};


	var	Prefill_WelcomeMessage = function()
	{
		var	result = GetCaseOpenerHiMessage() +
					"Спасибо за то, что обратились в центр поддержки.\n\n" +
					"Меня зовут " + $("#myFirstName").text() + " " + $("#myLastName").text() + ". " +
					"Я буду помогать вам в решении сервисного запроса №" + $("#case_id").text() + " \"" + $("#case_title").val() + "\".\n" + 
					GetWorkingHoursMessage();

		$("#description").val(result);

		return result;
	};

	var	Prefill_1stAttempt = function()
	{
		var	result = GetCaseOpenerHiMessage() +
					"Удалось-ли Вам применить какой-либо из описанных методов в кейсе ?\nЕсли что-то вызвало затруднения я буду рад помочь предоставив допольнительную информацию по запросу." +
					GetWorkingHoursMessage();

		$("#description").val(result);

		return result;
	};

	var	Prefill_2ndAttempt = function()
	{
		var	result = GetCaseOpenerHiMessage() +
					"2-ая попытка получить прогресс по работе над кейсом.\n" +
					"Удалось-ли Вам применить какой-либо из описанных методов в кейсе ?" +
					GetWorkingHoursMessage();

		$("#description").val(result);

		return result;
	};

	var	Prefill_3rdAttempt = function()
	{
		var	result = GetCaseOpenerHiMessage() +
					"3-ья попытка получить прогресс по работе над кейсом.\n" +
					"Удалось-ли Вам применить какой-либо из описанных методов в кейсе ?\n" +
					"В случае неответа через два дня будет инциирована процедура автозакрытия кейса.\n" +
					GetWorkingHoursMessage();

		$("#description").val(result);

		return result;
	};

	var	Prefill_ClosePending = function()
	{
		var	result = GetCaseOpenerHiMessage() +
					"Я переведу кейс в состояние \"ожидание закрытия\", он автоматически закроется через два дня если не будет обновлений." +
					"Если-же Вы решите продолжить работу по кейсу, переоткройте его добавив записи.\n" +
					GetWorkingHoursMessage();

		$("#description").val(result);

		return result;
	};

	var	Prefill_Thankyou = function()
	{
		var	result = GetCaseOpenerHiMessage() +
					"Спасибо, что обратились в центр поддержки, мне было приятно работать с Вами над решением проблемы \"" + $("#case_title").val() + "\".\n" +
					"С Вашего разрешения я закрываю кейс.\n" +
					"Если Вам понадобится доп. информацию по этой проблеме, Вы можете продолжить работу в рамках данного кейса с помощью кнопки добавления записи.\n" +
					"\nХорошего дня !";

		$("#description").val(result);

		return result;
	};

	var	GetDOM = function(ticket, latest_history)
	{
		var	result = $();

		return result
					.add(Main_GetDOM(ticket, latest_history))
					.add(FileAttaches_GetDOM())
					.add(ControlButtons_GetDOM());
	};

	var	FileAttaches_GetDOM = function()
	{
		var	result		= $();

		var	button_row	= $("<div>").addClass("row");
		var	button_col	= $("<div>").addClass("col-xs-12");
		var	button_tag	= $("<input>")
									.attr("type", "file")
									.css("color", "rgb(0,0,0,0)")
									.append("Добавить фаил")
									.attr("multiple", "")
									.on("change", File_LoadHandler);

		var	area_row	= $("<div>").addClass("row");
		var	area_col	= $("<div>").addClass("col-xs-12 single_block")
									.attr("id", "file_storage");


		button_row	.append(button_col.append(button_tag));
		area_row	.append(area_col.append());

		result = result
					.add(button_row)
					.add(area_row);

		return result;
	};

	var	File_LoadHandler = function()
	{
		var		curr_tag		= $(this);
		var		files			= curr_tag[0].files;
		var		file_storage	= $("#file_storage");
		var		file;
		var		remove_button;
		var		badge;

		for (var i = files.length - 1; i >= 0; i--) 
		{
			file				= files[i];
			remove_button		= $("<span>")
									.addClass("fa fa-times-circle padding_close cursor_pointer")
									.on("click", RemoveParent);
			badge				= $("<span>")
									.attr("data-type", "upload_file")
									.addClass("label label-default")
									.data("original-file", file)
									.append(system_calls.CutLongMessages(file.name, 20))
									.append("&nbsp;&nbsp;&nbsp;")
									.append(remove_button);

			file_storage
						.append(badge)
						.append(" ");

			console.debug(file.name +  " (" + Math.ceil(file.size / 1024) + " Kbytes)");
		}

	};

	var	RemoveParent = function()
	{
		$(this).parent().hide(200);
		setTimeout(function() { $(this).parent().remove(); }, 500);
	};

	var	GetFiles = function()
	{
		var		tags	= $("[data-type=\"upload_file\"]");
		var		files	= [];

		tags.each(function() { files.push($(this).data("originalFile")); });

		return files;
	};

	var	isValid = function(curr_tag)
	{
		var result		= true;
		var	title		= $("#title");
		var	description	= $("#description");

		if(title.val().length)
		{
			if(description.val().length)
			{
				// --- good to go
			}
			else
			{
				system_calls.PopoverError(description, "Заполните описание");
				system_calls.PopoverError(curr_tag, "Заполните описание");
				result = false;
			}
		}
		else
		{
			system_calls.PopoverError(title, "Заполните краткое описание");
			system_calls.PopoverError(curr_tag, "Заполните краткое описание");
			result = false;
		}

		return result;
	};

	var SubmitCase = function(curr_tag)
	{
		var	severity	= $("input[name=\"severity\"]:checked");
		var	id			= $("#ticket_id");
		var	title		= $("#title");
		var	description	= $("#description");
		var	submit		= curr_tag;
		var	form_data	= new FormData();
		var	files		= GetFiles();

		curr_tag.button("loading");

		form_data.append("action",		submit.attr("data-action"));
		form_data.append("id",			id.val());
		form_data.append("severity", 	severity.val());
		form_data.append("title",		title.val());
		form_data.append("description",	description.val());

		files.forEach(function(file, idx)
		{
			form_data.append("user_file_" + idx, file);
		});

		$.ajax({
				url: "/cgi-bin/helpdesk.cgi",
				cache: false,
				contentType: false,
				processData: false,
				async: true,
				data: form_data,
				type: "post",
				success: function(raw_data)
				{
					var		data = (
									function(raw)
									{
										try
										{
											return JSON.parse(raw);
										}
										catch(e)
										{
											return false;
										}
									})(raw_data);

					if(data)
					{
						curr_tag.button("reset");

						if(data.result == "success")
						{

							if(typeof(form_type_global.success_callback) == "function")
							{
								form_type_global.success_callback(data.tickets[0].id);
							}
							else
							{
								console.error("success_callback not defined");
							}
							$("#CloseTicketModal").modal("hide");
						}
						else
						{
							system_calls.PopoverInfo(curr_tag, data.description);
						}
					}
					else
					{
						system_calls.PopoverInfo(curr_tag, "Ошибка ответа сервера");
					}
				},
				error: function()
				{
					curr_tag.button("reset");
					system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
				}
			});
	};

	var	RedirectToViewCase = function(case_id)
	{
		window.location.replace("/cgi-bin/helpdesk.cgi?action=view_case_template&case_id=" + case_id + "&rand=" + Math.random() * 8765434567890);
	};

	var	Submit_ClickHandler = function()
	{
		var curr_tag = $(this);

		if(isValid(curr_tag))
		{
			SubmitCase(curr_tag);
		}
	};

	var	Files_GetDOM = function(history_item)
	{
		var		result = $();
		var		file_list = "";

		history_item.files.forEach(function(file)
		{
			var		name_ext			= file.filename.substring(file.filename.lastIndexOf("/") + 1);
			var		ext_idx				= name_ext.lastIndexOf(".");
			var		ext					= (ext_idx > 0 ? name_ext.substring(ext_idx) : "");
			var		name_with_suffix	= (ext_idx > 0 ? name_ext.substring(0, ext_idx) : name_ext);
			var		suffix_idx			= name_with_suffix.lastIndexOf("_");
			var		name				= (suffix_idx > 0 ? name_with_suffix.substring(0, suffix_idx) : name_with_suffix);
			var		display_name		= name + ext;

			file_list += "<span class=\"label label-default\"><a href=\"" + ATTACH_PREFIX + file.filename + "\">" + display_name.substring(0, 32) + "</a></span> ";

		});

		if(file_list.length)
		{
			result = result
						.add("<div class=\"row\"><div class=\"col-xs-12\"><hr></div></div>")
						.add("<div class=\"row\"><div class=\"col-xs-12\">" + file_list + "</div></div>");
		}
		else
		{
			// -- filelist is empty
		}

		return result;
	};

	var	TicketHistoryItem_GetDOM = function(history_item)
	{
			var		result				= $();
			var		container			= $("<div>").addClass("container single_block");
			var		status_row			= $("<div>").addClass("row form-group");
			var		status_col			= $("<div>").addClass("col-xs-12");
			var		user_row			= $("<div>").addClass("row form-group");
			var		user_avatar_col		= $("<div>").addClass("col-xs-2 col-md-1");
			var		canvasAvatar		= $("<canvas/>")
											.attr("data-type", "avatar")
											.attr("data-id", history_item.id)
											.attr("width", "30")
											.attr("height", "30");
										// .addClass('canvas-big-avatar')
			var		user_name_col		= $("<div>").addClass("col-xs-5 col-md-8");
			var		timestamp_col		= $("<div>").addClass("col-xs-5 col-md-3");
			var		user				= history_item.users[0];
			var		description_row		= $("<div>").addClass("row");
			var		description_col		= $("<div>").addClass("col-xs-12");

			var		status_text			= $();

			if(history_item.state == "severity_changed")	status_text = status_text.add($("<span>").append("Изменен приоритет кейса ")).add(GetSeverityBadge(history_item)).add($("<span>").append("<hr>"));
			if(history_item.state == "assigned")			status_text = status_text.add($("<span>").append("Кейс взят в работу ")).add($("<span>").append("<hr>"));
			if(history_item.state == "closed")				status_text = status_text.add($("<div>").addClass("alert alert-default").append("Кейс закрыт")).add($("<hr>"));
			if(history_item.state == "close_pending")		status_text = status_text.add($("<span>").append("Ожидание Закрытия<hr>"));
			if(history_item.state == "monitoring")			status_text = status_text.add($("<span>").append("Monitoring<hr>"));
			if(history_item.state == "solution_provided")	status_text = status_text.add($("<div>").addClass("alert alert-success").append("Решение")).add($("<hr>"));

			status_row
				.append(status_col.append(status_text));

			user_row
				.append(user_avatar_col	.append(canvasAvatar))
				.append(user_name_col	.append((user.name + " " + user.nameLast)))
				.append(timestamp_col	.append($("<span>").addClass("float_right").append(system_calls.GetFormattedDateFromSeconds(history_item.eventTimestamp, DATE_FORMAT_GLOBAL))));

			description_row
				.append(description_col	.append(history_item.description));

			container
				.append(status_row)
				.append(user_row)
				.append(description_row)
				.append(Files_GetDOM(history_item));


			DrawUserAvatar(canvasAvatar[0].getContext("2d"), user.avatar, user.name, user.nameLast);

			result = result.add(container);

			return result;
		};

	var	TicketHistory_GetDOM = function(ticket)
	{
		var	result = $();

		ticket.history.forEach(function(history_item)
		{
			result = result.add(TicketHistoryItem_GetDOM(history_item));
		});

		return result;
	};

	var	CollapsedInfo_GetDOM = function(ticket)
	{
		var		result = $();

		FormType("edit");

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

		var		ticket_row = $("<div>").addClass("row");
		var		severity_div = $("<div>").addClass("col-xs-2 col-md-1");
		var		status_div = $("<div>").addClass("col-xs-4 col-md-2");
		var		number_div = $("<div>").addClass("col-xs-2 col-md-1");
		var		title_div = $("<div>").addClass("col-xs-12 col-md-3");
		var		dates_div = $("<div>").addClass("hidden-xs hidden-sm  col-md-3");
		var		mobile_dates_div = $("<div>").addClass("col-xs-4 hidden-md hidden-lg");
		var		company_name_div = $("<div>").addClass("hidden-xs hidden-sm col-md-2");
		var		file_div = $("<div>").addClass("col-xs-2 col-md-1");
		var		ticket_number =  $("<span>")
							.addClass("link ticket_number")
							.append(ticket.id)
							.attr("id", "__ticket_title_span_" + ticket.id)
							.attr("data-toggle", "collapse")
							.attr("data-target", "#collapsible_ticket_" + ticket.id);

		var		title =  $("<span>")
							.addClass("link ticket_title")
							.append(ticket.title)
							.attr("id", "__ticket_title_span_" + ticket.id)
							.attr("data-toggle", "collapse")
							.attr("data-target", "#collapsible_ticket_" + ticket.id);

		var		ticket_dates_mobile =  $("<span>")
							.addClass("link ticket_title float_right")
							.append("" + system_calls.GetFormattedDateFromSeconds(ticket.history[ticket.history.length - 1].eventTimestamp, MOBILE_DATE_FORMAT_GLOBAL))
							.attr("id", "__ticket_dates_mobile_span_" + ticket.id)
							.attr("data-toggle", "collapse")
							.attr("data-target", "#collapsible_ticket_" + ticket.id);

		var		ticket_dates =  $("<span>")
							.addClass("link ticket_title float_right")
							.append("" + system_calls.GetFormattedDateFromSeconds(ticket.history[ticket.history.length - 1].eventTimestamp, DATE_FORMAT_GLOBAL))
							.attr("id", "__ticket_dates_span_" + ticket.id)
							.attr("data-toggle", "collapse")
							.attr("data-target", "#collapsible_ticket_" + ticket.id);

		var		company_name =  $("<span>")
							.addClass("link ticket_title")
							.append(FindLastHelpdeskResponder(ticket))
							.attr("id", "__ticket_company_name_span_" + ticket.id)
							.attr("data-toggle", "collapse")
							.attr("data-target", "#collapsible_ticket_" + ticket.id);

		var		collapsible_div = $("<div>").addClass("collapse out ticket")
											.attr("id", "collapsible_ticket_" + ticket.id)
											// .on("show.bs.collapse", SoWOpen_ShowHandler)
											.attr("data-ticket_id", ticket.id);
		var		top_shadow_div = $("<div>").addClass("row collapse-top-shadow margin_bottom_20")
											.append("<p></p>");
		var		bottom_shadow_div = $("<div>").addClass("row collapse-bottom-shadow margin_top_20")
											.append("<p></p>");

		var		control_buttons_row = $("<div>").addClass("row form-group");
		var		control_buttons_col = $("<div>").addClass("col-xs-4 col-md-1");
		var		control_buttons_edit = $("<a>")
												.attr("data-ticket_id", ticket.id)
												.attr("href", "/cgi-bin/helpdesk.cgi?action=view_case_template&case_id=" + ticket.id + "&rand=" + Math.random() * 6543234567890)
												.addClass("btn btn-primary form-control")
												// .on("click", SoWEdit_ClickHandler)
												.append("<i class=\"fa fa-pencil-square-o\" aria-hidden=\"true\"></i>");


		// --- status label
		status_div.append(GetStatusBadge(ticket));
		severity_div.append(GetSeverityBadge(ticket.history[ticket.history.length - 1]));
		number_div.append(ticket_number);

		control_buttons_col.append(control_buttons_edit);

		collapsible_div
			.append(top_shadow_div)
			.append(control_buttons_row.append(control_buttons_col))
			.append(TicketHistoryItem_GetDOM(ticket.history[ticket.history.length - 1]))
			.append(bottom_shadow_div);

		title_div
			.append(title);
		company_name_div
			.append(company_name);
		dates_div
			.append(ticket_dates);
		mobile_dates_div
			.append(ticket_dates_mobile);


/*					result = result.add(status_div);
		result = result.add(title_div);
*/
		ticket_row.append(number_div).append(severity_div).append(status_div).append(mobile_dates_div).append(company_name_div).append(title_div).append(dates_div).append(file_div);

		result = result
					.add(ticket_row)
					.add(collapsible_div);

		return result;
	};

	var	FindLastHelpdeskResponder = function(ticket)
	{
		var	result = "";
		var	history;

		for (var i = ticket.history.length - 1; i >= 0; i--) {
			history = ticket.history[i];

			if(history.users[0].userType == "helpdesk")
			{
				result =  history.users[0].name + " " + history.users[0].nameLast;
				break;
			}
		}

		return result;
	};

	var	GetStatusBadge = function(ticket)
	{
		return ticket.history[ticket.history.length - 1].state;
	};

	var	GetSeverityBadge = function(ticket_history_item)
	{
		var	severity = ticket_history_item.severity;
		var result = $("<span>").addClass("label")
							.attr("data-toggle", "tooltip")
							.attr("data-placement", "top")
							.attr("title", "")
							.append("S" + severity);

		if(severity == 1) result.addClass("label-danger");
		if(severity == 2) result.addClass("label-warning");
		if(severity == 3) result.addClass("label-primary");
		if(severity == 4) result.addClass("label-default");

		result.tooltip({ animation: "animated bounceIn"});

		return result;
	};

	var	GetSLABadge = function(ticket)
	{
		var	result = $();

		// --- timestamp since last ticket update
		if((ticket.history[ticket.history.length - 1].severity == "1") && (ticket.history[ticket.history.length - 1].severity != "closed"))
		{
			var	now = new Date();
			var	curr_sla_waiting = SLA_S1 - (now.getTime() / 1000 - parseInt(ticket.history[ticket.history.length - 1].eventTimestamp));
			var	status = "";
			var	title = "";
			var	icon = "";

			if((ticket.history[ticket.history.length - 1].users[0].userType != "helpdesk"))
			{
				icon = "<i class=\"fa fa-bolt\" aria-hidden=\"true\"></i>";

				if(curr_sla_waiting <= 0)
				{
					status = "label-danger";
					title = "Необходимо было ответить " + Math.abs(Math.round(curr_sla_waiting / 60)) + " мин. назад";
				}
				else if(curr_sla_waiting < (SLA_S1 / 2))
				{
					status = "label-warning";
					title = "Необходимо ответить в течение " + Math.round(curr_sla_waiting / 60) + " мин.";
				}
				else
				{
					status = "label-primary";
					title = "Необходимо ответить в течение " + Math.round(curr_sla_waiting / 60) + " мин.";
				}
			}
			else
			{

				if(curr_sla_waiting <= 0)
				{
					status = "label-primary";
					title = "Более " +  Math.round(SLA_S1 / 60) + " мин. ожидания ответа. Можно снизить приоритет.";
					icon = "<i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i>";

				}
			}

			result = $("<span>")
						.addClass("label")
						.addClass(status)
						.attr("data-toggle", "tooltip")
						.attr("data-placement", "top")
						.attr("title", title)
						.append(icon);

			result.tooltip({ animation: "animated bounceIn"});
		}

		return result;
	};

	return {
		Init: Init,
		GetDOM: GetDOM,
		GetFiles: GetFiles,
		FormType: FormType,
		SetSuccessCallback: SetSuccessCallback,
		CollapsedInfo_GetDOM: CollapsedInfo_GetDOM,
		TicketHistory_GetDOM: TicketHistory_GetDOM,
		GetSeverityBadge: GetSeverityBadge,
		GetStatusBadge: GetStatusBadge,
		GetSLABadge: GetSLABadge,
	};

};


var helpdesk_ticket_list_obj = function()
{
	"use strict";

	var	data_global;

	var	Init = function()
	{
	};

	var	SetCaseList = function(case_list)
	{
		data_global = case_list;
	};

	var	GetDOM = function()
	{
		var	result	= $();
		var	obj		= new helpdesk_ticket_obj();

		data_global.forEach(function(ticket)
		{
			result = result.add(obj.CollapsedInfo_GetDOM(ticket));
		});

		return result;
	};

	return {
		Init: Init,
		SetCaseList: SetCaseList,
		GetDOM: GetDOM,
	};
};
