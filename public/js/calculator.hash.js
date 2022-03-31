const calculateHash = function(files) {
    if (!window.Worker || !window.File || !window.FileReader || !window.FileList || !window.Blob || !window.crypto || !File.prototype.slice) return;    

    FileList.prototype.setHash = function(filename, type, value) {
        this.hash = this.hash || {}
        this.hash[filename] = this.hash[filename] || {}
        this.hash[filename][type] = value;
    }
    FileList.prototype.getHash = function() {
        return this.hash
    }

    let file_id = 1, drop_zone, is_crypto = false;
    let md5 = false;
    let sha1 = true;
    let sha256 = false;
    let filesComplited = 0;
    let hashCount = files.length * (md5 + sha1 + sha256);



    is_crypto = window.crypto && window.crypto.subtle && window.crypto.subtle.digest;

    if (is_crypto) {
      window.crypto.subtle.digest({name: "SHA-1"}, new Uint8Array()).catch(function(error){
        sha1 = false;
      });
    }

    function hash_file(file, workers) {
      let i, buffer_size, block, threads, reader, blob, handle_hash_block, handle_load_block;

      handle_load_block = function (event) {
        for( i = 0; i < workers.length; i += 1) {
          threads += 1;
          workers[i].postMessage({
            'message' : event.target.result,
            'block' : block
          });
        }
      };
      handle_hash_block = function (event) {
        threads -= 1;

        if(threads === 0) {
          if(block.end !== file.size) {
            block.start += buffer_size;
            block.end += buffer_size;

            if(block.end > file.size) {
              block.end = file.size;
            }
            reader = new FileReader();
            reader.onload = handle_load_block;
            blob = file.slice(block.start, block.end);

            reader.readAsArrayBuffer(blob);
          }
        }
      };
      buffer_size = 64 * 16 * 1024;
      block = {
        'file_size' : file.size,
        'start' : 0
      };

      block.end = buffer_size > file.size ? file.size : buffer_size;
      threads = 0;

      for (i = 0; i < workers.length; i += 1) {
        workers[i].addEventListener('message', handle_hash_block);
      }
      reader = new FileReader();
      reader.onload = handle_load_block;
      blob = file.slice(block.start, block.end);

      reader.readAsArrayBuffer(blob);
    }

    function updateFileHash(filename, type, result) {
        files.setHash(filename, type,result);
        filesComplited++;
        if (filesComplited >= hashCount) {
            document.querySelector("button[type='submit']").disabled = false;
        }
    }

    // progress bar
    function handle_worker_event(filename) {
      return function (event) {
        if (event.data.result) {
            updateFileHash(filename, 'md5', event.data.result);
            let progressBar = document.querySelector("div.progress-bar[filename='" + filename + "']");
            let percentCompleted = 100;
            progressBar.style.width = percentCompleted + "%";
            progressBar.innerText = 'Файл готовий до завантаження';
        } else {

            let progressBar = document.querySelector("div.progress-bar[filename='" + filename + "']");
            let percentCompleted = Math.round(event.data.block.end * 100 / event.data.block.file_size);
            progressBar.style.width = percentCompleted + "%";
            progressBar.innerText = 'Готуємо до завантаження... ' + percentCompleted + "%";


            //document.querySelector(id + ' .bar').style.width = event.data.block.end * 100 / event.data.block.file_size + '%';
        }
      };
    }


    function handle_crypto_progress(id, total, loaded) {
    }

    function handle_file_select() {

      document.querySelector("button[type='submit']").disabled = true;
      let i, output, file, workers, worker, crypto_files, crypto_algos, max_crypto_file_size = 500 * 1024 * 1024;

      output = [];
      crypto_files = [];

      for (i = 0; i < files.length; i += 1) {
        file = files[i];
        workers = [];
        crypto_algos = [];


        if (md5) {
          worker = new Worker('/public/js/calculator.worker.md5.js');
          worker.addEventListener('message', handle_worker_event(file.name));
          workers.push(worker);;
        }

        if (sha1) {
          if (is_crypto && file.size < max_crypto_file_size) {
            crypto_algos.push({id: file.name, name: "SHA-1"});
          } else {
            worker = new Worker('/public/js/calculator.worker.sha1.js');
            worker.addEventListener('message', handle_worker_event(file.name));
            workers.push(worker);
          }
        }

        if (sha256) {
          
          if (is_crypto && file.size < max_crypto_file_size) {
            crypto_algos.push({id: file.name, name: "SHA-256"});
          } else {
            worker = new Worker('/public/js/calculator.worker.sha256.js');
            worker.addEventListener('message', handle_worker_event(file.name));
            workers.push(worker);
          }
        }


        if (is_crypto && crypto_algos.length > 0) {
          crypto_files.push({file: file, algos: crypto_algos});

        }

        hash_file(file, workers);
        file_id += 1;
      }

      if (is_crypto) {
        handle_crypto_files(crypto_files);
      }

    }


    function handle_crypto_files(crypto_files) {
      var crypto_file, handle_crypto_file, handle_crypto_block, reader;

      crypto_file = crypto_files.pop();

      handle_crypto_block = function(data, algos) {
        var algo = algos.pop();

        if (algo) {
          window.crypto.subtle.digest({name: algo.name}, data)
          .then(function(hash) {
            var hexString = '', hashResult = new Uint8Array(hash);

            for (var i = 0; i < hashResult.length; i++) {
              hexString += ("00" + hashResult[i].toString(16)).slice(-2);
            }
            updateFileHash(algo.id, algo.name, hexString);
            handle_crypto_block(data, algos);
          })
          .catch(function(error) {
            console.error(error);
          });
        } else {
          handle_crypto_files(crypto_files);
        }
      };

      handle_crypto_file = function(file, crypto_algos) {
        reader = new FileReader();

        reader.onprogress = (function(crypto_algos) {
          var algos = crypto_algos;

          return function(event) {
            var i;

            for (i = 0; i < algos.length; i++) {
              handle_crypto_progress(algos[i].id, event.total, event.loaded);
            }
          }
        })(crypto_algos);

        reader.onload = (function(crypto_algos) {
          var algos = crypto_algos;

          return function(event) {
            handle_crypto_block(event.target.result, algos);
          }
        })(crypto_algos);

        reader.readAsArrayBuffer(file);
      };

      if (crypto_file) {
        handle_crypto_file(crypto_file.file, crypto_file.algos);
      }
    }

    handle_file_select(files);

    
}
 