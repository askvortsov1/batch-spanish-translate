var reader = new FileReader();
var array;
var resultingArray;
var count;
var percent;
var slider = document.getElementById("myBar");
var settings = {};
settings['specialCharacterMapping'] = {
    '~~u': 'ü', // This goes first to override u with accent
    '~a': 'á',
    '~A': 'Á',
    '~e': 'é',
    '~E': 'É',
    '~i': 'í',
    '~I': 'Í',
    '~o': 'ó',
    '~O': 'Ó',
    '~u': 'ú',
    '~U': 'Ú',
    '~!': '¡',
    '~~U': 'Ü',
    '~n': 'ñ',
    '~N': 'Ñ',
}
var width;
var URL = "https://cors.io/?http://www.spanishdict.com/translate/";
var serverTranslateAPIURL = "https://cors.io/?http://spanish.orgfree.com/translate.php";

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function checkCustomSelect(e) {
    var hiddenInput = jQuery('#' + e.target.name);
    if (e.target.value == 'custom') {
        hiddenInput.slideDown();
    } else {
        hiddenInput.slideUp();
    }
}

function populateCopyArea () {
    jQuery('.textCopyArea').val("");
    jQuery('.textCopyArea').html("");
    resultingArray.forEach(function(itemDefinitionList) {
        jQuery('.textCopyArea').val(jQuery('.textCopyArea').val() + itemDefinitionList[0] + "\t" + itemDefinitionList[1] + "\n");
    });
}

function copyQuizletTranslations() {
    populateCopyArea();
    /* Get the text field */
    var copyText = jQuery('.textCopyArea');

    /* Select the text field */
    copyText.select();

    /* Copy the text inside the text field */
    document.execCommand("copy");
}

function downloadTranslations() {
    let csvContent = "data:text/csv;charset=utf-8,Spanish Word,Translation\n";
    resultingArray.forEach(function (row) {
        csvContent += "\"" + row[0] + "\",\"" + row[1] + "\"\n";
    });
    var encodedUri = csvContent.replace(/\n/gm, "%0A").replace(/ /gm, "%20").replace(/-/gm, "%2D");
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Translated.csv");
    document.body.appendChild(link);

    link.click();
}

function getSettingsFromForm() {
    var _ = jQuery('#termDefinitionSeparatorSelect');
    if (_.val() != 'custom') {
        settings['termDefinitionSeparator'] = _.val();
    } else {
        settings['termDefinitionSeparator'] = jQuery('#termDefinitionSeparator').val()
    }
    var _ = jQuery('#cardSeparatorSelect');
    if (_.val() != 'custom') {
        settings['cardSeparator'] = _.val();
    } else {
        settings['cardSeparator'] = jQuery('#cardSeparator').val()
    }
    var _ = jQuery('#definitionSeparatorSelect');
    if (_.val() != 'custom') {
        settings['definitionSeparator'] = _.val();
    } else {
        settings['definitionSeparator'] = jQuery('#definitionSeparator').val()
    }
    settings['mode'] = jQuery('#modeSelect').val();
    settings['handleMultipleLanguages'] = settings['mode'].slice(-2);
    settings['removeArticles'] = jQuery('#removeArticles').is(":checked");
}

function initSystem() {
    width = 0;
    percent = 0;
    count = 0;
    array = [];
    resultingArray = [];
    slider.style.width = 0;
    slider.innerHTML = "0%";
    jQuery('.textCopyArea').val("");
    jQuery('.result').html("");
    jQuery('.result').hide();
    jQuery('.textCopyArea').html("");
    jQuery('.ResultsHeader').hide();
    getSettingsFromForm();
}

function moveSlider(percent) {
    slider.style.width = percent + '%';
    slider.innerHTML = percent * 1 + '%';
}

function removeArticlesFromString(string) {
    return string.replace(/(^([Ll]os|[Ll]as|[Ll]o|[Ll]a|[El]l|[Uu]nos|[Uu]nas|[Uu]na|un|the|a|an|[Tt]o) | ([Ll]os|[Ll]as|[Ll]o|[Ll]a|[El]l|unos|unas|una|un|the|a|an|[Tt]o)$)/gmi, "")
}

function displayResults() {
    jQuery('.result').html("");
    jQuery('.result').val("");
    resultingArray.forEach(function (row, index) {
        var item = row[0];
        var translated = row[1];
        var alerts = row[2];
        var alertString = "";
        var classStrings = {
            'danger': 'fas fa-exclamation-triangle text-danger',
            'warning': 'fas fa-exclamation-circle text-warning'
        }
        translated = translated.replace(/,/gm, settings['definitionSeparator']);
        alerts.forEach(function (item) {
            alertString += ` <a href="#!" data-toggle="tooltip" data-placement="top" title="${item[0]}"><i class="${classStrings[item[1]]}"></i></a>`
        });
        jQuery('.result').append(
            `<li class='col-sm-6 col-md-4 pl-1 pr-4'>
                    <strong><a href='#!' id='${index}term' class='link-uncolor term' onclick='addInput(this, event)' data-cardId='${index}' data-role=\"term\">${item}</a>: </strong><a href='#!' id='${index}translation' class='link-uncolor definition' onclick='addInput(this, event)' data-cardId="${index}" data-role=\"translation\">${translated}</a><span> ${alertString}</span><span id='inputarea${index}'></span>
                </li>`
        );
    });
}

function addTranslatedToResultArray(item, translated, alerts) {
    item = capitalize(item);
    translated = capitalize(translated);
    resultingArray[count] = [item, translated, alerts];
    //Move Slider
    count += 1;
    percent = 1.0 * count / array.length;
    percent *= 100
    moveSlider(Math.round(percent));
}

