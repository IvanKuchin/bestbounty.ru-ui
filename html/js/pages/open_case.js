/* jslint devel: true, indent: 4, maxerr: 50, esversion: 6 */
/* global helpdesk_ticket_obj */
/* exported open_case */

var	open_case = (function()
{
	"use strict";

	var	helpdesk_ticket_obj_global;

	var	Init = function()
	{
		helpdesk_ticket_obj_global = new helpdesk_ticket_obj();
		helpdesk_ticket_obj_global.FormType("open");
		
		$("#form_dom")				.append(helpdesk_ticket_obj_global.GetDOM());

		$("#severity_1")			.on("change", Select_S1);
		$("#S1_modal .btn-default")	.on("click", Fallback_S2);
	};

	var	Fallback_S2 = function()
	{
		$("#severity_2").click();
	};

	var	Select_S1 = function()
	{
		$("#S1_modal").modal("show");
	};

	return {
		Init: Init
	};

})();
