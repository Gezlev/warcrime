import { Datepicker, DateRangePicker } from 'vanillajs-datepicker';
const axios = require("axios");

function generateSessionId() {
    return Date.now() + Math.random().toString(36).substring(2, 9);
}
document.getElementById("sessionId").value = generateSessionId();


const birthDate = new Datepicker(document.querySelector('input[name="birthday"]'), {
    defaultViewDate: new Date('2004-01-01'),
    format: 'dd.mm.yyyy',
    weekStart: 1,
    autohide: true
});

const eventPeriod = document.querySelector('#eventPeriod');
let rangepicker = new DateRangePicker(eventPeriod, {
    format: 'dd.mm.yyyy',
    weekStart: 1,
    autohide: true
});


(function() {
    'use strict' // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation') // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
        .forEach(function(form) {
            form.addEventListener("keydown", function(e) {
                if (e.key == "Enter") {
                    e.preventDefault();
                }
            });
            form.addEventListener('submit', function(event) {
                event.preventDefault()
                event.stopPropagation()
                if (!form.checkValidity()) {
                } else {
                    document.querySelector("button[type='submit']").disabled = true;
                    document.getElementById("sessionId").value = generateSessionId();
                    const scriptURL = 'https://warcrimes.gov.ua/api';
                    const form = document.forms['google-sheet'];
                    let bodyFormData = new FormData(form);
                    bodyFormData.append("copy", false);
                    bodyFormData.set("birthday", transformDate(form["birthday"].value));
                    if (form["eventStart"].value) {
                        bodyFormData.set("eventStart", transformDate(form["eventStart"].value) + " " + (form["timeStart"].value ? form["timeStart"].value : "00:00"));
                    }
                    if (form["eventEnd"].value) {
                        bodyFormData.set("eventEnd", transformDate(form["eventEnd"].value) + " " + (form["timeEnd"].value ? form["timeEnd"].value : "23:59"));
                    }
                    bodyFormData.delete("timeStart");
                    bodyFormData.delete("timeEnd");
                    let object = {};
                    bodyFormData.forEach((value, key) => object[key] = value);
                    object["eventType"] = bodyFormData.getAll('eventType');
                    let json = JSON.stringify(object);
                    let imagefile = document.getElementById('formFile');
                    let fileUploadUrl;

                    axios({
                        method: "post",
                        url: scriptURL,
                        data: json,
                        responseType: 'json'
                    })
                        .then(response => {
                            let contactFields = "";
                            if (form['surname'].value) {
                                contactFields += 'Name'
                            }
                            if (form['tel'].value) {
                                contactFields += 'Tel'
                            }
                            if (form['email'].value != "") {
                                contactFields += 'Email'
                            }
                            dataLayer.push({
                                event: 'analytics',
                                analytics: {
                                    sessionId: form['sessionId'].value,
                                    filesCount: imagefile.files.length,
                                    contactFields: contactFields,
                                    administrative_area_level_1: form['administrative_area_level_1'].value
                                }
                            });

                            if (response.data.url) {
                                fileUploadUrl = response.data.url;
                            } else {
                                console.log("fileUploadUrl not received");
                            }
                        })
                        .then(() => {
                            uploadFiles(imagefile.files, fileUploadUrl, scriptURL, json.replace('"copy":"false"', '"copy":"true"'))
                                .then(() => {
                                    document.getElementById("modal").style.display = "block";
                                });
                        })
                        .catch(error => {
                            console.error('Error!', error.message);
                        });
                }

                form.classList.add('was-validated');
                let errorField = document.querySelector(".was-validated :invalid");
                if (errorField) {
                    errorField.scrollIntoView({
                        behavior: "smooth"
                    })
                }
            }, false)
        })
})();

if (!navigator.geolocation) {
    document.getElementById("button-location").style.display = none;
}

