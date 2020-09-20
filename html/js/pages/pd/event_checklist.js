EventChecklist = function()
{
	'use strict';

	var	ANIMATION_DURATION = 300;
	var data_global;

	var	Init = function()
	{

	};

	var	SetData = function(data_local)
	{
		data_global = data_local;
	};

	var	GetUniqueCategories = function(arr)
	{
		var	categories = arr.items.map(function(item) { return item.category; });
		return categories.filter(function(item, idx, self) { return self.indexOf(item) == idx; } );
	};

	var	UpdateSwitcherTooltip = function(tag)
	{
		var	label_tag = tag.closest(".form-switcher").find("label");
		var	input_tag = tag.closest(".form-switcher").find("input");

		// label_tag.attr("title", input_tag.prop("checked") ? "Сделано" : "Предстоит сделать");

		label_tag
				.tooltip("destroy")
				.attr("title", input_tag.prop("checked") ? "Сделано" : "Предстоит сделать")
				.tooltip({animation: "animated bounceIn", placement: "top"});
		// label_tag
		// 	.tooltip({title: input_tag.prop("checked") ? "Сделано" : "Предстоит сделать"});
	}

	var GetSwitch = function(item)
	{
		var	switcher = $("<div>").addClass("form-switcher")
										.append($("<input>")
											.attr("id", "event_checklist_switch_" + item.id)
											.attr("name", "event_checklist_switch_" + item.id)
											.attr("type", "checkbox")
											.prop("checked", (item.state == "Y" ? "checked" : ""))
											.attr("data-id", item.id)
											.attr("data-db_value", item.state)
											.attr("data-script", "event.cgi")
											.attr("data-action", "AJAX_switchChecklistItem")
											.on("change", system_calls.UpdateInputFieldOnServer)
											.on("change", UpdateCategoryCost_ClickHalndler)
										)
										.append($("<label>")
											.addClass("switcher")
											.attr("id", "label_event_checklist_switch_" + item.id)
											.attr("for", "event_checklist_switch_" + item.id)
											// .attr("title", "123")
											.tooltip({animation: "animated bounceIn", placement: "top"})
										);

		UpdateSwitcherTooltip(switcher);
		return switcher;
	};

	var	GetDOM = function()
	{
		var result 			= $();

		if(data_global)
		{
			var	categories		= GetUniqueCategories(data_global).sort();

			categories.forEach(function(category)
			{
				var	category_wrapper	= $("<div>").addClass("__category_wrapper");
				var	title_wrapper		= $("<div>").addClass("__title_wrapper").appendTo(category_wrapper);
				var	row					= $("<div>").addClass("row").appendTo(title_wrapper);
				var	span_total_cost		= $("<span>").addClass("__total_cost");
				var	span_remaining_cost	= $("<span>").addClass("__remaining_cost");
				var	col_category		= $("<div>")
												.addClass("col-xs-12 h4")
												.append(category + " (итого: ")
												.append(span_total_cost)
												.append(" руб., осталось доплатить: ")
												.append(span_remaining_cost)
												.append(" руб.):")
												.appendTo(row);


				data_global.items.forEach(function(item, idx)
				{

					if(item.category == category)
					{
						var	div_wrappaer	= $("<div>").addClass("__checklist_item_wrapper  highlight_onhover zebra_painting")
						var	row				= $("<div>").addClass("row");
						var	trigger_button	= GetSwitch(item);
						var	remove_button	= $("<span>")
														.addClass("fa fa-times-circle fa-lg padding_close cursor_pointer animate_rotate_onhover")
														.attr("area-hidden", "true")
														.attr("data-id", item.id)
														.attr("data-script", "event.cgi")
														.attr("data-action", "AJAX_deleteChecklistItem")
														.on("click", Remove_ClickHandler);
						var	price			= $("<input>")
														.val(item.price)
														.attr("type", "number")
														.attr("step", "1000")
														.addClass("transparent __price")
														.attr("data-id", item.id)
														.attr("data-db_value", item.price)
														.attr("data-script", "event.cgi")
														.attr("data-action", "AJAX_updateChecklistItemPrice")
														.on("change", system_calls.UpdateInputFieldOnServer)
														.on("change", UpdateCategoryCost_ClickHalndler);
						var	comment			= $("<input>")
														.val(item.comment)
														.addClass("transparent comment")
														.attr("placeholder", "коментарий")
														.attr("data-id", item.id)
														.attr("data-db_value", item.comment)
														.attr("data-script", "event.cgi")
														.attr("data-action", "AJAX_updateChecklistItemComment")
														.on("change", system_calls.UpdateInputFieldOnServer)
														.on("change", UpdateCategoryCost_ClickHalndler);

						var	col_title		= $("<div>").addClass("col-xs-4 col-md-3").append(item.title);
						var	col_price		= $("<div>").addClass("col-xs-4 col-md-1").append(price).append($("<label>"));
						var	col_trigger		= $("<div>").addClass("col-xs-2 col-md-1").append(trigger_button);
						var	col_comment		= $("<div>").addClass("hidden-xs hidden-sm col-md-6").append(comment).append($("<label>"));
						var	col_remove		= $("<div>").addClass("col-xs-2 col-md-1").append(remove_button);

						category_wrapper.append(
								div_wrappaer.append(
									row
										.append(col_title)
										.append(col_price)
										.append(col_trigger)
										.append(col_comment)
										.append(col_remove)
									)
								);
					}



				});

				UpdateCategoryCost_DOM(category_wrapper);
				result = result.add(category_wrapper);
			});
		}

		return result;
	};

	var	CalculateCost = function(dom)
	{
		var	prices			= dom.find(".__price");
		var	total_cost		= 0;
		var	completed_cost	= 0;

		prices.each(function()
		{
			var	price_tag	= $(this);
			var	id			= price_tag.attr("data-id");
			var	switcher	= dom.find("#event_checklist_switch_" + id);
			var	item_price	= parseInt(price_tag.val());

			total_cost += item_price;
			if(switcher.prop("checked")) completed_cost += item_price;
		});

		return {
				total_cost:total_cost,
				completed_cost:completed_cost,
				};
	};

	var	UpdateCategoryCost_DOM = function(dom)
	{
		var	span_total_cost		= dom.find(".__total_cost");
		var	span_remaining_cost	= dom.find(".__remaining_cost");
		var	cost_obj			= CalculateCost(dom.closest(".__category_wrapper"));

		span_total_cost		.empty().append(cost_obj.total_cost);
		span_remaining_cost	.empty().append(cost_obj.total_cost - cost_obj.completed_cost);
	};

	var	UpdateCategoryCost_ClickHalndler = function(e)
	{
		var	curr_tag			= $(this);

		UpdateCategoryCost_DOM(curr_tag.closest(".__category_wrapper"));
		UpdateSwitcherTooltip(curr_tag);
	};

	var	Remove_ClickHandler = function(e)
	{
		var	curr_tag				= $(this);
		var	checklist_item_wrapper	= curr_tag.closest(".__checklist_item_wrapper");
		var	category_wrapper		= curr_tag.closest(".__category_wrapper");

		$.getJSON(
			'/cgi-bin/' + curr_tag.attr("data-script"),
			{
				action: curr_tag.attr("data-action"),
				id: curr_tag.attr("data-id"),
			})
			.done(function(data)
			{

				if(data.result == "success")
				{
					checklist_item_wrapper.hide(ANIMATION_DURATION);
					setTimeout(function(){
						checklist_item_wrapper.remove();
						UpdateCategoryCost_DOM(category_wrapper);
					}, ANIMATION_DURATION);
				}
				else
				{
					system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
				}
			})
			.fail(function(data)
			{
				setTimeout(function() {
					system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
				}, 200);
			});

	};

	var	FavoriteChecklist_GetDOM = function(favorite_checklist_id, checklists, AddItems_ClickHandler)
	{
		var		result			= $();
		var		submit_button;
		var		checklist		= checklists[0];
		var		categories		= GetUniqueCategories(checklist).sort();

		categories.forEach(function(category)
		{
			var		row = $("<div>").addClass("row");
			var		titles = [];

			checklist.items.forEach(function(item)
			{
				if(item.category == category)
				{
					titles.push(item.title);
				}
			});

			result = result
						.add("<div class='col-xs-12'><b>" + category + ":</b> " + titles.join(", ") + "</div>")
						.add(row);
		});


		// --- add submit button
		submit_button = $("<button>")
							.addClass("form-control btn btn-primary __submit")
							.append("Добавить этот список")
							.on("click", AddItems_ClickHandler)
							.attr("data-checklist_id", favorite_checklist_id);

		// --- add some space before button
		result = result
					.add($("<div>").addClass("row form-group"))
					.add(
						$("<div>").addClass("row form-group").append(
							$("<div>").addClass("col-xs-offset-6 col-xs-6 col-md-offset-10 col-md-2").append(submit_button)
						)
					);

		return result;
	};


	return {
		Init: Init,
		SetData: SetData,
		GetDOM: GetDOM,
		FavoriteChecklist_GetDOM: FavoriteChecklist_GetDOM,
	};

};
