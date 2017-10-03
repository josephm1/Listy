//Intial function
"Use strict";

(async function() {
  try {
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
      getWebCards();
    });

    const app = {
      name: "Listy",
      id: "joe",
      version: "1",
      vendor: "joe.listy"
    };

    let appHandle = await window.safeApp.initialise(app);
    auth = await window.safeApp.connect(appHandle);

    Materialize.toast(" App Token: " + auth, 3000, 'rounded');
    authorised = false;
    getWebCards();

  } catch (err) {
    console.log(err);
  }
})();


async function getWebCards() {
  let listyHash = await window.safeCrypto.sha3Hash(auth, "listy");
  let listyHandle = await window.safeMutableData.newPublic(auth, listyHash, 54321);
  let entriesHandle = await window.safeMutableData.getEntries(listyHandle);

  webCards.innerHTML = "";
  let time = new Date().getTime();
  var safeurls = [];

  function checkUrls(item) {
    if (item == this) {
      return false;
    } else {
      return true;
    }
  }

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
          keys[2] === "url" &&

          safeurls.every(checkUrls, [url]) === true
        ) {

          safeurls.push(url);

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

            window.safeApp.webFetch(auth, url + '/index.html')
              .then((data) => {

                console.log('Key: ', uintToString(key));
                console.log('Value: ', webCardItems);

                $("#webCards").append('<div class="card-panel yellow webcard item"><a align="left" href="' +
                  url + '" class="blue-text title">' +
                  title + '</a><p align="left" class="blue-text description">' +
                  description + '</p></div></div>');
              }, (err) => {
                console.log("No website found at " + url);
                console.error(err);
              });

          }
        }
      }
    });
  window.safeMutableDataEntries.free(entriesHandle);
  window.safeMutableData.free(listyHandle);
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

async function authorise() {
  try {
    if (authorised === false) {
      window.safeApp.free(auth);

      auth = "";
      const app = {
        name: "Listy",
        id: "joe",
        version: "1",
        vendor: "listy.joe",
      };
      const permissions = {
        '_public': ['Read']
      };

      let appHandle = await window.safeApp.initialise(app);
      let authURI = await window.safeApp.authorise(appHandle, permissions);
      let authorisedAppHandle = await window.safeApp.connectAuthorised(appHandle, authURI);

      auth = authorisedAppHandle;
      authorised = true;
      Materialize.toast("Authorised App Token: " + auth, 3000, 'rounded');
      uploadWebCard();
    } else {
      uploadWebCard();
    }
  } catch (err) {
    console.log(err);
  }
}

async function uploadWebCard() {
  let listyHash = await window.safeCrypto.sha3Hash(auth, "listy");
  let listyHandle = await window.safeMutableData.newPublic(auth, listyHash, 54321);
  let mutationHandle = await window.safeMutableData.newMutation(auth);

  let time = new Date().getTime();
  let url = "safe://" + service.value + "." + publicID.value;
  let webCard = {
    "title": title.value,
    "description": description.value,
    "url": url
  };

  await window.safeMutableDataMutation.insert(mutationHandle, time.toString(), JSON.stringify(webCard));
  await window.safeMutableData.applyEntriesMutation(listyHandle, mutationHandle);

  $('#uploadmodal').modal('close');
  Materialize.toast('Web Card has been uploaded', 3000, 'rounded');
  window.safeMutableDataMutation.free(mutationHandle);
  window.safeMutableData.free(listyHandle);
  getWebCards();
}

function uintToString(uintArray) {
  return new TextDecoder("utf-8").decode(uintArray);
}
