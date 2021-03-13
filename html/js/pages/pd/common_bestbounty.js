common_bestbounty = (function()
{
	"use strict";

	var GetCheckListFavoriteTabs_DOM = function(checklists, suffix, Tab_ClickHandler)
	{
		var		result = $();

		var		title_row = $("<div>").addClass("row");
		var		title_col = $("<div>").addClass("col-xs-12");

		var		title_ul = $("<ul>").addClass("nav nav-tabs");
		var		tab_content = $("<div>").addClass("tab-content");
		var		checklists = checklists.sort(function(a, b) 
													{
														return (a.title == b.title ?  0 : 
																a.title <  b.title ? -1 : 1); 
													});

		title_row.append(title_col);
		title_col
			.append(title_ul)
			.append(tab_content);


		for(var i = 0; i < checklists.length; ++i)
		{
			var		checklist		= checklists[i];
			var		id				= checklist.id;
			var		title_href		= $("<a>").addClass("__tab_href" + suffix + " _tab_order_" + i).append(checklist.title);
			var		title_li		= $("<li>").addClass("nav nav-tabs").append(title_href);
			var		tab_panel		= $("<div>").addClass("tab-pane fade __tab_pane" + suffix + "");

			title_href
				.attr("data-toggle", "tab")
				.attr("data-id", id)
				.attr("href", "#__tab_pane" + suffix + "_" + id);

			title_li
				.attr("data-id", id)
				.attr("data-target_elem_class", "__tab_pane" + suffix)
				.on("click", Tab_ClickHandler);

			title_ul
				.append(title_li);

			tab_panel
				.attr("id", "__tab_pane" + suffix + "_" + id)
				.attr("data-id", id);
				// .append(Math.random());

			tab_content
				.append(tab_panel);
		}

		result = result.add(title_row);

		return result;
	};

	return {
		GetCheckListFavoriteTabs_DOM:GetCheckListFavoriteTabs_DOM,
	};
}
)();

