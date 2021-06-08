/*global create_password_block, jsSHA */

var		login_page = login_page || {};

login_page = (function()
{
	"use strict";

	var	country_selector		= "#signinInputCountry";
	var	login_selector			= "#signinInputLogin";
	var	password_selector		= "#signinInputPassword";
	var	phone_submit_selector	= "#phoneSigninSubmit";

	var	countries_global;

	var Init = function()
	{
		// --- if workflow came to re-type password or security code
		// --- 1) pre-fill email
		// --- 2) focus on-password field
		if($.urlParam("regEmail").length)
		{
			setTimeout(function()
			{
				$("#regInputEmail").focus();
			}, 100);
		}

		CheckregInputEmailValidity();
		$("#regInputEmail").focusout(function() {
			CheckregInputEmailValidity();
		});

		$("#regSubmit")				.on("click", UserSignup_ClickHandler);
		$("#signinSubmit")			.on("click", UserLogin_ClickHandler);

		$(login_selector)			.on("keyup", HidePasswordIfPhoneNumber_KeyupHandler);

		$("#signinRememberLabel")	.on("click", function()
		{
			$("#signinRemember").prop("checked", !$("#signinRemember").prop("checked"));
		});

		// --- sms login block
		sms_confirmation.SetCountryCodeSelector	(country_selector);
		sms_confirmation.SetPhoneNumberSelector	(login_selector);
		sms_confirmation.SetTriggerSelector		(phone_submit_selector);
		sms_confirmation.SetSuccessCallback		(function(param) { if((typeof(param) != "undefined") && (typeof(param.url) != "undefined") && param.url.length) window.location.replace(param.url); });
		sms_confirmation.SetFailCallback		(function() { system_calls.PopoverInfo($(phone_submit_selector), "Некорректный код"); });
		sms_confirmation.SetScript1				("noauth.cgi");
		sms_confirmation.SetAction1				("AJAX_sendPhoneConfirmationSMS");
		sms_confirmation.SetScript2				("index.cgi");
		sms_confirmation.SetAction2				("AJAX_loginUser");
		sms_confirmation.SetAdditionalParams2	("#signinRemember");

		$(".dynamic_shadow")		.addClass("box-shadow--2dp animateClass");
		$(".dynamic_shadow")		.on("mouseover", function() { $(this).addClass("box-shadow--6dp"); });
		$(".dynamic_shadow")		.on("mouseout", function() { $(this).removeClass("box-shadow--6dp"); });

		BuildCountrySelectTag();
	};

	var	UserSignup_ClickHandler = function()
	{
		var		curr_tag = $(this);

		if($("#regInputEmail").val() === "")
		{
			system_calls.PopoverError("regInputEmail", "Укажите e-mail");
			$("#regInputEmail").focus();
		}
		else if(!create_password_block.Check_NewPassword_Len($("#regPassword")) || !create_password_block.Check_NewPassword_Letters($("#regPassword")) || !create_password_block.Check_NewPassword_Digits($("#regPassword")) || !create_password_block.Check_NewPassword_DigitLocation($("#regPassword")))
		{
			system_calls.PopoverError("regPassword", "Неподходящий пароль");
			$("#regPassword").focus();
		}
		else if(!create_password_block.Check_NewPassword_Len($("#regConfirmPassword")) || !create_password_block.Check_NewPassword_Letters($("#regConfirmPassword")) || !create_password_block.Check_NewPassword_Digits($("#regConfirmPassword")) || !create_password_block.Check_NewPassword_DigitLocation($("#regConfirmPassword")))
		{
			system_calls.PopoverError("regConfirmPassword", "Неподходящий пароль");
			$("#regConfirmPassword").focus();
		}
		else if($("#regPassword").val() != $("#regConfirmPassword").val())
		{
			system_calls.PopoverError("regConfirmPassword", "Пароли не совпадают");
			$("#regConfirmPassword").focus();
		}
		else if($("#regSecurityCode").val() === "")
		{
			system_calls.PopoverError("regSecurityCode", "Укажите код безопасности");
			$("#regSecurityCode").focus();
		}
		else
		{
			/* Is regEmail checked for existing user */
			if($("#regEmail_checked").val() == "0") {
				system_calls.PopoverError("regEmail_checked", "Введен неправильный email, попробуйте другой email");
				event.preventDefault();
			}
			else
			{
				var		password_hash;
				var 	shaObj = new jsSHA("SHA-512", "TEXT");
				shaObj.update($("#regPassword").val());

				password_hash = shaObj.getHash("HEX");

				$("#regSubmit").button("loading");

				$.getJSON("/cgi-bin/index.cgi?action=regNewUser", {
																	regEmail: $("#regInputEmail").val(),
																	regPassword: password_hash,
																	regSecurityCode: $("#regSecurityCode").val()
																})
					.done(function(data)
					{
						if(data.result == "success")
						{
							window.location.replace(data.redirect_url + "&rand2=" + Math.random()*98765432123456);
						}
						else
						{
							system_calls.PopoverError(curr_tag, data.description);
							console.error(":ERROR: " + data.description);
							if(data.redirect_url.length) window.location.replace(data.redirect_url + "&rand2=" + Math.random()*98765432123456);
						}
					})
					.fail(function()
					{
						system_calls.PopoverError(curr_tag, "Ошибка JSON ответа сервера");
						console.error("fail to parse JSON server response");
					})
					.always(function()
					{
						setTimeout(function() { $("#regSubmit").button("reset"); }, 300);
					});
			}
		}
	};

	var CheckregInputEmailValidity = function()
	{
		/* Check for email duplication */
		var formData = {
			"regEmail"			  : $("#regInputEmail").val(),
			"action"				: "ajax_regNewUser_checkUser"
		};

		if(formData.regEmail !== "") {
			$.ajax({
				type		: "GET", // define the type of HTTP verb we want to use (POST for our form)
				url		 : "/cgi-bin/index.cgi", // the url where we want to POST
				data		: formData, // our data object
				dataType	: "json", // what type of data do we expect back from the server
				encode	  : true
			})
				// using the done promise callback
				.done(function(data) {
					console.log("DEBUG: CheckregInputEmailValidity().ajax().done: retrieved data.regEmail = " + data.regEmail);
					if(data.regEmail == "already used"){
						$("#regInputEmail").focus();
						$("#regEmail_checked").val("0");

						// --- Update field with Error sign
						$("#regDivEmail").removeClass("has-success").addClass("has-error");
						$("#regSpanEmail").removeClass("glyphicon-ok").addClass("glyphicon-remove");

					}
					else {
						$("#regEmail_checked").val("1");

						// --- Update field with Success sign
						$("#regDivEmail").removeClass("has-error").addClass("has-success");
						$("#regSpanEmail").removeClass("glyphicon-remove").addClass("glyphicon-ok");
					}

					// here we will handle errors and validation messages
				});
		}
		else {
			$("#regEmail_checked").val("0");

			// --- cleanup Email field
			$("#regDivEmail").removeClass("has-error has-success");
			$("#regSpanEmail").removeClass("glyphicon-remove glyphicon-ok");
		}
	};

	var RedirectTo = function(_url)
	{
		if((typeof(_url) != "undefined") && _url.length) window.location.href = _url;
		else
		{
			console.errors("Fail in redirect url");
		}
	};

	var UserLogin_ClickHandler = function()
	{
		var		login_tag	= $("#signinInputLogin");
		var		password_tag= $("#signinInputPassword");
		var		login		= login_tag.val();
		var		password	= password_tag.val();

		if(login !== "")
		{
			if(isPhone(login))
			{
				$("#phoneSigninSubmit").click();
			}
			else if(password !== "")
			{
				var shaObj = new jsSHA("SHA-512", "TEXT");
				shaObj.update(password);
				var hash = shaObj.getHash("HEX");

				$.getJSON("/cgi-bin/index.cgi?action=AJAX_loginUser", {login: login, password: hash, signinRemember: $("#signinRemember").prop("checked") ? "remember-me" : ""})
				.done(function(data)
					{
						if(data.result == "success")
						{
							RedirectTo(data.url);
						}
						else
						{
							if((typeof(data.type) != "undefined") && (data.type === "redirect"))
								window.location.href = (typeof(data.url) != "undefined") && data.url.length && data.url || "/login?rand=" + Math.random()*98765432123456;

							system_calls.PopoverError(password_tag, data.description, "bottom");
						} // --- if(data.status == "success")
					});
			}
			else
			{
				system_calls.PopoverError(password_tag, "Введите пароль", "bottom");
			} // --- if(pass is empty)
		}
		else
		{
			system_calls.PopoverError(login_tag, "Введите почту", "bottom");
		} // --- if(login is empty)
	};

	var BuildCountrySelectTag = function()
	{
		var		curr_tag = $(country_selector);

		$.getJSON("/cgi-bin/noauth.cgi?action=AJAX_getGeoCountryList")
			.done(function(data)
			{
				if(data.result == "success")
				{
					countries_global = data.countries;
					RenderCountrySelectTag();
				}
				else
				{
					system_calls.PopoverError(curr_tag, data.description);
				}
			})
			.fail(function()
			{
				system_calls.PopoverError(curr_tag, "Ошибка JSON ответа сервера");
			});

	};

	var	CountrySelectTag_GetDOM = function()
	{
		var	result = $();

		countries_global.forEach(function(country)
		{
			var		option_tag = $("<option>")
										.attr("value", country.id)
										.append("+" + country.id + " (" + country.title + ")");
			if(country.id == "7") option_tag.attr("selected", "");
			result = result.add(option_tag);
		});

		return result;
	};

	var	RenderCountrySelectTag = function()
	{
		$(country_selector).empty().append(CountrySelectTag_GetDOM());
	};

	var	isPhone	= function(str_to_test)
	{
		var	result = false;
		var	digits_only = [];

		if(str_to_test.match(/^ *(\+\d+)? *(\(\d+\))?[\d\- ]+\d[\d ]*$/))
		{
			for (var i = str_to_test.length - 1; i >= 0; i--) {
				if(("0" <= str_to_test[i]) && (str_to_test[i] <= "9")) digits_only.push(str_to_test[i]);
			}

			if(digits_only.length >= 10) result = true;
		}

		return result;
	};

	var	HidePasswordIfPhoneNumber_KeyupHandler = function()
	{
		var	curr_tag = $(this);

		if(isPhone(curr_tag.val()))
		{
			$(country_selector).show(200);
			setTimeout(function() { $(password_selector).hide(200); }, 200);
		}
		else
		{
			$(country_selector).hide(200);
			setTimeout(function() { $(password_selector).show(200); }, 200);
		}
	};

	return {
		Init: Init
	};


})();

