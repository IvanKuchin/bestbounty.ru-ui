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

domain_replacer = (function ()
{
	'use strict';

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

