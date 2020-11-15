/* exported email_change */

var email_change = (function()
{
	"use strict";

	var	Init = function()
	{
		EmailChangeTokenActivate();
	};

	var	EmailChangeTokenActivate = function()
	{
		let 	curr_tag = $("#result");

		$.getJSON("/cgi-bin/account.cgi?action=AJAX_activateEmailChangeToken", {token: $.urlParam("token")})
			.done(function(data)
			{
				if(data.result == "success")
				{
					curr_tag
						.empty()
						.append(data.email)
						.append($("<span>").addClass("color_green").append(" подтвержден"));
				}
				else
				{
					system_calls.PopoverError(curr_tag, "ОШИБКА: " + data.description);
				}
			})
			.fail(function() 
			{
				system_calls.PopoverError(curr_tag, "error parse JSON response");
			});
	};

	return {
		Init: Init,
	};

})();