let allowed_size_mb = 100;
let inputs = document.getElementById('formFile');
inputs.addEventListener('change', function(e) {
    document.getElementById("fileName").innerHTML = "";
    for (let i = 0; i < e.target.files.length; i++) {
        let file = e.target.files[i];
        let div = document.createElement("div");
        let divProgressBar = '<div class="progress"><div class="progress-bar" role="progressbar" style="width: 0" filename="' + file.name + '">0%</div></div>';
        let template = document.createElement("div");
        template.innerHTML = divProgressBar.trim();
        divProgressBar = template.firstChild;
        let span = document.createElement("span")
        span.className = "badge bg-warning";
        span.setAttribute("fileName", file.name);
        span.innerText = "x";
        span.addEventListener("click", function(el) {
            for (let j = 0; j < e.target.files.length; j++) {
                if (e.target.files[j].name == el.target.getAttribute("fileName")) {
                    removeFileFromFileList(j, e.target);
                    break;
                }
            }
            el.target.parentNode.remove();
        });
        div.innerText = file.name;
        if (file.size > allowed_size_mb * 1024 * 1024) {
            div.classList.add("text-danger");
            div.innerText += 'Файл може дового завантажуватися через великий розмір';
        }
        div.appendChild(span);
        div.appendChild(divProgressBar);
        document.getElementById("fileName").appendChild(div);

    }
    ;
});


grecaptcha.enterprise.ready(function() {
    grecaptcha.enterprise.execute('6Le_V7MeAAAAAKZ9kPfj_NVex4siD8oErqRuy499', {
        action: 'homepage'
    }).then(function(token) {
        document.querySelector("input[name='googleReCaptcha']").value = token;
    });
});


const removeFileFromFileList = function(index, input) {
    const dt = new DataTransfer()
    const {files} = input;
    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (index !== i)
            dt.items.add(file) // here you exclude the file. thus removing it.
    }

    input.files = dt.files // Assign the updates list
}


var fileUploadProgress = function(progressEvent, filename) {
    let progressBar = document.querySelector("div.progress-bar[filename='" + filename + "']");
    let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    progressBar.style.width = percentCompleted + "%";
    progressBar.innerText = percentCompleted + "%";

}
var uploadFiles = async function(files, fileUploadUrl, scriptURL, json) {
    let i = 0;
    for (const file of files) {
        if (!fileUploadUrl)
            return;
        let formData = new FormData();
        formData.append("image", file);
        await axios.put(fileUploadUrl, file, {
            headers: {
                'Content-Type': file.type
            },
            onUploadProgress: function(f, filename=file.name) {
                fileUploadProgress(f, filename);
            }
        }).then(() => {
            let type = file.type ? file.type.split("/")[0] : 'unknow';
            dataLayer.push({
                event: 'fileUpload',
                file: {
                    sessionId: document.forms["google-sheet"]["sessionId"].value,
                    type: type,
                }
            });
        });

        if (i < files.length - 1) {
            await axios({
                method: "post",
                url: scriptURL,
                data: json,
                responseType: 'json'
            }).then(response => {
                if (response.data.url) {
                    fileUploadUrl = response.data.url;
                }
                else {
                    return;
                }
            }).catch(error => {
                console.log(error);
                return;
            })
        }
        i++;
    }
};


let keyCode;
function mask(event) {
    event.keyCode && (keyCode = event.keyCode);
    var pos = this.selectionStart;
    if (pos < 3) event.preventDefault();
    var matrix = "+38 ___ ___ __ __",
        i = 0,
        def = matrix.replace(/\D/g, ""),
        val = this.value.replace(/\D/g, ""),
        new_value = matrix.replace(/[_\d]/g, function(a) {
            return i < val.length ? val.charAt(i++) || def.charAt(i) : a
        });
    i = new_value.indexOf("_");
    if (i != -1) {
        i < 5 && (i = 3);
        new_value = new_value.slice(0, i)
    }
    var reg = matrix.substr(0, this.value.length).replace(/_+/g,
        function(a) {
            return "\\d{1," + a.length + "}"
        }).replace(/[+()]/g, "\\$&");
    reg = new RegExp("^" + reg + "$");
    if (!reg.test(this.value) || this.value.length < 5 || keyCode > 47 && keyCode < 58) this.value = new_value;
    if (event.type == "blur" && this.value.length < 5)  this.value = "";
}

function transformDate(data) {
    let a = data.split(".");
    return a.reverse().join("-");
}

const tel = document.querySelector('#phone');
tel.addEventListener("input", mask, false);
tel.addEventListener("focus", mask, false);
tel.addEventListener("blur", mask, false);
tel.addEventListener("keydown", mask, false);
