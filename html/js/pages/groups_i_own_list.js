
var	groups_i_own_list = groups_i_own_list || {};

var	groups_i_own_list = (function()
{
    'use strict';

	var	JSON_FindGroupsList_Autocomplete = [];
	var JSON_MyGroupsList;
	var	current_action = "";

	var	Init = function()
	{
		current_action = $("#groups_i_own_list").data("action");
		if(!current_action.length) current_action = "groups_i_own_list";

		GetGroupsList();


		$("#groupSearchText").on("input", FindGroupsOnInputHandler)
								.on("keyup", FindGroupsOnKeyupHandler);
		$("#groupSearchButton").on("click", FindGroupsFormSubmitHandler);
		$("#newGroupButton").on("click", function() {
			window.location.href="/createnewgroup?rand=" + system_calls.GetUUID();
		});

	};

	// --- group button callback function 
	var	GroupManagementButtonClickHandler = function(e)
	{
		var		currTag = $(this);
		var		currAction = currTag.data("action");

		if(currAction == "groupProfileEdit")
		{
			window.location.href = "/edit_group?groupid=" + currTag.data("id") + "&rand=" + system_calls.GetUUID();
		}
		else if(currAction == "groupProfileTakeOwnership")
		{
			currTag.button("loading");

			$.getJSON(
				'/cgi-bin/group.cgi',
				{ action:"AJAX_groupTakeOwnership", id:currTag.data("id") })
				.done(function(data) {
						if(data.result == "success")
						{
							// $("#groups_i_own_list").empty();
							// RenderGroupsList(data.groups);
							window.location.href = "/edit_group?groupid=" + currTag.data("id") + "&rand=" + system_calls.GetUUID();
						}
						else
						{
							console.debug("AJAX_groupTakeOwnership.done(): ERROR: " + data.description);
						}

						setTimeout(function() {currTag.button("reset"); }, 500); // --- wait for animation
					})
				.fail(function()
					{
						console.debug("AJAX_groupTakeOwnership.done(): ERROR: parsing JSON response form server");

						setTimeout(function() {currTag.button("reset"); }, 500); // --- wait for animation
					}); // --- getJSON.done()

		}
		else if(currAction == "groupProfileRequestOwnership")
		{
			$("#PosessionRequestModal_Submit")	.data("id", currTag.data("id"))
												.data("name", currTag.data("name"));
		}
	}


	var	RenderGroupsList = function(arrayGroupsList)
	{
		if(arrayGroupsList.length == 0)
		{
			// reduce counter
			// --globalPageCounter;

			console.debug("BuildMyNetworkList: reduce page# due to request return empty result");
		}
		else
		{
			arrayGroupsList.forEach(function(item, i, arr)
				{
					$("#groups_i_own_list").append(system_calls.BuildGroupSingleBlock(item, i, arr, GroupManagementButtonClickHandler));
				});
		}
	}

	var	GetGroupsList = function () 
	{
		$.getJSON(
			'/cgi-bin/group.cgi',
			{action:"AJAX_getMyGroupsList"})
			.done(function(data) {
						if(data.status == "success")
						{
							JSON_MyGroupsList = [];
							data.groups.forEach(function(item, i, arr)
								{
									// JSON_MyGroupsList.push({id:item.id, login:item.login, name:item.name, nameLast:item.nameLast, currentEmployment:item.currentEmployment, currentCity:item.currentCity, avatar: item.avatar});
									JSON_MyGroupsList.push(item);
								});

							$("#groups_i_own_list").empty();
							RenderGroupsList(JSON_MyGroupsList);
						}
						else
						{
							console.debug("AJAX_getMyGroupsList.done(): ERROR: " + data.description);
						}
				}); // --- getJSON.done()
	}

	var	AJAX_getFindGroupByID = function (event, ui) 
	{
		var	selectedID = ui.item.id;
		var selectedLabel = ui.item.label;

		console.debug("AJAX_getFindGroupByID autocomplete.select: selet event handler");
		console.debug("AJAX_getFindGroupByID autocomplete.select: seletedID=" + selectedID + " selectedLabel=" + selectedLabel);

		$.getJSON(
			'/cgi-bin/group.cgi',
			{action:"AJAX_getFindGroupByID", lookForKey:selectedID})
			.done(function(data) {
						if(data.status == "success")
						{
							JSON_MyGroupsList = [];
							data.groups.forEach(function(item, i, arr)
								{
									// JSON_MyGroupsList.push({id:item.id, login:item.login, name:item.name, nameLast:item.nameLast, currentEmployment:item.currentEmployment, currentCity:item.currentCity, avatar: item.avatar});
									JSON_MyGroupsList.push(item);
								});

							$("#groups_i_own_list").empty();
							RenderGroupsList(JSON_MyGroupsList);
						}
						else
						{
							console.debug("AJAX_getFindGroupByID.done(): ERROR: " + data.description);
						}
				}); // --- getJSON.done()

		console.debug("AJAX_getFindGroupByID autocomplete.select: end");
	}

	var FindGroupsOnInputHandler = function() 
	{
		var		inputValue = $(this).val();

		if(inputValue.trim().length == 3)
		{
			$.getJSON(
				'/cgi-bin/group.cgi',
				{action:"AJAX_getFindGroupsListAutocomplete", lookForKey:inputValue})
				.done(function(data) {
						if(data.status == "success")
						{

							JSON_FindGroupsList_Autocomplete = [];
							data.groups.forEach(function(item, i, arr)
								{
									var	autocompleteLabel;
									var	obj;

									autocompleteLabel = "";

									if((item.title.length > 0))
									{
										if(autocompleteLabel.length > 0) { autocompleteLabel += " "; };
										autocompleteLabel += item.title;
									}

									obj = {id:item.id , label:autocompleteLabel};

									JSON_FindGroupsList_Autocomplete.push(obj);
								});

							console.debug("AJAX_getFindGroupsListAutocomplete.done(): converted to autocomplete format. Number of elements in array " + JSON_FindGroupsList_Autocomplete.length);

							$("#groupSearchText").autocomplete({
								delay : 300,
								source: JSON_FindGroupsList_Autocomplete,
								select: AJAX_getFindGroupByID,
								minLength: 3,
								change: function (event, ui) { 
									console.debug ("FindGroupsOnInputHandler autocomplete.change: change event handler"); 
								},
								close: function (event, ui) 
								{ 
									console.debug ("FindGroupsOnInputHandler autocomplete.close: close event handler"); 
								},
								create: function () {
									console.debug ("FindGroupsOnInputHandler autocomplete.create: _create event handler"); 
								},
								_renderMenu: function (ul, items)  // --- requres plugin only
								{
									var	that = this;
									currentCategory = "";
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
						}
						else
						{
							console.debug("AJAX_getFindGroupsListAutocomplete.done(): ERROR: " + data.description);
						}
					})
					.fail(function() {
						console.debug("AJAX_getFindGroupsListAutocomplete: ERROR: parse JSON response from server");
					});
		}
	}


	var FindGroupsFormSubmitHandler = function()
	{
		var		inputValue = $("#groupSearchText").val();
		console.debug("FindGroupsFormSubmitHandler: start. input.val() [" + inputValue + "]");

		if(inputValue.length >= 3)
		{
			$.getJSON(
				'/cgi-bin/group.cgi',
				{action:"AJAX_getFindGroupsList", lookForKey:inputValue})
				.done(function(data) {
						if(data.status == "success")
						{
							$("#groups_i_own_list").empty();
							RenderGroupsList(data.groups);
						}
						else
						{
							console.debug("AJAX_getFindGroupsList.done(): ERROR: " + data.description);
						}
					}); // --- getJSON.done()

		}
		else
		{
			console.debug("FindGroupsFormSubmitHandler: ALARM: search string must be more the 2 symbols [" + inputValue + "]");
			// --- tooltip alert
			$("#groupSearchText").attr("title", "Напишите более 2 букв")
									.attr("data-placement", "top")
									.tooltip('show');
			window.setTimeout(function()
				{
					$("#groupSearchText").tooltip('destroy');
				} 
				, 3000);
									// .tooltip('hide');
			// $("#SearchStringError").modal("show");
		}
	}

	var FindGroupsOnKeyupHandler = function(event)
	{
		/* Act on the event */
		var	keyPressed = event.keyCode;

		if(keyPressed == 13) {
			/*Enter pressed*/
			$("#groupSearchText").autocomplete("close");
			FindGroupsFormSubmitHandler();
		}

	}


	return {
		Init: Init
	}

})();
