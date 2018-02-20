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

var input = document.getElementById("location");
var autoLocation = new google.maps.places.Autocomplete(input);

//  On Click event associated with the add-to-do function
$("#add-location").on("click", function(event) {
    event.preventDefault();

// Get the to-do "value" from the textbox and store it a variable
    var rawLocation = $("#location").val().trim();

//convert "city, state, country" into an array
    locationArray = rawLocation.split(",");
    console.log("location: " + locationArray);

    $("#location").val("");


    if (typeof(locationArray[2]) == "undefined") {
        locationArray[2] = "not USA"
    }

// check to see if the city is outside the USA, if so, get the tide data for the location

    if (locationArray[2].trim() == "USA") {
        console.log ("we're in the US, location is" + locationArray[0]);
        var queryURL = "https://api.wunderground.com/api/11055da2d2b90f72/tide/q/" + locationArray[1] + "/" + locationArray[0] + ".json";
        console.log("original url: " + queryURL);
        var hitideFound = 0;
        var lotideFound = 0;
        var hiloTimesPretty = [];
        var nextTide;
        var nextTideTimePretty;

        $.ajax ({
          url: queryURL,
          method: "GET"
          }).done(function(response){

            console.log(response);

// check object, if there's nothing here, then there's no tide information for that city
              if (!response.tide.tideSummary[0]) {
                  alert ("Sorry, can't find any tide information for " + locationArray[0]);
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
                  SearchString: queryURL
              }); 
          });
      }

//this is in case the city requested is outside the US
      else {
          alert ("Sorry, you can only search locations within the USA");
      }

// Clear the textbox when done
      $("#location").val("");
         return;
  });


// when a delete button is clicked, either update or delete the entry
$(document).on("click", ".btn", function(event)  {
    event.preventDefault();
    var button_index = $(this).attr("id");
    var button_text = $(this).text();

    if (button_text == "Delete") {
        console.log("delete button");
        $("#row" + button_index).remove();
        console.log("removing tags: #row" + button_index);
        database.ref(button_index+"/").remove();
    }
 
    else {

        console.log("create new URL request");
        database.ref("/" + button_index).on("value", function(snapshot) {
          var displayCity = snapshot.val().City;
          var displayState = snapshot.val().State;
          var refreshURL = snapshot.val().SearchString;
          console.log("new URL: " + refreshURL);
          var newhitideFound = 0;
          var newlotideFound = 0;
          var newhiloTimesPretty = [];
          var newnextTide;
          var newnextTideTimePretty;
       
        $.ajax ({
            url: refreshURL,
            method: "GET"
            }).done(function(response){

              console.log(response);
              

//increment through the summary until you find EITHER a high or low tide
                for (i=0; (newhitideFound == 0) || (newlotideFound == 0); i++) {
                    if ((response.tide.tideSummary[i].data.type == "High Tide") && newhitideFound == 0) {
                        newhitideFound = 1;
                        newhiloTimesPretty[0] = response.tide.tideSummary[i].date;
                    }
                    else if ((response.tide.tideSummary[i].data.type == "Low Tide") && newlotideFound == 0) {
                        newlotideFound = 1;
                        newhiloTimesPretty[1] = response.tide.tideSummary[i].date;
                    }
                }


                if (newhiloTimesPretty[0].epoch < newhiloTimesPretty[1].epoch) {
                    newnextTide = "High";
                    newnextTideTimePretty = newhiloTimesPretty[0];
                } 
                else {
                    newnextTide = "Low";
                    newnextTideTimePretty = newhiloTimesPretty[1];
                }
    
                database.ref("/" + button_index).set({
                  City: displayCity,
                  State: displayState,
                  Next_Tide: newnextTide,
                  Next_Tide_Time_Pretty: newnextTideTimePretty,
                  SearchString: refreshURL
                }); 
            });
          });
        }
      });


