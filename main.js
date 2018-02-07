//Intial function
"Use strict";

(async function() {
  try {
    $(".dropdown").dropdown();
    $("#uploadmodal").modal();
    $("#feedbackmodal").modal();
    $("#aboutmodal").modal();
    $("#settingsmodal").modal();

    $("#authorise").click(function() {
      authorise();
    });
    $("#refresh").click(function() {
      getWebCards();
    });
    $("#feedback").click(function() {
      $("#feedbackmodal").modal("open");
    });
    $("#about").click(function() {
      $("#aboutmodal").modal("open");
    });
    $("#settings").click(function() {
      $("#settingsmodal").modal("open");
    });

    $("#upload").click(function() {
      checkForms();
    });
    $("#submit-feedback").click(function() {
      sendFeedback();
    });
    $("#edit-config").click(function() {
      editConfig();
    });

    const app = {
      name: "Listy",
      id: "joe",
      version: "1",
      vendor: "joe.listy"
    };

    let appHandle = await window.safeApp.initialise(app);
    auth = await window.safeApp.connect(appHandle);
    Materialize.toast(" App Token: " + auth, 3000, "rounded");
    getWebCards();
  } catch (err) {
    console.error(err);
  } finally {
    authorised = false;
  }
})();

async function getWebCards() {
  try {
    let listyHash = await window.safeCrypto.sha3Hash(auth, "listy");
    let listyHandle = await window.safeMutableData.newPublic(auth, listyHash, 54321);
    let entriesHandle = await window.safeMutableData.getEntries(listyHandle);

    loadingMessage.innerHTML = "";
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

    window.safeMutableDataEntries.forEach(entriesHandle, (key, value) => {
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
            typeof url === "string"
          ) {
            window.safeApp.webFetch(auth, url, { range: { start: 0, end: 1 } }).then(
              data => {
                $("#webCards").append(
                  '<div class="card-panel dark-primary-colour item"><a class="tooltipped accent-text-colour" data-position="bottom" data-tooltip="' +
                    url +
                    '" href="' +
                    url +
                    '" >' +
                    title +
                    '</a><p align="left" class="accent-text-colour description">' +
                    description +
                    "</p></div>"
                );
                $(".tooltipped").tooltip();
              },
              err => {
                console.log("No website found at " + url);
                console.error(err);
              }
            );
          }
        }
      }
    });
    window.safeMutableDataEntries.free(entriesHandle);
    window.safeMutableData.free(listyHandle);
  } catch (err) {
    console.error(err);
  }
}

async function authorise() {
  try {
    if (authorised !== true) {
      window.safeApp.free(auth);

      const app = {
        name: "Listy",
        id: "joe",
        version: "1",
        vendor: "listy.joe"
      };
      const permissions = {
        _public: ["Read"]
      };
      const owncontainer = {
        own_container: true
      };

      let appHandle = await window.safeApp.initialise(app);
      let authURI = await window.safeApp.authorise(appHandle, permissions, owncontainer);
      let authorisedAppHandle = await window.safeApp.connectAuthorised(appHandle, authURI);

      auth = authorisedAppHandle;
      authorised = true;
      Materialize.toast("Authorised App Token: " + auth, 3000, "rounded");
      setTimeout(function() {
        getConfig();
      }, 1600);
      return auth;
    }
  } catch (err) {
    console.error(err);
  }
}

function checkForms() {
  if (
    title.value.length !== 0 &&
    title.value.length < 51 &&
    description.value.length !== 0 &&
    description.value.length < 301 &&
    service.value.length !== 0 &&
    publicID.value.length !== 0
  ) {
    uploadWebCard();
  } else {
    Materialize.toast("Make sure all fields are filled and don't exceed limits ", 3000, "rounded");
  }
}

