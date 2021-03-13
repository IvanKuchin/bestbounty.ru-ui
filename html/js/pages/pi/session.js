/* exported session_pi */

session_pi = (function()
{
	"use strict";

	// --- cookie part
	var	isCookieAndLocalStorageValid = function()
	{
		var		curr_tag = $("<body>");
		var		result = true;

		// --- cache scenario 1:
		// --- 1) sign-in to site
		// --- 2) user clear browser cache
		// --- 3) user typed mydomain.ru
		// --- 4) browser cached / and server returned /news_feed
		// --- at this point localStorage.sessid and $.cookie("sessid") is going to be different
		// --- localStorage having preference, therefore redirect it to /autologin
		if(typeof($.cookie("sessid")) == "undefined")
		{
			console.debug("cookie sessid undefined");
			result = false;
		}
		else
		{
			// --- save sessid to persistence storage
			$.getJSON("/cgi-bin/account.cgi", {action:"AJAX_sessionHandshake"})
				.done(function(data)
				{
					if(data.result == "success")
					{
						// --- good2go
					}
					else
					{
						system_calls.PopoverError(curr_tag, data.description);
					}
				})
				.fail(function()
				{
					system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
				});

			// --- don't move it inside AJAX_sessionHandshake
			// --- this will helps to avoid issues when user quickly jump out from this page w/o waiting AJAX response
			// --- at the same time session should not be removed on the server side w/o confirmation
			localStorage.setItem("sessid", $.cookie("sessid"));
		}

		return	result;
	};

	return {
		isCookieAndLocalStorageValid: isCookieAndLocalStorageValid,
	};
})();