function translate(item, index) {
    item = item.replace(/(,)/gm, "").toLowerCase();
    if (settings['removeArticles']) {
        var urlItem = removeArticlesFromString(item)
    } else {
        var urlItem = item;
    }
    var block;
    var translated = "";
    var alerts = [];
    var found = false;
    $.get(URL + urlItem, function (data) {
        var reg = RegExp("<div id=\"translate-" + settings['handleMultipleLanguages'] + "\" (.+?)>(.+?)<\/div><span", "gi")
        try {
            if (reg.test(data)) {
                data = data.match(reg);
                data = data.join(" ");
            }
        } catch (e) {
            console.log(e);
        }
        if (data != null) {
            block = data.match(/<div class=\"el\">(.+?)<\/div>/gi);
            if (block != null) {
                translated = block.join(" ").replace(/<(?:.|\n)*?>/gi, '');
                found = true;
            }
        }
        if (!found) {
            $.get(
                serverTranslateAPIURL + "?text=" + encodeURI(item) + "&lang=" + settings['mode'],
                function (data) {
                    if (data) {
                        translated = data.replace(/(\+)/gm, " ");
                        alerts.push(["Our system has detected a higher-than-average chance of errors for this translation. Please be sure to check it. Yopu can make changes by clicking on it.", 'warning']);
                    } else {
                        translated = "NO TRANSLATION FOUND";
                        alerts.push(["No translation was found. You can enter a custom translation by clicking the definition below.", 'danger']);
                    }
                    addTranslatedToResultArray(item, translated, alerts);
                }
            );
        } else {
            var sourceString = data.match(/<div class="source"><h1 .+?>(.+?)<\/h1>/i)[1];
            if (removeArticlesFromString(item.toLowerCase()) != removeArticlesFromString(sourceString.toLowerCase())) {
                alerts.push([`Term may have been entered incorrectly. My guess for the term is ${capitalize(sourceString)}. Click on the term to make changes.`, 'warning'])
            }
            addTranslatedToResultArray(item, translated, alerts);
        }
    });
}

function respondToAjax() {
    $(document).ajaxStop(function () {
        if (array.length == count) {
            jQuery('.result').slideDown();
            jQuery('.ResultsHeader').slideDown();
        } else {
            alert("Network issue, please try again. Check your internet connection, and reload the page if the error persists.");
        }
        jQuery('html, body').animate({ scrollTop:  jQuery('.result').offset().top - 50 });
        displayResults();
    });
}

function handleFileSelect(e) {
    var files = e.target.files; // FileList object

    // use the 1st file from the list
    f = files[0];

    // Closure to capture the file information.
    reader.onload = (function (theFile) {
        return function (e) {
            array = e.target.result.split("\n");
            array.forEach(function (item) {
                var currentValue = jQuery('#textarea').val();
                jQuery('#textarea').val(currentValue + item + ',')
            });
        };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsText(f);
    jQuery('#enterText-tab').trigger("click");
    reader = new FileReader();

}

function handleTranslateButtonClick() {
    jQuery('#enterText-tab').trigger("click");
    var content = jQuery('#textarea').val();

    if (content == '') {
        jQuery('#errorMessageInner').html("Input box cannot be blank");
        jQuery('#errorMessage').slideDown();
        return;
    } else {
        jQuery('#errorMessage').slideUp();
    }

    initSystem();

    //Remove Whitespace
    content = content.replace(/\n+?/gm, "").replace(/\s+?/gm, " ").replace(/, +?/gm, ",").replace(/,$/gm, "")

    array = content.split(',');
    array.forEach(translate);
    respondToAjax();
}

function addInput(e) {
    var id = e.dataset["cardid"];
    jQuery('#inputarea' + id).html("<input id='" + id + "Input' class='form-control' style='max-width: 80%'></input>");
    var inputField = jQuery('#' + id + 'Input');
    inputField.value = e.innerHTML;
    inputField.attr("value", e.innerHTML);
    inputField.on("input", function (e) {handleSpecialCharacterEntry(e);});
    inputField.on("input", function() {
        e.innerHTML = inputField.val();
        var term = jQuery('#' + id + 'term').html().replace(/(^\s+?|\s+?$)/gm, "");
        var translated = jQuery('#' + id + 'translation').html().replace(/(^\s+?|\s+?$)/gm, "");
        resultingArray[id] = [term, translated];
    });
    inputField.trigger("focus");
    inputField.on('focusout', function () {
        inputField.remove()
    });
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function saveSettings() {
    jQuery('#enterText-tab').trigger("click");
    var name = "settings"
    var value = ""
    for (var key in settings) {
        var value = settings[key];
        value += key + ":" + value + "~";
    }
    setCookie(name, value, 3000);
}

function importCookies() {
    var cookie = getCookie("settings");
    if (!cookie) { return; };
    var cookieList = cookie.split("~");
    for (var i = 0; i < cookieList.length; i++) {
        var c = cookieList[i];
        for (var key in settings) {
            var regex = new RegExp(key + ":", "gmi");
            if (c.indexOf(key + ":") == 0) {
                settings[key] = c.replace(regex, "");
            }
        }
    }
    for (var key in settings) {
        jQuery('#' + key + 'Select').val(settings[key]);
    }
}

function handleSpecialCharacterEntry(e) {
    var mapping = settings['specialCharacterMapping'];
    var element = e.target;
    var reg = RegExp("(" + Object.keys(mapping).join("|") + ")", 'gm')
    var new_value = element.value.replace(reg, function (g1) {
        return mapping[g1];
    });
    element.value = new_value;
}

importCookies();
initSystem();

jQuery('#textarea').on("input", function (e) {handleSpecialCharacterEntry(e)});
jQuery('#submit').click(handleTranslateButtonClick);
jQuery('#upload').change(handleFileSelect);