async function uploadWebCard() {
  try {
    if (authorised !== true) {
      const auth = await authorise();
    }
    let listyHash = await window.safeCrypto.sha3Hash(auth, "listy");
    let listyHandle = await window.safeMutableData.newPublic(auth, listyHash, 54321);
    let mutationHandle = await window.safeMutableData.newMutation(auth);

    let time = new Date().getTime();
    let url = "safe://" + service.value + "." + publicID.value;
    let webCard = {
      title: title.value,
      description: description.value,
      url: url
    };

    window.safeMutableDataMutation.insert(mutationHandle, time.toString(), JSON.stringify(webCard));
    window.safeMutableData.applyEntriesMutation(listyHandle, mutationHandle);
    window.safeMutableDataMutation.free(mutationHandle);
    window.safeMutableData.free(listyHandle);
  } catch (err) {
    console.error(err);
  } finally {
    Materialize.toast("Web Card has been uploaded", 3000, "rounded");
    $("#uploadmodal").modal("close");
    setTimeout(function() {
      getWebCards();
    }, 2000);
  }
}

async function getConfig() {
  try {
    let ownContainerHandle = await window.safeApp.getOwnContainer(auth);
    try {
      let value = await window.safeMutableData.get(ownContainerHandle, "custom-colours");
      let colours = JSON.parse(value.buf.toString());

      document.documentElement.style.setProperty("--primaryColor", colours.primaryColor);
      document.documentElement.style.setProperty("--accentColor", colours.accentColor);
      document.documentElement.style.setProperty("--darkPrimaryColor", colours.darkPrimaryColor);
    } catch (err) {
      let colorsConfig = {
        primaryColor: "#448aff",
        accentColor: "#ffea00",
        darkPrimaryColor: "#1565c0"
      };

      let mutationHandle = await window.safeMutableData.newMutation(auth);
      window.safeMutableDataMutation.insert(mutationHandle, "custom-colours", JSON.stringify(colorsConfig));
      window.safeMutableData.applyEntriesMutation(ownContainerHandle, mutationHandle);
      window.safeMutableDataMutation.free(mutationHandle);
      window.safeMutableData.free(ownContainerHandle);
    }
  } catch (err) {
    console.error(err);
  } finally {
    getWebCards();
  }
}

async function editConfig() {
  try {
    if (authorised !== true) {
      const auth = await authorise();
    }

    let primary = document.getElementById("user-primary-colour").value;
    let dark = document.getElementById("user-dark-primary-colour").value;
    let accent = document.getElementById("user-accent-colour").value;

    let colorsConfig = {
      primaryColor: primary,
      accentColor: accent,
      darkPrimaryColor: dark
    };

    let ownContainerHandle = await window.safeApp.getOwnContainer(auth);
    let mutationHandle = await window.safeMutableData.newMutation(auth);
    let value = await window.safeMutableData.get(ownContainerHandle, "custom-colours");
    window.safeMutableDataMutation.update(
      mutationHandle,
      "custom-colours",
      JSON.stringify(colorsConfig),
      value.version + 1
    );
    window.safeMutableData.applyEntriesMutation(ownContainerHandle, mutationHandle);
    window.safeMutableDataMutation.free(mutationHandle);
    window.safeMutableData.free(ownContainerHandle);

    setTimeout(function() {
      getConfig();
    }, 1500);
  } catch (err) {
    console.error(err);
  } finally {
    $("#settingsmodal").modal("close");
  }
}

async function sendFeedback() {
  try {
    if (authorised !== true) {
      const auth = await authorise();
    }

    let time = new Date().getTime().toString();
    let feedback =
      "Listy Feedback: " + feedbackarea.value + "/ Score: " + listyscore.value.toString() + "/10";

    let feedbackHash = await window.safeCrypto.sha3Hash(auth, "feedy");
    let feedbackHandle = await window.safeMutableData.newPublic(auth, feedbackHash, 54321);
    let mutationHandle = await window.safeMutableData.newMutation(auth);
    window.safeMutableDataMutation.insert(mutationHandle, time, feedback);
    window.safeMutableData.applyEntriesMutation(feedbackHandle, mutationHandle);
    window.safeMutableDataMutation.free(mutationHandle);
    window.safeMutableData.free(feedbackHandle);
  } catch (err) {
    console.error(err);
  } finally {
    $("#feedbackmodal").modal("close");
    Materialize.toast("Thanks for your feedback!", 3000, "rounded");
  }
}

function uintToString(uintArray) {
  return new TextDecoder("utf-8").decode(uintArray);
}
