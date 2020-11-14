var	password_recovery = password_recovery || {}

password_recovery = (function()
{
	redirectUrl = "/";

	var Init = function()
	{
		$("#AJAX_recoverPasswordSubmit").on("click", RecoverPassword);
	};

	var	RecoverPassword = function()
	{
		var		currTag = $(this);
		var		activator_id = $.urlParam("token");

		if(activator_id === "")
		{
			system_calls.PopoverError("regPassword", "Пустой код активации. Вам нужно пройти процедуру заново.");
		}
		else if(!create_password_block.Check_NewPassword_Len($("#regPassword")) || !create_password_block.Check_NewPassword_Letters($("#regPassword")) || !create_password_block.Check_NewPassword_Digits($("#regPassword")) || !create_password_block.Check_NewPassword_DigitLocation($("#regPassword")))
		{
			system_calls.PopoverError("regPassword", "Неподходящий пароль");
	   		$('#regPassword').focus();
		}
		else if(!create_password_block.Check_NewPassword_Len($("#regConfirmPassword")) || !create_password_block.Check_NewPassword_Letters($("#regConfirmPassword")) || !create_password_block.Check_NewPassword_Digits($("#regConfirmPassword")) || !create_password_block.Check_NewPassword_DigitLocation($("#regConfirmPassword")))
		{
			system_calls.PopoverError("regConfirmPassword", "Неподходящий пароль");
	   		$('#regConfirmPassword').focus();
		}
		else if($("#regPassword").val() != $("#regConfirmPassword").val())
		{
			system_calls.PopoverError("regConfirmPassword", "Пароли не совпадают");
	   		$('#regConfirmPassword').focus();
		}
		else
		{
			var		password_hash;
			var 	shaObj = new jsSHA("SHA-512", "TEXT");

			shaObj.update($("#regPassword").val());
			password_hash = shaObj.getHash("HEX");

			$("#AJAX_recoverPasswordSubmit").button("loading");

			$.getJSON('/cgi-bin/index.cgi?action=AJAX_recoverPassword',
						{
							activator_id: activator_id,
							password_hash: password_hash
						})
			.done(
				function(data)
				{
					if(data.redirect_url.length) window.location.replace(data.redirect_url);

					if(data.result == "success")
					{
					}
					else
					{
						system_calls.PopoverError(currTag, data.description);
						console.error("ERROR:" + data.description);
					} // --- if(data.status == "success")
				})
			.fail(function()
			{
				system_calls.PopoverError(currTag, "Ошибка JSON ответа сервера");
				console.error("server JSON parse error");
			})
			.always(function()
			{
				setTimeout(function()
				{
					$("#AJAX_recoverPasswordSubmit").button("reset");
				}, 500);
			});
		}
	};

	return {
		Init: Init
	};

})();
