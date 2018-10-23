var reader = new FileReader();
var array;
var resultingArray;
var count;
var percent;
var slider = document.getElementById("myBar");
var handleMultipleLanguages;
var termDefinitionSeparator;
var cardSeparator;
var removeArticles;
var width;
var URL = "https://cors.io/?http://www.spanishdict.com/translate/";

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

function copyQuizletTranslations() {
    /* Get the text field */
    var copyText = jQuery('.textCopyArea');

    /* Select the text field */
    copyText.select();

    /* Copy the text inside the text field */
    document.execCommand("copy");
}

function downloadTranslations() {
    let csvContent = "data:text/csv;charset=utf-8,";
    resultingArray.forEach(function (row) {
        csvContent += row;
    });
    var encodedUri = csvContent.replace(/\n/gm, "%0A").replace(/ /gm, "%20").replace(/-/gm, "%2D");
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Translated.csv");
    document.body.appendChild(link);

    link.click();
}

function initSystem() {
    width = 0;
    percent = 0;
    count = 0;
    array = [];
    resultingArray = [];
    resultingArray = ["Spanish Word,Translation",];
    slider.style.width = 0;
    slider.innerHTML = "0%";
    var _ = jQuery('#termDefinitionSeparatorSelect');
    if (_.val() != 'custom') {
        termDefinitionSeparator = _.val();
    } else {
        termDefinitionSeparator = jQuery('#termDefinitionSeparator').val()
    }
    var _ = jQuery('#cardSeparatorSelect');
    if (_.val() != 'custom') {
        cardSeparator = _.val();
    } else {
        cardSeparator = jQuery('#cardSeparator').val()
    }
    handleMultipleLanguages = jQuery("input[name='multipleTranslationOptions']:checked").val();
    removeArticles = jQuery('#removeArticles').is(":checked");
    jQuery('.result').html("");
    jQuery('.result').hide();
    jQuery('.textCopyArea').html();
    jQuery('.ResultsHeader').hide();
}

function move(percent) {
    slider.style.width = percent + '%';
    slider.innerHTML = percent * 1 + '%';
}

function translate(item, index) {
    item = item.replace(/(,)/gm, "").toLowerCase();
    if (removeArticles) {
        var urlItem = item.replace(/(^([Ll]os|[Ll]as|[Ll]o|[Ll]a|[El]l|unos|unas|una|un|the|a|an) | ([Ll]os|[Ll]as|[Ll]o|[Ll]a|[El]l|unos|unas|una|un|the|a|an)$)/gm, "")
    } else {
        var urlItem = item;
    }
    var block;
    var translated = "";
    $.get(URL + urlItem, function (data) {
        var reg = /<div id=\"translate-e[sn]\" (.+?)>(.+?)<\/div><span/gi;
        if (reg.test(data)) {
            if (handleMultipleLanguages == 'es') {
                data = data.match(/<div id=\"translate-es\" (.+?)>(.+?)<\/div><span/gi);
                data = data.join(" ");
            } else if (handleMultipleLanguages == 'en') {
                data = data.match(/<div id=\"translate-en\" (.+?)>(.+?)<\/div><span/gi);
                data = data.join(" ");
            }
        }
        if (data == null) {
            translated = "NO TRANSLATION FOUND"
        } else {
            block = data.match(/<div class=\"el\">(.+?)<\/div>/gi);
            if (block == null) {
                translated = "NO TRANSLATION FOUND"
            } else {
                translated = block.join(" ").replace(/<(?:.|\n)*?>/g, '');
            }
        }
        item = capitalize(item);
        if (translated != "NO TRANSLATION FOUND") {
            translated = capitalize(translated);
        }
        jQuery('.result').append("<li class='col-sm-6 col-md-4'><strong>" + item + ": </strong> " + translated + "</li>");
        jQuery('.textCopyArea').append(item + termDefinitionSeparator + translated + cardSeparator);
        var string = ("\"" + capitalize(item) + "\",\"" + translated + "\"").replace(/(\r\n\t|\n|\r\t|\r|\t)/gm, "") + "\n";
        resultingArray.push(string);
        count += 1;
        percent = 1.0 * count / array.length;
        percent *= 100
        move(Math.round(percent));
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
    });
}

function handleFileSelect(e) {
    var files = e.target.files; // FileList object

    // use the 1st file from the list
    f = files[0];

    initSystem();

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

initSystem();
jQuery('#submit').click(handleTranslateButtonClick);
jQuery('#upload').change(handleFileSelect);