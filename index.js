var src = $('#grid');
var wrap = $('<div id="grid-overlay"></div>');
var gsize = 7;
var grid = 1802;

// these are 1 less due to counting from 0
var cols = 105; // does not really matter
var rows = 16; // matters alot.
var gridArea = (cols + 1) * (rows + 1);

var tmpRow;
var tmpCol;

/* Overlay */

var tbl = $('<table onmousedown="return false;"></table>');
for (var y = rows; y >= 0; y--) {
    var tr = $("<tr id='tr" + y + "'></tr>");
    for (var x = 0; x <= cols; x++) {
        var td = $("<td id='td" + x + "' rel-row='" + y + "' rel-col='" + x + "'></td>");
        td.css('width', gsize + 'px').css('height', gsize + 'px');
        td.addClass('unselected');
        tr.append(td);
    }
    tbl.append(tr);
}

// attach overlay
wrap.append(tbl);
src.after(wrap);

/* Formula functions */

var bitString = "";
var decimal = BigNumber;

var setBitString = function(string) {
    if (string.length > gridArea) bitError.text("Thats too big!"); else bitError.text("");
    bitString = string.replace(/0+$/g, "");
    $("#bitArea").val(bitString);
}

var setDecString = function(bigNum) {
    decimal = bigNum;

    var decString = decimal.toFixed();

    convertToWords(decString);

    if ($("#showCommas")[0].checked) {
        decString = decimal.toFormat(3).slice(0, -4)
    }

    $("#decArea").val(decString);
}

var convertToWords = function(decString) {
    $('#wordsArea').text(toWordsConverted(decString));
}

var setBitMap = function() {
    var i = 0;
    for (var x = 0; x <= cols; x++) {
        for (var y = 0; y <= rows; y++) {
            var tr = $("#tr" + y);
            var td = tr.find("#td" + x);

            var bit = bitString[i];

            if (bit == "0" || !bit) {
                td.addClass('unselected');
                td.removeClass('selected');
            }
            if (bit == "1") {
                td.addClass('selected');
                td.removeClass('unselected');                
            }
            i++;
        }
    }
}

var getDecimalFromMap = function () {
    var bitString = "";
    for (var y = 0; y <= cols; y++) {
        for (var x = 0; x <= rows; x++) {
            var boolBit = $("table #tr" + x + " #td" + y).hasClass('selected') ? 1 : 0;

            bitString += boolBit;
        }
    }
    var decimal = new BigNumber(bitString, 2)

    setBitString(bitString);
    setDecString(decimal.times(17));
    setPresetUrl();
}

/* Events */

$('#grid-overlay td').hover(function () {
    $(this).toggleClass('hover');
});

$('#grid-overlay td').mouseup(function () {
    let localRow = $(this).attr('rel-row');
    let localCol = $(this).attr('rel-col');
    for (let i = Math.min(tmpRow, localRow); i <= Math.max(tmpRow, localRow); i++) {
        for (let j = Math.min(tmpCol, localCol); j <= Math.max(tmpCol, localCol); j++) {
            $('#tr' + i + ' #td' + j).toggleClass('selected').toggleClass('unselected');
        }
    }
    getDecimalFromMap();
});

$('#grid-overlay td').mousedown(function () {
    tmpRow = $(this).attr('rel-row');
    tmpCol = $(this).attr('rel-col');
});

var bitError = $('#bitError');
var decError = $('#decError');

$('#bitArea').keyup(function() {
    input = $(this).val().replace(/ /g, '').replace(',', '');

    if(!/^[0-1]*$/.test(input) && input != "") bitError.text("Not a binary number.");
    else if (input != "") {
        bitError.text("");
        setBitString(input);
        setDecString(new BigNumber(input.padEnd(1802, 0), 2).times(17));
        setBitMap();
        setPresetUrl();
    } 
});

$('#decArea').keyup(function() {
    input = $(this).val().replace(/ /g, '').replace(',', '');

    if(!/^\d+$/.test(input) && input != "") decError.text("Not a positive number.");
    else if (input != "") {
        bigInput = new BigNumber(input);
        decError.text("");
        setBitString(bigInput.dividedBy(17).integerValue(BigNumber.ROUND_FLOOR).toString(2).padStart(1802, 0));
        setDecString(bigInput);
        setBitMap();
        setPresetUrl();
    }
});

$("#showCommas").click(function() {
    var decString = decimal.toFixed();

    if (this.checked) {
        decString = decimal.toFormat(3).slice(0, -4);
}

$("#decArea").val(decString);
});

String.prototype.repeat = function(num) {
    return new Array(num + 1).join(this);
}

$("#presets button").click(function() {
    var b = $(this);

    decError.text("");

    big = new BigNumber(b.attr('dec'));

    setDecString(big);

    // decimal = big;
    setBitString("0".repeat(parseInt(b.attr('p'))) + big.dividedBy(17).integerValue(BigNumber.ROUND_FLOOR).toString(2));
    setBitMap();
    setPresetUrl();
});


