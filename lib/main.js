var tabs = require("tabs");
var widgets = require("widget");
var data = require("self").data;
var prefs = require("preferences-service");
var simpleprefs = require("simple-prefs");
var { Hotkey } = require("hotkeys");

const {Cc, Ci} = require("chrome");
var mediator = Cc['@mozilla.org/appshell/window-mediator;1']
                  .getService(Ci.nsIWindowMediator);

var openTabs = [];
var alreadyHidden = false;
var mode = false;

function toggleBookmarkAndSearch(hide) {
  var document = mediator.getMostRecentWindow("navigator:browser").document;
  var bookmarksToolbar = document.getElementById("PersonalToolbar");

  // Hide the bookmarks toolbar and clear the search bar. If the bookmarks bar
  // is already collapsed, make sure that we don't change it.
  if (hide === "enabled")
  {
    if (bookmarksToolbar.collapsed) {
      alreadyHidden = true;
    }
    else {
      alreadyHidden = false;
    }
    bookmarksToolbar.collapsed = true;
    // Clear the search bar text and disable search suggestions.
    var searchbar = document.getElementById("searchbar");
    if (searchbar) {
      searchbar.value = "";
    }
  }
  else
  {
    if (!alreadyHidden) {
      bookmarksToolbar.collapsed = false;
    }
  }
}

function clearDownloadsList() {
  // If the user has set the preference to "Y", clear the download history when
  // entering Presentation Mode. Default: do not clear the list.
  if (simpleprefs.prefs.downloadpreference === "Y") {
    var downloadManager = Cc["@mozilla.org/download-manager;1"]
                            .getService(Ci.nsIDownloadManager);
    downloadManager.cleanUp();
  }
}

function restoreAllTabs() {
  var currentActiveTabs = tabs.length;
  var tabpreference = simpleprefs.prefs.tabclosepreference;

  // If the user has not set the preference, do not close the tabs which were
  // opened during the presentation. Default: close the tabs.
  if (tabpreference === "Y") {
    if (tabs.length !== 1) {
      for each (var tab in tabs) {
        if (tabs.length === 1) {
          break;
        }
        tab.close();
      }
    }
  }

  // Restore the saved tabs when presentation mode exits.
  for (var i = 0; i < openTabs.length; i++) {
    tabs.open({
      url: openTabs[i],
      inBackground: true
    });
  }

  // Close the active tab (which we opened).
  if (tabpreference === "Y") {
    tabs.activeTab.close();
  }

  // Set the current active tab to the last active tab.
  if (tabpreference === "Y") {
    var index = openTabs.indexOf(activeTab);
  }
  if (tabpreference === "N") {
    var index = openTabs.indexOf(activeTab) + currentActiveTabs;
  }
  tabs[index].activate();
}

function closeAllTabs() {
  openTabs.length = 0;
  activeTab = tabs.activeTab.url;

  // Save the currently opened tabs so that they can be restored later.
  for each (var tab in tabs) {
    openTabs.push(tab.url);
  }
  
  // Close all tabs now and open about:newtab.
  for each (var tab in tabs) {
    if (tabs.length === 1) {
      tabs.open("about:newtab");
      tab.close();
      break;
    }
    tab.close();
  }
}

exports.main = function() {
  
  var hotkeyCombo = Hotkey({
    combo: "control-alt-p",
    onPress: function() {
      toggleMode();
    }
  });

  var widget = widgets.Widget({
    id: "mode-status",
    label: "Presentation Mode",
    contentURL: data.url("mode-off.png"),
    contentScriptWhen: "ready",
    contentScriptFile: data.url("widget.js")
  });

  var toggleMode = function() {
    var urlbarAutoComplete = "browser.urlbar.autocomplete.enabled";
    var searchSuggest =  "browser.search.suggest.enabled";
    var newTabPage = "browser.newtabpage.enabled";
    if (!mode) {
      mode = true;
      widget.contentURL = data.url("mode-on.png");

      prefs.set(searchSuggest, false);
      prefs.set(urlbarAutoComplete, false);
      prefs.set(newTabPage, false);

      closeAllTabs();
      toggleBookmarkAndSearch("enabled");
      clearDownloadsList();
    }
    else {
      mode = false;
      widget.contentURL = data.url("mode-off.png");

      prefs.reset(searchSuggest, true);
      prefs.reset(urlbarAutoComplete, true);
      prefs.reset(newTabPage, true);

      restoreAllTabs();
      toggleBookmarkAndSearch();
    }
  };

  widget.port.on("activate", function() {
    toggleMode();
  });

}
