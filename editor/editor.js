/* inspired by https://gist.github.com/1129031 */
/*global document, DOMParser*/

(function(DOMParser) {
	"use strict";

	var
	  proto = DOMParser.prototype
	, nativeParse = proto.parseFromString
	;

	// Firefox/Opera/IE throw errors on unsupported types
	try {
		// WebKit returns null on unsupported types
		if ((new DOMParser()).parseFromString("", "text/html")) {
			// text/html parsing is natively supported
			return;
		}
	} catch (ex) {}

	proto.parseFromString = function(markup, type) {
		if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
			var
			  doc = document.implementation.createHTMLDocument("")
			;
	      		if (markup.toLowerCase().indexOf('<!doctype') > -1) {
        			doc.documentElement.innerHTML = markup;
      			}
      			else {
        			doc.body.innerHTML = markup;
      			}
			return doc;
		} else {
			return nativeParse.apply(this, arguments);
		}
	};
}(DOMParser));

var DictEditor = {
	abbrKeys: [],
	abbrValues: [],
	abbrComboSrc: "",
	
	getDict: function (file) {
		var fileObj = document.getElementById(file).files[0];
		var reader = new FileReader();
		reader.onloadend = function (evt)
		{
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(evt.target.result, "text/xml");
			var wordNodes = xmlDoc.evaluate("//xdxf/lexicon/ar", xmlDoc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			var entryCter = 0;
			
			DictEditor.abbrComboSrc = "<select class=\"form-control\">";
			abbrKeysObj = xmlDoc.evaluate("//xdxf/meta_info/abbreviations/abbr_def/abbr_k", xmlDoc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			abbrValuesObj = xmlDoc.evaluate("//xdxf/meta_info/abbreviations/abbr_def/abbr_v", xmlDoc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			var abbrKey = abbrKeysObj.iterateNext();
			var abbrValue = abbrValuesObj.iterateNext();
			while (abbrKey) {
				DictEditor.abbrKeys.push(abbrKey.textContent);
				DictEditor.abbrValues.push(abbrValue.textContent);
				DictEditor.abbrComboSrc += "<option value=\"" + abbrKey.textContent + "\">" + abbrValue.textContent + "</option>";
				abbrKey = abbrKeysObj.iterateNext();
				abbrValue = abbrValuesObj.iterateNext();
			}
			DictEditor.abbrComboSrc += "</select>";
			
			document.getElementById("txtTitle").value = xmlDoc.evaluate("//xdxf/meta_info/title", xmlDoc, null, XPathResult.STRING_TYPE, null).stringValue;
			document.getElementById("txtFullTitle").value = xmlDoc.evaluate("//xdxf/meta_info/full_title", xmlDoc, null, XPathResult.STRING_TYPE, null).stringValue;
			document.getElementById("areaDescription").value = xmlDoc.evaluate("//xdxf/meta_info/description", xmlDoc, null, XPathResult.STRING_TYPE, null).stringValue;
			document.getElementById("txtVersion").value = xmlDoc.evaluate("//xdxf/meta_info/file_ver", xmlDoc, null, XPathResult.STRING_TYPE, null).stringValue;
			document.getElementById("txtCreation").value = xmlDoc.evaluate("//xdxf/meta_info/creation_date", xmlDoc, null, XPathResult.STRING_TYPE, null).stringValue;
			
			
			var entry = wordNodes.iterateNext();
			while (entry) {
				entryCter++;
				
				var words = "", definition = "", partSpeech = "", example = "";
				for (var j = 0;j < entry.children.length;j++) {
					switch (entry.children[j].nodeName) {
						case "k":
							words += entry.children[j].innerHTML.replace("<![CDATA[", "").replace("]]>", "") + "\n";
							break;
						case "def":
							definition = xmlDoc.evaluate("deftext", entry.children[j], null, XPathResult.STRING_TYPE, null).stringValue;
							partSpeech = xmlDoc.evaluate("gr/abbr", entry.children[j], null, XPathResult.STRING_TYPE, null).stringValue;
							example = xmlDoc.evaluate("ex", entry.children[j], null, XPathResult.STRING_TYPE, null).stringValue;
							break;
					}
				}
				
				var row = document.querySelector("#tblDict>tbody").insertRow();
				row.id = "row_" + entryCter;
				
				var cell1 = row.insertCell();
				cell1.innerHTML = entryCter;
				var cell2 = row.insertCell();
				cell2.innerHTML = "<textarea class=\"form-control\">" + words + "</textarea>";
				var cell3 = row.insertCell();
				cell3.innerHTML = DictEditor.abbrComboSrc;
				cell3.children[0].value = partSpeech;
				var cell4 = row.insertCell();
				cell4.innerHTML = "<textarea class=\"form-control\">" + definition + "</textarea>";
				var cell5 = row.insertCell();
				cell5.innerHTML = "<textarea class=\"form-control\">" + example + "</textarea>";
				var cell6 = row.insertCell();
				cell6.innerHTML = "<a href=\"javascript:DictEditor.removeRow(" + entryCter + ");\"><b class=\"glyphicon glyphicon-remove\"></b></a>";
				
				entry = wordNodes.iterateNext();
			}
		}
		
		var blob = fileObj.slice(0, fileObj.size);
		reader.readAsText(blob, "utf-8");
	},
	
	removeRow: function (ref) {
		document.getElementById("row_" + ref).remove();
	},
	
	addRow: function () {
		var rows = document.querySelectorAll("#tblDict>tbody>tr");
		var newNdx = 0;
		
		for (var i = 0;i < rows.length;i++) {
			newNdx = Math.max(newNdx, parseInt(rows[i].id.substr(4, 3)));
		}
		newNdx++;
		
		var row = document.querySelector("#tblDict>tbody").insertRow();
		row.id = "row_" + newNdx;
		
		var cell1 = row.insertCell();
		cell1.innerHTML = newNdx;
		var cell2 = row.insertCell();
		cell2.innerHTML = "<textarea class=\"form-control\"></textarea>";
		var cell3 = row.insertCell();
		cell3.innerHTML = DictEditor.abbrComboSrc;
		var cell4 = row.insertCell();
		cell4.innerHTML = "<textarea class=\"form-control\"></textarea>";
		var cell5 = row.insertCell();
		cell5.innerHTML = "<textarea class=\"form-control\"></textarea>";
		var cell6 = row.insertCell();
		cell6.innerHTML = "<a href=\"javascript:DictEditor.removeRow(" + newNdx + ");\"><b class=\"glyphicon glyphicon-remove\"></b></a>";
	},
	
	save: function () {
		var rows = document.querySelectorAll("#tblDict>tbody>tr");
		var xmlSrc = "";
		var title =  document.getElementById("txtTitle").value;
		var fullTitle =  document.getElementById("txtFullTitle").value;
		var description =  document.getElementById("areaDescription").value;
		var version =  document.getElementById("txtVersion").value;
		var creation =  document.getElementById("txtCreation").value;
		
		var entries = [];
		
		for (i = 0;i < rows.length;i++) {
			var wordObj = rows[i].children[1].children[0].value.split("\n");
			var words = [];
			for (var j = 0;j < wordObj.length;j++) {
				if (wordObj[j] != "") {
					words.push(wordObj[j]);
				}
			}
			var partSpeech = rows[i].children[2].children[0].value;
			var definition = rows[i].children[3].children[0].value;
			var example = rows[i].children[4].children[0].value;
			
			entries.push({
				"word": words[0],
				"words": words,
				"part": partSpeech,
				"definition": definition,
				"example": example
			});
		}
		entries.sort(keysrt("word"));
		
		xmlSrc += "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
		xmlSrc += "\n<!DOCTYPE xdxf SYSTEM \"https://raw.github.com/soshial/xdxf_makedict/master/format_standard/xdxf_strict.dtd\">";
		xmlSrc += "\n<xdxf lang_from=\"BUL\" lang_to=\"BUL\" format=\"logical\">";
		xmlSrc += "\n\t<meta_info>";
		xmlSrc += "\n\t\t<title><![CDATA[" + title + "]]></title>";
		xmlSrc += "\n\t\t<full_title><![CDATA[" + fullTitle + "]]></full_title>";
		xmlSrc += "\n\t\t<description><![CDATA[" + description + "]]></description>";
		
		xmlSrc += "\n\t\t<abbreviations>";
		for (var i = 0;i < DictEditor.abbrKeys.length;i++) {
			xmlSrc += "\n\t\t\t<abbr_def>";
			xmlSrc += "\n\t\t\t\t<abbr_k><![CDATA[" + DictEditor.abbrKeys[i] + "]]></abbr_k>";
			xmlSrc += "\n\t\t\t\t<abbr_v><![CDATA[" + DictEditor.abbrValues[i] + "]]></abbr_v>";
			xmlSrc += "\n\t\t\t</abbr_def>";
		}
		xmlSrc += "\n\t\t</abbreviations>";
		
		xmlSrc += "\n\t\t<file_ver><![CDATA[" + version + "]]></file_ver>";
		xmlSrc += "\n\t\t<creation_date><![CDATA[" + creation + "]]></creation_date>";
		xmlSrc += "\n\t</meta_info>";
		
		xmlSrc += "\n\t<lexicon>";
		for (var i = 0;i < entries.length;i++) {
			xmlSrc += "\n\t\t<ar>";
			for (var j = 0;j < entries[i].words.length;j++) {
				xmlSrc += "\n\t\t\t<k><![CDATA[" + entries[i].words[j] + "]]></k>";
			}
			xmlSrc += "\n\t\t\t<def>";
			xmlSrc += "\n\t\t\t\t<gr>";
			xmlSrc += "\n\t\t\t\t\t<abbr><![CDATA[" + entries[i].part + "]]></abbr>";
			xmlSrc += "\n\t\t\t\t</gr>";
			xmlSrc += "\n\t\t\t\t<deftext><![CDATA[" + entries[i].definition + "]]></deftext>";
			if (entries[i].example != "") {
				xmlSrc += "\n\t\t\t\t<ex><![CDATA[" + entries[i].example + "]]></ex>";
			}
			xmlSrc += "\n\t\t\t</def>";
			xmlSrc += "\n\t\t</ar>";
		}
		xmlSrc += "\n\t</lexicon>";
		xmlSrc += "\n</xdxf>";
		
		download(xmlSrc, "dictionary.xdxf", "text/xml");
	},
	
	exportFile: function () {
		switch (document.getElementById("slctExport").value) {
			case "full":
				DictEditor.exportFull();
				break;
			case "short":
				DictEditor.exportShort();
				break;
			case "csv":
				DictEditor.exportCSV();
				break;
		}
	},
	
	exportFull: function () {
		var rows = document.querySelectorAll("#tblDict>tbody>tr");
		var htmlSrc = "";
		var title =  document.getElementById("txtTitle").value;
		var fullTitle =  document.getElementById("txtFullTitle").value;
		var description =  document.getElementById("areaDescription").value;
		var version =  document.getElementById("txtVersion").value;
		var creation =  document.getElementById("txtCreation").value;
		
		var entries = [];
		
		for (i = 0;i < rows.length;i++) {
			var wordObj = rows[i].children[1].children[0].value.split("\n");
			var words = [];
			for (var j = 0;j < wordObj.length;j++) {
				if (wordObj[j] != "") {
					words.push(wordObj[j]);
				}
			}
			var partSpeech = rows[i].children[2].children[0].value;
			var definition = rows[i].children[3].children[0].value;
			var example = rows[i].children[4].children[0].value;
			
			entries.push({
				"word": words[0],
				"words": words,
				"part": partSpeech,
				"definition": definition,
				"example": example
			});
		}
		entries.sort(keysrt("word"));
		
		htmlSrc += "<!DOCTYPE html>";
		htmlSrc += "<html>";
		htmlSrc += "<head><title>" + title + "</title><meta charset=\"utf8\" /><link rel=\"stylesheet\" href=\"https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css\"></head>";
		htmlSrc += "<body>";
		
		htmlSrc += "<div class=\"container\">";
		htmlSrc += "<h1>" + fullTitle + "&nbsp;&nbsp;&nbsp;<small>(ver. " + version + ", " + creation + ")</small></h1>";
		htmlSrc += "<p>" + description + "</p><hr />";
		
		for (var i = 0;i < entries.length;i++) {
			htmlSrc += "<h3 id=\"" + entries[i].word + "\"><code>" + entries[i].word + "</code>&nbsp;&nbsp;&nbsp;<small>[" + entries[i].part + "]</small></h3>";
			if (entries[i].words.length > 1) {
				entries[i].words.splice(0, 1);
				htmlSrc += "<em class=\"text-muted\">Среща се и като</em>&nbsp;";
				htmlSrc += "<code>" + entries[i].words.join("</code>&nbsp;<code>") + "</code>";
				htmlSrc += "<br />";
			}
			htmlSrc += "<br /><p class=\"lead\">" + entries[i].definition.replace(/\<kref idref\=\"(.+)\"\>(.+)\<\/kref\>/, "<a href=\"#$1\">$2</a>") + "</p>";
			if (entries[i].example != "") {
				htmlSrc += "<p><em class=\"text-muted\">Пример в изречение:</em>&nbsp;&nbsp;\"" + entries[i].example.replace(/\<kref idref\=\"(.+)\"\>(.+)\<\/kref\>/, "<a href=\"#$1\">$2</a>") + "\"</p>";
			}			
			htmlSrc += "<hr />";
		}
		
		htmlSrc += "</div>";
		
		htmlSrc += "</body>";
		htmlSrc += "</html>";
		
		download(htmlSrc, "dictionary_full.html", "text/html");
	},
	
	exportShort: function () {
		var rows = document.querySelectorAll("#tblDict>tbody>tr");
		var htmlSrc = "";
		var title =  document.getElementById("txtTitle").value;
		var fullTitle =  document.getElementById("txtFullTitle").value;
		var description =  document.getElementById("areaDescription").value;
		var version =  document.getElementById("txtVersion").value;
		var creation =  document.getElementById("txtCreation").value;
		
		var entries = [];
		
		for (i = 0;i < rows.length;i++) {
			var wordObj = rows[i].children[1].children[0].value.split("\n");
			var words = [];
			for (var j = 0;j < wordObj.length;j++) {
				if (wordObj[j] != "") {
					words.push(wordObj[j]);
				}
			}
			var partSpeech = rows[i].children[2].children[0].value;
			var definition = rows[i].children[3].children[0].value;
			var example = rows[i].children[4].children[0].value;
			
			entries.push({
				"word": words[0],
				"words": words,
				"part": partSpeech,
				"definition": definition,
				"example": example
			});
		}
		entries.sort(keysrt("word"));
		
		htmlSrc += "<!DOCTYPE html>";
		htmlSrc += "<html>";
		htmlSrc += "<head><title>" + title + "</title><meta charset=\"utf8\" /><link rel=\"stylesheet\" href=\"https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css\"></head>";
		htmlSrc += "<body>";
		
		htmlSrc += "<div class=\"container\">";
		htmlSrc += "<h1>" + fullTitle + "&nbsp;&nbsp;&nbsp;<small>(ver. " + version + ", " + creation + ")</small></h1>";
		htmlSrc += "<p>" + description + "</p><hr />";
		for (var i = 0;i < Math.ceil(entries.length / 3);i++) {
			htmlSrc += "<div class=\"row\">";
			
			htmlSrc += "<div class=\"col-md-4\">";
			htmlSrc += "<h4 id=\"" + entries[i * 3].word + "\"><code>" + entries[i * 3].word + "</code>";
			if (entries[i * 3].words.length > 1) {
				entries[i * 3].words.splice(0, 1);
				htmlSrc += "&nbsp;<small>(" + entries[i * 3].words.join(", ") + ")</small></h4>";
			} else {
				htmlSrc += "</h4>";
			}
			htmlSrc += "<p><em>" + entries[i * 3].part + "</em></p>";
			htmlSrc += "<p>" + entries[i * 3].definition.replace(/\<kref idref\=\"(.+)\"\>(.+)\<\/kref\>/, "<a href=\"#$1\">$2</a>") + "</p>";
			htmlSrc += "</div>";
			
			if (entries[i * 3 + 1]) {
				htmlSrc += "<div class=\"col-md-4\">";
				htmlSrc += "<h4 id=\"" + entries[i * 3 + 1].word + "\"><code>" + entries[i * 3 + 1].word + "</code>";
				if (entries[i * 3 + 1].words.length > 1) {
					entries[i * 3 + 1].words.splice(0, 1);
					htmlSrc += "&nbsp;<small>(" + entries[i * 3 + 1].words.join(", ") + ")</small></h4>";
				} else {
					htmlSrc += "</h4>";
				}
				htmlSrc += "<p><em>" + entries[i * 3 + 1].part + "</em></p>";
				htmlSrc += "<p>" + entries[i * 3 + 1].definition.replace(/\<kref idref\=\"(.+)\"\>(.+)\<\/kref\>/, "<a href=\"#$1\">$2</a>") + "</p>";
				htmlSrc += "</div>";
			}
			
			if (entries[i * 3 + 2]) {
				htmlSrc += "<div class=\"col-md-4\">";
				htmlSrc += "<h4 id=\"" + entries[i * 3 + 2].word + "\"><code>" + entries[i * 3 + 2].word + "</code>";
				if (entries[i * 3 + 2].words.length > 1) {
					entries[i * 3 + 2].words.splice(0, 1);
					htmlSrc += "&nbsp;<small>(" + entries[i * 3 + 2].words.join(", ") + ")</small></h4>";
				} else {
					htmlSrc += "</h4>";
				}
				htmlSrc += "<p><em>" + entries[i * 3 + 2].part + "</em></p>";
				htmlSrc += "<p>" + entries[i * 3 + 2].definition.replace(/\<kref idref\=\"(.+)\"\>(.+)\<\/kref\>/, "<a href=\"#$1\">$2</a>") + "</p>";
				htmlSrc += "</div>";
			}
			
			htmlSrc += "</div>";
			htmlSrc += "<hr />";
		}
		
		htmlSrc += "</body>";
		htmlSrc += "</html>";
		
		download(htmlSrc, "dictionary_short.html", "text/html");
	},
	
	exportCSV: function () {
		var rows = document.querySelectorAll("#tblDict>tbody>tr");
		var csvSrc = "";
		var title =  document.getElementById("txtTitle").value;
		var fullTitle =  document.getElementById("txtFullTitle").value;
		var description =  document.getElementById("areaDescription").value;
		var version =  document.getElementById("txtVersion").value;
		var creation =  document.getElementById("txtCreation").value;
		
		var entries = [];
		
		for (i = 0;i < rows.length;i++) {
			var wordObj = rows[i].children[1].children[0].value.split("\n");
			var words = [];
			for (var j = 0;j < wordObj.length;j++) {
				if (wordObj[j] != "") {
					words.push(wordObj[j]);
				}
			}
			var partSpeech = rows[i].children[2].children[0].value;
			var definition = rows[i].children[3].children[0].value;
			var example = rows[i].children[4].children[0].value;
			
			entries.push({
				"word": words[0],
				"words": words,
				"part": partSpeech,
				"definition": definition,
				"example": example
			});
		}
		entries.sort(keysrt("word"));
		
		for (var i = 0;i < entries.length;i++) {
			csvSrc += "\"" + entries[i].word.replace(/\"/g, "\\\"") + "\",";
			if (entries[i].words.length > 1) {
				entries[i].words.splice(0, 1);
				csvSrc += "\"" + entries[i].words.join(", ").replace(/\"/g, "\\\"") + "\",";
			} else {
				csvSrc += "\"\",";
			}
			csvSrc += "\"" + entries[i].definition.replace(/\"/g, "\\\"") + "\",";
			csvSrc += "\"" + entries[i].example.replace(/\"/g, "\\\"") + "\"\n";
		}
		
		download(csvSrc, "dictionary.csv", "text/csv");
	}
}

function keysrt (key, desc) {
	return function (a, b) {
		return desc ? ~~(a[key].toLowerCase() < b[key].toLowerCase()) : ~~(a[key].toLowerCase() > b[key].toLowerCase());
	}
}