$("#presets #netpbm").change(function(evt) {
    var input = evt.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e){
        try {
            var image = NetPBM.load(e.target.result);
            var canvas = image.getCanvas().getContext("2d");
            var data = canvas.getImageData(0, 0, cols + 1, rows + 1).data;

            var bitString = "";
            for (var x = 0; x <= cols ; x++) {
                var offsetX = 4*x;
                for (var y = rows; y >= 0; y--) {
                    var offsetY = (cols + 1) * (y) * 4;
                    bitString += data[offsetY + offsetX] != 0 ? "0" : "1";
                }
            };
            bitError.text("");
            setBitString(bitString);

            decError.text("");
            setDecString(new BigNumber(bitString, 2).times(17));

            setBitMap();
            setPresetUrl();
        } catch (ex) {
            alert(ex.message);
        }
    }
    reader.readAsBinaryString(input);
});

function loadBase62Preset(base62String) {
    // Configure for digits + ASCII letters
    BigNumber.config({ ALPHABET: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' });
    try {
        const big = new BigNumber(base62String, 62).integerValue();
        decError.text("");
        setDecString(big.times(17));
        const bitString = big.toString(2);
        setBitString(bitString.padStart(1802, '0'));
        setBitMap();
    } catch (error) { }
}

function setPresetUrl() {
    const url = new URL(document.location);
    const params = url.searchParams;
    BigNumber.config({ ALPHABET: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' });
    const base62String = decimal.dividedBy(17).toString(62);
    if (base62String !== '0') {
        params.set('preset', base62String);
    } else {
        params.delete('preset');
    }
    window.history.replaceState({}, document.title, url.href);
}

// // Shorthand for $( document ).ready()
$(function () {
    const searchParams = new URLSearchParams(window.location.search);
    const base62 = searchParams.get('preset');
    if (base62 !== null) {
        loadBase62Preset(base62);
    }

    var intervalId;

    $('#startBtn').click(function () {
        var decValue = new BigNumber($('#decArea').val());
        var maxDecValue = new BigNumber('17').times(new BigNumber('2').exponentiatedBy(1802));

        intervalId = setInterval(function () {
            decValue = decValue.plus(17);
            if (decValue.isGreaterThan(maxDecValue)) {
                clearInterval(intervalId);
            } else {
                setDecString(decValue);
                setBitString(decValue.dividedBy(17).integerValue(BigNumber.ROUND_FLOOR).toString(2).padStart(1802, '0'));
                setBitMap();
                setPresetUrl();
            }
        }, 0);
    });

    $('#stopBtn').click(function () {
        clearInterval(intervalId);
    });
});

JavaScript code here
    $(document).ready(function() {
      $("#invertBtn").click(function() {
        var bitString = $("#bitArea").val(); // Get the bit string from the input field
        var invertedString = invertColors(bitString); // Invert the colors using the invertColors function
        $("#bitArea").val(invertedString); // Update the input field with the inverted string
        setBitString(invertedString); // Update the bit string in the logic
        setBitMap(); // Update the grid visualization
      });

      // Function to invert the colors
      function invertColors(str) {
        var invertedStr = "";
        for (var i = 0; i < str.length; i++) {
          if (str[i] === "0") {
            invertedStr += "1";
          } else if (str[i] === "1") {
            invertedStr += "0";
          } else {
            invertedStr += str[i];
          }
        }
        return invertedStr;
      }
    });




var units = new Array("one", "two", "three", "four", "five", "six", "seven", "eight", "nine");
var teens = new Array("ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen ", "nineteen");
var tens = new Array("twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety");
var illions = new Array('m', 'b', 'tr', 'quadr', 'quint', 'sext', 'sept', 'oct', 'non', // 10^6 - 10^30
'dec', 'undec', 'duodec', 'tredec', 'quattuordec', 'quindec', 'sexdec', 'septendec', 'octodec', 'novemdec', // 10^33 - 10^60
'vigint', 'unvigint', 'duovigint', 'trevigint', 'quattuorvigint', 'quinvigint', 'sexvigint', 'septenvigint', 'octovigint', 'novemvigint', // 10^63 - 10^90
'trigint', 'untrigint', 'duotrigint', 'tretrigint', 'quattuortrigint', 'quintrigint', 'sextrigint', 'septentrigint', 'octotrigint', 'novemtrigint', // 10^93 - 10^120
'quadragint', 'unquadragint', 'duoquadragint', 'trequadragint', 'quattuorquadragint', 'quinquadragint', 'sexquadragint', 'septenquadragint', 'octoquadragint', 'novemquadragint', // 10^123 - 10^150
'quinquagint', 'unquinquagint', 'duoquinquagint', 'trequinquagint', 'quattuorquinquagint', 'quinquinquagint', 'sexquinquagint', 'septenquinquagint', 'octoquinquagint', 'novemquinquagint', // 10^153 - 10^180
'sexagint', 'unsexagint', 'duosexagint', 'tresexagint', 'quattuorsexagint', 'quinsexagint', 'sexsexagint', 'septsexagint', 'octosexagint', 'novemsexagint', // 10^183 - 10^210
'septuagint', 'unseptuagint', 'duoseptuagint', 'treseptuagint', 'quattuorseptuagint', 'quinseptuagint', 'sexseptuagint', 'septseptuagint', 'octoseptuagint', 'novemseptuagint', // 10^213 - 10^240
'octogint', 'unoctogint', 'duooctogint', 'treoctogint', 'quattuoroctogint', 'quinoctogint', 'sexoctogint', 'septoctogint', 'octooctogint', 'novemoctogint', // 10^243 - 10^270
'nonagint', 'unnonagint', 'duononagint', 'trenonagint', 'quattuornonagint', 'quinnonagint', 'sexnonagint', 'septnonagint', 'octononagint', 'novemnonagint', // 10^273 - 10^300
'cent', 'cenunt', 'duocent', 'centret', 'quattuorcent', 'quinquacent', 'sexcent', 'septencent', 'octocent', 'novemcent', // 10^303 - 10^330
'decicent', 'undecicent', 'duodecicent', 'tredecicent', 'quattuordecicent', 'quindecicent', 'sexdecicent', 'septendecicent', 'octodecicent', 'novemdecicent', // 10^333 - 10^360
'viginticent', 'unviginticent', 'duoviginticent', 'treviginticent', 'quattuorviginticent', 'quinviginticent', 'sexviginticent', 'septenviginticent', 'octoviginticent', 'novemviginticent', // 10^363 - 10^390
'trigintacent', 'untrigintacent', 'duotrigintacent', 'tretrigintacent', 'quattuortrigintacent', 'quintrigintacent', 'sextrigintacent', 'septentrigintacent', 'octotrigintacent', 'novemtrigintacent', // 10^393 - 10^420
'quadragintacent', 'unquadragintacent', 'duoquadragintacent', 'trequadragintacent', 'quattuorquadragintacent', 'quinquadragintacent', 'sexquadragintacent', 'septenquadragintacent', 'octoquadragintacent', 'novemquadragintacent', // 10^423 - 10^450
'quinquagintacent', 'unquinquagintacent', 'duoquinquagintacent', 'trequinquagintacent', 'quattuorquinquagintacent', 'quinquinquagintacent', 'sexquinquagintacent', 'septenquinquagintacent', 'octoquinquagintacent', 'novemquinquagintacent', // 10^453 - 10^480
'sexagintacent', 'unsexagintacent', 'duosexagintacent', 'tresexagintacent', 'quattuorsexagintacent', 'quinsexagintacent', 'sexsexagintacent', 'septensexagintacent', 'octosexagintacent', 'novemsexagintacent', // 10^483 - 10^510
'septuagintacent', 'unseptuagintacent', 'duoseptuagintacent', 'treseptuagintacent', 'quattorseptuagintacent', 'quinseptuagintacent', 'sexseptuaginta', 'septenseptuagintacent', 'octoseptuagintacent', 'novemseptuagintacent', // 10^513 - 10^540
'octogintacent'); // We don't need numbers bigger than that: 17 * 2^1802, being an upper bound, is approximately 4,9 * 10^543.

function smallNum(num, mag) {
    var a = num.charAt(0);
    var b = num.charAt(1);
    var c = num.charAt(2);
    var s = "";
    if (a != 0) {
        s += units[a - 1] + " hundred";
        if (b == 0 && c == 0) return s;
        else s += " ";
    }
    if (b == 0) {
        if (c == 0) return "";
        return s + units[c - 1];
    }
    if (b == 1) {
        return s + teens[c];
    }
    if (b > 1) {
        s += tens[b - 2];
        if (c > 0) s += "-" + units[c - 1];
        return s;
    }
}

function fixChars() {
    var subject = document.forms.moose.num;
    var str = subject.value;
    var str2 = "";
    var L = str.length;
    var t;
    var f = false;
    for (var i = 0; i < L; i++) {
        t = str.charAt(i);
        if (t * 1 == t) {
            if (t != 0) f = true;
            if (f) str2 += t;
        }
    }
    if (str2 == "") str2 = "0"
    subject.value = str2;
}

// returns the value
function toWordsConverted(string) {
    // fixChars();
    var s = string
    // if (s.length > 315) {
    //     alert("Your number is " + s.length + " digits long.\nThe maximum length is 303  digits.");
    //     return false;
    // }
    var r = "",
        temp = "";
    while (s.length % 3 > 0) s = "0" + s;
    var max = Math.ceil(s.length / 3);
    for (var i = 0; i < max; i++) {
        temp = smallNum(s.substr(i * 3, 3));
        if (temp != "") {
            if (max - i == 1 && r != "" && s.substr(i * 3, 3) < 100) r += " ";
            else if (r != "") r += ", ";
            if (max - i == 2) temp += " thousand";
            if (max - i > 2) temp += " " + illions[max - i - 3] + "illion";
        }
        r += temp;
    }
    if (s == 0) r = "zero";
    r = r.charAt(0).toUpperCase() + r.substring(1, r.length) + ".";
    return r;
}


       






