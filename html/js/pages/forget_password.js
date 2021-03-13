var	forget_password = forget_password || {};

forget_password = (function()
{
	redirectUrl = "/";

	var Init = function()
	{
		{
			$("#forgetPasswordSubmit").on("click", ForgetPassword);
			$("#EmailSent").on("hidden.bs.modal", RedirectToURL);
		} // --- end of namespace
	};

	var SendEmail = function()
	{
		var		email  = $("#email").val().trim();

		console.debug("SendEmail: start sending email to " + email);
		$("#email").popover("destroy");
		if(email === "")
		{
			console.debug("SendEmail: ERROR: email is empty");
			$("#email").popover({"placement": "top",
								 "content": "Введите адрес куда необходимо выслать инструкцию по восстановлению пароля."})
								.popover("show");
			setTimeout(function ()
				{
					$("#email").popover("destroy");
				}, 3000);
		}
		else
		{
						if((email.indexOf("\"") >= 0) || (email.indexOf("\n") >= 0) || (email.indexOf("\r") >= 0) || (email.indexOf("\t") >= 0) || (email.indexOf("`") >= 0) || (email.indexOf("'") >= 0) || (email.indexOf("<") >= 0) || (email.indexOf(">") >= 0))
						{
							console.debug("SendEmail: ERROR: email contain special symbols");
							PopoverOnChangePasswords("e-mail НЕ должн содержать символы [\"\'\`<>]");
						}
						else
						{
							$.getJSON("/cgi-bin/index.cgi?action=AJAX_forgetPassword", {email: email})
							.done(
								function(data)
								{
									if(data.result == "success")
									{
										// --- Success account blocking
										console.debug("SendEmail: email with password has been sent");
										if(typeof(data.email) != "undefined")
										{
											$("#spanEmail").text(data.email);
										}
										if(typeof(data.url) != "undefined")
										{
											redirectUrl = data.url;
										}
										$("#EmailSent").modal("show");
									}
									else
									{
										// --- Fail to block the account
										console.debug("SendEmail: error in mail sending [" + data.description + "]");
										ResetForm();
										$("#email").popover({"placement": "top",
															 "content": data.description})
															.popover("show");
										setTimeout(function ()
											{
												$("#email").popover("destroy");
											}, 3000);
									} // --- if(data.status == "success")
								});
						} // --- if(special symbols exists)
		} // --- if(email === "")
		console.debug("SendEmail: stop");
	};

	var ResetForm = function()
	{
		$("#forgetPasswordSubmit").button("reset");
		$("#email").removeAttr("disabled");
	};

	var ForgetPassword = function()
	{
		$("#email").attr("disabled", "");
		$("#forgetPasswordSubmit").button("loading");
		SendEmail();
	};

	var RedirectToURL = function()
	{
		window.location.href = redirectUrl;
	};

	return {
		Init: Init
	};

})();
