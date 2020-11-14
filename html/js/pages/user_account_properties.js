var	user_account_properties = user_account_properties || {};

user_account_properties = (function()
{
	'use strict';

	var Init = function()
	{
		UpdateAccountInfo();
		UpdateGUILogin($("#myUserID").data("mylogin"));
		UpdateGUIWallLink($("#myUserID").data("mylogin"));

		$("#ButtonAccountBlock1").on("click", 
			function () 
			{
				$("#DialogAccountBlockYesNo").modal('show');
			});

		$("#DialogAccountBlockYesNo").on('shown.bs.modal', 
			function()
			{
				$("#ButtonAccountCancel2").focus();
			});
		$("#ButtonAccountBlock2").on("click", BlockAccount);


		$("#ButtonAccountEnable1").on("click", 
			function () 
			{
				$("#DialogAccountEnableYesNo").modal('show');
			});

		$("#DialogAccountEnableYesNo").on('shown.bs.modal', 
			function()
			{
				$("#ButtonAccountEnable3").focus();
			});
		$("#ButtonAccountEnable3").on("click", EnableAccount);


		// --- change password
		$("#changePassword1").on("keyup", ChangePassword1KeyupHandler);
		$("#changePassword2").on("keyup", ChangePassword2KeyupHandler);

		$("#changePassword").on("click", ChangePassword_ClickHandler);

		$("#submitChangeLogin").on("click", ChangeLoginOnServer_ClickHandler);
		$("#submitChangeEmail").on("click", ChangeEmail_ClickHandler);
		$("#EmailChangeDialog button.btn-success").on("click", EmailChangeDialogSubmit_ClickHandler);
		$("#submitSendLink").on("click", SendWallLink);


		$("label[for=\"case_subscription_email\"]")	.on("click", Switcher_ClickHandler);
		$("label[for=\"case_subscription_sms\"]")	.on("click", Switcher_ClickHandler);

		// --- sms login block
		sms_confirmation.SetCountryCodeSelector	("#country_code");
		sms_confirmation.SetPhoneNumberSelector	("#phone_number");
		sms_confirmation.SetTriggerSelector		("#submitConfirmPhoneNumber");
		sms_confirmation.SetSuccessCallback		(function(param) { system_calls.PopoverInfo($("#submitConfirmPhoneNumber"), "Телефон подтвержден"); });
		sms_confirmation.SetFailCallback		(function(param) { system_calls.PopoverInfo($("#submitConfirmPhoneNumber"), "Телефон НЕ подтвержден"); });
		sms_confirmation.SetScript1				("account.cgi");
		sms_confirmation.SetAction1				("AJAX_sendPhoneConfirmationSMS");
		sms_confirmation.SetScript2				("account.cgi");
		sms_confirmation.SetAction2				("AJAX_confirmPhoneNumber");
	};

	var UpdateAccountInfo = function()
	{
		$.getJSON('/cgi-bin/index.cgi?action=JSON_getUserProfile')
			.done(
				function(data) 
				{
					var		user_profile;

					if(data.result == "success")
					{
						user_profile = data.users[0];

						RenderThemes(user_profile.themes);
						RenderPhone(user_profile);
						RenderUserEmail(user_profile);
						RenderHelpdeskSubscriptions(user_profile.helpdesk_subscriptions_sms, user_profile.helpdesk_subscriptions_email);
					}
					else
					{
						system_calls.PopoverError($("#firstName"), data.description);
					} // --- if(data.status == "success")
				})
			.fail(
				function(data) 
				{
					// --- Fail to block the account
					system_calls.PopoverError($("#firstName"), "Ошибка получаения данных");
				});

		
	};

	var	UpdateGUILogin = function(login)
	{
		$("#changeLogin").val(login);
	};

	var	UpdateGUIWallLink = function(login)
	{
		var		wallLink = document.domain + "/user/" + login;
		var		proto = "http://";

		if(document.URL.indexOf("https://") === 0) proto = "https://";

		// --- update GUI login on account page
		$("#linkToWall").val(proto + wallLink);

		// --- update login in navigation menu
		$("#myUserID").attr("data-myLogin", login);
		$("#myUserID").data("mylogin", login);

		// --- update login in navigation menu
		$("#myWallLink").attr("href", "/user/" + login);
	};

	var	SendWallLink = function()
	{
		var link = 'mailto:?subject=Моя лента ' + '&body=' + encodeURIComponent('Добрый день,\n\n\tМою ленту можно посмотреть по этой ссылке: ' + $("#linkToWall").val() + "\n\nС уважением, " + $("#myFirstName").text() + " " + $("#myLastName").text());

		$("#submitSendLink").button("loading");
		setTimeout(function() { $("#submitSendLink").button("reset"); }, 1000);

		window.location.href = link;
	};

	var ChangeButtons = function()
	{
		$("#ButtonAccountBlock1").removeAttr("disabled");
		$("#ButtonAccountBlock1").text("Аккаунт активен");
		$("#ButtonAccountBlock1").toggle(500);

		$("#ButtonAccountEnable1").removeAttr("disabled");
		$("#ButtonAccountEnable1").text("Аккаунт заблокирован");
		$("#ButtonAccountEnable1").toggle(500);
	};

	var BlockAccount = function()
	{
		console.debug("BlockAccount: start");

		$("#DialogAccountBlockYesNo").modal('hide');
		$("#ButtonAccountBlock1").attr("disabled", "disabled");
		$("#ButtonAccountBlock1").text("Блокировка ...");

		$.getJSON('/cgi-bin/index.cgi?action=AJAX_block_user_account', {param1: ''})
		.done(
			function(data) 
			{
				if(data.result == "success")
				{
					// --- Success account blocking 
					console.debug("BlockAccount: block success");

					ChangeButtons();
				}
				else
				{
					// --- Fail to block the account
					console.debug("BlockAccount: error in account blocking [" + data.description + "]");
					$("#ButtonAccountBlock1").text("Ошибка");

				} // --- if(data.status == "success")
			});

		console.debug("BlockAccount: end");
	};

	var EnableAccount = function()
	{
		console.debug("EnableAccount: start");

		$("#DialogAccountEnableYesNo").modal('hide');
		$("#ButtonAccountEnable1").attr("disabled", "disabled");
		$("#ButtonAccountEnable1").text("Разблокировка ...");

		$.getJSON('/cgi-bin/index.cgi?action=AJAX_enable_user_account', {param1: ''})
		.done(
			function(data) 
			{
				if(data.result == "success")
				{
					// --- Success account blocking 
					console.debug("EnableAccount: enabling success");

					ChangeButtons();
				}
				else
				{
					// --- Fail to block the account
					console.debug("EnableAccount: error in account blocking [" + data.description + "]");
					$("#ButtonAccountBlock1").text("Ошибка");

				} // --- if(data.status == "success")
			});

		console.debug("EnableAccount: end");
	};

	var PopoverOnChangePasswords = function(message)
	{
		$("#changePassword2").popover({"content": message})
							.popover("show");
		$("#changePassword1").popover({"content": message})
							.popover("show");

		setTimeout(function () 
			{
				$("#changePassword1").popover("destroy");
				$("#changePassword2").popover("destroy");
			}, 3000);

	};

	var	ChangeEmail_ClickHandler = function()
	{
		let curr_tag = $(this);
		let new_email = $("#changeEmail").val();


		if(new_email.length)
		{
			curr_tag.button("loading");
			
			$.getJSON('/cgi-bin/account.cgi?action=AJAX_changeEmail', {login: new_email})
			.done(
				function(data) 
				{
					if(data.result == "success")
					{
						$("#EmailChangeDialog").modal("show");
					}
					else
					{
						// --- Fail to block the account
						system_calls.PopoverError(curr_tag, data.description);
					} // --- if(data.status == "success")
				})
			.fail(
				function(data) 
				{
					// --- Fail to block the account
					system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
				})
			.always(
				function(data)
				{
					curr_tag.button("reset");
				});
		}
		else
		{
			system_calls.PopoverError(curr_tag, "email не может быть пустым");
		}

	};

	var	ChangeLoginOnServer_ClickHandler = function()
	{
		var		newLogin = $("#changeLogin").val();

		if(newLogin.length >= 8)
		{
			if((newLogin.indexOf("/") == -1) && (newLogin.indexOf("\\") == -1))
			{

				$("#submitChangeLogin").button("loading");
						
				$.getJSON('/cgi-bin/account.cgi?action=AJAX_changeLogin', {login: newLogin})
				.done(
					function(data) 
					{
						$("#submitChangeLogin").button("reset");
						
						if(data.result == "success")
						{
							// --- Success account blocking 
							system_calls.PopoverInfo("changeLogin", "Логин обновлен");
							UpdateGUIWallLink(newLogin);
						}
						else
						{
							// --- Fail to block the account
							system_calls.PopoverError("changeLogin", data.description);
						} // --- if(data.status == "success")
					})
				.fail(
					function(data) 
					{
						$("#submitChangeLogin").button("reset");
						// --- Fail to block the account
						system_calls.PopoverError("changeLogin", "Ошибка ответа сервера");
					});


			}
			else
			{
				system_calls.PopoverError("changeLogin", "Нельзя использовать сивол /");
			}
		}
		else
		{
			system_calls.PopoverError("changeLogin", "Должен быть 8 и более символов.");
		}
	};

	var ChangePassword_ClickHandler = function()
	{
		var		password1  = $("#changePassword1").val();
		var		password2  = $("#changePassword2").val();
		var		shaObj;
		var		password_hash;

		console.debug("ChangePassword: start");

		$("#changePassword1").popover("destroy");
		$("#changePassword2").popover("destroy");

		if(password1 === "") 
		{
			console.debug("ChangePassword: ERROR: changePassword1 is empty");

			$("#changePassword1").popover({"content": "Пароль не должен быть пустым."})
								.popover("show");
			setTimeout(function () 
				{
					$("#changePassword1").popover("destroy");
				}, 3000);
		}
		else
		{
			
			if(password2 === "") 
			{
				console.debug("ChangePassword: ERROR: changePassword2 is empty");

				$("#changePassword2").popover({"content": "Пароль не должен быть пустым."})
									.popover("show");
				setTimeout(function () 
					{
						$("#changePassword2").popover("destroy");
					}, 3000);
			}
			else
			{
				
				if(password1 != password2)
				{
					console.debug("ChangePassword: ERROR: change Password1 != changePassword2");

					PopoverOnChangePasswords("Пароли не совпадают");
				} // --- if(password1 != password2)
				else
				{
					if(password1.trim() != password1)
					{
							console.debug("ChangePassword: ERROR: password is started/ended with spaces");

							PopoverOnChangePasswords("Пароли НЕ должны начинаться или заканчиваться пробелом");
					}
					else
					{
						if((password1.indexOf("\"") >= 0) || (password1.indexOf("\n") >= 0) || (password1.indexOf("\r") >= 0) || (password1.indexOf("\t") >= 0) || (password1.indexOf("`") >= 0) || (password1.indexOf("'") >= 0) || (password1.indexOf("<") >= 0) || (password1.indexOf(">") >= 0))
						{
							console.debug("ChangePassword: ERROR: password is having special symbols");

							PopoverOnChangePasswords("Пароли НЕ должны содержать символов [\"\'\`<>]");
						}
						else
						{
							shaObj = new jsSHA("SHA-512", "TEXT");
							shaObj.update(password1);
							password_hash = shaObj.getHash("HEX");

							$.getJSON('/cgi-bin/index.cgi?action=AJAX_changeUserPassword', {password: password_hash})
							.done(
								function(data) 
								{
									if(data.result == "success")
									{
										// --- Success account blocking 
										console.debug("BlockAccount: password changed");

										$("#PasswordChanged").modal("show");
									}
									else
									{
										// --- Fail to block the account
										console.debug("BlockAccount: error in password changing [" + data.description + "]");

										PopoverOnChangePasswords(data.description);


									} // --- if(data.status == "success")
								});
						} // --- if(special symbols exists)
					} // --- if(pass.trim() != pass)
				} // --- if(password1 != password2)
			} // --- if(password2 === "")
		} // --- if(password1 === "")

		console.debug("ChangePassword: stop");
	};

	var InputPasswordCleanUP = function(event)
	{
		var		divChangePassword1 = $("#changePassword1").parent();
		var		divChangePassword2 = $("#changePassword2").parent();
		var		buttonChangePassword1 = $("#changePassword1");
		var		buttonChangePassword2 = $("#changePassword2");
		var		spanChangePassword1 = $("#changePassword1").siblings();
		var		spanChangePassword2 = $("#changePassword2").siblings();

		divChangePassword1.removeClass("has-success has-error");
		divChangePassword2.removeClass("has-success has-error");
		spanChangePassword1.removeClass("glyphicon-ok glyphicon-remove")
							.addClass("user-account-properties-hidden");
		spanChangePassword2.removeClass("glyphicon-ok glyphicon-remove")
							.addClass("user-account-properties-hidden");
	};

	var ChangePassword1KeyupHandler = function(event)
	{
		var		keyPressed = event.keyCode;

		console.debug("ChangePassword1KeyupHandler: start keyPressed [" + keyPressed + "] value = " + $("#changePassword1").val());

		if($("#changePassword2").val().length)
		{
			var		divChangePassword1 = $("#changePassword1").parent();
			var		divChangePassword2 = $("#changePassword2").parent();
			var		buttonChangePassword1 = $("#changePassword1");
			var		buttonChangePassword2 = $("#changePassword2");
			var		spanChangePassword1 = $("#changePassword1").siblings();
			var		spanChangePassword2 = $("#changePassword2").siblings();

			InputPasswordCleanUP();

			if($("#changePassword1").val() === $("#changePassword2").val())
			{
				divChangePassword1.addClass("has-success");
				spanChangePassword1.removeClass("user-account-properties-hidden").addClass("glyphicon-ok");
			}
			else
			{
				divChangePassword1.addClass("has-error");
				spanChangePassword1.removeClass("user-account-properties-hidden").addClass("glyphicon-remove");
			}
		}

		console.debug("ChangePassword1KeyupHandler: stop");
	};

	var ChangePassword2KeyupHandler = function(event)
	{
		var		keyPressed = event.keyCode;

		console.debug("ChangePassword1KeyupHandler: start keyPressed [" + keyPressed + "] value = " + $("#changePassword2").val());

		if($("#changePassword2").val().length)
		{
			var		divChangePassword1 = $("#changePassword1").parent();
			var		divChangePassword2 = $("#changePassword2").parent();
			var		buttonChangePassword1 = $("#changePassword1");
			var		buttonChangePassword2 = $("#changePassword2");
			var		spanChangePassword1 = $("#changePassword1").siblings();
			var		spanChangePassword2 = $("#changePassword2").siblings();

			InputPasswordCleanUP();

			if($("#changePassword1").val() === $("#changePassword2").val())
			{
				divChangePassword2.addClass("has-success");
				spanChangePassword2.removeClass("user-account-properties-hidden").addClass("glyphicon-ok");
			}
			else
			{
				divChangePassword2.addClass("has-error");
				spanChangePassword2.removeClass("user-account-properties-hidden").addClass("glyphicon-remove");
			}
		}

		console.debug("ChangePassword1KeyupHandler: stop");
	};

	var	GetThemes_DOM = function(JSON_themes)
	{
		var		image_row = $("<div>").addClass("row");

		if(JSON_themes)
		{
			JSON_themes.forEach( function(theme)
			{
				if((typeof(theme.name) != "undefined") && theme.name.length)
				{
					{
						var		image_col = $("<div>").addClass("col-xs-4 col-md-2");
						var		img_tag = $("<img>")
											.attr("src", "/images/themes/" + theme.path + ".jpg")
											.data("theme_id", theme.id)
											.addClass("width_100percent_100px_cover niceborder cursor_pointer")
											.on("click", function(e)
											{
												var		currTag = $(this);

												$.getJSON('/cgi-bin/index.cgi?action=AJAX_updateSiteTheme', {theme_id: currTag.data("theme_id")})
													.done(function(data) {
														if(data.status === "success")
														{
															window.location.href = window.location.href + "&rand2=" + Math.random() * 2345678764;
														}
														else
														{
															system_calls.PopoverError(currTag, "Ошибка: " + data.description);
														}
													})
													.fail(function() {
														system_calls.PopoverError(currTag, "Ошибка ответа сервера");
													});


											});

						image_row	.append(image_col);
						image_col	.append(img_tag);
					}
				}
			});
		}
		else
		{
			console.error("themes are not defined in user object");
		}


		return image_row;
	};

	var	RenderPhone = function(userProfile)
	{
		$("#country_code").val(userProfile.country_code);
		$("#phone_number").val(userProfile.phone);
	};

	var	RenderUserEmail = function(userProfile)
	{
		$("#changeEmail").val(userProfile.email);

		if(userProfile.email_changeable == "Y")
		{
			$("#changeEmail").removeAttr("disabled");
			$("#submitChangeEmail").removeAttr("disabled");
		}
		else
		{
			$("#changeEmail").attr("disabled", "disabled");
			$("#submitChangeEmail").attr("disabled", "disabled");
		}
	};

	var	RenderThemes = function(JSON_themes)
	{
		$("#ThemesList").empty().append(GetThemes_DOM(JSON_themes));
	};

	var	RenderHelpdeskSubscriptions = function(sms_subscriptions, email_subscriptions)
	{
		$("#case_subscription_sms")		.prop("checked",   sms_subscriptions[0] == "Y" ? "checked" : "");
		$("#case_subscription_email")	.prop("checked", email_subscriptions[0] == "Y" ? "checked" : "");
	};

	var	Switcher_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		input_tag = $("#" + $(this).attr("for"));
		var		curr_value = !input_tag.prop("checked");

		$.getJSON(
			'/cgi-bin/' + input_tag.attr("data-script"),
			{
				action: input_tag.attr("data-action"),
				value: (curr_value ? "Y" : "N"),
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
				}
				else
				{
					// --- install previous value, due to error
					input_tag.prop("checked", !curr_value);

					system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
				}
			})
			.fail(function(e)
			{
				input_tag.prop("checked", !curr_value);
				system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
			})
			.always(function(e)
			{
			});

		return true;
	};

	var	EmailChangeDialogSubmit_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		email = $("#changeEmail").val();

		if(email.indexOf("@"))
		{
			window.open('https://' + email.substr(email.indexOf("@") + 1), '_blank');
		}
		else
		{
			system_calls.PopoverError(curr_tag, "некорректный email");
		}
	};

return {
	Init:Init
		};

})();

