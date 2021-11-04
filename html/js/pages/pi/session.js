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
			// --- option #1) keep it before "if"
			// ---            if user will close page after local Storage, server will not mark old session for deletion (stuck session)
			// --- option #2) put it after "if"
			// ---            if user will close page after if, server will mark old session for deletion, but client will continue using it
			// ---            this case will log error something like "session has been deleted, but client still wants to use it"
			// --- option #3) inside "if"
			// ---            don't move it inside "if"
			// ---            same as "option #2", but with higher prob, due to local Storage will wait longer for server-reply
			localStorage.setItem("sessid", $.cookie("sessid"));


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

		}

		return	result;
	};

	return {
		isCookieAndLocalStorageValid: isCookieAndLocalStorageValid,
	};
})();
