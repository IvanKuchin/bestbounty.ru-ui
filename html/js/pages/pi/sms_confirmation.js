/* exported sms_confirmation */

sms_confirmation = (function ()
{
	"use strict";

	var	country_code_selector_global = "";
	var	phone_number_selector_global = "";
	var	additional_params1_selector_global = "";
	var	additional_params2_selector_global = "";

	var	success_callback_global;
	var	fail_callback_global;

	var Init = function()
	{
		// --- phone confirmation
		$("#DialogPhoneConfirmation").on("shown.bs.modal", PhoneConfirmationCode_ShownHandler);
		$(".sms-confirmation-code").on("input", PhoneConfirmationCode_InputHandler);
	};

	var	SetTriggerSelector		= function(item) 	{ $(item).on("click", PhoneConfirmation_ClickHandler); };
	var	SetCountryCodeSelector	= function(item)	{ country_code_selector_global			= item; };
	var	SetPhoneNumberSelector	= function(item)	{ phone_number_selector_global			= item; };
	var	SetSuccessCallback		= function(item)	{ success_callback_global				= item; };
	var	SetFailCallback			= function(item)	{ fail_callback_global					= item; };

	var	SetAdditionalParams1	= function(item)	{ additional_params1_selector_global	= item; };
	var	SetScript1				= function(item) 	{ $("#DialogPhoneConfirmation").attr("data-script1", item); };
	var	SetAction1				= function(item) 	{ $("#DialogPhoneConfirmation").attr("data-action1", item); };
	var	SetAdditionalParams2	= function(item)	{ additional_params2_selector_global	= item; };
	var	SetScript2				= function(item) 	{ $("#DialogPhoneConfirmation").attr("data-script2", item); };
	var	SetAction2				= function(item) 	{ $("#DialogPhoneConfirmation").attr("data-action2", item); };

	// --- phone part
	var	GetOnlyDigits = function(param)
	{
		return param.replace(/\D/g, "");
	};

	var PhoneConfirmation_ClickHandler = function()
	{
		var		curr_tag = $(this);
		var		country_code = GetOnlyDigits($(country_code_selector_global + " option:selected").val());
		var		phone_number = GetOnlyDigits($(phone_number_selector_global).val());

		if(country_code.length)
		{
			if(phone_number.length)
			{
				$("#DialogPhoneConfirmation").modal("show");
				SendPhoneConfirmationSMS();
			}
			else
			{
				system_calls.PopoverError(curr_tag, "Номер телефона должен содержать цифры");
			}
		}
		else
		{
			system_calls.PopoverError(curr_tag, "Код страны должен содержать цифры");
		}

	};

	var	SendPhoneConfirmationSMS = function()
	{
		var	country_code	= $(country_code_selector_global).val();
		var	phone_number	= $(phone_number_selector_global).val();

		var	curr_tag		= $("#DialogPhoneConfirmation");
		var	script			= curr_tag.attr("data-script1");
		var	action			= curr_tag.attr("data-action1");

		if(script.length && action.length)
		{
			PhoneConfirmationCode_Status("SMS отправляется ...", "");
			
			$.getJSON("/cgi-bin/" + script + "?action=" + action + GetAdditionalParams(additional_params1_selector_global), {country_code: country_code, phone_number: phone_number})
			.done(
				function(data) 
				{
					if(data.result == "success")
					{
						// --- nothing to do, just wait
						PhoneConfirmationCode_Status("SMS отправлено.", "color_green");
					}
					else
					{
						PhoneConfirmationCode_Status(data.description, "color_red");
					} // --- if(data.status == "success")
				})
			.fail(
				function() 
				{
					PhoneConfirmationCode_Status("ошибка доставки SMS.", "color_red");
				});
		}
		else
		{
			system_calls.PopoverError($(".sms-confirmation-code"), "Не указано действие");
		}
	};

	var	InitPhoneConfirmation = function()
	{
		$(".sms-confirmation-code").val("");
		$(".sms-confirmation-code:eq(0)").focus();
	};
		
	var	PhoneConfirmationCode_ShownHandler = function()
	{
		InitPhoneConfirmation();
	};

	var	PhoneConfirmationCode_Status = function(message, class_name)
	{
		$("#phone_confirmation_status")
			.empty()
			.removeAttr("class")
			.addClass(class_name)
			.append(message);
	};

	var	PhoneConfirmationCode_InputHandler = function()
	{
		var	curr_tag = $(this);
		var	curr_value = curr_tag.val();
		var	curr_order = curr_tag.attr("data-order");
		var	next_tag;
		var	confirmation_code;

		if(curr_value.length > 1)
		{
			console.error("value in input field longer than allowed");
			curr_value = curr_value[0];
			curr_tag.val(curr_value);
		}

		if(curr_value.length)
		{
			if((curr_value >= "0") && (curr_value <= "9"))
			{
				if(curr_order == "3")
				{
					confirmation_code = 
						curr_tag.parent().parent().find("input:eq(0)").val() + 
						curr_tag.parent().parent().find("input:eq(1)").val() + 
						curr_tag.parent().parent().find("input:eq(2)").val() + 
						curr_tag.parent().parent().find("input:eq(3)").val();

					CheckConfirmationCodeValidity(confirmation_code);
				}
				else
				{
					next_tag = curr_tag.parent().parent().find("input:eq(" + (parseInt(curr_order) + 1) + ")");
					next_tag.val("").focus();
				}
			}
			else
			{
				system_calls.PopoverError(curr_tag, "Введите цифру");
				curr_tag.val("");
			}
		}
	};

	var CheckConfirmationCodeValidity = function(confirmation_code)
	{
		var	curr_tag		= $("#DialogPhoneConfirmation");
		var	script			= curr_tag.attr("data-script2");
		var	action			= curr_tag.attr("data-action2");


		if(confirmation_code.length == 4)
		{
			if(script.length && action.length)
			{
				$.getJSON("/cgi-bin/" + script + "?action=" + action + GetAdditionalParams(additional_params2_selector_global), {confirmation_code: confirmation_code})
				.done(
					function(data) 
					{
						if(data.result == "success")
						{
							PhoneConfirmationCode_Final();
							success_callback_global(data);
						}
						else
						{
							PhoneConfirmationCode_Status(data.description, "color_red");
							InitPhoneConfirmation();
							if((typeof(data.attempt) != "undefined") && (parseInt(data.attempt) >= "3"))
							{
								PhoneConfirmationCode_Final();
								fail_callback_global(data);
							}
						} // --- if(data.status == "success")
					})
				.fail(
					function() 
					{
						PhoneConfirmationCode_Status("Ошибка ответа сервера", "color_red");
						system_calls.PopoverError("Ошибка ответа сервера");
					});
			}
			else
			{
				system_calls.PopoverError($(".sms-confirmation-code"), "Не указано действие");
			}
		}
		else
		{
			system_calls.PopoverError($(".sms-confirmation-code"), "Необходимо ввести 4-ре цифры");
			InitPhoneConfirmation();
		}
	};

	var	PhoneConfirmationCode_Final = function()
	{
		$("#DialogPhoneConfirmation").modal("hide");
	};

	var	GetInputTagValue = function(tag)
	{
		var	result = "";

		if(tag)
		{
			if(tag.prop("tagName") == "INPUT")
			{
				if((typeof(tag.attr("type")) != "undefined") && (tag.attr("type") == "checkbox"))
				{
					if(tag.prop("checked"))
					{
						result = tag.val();
					}
				}
				else
				{
					result = tag.val();
				}
			}
			else
			{
				console.error("tag is not an input");
			}
		}
		else
		{
			console.error("tag is not defined");
		}

		return result;
	};

	var	GetAdditionalParams = function(selector)
	{
		var	result = "";

		$(selector).each(function()
			{
				var	curr_tag = $(this);
				var	tag_id = curr_tag.attr("id");
				var	tag_value = GetInputTagValue(curr_tag);

				if(tag_id && tag_id.length && tag_value && tag_value.length) result = result + "&" + tag_id + "=" + tag_value;
			});

		return result;
	};

	return {
		Init					: Init,
		SetTriggerSelector		: SetTriggerSelector,
		SetCountryCodeSelector	: SetCountryCodeSelector,
		SetPhoneNumberSelector	: SetPhoneNumberSelector,
		SetSuccessCallback		: SetSuccessCallback,
		SetFailCallback			: SetFailCallback,
		SetScript1				: SetScript1,
		SetAction1				: SetAction1,
		SetScript2				: SetScript2,
		SetAction2				: SetAction2,
		SetAdditionalParams1	: SetAdditionalParams1,
		SetAdditionalParams2	: SetAdditionalParams2,
	};
})();

