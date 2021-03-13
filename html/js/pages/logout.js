var	logout = logout || {};

logout.redirToMain = function()
{
	window.location.replace("/showmain?rand=" + Math.random()*98765432123456);
};

$(document).ready(function() 
{
	localStorage.removeItem("sessid");

	window.setTimeout(logout.redirToMain, 5000);
});
