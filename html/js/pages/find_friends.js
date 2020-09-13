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
			$("#friendSearchText")	
									// .on("input", FindFriendsOnInputHandler)
									.on("keyup", FindFriendsOnKeyupHandler)
									.autocomplete({
													source: "/cgi-bin/anyrole_1.cgi?action=AJAX_getUserAutocompleteList",
													select: JSON_getFindFriendByID_SelectHandler,
												});

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
		var	keyPressed = event.keyCode;

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

