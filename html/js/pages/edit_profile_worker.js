// importScripts("/js/pages/common.js");

var ConvertHTMLToText = function(htmlText)
{
	var	result = htmlText;

	result = result.replace(/<br>/img, "\n");
	result = result.replace(/&amp;/img, "&");
	result = result.replace(/&lt;/img, "<");
	result = result.replace(/&gt;/img, ">");
	result = result.replace(/•/img, "*");
	result = result.replace(/&quot;/img, "\"");
	result = result.replace(/&#92;/img, "\\");
	result = result.replace(/&#39;/img, "'");
	result = result.replace(/^\s+/, '');
	result = result.replace(/\s+$/, '');

	return result;
};

onmessage = function(e)
{
	'use strict';

	var	JSON_dataForProfile;
	var	JSON_companyPosition = [];
	var	JSON_geoCountry = [];
	var	JSON_geoRegion = [];
	var	JSON_geoLocality = [];
	var	JSON_university = [];
	var	JSON_school = [];
	var	JSON_language = [];
	var	JSON_skill = [];

	var	JSONarrWithID_companyPosition = [];
	var	JSONarrWithID_geoCountry = [];
	var	JSONarrWithID_geoRegion = [];
	var	JSONarrWithID_geoLocality = [];
	var	JSONarrWithID_university = [];
	var	JSONarrWithID_school = [];
	var	JSONarrWithID_language = [];
	var	JSONarrWithID_skill = [];

	var	httpRequest;
	var	objGeoRegion = {};

	function ParseBulkData()
	{
		if(httpRequest.readyState === XMLHttpRequest.DONE) {
		  if(httpRequest.status === 200) {
		  	var		data = JSON.parse(httpRequest.responseText);
		  	var		obj2Send = {};

		  	JSON_dataForProfile = data;

			data.company_position.forEach(function(item, i, arr)
			{
				JSON_companyPosition.push(ConvertHTMLToText(item.title));
				JSONarrWithID_companyPosition.push({id:item.id, value:ConvertHTMLToText(item.title)});
			})

			data.geo_country.forEach(function(item, i, arr)
			{
				JSON_geoCountry.push(ConvertHTMLToText(item.title));
				JSONarrWithID_geoCountry.push({id:item.id, value:ConvertHTMLToText(item.title)});
			})

			data.geo_region.forEach(function(item, i, arr)
			{
				JSON_geoRegion.push(ConvertHTMLToText(item.title));
				JSONarrWithID_geoRegion.push({id:item.id, value:ConvertHTMLToText(item.title)});
				objGeoRegion[item.id] = ConvertHTMLToText(item.title);
			})

			data.geo_locality.forEach(function(item, i, arr)
			{
				JSON_geoLocality.push(ConvertHTMLToText(item.title) + (item.geo_region_id != "0" ? " (" + objGeoRegion[item.geo_region_id] + ")" : ""));
				JSONarrWithID_geoLocality.push({id:item.id, label:ConvertHTMLToText(item.title) + (item.geo_region_id != "0" ? " (" + objGeoRegion[item.geo_region_id] + ")" : "")});
			})

			data.university.forEach(function(item, i, arr)
			{
				JSON_university.push(ConvertHTMLToText(item.title));
				JSONarrWithID_university.push({id:item.id, value:ConvertHTMLToText(item.title)});
			})
			JSON_university = JSON_university.sort().filter(function(item, i, arr) { return !i || (arr[i] != arr[i-1]); });

			data.school.forEach(function(item, i, arr)
			{
				JSON_school.push(ConvertHTMLToText(item.title));
			})
			JSON_school = JSON_school.sort().filter(function(item, i, arr) { return !i || (arr[i] != arr[i-1]); });

			data.language.forEach(function(item, i, arr)
			{
				JSON_language.push(ConvertHTMLToText(item.title));
				JSONarrWithID_language.push({id:item.id, value:ConvertHTMLToText(item.title)});
			})

			data.skill.forEach(function(item, i, arr)
			{
				JSON_skill.push(ConvertHTMLToText(item.title));
				JSONarrWithID_skill.push({id:item.id, value:ConvertHTMLToText(item.title)});
			})
			JSON_skill = JSON_skill.sort().filter(function(item, i, arr) { return !i || (arr[i] != arr[i-1]); });

			obj2Send.JSON_dataForProfile = JSON_dataForProfile;

			obj2Send.JSON_companyPosition = JSON_companyPosition;
			obj2Send.JSON_geoCountry = JSON_geoCountry;
			obj2Send.JSON_geoRegion = JSON_geoRegion;
			obj2Send.JSON_geoLocality = JSON_geoLocality;
			obj2Send.JSON_university = JSON_university;
			obj2Send.JSON_school = JSON_school;
			obj2Send.JSON_language = JSON_language;
			obj2Send.JSON_skill = JSON_skill;

			obj2Send.JSONarrWithID_companyPosition = JSONarrWithID_companyPosition;
			obj2Send.JSONarrWithID_geoCountry = JSONarrWithID_geoCountry;
			obj2Send.JSONarrWithID_geoRegion = JSONarrWithID_geoRegion;
			obj2Send.JSONarrWithID_geoLocality = JSONarrWithID_geoLocality;
			obj2Send.JSONarrWithID_university = JSONarrWithID_university;
			obj2Send.JSONarrWithID_school = JSONarrWithID_school;
			obj2Send.JSONarrWithID_language = JSONarrWithID_language;
			obj2Send.JSONarrWithID_skill = JSONarrWithID_skill;

			postMessage(obj2Send);

		    close();
		  } else {
		    console.debug('ParseBulkData: ERROR: XMLHttpRequest returned not 200');
		  }
		}

	}

	httpRequest = new XMLHttpRequest();
	if(httpRequest)
	{
		httpRequest.onreadystatechange = ParseBulkData;
		httpRequest.open('GET', "/cgi-bin/index.cgi?action=AJAX_getDataForProfile&rand=" + Math.random() * 1234567890);
		httpRequest.send();
	}
	else
	{
		console.debug("edit_profile_worker:ERROR: creating XMLHttpRequest");
	}

/*
	$.getJSON('/cgi-bin/index.cgi?action=AJAX_getDataForProfile', {param1: ''})
			.done(function(data) {
				JSON_dataForProfile = data;

				data.geo_country.forEach(function(item, i, arr)
				{
					JSON_geoCountry.push(ConvertHTMLToText(item.title));
				})

				data.geo_region.forEach(function(item, i, arr)
				{
					JSON_geoRegion.push(ConvertHTMLToText(item.title));
				})

				data.geo_locality.forEach(function(item, i, arr)
				{
					JSON_geoLocality.push(ConvertHTMLToText(item.title));
				})

				data.university.forEach(function(item, i, arr)
				{
					JSON_university.push(ConvertHTMLToText(item.title));
				})
				jQuery.unique(JSON_university);

				data.school.forEach(function(item, i, arr)
				{
					JSON_school.push(ConvertHTMLToText(item.title));
				})
				jQuery.unique(JSON_school);

				data.language.forEach(function(item, i, arr)
				{
					JSON_language.push(ConvertHTMLToText(item.title));
				})

				data.skill.forEach(function(item, i, arr)
				{
					JSON_skill.push(ConvertHTMLToText(item.title));
				})
				jQuery.unique(JSON_skill);

				AddDataForProfileCollapsibleInit();
			});
*/
}