//whenever the database changes, pull cities from memory
  database.ref().on("child_added", function(childSnapshot){  
    var key = childSnapshot.key;
    var displayCity = childSnapshot.val().City;
    var displayState = childSnapshot.val().State;
    var displayNextTide = childSnapshot.val().Next_Tide;
    var nextTideDay = childSnapshot.val().Next_Tide_Time_Pretty.mday.replace(/^0+/, '');
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
    var tempTime = moment.unix(nextTimeEpoch).format('LLL');
    console.log ("tempTime: " + tempTime);
    var timeUntilNext = moment(tempTime, "LLL").fromNow();
   
// build table
    var row = $("<tr>");  
    var cell_1 = $("<td>");
    var cell_2 = $("<td>");
    var cell_3 = $("<td>");
    var cell_4 = $("<td>");
    var cell_5 = $("<td>");
    var cell_6 = $("<td>");
    var toggle_button = $("<button>");


    row.attr("id", "row" + key);
    toggle_button.attr("id", key);
    toggle_button.addClass("btn btn_rmv btn-danger");
    toggle_button.text("Delete");
    cell_1.append(toggle_button);

    cell_2.append(displayCity);
    cell_3.append(displayState);
   
    cell_4.attr("id", "displ_next_tide-" + key);
    cell_5.attr("id", "next_tide-" + key);
    cell_6.attr("id", "time_until-"+ key);
   // cell_6.append(timeUntilNext);

    row.append(cell_1);
    row.append(cell_2);
    row.append(cell_3);
    row.append(cell_4);
    row.append(cell_5);
    row.append(cell_6);

    $("tbody").append(row);
 
  });

  setInterval(function(){
      updateDisplay();
      }, 1000);


  function updateDisplay() {
    $("#time").text(moment().format("h:mm:ss a"));

  // database.ref().on("value", function(childSnapshot) {
      database.ref().on("child_added", function(childSnapshot){  
          var key = childSnapshot.key;
          var nextTimePretty = childSnapshot.val().Next_Tide_Time_Pretty.pretty;
          var nextTimeEpoch = childSnapshot.val().Next_Tide_Time_Pretty.epoch;

          var displayNextTide = childSnapshot.val().Next_Tide;
          var nextTideDay = childSnapshot.val().Next_Tide_Time_Pretty.mday.replace(/^0+/, '');
       //   var nextTimeEpoch = childSnapshot.val().Next_Tide_Time_Pretty.epoch;
       //   var timeNext = childSnapshot.val().Next_Tide_Time_Pretty.pretty;
          var timeArray = nextTimePretty.split(" ");
          var tideTimeShort = moment(nextTimePretty);
          var dayDisplay;

  //convert NextTimeEpoch into a simpler format w/ just hours min, and seconds
          var tempTime = moment.unix(nextTimeEpoch).format('LLL')
          var timeUntilNext = moment(tempTime, "LLL").fromNow();

  // if the next tide is today, store "today", otherwise, store "tomorrow"
          if (nextTideDay == moment().format("D")) {
            dayDisplay = "Today";
          } else {
            dayDisplay = "Tomorrow";
          } 

          $("#time_until-" + key).empty();
          $("#time_until-" + key).append(timeUntilNext);

          var newCell = dayDisplay + " " + timeArray[0] + " " + timeArray[1] + " " + timeArray[2];
          $("#next_tide-" + key).empty();
          $("#next_tide-" + key).append(newCell);

          $("#displ_next_tide-" + key).empty();
          $("#displ_next_tide-" + key).append(displayNextTide);

 

          var untilString = timeUntilNext.split(" ");
   

          if (untilString[0] != "in") {
              $("#"+key).text("Refresh");
              $("#"+key).attr("class", "btn btn_rmv btn-success");
          }
          else {
              $("#"+key).text("Delete");
              $("#"+key).attr("class", "btn btn_rmv btn-danger");
          }
      });
    }
    
  });







      
