//Intial function
"Use strict";

$(document).ready(function() {
  $('#uploadmodal').modal({
    dismissible: false
  });

  $('#upload').click(function() {
    checkForms();
  });

  $('#cancel').click(function() {
    $('#uploadmodal').modal('close');
  });

  $('#refresh').click(function() {
    getMutableDataHandle("getWebCards");
  });

  var app = {
    name: "Safe Web Dir",
    id: "joe",
    version: "1",
    vendor: "joe"
  };


  window.safeApp.initialise(app)
    .then((appHandle) => {
      console.log("Initialise Token: " + appHandle);
      window.safeApp.connect(appHandle)
        .then((appHandle) => {
          auth = appHandle;
          authorised = false;
          Materialize.toast(" App Token: " + auth, 3000, 'rounded');
          getMutableDataHandle("getWebCards");
        });
    }, (err) => {
      console.error(err);
    });
});

function getMutableDataHandle(invokeFun) {
  var name = "safewebdir";
  window.safeCrypto.sha3Hash(auth, name)
    .then((hash) =>
      window.safeMutableData.newPublic(auth, hash, 5432100))
    .then((mdHandle) => {
      safeDirHandle = mdHandle;
      if (invokeFun === "getWebCards") {
        getWebCards();
      } else if (invokeFun === "uploadWebCard") {
        uploadWebCard();
      }
    });
}

function getWebCards() {
  window.safeMutableData.getEntries(safeDirHandle)
    .then((entriesHandle) => {
      webCards.innerHTML = "";
      var date = new Date();
      var time = date.getTime();
      window.safeMutableDataEntries.forEach(entriesHandle,
          (key, value) => {

            if (
              parseInt(uintToString(key)) < time &&
              parseInt(uintToString(key)).toString().length === 13 &&
              uintToString(key).length === 13
            ) {
              var webCardItems = JSON.parse(uintToString(value.buf));

              var title = webCardItems.title
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

              var description = webCardItems.description
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");


              var url = webCardItems.url;

              var keys = Object.keys(webCardItems);
              if (
                keys.length === 3 &&
                keys[0] === "title" &&
                keys[1] === "description" &&
                keys[2] === "url") {

                if (
                  title.length !== 0 &&
                  title.length < 51 &&
                  typeof title === "string" &&

                  description.length !== 0 &&
                  description.length < 300 &&
                  typeof description === "string" &&

                  url.substring(0, 7) === "safe://" &&
                  url.length < 100 &&
                  typeof url === "string") {

                  console.log('Key: ', uintToString(key));
                  console.log('Value: ', webCardItems);
                  $("#webCards").append('<div class="row"><div class="card-panel yellow webcard"><a align="left" href="' +
                    url + '" class="h5 blue-text title">' +
                    title + '</a><p align="left" class="blue-text description">' +
                    description + '</p></div></div>');
                }
              }
            }
          })
        .then(_ => {
          window.safeMutableDataEntries.free(entriesHandle);
          window.safeMutableData.free(safeDirHandle);
        });
    }, (err) => {
      console.error(err);
    });
}

function uintToString(uintArray) {
  return new TextDecoder("utf-8").decode(uintArray);
}

function checkForms() {
  if (title.value.length !== 0 &&
    title.value.length < 51 &&

    description.value.length !== 0 &&
    description.value.length < 301 &&

    service.value.length !== 0 &&
    publicID.value.length !== 0

  ) {
    authorise();
  } else {
    Materialize.toast("Make sure all fields are filled and don't exceed limits ", 3000, 'rounded');
  }
}

function authorise() {
  if (authorised === false) {
    window.safeMutableData.free(safeDirHandle);
    window.safeApp.free(auth);
    auth = "";
    var app = {
      name: "Safe Web Dir",
      id: "joe",
      version: "1",
      vendor: "joe",
    };

    var permissions = {
      '_public': []
    };

    window.safeApp.initialise(app)
      .then((appHandle) => {
        window.safeApp.authorise(appHandle, permissions)
          .then((authURI) => {
            window.safeApp.connectAuthorised(appHandle, authURI)
              .then((authorisedAppHandle) => {
                auth = authorisedAppHandle;
                authorised = true;
                Materialize.toast("Authorised App Token: " + auth, 3000, 'rounded');
                getMutableDataHandle("uploadWebCard");
              });
          });
      }, (err) => {
        console.error(err);
      });
  } else {
    getMutableDataHandle("uploadWebCard");
  }
}

function uploadWebCard() {
  window.safeMutableData.newMutation(auth)
    .then((mutationHandle) => {
      var date = new Date();
      var time = date.getTime();
      var url = "safe://" + service.value + "." + publicID.value;
      var webCard = {
        "title": title.value,
        "description": description.value,
        "url": url
      };
      console.log("Your upload card: " + webCard);
      window.safeMutableDataMutation.insert(mutationHandle, time.toString(), JSON.stringify(webCard))
        .then(_ =>
          window.safeMutableData.applyEntriesMutation(safeDirHandle, mutationHandle))
        .then(_ => {
          $('#uploadmodal').modal('close');
          Materialize.toast('Web Card has been uploaded', 3000, 'rounded');
          window.safeMutableDataMutation.free(mutationHandle);
          window.safeMutableData.free(safeDirHandle);
          getMutableDataHandle("getWebCards");
        });
    }, (err) => {
      console.error(err);
    });
}
