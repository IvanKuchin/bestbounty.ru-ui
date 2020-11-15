/*jslint devel: true, indent: 4, maxerr: 50*/
/* exported domain_replacer */


var domain_replacer = (function ()
{
	"use strict";

	var Init = function()
	{
		ReplaceSpanTagWithDomainName();
	};

	var	GetCurrentDomain = function()
	{
		return window.location.origin;
	};

	var	GetCurrentSuperDomain = function()
	{
		var domain = window.location.origin;
		var	dot_index = domain.indexOf(".");

		if(dot_index > 0)
		{
			domain = domain.substring(dot_index + 1);
		}

		return domain;
	};

	var	ReplaceSpanTagWithDomainName = function()
	{
		$(".__domain_href")	.empty().append(GetCurrentDomain());
		$(".__domain_email").empty().append(GetCurrentSuperDomain());
		$("a.__attr_email")			.attr("href", "mailto:info@" + GetCurrentSuperDomain());
	};

	return {
		Init					: Init,
	};
})();

