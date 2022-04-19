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
                    const scriptURL = 'https://script.google.com/macros/s/AKfycbw7KqP4ixKKT_WOJ5ZiCWbsL9G2TRVBAGS5HDjxUuYIsxfHVDqzSAmEBZIuyWBumRvUAg/exec';
                    const form = document.forms['contact-form'];
                    fetch(scriptURL, { method: 'POST', body: new FormData(form)})
                        .then(response => alert("Thanks for Contacting us..! We Will Contact You Soon..."))
                        .catch(error => console.error('Error!', error.message));
                }

                form.classList.add('was-validated');
                let errorField = document.querySelector(".was-validated :invalid");
                if (errorField) {
                    errorField.scrollIntoView({
                        behavior: "smooth"
                    })
                }
            }, false);
        })
})();
