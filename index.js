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
  $('#stringArea').text(base62String);

if (base62String !== '0') {
    params.set('preset', base62String);
  } else {
    params.delete('preset');
  }
  window.history.replaceState({}, document.title, url.href);
}


var savedValue;

$('#saveValueBtn').click(function () {
    savedValue = new BigNumber($('#decArea').val());
    console.log(`Value ${savedValue} saved`);
});

$('#addSavedValueBtn').click(function () {
    if (savedValue) {
        var currentDecValue = new BigNumber($('#decArea').val());
        var newDecValue = currentDecValue.plus(savedValue);
        setDecString(newDecValue);
        setBitString(newDecValue.dividedBy(17).integerValue(BigNumber.ROUND_FLOOR).toString(2).padStart(1802, '0'));
        setBitMap();
        setPresetUrl();
    } else {
        console.log('No saved value to add');
    }
});


var valuesArray = [];
var playInterval;

function displayError(index, value) {
    console.log(`Error ${index + 1}: ${value.toString(62)}`);
}

$('#saveToArrayBtn').click(function () {
    var currentDecValue = new BigNumber($('#decArea').val());
    valuesArray.push(currentDecValue);
    displayError(valuesArray.length - 1, currentDecValue);
});

$('#displayErrorBtn').click(function () {
    for (var i = 0; i < valuesArray.length; i++) {
        displayError(i, valuesArray[i]);
    }
});

$('#clearOldestValueBtn').click(function () {
    if (valuesArray.length > 0) {
        valuesArray.shift();
    }
});




$('#playBtn').click(function () {
    var index = 0;
    playInterval = setInterval(function () {
        if (index < valuesArray.length) {
            var decValue = valuesArray[index];
            setDecString(decValue);
            setBitString(decValue.dividedBy(17).integerValue(BigNumber.ROUND_FLOOR).toString(2).padStart(1802, '0'));
            setBitMap();
            setPresetUrl();
            index++;
        } else {
            clearInterval(playInterval);
        }
    }, 0.5);  // Change the interval as per your needs
});

$('#stopBtn').click(function () {
    clearInterval(playInterval);
});



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



$('#invertBitsButton').click(function () {
    // Retrieve the current decimal value
    var currentDecValue = new BigNumber($('#decArea').val());

    // Convert the decimal value to a bit string
    var bitString = currentDecValue.toString(2).padStart(1802, '0');

    // Flip the bits
    var invertedBitString = '';
    for (let i = 0; i < bitString.length; i++) {
        invertedBitString += bitString[i] === '0' ? '1' : '0';
    }

    // Convert the flipped bit string back to a decimal value
    var newDecValue = new BigNumber(invertedBitString, 2);

    // Set the decimal string to the new decimal value, and update everything else
    setDecString(newDecValue);
    setBitString(invertedBitString);
    setBitMap();
    setPresetUrl();
});


// // Save valuesArray to JSON
document.getElementById('saveButton').addEventListener('click', function() {
    // Convert BigNumber instances to strings before JSON.stringify
    var stringArray = valuesArray.map(function(bigNum) {
        return bigNum.toString();
    });

    // Convert the array to JSON
    var json = JSON.stringify(stringArray);

    // Create a blob from the JSON
    var blob = new Blob([json], {type: 'application/json'});

    // Create an object URL for the blob
    var url = URL.createObjectURL(blob);

    // Create a link element
    var a = document.createElement('a');

    // Set the href and download attributes of the link
    a.href = url;
    a.download = 'presets.json';

    // Append the link to the body
    document.body.appendChild(a);

    // Simulate a click of the link
    a.click();

    // Remove the link from the body
    document.body.removeChild(a);
});

// Load JSON to valuesArray
document.getElementById('loadButton').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        try {
            // Parse the JSON to get an array of strings
            var stringArray = JSON.parse(contents);

            // Convert the strings back to BigNumber instances
            valuesArray = stringArray.map(function(str) {
                return new BigNumber(str);
            });

            console.log("Array loaded successfully");
        } catch(e) {
            console.error("Could not parse JSON file: ", e);
        }
    };
    reader.readAsText(file);
});



        

  

function generateKey() {
    return window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    ).then(function(key) {
        return window.crypto.subtle.exportKey(
            "jwk", 
            key
        ).then(function(keydata) {
            document.getElementById('keyField').value = keydata.k;
            return key;
        });
    });
}

function decryptData(data, key) {
    // Decode the data URL
    var dataURL = atob(data.split(',')[1]);

    // Extract the initialization vector (IV) from the first 12 bytes
    var iv = new Uint8Array(dataURL.slice(0, 12).split('').map(function(char) {
        return char.charCodeAt(0);
    }));

    // Extract the encrypted data from the remaining bytes
    var encryptedData = new Uint8Array(dataURL.slice(12).split('').map(function(char) {
        return char.charCodeAt(0);
    }));

    // Convert the key from JWK format to CryptoKey object
    return window.crypto.subtle.importKey(
        "jwk",
        {
            kty: "oct",
            k: key,
            alg: "A256GCM",
            ext: true,
        },
        {
            name: "AES-GCM",
        },
        false,
        ["decrypt"]
    ).then(function(key) {
        return window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            encryptedData
        );
    }).then(function(decryptedData) {
        // Convert the decrypted data to a string
        var decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    });
}

document.getElementById('saveEncButton').addEventListener('click', function() {
    // Convert BigNumber instances to strings before JSON.stringify
    var stringArray = valuesArray.map(function(bigNum) {
        return bigNum.toString();
    });

    // Convert the array to JSON
    var json = JSON.stringify(stringArray);

    generateKey().then(function(key) {
        let encoder = new TextEncoder();
        let data = encoder.encode(json);
        let iv = window.crypto.getRandomValues(new Uint8Array(12));

        return window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            data
        ).then(function(encrypted){
            let reader = new FileReader();
            reader.readAsDataURL(new Blob([new Uint8Array(iv).buffer, encrypted]));
            reader.onloadend = function() {
                // Create a link element
                let a = document.createElement('a');

                // Set the href and download attributes of the link
                a.href = reader.result;
                a.download = 'encryptedPresets.json';

                // Append the link to the body
                document.body.appendChild(a);

                // Simulate a click of the link
                a.click();

                // Remove the link from the body
                document.body.removeChild(a);
            }
        });
    });
});

document.getElementById('loadEncButton').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        var key = document.getElementById('keyField').value;

        decryptData(contents, key).then(function(decryptedData) {
            try {
                // Parse the decrypted JSON to get an array of strings
                var stringArray = JSON.parse(decryptedData);

                // Convert the strings back to BigNumber instances
                valuesArray = stringArray.map(function(str) {
                    return new BigNumber(str);
                });

                console.log("Array loaded successfully");
            } catch (e) {
                console.error("Could not parse decrypted JSON file: ", e);
            }
        }).catch(function(e) {
            console.error("Could not decrypt file: ", e);
        });
    };
    reader.readAsDataURL(file);
});

           

$('#repeaterButton').click(function () {
    var savedValue = new BigNumber($('#decArea').val());
    console.log(`Value ${savedValue} saved`);

    valuesArray.push(savedValue);

    for (var i = 0; i < 256; i++) {
        var lastValue = valuesArray[valuesArray.length - 1];
        var newDecValue = lastValue.plus(savedValue);
        valuesArray.push(newDecValue);
    }

    for (var i = valuesArray.length - 256; i < valuesArray.length; i++) {
        displayError(i, valuesArray[i]);
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


       




