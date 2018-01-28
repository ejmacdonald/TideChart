$(document).ready(function() {  


// Initialize Firebase
  var config = {
    apiKey: "AIzaSyAtkV0dpg8VxwnD_rJVqpfndFiCBm-8Xgw",
    authDomain: "tideviewer-be21f.firebaseapp.com",
    databaseURL: "https://tideviewer-be21f.firebaseio.com",
    projectId: "tideviewer-be21f",
    storageBucket: "tideviewer-be21f.appspot.com",
    messagingSenderId: "71635122704"
  };

  firebase.initializeApp(config);

// Get a reference to the database service
  var database = firebase.database();

// Create an initial toDoCount variable
  var locationArray = [];
  var cityArray = [];
  var stateArray = [];
  var locationCount = 0;

  // googlemaps apiikey: AIzaSyC9ze5ybVejEVU8WbQcqg4Ht12b4mIjsSA

  var input = document.getElementById("location");
  var autoLocation = new google.maps.places.Autocomplete(input);

  $("#time").text(moment().format("h:mm a"));


//  On Click event associated with the add-to-do function
  $("#add-location").on("click", function(event) {
    event.preventDefault();
    console.log("clicked Add");


// Get the to-do "value" from the textbox and store it a variable
    var rawLocation = $("#location").val().trim();

//convert "city, state, country" into an array
    locationArray = rawLocation.split(",");
    $("#location").val("");

//check to see if the city is outside the USA, if so, get the tide data for the location
    if (locationArray[2].trim() == "United States") {
      var queryURL = "http://api.wunderground.com/api/11055da2d2b90f72/tide/q/" + locationArray[1] + "/" + locationArray[0] + ".json";
      var hitideFound = 0;
      var lotideFound = 0;
      var hiloTimesPretty = [];
      var nextTide;
      var nextTideTimePretty;

      $.ajax ({
        url: queryURL,
        method: "GET"
        }).done(function(response){

// check object, if there's nothing here, then there's no tide information for that city
      if (!response.tide.tideSummary[0]) {
        alert ("Sorry, can't find tide information for " + locationArray[0]);
        return;
      }
      else {
        
//increment through the summary until you find EITHER a high or low tide
        for (i=0; (hitideFound == 0) || (lotideFound == 0); i++) {
          if ((response.tide.tideSummary[i].data.type == "High Tide") && hitideFound == 0) {
            hitideFound = 1;
            hiloTimesPretty[0] = response.tide.tideSummary[i].date;
          }
          else if ((response.tide.tideSummary[i].data.type == "Low Tide") && lotideFound == 0) {
            lotideFound = 1;
            hiloTimesPretty[1] = response.tide.tideSummary[i].date;
          }
        }
      }

      if (hiloTimesPretty[0].epoch < hiloTimesPretty[1].epoch) {
        nextTide = "High";
        nextTideTimePretty = hiloTimesPretty[0];
      } 
      else {
        nextTide = "Low";
        nextTideTimePretty = hiloTimesPretty[1];
      }

// store city, state, and tides
      database.ref().push({
        City: locationArray[0].trim(),
        State: locationArray[1].trim(),
        Next_Tide: nextTide,
        Next_Tide_Time_Pretty: nextTideTimePretty,
      }); 
      });
    }
 
//this is in case the city requested is outside the US
    else {
      alert ("Sorry, you can only search locations within the USA");

// Clear the textbox when done
    $("#location").val("");
    return;
  }
});

//whenever the database changes, pull cities from memory
  database.ref().on("child_added", function(childSnapshot){  
    var displayCity = childSnapshot.val().City;
    var displayState = childSnapshot.val().State;
    var displayNextTide = childSnapshot.val().Next_Tide;
    var nextTideDay = childSnapshot.val().Next_Tide_Time_Pretty.mday;
    var nextTimeEpoch = childSnapshot.val().Next_Tide_Time_Pretty.epoch;
    var timeNext = childSnapshot.val().Next_Tide_Time_Pretty.pretty;
    var timeArray = timeNext.split(" ");
    var tideTimeShort = moment(timeNext);
    var dayDisplay;


// if the next tide is today, store "today", otherwise, store "tomorrow"
    if (nextTideDay == moment().format("D")) {
      dayDisplay = "Today";
    } else {
      dayDisplay = "Tomorrow";
    }  

//convert NextTimeEpoch into a simpler format w/ just hours min, and seconds
    var tempTime = moment.unix(nextTimeEpoch).format('h:mm:ss A')
    var timeUntilNext = moment(tempTime, "h:mm:ss A").fromNow();


//build items to display in the row

    var button = $("<button>");

    var rowContent = "<tr><td><button type='button' class='btn btn-success update'>Update</button></td><td> " + displayCity + "</td> <td> " + displayState + 
    "</td> <td> " + displayNextTide + " </td><td> "+ dayDisplay + "  " + timeArray[0] + " " + timeArray[1] + " " + timeArray[2] + "</td> <td>" + timeUntilNext + "</td> </tr>";



    $("tbody").append(rowContent);
 
    });

  });






      