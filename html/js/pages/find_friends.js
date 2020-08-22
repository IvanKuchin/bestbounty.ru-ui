var	find_friends = find_friends || {};

var find_friends = (function() 
{
	var JSON_FindFriendsList_Autocomplete;
	var JSON_FindFriendsList;

	var Init = function() 
	{
		$.ajaxSetup({ cache: false });

		if(session_pi.isCookieAndLocalStorageValid())
		{
			if($("#friendSearchText").val().length)
				FindFriendsFormSubmitHandler();
			else
				SendRequestAndRefreshList("JSON_getMyNetworkFriendList", "");

			// --- search field
			$("#friendSearchText")	.on("input", FindFriendsOnInputHandler)
									.on("keyup", FindFriendsOnKeyupHandler);
			$("#friendSearchButton").on("click", FindFriendsFormSubmitHandler);
		}
		else
		{
			window.location.href = "/autologin?rand=" + Math.random() * 1234567890;
		}
	};

	var	BuildFoundFriendList = function(arrayFriendList)
	{
		var		tempTag = $();

		if(arrayFriendList.length === 0)
		{
			// reduce counter
			// --globalPageCounter;

			console.debug("BuildFindFriendList: reduce page# due to request return empty result");
		}
		else
		{
			arrayFriendList.forEach(function(item, i, arr)
			{
				tempTag = tempTag.add(system_calls.GlobalBuildFoundFriendSingleBlock(item, i, arr));
			});
		}

		return tempTag;
	};

	var FindFriendsOnInputHandler = function() 
	{
		var		inputValue = $(this).val();
		// console.debug("FindFriendsOnInputHandler: start. input.val() " + $(this).val());

		if(inputValue.length == 3)
		{
			$.getJSON(
				'/cgi-bin/index.cgi',
				{action:"JSON_getFindFriendsListAutocomplete", lookForKey:inputValue})
				.done(function(data) {
						JSON_FindFriendsList_Autocomplete = [];
						data.forEach(function(item, i, arr)
							{
								JSON_FindFriendsList_Autocomplete.push({id:item.id , label:item.name + " " + item.nameLast + " " + item.currentCity});
							});


						$("#friendSearchText").autocomplete({
							delay : 300,
							source: JSON_FindFriendsList_Autocomplete,
							select: JSON_getFindFriendByID_SelectHandler,
							change: function (event, ui) { 
								console.debug ("FindFriendsOnInputHandler autocomplete.change: change event handler"); 
							},
							close: function (event, ui) 
							{ 
								console.debug ("FindFriendsOnInputHandler autocomplete.close: close event handler"); 
							},
							create: function () {
								console.debug ("FindFriendsOnInputHandler autocomplete.create: _create event handler"); 
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
					}); // --- getJSON.done()
		}
		else if(inputValue.length < 3)
		{
			JSON_FindFriendsList_Autocomplete = [];
			$("#friendSearchText").autocomplete({
							delay : 300,
							source: JSON_FindFriendsList_Autocomplete
						});
		} // --- if(inputValue.length >= 2)
	};

	var	SendRequestAndRefreshList = function(action, lookForKey)
	{
		curr_tag = $("#find_friends");

		$.getJSON('/cgi-bin/index.cgi', {action:action, lookForKey:lookForKey})
			.done(function(data) 
			{
				if(data.result == "success")
				{
					JSON_FindFriendsList = data.users;

					$("#find_friends").empty().append(BuildFoundFriendList(JSON_FindFriendsList));
				}
				else
				{
					system_calls.PopoverError(curr_tag, data.description);
				}
			})
			.fail(function(data) 
			{
				system_calls.PopoverError(curr_tag, "server response error");
			});
	};

	var	JSON_getFindFriendByID_SelectHandler = function (event, ui) 
	{
		var	selectedID = ui.item.id;
		var selectedLabel = ui.item.label;

		SendRequestAndRefreshList("JSON_getFindFriendByID", selectedID);
	};

	var	FindFriendsFormSubmitHandler = function()
	{
		var		curr_tag = $("#friendSearchText");
		var		inputValue = curr_tag.val();

		if(inputValue.length >= 3)
			SendRequestAndRefreshList("JSON_getFindFriendsList", inputValue);
		else
		{
			system_calls.PopoverError(curr_tag, "Напишите более 2 букв");
		}
	};

	var	FindFriendsOnKeyupHandler = function(event)
	{
		/* Act on the event */
		var	keyPressed = event.keyCode;

		// console.debug("FindFriendsOnKeyupHandler: start. Pressed key [" + keyPressed + "]");

		if(keyPressed == 13) {
			/*Enter pressed*/
			$("#friendSearchText").autocomplete("close");
			FindFriendsFormSubmitHandler();
		}
	};

	return {
		Init: Init
	};
})();

