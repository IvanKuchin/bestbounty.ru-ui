
var	events_list = events_list || {};

var	events_list = (function()
{
    "use strict";

	var	JSON_FindEventsList_Autocomplete = [];
	var JSON_MyEventsList;
	var	current_action = "";

	var	Init = function()
	{
		current_action = $("#events_list").data("action");
		if(!current_action.length) current_action = "events_list";

		GetEventsList();

		$("#eventSearchText").on("input", FindEventsOnInputHandler)
								.on("keyup", FindEventsOnKeyupHandler);
		$("#eventSearchButton").on("click", FindEventsFormSubmitHandler);

		$("#newEventButton").on("click", function() {
			window.location.href="/createnewevent?rand=" + system_calls.GetUUID();
		});

		// $("#PossessionAlertModal_Submit").on("click", SendPossessionAlert);
		// $("#PossessionRequestModal_Submit").on("click", SendPossessionRequest);
		// $("#PossessionRequestModal").on("hidden.bs.modal", function() { setTimeout(SendPossessionRequestResult, 100); });
	};

	// --- event button callback function 
	var	EventManagementButtonClickHandler = function(e)
	{
		var		currTag = $(this);
		var		currAction = currTag.data("action");

		if(currAction == "eventProfileEdit")
		{
			window.location.href = "/edit_event?eventid=" + currTag.data("id") + "&rand=" + system_calls.GetUUID();
		}
	};


	var	RenderEventsList = function(arrayEventsList)
	{
		if(arrayEventsList.length === 0)
		{
			// reduce counter
			// --globalPageCounter;
		}
		else
		{
			var		currTimestamp = new Date();

			arrayEventsList.sort(function(a, b) 
				{
					var		result = 0;
					var		startA = parseInt(a.startTimestamp);
					var		startB = parseInt(b.startTimestamp);

					if(startA < startB) result = 1;
					if(startB < startA) result = -1;

					return result;
				});

			arrayEventsList.forEach(function(item, i, arr)
				{
					var		eventContainer = $("<div>")	.addClass("container")
														.append(system_calls.BuildEventSingleBlock(item, i, arr, EventManagementButtonClickHandler));

					if(i && (currTimestamp.getTime()/1000 < parseInt(arrayEventsList[i - 1].startTimestamp)) && (currTimestamp.getTime()/1000 > parseInt(arrayEventsList[i].startTimestamp)))
					{
						$("#events_list").append("<div class=\"container\"><div class=\"row\"><div class=\" col-sm-10 col-xs-12 col-sm-offset-2 col-md-offset-1\"><span class=\"pull-right\">Сегодня " + system_calls.GetFormattedDateFromSeconds(currTimestamp.getTime()/1000, "DD MMMM YYYY") + "</span></div></div></div>");
					}

					$("#events_list").append(eventContainer);
				});
		}
	};

	var	GetEventsList = function () 
	{
		$.getJSON(
			"/cgi-bin/event.cgi",
			{ action:"AJAX_getMyEventsList" })
			.done(function(data) {
						if(data.status == "success")
						{
							JSON_MyEventsList = [];
							data.events.forEach(function(item, i, arr)
								{
									// JSON_MyEventsList.push({id:item.id, login:item.login, name:item.name, nameLast:item.nameLast, currentEmployment:item.currentEmployment, currentCity:item.currentCity, avatar: item.avatar});
									JSON_MyEventsList.push(item);
								});

							$("#events_list").empty();
							RenderEventsList(JSON_MyEventsList);
						}
						else
						{
							console.debug("AJAX_getMyEventsList.done(): ERROR: " + data.description);
						}
				}); // --- getJSON.done()
	};

	var	AJAX_findEventByID = function (event, ui) 
	{
		var	selectedID = ui.item.id;
		var selectedLabel = ui.item.label;

		console.debug("AJAX_findEventByID autocomplete.select: selectedID=" + selectedID + " selectedLabel=" + selectedLabel);

		$.getJSON(
			"/cgi-bin/event.cgi",
			{action:"AJAX_findEventByID", lookForKey:selectedID})
			.done(function(data) {
						if(data.status == "success")
						{
							JSON_MyEventsList = [];
							data.events.forEach(function(item, i, arr)
								{
									// JSON_MyEventsList.push({id:item.id, login:item.login, name:item.name, nameLast:item.nameLast, currentEmployment:item.currentEmployment, currentCity:item.currentCity, avatar: item.avatar});
									JSON_MyEventsList.push(item);
								});

							$("#events_list").empty();
							RenderEventsList(JSON_MyEventsList);
						}
						else
						{
							console.debug("AJAX_findEventByID.done(): ERROR: " + data.description);
						}
				}); // --- getJSON.done()

		console.debug("AJAX_findEventByID autocomplete.select: end");
	};

	var FindEventsOnInputHandler = function() 
	{
		var		inputValue = $(this).val();
		console.debug("FindEventsOnInputHandler: start. input.val() " + $(this).val());

		if(inputValue.length == 3)
		{
			$.getJSON(
				"/cgi-bin/event.cgi",
				{action:"AJAX_getFindEventsListAutocomplete", lookForKey:inputValue})
				.done(function(data) {
						if(data.status == "success")
						{

							JSON_FindEventsList_Autocomplete = [];
							data.events.forEach(function(item, i, arr)
								{
									var	autocompleteLabel;
									var	obj;

									autocompleteLabel = "";

									if((item.title.length > 0))
									{
										if(autocompleteLabel.length > 0) { autocompleteLabel += " "; }
										autocompleteLabel += item.title;
									}

									obj = {id:item.id , label:autocompleteLabel};

									JSON_FindEventsList_Autocomplete.push(obj);
								});

							console.debug("AJAX_getFindEventsListAutocomplete.done(): converted to autocomplete format. Number of elements in array " + JSON_FindEventsList_Autocomplete.length);

							$("#eventSearchText").autocomplete({
								delay : 300,
								source: JSON_FindEventsList_Autocomplete,
								select: AJAX_findEventByID,
								change: function (event, ui) { 
									console.debug ("FindEventsOnInputHandler autocomplete.change: change event handler"); 
								},
								close: function (event, ui) 
								{ 
									console.debug ("FindEventsOnInputHandler autocomplete.close: close event handler"); 
								},
								create: function () {
									console.debug ("FindEventsOnInputHandler autocomplete.create: _create event handler"); 
								},
								_renderMenu: function (ul, items)  // --- requires plugin only
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
							console.debug("AJAX_getFindEventsListAutocomplete.done(): ERROR: " + data.description);
						}
					}); // --- getJSON.done()

		}
		else if(inputValue.length < 3)
		{
			JSON_FindEventsList_Autocomplete = [];
			$("#eventSearchText").autocomplete({
							delay : 300,
							source: JSON_FindEventsList_Autocomplete
						});
		} // --- if(inputValue.length >= 2)
	};


	var FindEventsFormSubmitHandler = function()
	{
		var		inputValue = $("#eventSearchText").val();
		console.debug("FindEventsFormSubmitHandler: start. input.val() [" + inputValue + "]");

		if(inputValue.length >= 3)
		{
			$.getJSON(
				"/cgi-bin/event.cgi",
				{action:"AJAX_getFindEventsList", lookForKey:inputValue})
				.done(function(data) {
						if(data.status == "success")
						{
							$("#events_list").empty();
							RenderEventsList(data.events);
						}
						else
						{
							console.debug("AJAX_getFindEventsList.done(): ERROR: " + data.description);
						}
					}); // --- getJSON.done()

		}
		else
		{
			console.debug("FindEventsFormSubmitHandler: ALARM: search string must be more the 2 symbols [" + inputValue + "]");
			// --- tooltip alert
			$("#eventSearchText").attr("title", "Напишите более 2 букв")
									.attr("data-placement", "top")
									.tooltip("show");
			window.setTimeout(function()
				{
					$("#eventSearchText").tooltip("destroy");
				}
				, 3000);
									// .tooltip('hide');
			// $("#SearchStringError").modal("show");
		}
	};

	var FindEventsOnKeyupHandler = function(event)
	{
		/* Act on the event */
		var	keyPressed = event.keyCode;

		console.debug("FindEventsOnKeyupHandler: start. Pressed key [" + keyPressed + "]");

		if(keyPressed == 13) {
			/*Enter pressed*/
			$("#eventSearchText").autocomplete("close");
			FindEventsFormSubmitHandler();
		}

	};


	return {
		Init: Init,
		EventManagementButtonClickHandler: EventManagementButtonClickHandler
	};

})();
