/*jslint devel: true, indent: 4, maxerr: 50*/
/*globals $:false localStorage:false location: false*/
/*globals localStorage:false*/
/*globals location:false*/
/*globals document:false*/
/*globals window:false*/
/*globals Image:false*/
/*globals jQuery:false*/
/*globals Notification:false*/
/*globals setTimeout:false*/
/*globals navigator:false*/
/*globals module:false*/
/*globals define:false*/

create_password_block = (function ()
{
	"use strict";

	var	password_selector		= "#signinInputPassword";

	var	typingAlarmFlagActive	= false;
	var	adjectives_list_global;
	var	noun_list_global;

	var Init = function(adjectives_list, noun_list)
	{
		adjectives_list_global = adjectives_list || [];
		noun_list_global = noun_list || [];

		$(password_selector)		.on("keyup", CheckKeyPressedRegisterAndKeyboardLayout);
		$("#regPassword")			.on("keyup", CheckKeyPressedRegisterAndKeyboardLayout);
		$("#regConfirmPassword")	.on("keyup", CheckKeyPressedRegisterAndKeyboardLayout);
		$("#regPassword")			.on("focus", function(e) { $("#password_type_progress_check").show(500); });
		$("#regPassword")			.on("blur",  function(e) { $("#password_type_progress_check").hide(100); });
		$("#regConfirmPassword")	.on("focus", function(e) { $("#password_type_progress_check").show(500); });
		$("#regConfirmPassword")	.on("blur",  function(e) { $("#password_type_progress_check").hide(100); });


		// --- password examples
		$("#tooltip_reg_password")
				.attr("data-toggle", "tooltip")
				.attr("data-placement", "top")
				.attr("title", "Например: " + GetPasswordExamples(2))
				.tooltip({ animation: "animated bounceIn"});

		$("#tooltip_reg_confirm_password")
				.attr("data-toggle", "tooltip")
				.attr("data-placement", "top")
				.attr("title", "Например: " + GetPasswordExamples(2))
				.tooltip({ animation: "animated bounceIn"});
	};

	var	isCapital = function(letter)
	{
		var		result = false;

		if(("A" <= letter) && (letter <= "Z"))
		{
			result = true;
		}
		if(("А" <= letter) && (letter <= "Я"))
		{
			result = true;
		}

		return result;
	};

	var	isRussianSymbol = function(letter)
	{
		var		result = false;

		if(("а" <= letter) && (letter <= "я"))
		{
			result = true;
		}
		if(("А" <= letter) && (letter <= "Я"))
		{
			result = true;
		}

		return result;
	};

	var	TranslateRusToEng = function(src)
	{
		var		result = src;

		result = result.replaceAll("А", "A");
		result = result.replaceAll("Б", "B");
		result = result.replaceAll("В", "V");
		result = result.replaceAll("Г", "G");
		result = result.replaceAll("Д", "D");
		result = result.replaceAll("Е", "E");
		result = result.replaceAll("Ё", "E");
		result = result.replaceAll("Ж", "Zh");
		result = result.replaceAll("З", "Z");
		result = result.replaceAll("И", "I");
		result = result.replaceAll("Й", "I");
		result = result.replaceAll("К", "K");
		result = result.replaceAll("Л", "L");
		result = result.replaceAll("М", "M");
		result = result.replaceAll("Н", "N");
		result = result.replaceAll("О", "O");
		result = result.replaceAll("П", "P");
		result = result.replaceAll("Р", "R");
		result = result.replaceAll("С", "S");
		result = result.replaceAll("Т", "T");
		result = result.replaceAll("У", "U");
		result = result.replaceAll("Ф", "F");
		result = result.replaceAll("Х", "X");
		result = result.replaceAll("Ц", "C");
		result = result.replaceAll("Ч", "Ch");
		result = result.replaceAll("Ъ", "");
		result = result.replaceAll("Ы", "W");
		result = result.replaceAll("Ь", "");
		result = result.replaceAll("Ш", "Sh");
		result = result.replaceAll("Щ", "Sch");
		result = result.replaceAll("Э", "E");
		result = result.replaceAll("Ю", "Yu");
		result = result.replaceAll("Я", "Ya");
		result = result.replaceAll("а", "a");
		result = result.replaceAll("б", "b");
		result = result.replaceAll("в", "v");
		result = result.replaceAll("г", "g");
		result = result.replaceAll("д", "d");
		result = result.replaceAll("е", "e");
		result = result.replaceAll("ё", "e");
		result = result.replaceAll("ж", "zh");
		result = result.replaceAll("з", "z");
		result = result.replaceAll("и", "i");
		result = result.replaceAll("й", "i");
		result = result.replaceAll("к", "k");
		result = result.replaceAll("л", "l");
		result = result.replaceAll("м", "m");
		result = result.replaceAll("н", "n");
		result = result.replaceAll("о", "o");
		result = result.replaceAll("п", "p");
		result = result.replaceAll("р", "r");
		result = result.replaceAll("с", "s");
		result = result.replaceAll("т", "t");
		result = result.replaceAll("у", "u");
		result = result.replaceAll("ф", "f");
		result = result.replaceAll("х", "x");
		result = result.replaceAll("ц", "c");
		result = result.replaceAll("ч", "ch");
		result = result.replaceAll("ъ", "");
		result = result.replaceAll("ы", "w");
		result = result.replaceAll("ь", "");
		result = result.replaceAll("ш", "sh");
		result = result.replaceAll("щ", "sch");
		result = result.replaceAll("э", "e");
		result = result.replaceAll("ю", "yu");
		result = result.replaceAll("я", "ya");
		result = result.replaceAll(" ", "_");


		return result;
	};

	var	GetPasswordExamples = function(count)
	{
		var		result = "";
		var		rand1 = Math.floor(Math.random() * 100);
		var		rand2 = Math.floor(Math.random() * 100);

		if(noun_list_global.length && adjectives_list_global.length)
		{
			for(var i = 0; i < count; ++i)
			{
				var		example;

				rand1 = (rand1 + 1) % adjectives_list_global.length;
				rand2 = (rand2 + 1) % noun_list_global.length;
				example = adjectives_list_global[rand1] + "" + Math.round(Math.random() * 1000) + "" + noun_list_global[rand2];

				if(result.length) result += ", ";
				result += TranslateRusToEng(example);
			}
		}
		else
		{
			// console.error("noun_list_global(" + noun_list_global.length + ") or adjectives_list_global(" + adjectives_list_global.length + ") is empty");
		}

		return 	result;
	};

	var	CheckKeyPressedRegisterAndKeyboardLayout = function(keyEvent)
	{
		var		currTag = $(this);
		var		shiftPressed = keyEvent.shiftKey;
		var		capsLockAlarm = false;
		var		alarmMessage = "";

		if((typeof(keyEvent.key) != "undefined") && (keyEvent.key.length == 1))
		{
			// --- is caps lock on
			if(!shiftPressed && isCapital(keyEvent.key))
			{
				if(alarmMessage.length)
				{
					alarmMessage += " и ";
				}
				alarmMessage += "Нажат CapsLock";
			}

			// --- is russian keyboard layout
			if(isRussianSymbol(keyEvent.key))
			{
				if(alarmMessage.length)
				{
					alarmMessage += " и ";
				}
				alarmMessage += "русская раскладка";
			}

			if((alarmMessage !== "") && (!typingAlarmFlagActive))
			{
				typingAlarmFlagActive = true;
				currTag.popover({"content": alarmMessage, "placement": "bottom"})
						.popover("show");
				setTimeout(function ()
					{
						currTag.popover("destroy");
					}, 3000);
				setTimeout(function ()
					{
						typingAlarmFlagActive = false;
					}, 3500);
			}
		}

		if((currTag.attr("id") == "regPassword") || (currTag.attr("id") == "regConfirmPassword"))
		{
			Check_NewPassword_Len(currTag);
			Check_NewPassword_Letters(currTag);
			Check_NewPassword_Digits(currTag);
			Check_NewPassword_DigitLocation(currTag);
			Check_NewPasswords_Parity();
		}
	};

	var	Check_NewPassword_Len = function(currTag)
	{
		var		curr_pass = currTag.val();
		var		result = false;

		if(curr_pass.length >= 8)
		{
			$("#password_progress_length").removeClass("alert-danger").addClass("alert-success");
			result = true;
		}
		else
			$("#password_progress_length").removeClass("alert-success").addClass("alert-danger");

		return result;
	};



	var	Check_NewPassword_Letters = function(currTag)
	{
		var		curr_pass = currTag.val();
		var		result = false;

		if(curr_pass.match(/\D+/))
		{
			$("#password_progress_letters").removeClass("alert-danger").addClass("alert-success");
			result = true;
		}
		else
			$("#password_progress_letters").removeClass("alert-success").addClass("alert-danger");

		return result;
	};

	var	Check_NewPassword_Digits = function(currTag)
	{
		var		curr_pass = currTag.val();
		var		result = false;

		if(curr_pass.match(/\d+/))
		{
			$("#password_progress_digits").removeClass("alert-danger").addClass("alert-success");
			result = true;
		}
		else
			$("#password_progress_digits").removeClass("alert-success").addClass("alert-danger");

		return result;
	};

	var	Check_NewPassword_DigitLocation = function(currTag)
	{
		var		curr_pass = currTag.val();
		var		result = false;

		if(curr_pass.match(/\D+\d+\D+/))
		{
			$("#password_progress_digits_location").removeClass("alert-danger").addClass("alert-success");
			result = true;
		}
		else
			$("#password_progress_digits_location").removeClass("alert-success").addClass("alert-danger");

		return result;
	};

	var	Check_NewPasswords_Parity = function()
	{
		var		result = false;

		if($("#regPassword").val() == $("#regConfirmPassword").val())
		{
			$("#passwords_parity").removeClass("alert-danger").addClass("alert-success");
			result = true;
		}
		else
			$("#passwords_parity").removeClass("alert-success").addClass("alert-danger");

		return result;
	};

	return {
		Init: Init,
		isRussianSymbol: isRussianSymbol,
		Check_NewPassword_Len: Check_NewPassword_Len,
		Check_NewPassword_Letters: Check_NewPassword_Letters,
		Check_NewPassword_Digits: Check_NewPassword_Digits,
		Check_NewPassword_DigitLocation: Check_NewPassword_DigitLocation,
		Check_NewPasswords_Parity: Check_NewPasswords_Parity
	};
})();

